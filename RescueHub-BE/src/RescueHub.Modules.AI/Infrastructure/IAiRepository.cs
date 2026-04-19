namespace RescueHub.Modules.AI.Infrastructure;

public interface IAiRepository
{
    Task<object> AnalyzeIncident(Guid incidentId, bool includeDispatchRecommendation, bool includeDedupe, Guid? requestedByUserId, CancellationToken cancellationToken);

    Task<object> AnalyzeReliefCampaign(Guid reliefCampaignId, Guid? requestedByUserId, CancellationToken cancellationToken);

    Task<object> ListSuggestions(string? targetEntityTypeCode, Guid? targetEntityId, string? approvalStatusCode, int page, int pageSize, CancellationToken cancellationToken);

    Task<object> ApproveSuggestion(Guid suggestionId, Guid? approvedByUserId, CancellationToken cancellationToken);

    Task<object> IgnoreSuggestion(Guid suggestionId, Guid? ignoredByUserId, CancellationToken cancellationToken);
}