using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RescueHub.BuildingBlocks.Api;
using RescueHub.Modules.AI.Application;

namespace RescueHub.Modules.AI.Api;

/// <summary>
/// Cung cap API phan tich AI on-demand va duyet AI suggestions cho coordinator.
/// </summary>
[Route("api/v1/ai")]
[Authorize]
public sealed class AiController(IAiService aiService) : BaseApiController
{
    /// <summary>
    /// Phan tich AI on-demand cho incident, phuc vu man hinh coordinator.
    /// </summary>
    /// <param name="incidentId">Id incident can phan tich.</param>
    /// <param name="includeDispatchRecommendation">Co phan tich de xuat dieu phoi hay khong.</param>
    /// <param name="includeDedupe">Co phan tich trung lap hay khong.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Ket qua phan tich gom triage, dispatch va dedupe theo tuy chon.</returns>
    [HttpPost("incidents/{incidentId:guid}/analyze")]
    public async Task<ActionResult<ApiResponse<object>>> AnalyzeIncident(
        [FromRoute] Guid incidentId,
        [FromQuery] bool includeDispatchRecommendation = true,
        [FromQuery] bool includeDedupe = true,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return OkResponse<object>(
                await aiService.AnalyzeIncident(
                    new AnalyzeIncidentRequest(incidentId, includeDispatchRecommendation, includeDedupe),
                    GetCurrentUserId(),
                    cancellationToken),
                "Phan tich AI cho incident thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Phan tich AI on-demand cho campaign cuu tro.
    /// </summary>
    /// <param name="reliefCampaignId">Id campaign can phan tich du bao.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Ket qua du bao nhu cau cap phat va suggestions.</returns>
    [HttpPost("relief-campaigns/{reliefCampaignId:guid}/analyze")]
    public async Task<ActionResult<ApiResponse<object>>> AnalyzeReliefCampaign(
        [FromRoute] Guid reliefCampaignId,
        CancellationToken cancellationToken)
    {
        try
        {
            return OkResponse<object>(
                await aiService.AnalyzeReliefCampaign(
                    new AnalyzeReliefCampaignRequest(reliefCampaignId),
                    GetCurrentUserId(),
                    cancellationToken),
                "Phan tich AI cho campaign cuu tro thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay danh sach AI suggestions theo bo loc.
    /// </summary>
    /// <param name="targetEntityType">Loai entity dich (INCIDENT, RELIEF_CAMPAIGN...).</param>
    /// <param name="targetEntityId">Id entity dich can loc.</param>
    /// <param name="approvalStatusCode">Trang thai duyet suggestion (PENDING, APPROVED, IGNORED).</param>
    /// <param name="page">So trang.</param>
    /// <param name="pageSize">So phan tu moi trang.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Danh sach suggestions va thong tin phan trang.</returns>
    [HttpGet("suggestions")]
    public async Task<ActionResult<ApiResponse<object>>> ListSuggestions(
        [FromQuery] string? targetEntityType,
        [FromQuery] Guid? targetEntityId,
        [FromQuery] string? approvalStatusCode,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
        => OkResponse<object>(
            await aiService.ListSuggestions(
                new ListAiSuggestionsQuery(targetEntityType, targetEntityId, approvalStatusCode, page, pageSize),
                cancellationToken),
            "Lay danh sach AI suggestion thanh cong");

    /// <summary>
    /// Duyet mot AI suggestion de ap dung vao du lieu nghiep vu.
    /// </summary>
    /// <param name="suggestionId">Id suggestion can duyet.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Ket qua duyet suggestion.</returns>
    [HttpPost("suggestions/{suggestionId:guid}/approve")]
    public async Task<ActionResult<ApiResponse<object>>> ApproveSuggestion([FromRoute] Guid suggestionId, CancellationToken cancellationToken)
    {
        try
        {
            return OkResponse<object>(
                await aiService.ApproveSuggestion(suggestionId, GetCurrentUserId(), cancellationToken),
                "Duyet AI suggestion thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Bo qua mot AI suggestion.
    /// </summary>
    /// <param name="suggestionId">Id suggestion can bo qua.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Ket qua bo qua suggestion.</returns>
    [HttpPost("suggestions/{suggestionId:guid}/ignore")]
    public async Task<ActionResult<ApiResponse<object>>> IgnoreSuggestion([FromRoute] Guid suggestionId, CancellationToken cancellationToken)
    {
        try
        {
            return OkResponse<object>(
                await aiService.IgnoreSuggestion(suggestionId, GetCurrentUserId(), cancellationToken),
                "Bo qua AI suggestion thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    private Guid? GetCurrentUserId()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        return Guid.TryParse(userIdValue, out var userId) ? userId : null;
    }
}
