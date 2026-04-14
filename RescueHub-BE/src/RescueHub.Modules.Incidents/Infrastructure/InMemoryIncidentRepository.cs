namespace RescueHub.Modules.Incidents.Infrastructure;

public sealed class InMemoryIncidentRepository : IIncidentRepository
{
    public object List() => new[]
    {
        new
        {
            id = Guid.NewGuid(),
            incidentCode = "SC-20260413-001",
            status = new { code = "NEW", name = "Moi tao", color = "#EF4444" },
            reportedAt = DateTime.UtcNow
        }
    };

    public object Get(Guid incidentId) => new
    {
        id = incidentId,
        incidentCode = "SC-20260413-001",
        isSOS = true,
        status = new { code = "ASSIGNED", name = "Da phan cong", color = "#F59E0B" },
        priority = new { code = "CRITICAL", name = "Khan cap", color = "#DC2626" },
        reportedAt = DateTime.UtcNow,
        updatedAt = DateTime.UtcNow
    };
}
