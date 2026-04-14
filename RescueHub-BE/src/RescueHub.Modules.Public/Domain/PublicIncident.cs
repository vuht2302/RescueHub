namespace RescueHub.Modules.Public.Domain;

public sealed record PublicIncident(Guid IncidentId, string IncidentCode, string TrackingCode, DateTime ReportedAtUtc);
