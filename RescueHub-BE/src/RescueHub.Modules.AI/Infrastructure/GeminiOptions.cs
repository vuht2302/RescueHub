namespace RescueHub.Modules.AI.Infrastructure;

public sealed class GeminiOptions
{
    public string ApiKey { get; init; } = string.Empty;

    public string Model { get; init; } = "gemini-1.5-flash";

    public string BaseUrl { get; init; } = "https://generativelanguage.googleapis.com/v1beta";

    public int TimeoutSeconds { get; init; } = 30;
}
