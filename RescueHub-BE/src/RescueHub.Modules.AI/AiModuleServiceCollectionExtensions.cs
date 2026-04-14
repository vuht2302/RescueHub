using Microsoft.Extensions.DependencyInjection;
using RescueHub.Modules.AI.Application;
using RescueHub.Modules.AI.Background;

namespace RescueHub.Modules.AI;

public static class AiModuleServiceCollectionExtensions
{
    public static IServiceCollection AddAiModule(this IServiceCollection services)
    {
        services.AddScoped<IAiService, AiService>();
        services.AddHostedService<AiJobWorker>();
        return services;
    }
}
