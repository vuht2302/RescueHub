using Microsoft.AspNetCore.Mvc;
using RescueHub.BuildingBlocks.Api;
using RescueHub.Modules.Public.Application;

namespace RescueHub.Modules.Public.Api;

[Route("api/v1/public")]
public sealed class PublicController(IPublicService publicService) : BaseApiController
{
    [HttpGet("bootstrap")]
    public ActionResult<ApiResponse<object>> GetBootstrap()
        => OkResponse<object>(publicService.GetBootstrap(), "Lay du lieu khoi tao thanh cong");

    [HttpGet("map-data")]
    public ActionResult<ApiResponse<object>> GetMapData([FromQuery] double lat, [FromQuery] double lng, [FromQuery] double radiusKm = 3)
        => OkResponse<object>(publicService.GetMapData(lat, lng, radiusKm), "Lay du lieu ban do thanh cong");

    [HttpPost("incidents/sos")]
    public ActionResult<ApiResponse<object>> CreateSos()
        => OkResponse<object>(publicService.CreateSos(), "Gui tin hieu SOS thanh cong");
}
