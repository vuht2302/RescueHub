using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace RescueHub.Modules.Media.Background;

public sealed class MediaCleanupWorker(ILogger<MediaCleanupWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            logger.LogDebug("Media cleanup worker heartbeat at {UtcNow}", DateTime.UtcNow);
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }
}
