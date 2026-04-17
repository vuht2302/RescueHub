using RescueHub.Modules.Incidents.Infrastructure;

namespace RescueHub.Modules.Incidents.Application;

public sealed class WarehouseManagementService(IWarehouseManagementRepository repository) : IWarehouseManagementService
{
    public Task<object> ListWarehouses(string? keyword, string? statusCode) => repository.ListWarehouses(keyword, statusCode);

    public Task<object> GetWarehouse(Guid warehouseId) => repository.GetWarehouse(warehouseId);

    public Task<object> CreateWarehouse(CreateWarehouseRequest request) => repository.CreateWarehouse(request);

    public Task<object> UpdateWarehouse(Guid warehouseId, UpdateWarehouseRequest request) => repository.UpdateWarehouse(warehouseId, request);

    public Task<object> DeleteWarehouse(Guid warehouseId) => repository.DeleteWarehouse(warehouseId);

    public Task<object> ListStocks(Guid? warehouseId, Guid? itemId, string? lotNo, bool nearExpiry, int page, int pageSize)
        => repository.ListStocks(warehouseId, itemId, lotNo, nearExpiry, page, pageSize);

    public Task<object> ListItems(string? keyword, string? categoryCode, bool? isActive) => repository.ListItems(keyword, categoryCode, isActive);

    public Task<object> GetItem(Guid itemId) => repository.GetItem(itemId);

    public Task<object> CreateItem(CreateItemRequest request) => repository.CreateItem(request);

    public Task<object> UpdateItem(Guid itemId, UpdateItemRequest request) => repository.UpdateItem(itemId, request);

    public Task<object> DeleteItem(Guid itemId) => repository.DeleteItem(itemId);

    public Task<object> ListLots(Guid? itemId, string? statusCode, string? keyword) => repository.ListLots(itemId, statusCode, keyword);

    public Task<object> GetLot(Guid lotId) => repository.GetLot(lotId);

    public Task<object> CreateLot(CreateLotRequest request) => repository.CreateLot(request);

    public Task<object> UpdateLot(Guid lotId, UpdateLotRequest request) => repository.UpdateLot(lotId, request);

    public Task<object> DeleteLot(Guid lotId) => repository.DeleteLot(lotId);

    public Task<object> ListStockTransactions(Guid? warehouseId, string? transactionTypeCode, int page, int pageSize)
        => repository.ListStockTransactions(warehouseId, transactionTypeCode, page, pageSize);

    public Task<object> GetStockTransaction(Guid stockTransactionId) => repository.GetStockTransaction(stockTransactionId);

    public Task<object> CreateStockTransaction(CreateStockTransactionRequest request) => repository.CreateStockTransaction(request);

    public Task<object> ListReliefIssues(Guid? campaignId, Guid? reliefPointId, string? statusCode, int page, int pageSize)
        => repository.ListReliefIssues(campaignId, reliefPointId, statusCode, page, pageSize);

    public Task<object> GetReliefIssue(Guid reliefIssueId) => repository.GetReliefIssue(reliefIssueId);

    public Task<object> CreateReliefIssue(CreateReliefIssueRequest request) => repository.CreateReliefIssue(request);

    public Task<object> ListHouseholds(string? keyword, Guid? adminAreaId, int page, int pageSize)
        => repository.ListHouseholds(keyword, adminAreaId, page, pageSize);

    public Task<object> GetHousehold(Guid householdId) => repository.GetHousehold(householdId);

    public Task<object> CreateHousehold(CreateHouseholdRequest request) => repository.CreateHousehold(request);

    public Task<object> UpdateHousehold(Guid householdId, UpdateHouseholdRequest request) => repository.UpdateHousehold(householdId, request);

    public Task<object> DeleteHousehold(Guid householdId) => repository.DeleteHousehold(householdId);

    public Task<object> ListDistributions(Guid? campaignId, Guid? reliefPointId, string? statusCode, int page, int pageSize)
        => repository.ListDistributions(campaignId, reliefPointId, statusCode, page, pageSize);

    public Task<object> GetDistribution(Guid distributionId) => repository.GetDistribution(distributionId);

    public Task<object> CreateDistribution(CreateDistributionRequest request) => repository.CreateDistribution(request);

    public Task<object> AckDistribution(Guid distributionId, DistributionAckRequest request)
        => repository.AckDistribution(distributionId, request);
}