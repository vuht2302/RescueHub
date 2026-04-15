using Microsoft.Extensions.DependencyInjection;
using RescueHub.Modules.Auth.Application;
using RescueHub.Modules.Auth.Background;

namespace RescueHub.Modules.Auth;

public static class AuthModuleServiceCollectionExtensions
{
    public static IServiceCollection AddAuthModule(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddHostedService<AuthSessionCleanupWorker>();

        return services;
    }
}
