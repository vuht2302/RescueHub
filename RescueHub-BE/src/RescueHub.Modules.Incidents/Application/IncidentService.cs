using RescueHub.Modules.Incidents.Infrastructure;

namespace RescueHub.Modules.Incidents.Application;

public sealed class IncidentService(IIncidentRepository repository) : IIncidentService
{
    public object List() => repository.List();

    public object Get(Guid incidentId) => repository.Get(incidentId);

    public object Verify(Guid incidentId) => new
    {
        incidentId,
        verified = true,
        verifiedAt = DateTime.UtcNow
    };

    public object Assess(Guid incidentId) => new
    {
        incidentId,
        assessed = true,
        assessedAt = DateTime.UtcNow
    };
}
