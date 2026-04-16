using Microsoft.Extensions.DependencyInjection;
using RescueHub.Modules.Admin.Application;
using RescueHub.Modules.Admin.Infrastructure;

namespace RescueHub.Modules.Admin;

public static class AdminModuleServiceCollectionExtensions
{
    public static IServiceCollection AddAdminModule(this IServiceCollection services)
    {
        services.AddScoped<IAdminRepository, DbAdminRepository>();
        services.AddScoped<IAdminService, AdminService>();
        return services;
    }
}
