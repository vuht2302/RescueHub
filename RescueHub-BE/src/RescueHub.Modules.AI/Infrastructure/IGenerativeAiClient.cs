namespace RescueHub.Modules.AI.Infrastructure;

public interface IGenerativeAiClient
{
    Task<IncidentTriageAiResult> GenerateIncidentTriageAsync(IncidentTriageAiInput input, CancellationToken cancellationToken);

    Task<string> GenerateDispatchRecommendationNoteAsync(DispatchRecommendationAiInput input, CancellationToken cancellationToken);

    Task<string> GenerateDedupeNoteAsync(IncidentDedupeAiInput input, CancellationToken cancellationToken);

    Task<string> GenerateReliefForecastNoteAsync(ReliefForecastAiInput input, CancellationToken cancellationToken);
}

public sealed record IncidentTriageAiInput(
    string IncidentCode,
    string Description,
    int EstimatedVictimCount,
    int EstimatedInjuredCount,
    int EstimatedVulnerableCount,
    decimal FloodDepthMeters,
    bool IsSos);

public sealed record IncidentTriageAiResult(string Summary, string PriorityCode, decimal Confidence);

public sealed record DispatchRecommendationAiInput(string IncidentCode, string IncidentDescription, object TeamRanking, object VehicleRanking);

public sealed record IncidentDedupeAiInput(string IncidentCode, string IncidentDescription, object Duplicates);

public sealed record ReliefForecastAiInput(string CampaignCode, int TotalHouseholds, object RecommendedIssues);
