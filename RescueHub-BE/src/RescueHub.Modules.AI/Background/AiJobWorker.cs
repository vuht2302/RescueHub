using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace RescueHub.Modules.AI.Background;

public sealed class AiJobWorker(ILogger<AiJobWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            logger.LogDebug("AI worker heartbeat at {UtcNow}", DateTime.UtcNow);
            await Task.Delay(TimeSpan.FromSeconds(20), stoppingToken);
        }
    }
}
