using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RescueHub.BuildingBlocks.Api;
using RescueHub.Modules.Media.Application;

namespace RescueHub.Modules.Media.Api;

[Route("api/v1/media")]
public sealed class MediaController(IMediaService mediaService) : BaseApiController
{
    /// <summary>
    /// Lay danh sach type upload hop le duoc cau hinh trong appsettings.
    /// </summary>
    /// <returns>Danh sach upload type.</returns>
    [HttpGet("upload-types")]
    public ActionResult<ApiResponse<object>> GetUploadTypes()
        => OkResponse<object>(mediaService.GetSupportedUploadTypes(), "Lay danh sach upload type thanh cong");

    /// <summary>
    /// Tao chu ky upload Cloudinary theo purpose.
    /// </summary>
    /// <param name="request">Thong tin upload signature.</param>
    /// <returns>Thong tin cloud name, key, timestamp, folder va signature.</returns>
    [HttpPost("cloudinary/signature")]
    public ActionResult<ApiResponse<object>> CreateSignature([FromBody] CloudinarySignatureRequest request)
    {
        try
        {
            var data = mediaService.CreateCloudinarySignature(request);
            return OkResponse<object>(data, "Tao chu ky upload thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Dang ky metadata media sau khi upload Cloudinary.
    /// </summary>
    /// <param name="request">Metadata media.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Thong tin media da luu.</returns>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<object>>> Register([FromBody] RegisterMediaRequest request, CancellationToken cancellationToken)
    {
        var data = await mediaService.RegisterAsync(request, cancellationToken);
        return OkResponse<object>(data, "Luu metadata media thanh cong");
    }

    /// <summary>
    /// Upload file truc tiep qua backend (multipart/form-data) va tu dong dang ky metadata.
    /// </summary>
    /// <param name="request">Form upload gom file va type. Goi GET /api/v1/media/upload-types de lay gia tri type hop le.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Thong tin media da upload.</returns>
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<object>>> Upload(
        [FromForm] UploadMediaFormRequest request,
        CancellationToken cancellationToken)
    {
        var file = request.File;
        var uploadType = !string.IsNullOrWhiteSpace(request.Type) ? request.Type : request.Purpose;

        if (file is null || file.Length <= 0)
        {
            return BadRequestResponse<object>("File khong hop le.");
        }

        if (string.IsNullOrWhiteSpace(uploadType))
        {
            return BadRequestResponse<object>("Type la bat buoc.");
        }

        try
        {
            await using var stream = file.OpenReadStream();
            var data = await mediaService.UploadAsync(stream, file.FileName, file.ContentType, uploadType, cancellationToken);
            return OkResponse<object>(data, "Upload media thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay metadata media theo file id.
    /// </summary>
    /// <param name="fileId">Id tep tin.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Thong tin media.</returns>
    [HttpGet("{fileId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetById([FromRoute] Guid fileId, CancellationToken cancellationToken)
    {
        var data = await mediaService.GetAsync(fileId, cancellationToken);
        if (data is null)
        {
            return BadRequestResponse<object>("Khong tim thay media.");
        }

        return OkResponse<object>(data, "Lay metadata media thanh cong");
    }
}
