using RescueHub.Modules.Admin.Application;

namespace RescueHub.Modules.Admin.Infrastructure;

public interface IAdminRepository
{
    Task<object> ListUsers(string? keyword, bool? isActive, string? roleCode, int page, int pageSize);

    Task<object> GetUser(Guid userId);

    Task<object> CreateUser(CreateAdminUserRequest request);

    Task<object> UpdateUser(Guid userId, UpdateAdminUserRequest request);

    Task<object> UpdateUserRoles(Guid userId, UpdateUserRolesRequest request);

    Task<object> ListRoles(string? keyword);

    Task<object> GetRole(Guid roleId);

    Task<object> CreateRole(CreateRoleRequest request);

    Task<object> UpdateRole(Guid roleId, UpdateRoleRequest request);

    Task<object> DeleteRole(Guid roleId);

    Task<object> ListAdminAreas(string? keyword, string? levelCode, Guid? parentId, int page, int pageSize);

    Task<object> GetAdminArea(Guid adminAreaId);

    Task<object> CreateAdminArea(CreateAdminAreaRequest request);

    Task<object> UpdateAdminArea(Guid adminAreaId, UpdateAdminAreaRequest request);

    Task<object> DeleteAdminArea(Guid adminAreaId);

    Task<object> GetAllCatalogs(string? keyword);

    Task<object> ListCatalogItems(string catalogType, string? keyword);

    Task<object> CreateCatalogItem(string catalogType, UpsertCatalogItemRequest request);

    Task<object> UpdateCatalogItem(string catalogType, Guid itemId, UpsertCatalogItemRequest request);

    Task<object> DeleteCatalogItem(string catalogType, Guid itemId);

    Task<object> GetWorkflow(string entityType);

    Task<object> GetSystemSettings();

    Task<object> UpdateSystemSettings(UpdateSystemSettingsRequest request);

    Task<object> GetOverviewReport(DateTime? fromDateUtc, DateTime? toDateUtc);

    Task<object> GetIncidentsByStatusReport(DateTime? fromDateUtc, DateTime? toDateUtc);

    Task<object> GetMissionsByStatusReport(DateTime? fromDateUtc, DateTime? toDateUtc);

    Task<object> GetReliefByStatusReport(DateTime? fromDateUtc, DateTime? toDateUtc);

    Task<object> GetHotspotsReport(DateTime? fromDateUtc, DateTime? toDateUtc, int topN);
}
