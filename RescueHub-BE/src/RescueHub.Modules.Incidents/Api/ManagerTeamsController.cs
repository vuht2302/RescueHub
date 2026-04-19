using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RescueHub.BuildingBlocks.Api;
using RescueHub.Modules.Incidents.Application;

namespace RescueHub.Modules.Incidents.Api;

/// <summary>
/// API quan ly doi cuu ho, thanh vien va ky nang cho vai tro manager.
/// </summary>
[Route("api/v1/manager")]
[Authorize]
public sealed class ManagerTeamsController(ITeamManagementService service) : BaseApiController
{
    /// <summary>
    /// Lay danh sach trang thai team/member duoc ho tro.
    /// </summary>
    [HttpGet("team-management/status-options")]
    public async Task<ActionResult<ApiResponse<object>>> GetStatusOptions()
        => OkResponse<object>(await service.GetStatusOptions(), "Lay status options thanh cong");

    /// <summary>
    /// Lay danh sach team theo bo loc.
    /// </summary>
    [HttpGet("teams")]
    public async Task<ActionResult<ApiResponse<object>>> ListTeams([FromQuery] string? keyword, [FromQuery] string? statusCode)
        => OkResponse<object>(await service.ListTeams(keyword, statusCode), "Lay danh sach team thanh cong");

    /// <summary>
    /// Lay chi tiet team.
    /// </summary>
    [HttpGet("teams/{teamId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetTeam([FromRoute] Guid teamId)
    {
        try
        {
            return OkResponse<object>(await service.GetTeam(teamId), "Lay chi tiet team thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Tao team moi.
    /// </summary>
    [HttpPost("teams")]
    public async Task<ActionResult<ApiResponse<object>>> CreateTeam([FromBody] CreateTeamRequest request)
    {
        try
        {
            return OkResponse<object>(await service.CreateTeam(request), "Tao team thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Cap nhat thong tin team.
    /// </summary>
    [HttpPut("teams/{teamId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateTeam([FromRoute] Guid teamId, [FromBody] UpdateTeamRequest request)
    {
        try
        {
            return OkResponse<object>(await service.UpdateTeam(teamId, request), "Cap nhat team thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Xoa team.
    /// </summary>
    [HttpDelete("teams/{teamId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteTeam([FromRoute] Guid teamId)
    {
        try
        {
            return OkResponse<object>(await service.DeleteTeam(teamId), "Xoa team thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay danh sach thanh vien cua team.
    /// </summary>
    [HttpGet("teams/{teamId:guid}/members")]
    public async Task<ActionResult<ApiResponse<object>>> ListTeamMembers([FromRoute] Guid teamId, [FromQuery] string? statusCode)
    {
        try
        {
            return OkResponse<object>(await service.ListTeamMembers(teamId, statusCode), "Lay danh sach team member thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay chi tiet mot team member.
    /// </summary>
    [HttpGet("teams/{teamId:guid}/members/{memberId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetTeamMember([FromRoute] Guid teamId, [FromRoute] Guid memberId)
    {
        try
        {
            return OkResponse<object>(await service.GetTeamMember(teamId, memberId), "Lay chi tiet team member thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Tao team member moi cho team.
    /// </summary>
    [HttpPost("teams/{teamId:guid}/members")]
    public async Task<ActionResult<ApiResponse<object>>> CreateTeamMember([FromRoute] Guid teamId, [FromBody] CreateTeamMemberRequest request)
    {
        try
        {
            return OkResponse<object>(await service.CreateTeamMember(teamId, request), "Tao team member thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Cap nhat thong tin team member.
    /// </summary>
    [HttpPut("teams/{teamId:guid}/members/{memberId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateTeamMember([FromRoute] Guid teamId, [FromRoute] Guid memberId, [FromBody] UpdateTeamMemberRequest request)
    {
        try
        {
            return OkResponse<object>(await service.UpdateTeamMember(teamId, memberId, request), "Cap nhat team member thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Xoa team member khoi team.
    /// </summary>
    [HttpDelete("teams/{teamId:guid}/members/{memberId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteTeamMember([FromRoute] Guid teamId, [FromRoute] Guid memberId)
    {
        try
        {
            return OkResponse<object>(await service.DeleteTeamMember(teamId, memberId), "Xoa team member thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay danh sach ky nang.
    /// </summary>
    [HttpGet("skills")]
    public async Task<ActionResult<ApiResponse<object>>> ListSkills([FromQuery] string? keyword)
        => OkResponse<object>(await service.ListSkills(keyword), "Lay danh sach skill thanh cong");

    /// <summary>
    /// Lay chi tiet ky nang.
    /// </summary>
    [HttpGet("skills/{skillId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetSkill([FromRoute] Guid skillId)
    {
        try
        {
            return OkResponse<object>(await service.GetSkill(skillId), "Lay chi tiet skill thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Tao ky nang moi.
    /// </summary>
    [HttpPost("skills")]
    public async Task<ActionResult<ApiResponse<object>>> CreateSkill([FromBody] CreateSkillRequest request)
    {
        try
        {
            return OkResponse<object>(await service.CreateSkill(request), "Tao skill thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Cap nhat ky nang.
    /// </summary>
    [HttpPut("skills/{skillId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateSkill([FromRoute] Guid skillId, [FromBody] UpdateSkillRequest request)
    {
        try
        {
            return OkResponse<object>(await service.UpdateSkill(skillId, request), "Cap nhat skill thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Xoa ky nang.
    /// </summary>
    [HttpDelete("skills/{skillId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteSkill([FromRoute] Guid skillId)
    {
        try
        {
            return OkResponse<object>(await service.DeleteSkill(skillId), "Xoa skill thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay danh sach ky nang cua team member.
    /// </summary>
    [HttpGet("teams/{teamId:guid}/members/{memberId:guid}/skills")]
    public async Task<ActionResult<ApiResponse<object>>> ListTeamMemberSkills([FromRoute] Guid teamId, [FromRoute] Guid memberId)
    {
        try
        {
            return OkResponse<object>(await service.ListTeamMemberSkills(teamId, memberId), "Lay danh sach team member skills thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Them ky nang cho team member.
    /// </summary>
    [HttpPost("teams/{teamId:guid}/members/{memberId:guid}/skills")]
    public async Task<ActionResult<ApiResponse<object>>> CreateTeamMemberSkill([FromRoute] Guid teamId, [FromRoute] Guid memberId, [FromBody] CreateTeamMemberSkillRequest request)
    {
        try
        {
            return OkResponse<object>(await service.CreateTeamMemberSkill(teamId, memberId, request), "Them skill cho team member thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Cap nhat ky nang cua team member.
    /// </summary>
    [HttpPut("teams/{teamId:guid}/members/{memberId:guid}/skills/{teamMemberSkillId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateTeamMemberSkill([FromRoute] Guid teamId, [FromRoute] Guid memberId, [FromRoute] Guid teamMemberSkillId, [FromBody] UpdateTeamMemberSkillRequest request)
    {
        try
        {
            return OkResponse<object>(await service.UpdateTeamMemberSkill(teamId, memberId, teamMemberSkillId, request), "Cap nhat team member skill thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Xoa ky nang cua team member.
    /// </summary>
    [HttpDelete("teams/{teamId:guid}/members/{memberId:guid}/skills/{teamMemberSkillId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteTeamMemberSkill([FromRoute] Guid teamId, [FromRoute] Guid memberId, [FromRoute] Guid teamMemberSkillId)
    {
        try
        {
            return OkResponse<object>(await service.DeleteTeamMemberSkill(teamId, memberId, teamMemberSkillId), "Xoa team member skill thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }
}
