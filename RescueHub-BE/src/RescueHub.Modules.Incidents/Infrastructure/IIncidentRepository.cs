namespace RescueHub.Modules.Incidents.Infrastructure;

public interface IIncidentRepository
{
    object List();

    object Get(Guid incidentId);
}
