using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace RescueHub.Modules.MasterData.Background;

public sealed class MasterDataCacheWarmupWorker(ILogger<MasterDataCacheWarmupWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            logger.LogDebug("Master data cache worker heartbeat at {UtcNow}", DateTime.UtcNow);
            await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
        }
    }
}
