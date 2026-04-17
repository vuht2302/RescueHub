using Microsoft.Extensions.DependencyInjection;
using RescueHub.Modules.Incidents.Application;
using RescueHub.Modules.Incidents.Background;
using RescueHub.Modules.Incidents.Infrastructure;

namespace RescueHub.Modules.Incidents;

public static class IncidentsModuleServiceCollectionExtensions
{
    public static IServiceCollection AddIncidentsModule(this IServiceCollection services)
    {
        services.AddScoped<IIncidentRepository, DbIncidentRepository>();
        services.AddScoped<IIncidentService, IncidentService>();
        services.AddScoped<ITeamManagementRepository, DbTeamManagementRepository>();
        services.AddScoped<ITeamManagementService, TeamManagementService>();
        services.AddScoped<IWarehouseManagementRepository, DbWarehouseManagementRepository>();
        services.AddScoped<IWarehouseManagementService, WarehouseManagementService>();
        services.AddHostedService<IncidentProjectionWorker>();
        return services;
    }
}
