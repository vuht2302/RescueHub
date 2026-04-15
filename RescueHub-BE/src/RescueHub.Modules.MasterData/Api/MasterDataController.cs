using Microsoft.AspNetCore.Mvc;
using RescueHub.BuildingBlocks.Api;
using RescueHub.Modules.MasterData.Application;

namespace RescueHub.Modules.MasterData.Api;

[Route("api/v1/master-data")]
public sealed class MasterDataController(IMasterDataService service) : BaseApiController
{
    /// <summary>
    /// Lay du lieu master data cho toan he thong.
    /// </summary>
    /// <returns>Danh sach loai su co, kenh, muc do uu tien, ky nang, kho, don vi.</returns>
    [HttpGet("bootstrap")]
    public async Task<ActionResult<ApiResponse<object>>> GetBootstrap()
        => OkResponse<object>(await service.GetBootstrap(), "Lay du lieu dung chung thanh cong");

    /// <summary>
    /// Lay danh sach factor code chuan cho flood scene details de FE render form.
    /// </summary>
    /// <returns>Danh sach factor code va kieu gia tri.</returns>
    [HttpGet("scene-factors")]
    public async Task<ActionResult<ApiResponse<object>>> GetSceneFactors()
        => OkResponse<object>(await service.GetSceneFactors(), "Lay danh sach scene factor thanh cong");

    /// <summary>
    /// Lay cau hinh workflow theo entity type.
    /// </summary>
    /// <param name="entityType">Loai entity nhu INCIDENT, MISSION...</param>
    /// <returns>Danh sach states va transitions.</returns>
    [HttpGet("workflows/{entityType}")]
    public async Task<ActionResult<ApiResponse<object>>> GetWorkflow([FromRoute] string entityType)
    {
        try
        {
            return OkResponse<object>(await service.GetWorkflow(entityType), "Lay workflow thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }
}
