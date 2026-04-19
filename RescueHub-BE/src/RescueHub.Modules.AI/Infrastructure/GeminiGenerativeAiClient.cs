using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace RescueHub.Modules.AI.Infrastructure;

public sealed class GeminiGenerativeAiClient(HttpClient httpClient, IOptions<GeminiOptions> options) : IGenerativeAiClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<IncidentTriageAiResult> GenerateIncidentTriageAsync(IncidentTriageAiInput input, CancellationToken cancellationToken)
    {
        const string schema = """
        {
          "summary": "string",
          "priorityCode": "LOW|MEDIUM|HIGH|CRITICAL",
          "confidence": 0.0
        }
        """;

        var prompt = $"""
        You are an emergency flood-response AI.
        Analyze this incident and return STRICT JSON only with schema:
        {schema}

        Rules:
        - summary in Vietnamese, max 280 chars.
        - priorityCode must be one of LOW, MEDIUM, HIGH, CRITICAL.
        - confidence is between 0 and 1.

        Incident:
        - code: {input.IncidentCode}
        - description: {input.Description}
        - estimatedVictimCount: {input.EstimatedVictimCount}
        - estimatedInjuredCount: {input.EstimatedInjuredCount}
        - estimatedVulnerableCount: {input.EstimatedVulnerableCount}
        - floodDepthMeters: {input.FloodDepthMeters}
        - isSos: {input.IsSos}
        """;

        var json = await GenerateJsonAsync(prompt, cancellationToken);
        var result = JsonSerializer.Deserialize<IncidentTriageAiResponse>(json, JsonOptions)
            ?? throw new InvalidOperationException("Gemini tra ve du lieu triage khong hop le.");

        var normalizedPriority = NormalizePriority(result.PriorityCode);
        var normalizedConfidence = decimal.Clamp(result.Confidence, 0m, 1m);
        if (string.IsNullOrWhiteSpace(result.Summary))
        {
            throw new InvalidOperationException("Gemini khong tra ve summary hop le.");
        }

        return new IncidentTriageAiResult(result.Summary.Trim(), normalizedPriority, normalizedConfidence);
    }

    public async Task<string> GenerateDispatchRecommendationNoteAsync(DispatchRecommendationAiInput input, CancellationToken cancellationToken)
    {
        var prompt = $"""
        You are an emergency dispatch assistant.
        Given incident and ranked teams/vehicles, write a concise Vietnamese recommendation note (max 320 chars).
        Return STRICT JSON only with one string field named recommendationNote.

        Incident code: {input.IncidentCode}
        Incident description: {input.IncidentDescription}
        Team ranking: {JsonSerializer.Serialize(input.TeamRanking, JsonOptions)}
        Vehicle ranking: {JsonSerializer.Serialize(input.VehicleRanking, JsonOptions)}
        """;

        var json = await GenerateJsonAsync(prompt, cancellationToken);
        var result = JsonSerializer.Deserialize<SingleNoteResponse>(json, JsonOptions)
            ?? throw new InvalidOperationException("Gemini tra ve du lieu dispatch note khong hop le.");

        return string.IsNullOrWhiteSpace(result.RecommendationNote)
            ? throw new InvalidOperationException("Gemini khong tra ve recommendation note hop le.")
            : result.RecommendationNote.Trim();
    }

    public async Task<string> GenerateDedupeNoteAsync(IncidentDedupeAiInput input, CancellationToken cancellationToken)
    {
        var prompt = $"""
        You are an incident deduplication assistant.
        Read the possible duplicates and write a concise Vietnamese note (max 260 chars) to help coordinator decide merge or keep separate.
        Return STRICT JSON only with one string field named recommendationNote.

        Incident code: {input.IncidentCode}
        Incident description: {input.IncidentDescription}
        Duplicate candidates: {JsonSerializer.Serialize(input.Duplicates, JsonOptions)}
        """;

        var json = await GenerateJsonAsync(prompt, cancellationToken);
        var result = JsonSerializer.Deserialize<SingleNoteResponse>(json, JsonOptions)
            ?? throw new InvalidOperationException("Gemini tra ve du lieu dedupe note khong hop le.");

        return string.IsNullOrWhiteSpace(result.RecommendationNote)
            ? throw new InvalidOperationException("Gemini khong tra ve dedupe note hop le.")
            : result.RecommendationNote.Trim();
    }

    public async Task<string> GenerateReliefForecastNoteAsync(ReliefForecastAiInput input, CancellationToken cancellationToken)
    {
        var prompt = $"""
        You are a flood relief planning assistant.
        Create a concise Vietnamese note (max 320 chars) for manager about risk, shortage and issue priority.
        Return STRICT JSON only with one string field named recommendationNote.

        Campaign code: {input.CampaignCode}
        Total households: {input.TotalHouseholds}
        Recommended issues: {JsonSerializer.Serialize(input.RecommendedIssues, JsonOptions)}
        """;

        var json = await GenerateJsonAsync(prompt, cancellationToken);
        var result = JsonSerializer.Deserialize<SingleNoteResponse>(json, JsonOptions)
            ?? throw new InvalidOperationException("Gemini tra ve du lieu forecast note khong hop le.");

        return string.IsNullOrWhiteSpace(result.RecommendationNote)
            ? throw new InvalidOperationException("Gemini khong tra ve forecast note hop le.")
            : result.RecommendationNote.Trim();
    }

    private async Task<string> GenerateJsonAsync(string prompt, CancellationToken cancellationToken)
    {
        var cfg = options.Value;
        var apiKey = ResolveApiKey(cfg.ApiKey);
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("AI Gemini ApiKey chua duoc cau hinh. Kiem tra AI:Gemini:ApiKey.");
        }

        if (string.IsNullOrWhiteSpace(cfg.Model))
        {
            throw new InvalidOperationException("AI Gemini Model chua duoc cau hinh. Kiem tra AI:Gemini:Model.");
        }

        var baseUrl = string.IsNullOrWhiteSpace(cfg.BaseUrl)
            ? "https://generativelanguage.googleapis.com/v1beta"
            : cfg.BaseUrl.TrimEnd('/');

        var requestUri = $"{baseUrl}/models/{cfg.Model}:generateContent?key={Uri.EscapeDataString(apiKey)}";

        var payload = new
        {
            contents = new[]
            {
                new
                {
                    role = "user",
                    parts = new[]
                    {
                        new { text = prompt }
                    }
                }
            },
            generationConfig = new
            {
                responseMimeType = "application/json",
                temperature = 0.2
            }
        };

        using var response = await httpClient.PostAsJsonAsync(requestUri, payload, JsonOptions, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Gemini request that bai ({(int)response.StatusCode}): {Truncate(responseBody, 400)}");
        }

        var parsed = JsonSerializer.Deserialize<GeminiGenerateContentResponse>(responseBody, JsonOptions)
            ?? throw new InvalidOperationException("Khong parse duoc Gemini response.");

        var text = parsed.Candidates?
            .FirstOrDefault()?
            .Content?
            .Parts?
            .FirstOrDefault()?
            .Text;

        if (string.IsNullOrWhiteSpace(text))
        {
            throw new InvalidOperationException("Gemini tra ve response rong.");
        }

        return StripMarkdownCodeFence(text);
    }

    private static string? ResolveApiKey(string? configuredApiKey)
    {
        if (!string.IsNullOrWhiteSpace(configuredApiKey))
        {
            return configuredApiKey.Trim();
        }

        var envApiKey = Environment.GetEnvironmentVariable("AI__Gemini__ApiKey")
            ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY")
            ?? Environment.GetEnvironmentVariable("GOOGLE_API_KEY");

        if (!string.IsNullOrWhiteSpace(envApiKey))
        {
            return envApiKey.Trim();
        }

        return TryReadApiKeyFromAppSettingsFiles();
    }

    private static string? TryReadApiKeyFromAppSettingsFiles()
    {
        var cwd = Directory.GetCurrentDirectory();
        var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");

        var candidates = new List<string>();
        if (!string.IsNullOrWhiteSpace(env))
        {
            candidates.Add(Path.Combine(cwd, $"appsettings.{env}.json"));
        }

        candidates.Add(Path.Combine(cwd, "appsettings.json"));

        foreach (var filePath in candidates)
        {
            try
            {
                if (!File.Exists(filePath))
                {
                    continue;
                }

                using var stream = File.OpenRead(filePath);
                using var document = JsonDocument.Parse(stream);
                if (!document.RootElement.TryGetProperty("AI", out var aiSection))
                {
                    continue;
                }

                if (!aiSection.TryGetProperty("Gemini", out var geminiSection))
                {
                    continue;
                }

                if (!geminiSection.TryGetProperty("ApiKey", out var apiKeyElement))
                {
                    continue;
                }

                var apiKey = apiKeyElement.GetString();
                if (!string.IsNullOrWhiteSpace(apiKey))
                {
                    return apiKey.Trim();
                }
            }
            catch
            {
                // Best-effort fallback only. Keep normal validation path above.
            }
        }

        return null;
    }

    private static string NormalizePriority(string value)
    {
        var normalized = value.Trim().ToUpperInvariant();
        return normalized is "LOW" or "MEDIUM" or "HIGH" or "CRITICAL"
            ? normalized
            : "MEDIUM";
    }

    private static string StripMarkdownCodeFence(string text)
    {
        var trimmed = text.Trim();
        if (!trimmed.StartsWith("```") || !trimmed.EndsWith("```"))
        {
            return trimmed;
        }

        var lines = trimmed.Split('\n');
        if (lines.Length <= 2)
        {
            return trimmed.Trim('`');
        }

        return string.Join('\n', lines.Skip(1).Take(lines.Length - 2)).Trim();
    }

    private static string Truncate(string value, int maxLength)
    {
        if (value.Length <= maxLength)
        {
            return value;
        }

        return value[..maxLength] + "...";
    }

    private sealed record IncidentTriageAiResponse(string Summary, string PriorityCode, decimal Confidence);

    private sealed record SingleNoteResponse(string RecommendationNote);

    private sealed record GeminiGenerateContentResponse(List<GeminiCandidate>? Candidates);

    private sealed record GeminiCandidate(GeminiContent? Content);

    private sealed record GeminiContent(List<GeminiPart>? Parts);

    private sealed record GeminiPart(string? Text);
}
