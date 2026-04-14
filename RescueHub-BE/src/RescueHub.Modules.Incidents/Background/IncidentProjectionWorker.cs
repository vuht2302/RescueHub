using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace RescueHub.Modules.Incidents.Background;

public sealed class IncidentProjectionWorker(ILogger<IncidentProjectionWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            logger.LogDebug("Incident projection worker heartbeat at {UtcNow}", DateTime.UtcNow);
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}
