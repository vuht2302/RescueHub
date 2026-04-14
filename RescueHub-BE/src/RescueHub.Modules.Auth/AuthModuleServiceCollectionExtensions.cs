using Microsoft.Extensions.DependencyInjection;
using RescueHub.Modules.Auth.Application;
using RescueHub.Modules.Auth.Background;
using RescueHub.Modules.Auth.Infrastructure;

namespace RescueHub.Modules.Auth;

public static class AuthModuleServiceCollectionExtensions
{
    public static IServiceCollection AddAuthModule(this IServiceCollection services)
    {
        services.AddSingleton<InMemoryRefreshTokenRepository>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddHostedService<AuthSessionCleanupWorker>();

        return services;
    }
}
