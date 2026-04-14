namespace RescueHub.Modules.Incidents.Application;

public interface IIncidentService
{
    object List();

    object Get(Guid incidentId);

    object Verify(Guid incidentId);

    object Assess(Guid incidentId);
}
