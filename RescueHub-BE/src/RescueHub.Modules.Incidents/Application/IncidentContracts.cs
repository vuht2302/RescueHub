namespace RescueHub.Modules.Incidents.Application;

public sealed record VerifyIncidentRequest(bool Verified, string? Note);

public sealed record AssessIncidentRequest(
    string PriorityCode,
    string SeverityCode,
    int? VictimCountEstimate,
    int? InjuredCountEstimate,
    int? VulnerableCountEstimate,
    bool RequiresMedicalSupport,
    bool RequiresEvacuation,
    string? Notes);

public sealed record SceneObservationRequest(
    string? Summary,
    string? AccessConditionCode,
    string? HazardLevelCode,
    IReadOnlyCollection<SceneObservationDetailRequest>? Details);

public sealed record SceneObservationDetailRequest(
    string FactorCode,
    string? ValueText,
    decimal? ValueNumber,
    string? UnitCode);

public sealed record UpdateIncidentRequirementsRequest(
    IReadOnlyCollection<SkillRequirementRequest>? Skills,
    IReadOnlyCollection<VehicleCapabilityRequirementRequest>? VehicleCapabilities);

public sealed record SkillRequirementRequest(string SkillCode, string? SkillLevelCode, int RequiredCount);

public sealed record VehicleCapabilityRequirementRequest(string CapabilityCode, int RequiredCount);

public sealed record CreateMissionRequest(
    string? Objective,
    string? PriorityCode,
    IReadOnlyCollection<MissionTeamAssignmentRequest> TeamAssignments,
    int? EtaMinutes,
    string? Note);

public sealed record MissionTeamAssignmentRequest(
    Guid TeamId,
    bool IsPrimaryTeam,
    IReadOnlyCollection<Guid>? MemberIds,
    IReadOnlyCollection<Guid>? VehicleIds);

public sealed record StandardizeReliefRequest(
    string DecisionCode,
    Guid? CampaignId,
    string? Note,
    IReadOnlyCollection<StandardizedReliefItemRequest>? Items);

public sealed record StandardizedReliefItemRequest(
    Guid? ReliefRequestItemId,
    string? SupportTypeCode,
    decimal ApprovedQty,
    string? UnitCode);

public sealed record RejectReliefRequest(
    string? Note);

public sealed record CreateIncidentReliefRequest(
    int HouseholdCount,
    string? Note,
    IReadOnlyCollection<IncidentReliefItemRequest>? Items);

public sealed record IncidentReliefItemRequest(
    string SupportTypeCode,
    decimal RequestedQty,
    string? UnitCode);
