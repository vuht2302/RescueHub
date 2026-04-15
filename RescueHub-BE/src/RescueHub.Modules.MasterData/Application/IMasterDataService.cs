namespace RescueHub.Modules.MasterData.Application;

public interface IMasterDataService
{
    Task<object> GetBootstrap();

    Task<object> GetSceneFactors();

    Task<object> GetWorkflow(string entityType);
}
