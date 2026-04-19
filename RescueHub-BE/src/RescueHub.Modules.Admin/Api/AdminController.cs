using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RescueHub.BuildingBlocks.Api;
using RescueHub.Modules.Admin.Application;

namespace RescueHub.Modules.Admin.Api;

/// <summary>
/// API quan tri he thong: user, role, danh muc, dia ban, cau hinh va bao cao.
/// </summary>
[Route("api/v1/admin")]
[Authorize(Roles = "ADMIN")]
public sealed class AdminController(IAdminService service) : BaseApiController
{
    /// <summary>
    /// Lay danh sach user theo bo loc va phan trang.
    /// </summary>
    [HttpGet("users")]
    public async Task<ActionResult<ApiResponse<object>>> ListUsers(
        [FromQuery] string? keyword,
        [FromQuery] bool? isActive,
        [FromQuery] string? roleCode,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
        => OkResponse<object>(await service.ListUsers(keyword, isActive, roleCode, page, pageSize), "Lay danh sach user thanh cong");

    /// <summary>
    /// Lay chi tiet mot user.
    /// </summary>
    [HttpGet("users/{userId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetUser([FromRoute] Guid userId)
    {
        try
        {
            return OkResponse<object>(await service.GetUser(userId), "Lay chi tiet user thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Tao moi user noi bo.
    /// </summary>
    [HttpPost("users")]
    public async Task<ActionResult<ApiResponse<object>>> CreateUser([FromBody] CreateAdminUserRequest request)
    {
        try
        {
            return OkResponse<object>(await service.CreateUser(request), "Tao user thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Cap nhat thong tin user.
    /// </summary>
    [HttpPut("users/{userId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateUser([FromRoute] Guid userId, [FromBody] UpdateAdminUserRequest request)
    {
        try
        {
            return OkResponse<object>(await service.UpdateUser(userId, request), "Cap nhat user thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Cap nhat tap role cua user.
    /// </summary>
    [HttpPut("users/{userId:guid}/roles")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateUserRoles([FromRoute] Guid userId, [FromBody] UpdateUserRolesRequest request)
    {
        try
        {
            return OkResponse<object>(await service.UpdateUserRoles(userId, request), "Cap nhat role cho user thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay danh sach role.
    /// </summary>
    [HttpGet("roles")]
    public async Task<ActionResult<ApiResponse<object>>> ListRoles([FromQuery] string? keyword)
        => OkResponse<object>(await service.ListRoles(keyword), "Lay danh sach role thanh cong");

    /// <summary>
    /// Lay chi tiet role.
    /// </summary>
    [HttpGet("roles/{roleId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetRole([FromRoute] Guid roleId)
    {
        try
        {
            return OkResponse<object>(await service.GetRole(roleId), "Lay chi tiet role thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Tao role moi.
    /// </summary>
    [HttpPost("roles")]
    public async Task<ActionResult<ApiResponse<object>>> CreateRole([FromBody] CreateRoleRequest request)
    {
        try
        {
            return OkResponse<object>(await service.CreateRole(request), "Tao role thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Cap nhat role.
    /// </summary>
    [HttpPut("roles/{roleId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateRole([FromRoute] Guid roleId, [FromBody] UpdateRoleRequest request)
    {
        try
        {
            return OkResponse<object>(await service.UpdateRole(roleId, request), "Cap nhat role thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Xoa role.
    /// </summary>
    [HttpDelete("roles/{roleId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteRole([FromRoute] Guid roleId)
    {
        try
        {
            return OkResponse<object>(await service.DeleteRole(roleId), "Xoa role thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay danh sach dia ban hanh chinh.
    /// </summary>
    [HttpGet("admin-areas")]
    public async Task<ActionResult<ApiResponse<object>>> ListAdminAreas(
        [FromQuery] string? keyword,
        [FromQuery] string? levelCode,
        [FromQuery] Guid? parentId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
        => OkResponse<object>(await service.ListAdminAreas(keyword, levelCode, parentId, page, pageSize), "Lay danh sach dia ban hanh chinh thanh cong");

    /// <summary>
    /// Lay chi tiet dia ban hanh chinh.
    /// </summary>
    [HttpGet("admin-areas/{adminAreaId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetAdminArea([FromRoute] Guid adminAreaId)
    {
        try
        {
            return OkResponse<object>(await service.GetAdminArea(adminAreaId), "Lay chi tiet dia ban hanh chinh thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Tao dia ban hanh chinh moi.
    /// </summary>
    [HttpPost("admin-areas")]
    public async Task<ActionResult<ApiResponse<object>>> CreateAdminArea([FromBody] CreateAdminAreaRequest request)
    {
        try
        {
            return OkResponse<object>(await service.CreateAdminArea(request), "Tao dia ban hanh chinh thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Cap nhat dia ban hanh chinh.
    /// </summary>
    [HttpPut("admin-areas/{adminAreaId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateAdminArea([FromRoute] Guid adminAreaId, [FromBody] UpdateAdminAreaRequest request)
    {
        try
        {
            return OkResponse<object>(await service.UpdateAdminArea(adminAreaId, request), "Cap nhat dia ban hanh chinh thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Xoa dia ban hanh chinh.
    /// </summary>
    [HttpDelete("admin-areas/{adminAreaId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteAdminArea([FromRoute] Guid adminAreaId)
    {
        try
        {
            return OkResponse<object>(await service.DeleteAdminArea(adminAreaId), "Xoa dia ban hanh chinh thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay toan bo danh muc theo bo loc keyword.
    /// </summary>
    [HttpGet("catalogs")]
    public async Task<ActionResult<ApiResponse<object>>> GetAllCatalogs([FromQuery] string? keyword)
        => OkResponse<object>(await service.GetAllCatalogs(keyword), "Lay toan bo danh muc thanh cong");

    /// <summary>
    /// Lay danh sach item cua mot loai danh muc.
    /// </summary>
    [HttpGet("catalogs/{catalogType}")]
    public async Task<ActionResult<ApiResponse<object>>> ListCatalogItems([FromRoute] string catalogType, [FromQuery] string? keyword)
    {
        try
        {
            return OkResponse<object>(await service.ListCatalogItems(catalogType, keyword), "Lay danh muc thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Tao item danh muc moi.
    /// </summary>
    [HttpPost("catalogs/{catalogType}")]
    public async Task<ActionResult<ApiResponse<object>>> CreateCatalogItem([FromRoute] string catalogType, [FromBody] UpsertCatalogItemRequest request)
    {
        try
        {
            return OkResponse<object>(await service.CreateCatalogItem(catalogType, request), "Tao danh muc thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Cap nhat item danh muc.
    /// </summary>
    [HttpPut("catalogs/{catalogType}/{itemId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateCatalogItem([FromRoute] string catalogType, [FromRoute] Guid itemId, [FromBody] UpsertCatalogItemRequest request)
    {
        try
        {
            return OkResponse<object>(await service.UpdateCatalogItem(catalogType, itemId, request), "Cap nhat danh muc thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Xoa item danh muc.
    /// </summary>
    [HttpDelete("catalogs/{catalogType}/{itemId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteCatalogItem([FromRoute] string catalogType, [FromRoute] Guid itemId)
    {
        try
        {
            return OkResponse<object>(await service.DeleteCatalogItem(catalogType, itemId), "Xoa danh muc thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay cau hinh workflow theo entity type.
    /// </summary>
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

    /// <summary>
    /// Lay system settings.
    /// </summary>
    [HttpGet("system-settings")]
    public async Task<ActionResult<ApiResponse<object>>> GetSystemSettings()
        => OkResponse<object>(await service.GetSystemSettings(), "Lay system settings thanh cong");

    /// <summary>
    /// Cap nhat system settings.
    /// </summary>
    [HttpPut("system-settings")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateSystemSettings([FromBody] UpdateSystemSettingsRequest request)
    {
        try
        {
            return OkResponse<object>(await service.UpdateSystemSettings(request), "Cap nhat system settings thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Bao cao tong quan he thong.
    /// </summary>
    [HttpGet("reports/overview")]
    public async Task<ActionResult<ApiResponse<object>>> GetOverviewReport([FromQuery] DateTime? fromDateUtc, [FromQuery] DateTime? toDateUtc)
    {
        try
        {
            return OkResponse<object>(await service.GetOverviewReport(fromDateUtc, toDateUtc), "Lay bao cao tong hop thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Bao cao incident theo trang thai.
    /// </summary>
    [HttpGet("reports/incidents/by-status")]
    public async Task<ActionResult<ApiResponse<object>>> GetIncidentsByStatusReport([FromQuery] DateTime? fromDateUtc, [FromQuery] DateTime? toDateUtc)
    {
        try
        {
            return OkResponse<object>(await service.GetIncidentsByStatusReport(fromDateUtc, toDateUtc), "Lay bao cao incident theo trang thai thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Bao cao mission theo trang thai.
    /// </summary>
    [HttpGet("reports/missions/by-status")]
    public async Task<ActionResult<ApiResponse<object>>> GetMissionsByStatusReport([FromQuery] DateTime? fromDateUtc, [FromQuery] DateTime? toDateUtc)
    {
        try
        {
            return OkResponse<object>(await service.GetMissionsByStatusReport(fromDateUtc, toDateUtc), "Lay bao cao mission theo trang thai thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Bao cao relief theo trang thai.
    /// </summary>
    [HttpGet("reports/relief/by-status")]
    public async Task<ActionResult<ApiResponse<object>>> GetReliefByStatusReport([FromQuery] DateTime? fromDateUtc, [FromQuery] DateTime? toDateUtc)
    {
        try
        {
            return OkResponse<object>(await service.GetReliefByStatusReport(fromDateUtc, toDateUtc), "Lay bao cao relief theo trang thai thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Bao cao diem nong su co.
    /// </summary>
    [HttpGet("reports/hotspots")]
    public async Task<ActionResult<ApiResponse<object>>> GetHotspotsReport(
        [FromQuery] DateTime? fromDateUtc,
        [FromQuery] DateTime? toDateUtc,
        [FromQuery] int topN = 10)
    {
        try
        {
            return OkResponse<object>(await service.GetHotspotsReport(fromDateUtc, toDateUtc, topN), "Lay bao cao hotspot thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }
}
