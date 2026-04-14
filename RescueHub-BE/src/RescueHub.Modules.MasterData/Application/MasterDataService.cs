namespace RescueHub.Modules.MasterData.Application;

public sealed class MasterDataService : IMasterDataService
{
    public object GetBootstrap() => new
    {
        incidentTypes = Array.Empty<object>(),
        channels = Array.Empty<object>(),
        priorityLevels = Array.Empty<object>(),
        severityLevels = Array.Empty<object>(),
        skills = Array.Empty<object>(),
        skillLevels = Array.Empty<object>(),
        vehicleTypes = Array.Empty<object>(),
        vehicleCapabilities = Array.Empty<object>(),
        warehouseTypes = Array.Empty<object>(),
        units = Array.Empty<object>()
    };

    public object GetWorkflow(string entityType) => new
    {
        entityType,
        states = Array.Empty<object>(),
        transitions = Array.Empty<object>()
    };
}
