namespace RescueHub.Modules.AI.Application;

using RescueHub.Modules.AI.Infrastructure;

public sealed class AiService(IAiRepository repository) : IAiService
{
    public Task<object> AnalyzeIncident(AnalyzeIncidentRequest request, Guid? requestedByUserId, CancellationToken cancellationToken)
        => repository.AnalyzeIncident(
            request.IncidentId,
            request.IncludeDispatchRecommendation,
            request.IncludeDedupe,
            requestedByUserId,
            cancellationToken);

    public Task<object> AnalyzeReliefCampaign(AnalyzeReliefCampaignRequest request, Guid? requestedByUserId, CancellationToken cancellationToken)
        => repository.AnalyzeReliefCampaign(request.ReliefCampaignId, requestedByUserId, cancellationToken);

    public Task<object> ListSuggestions(ListAiSuggestionsQuery query, CancellationToken cancellationToken)
        => repository.ListSuggestions(query.TargetEntityType, query.TargetEntityId, query.ApprovalStatusCode, query.Page, query.PageSize, cancellationToken);

    public Task<object> ApproveSuggestion(Guid suggestionId, Guid? approvedByUserId, CancellationToken cancellationToken)
        => repository.ApproveSuggestion(suggestionId, approvedByUserId, cancellationToken);

    public Task<object> IgnoreSuggestion(Guid suggestionId, Guid? ignoredByUserId, CancellationToken cancellationToken)
        => repository.IgnoreSuggestion(suggestionId, ignoredByUserId, cancellationToken);
}
