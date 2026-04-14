using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace RescueHub.Modules.Public.Background;

public sealed class PublicRateLimitWorker(ILogger<PublicRateLimitWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            logger.LogDebug("Public worker heartbeat at {UtcNow}", DateTime.UtcNow);
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
