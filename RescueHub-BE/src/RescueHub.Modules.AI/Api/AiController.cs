using Microsoft.AspNetCore.Mvc;
using RescueHub.BuildingBlocks.Api;
using RescueHub.Modules.AI.Application;

namespace RescueHub.Modules.AI.Api;

[Route("api/v1/ai")]
public sealed class AiController(IAiService aiService) : BaseApiController
{
    [HttpPost("jobs/incident-triage")]
    public ActionResult<ApiResponse<object>> CreateIncidentTriageJob([FromBody] CreateAiJobRequest request)
        => OkResponse<object>(aiService.CreateIncidentTriageJob(request.IncidentId), "Tao AI job thanh cong");

    [HttpGet("jobs/{jobId:guid}")]
    public ActionResult<ApiResponse<object>> GetJob([FromRoute] Guid jobId)
        => OkResponse<object>(aiService.GetJob(jobId), "Lay AI job thanh cong");

    public sealed record CreateAiJobRequest(Guid IncidentId, string JobTypeCode);
}
