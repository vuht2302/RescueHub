using RescueHub.Modules.Admin.Infrastructure;

namespace RescueHub.Modules.Admin.Application;

public sealed class AdminService(IAdminRepository repository) : IAdminService
{
    public async Task<object> ListUsers(string? keyword, bool? isActive, string? roleCode, int page, int pageSize)
        => await repository.ListUsers(keyword, isActive, roleCode, page, pageSize);

    public async Task<object> GetUser(Guid userId)
        => await repository.GetUser(userId);

    public async Task<object> CreateUser(CreateAdminUserRequest request)
        => await repository.CreateUser(request);

    public async Task<object> UpdateUser(Guid userId, UpdateAdminUserRequest request)
        => await repository.UpdateUser(userId, request);

    public async Task<object> UpdateUserRoles(Guid userId, UpdateUserRolesRequest request)
        => await repository.UpdateUserRoles(userId, request);

    public async Task<object> ListRoles(string? keyword)
        => await repository.ListRoles(keyword);

    public async Task<object> GetRole(Guid roleId)
        => await repository.GetRole(roleId);

    public async Task<object> CreateRole(CreateRoleRequest request)
        => await repository.CreateRole(request);

    public async Task<object> UpdateRole(Guid roleId, UpdateRoleRequest request)
        => await repository.UpdateRole(roleId, request);

    public async Task<object> DeleteRole(Guid roleId)
        => await repository.DeleteRole(roleId);

    public Task<object> GetAllCatalogs(string? keyword)
        => repository.GetAllCatalogs(keyword);

    public Task<object> ListCatalogItems(string catalogType, string? keyword)
        => repository.ListCatalogItems(catalogType, keyword);

    public Task<object> CreateCatalogItem(string catalogType, UpsertCatalogItemRequest request)
        => repository.CreateCatalogItem(catalogType, request);

    public Task<object> UpdateCatalogItem(string catalogType, Guid itemId, UpsertCatalogItemRequest request)
        => repository.UpdateCatalogItem(catalogType, itemId, request);

    public Task<object> DeleteCatalogItem(string catalogType, Guid itemId)
        => repository.DeleteCatalogItem(catalogType, itemId);

    public async Task<object> GetWorkflow(string entityType)
        => await repository.GetWorkflow(entityType);

    public async Task<object> GetSystemSettings()
        => await repository.GetSystemSettings();

    public async Task<object> UpdateSystemSettings(UpdateSystemSettingsRequest request)
        => await repository.UpdateSystemSettings(request);

    public async Task<object> GetOverviewReport(DateTime? fromDateUtc, DateTime? toDateUtc)
        => await repository.GetOverviewReport(fromDateUtc, toDateUtc);

    public async Task<object> GetIncidentsByStatusReport(DateTime? fromDateUtc, DateTime? toDateUtc)
        => await repository.GetIncidentsByStatusReport(fromDateUtc, toDateUtc);

    public async Task<object> GetMissionsByStatusReport(DateTime? fromDateUtc, DateTime? toDateUtc)
        => await repository.GetMissionsByStatusReport(fromDateUtc, toDateUtc);

    public async Task<object> GetReliefByStatusReport(DateTime? fromDateUtc, DateTime? toDateUtc)
        => await repository.GetReliefByStatusReport(fromDateUtc, toDateUtc);

    public async Task<object> GetHotspotsReport(DateTime? fromDateUtc, DateTime? toDateUtc, int topN)
        => await repository.GetHotspotsReport(fromDateUtc, toDateUtc, topN);
}
