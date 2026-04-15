using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RescueHub.BuildingBlocks.Api;
using RescueHub.Modules.Incidents.Application;

namespace RescueHub.Modules.Incidents.Api;

[Route("api/v1/team")]
[Authorize]
public sealed class TeamController(IIncidentService service) : BaseApiController
{
    /// <summary>
    /// Team dashboard summary.
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<object>>> GetDashboard()
        => OkResponse<object>(await service.GetTeamDashboard(), "Lay dashboard team thanh cong");

    /// <summary>
    /// Danh sach nhiem vu cua team.
    /// </summary>
    [HttpGet("missions")]
    public async Task<ActionResult<ApiResponse<object>>> GetMissions()
        => OkResponse<object>(await service.GetTeamMissions(), "Lay danh sach nhiem vu team thanh cong");

    /// <summary>
    /// Chi tiet nhiem vu team.
    /// </summary>
    [HttpGet("missions/{missionId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetMissionDetail([FromRoute] Guid missionId)
    {
        try
        {
            return OkResponse<object>(await service.GetTeamMissionDetail(missionId), "Lay chi tiet nhiem vu thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Team accept/reject mission.
    /// </summary>
    [HttpPost("missions/{missionId:guid}/respond")]
    public async Task<ActionResult<ApiResponse<object>>> RespondMission([FromRoute] Guid missionId, [FromBody] TeamRespondMissionRequest request)
    {
        try
        {
            return OkResponse<object>(await service.TeamRespondMission(missionId, request), "Phan hoi nhiem vu thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Team cap nhat trang thai nhiem vu.
    /// </summary>
    [HttpPost("missions/{missionId:guid}/status")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateMissionStatus([FromRoute] Guid missionId, [FromBody] TeamMissionStatusRequest request)
    {
        try
        {
            return OkResponse<object>(await service.TeamUpdateMissionStatus(missionId, request), "Cap nhat trang thai nhiem vu thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Team gui bao cao hien truong.
    /// </summary>
    [HttpPost("missions/{missionId:guid}/field-reports")]
    public async Task<ActionResult<ApiResponse<object>>> CreateFieldReport([FromRoute] Guid missionId, [FromBody] TeamFieldReportRequest request)
    {
        try
        {
            return OkResponse<object>(await service.TeamCreateFieldReport(missionId, request), "Gui bao cao hien truong thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Team tao yeu cau huy nhiem vu.
    /// </summary>
    [HttpPost("missions/{missionId:guid}/abort-requests")]
    public async Task<ActionResult<ApiResponse<object>>> CreateAbortRequest([FromRoute] Guid missionId, [FromBody] TeamAbortRequest request)
    {
        try
        {
            return OkResponse<object>(await service.TeamCreateAbortRequest(missionId, request), "Tao yeu cau huy nhiem vu thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Team tao yeu cau chi vien ho tro.
    /// </summary>
    [HttpPost("missions/{missionId:guid}/support-requests")]
    public async Task<ActionResult<ApiResponse<object>>> CreateSupportRequest([FromRoute] Guid missionId, [FromBody] TeamSupportRequest request)
    {
        try
        {
            return OkResponse<object>(await service.TeamCreateSupportRequest(missionId, request), "Tao yeu cau chi vien thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }
}
