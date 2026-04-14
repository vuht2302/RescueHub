using Microsoft.AspNetCore.Mvc;
using RescueHub.BuildingBlocks.Api;
using RescueHub.Modules.MasterData.Application;

namespace RescueHub.Modules.MasterData.Api;

[Route("api/v1/master-data")]
public sealed class MasterDataController(IMasterDataService service) : BaseApiController
{
    [HttpGet("bootstrap")]
    public ActionResult<ApiResponse<object>> GetBootstrap()
        => OkResponse<object>(service.GetBootstrap(), "Lay du lieu dung chung thanh cong");

    [HttpGet("workflows/{entityType}")]
    public ActionResult<ApiResponse<object>> GetWorkflow([FromRoute] string entityType)
        => OkResponse<object>(service.GetWorkflow(entityType), "Lay workflow thanh cong");
}
