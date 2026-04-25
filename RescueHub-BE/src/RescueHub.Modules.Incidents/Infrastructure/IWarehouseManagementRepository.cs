using RescueHub.Modules.Incidents.Application;

namespace RescueHub.Modules.Incidents.Infrastructure;

public interface IWarehouseManagementRepository
{
    Task<object> GetManagerDashboard();

    Task<object> ListWarehouses(string? keyword, string? statusCode);

    Task<object> GetWarehouse(Guid warehouseId);

    Task<object> CreateWarehouse(CreateWarehouseRequest request);

    Task<object> UpdateWarehouse(Guid warehouseId, UpdateWarehouseRequest request);

    Task<object> DeleteWarehouse(Guid warehouseId);

    Task<object> ListStocks(Guid? warehouseId, Guid? itemId, string? lotNo, bool nearExpiry, int page, int pageSize);

    Task<object> ListItems(string? keyword, string? categoryCode, bool? isActive);

    Task<object> GetItemOptions();

    Task<object> GetItem(Guid itemId);

    Task<object> CreateItem(CreateItemRequest request);

    Task<object> UpdateItem(Guid itemId, UpdateItemRequest request);

    Task<object> DeleteItem(Guid itemId);

    Task<object> ListLots(Guid? itemId, string? statusCode, string? keyword);

    Task<object> GetLot(Guid lotId);

    Task<object> CreateLot(CreateLotRequest request);

    Task<object> UpdateLot(Guid lotId, UpdateLotRequest request);

    Task<object> DeleteLot(Guid lotId);

    Task<object> ListStockTransactions(Guid? warehouseId, string? transactionTypeCode, int page, int pageSize);

    Task<object> GetStockTransaction(Guid stockTransactionId);

    Task<object> CreateStockTransaction(CreateStockTransactionRequest request);

    Task<object> ListHouseholds(string? keyword, Guid? adminAreaId, int page, int pageSize);

    Task<object> GetHousehold(Guid householdId);

    Task<object> CreateHousehold(CreateHouseholdRequest request);

    Task<object> UpdateHousehold(Guid householdId, UpdateHouseholdRequest request);

    Task<object> DeleteHousehold(Guid householdId);

    Task<object> ListDistributions(Guid? campaignId, Guid? adminAreaId, string? statusCode, int page, int pageSize);

    Task<object> ListReliefCampaigns(string? keyword, string? statusCode);

    Task<object> GetReliefCampaign(Guid campaignId);

    Task<object> GetDistributionContextByCampaign(Guid campaignId);

    Task<object> CreateReliefCampaign(CreateReliefCampaignRequest request);

    Task<object> UpdateReliefCampaign(Guid campaignId, UpdateReliefCampaignRequest request);

    Task<object> DeleteReliefCampaign(Guid campaignId);

    Task<object> UpdateReliefRequestStatus(Guid reliefRequestId, UpdateReliefRequestStatusRequest request);

    Task<object> GetDistributionOptions();

    Task<object> ListReliefPoints(string? keyword, string? statusCode);

    Task<object> CreateReliefPoint(CreateReliefPointRequest request);

    Task<object> GetReliefPoint(Guid reliefPointId);

    Task<object> UpdateReliefPoint(Guid reliefPointId, UpdateReliefPointRequest request);

    Task<object> DeleteReliefPoint(Guid reliefPointId);

    Task<object> GetDistribution(Guid distributionId);

    Task<object> CreateDistribution(CreateDistributionRequest request);

    Task<object> AckDistribution(Guid distributionId, DistributionAckRequest request);
}
