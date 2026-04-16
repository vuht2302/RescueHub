namespace RescueHub.Modules.Admin.Application;

public sealed record CreateAdminUserRequest(
    string Username,
    string DisplayName,
    string? Phone,
    string? Email,
    string Password,
    bool IsActive,
    string[] RoleCodes);

public sealed record UpdateAdminUserRequest(
    string Username,
    string DisplayName,
    string? Phone,
    string? Email,
    bool IsActive,
    string? NewPassword);

public sealed record UpdateUserRolesRequest(string[] RoleCodes);

public sealed record CreateRoleRequest(string Code, string Name, string? Description);

public sealed record UpdateRoleRequest(string Code, string Name, string? Description);

public sealed record UpsertCatalogItemRequest(string Code, string Name, string? Description);

public sealed record UpdateSystemSettingsRequest(
    int? OtpTtlMinutes,
    int? AccessTokenExpiryMinutes,
    int? RefreshTokenExpiryHours,
    int? PublicMapCacheSeconds,
    string? PublicHotline);
