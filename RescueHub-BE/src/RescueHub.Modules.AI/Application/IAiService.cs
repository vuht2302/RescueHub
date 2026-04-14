namespace RescueHub.Modules.AI.Application;

public interface IAiService
{
    object CreateIncidentTriageJob(Guid incidentId);

    object GetJob(Guid jobId);
}
