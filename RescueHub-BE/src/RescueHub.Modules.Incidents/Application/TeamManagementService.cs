using RescueHub.Modules.Incidents.Infrastructure;

namespace RescueHub.Modules.Incidents.Application;

public sealed class TeamManagementService(ITeamManagementRepository repository) : ITeamManagementService
{
    public Task<object> GetStatusOptions() => repository.GetStatusOptions();

    public Task<object> ListTeams(string? keyword, string? statusCode)
        => repository.ListTeams(keyword, statusCode);

    public Task<object> GetTeam(Guid teamId)
        => repository.GetTeam(teamId);

    public Task<object> CreateTeam(CreateTeamRequest request)
        => repository.CreateTeam(request);

    public Task<object> UpdateTeam(Guid teamId, UpdateTeamRequest request)
        => repository.UpdateTeam(teamId, request);

    public Task<object> DeleteTeam(Guid teamId)
        => repository.DeleteTeam(teamId);

    public Task<object> ListTeamMembers(Guid teamId, string? statusCode)
        => repository.ListTeamMembers(teamId, statusCode);

    public Task<object> GetTeamMember(Guid teamId, Guid memberId)
        => repository.GetTeamMember(teamId, memberId);

    public Task<object> CreateTeamMember(Guid teamId, CreateTeamMemberRequest request)
        => repository.CreateTeamMember(teamId, request);

    public Task<object> UpdateTeamMember(Guid teamId, Guid memberId, UpdateTeamMemberRequest request)
        => repository.UpdateTeamMember(teamId, memberId, request);

    public Task<object> DeleteTeamMember(Guid teamId, Guid memberId)
        => repository.DeleteTeamMember(teamId, memberId);

    public Task<object> ListSkills(string? keyword)
        => repository.ListSkills(keyword);

    public Task<object> GetSkill(Guid skillId)
        => repository.GetSkill(skillId);

    public Task<object> CreateSkill(CreateSkillRequest request)
        => repository.CreateSkill(request);

    public Task<object> UpdateSkill(Guid skillId, UpdateSkillRequest request)
        => repository.UpdateSkill(skillId, request);

    public Task<object> DeleteSkill(Guid skillId)
        => repository.DeleteSkill(skillId);

    public Task<object> ListTeamMemberSkills(Guid teamId, Guid memberId)
        => repository.ListTeamMemberSkills(teamId, memberId);

    public Task<object> CreateTeamMemberSkill(Guid teamId, Guid memberId, CreateTeamMemberSkillRequest request)
        => repository.CreateTeamMemberSkill(teamId, memberId, request);

    public Task<object> UpdateTeamMemberSkill(Guid teamId, Guid memberId, Guid teamMemberSkillId, UpdateTeamMemberSkillRequest request)
        => repository.UpdateTeamMemberSkill(teamId, memberId, teamMemberSkillId, request);

    public Task<object> DeleteTeamMemberSkill(Guid teamId, Guid memberId, Guid teamMemberSkillId)
        => repository.DeleteTeamMemberSkill(teamId, memberId, teamMemberSkillId);

    public Task<object> ListVehicles(string? keyword, string? statusCode, Guid? teamId)
        => repository.ListVehicles(keyword, statusCode, teamId);

    public Task<object> GetVehicle(Guid vehicleId)
        => repository.GetVehicle(vehicleId);

    public Task<object> CreateVehicle(CreateVehicleRequest request)
        => repository.CreateVehicle(request);

    public Task<object> UpdateVehicle(Guid vehicleId, UpdateVehicleRequest request)
        => repository.UpdateVehicle(vehicleId, request);

    public Task<object> DeleteVehicle(Guid vehicleId)
        => repository.DeleteVehicle(vehicleId);
}
