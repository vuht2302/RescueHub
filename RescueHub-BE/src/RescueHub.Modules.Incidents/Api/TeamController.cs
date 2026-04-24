using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
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
    /// Danh sach actionCode chuan cho mission status update.
    /// </summary>
    [HttpGet("missions/action-codes")]
    public async Task<ActionResult<ApiResponse<object>>> GetMissionActionCodes()
        => OkResponse<object>(await service.GetMissionActionCodes(), "Lay danh sach actionCode mission thanh cong");

    /// <summary>
    /// Danh sach thanh vien cua doi dang dang nhap (team leader).
    /// </summary>
    [HttpGet("my-members")]
    public async Task<ActionResult<ApiResponse<object>>> GetMyMembers()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (!Guid.TryParse(userIdValue, out var leaderUserId))
        {
            return BadRequestResponse<object>("Khong xac dinh duoc user dang nhap.");
        }

        try
        {
            return OkResponse<object>(await service.GetMyTeamMembers(leaderUserId), "Lay danh sach thanh vien doi thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

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

    /// <summary>
    /// Team cap nhat trang thai phan phoi cuu tro.
    /// </summary>
    [HttpPost("distributions/{distributionId:guid}/status")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateReliefDistributionStatus([FromRoute] Guid distributionId, [FromBody] TeamReliefStatusRequest request)
    {
        try
        {
            return OkResponse<object>(
                await service.TeamUpdateReliefDistributionStatus(distributionId, request),
                "Cap nhat trang thai phan phoi cuu tro thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Team leader xem lich su cuu tro cua doi minh.
    /// </summary>
    [HttpGet("distributions/history")]
    public async Task<ActionResult<ApiResponse<object>>> GetMyReliefHistory(
        [FromQuery] Guid? teamId,
        [FromQuery] string? statusCode,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (!Guid.TryParse(userIdValue, out var leaderUserId))
        {
            return BadRequestResponse<object>("Khong xac dinh duoc user dang nhap.");
        }

        try
        {
            return OkResponse<object>(
                await service.GetMyReliefHistory(leaderUserId, teamId, statusCode, page, pageSize),
                "Lay lich su cuu tro thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Team leader cap nhat trang thai doi cua minh.
    /// </summary>
    [HttpPost("status")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateMyTeamStatus([FromBody] TeamSelfStatusRequest request)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (!Guid.TryParse(userIdValue, out var leaderUserId))
        {
            return BadRequestResponse<object>("Khong xac dinh duoc user dang nhap.");
        }

        try
        {
            return OkResponse<object>(
                await service.TeamUpdateMyStatus(leaderUserId, request),
                "Cap nhat trang thai team thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }
}
