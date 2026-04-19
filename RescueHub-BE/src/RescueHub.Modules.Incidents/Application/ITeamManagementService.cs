namespace RescueHub.Modules.Incidents.Application;

public interface ITeamManagementService
{
    Task<object> GetStatusOptions();

    Task<object> ListTeams(string? keyword, string? statusCode);

    Task<object> GetTeam(Guid teamId);

    Task<object> CreateTeam(CreateTeamRequest request);

    Task<object> UpdateTeam(Guid teamId, UpdateTeamRequest request);

    Task<object> DeleteTeam(Guid teamId);

    Task<object> ListTeamMembers(Guid teamId, string? statusCode);

    Task<object> GetTeamMember(Guid teamId, Guid memberId);

    Task<object> CreateTeamMember(Guid teamId, CreateTeamMemberRequest request);

    Task<object> UpdateTeamMember(Guid teamId, Guid memberId, UpdateTeamMemberRequest request);

    Task<object> DeleteTeamMember(Guid teamId, Guid memberId);

    Task<object> ListSkills(string? keyword);

    Task<object> GetSkill(Guid skillId);

    Task<object> CreateSkill(CreateSkillRequest request);

    Task<object> UpdateSkill(Guid skillId, UpdateSkillRequest request);

    Task<object> DeleteSkill(Guid skillId);

    Task<object> ListTeamMemberSkills(Guid teamId, Guid memberId);

    Task<object> CreateTeamMemberSkill(Guid teamId, Guid memberId, CreateTeamMemberSkillRequest request);

    Task<object> UpdateTeamMemberSkill(Guid teamId, Guid memberId, Guid teamMemberSkillId, UpdateTeamMemberSkillRequest request);

    Task<object> DeleteTeamMemberSkill(Guid teamId, Guid memberId, Guid teamMemberSkillId);

    Task<object> ListVehicles(string? keyword, string? statusCode, Guid? teamId);

    Task<object> GetVehicle(Guid vehicleId);

    Task<object> CreateVehicle(CreateVehicleRequest request);

    Task<object> UpdateVehicle(Guid vehicleId, UpdateVehicleRequest request);

    Task<object> DeleteVehicle(Guid vehicleId);
}
