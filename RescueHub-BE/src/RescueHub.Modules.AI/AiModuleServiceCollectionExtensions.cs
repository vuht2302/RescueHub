using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using RescueHub.Modules.AI.Application;
using RescueHub.Modules.AI.Infrastructure;

namespace RescueHub.Modules.AI;

public static class AiModuleServiceCollectionExtensions
{
    public static IServiceCollection AddAiModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<GeminiOptions>(configuration.GetSection("AI:Gemini"));
        services.AddHttpClient<IGenerativeAiClient, GeminiGenerativeAiClient>();
        services.AddScoped<IAiRepository, DbAiRepository>();
        services.AddScoped<IAiService, AiService>();
        return services;
    }
}
