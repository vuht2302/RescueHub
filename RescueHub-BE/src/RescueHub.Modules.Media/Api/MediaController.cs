using Microsoft.AspNetCore.Mvc;
using RescueHub.BuildingBlocks.Api;
using RescueHub.Modules.Media.Application;

namespace RescueHub.Modules.Media.Api;

[Route("api/v1/media")]
public sealed class MediaController(IMediaService mediaService) : BaseApiController
{
    [HttpPost("cloudinary/signature")]
    public ActionResult<ApiResponse<object>> CreateSignature([FromBody] CloudinarySignatureRequest request)
    {
        var data = mediaService.CreateCloudinarySignature(request);
        return OkResponse<object>(data, "Tao chu ky upload thanh cong");
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<object>>> Register([FromBody] RegisterMediaRequest request, CancellationToken cancellationToken)
    {
        var data = await mediaService.RegisterAsync(request, cancellationToken);
        return OkResponse<object>(data, "Luu metadata media thanh cong");
    }
}
