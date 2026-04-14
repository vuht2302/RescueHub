using Microsoft.AspNetCore.Mvc;

namespace RescueHub.BuildingBlocks.Api;

[ApiController]
public abstract class BaseApiController : ControllerBase
{
    protected ActionResult<ApiResponse<T>> OkResponse<T>(T? data, string message)
        => Ok(ApiResponse<T>.Ok(data, message));

    protected ActionResult<ApiResponse<T>> BadRequestResponse<T>(string message, IReadOnlyCollection<ApiError>? errors = null)
        => BadRequest(ApiResponse<T>.Fail(message, errors));
}
