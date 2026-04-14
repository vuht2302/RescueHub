namespace RescueHub.Modules.AI.Application;

public sealed class AiService : IAiService
{
    public object CreateIncidentTriageJob(Guid incidentId) => new
    {
        jobId = Guid.NewGuid(),
        incidentId,
        status = "PENDING",
        requestedAt = DateTime.UtcNow
    };

    public object GetJob(Guid jobId) => new
    {
        jobId,
        jobTypeCode = "INCIDENT_TRIAGE",
        status = "COMPLETED",
        requestedAt = DateTime.UtcNow.AddSeconds(-5),
        completedAt = DateTime.UtcNow
    };
}
