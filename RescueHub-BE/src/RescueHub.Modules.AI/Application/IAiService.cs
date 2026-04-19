namespace RescueHub.Modules.AI.Application;

public interface IAiService
{
    Task<object> AnalyzeIncident(AnalyzeIncidentRequest request, Guid? requestedByUserId, CancellationToken cancellationToken);

    Task<object> AnalyzeReliefCampaign(AnalyzeReliefCampaignRequest request, Guid? requestedByUserId, CancellationToken cancellationToken);

    Task<object> ListSuggestions(ListAiSuggestionsQuery query, CancellationToken cancellationToken);

    Task<object> ApproveSuggestion(Guid suggestionId, Guid? approvedByUserId, CancellationToken cancellationToken);

    Task<object> IgnoreSuggestion(Guid suggestionId, Guid? ignoredByUserId, CancellationToken cancellationToken);
}
