using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RescueHub.Modules.Media.Application;
using RescueHub.Modules.Media.Background;
using RescueHub.Modules.Media.Infrastructure;

namespace RescueHub.Modules.Media;

public static class MediaModuleServiceCollectionExtensions
{
    public static IServiceCollection AddMediaModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<CloudinaryOptions>(configuration.GetSection(CloudinaryOptions.SectionName));
        services.AddHttpClient();
        services.AddScoped<IMediaService, MediaService>();
        services.AddSingleton<IMediaRepository, InMemoryMediaRepository>();
        services.AddHostedService<MediaCleanupWorker>();

        return services;
    }
}
