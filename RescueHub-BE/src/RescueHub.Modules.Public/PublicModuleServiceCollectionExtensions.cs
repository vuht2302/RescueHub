using Microsoft.Extensions.DependencyInjection;
using RescueHub.Modules.Public.Application;
using RescueHub.Modules.Public.Background;

namespace RescueHub.Modules.Public;

public static class PublicModuleServiceCollectionExtensions
{
    public static IServiceCollection AddPublicModule(this IServiceCollection services)
    {
        services.AddScoped<IPublicService, PublicService>();
        services.AddHostedService<PublicRateLimitWorker>();
        return services;
    }
}
