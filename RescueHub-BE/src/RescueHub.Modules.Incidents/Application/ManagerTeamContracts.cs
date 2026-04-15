namespace RescueHub.Modules.Incidents.Application;

public sealed record GeoPointRequest(decimal Lat, decimal Lng);

public sealed record CreateTeamRequest(
    string Code,
    string Name,
    Guid? LeaderUserId,
    Guid? HomeAdminAreaId,
    string StatusCode,
    int? MaxParallelMissions,
    GeoPointRequest? CurrentLocation,
    string? Notes);

public sealed record UpdateTeamRequest(
    string Code,
    string Name,
    Guid? LeaderUserId,
    Guid? HomeAdminAreaId,
    string StatusCode,
    int? MaxParallelMissions,
    GeoPointRequest? CurrentLocation,
    string? Notes);

public sealed record CreateTeamMemberRequest(
    Guid? UserId,
    string FullName,
    string? Phone,
    string StatusCode,
    bool IsTeamLeader,
    GeoPointRequest? LastKnownLocation,
    string? Notes);

public sealed record UpdateTeamMemberRequest(
    Guid? UserId,
    string FullName,
    string? Phone,
    string StatusCode,
    bool IsTeamLeader,
    GeoPointRequest? LastKnownLocation,
    string? Notes);

public sealed record CreateSkillRequest(
    string Code,
    string Name,
    string? Description);

public sealed record UpdateSkillRequest(
    string Code,
    string Name,
    string? Description);

public sealed record CreateTeamMemberSkillRequest(
    Guid SkillId,
    string LevelCode,
    bool IsPrimary);

public sealed record UpdateTeamMemberSkillRequest(
    Guid SkillId,
    string LevelCode,
    bool IsPrimary);
