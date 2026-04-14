using Microsoft.Extensions.DependencyInjection;
using RescueHub.Modules.MasterData.Application;
using RescueHub.Modules.MasterData.Background;

namespace RescueHub.Modules.MasterData;

public static class MasterDataModuleServiceCollectionExtensions
{
    public static IServiceCollection AddMasterDataModule(this IServiceCollection services)
    {
        services.AddScoped<IMasterDataService, MasterDataService>();
        services.AddHostedService<MasterDataCacheWarmupWorker>();
        return services;
    }
}
