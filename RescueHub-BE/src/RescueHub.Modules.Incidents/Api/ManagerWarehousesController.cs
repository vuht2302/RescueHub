using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RescueHub.BuildingBlocks.Api;
using RescueHub.Modules.Incidents.Application;

namespace RescueHub.Modules.Incidents.Api;

/// <summary>
/// Nhom API Manager cho quan ly kho, ton kho, cap phat, ho dan va phan phoi cuu tro.
/// </summary>
[Route("api/v1/manager")]
[Authorize]
public sealed class ManagerWarehousesController(IWarehouseManagementService service) : BaseApiController
{
    /// <summary>
    /// Lay danh sach kho theo tu khoa va trang thai.
    /// </summary>
    /// <param name="keyword">Tu khoa tim theo ma/ten/dia chi kho.</param>
    /// <param name="statusCode">Trang thai kho (ACTIVE/INACTIVE).</param>
    /// <returns>Danh sach kho.</returns>
    [HttpGet("warehouses")]
    public async Task<ActionResult<ApiResponse<object>>> ListWarehouses([FromQuery] string? keyword, [FromQuery] string? statusCode)
        => OkResponse<object>(await service.ListWarehouses(keyword, statusCode), "Lay danh sach kho thanh cong");

    /// <summary>
    /// Lay chi tiet mot kho theo id.
    /// </summary>
    /// <param name="warehouseId">Dinh danh kho.</param>
    /// <returns>Thong tin chi tiet kho.</returns>
    [HttpGet("warehouses/{warehouseId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetWarehouse([FromRoute] Guid warehouseId)
    {
        try
        {
            return OkResponse<object>(await service.GetWarehouse(warehouseId), "Lay chi tiet kho thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Tao moi kho.
    /// </summary>
    /// <param name="request">Thong tin tao kho.</param>
    /// <returns>Id va ma kho vua tao.</returns>
    [HttpPost("warehouses")]
    public async Task<ActionResult<ApiResponse<object>>> CreateWarehouse([FromBody] CreateWarehouseRequest request)
    {
        try
        {
            return OkResponse<object>(await service.CreateWarehouse(request), "Tao kho thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Cap nhat thong tin kho.
    /// </summary>
    /// <param name="warehouseId">Dinh danh kho.</param>
    /// <param name="request">Thong tin cap nhat kho.</param>
    /// <returns>Ket qua cap nhat.</returns>
    [HttpPut("warehouses/{warehouseId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateWarehouse([FromRoute] Guid warehouseId, [FromBody] UpdateWarehouseRequest request)
    {
        try
        {
            return OkResponse<object>(await service.UpdateWarehouse(warehouseId, request), "Cap nhat kho thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Xoa kho.
    /// </summary>
    /// <param name="warehouseId">Dinh danh kho.</param>
    /// <returns>Ket qua xoa.</returns>
    [HttpDelete("warehouses/{warehouseId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteWarehouse([FromRoute] Guid warehouseId)
    {
        try
        {
            return OkResponse<object>(await service.DeleteWarehouse(warehouseId), "Xoa kho thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay danh sach ton kho theo bo loc.
    /// </summary>
    /// <param name="warehouseId">Loc theo kho.</param>
    /// <param name="itemId">Loc theo item.</param>
    /// <param name="lotNo">Loc theo so lot.</param>
    /// <param name="nearExpiry">Chi lay ton kho sap het han.</param>
    /// <param name="page">Trang hien tai.</param>
    /// <param name="pageSize">Kich thuoc trang.</param>
    /// <returns>Danh sach ton kho co phan trang.</returns>
    [HttpGet("stocks")]
    public async Task<ActionResult<ApiResponse<object>>> ListStocks(
        [FromQuery] Guid? warehouseId,
        [FromQuery] Guid? itemId,
        [FromQuery] string? lotNo,
        [FromQuery] bool nearExpiry = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
        => OkResponse<object>(await service.ListStocks(warehouseId, itemId, lotNo, nearExpiry, page, pageSize), "Lay ton kho thanh cong");

    /// <summary>
    /// Lay danh sach item cho nghiep vu cuu tro.
    /// </summary>
    /// <param name="keyword">Tu khoa tim item.</param>
    /// <param name="categoryCode">Ma nhom item.</param>
    /// <param name="isActive">Trang thai kich hoat item.</param>
    /// <returns>Danh sach item.</returns>
    [HttpGet("items")]
    public async Task<ActionResult<ApiResponse<object>>> ListItems([FromQuery] string? keyword, [FromQuery] string? categoryCode, [FromQuery] bool? isActive)
        => OkResponse<object>(await service.ListItems(keyword, categoryCode, isActive), "Lay danh sach item thanh cong");

    /// <summary>
    /// Lay chi tiet item.
    /// </summary>
    /// <param name="itemId">Dinh danh item.</param>
    /// <returns>Thong tin item.</returns>
    [HttpGet("items/{itemId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetItem([FromRoute] Guid itemId)
    {
        try
        {
            return OkResponse<object>(await service.GetItem(itemId), "Lay chi tiet item thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Tao moi item.
    /// </summary>
    /// <param name="request">Thong tin item can tao.</param>
    /// <returns>Id va ma item vua tao.</returns>
    [HttpPost("items")]
    public async Task<ActionResult<ApiResponse<object>>> CreateItem([FromBody] CreateItemRequest request)
    {
        try
        {
            return OkResponse<object>(await service.CreateItem(request), "Tao item thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Cap nhat item.
    /// </summary>
    /// <param name="itemId">Dinh danh item.</param>
    /// <param name="request">Thong tin item cap nhat.</param>
    /// <returns>Ket qua cap nhat.</returns>
    [HttpPut("items/{itemId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateItem([FromRoute] Guid itemId, [FromBody] UpdateItemRequest request)
    {
        try
        {
            return OkResponse<object>(await service.UpdateItem(itemId, request), "Cap nhat item thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Xoa item (soft delete theo nghiep vu).
    /// </summary>
    /// <param name="itemId">Dinh danh item.</param>
    /// <returns>Ket qua xoa item.</returns>
    [HttpDelete("items/{itemId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteItem([FromRoute] Guid itemId)
    {
        try
        {
            return OkResponse<object>(await service.DeleteItem(itemId), "Xoa item thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay danh sach lot cua item.
    /// </summary>
    /// <param name="itemId">Loc theo item.</param>
    /// <param name="statusCode">Loc theo trang thai lot.</param>
    /// <param name="keyword">Tu khoa tim lot.</param>
    /// <returns>Danh sach lot.</returns>
    [HttpGet("lots")]
    public async Task<ActionResult<ApiResponse<object>>> ListLots([FromQuery] Guid? itemId, [FromQuery] string? statusCode, [FromQuery] string? keyword)
        => OkResponse<object>(await service.ListLots(itemId, statusCode, keyword), "Lay danh sach lot thanh cong");

    /// <summary>
    /// Lay chi tiet lot.
    /// </summary>
    /// <param name="lotId">Dinh danh lot.</param>
    /// <returns>Thong tin lot.</returns>
    [HttpGet("lots/{lotId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetLot([FromRoute] Guid lotId)
    {
        try
        {
            return OkResponse<object>(await service.GetLot(lotId), "Lay chi tiet lot thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Tao moi lot.
    /// </summary>
    /// <param name="request">Thong tin lot can tao.</param>
    /// <returns>Id va lotNo vua tao.</returns>
    [HttpPost("lots")]
    public async Task<ActionResult<ApiResponse<object>>> CreateLot([FromBody] CreateLotRequest request)
    {
        try
        {
            return OkResponse<object>(await service.CreateLot(request), "Tao lot thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Cap nhat lot.
    /// </summary>
    /// <param name="lotId">Dinh danh lot.</param>
    /// <param name="request">Thong tin cap nhat lot.</param>
    /// <returns>Ket qua cap nhat.</returns>
    [HttpPut("lots/{lotId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateLot([FromRoute] Guid lotId, [FromBody] UpdateLotRequest request)
    {
        try
        {
            return OkResponse<object>(await service.UpdateLot(lotId, request), "Cap nhat lot thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Xoa lot.
    /// </summary>
    /// <param name="lotId">Dinh danh lot.</param>
    /// <returns>Ket qua xoa lot.</returns>
    [HttpDelete("lots/{lotId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteLot([FromRoute] Guid lotId)
    {
        try
        {
            return OkResponse<object>(await service.DeleteLot(lotId), "Xoa lot thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay danh sach giao dich kho.
    /// </summary>
    /// <param name="warehouseId">Loc theo kho.</param>
    /// <param name="transactionTypeCode">Loai giao dich (RECEIPT/ISSUE).</param>
    /// <param name="page">Trang hien tai.</param>
    /// <param name="pageSize">Kich thuoc trang.</param>
    /// <returns>Danh sach giao dich kho co phan trang.</returns>
    [HttpGet("stock-transactions")]
    public async Task<ActionResult<ApiResponse<object>>> ListStockTransactions(
        [FromQuery] Guid? warehouseId,
        [FromQuery] string? transactionTypeCode,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
        => OkResponse<object>(await service.ListStockTransactions(warehouseId, transactionTypeCode, page, pageSize), "Lay danh sach giao dich kho thanh cong");

    /// <summary>
    /// Lay chi tiet mot giao dich kho.
    /// </summary>
    /// <param name="stockTransactionId">Dinh danh giao dich kho.</param>
    /// <returns>Thong tin giao dich kho va danh sach line.</returns>
    [HttpGet("stock-transactions/{stockTransactionId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetStockTransaction([FromRoute] Guid stockTransactionId)
    {
        try
        {
            return OkResponse<object>(await service.GetStockTransaction(stockTransactionId), "Lay chi tiet giao dich kho thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Tao moi giao dich kho (nhap/xuat).
    /// </summary>
    /// <param name="request">Thong tin giao dich va cac line chi tiet.</param>
    /// <returns>Id va ma giao dich kho vua tao.</returns>
    [HttpPost("stock-transactions")]
    public async Task<ActionResult<ApiResponse<object>>> CreateStockTransaction([FromBody] CreateStockTransactionRequest request)
    {
        try
        {
            return OkResponse<object>(await service.CreateStockTransaction(request), "Tao giao dich kho thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay danh sach phieu cap phat.
    /// </summary>
    /// <param name="campaignId">Loc theo chien dich.</param>
    /// <param name="reliefPointId">Loc theo diem cuu tro.</param>
    /// <param name="statusCode">Loc theo trang thai phieu cap phat.</param>
    /// <param name="page">Trang hien tai.</param>
    /// <param name="pageSize">Kich thuoc trang.</param>
    /// <returns>Danh sach phieu cap phat co phan trang.</returns>
    [HttpGet("relief-issues")]
    public async Task<ActionResult<ApiResponse<object>>> ListReliefIssues(
        [FromQuery] Guid? campaignId,
        [FromQuery] Guid? reliefPointId,
        [FromQuery] string? statusCode,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
        => OkResponse<object>(await service.ListReliefIssues(campaignId, reliefPointId, statusCode, page, pageSize), "Lay danh sach phieu cap phat thanh cong");

    /// <summary>
    /// Lay chi tiet phieu cap phat.
    /// </summary>
    /// <param name="reliefIssueId">Dinh danh phieu cap phat.</param>
    /// <returns>Thong tin phieu cap phat va danh sach line.</returns>
    [HttpGet("relief-issues/{reliefIssueId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetReliefIssue([FromRoute] Guid reliefIssueId)
    {
        try
        {
            return OkResponse<object>(await service.GetReliefIssue(reliefIssueId), "Lay chi tiet phieu cap phat thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Tao phieu cap phat tu kho den diem cuu tro.
    /// </summary>
    /// <param name="request">Thong tin cap phat va danh sach hang cap.</param>
    /// <returns>Id, ma phieu cap phat va ma giao dich kho lien quan.</returns>
    [HttpPost("relief-issues")]
    public async Task<ActionResult<ApiResponse<object>>> CreateReliefIssue([FromBody] CreateReliefIssueRequest request)
    {
        try
        {
            return OkResponse<object>(await service.CreateReliefIssue(request), "Tao phieu cap phat thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay danh sach ho dan nhan cuu tro.
    /// </summary>
    /// <param name="keyword">Tu khoa tim theo ma/ten chu ho/sdt/dia chi.</param>
    /// <param name="adminAreaId">Loc theo don vi hanh chinh.</param>
    /// <param name="page">Trang hien tai.</param>
    /// <param name="pageSize">Kich thuoc trang.</param>
    /// <returns>Danh sach ho dan co phan trang.</returns>
    [HttpGet("households")]
    public async Task<ActionResult<ApiResponse<object>>> ListHouseholds(
        [FromQuery] string? keyword,
        [FromQuery] Guid? adminAreaId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
        => OkResponse<object>(await service.ListHouseholds(keyword, adminAreaId, page, pageSize), "Lay danh sach ho dan thanh cong");

    /// <summary>
    /// Lay chi tiet mot ho dan.
    /// </summary>
    /// <param name="householdId">Dinh danh ho dan.</param>
    /// <returns>Thong tin chi tiet ho dan.</returns>
    [HttpGet("households/{householdId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetHousehold([FromRoute] Guid householdId)
    {
        try
        {
            return OkResponse<object>(await service.GetHousehold(householdId), "Lay chi tiet ho dan thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Tao moi ho dan phuc vu nghiep vu phan phoi cuu tro.
    /// </summary>
    /// <param name="request">Thong tin ho dan can tao.</param>
    /// <returns>Id va ma ho dan vua tao.</returns>
    [HttpPost("households")]
    public async Task<ActionResult<ApiResponse<object>>> CreateHousehold([FromBody] CreateHouseholdRequest request)
    {
        try
        {
            return OkResponse<object>(await service.CreateHousehold(request), "Tao ho dan thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Cap nhat ho so ho dan.
    /// </summary>
    /// <param name="householdId">Dinh danh ho dan.</param>
    /// <param name="request">Thong tin cap nhat ho dan.</param>
    /// <returns>Ket qua cap nhat.</returns>
    [HttpPut("households/{householdId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateHousehold([FromRoute] Guid householdId, [FromBody] UpdateHouseholdRequest request)
    {
        try
        {
            return OkResponse<object>(await service.UpdateHousehold(householdId, request), "Cap nhat ho dan thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Xoa ho dan.
    /// </summary>
    /// <param name="householdId">Dinh danh ho dan.</param>
    /// <returns>Ket qua xoa ho dan.</returns>
    [HttpDelete("households/{householdId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteHousehold([FromRoute] Guid householdId)
    {
        try
        {
            return OkResponse<object>(await service.DeleteHousehold(householdId), "Xoa ho dan thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay danh sach phieu phan phoi.
    /// </summary>
    /// <param name="campaignId">Loc theo chien dich.</param>
    /// <param name="reliefPointId">Loc theo diem cuu tro.</param>
    /// <param name="statusCode">Loc theo trang thai phieu phan phoi.</param>
    /// <param name="page">Trang hien tai.</param>
    /// <param name="pageSize">Kich thuoc trang.</param>
    /// <returns>Danh sach phieu phan phoi co phan trang.</returns>
    [HttpGet("distributions")]
    public async Task<ActionResult<ApiResponse<object>>> ListDistributions(
        [FromQuery] Guid? campaignId,
        [FromQuery] Guid? reliefPointId,
        [FromQuery] string? statusCode,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
        => OkResponse<object>(await service.ListDistributions(campaignId, reliefPointId, statusCode, page, pageSize), "Lay danh sach phan phoi thanh cong");

    /// <summary>
    /// Lay chi tiet phieu phan phoi.
    /// </summary>
    /// <param name="distributionId">Dinh danh phieu phan phoi.</param>
    /// <returns>Thong tin phieu phan phoi, line va ACK.</returns>
    [HttpGet("distributions/{distributionId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetDistribution([FromRoute] Guid distributionId)
    {
        try
        {
            return OkResponse<object>(await service.GetDistribution(distributionId), "Lay chi tiet phan phoi thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Tao phieu phan phoi cuu tro cho ho dan.
    /// </summary>
    /// <param name="request">Thong tin phan phoi va danh sach hang cap.</param>
    /// <returns>Phieu phan phoi vua tao va ma ACK (neu co).</returns>
    [HttpPost("distributions")]
    public async Task<ActionResult<ApiResponse<object>>> CreateDistribution([FromBody] CreateDistributionRequest request)
    {
        try
        {
            return OkResponse<object>(await service.CreateDistribution(request), "Tao phieu phan phoi thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Xac nhan da nhan phan phoi.
    /// </summary>
    /// <param name="distributionId">Dinh danh phieu phan phoi.</param>
    /// <param name="request">Thong tin ACK.</param>
    /// <returns>Ket qua xac nhan nhan hang.</returns>
    [HttpPost("distributions/{distributionId:guid}/ack")]
    public async Task<ActionResult<ApiResponse<object>>> AckDistribution([FromRoute] Guid distributionId, [FromBody] DistributionAckRequest request)
    {
        try
        {
            return OkResponse<object>(await service.AckDistribution(distributionId, request), "Xac nhan phan phoi thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }
}