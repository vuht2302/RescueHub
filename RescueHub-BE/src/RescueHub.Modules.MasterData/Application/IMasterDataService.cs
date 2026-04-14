namespace RescueHub.Modules.MasterData.Application;

public interface IMasterDataService
{
    object GetBootstrap();

    object GetWorkflow(string entityType);
}
