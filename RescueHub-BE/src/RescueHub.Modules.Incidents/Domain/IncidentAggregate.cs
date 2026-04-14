namespace RescueHub.Modules.Incidents.Domain;

public sealed record IncidentAggregate(Guid Id, string IncidentCode, string StatusCode, DateTime ReportedAtUtc);
