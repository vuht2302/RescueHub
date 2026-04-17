namespace RescueHub.Modules.Incidents.Application;

public interface IWarehouseManagementService
{
    Task<object> ListWarehouses(string? keyword, string? statusCode);

    Task<object> GetWarehouse(Guid warehouseId);

    Task<object> CreateWarehouse(CreateWarehouseRequest request);

    Task<object> UpdateWarehouse(Guid warehouseId, UpdateWarehouseRequest request);

    Task<object> DeleteWarehouse(Guid warehouseId);

    Task<object> ListStocks(Guid? warehouseId, Guid? itemId, string? lotNo, bool nearExpiry, int page, int pageSize);

    Task<object> ListItems(string? keyword, string? categoryCode, bool? isActive);

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

    Task<object> ListReliefIssues(Guid? campaignId, Guid? reliefPointId, string? statusCode, int page, int pageSize);

    Task<object> GetReliefIssue(Guid reliefIssueId);

    Task<object> CreateReliefIssue(CreateReliefIssueRequest request);

    Task<object> ListHouseholds(string? keyword, Guid? adminAreaId, int page, int pageSize);

    Task<object> GetHousehold(Guid householdId);

    Task<object> CreateHousehold(CreateHouseholdRequest request);

    Task<object> UpdateHousehold(Guid householdId, UpdateHouseholdRequest request);

    Task<object> DeleteHousehold(Guid householdId);

    Task<object> ListDistributions(Guid? campaignId, Guid? reliefPointId, string? statusCode, int page, int pageSize);

    Task<object> GetDistribution(Guid distributionId);

    Task<object> CreateDistribution(CreateDistributionRequest request);

    Task<object> AckDistribution(Guid distributionId, DistributionAckRequest request);
}