using Microsoft.AspNetCore.Mvc;
using RescueHub.BuildingBlocks.Api;
using RescueHub.Modules.Incidents.Application;

namespace RescueHub.Modules.Incidents.Api;

[Route("api/v1/incidents")]
public sealed class IncidentsController(IIncidentService service) : BaseApiController
{
    [HttpGet]
    public ActionResult<ApiResponse<object>> List()
        => OkResponse<object>(service.List(), "Lay danh sach su co thanh cong");

    [HttpGet("{incidentId:guid}")]
    public ActionResult<ApiResponse<object>> GetById([FromRoute] Guid incidentId)
        => OkResponse<object>(service.Get(incidentId), "Lay chi tiet su co thanh cong");

    [HttpPost("{incidentId:guid}/verify")]
    public ActionResult<ApiResponse<object>> Verify([FromRoute] Guid incidentId)
        => OkResponse<object>(service.Verify(incidentId), "Xac minh su co thanh cong");

    [HttpPost("{incidentId:guid}/assess")]
    public ActionResult<ApiResponse<object>> Assess([FromRoute] Guid incidentId)
        => OkResponse<object>(service.Assess(incidentId), "Danh gia su co thanh cong");
}
