namespace RescueHub.Modules.Public.Application;

public sealed record CreateSosRequest(
    string IncidentTypeCode,
    string ReporterName,
    string ReporterPhone,
    int? VictimCountEstimate,
    bool HasInjured,
    bool HasVulnerablePeople,
    string? Description,
    SosLocationRequest Location,
    IReadOnlyCollection<Guid>? FileIds);

public sealed record CreatePublicIncidentRequest(
    string IncidentTypeCode,
    string ReporterName,
    string ReporterPhone,
    string? Description,
    int? VictimCountEstimate,
    int? InjuredCountEstimate,
    int? VulnerableCountEstimate,
    SosLocationRequest Location,
    IReadOnlyCollection<PublicSceneDetailRequest>? SceneDetails,
    IReadOnlyCollection<Guid>? FileIds);

public sealed record SosLocationRequest(
    decimal Lat,
    decimal Lng,
    string? AddressText,
    string? Landmark);

public sealed record PublicSceneDetailRequest(
    string FactorCode,
    string? ValueText,
    decimal? ValueNumber,
    string? UnitCode);

public sealed record RequestTrackingOtpRequest(string Phone, string Purpose);

public sealed record VerifyTrackingOtpRequest(string Phone, string OtpCode, string Purpose);

public sealed record AckRescueRequest(string AckMethodCode, string AckCode, string? Note);

public sealed record CreateReliefRequest(
    string RequesterName,
    string RequesterPhone,
    int? HouseholdCount,
    string? Note,
    SosLocationRequest? Location,
    IReadOnlyCollection<ReliefItemRequest>? Items);

public sealed record ReliefItemRequest(
    string SupportTypeCode,
    decimal RequestedQty,
    string? UnitCode);

public sealed record AckReliefRequest(string AckMethodCode, string AckCode, string? Note);

public sealed record ReportReliefNotReceivedRequest(string? Note);
