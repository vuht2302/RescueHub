namespace RescueHub.Modules.Public.Application;

public sealed class PublicService : IPublicService
{
    public object GetBootstrap() => new
    {
        hotline = "1900xxxx",
        defaultMapCenter = new { lat = 10.123, lng = 106.123 },
        quickIncidentTypes = Array.Empty<object>(),
        quickActions = Array.Empty<object>()
    };

    public object GetMapData(double lat, double lng, double radiusKm) => new
    {
        markers = new[]
        {
            new
            {
                id = Guid.NewGuid(),
                markerType = "RELIEF_POINT",
                title = "Diem cuu tro Truong A",
                position = new { lat, lng, addressText = "Xa A, Huyen B" },
                status = new { code = "OPEN", name = "Dang mo", color = "#22C55E" }
            }
        }
    };

    public object CreateSos() => new
    {
        incidentId = Guid.NewGuid(),
        incidentCode = "SC-20260413-001",
        trackingCode = "TK-9821",
        status = new { code = "NEW", name = "Da tiep nhan", color = "#EF4444" },
        reportedAt = DateTime.UtcNow
    };
}
