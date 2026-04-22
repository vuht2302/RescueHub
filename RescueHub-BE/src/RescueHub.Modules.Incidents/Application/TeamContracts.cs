namespace RescueHub.Modules.Incidents.Application;

public sealed record TeamRespondMissionRequest(
    string Response,
    string? ReasonCode,
    string? Note);

public sealed record TeamMissionStatusRequest(
    string ActionCode,
    string? Note);

public sealed record TeamFieldReportRequest(
    string ReportTypeCode,
    string? Summary,
    int? VictimRescuedCount,
    int? VictimUnreachableCount,
    int? CasualtyCount,
    string? NextActionNote,
    IReadOnlyCollection<SceneObservationDetailRequest>? SceneDetails,
    IReadOnlyCollection<Guid>? FileIds);

public sealed record TeamAbortRequest(
    string ReasonCode,
    string? DetailNote);

public sealed record TeamSupportRequest(
    string SupportTypeCode,
    string? DetailNote);

public sealed record TeamReliefStatusRequest(
    string StatusCode,
    string? Note);
