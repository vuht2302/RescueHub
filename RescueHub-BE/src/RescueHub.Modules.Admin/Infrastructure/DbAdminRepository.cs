using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using RescueHub.Modules.Admin.Application;
using RescueHub.Persistence;
using RescueHub.Persistence.Entities.Scaffolded;

namespace RescueHub.Modules.Admin.Infrastructure;

public sealed class DbAdminRepository(
    RescueHubDbContext dbContext,
    IConfiguration configuration,
    IDistributedCache distributedCache) : IAdminRepository
{
    private const string SystemSettingsCacheKey = "admin:system-settings:v1";

    private sealed record RuntimeSettings(
        int OtpTtlMinutes,
        int AccessTokenExpiryMinutes,
        int RefreshTokenExpiryHours,
        int PublicMapCacheSeconds,
        string PublicHotline,
        DateTime UpdatedAtUtc);

    public async Task<object> ListUsers(string? keyword, bool? isActive, string? roleCode, int page, int pageSize)
    {
        var normalizedPage = page <= 0 ? 1 : page;
        var normalizedPageSize = pageSize <= 0 ? 20 : Math.Min(pageSize, 200);

        var query = dbContext.app_users
            .AsNoTracking()
            .Include(x => x.app_user_roles)
            .ThenInclude(x => x.role)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var normalized = keyword.Trim();
            query = query.Where(x =>
                x.username.Contains(normalized) ||
                x.display_name.Contains(normalized) ||
                (x.phone != null && x.phone.Contains(normalized)) ||
                (x.email != null && x.email.Contains(normalized)));
        }

        if (isActive.HasValue)
        {
            query = query.Where(x => x.is_active == isActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(roleCode))
        {
            var normalizedRoleCode = roleCode.Trim().ToUpperInvariant();
            query = query.Where(x => x.app_user_roles.Any(ur => ur.role.code == normalizedRoleCode));
        }

        var totalItems = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.created_at)
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .Select(x => new
            {
                id = x.id,
                username = x.username,
                displayName = x.display_name,
                phone = x.phone,
                email = x.email,
                isActive = x.is_active,
                lastLoginAt = x.last_login_at,
                createdAt = x.created_at,
                updatedAt = x.updated_at,
                roles = x.app_user_roles
                    .OrderBy(ur => ur.role.code)
                    .Select(ur => new
                    {
                        id = ur.role.id,
                        code = ur.role.code,
                        name = ur.role.name
                    })
                    .ToArray()
            })
            .ToListAsync();

        var totalPages = totalItems == 0
            ? 0
            : (int)Math.Ceiling(totalItems / (double)normalizedPageSize);

        return new
        {
            items,
            page = normalizedPage,
            pageSize = normalizedPageSize,
            totalItems,
            totalPages
        };
    }

    public async Task<object> GetUser(Guid userId)
    {
        var user = await dbContext.app_users
            .AsNoTracking()
            .Include(x => x.app_user_roles)
            .ThenInclude(x => x.role)
            .FirstOrDefaultAsync(x => x.id == userId);

        if (user is null)
        {
            throw new InvalidOperationException("Khong tim thay user.");
        }

        return new
        {
            id = user.id,
            username = user.username,
            displayName = user.display_name,
            phone = user.phone,
            email = user.email,
            isActive = user.is_active,
            lastLoginAt = user.last_login_at,
            createdAt = user.created_at,
            updatedAt = user.updated_at,
            roles = user.app_user_roles
                .OrderBy(x => x.role.code)
                .Select(x => new
                {
                    id = x.role.id,
                    code = x.role.code,
                    name = x.role.name,
                    assignedAt = x.assigned_at
                })
                .ToArray()
        };
    }

    public async Task<object> CreateUser(CreateAdminUserRequest request)
    {
        ValidateCreateUserRequest(request);

        var normalizedUsername = request.Username.Trim();
        var normalizedPhone = NormalizeOptional(request.Phone);
        var normalizedEmail = NormalizeOptional(request.Email);

        await EnsureUserUniqueness(null, normalizedUsername, normalizedPhone, normalizedEmail);

        var roleIds = await ResolveRoleIds(request.RoleCodes);

        var now = DateTime.UtcNow;
        var user = new app_user
        {
            id = Guid.NewGuid(),
            username = normalizedUsername,
            display_name = request.DisplayName.Trim(),
            phone = normalizedPhone,
            email = normalizedEmail,
            password_hash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            password_hash_algo = "BCrypt",
            is_active = request.IsActive,
            created_at = now,
            updated_at = now
        };

        dbContext.app_users.Add(user);

        foreach (var roleId in roleIds)
        {
            dbContext.app_user_roles.Add(new app_user_role
            {
                user_id = user.id,
                role_id = roleId,
                assigned_at = now
            });
        }

        await dbContext.SaveChangesAsync();

        return new
        {
            userId = user.id
        };
    }

    public async Task<object> UpdateUser(Guid userId, UpdateAdminUserRequest request)
    {
        ValidateUpdateUserRequest(request);

        var user = await dbContext.app_users.FirstOrDefaultAsync(x => x.id == userId);
        if (user is null)
        {
            throw new InvalidOperationException("Khong tim thay user.");
        }

        var normalizedUsername = request.Username.Trim();
        var normalizedPhone = NormalizeOptional(request.Phone);
        var normalizedEmail = NormalizeOptional(request.Email);

        await EnsureUserUniqueness(userId, normalizedUsername, normalizedPhone, normalizedEmail);

        user.username = normalizedUsername;
        user.display_name = request.DisplayName.Trim();
        user.phone = normalizedPhone;
        user.email = normalizedEmail;
        user.is_active = request.IsActive;

        if (!string.IsNullOrWhiteSpace(request.NewPassword))
        {
            user.password_hash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword.Trim());
            user.password_hash_algo = "BCrypt";
        }

        user.updated_at = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return new
        {
            userId = user.id,
            updatedAt = user.updated_at
        };
    }

    public async Task<object> UpdateUserRoles(Guid userId, UpdateUserRolesRequest request)
    {
        if (request.RoleCodes is null || request.RoleCodes.Length == 0)
        {
            throw new InvalidOperationException("RoleCodes khong duoc rong.");
        }

        var userExists = await dbContext.app_users.AnyAsync(x => x.id == userId);
        if (!userExists)
        {
            throw new InvalidOperationException("Khong tim thay user.");
        }

        var roleIds = await ResolveRoleIds(request.RoleCodes);

        var existingUserRoles = await dbContext.app_user_roles
            .Where(x => x.user_id == userId)
            .ToListAsync();

        dbContext.app_user_roles.RemoveRange(existingUserRoles);

        var now = DateTime.UtcNow;
        foreach (var roleId in roleIds)
        {
            dbContext.app_user_roles.Add(new app_user_role
            {
                user_id = userId,
                role_id = roleId,
                assigned_at = now
            });
        }

        await dbContext.SaveChangesAsync();

        return new
        {
            userId,
            roleIds,
            updatedAt = now
        };
    }

    public async Task<object> ListRoles(string? keyword)
    {
        var query = dbContext.app_roles
            .AsNoTracking()
            .Include(x => x.app_user_roles)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var normalized = keyword.Trim();
            query = query.Where(x => x.code.Contains(normalized) || x.name.Contains(normalized));
        }

        var items = await query
            .OrderBy(x => x.code)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                name = x.name,
                description = x.description,
                assignedUserCount = x.app_user_roles.Count
            })
            .ToListAsync();

        return new { items };
    }

    public async Task<object> GetRole(Guid roleId)
    {
        var role = await dbContext.app_roles
            .AsNoTracking()
            .Include(x => x.app_user_roles)
            .FirstOrDefaultAsync(x => x.id == roleId);

        if (role is null)
        {
            throw new InvalidOperationException("Khong tim thay role.");
        }

        return new
        {
            id = role.id,
            code = role.code,
            name = role.name,
            description = role.description,
            assignedUserCount = role.app_user_roles.Count
        };
    }

    public async Task<object> CreateRole(CreateRoleRequest request)
    {
        ValidateRole(request.Code, request.Name);

        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        var normalizedName = request.Name.Trim();

        var duplicateExists = await dbContext.app_roles
            .AnyAsync(x => x.code == normalizedCode || x.name == normalizedName);

        if (duplicateExists)
        {
            throw new InvalidOperationException("Role code hoac role name da ton tai.");
        }

        var role = new app_role
        {
            id = Guid.NewGuid(),
            code = normalizedCode,
            name = normalizedName,
            description = NormalizeOptional(request.Description)
        };

        dbContext.app_roles.Add(role);
        await dbContext.SaveChangesAsync();

        return new { roleId = role.id };
    }

    public async Task<object> UpdateRole(Guid roleId, UpdateRoleRequest request)
    {
        ValidateRole(request.Code, request.Name);

        var role = await dbContext.app_roles.FirstOrDefaultAsync(x => x.id == roleId);
        if (role is null)
        {
            throw new InvalidOperationException("Khong tim thay role.");
        }

        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        var normalizedName = request.Name.Trim();

        var duplicateExists = await dbContext.app_roles
            .AnyAsync(x => x.id != roleId && (x.code == normalizedCode || x.name == normalizedName));

        if (duplicateExists)
        {
            throw new InvalidOperationException("Role code hoac role name da ton tai.");
        }

        role.code = normalizedCode;
        role.name = normalizedName;
        role.description = NormalizeOptional(request.Description);

        await dbContext.SaveChangesAsync();

        return new { roleId = role.id };
    }

    public async Task<object> DeleteRole(Guid roleId)
    {
        var role = await dbContext.app_roles.FirstOrDefaultAsync(x => x.id == roleId);
        if (role is null)
        {
            throw new InvalidOperationException("Khong tim thay role.");
        }

        var assignedCount = await dbContext.app_user_roles.CountAsync(x => x.role_id == roleId);
        if (assignedCount > 0)
        {
            throw new InvalidOperationException("Role dang duoc gan cho user, khong the xoa.");
        }

        dbContext.app_roles.Remove(role);
        await dbContext.SaveChangesAsync();

        return new { roleId };
    }

    public async Task<object> GetAllCatalogs(string? keyword)
    {
        var normalized = string.IsNullOrWhiteSpace(keyword) ? null : keyword.Trim();

        var skillsQuery = dbContext.skills.AsNoTracking().AsQueryable();
        var vehicleTypesQuery = dbContext.vehicle_types.AsNoTracking().AsQueryable();
        var vehicleCapabilitiesQuery = dbContext.vehicle_capabilities.AsNoTracking().AsQueryable();
        var itemCategoriesQuery = dbContext.item_categories.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(normalized))
        {
            skillsQuery = skillsQuery.Where(x => x.code.Contains(normalized) || x.name.Contains(normalized));
            vehicleTypesQuery = vehicleTypesQuery.Where(x => x.code.Contains(normalized) || x.name.Contains(normalized));
            vehicleCapabilitiesQuery = vehicleCapabilitiesQuery.Where(x => x.code.Contains(normalized) || x.name.Contains(normalized));
            itemCategoriesQuery = itemCategoriesQuery.Where(x => x.code.Contains(normalized) || x.name.Contains(normalized));
        }

        var skills = await skillsQuery
            .OrderBy(x => x.code)
            .Select(x => new { id = x.id, code = x.code, name = x.name, description = x.description })
            .ToListAsync();

        var vehicleTypes = await vehicleTypesQuery
            .OrderBy(x => x.code)
            .Select(x => new { id = x.id, code = x.code, name = x.name, description = x.description })
            .ToListAsync();

        var vehicleCapabilities = await vehicleCapabilitiesQuery
            .OrderBy(x => x.code)
            .Select(x => new { id = x.id, code = x.code, name = x.name, description = x.description })
            .ToListAsync();

        var itemCategories = await itemCategoriesQuery
            .OrderBy(x => x.code)
            .Select(x => new { id = x.id, code = x.code, name = x.name, description = (string?)null })
            .ToListAsync();

        return new
        {
            skills,
            vehicleTypes,
            vehicleCapabilities,
            itemCategories
        };
    }

    public Task<object> ListCatalogItems(string catalogType, string? keyword)
    {
        var normalizedCatalogType = NormalizeCatalogType(catalogType);

        return normalizedCatalogType switch
        {
            "skills" => ListSkills(keyword),
            "vehicle-types" => ListVehicleTypes(keyword),
            "vehicle-capabilities" => ListVehicleCapabilities(keyword),
            "item-categories" => ListItemCategories(keyword),
            _ => throw new InvalidOperationException("Catalog type khong hop le.")
        };
    }

    public Task<object> CreateCatalogItem(string catalogType, UpsertCatalogItemRequest request)
    {
        var normalizedCatalogType = NormalizeCatalogType(catalogType);
        ValidateCatalogRequest(request, normalizedCatalogType != "item-categories");

        return normalizedCatalogType switch
        {
            "skills" => CreateSkill(request),
            "vehicle-types" => CreateVehicleType(request),
            "vehicle-capabilities" => CreateVehicleCapability(request),
            "item-categories" => CreateItemCategory(request),
            _ => throw new InvalidOperationException("Catalog type khong hop le.")
        };
    }

    public Task<object> UpdateCatalogItem(string catalogType, Guid itemId, UpsertCatalogItemRequest request)
    {
        var normalizedCatalogType = NormalizeCatalogType(catalogType);
        ValidateCatalogRequest(request, normalizedCatalogType != "item-categories");

        return normalizedCatalogType switch
        {
            "skills" => UpdateSkill(itemId, request),
            "vehicle-types" => UpdateVehicleType(itemId, request),
            "vehicle-capabilities" => UpdateVehicleCapability(itemId, request),
            "item-categories" => UpdateItemCategory(itemId, request),
            _ => throw new InvalidOperationException("Catalog type khong hop le.")
        };
    }

    public Task<object> DeleteCatalogItem(string catalogType, Guid itemId)
    {
        var normalizedCatalogType = NormalizeCatalogType(catalogType);

        return normalizedCatalogType switch
        {
            "skills" => DeleteSkill(itemId),
            "vehicle-types" => DeleteVehicleType(itemId),
            "vehicle-capabilities" => DeleteVehicleCapability(itemId),
            "item-categories" => DeleteItemCategory(itemId),
            _ => throw new InvalidOperationException("Catalog type khong hop le.")
        };
    }

    public async Task<object> GetWorkflow(string entityType)
    {
        var normalized = entityType.Trim().ToUpperInvariant();

        if (normalized is not ("INCIDENT" or "MISSION"))
        {
            throw new InvalidOperationException("Entity type workflow chi ho tro INCIDENT hoac MISSION.");
        }

        if (normalized == "INCIDENT")
        {
            var states = await dbContext.incidents
                .AsNoTracking()
                .Select(x => x.status_code)
                .Concat(dbContext.incident_status_histories.AsNoTracking().Select(x => x.to_status_code))
                .Concat(dbContext.incident_status_histories.AsNoTracking().Where(x => x.from_status_code != null).Select(x => x.from_status_code!))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            var transitions = await dbContext.incident_status_histories
                .AsNoTracking()
                .GroupBy(x => new { x.action_code, x.from_status_code, x.to_status_code })
                .OrderByDescending(x => x.Count())
                .Select(x => new
                {
                    actionCode = x.Key.action_code,
                    fromStateCode = x.Key.from_status_code,
                    toStateCode = x.Key.to_status_code,
                    usedCount = x.Count()
                })
                .ToListAsync();

            return new { entityType = normalized, states, transitions };
        }

        var missionStates = await dbContext.missions
            .AsNoTracking()
            .Select(x => x.status_code)
            .Concat(dbContext.mission_status_histories.AsNoTracking().Select(x => x.to_status_code))
            .Concat(dbContext.mission_status_histories.AsNoTracking().Where(x => x.from_status_code != null).Select(x => x.from_status_code!))
            .Distinct()
            .OrderBy(x => x)
            .ToListAsync();

        var missionTransitions = await dbContext.mission_status_histories
            .AsNoTracking()
            .GroupBy(x => new { x.action_code, x.from_status_code, x.to_status_code })
            .OrderByDescending(x => x.Count())
            .Select(x => new
            {
                actionCode = x.Key.action_code,
                fromStateCode = x.Key.from_status_code,
                toStateCode = x.Key.to_status_code,
                usedCount = x.Count()
            })
            .ToListAsync();

        return new { entityType = normalized, states = missionStates, transitions = missionTransitions };
    }

    public async Task<object> GetSystemSettings()
    {
        var runtimeSettings = await ResolveRuntimeSettings();

        return new
        {
            otpTtlMinutes = runtimeSettings.OtpTtlMinutes,
            accessTokenExpiryMinutes = runtimeSettings.AccessTokenExpiryMinutes,
            refreshTokenExpiryHours = runtimeSettings.RefreshTokenExpiryHours,
            publicMapCacheSeconds = runtimeSettings.PublicMapCacheSeconds,
            publicHotline = runtimeSettings.PublicHotline,
            updatedAt = runtimeSettings.UpdatedAtUtc
        };
    }

    public async Task<object> UpdateSystemSettings(UpdateSystemSettingsRequest request)
    {
        var current = await ResolveRuntimeSettings();

        var next = current with
        {
            OtpTtlMinutes = request.OtpTtlMinutes ?? current.OtpTtlMinutes,
            AccessTokenExpiryMinutes = request.AccessTokenExpiryMinutes ?? current.AccessTokenExpiryMinutes,
            RefreshTokenExpiryHours = request.RefreshTokenExpiryHours ?? current.RefreshTokenExpiryHours,
            PublicMapCacheSeconds = request.PublicMapCacheSeconds ?? current.PublicMapCacheSeconds,
            PublicHotline = string.IsNullOrWhiteSpace(request.PublicHotline) ? current.PublicHotline : request.PublicHotline.Trim(),
            UpdatedAtUtc = DateTime.UtcNow
        };

        if (next.OtpTtlMinutes <= 0 ||
            next.AccessTokenExpiryMinutes <= 0 ||
            next.RefreshTokenExpiryHours <= 0 ||
            next.PublicMapCacheSeconds <= 0)
        {
            throw new InvalidOperationException("Gia tri setting phai lon hon 0.");
        }

        var serialized = JsonSerializer.Serialize(next);
        await distributedCache.SetStringAsync(
            SystemSettingsCacheKey,
            serialized,
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(365)
            });

        return await GetSystemSettings();
    }

    public async Task<object> GetOverviewReport(DateTime? fromDateUtc, DateTime? toDateUtc)
    {
        var range = ResolveRange(fromDateUtc, toDateUtc);

        var incidentsQuery = dbContext.incidents
            .AsNoTracking()
            .Where(x => x.created_at >= range.From && x.created_at <= range.To);

        var missionsQuery = dbContext.missions
            .AsNoTracking()
            .Where(x => x.created_at >= range.From && x.created_at <= range.To);

        var reliefRequestsQuery = dbContext.relief_requests
            .AsNoTracking()
            .Where(x => x.created_at >= range.From && x.created_at <= range.To);

        var distributionsQuery = dbContext.distributions
            .AsNoTracking()
            .Where(x => x.created_at >= range.From && x.created_at <= range.To);

        var incidentsTotal = await incidentsQuery.CountAsync();
        var incidentsSos = await incidentsQuery.CountAsync(x => x.is_sos);
        var incidentsOpen = await incidentsQuery.CountAsync(x => x.status_code != "CLOSED" && x.status_code != "CANCELLED");

        var missionsTotal = await missionsQuery.CountAsync();
        var missionsInProgress = await missionsQuery.CountAsync(x =>
            x.status_code == "ASSIGNED" ||
            x.status_code == "ACCEPTED" ||
            x.status_code == "EN_ROUTE" ||
            x.status_code == "ON_SITE" ||
            x.status_code == "RESCUING" ||
            x.status_code == "NEED_SUPPORT");
        var missionsCompleted = await missionsQuery.CountAsync(x => x.status_code == "COMPLETED");

        var reliefRequestsTotal = await reliefRequestsQuery.CountAsync();
        var reliefRequestsPending = await reliefRequestsQuery.CountAsync(x => x.status_code == "NEW");
        var reliefRequestsApproved = await reliefRequestsQuery.CountAsync(x => x.status_code == "APPROVED");

        var distributionsTotal = await distributionsQuery.CountAsync();

        return new
        {
            period = new { fromDate = range.From, toDate = range.To },
            incidents = new
            {
                total = incidentsTotal,
                sos = incidentsSos,
                open = incidentsOpen
            },
            missions = new
            {
                total = missionsTotal,
                inProgress = missionsInProgress,
                completed = missionsCompleted
            },
            relief = new
            {
                requestsTotal = reliefRequestsTotal,
                pending = reliefRequestsPending,
                approved = reliefRequestsApproved,
                distributionsTotal
            }
        };
    }

    public async Task<object> GetIncidentsByStatusReport(DateTime? fromDateUtc, DateTime? toDateUtc)
    {
        var range = ResolveRange(fromDateUtc, toDateUtc);

        var items = await dbContext.incidents
            .AsNoTracking()
            .Where(x => x.created_at >= range.From && x.created_at <= range.To)
            .GroupBy(x => x.status_code)
            .Select(x => new
            {
                statusCode = x.Key,
                count = x.Count()
            })
            .OrderByDescending(x => x.count)
            .ToListAsync();

        return new
        {
            period = new { fromDate = range.From, toDate = range.To },
            items
        };
    }

    public async Task<object> GetMissionsByStatusReport(DateTime? fromDateUtc, DateTime? toDateUtc)
    {
        var range = ResolveRange(fromDateUtc, toDateUtc);

        var items = await dbContext.missions
            .AsNoTracking()
            .Where(x => x.created_at >= range.From && x.created_at <= range.To)
            .GroupBy(x => x.status_code)
            .Select(x => new
            {
                statusCode = x.Key,
                count = x.Count()
            })
            .OrderByDescending(x => x.count)
            .ToListAsync();

        return new
        {
            period = new { fromDate = range.From, toDate = range.To },
            items
        };
    }

    public async Task<object> GetReliefByStatusReport(DateTime? fromDateUtc, DateTime? toDateUtc)
    {
        var range = ResolveRange(fromDateUtc, toDateUtc);

        var requestItems = await dbContext.relief_requests
            .AsNoTracking()
            .Where(x => x.created_at >= range.From && x.created_at <= range.To)
            .GroupBy(x => x.status_code)
            .Select(x => new
            {
                statusCode = x.Key,
                count = x.Count()
            })
            .OrderByDescending(x => x.count)
            .ToListAsync();

        var distributionItems = await dbContext.distributions
            .AsNoTracking()
            .Where(x => x.created_at >= range.From && x.created_at <= range.To)
            .GroupBy(x => x.status_code)
            .Select(x => new
            {
                statusCode = x.Key,
                count = x.Count()
            })
            .OrderByDescending(x => x.count)
            .ToListAsync();

        return new
        {
            period = new { fromDate = range.From, toDate = range.To },
            requests = requestItems,
            distributions = distributionItems
        };
    }

    public async Task<object> GetHotspotsReport(DateTime? fromDateUtc, DateTime? toDateUtc, int topN)
    {
        var range = ResolveRange(fromDateUtc, toDateUtc);
        var normalizedTopN = topN <= 0 ? 10 : Math.Min(topN, 100);

        var grouped = await dbContext.incident_locations
            .AsNoTracking()
            .Where(x => x.incident.created_at >= range.From && x.incident.created_at <= range.To)
            .GroupBy(x => new { x.admin_area_id, x.address_text })
            .Select(x => new
            {
                adminAreaId = x.Key.admin_area_id,
                fallbackAddress = x.Key.address_text,
                incidentCount = x.Count()
            })
            .OrderByDescending(x => x.incidentCount)
            .Take(normalizedTopN)
            .ToListAsync();

        var areaIds = grouped
            .Where(x => x.adminAreaId.HasValue)
            .Select(x => x.adminAreaId!.Value)
            .Distinct()
            .ToArray();

        var areaLookup = await dbContext.admin_areas
            .AsNoTracking()
            .Where(x => areaIds.Contains(x.id))
            .ToDictionaryAsync(
                x => x.id,
                x => new { x.code, x.name, x.level_code });

        var items = grouped.Select(x =>
        {
            if (x.adminAreaId.HasValue && areaLookup.TryGetValue(x.adminAreaId.Value, out var area))
            {
                return new
                {
                    adminAreaId = x.adminAreaId,
                    adminAreaCode = (string?)area.code,
                    adminAreaName = (string?)area.name,
                    adminAreaLevelCode = (string?)area.level_code,
                    fallbackAddress = x.fallbackAddress,
                    incidentCount = x.incidentCount
                };
            }

            return new
            {
                adminAreaId = x.adminAreaId,
                adminAreaCode = (string?)null,
                adminAreaName = (string?)null,
                adminAreaLevelCode = (string?)null,
                fallbackAddress = x.fallbackAddress,
                incidentCount = x.incidentCount
            };
        }).ToArray();

        return new
        {
            period = new { fromDate = range.From, toDate = range.To },
            topN = normalizedTopN,
            items
        };
    }

    private async Task EnsureUserUniqueness(Guid? excludedUserId, string username, string? phone, string? email)
    {
        var duplicateUsername = await dbContext.app_users
            .AnyAsync(x => x.username == username && (!excludedUserId.HasValue || x.id != excludedUserId.Value));
        if (duplicateUsername)
        {
            throw new InvalidOperationException("Username da ton tai.");
        }

        if (!string.IsNullOrWhiteSpace(phone))
        {
            var duplicatePhone = await dbContext.app_users
                .AnyAsync(x => x.phone == phone && (!excludedUserId.HasValue || x.id != excludedUserId.Value));
            if (duplicatePhone)
            {
                throw new InvalidOperationException("So dien thoai da ton tai.");
            }
        }

        if (!string.IsNullOrWhiteSpace(email))
        {
            var duplicateEmail = await dbContext.app_users
                .AnyAsync(x => x.email == email && (!excludedUserId.HasValue || x.id != excludedUserId.Value));
            if (duplicateEmail)
            {
                throw new InvalidOperationException("Email da ton tai.");
            }
        }
    }

    private async Task<Guid[]> ResolveRoleIds(IEnumerable<string> roleCodes)
    {
        var normalizedRoleCodes = roleCodes
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim().ToUpperInvariant())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (normalizedRoleCodes.Length == 0)
        {
            throw new InvalidOperationException("RoleCodes khong duoc rong.");
        }

        var roles = await dbContext.app_roles
            .AsNoTracking()
            .Where(x => normalizedRoleCodes.Contains(x.code))
            .Select(x => new { x.id, x.code })
            .ToListAsync();

        if (roles.Count != normalizedRoleCodes.Length)
        {
            var existingCodes = roles.Select(x => x.code).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var missingCodes = normalizedRoleCodes.Where(x => !existingCodes.Contains(x)).ToArray();
            throw new InvalidOperationException($"Khong tim thay role: {string.Join(", ", missingCodes)}");
        }

        return roles.Select(x => x.id).ToArray();
    }

    private async Task<object> ListSkills(string? keyword)
    {
        var query = dbContext.skills.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var normalized = keyword.Trim();
            query = query.Where(x => x.code.Contains(normalized) || x.name.Contains(normalized));
        }

        var items = await query
            .OrderBy(x => x.code)
            .Select(x => new { id = x.id, code = x.code, name = x.name, description = x.description })
            .ToListAsync();

        return new { items };
    }

    private async Task<object> ListVehicleTypes(string? keyword)
    {
        var query = dbContext.vehicle_types.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var normalized = keyword.Trim();
            query = query.Where(x => x.code.Contains(normalized) || x.name.Contains(normalized));
        }

        var items = await query
            .OrderBy(x => x.code)
            .Select(x => new { id = x.id, code = x.code, name = x.name, description = x.description })
            .ToListAsync();

        return new { items };
    }

    private async Task<object> ListVehicleCapabilities(string? keyword)
    {
        var query = dbContext.vehicle_capabilities.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var normalized = keyword.Trim();
            query = query.Where(x => x.code.Contains(normalized) || x.name.Contains(normalized));
        }

        var items = await query
            .OrderBy(x => x.code)
            .Select(x => new { id = x.id, code = x.code, name = x.name, description = x.description })
            .ToListAsync();

        return new { items };
    }

    private async Task<object> ListItemCategories(string? keyword)
    {
        var query = dbContext.item_categories.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var normalized = keyword.Trim();
            query = query.Where(x => x.code.Contains(normalized) || x.name.Contains(normalized));
        }

        var items = await query
            .OrderBy(x => x.code)
            .Select(x => new { id = x.id, code = x.code, name = x.name, description = (string?)null })
            .ToListAsync();

        return new { items };
    }

    private async Task<object> CreateSkill(UpsertCatalogItemRequest request)
    {
        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        var normalizedName = request.Name.Trim();

        var exists = await dbContext.skills.AnyAsync(x => x.code == normalizedCode || x.name == normalizedName);
        if (exists)
        {
            throw new InvalidOperationException("Skill code hoac name da ton tai.");
        }

        var entity = new skill
        {
            id = Guid.NewGuid(),
            code = normalizedCode,
            name = normalizedName,
            description = NormalizeOptional(request.Description)
        };

        dbContext.skills.Add(entity);
        await dbContext.SaveChangesAsync();

        return new { itemId = entity.id };
    }

    private async Task<object> UpdateSkill(Guid itemId, UpsertCatalogItemRequest request)
    {
        var entity = await dbContext.skills.FirstOrDefaultAsync(x => x.id == itemId)
            ?? throw new InvalidOperationException("Khong tim thay skill.");

        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        var normalizedName = request.Name.Trim();

        var exists = await dbContext.skills.AnyAsync(x => x.id != itemId && (x.code == normalizedCode || x.name == normalizedName));
        if (exists)
        {
            throw new InvalidOperationException("Skill code hoac name da ton tai.");
        }

        entity.code = normalizedCode;
        entity.name = normalizedName;
        entity.description = NormalizeOptional(request.Description);

        await dbContext.SaveChangesAsync();
        return new { itemId = entity.id };
    }

    private async Task<object> DeleteSkill(Guid itemId)
    {
        var entity = await dbContext.skills.FirstOrDefaultAsync(x => x.id == itemId)
            ?? throw new InvalidOperationException("Khong tim thay skill.");

        var inUse = await dbContext.team_member_skills.AnyAsync(x => x.skill_id == itemId)
            || await dbContext.incident_requirement_skills.AnyAsync(x => x.skill_id == itemId);

        if (inUse)
        {
            throw new InvalidOperationException("Skill dang duoc su dung, khong the xoa.");
        }

        dbContext.skills.Remove(entity);
        await dbContext.SaveChangesAsync();

        return new { itemId };
    }

    private async Task<object> CreateVehicleType(UpsertCatalogItemRequest request)
    {
        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        var normalizedName = request.Name.Trim();

        var exists = await dbContext.vehicle_types.AnyAsync(x => x.code == normalizedCode || x.name == normalizedName);
        if (exists)
        {
            throw new InvalidOperationException("Vehicle type code hoac name da ton tai.");
        }

        var entity = new vehicle_type
        {
            id = Guid.NewGuid(),
            code = normalizedCode,
            name = normalizedName,
            description = NormalizeOptional(request.Description)
        };

        dbContext.vehicle_types.Add(entity);
        await dbContext.SaveChangesAsync();

        return new { itemId = entity.id };
    }

    private async Task<object> UpdateVehicleType(Guid itemId, UpsertCatalogItemRequest request)
    {
        var entity = await dbContext.vehicle_types.FirstOrDefaultAsync(x => x.id == itemId)
            ?? throw new InvalidOperationException("Khong tim thay vehicle type.");

        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        var normalizedName = request.Name.Trim();

        var exists = await dbContext.vehicle_types.AnyAsync(x => x.id != itemId && (x.code == normalizedCode || x.name == normalizedName));
        if (exists)
        {
            throw new InvalidOperationException("Vehicle type code hoac name da ton tai.");
        }

        entity.code = normalizedCode;
        entity.name = normalizedName;
        entity.description = NormalizeOptional(request.Description);

        await dbContext.SaveChangesAsync();
        return new { itemId = entity.id };
    }

    private async Task<object> DeleteVehicleType(Guid itemId)
    {
        var entity = await dbContext.vehicle_types.FirstOrDefaultAsync(x => x.id == itemId)
            ?? throw new InvalidOperationException("Khong tim thay vehicle type.");

        var inUse = await dbContext.vehicles.AnyAsync(x => x.vehicle_type_id == itemId);
        if (inUse)
        {
            throw new InvalidOperationException("Vehicle type dang duoc su dung, khong the xoa.");
        }

        dbContext.vehicle_types.Remove(entity);
        await dbContext.SaveChangesAsync();

        return new { itemId };
    }

    private async Task<object> CreateVehicleCapability(UpsertCatalogItemRequest request)
    {
        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        var normalizedName = request.Name.Trim();

        var exists = await dbContext.vehicle_capabilities.AnyAsync(x => x.code == normalizedCode || x.name == normalizedName);
        if (exists)
        {
            throw new InvalidOperationException("Vehicle capability code hoac name da ton tai.");
        }

        var entity = new vehicle_capability
        {
            id = Guid.NewGuid(),
            code = normalizedCode,
            name = normalizedName,
            description = NormalizeOptional(request.Description)
        };

        dbContext.vehicle_capabilities.Add(entity);
        await dbContext.SaveChangesAsync();

        return new { itemId = entity.id };
    }

    private async Task<object> UpdateVehicleCapability(Guid itemId, UpsertCatalogItemRequest request)
    {
        var entity = await dbContext.vehicle_capabilities.FirstOrDefaultAsync(x => x.id == itemId)
            ?? throw new InvalidOperationException("Khong tim thay vehicle capability.");

        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        var normalizedName = request.Name.Trim();

        var exists = await dbContext.vehicle_capabilities.AnyAsync(x => x.id != itemId && (x.code == normalizedCode || x.name == normalizedName));
        if (exists)
        {
            throw new InvalidOperationException("Vehicle capability code hoac name da ton tai.");
        }

        entity.code = normalizedCode;
        entity.name = normalizedName;
        entity.description = NormalizeOptional(request.Description);

        await dbContext.SaveChangesAsync();
        return new { itemId = entity.id };
    }

    private async Task<object> DeleteVehicleCapability(Guid itemId)
    {
        var entity = await dbContext.vehicle_capabilities.FirstOrDefaultAsync(x => x.id == itemId)
            ?? throw new InvalidOperationException("Khong tim thay vehicle capability.");

        var inUse = await dbContext.incident_requirement_vehicle_capabilities.AnyAsync(x => x.vehicle_capability_id == itemId)
            || await dbContext.vehicles.AnyAsync(x => x.vehicle_capabilities.Any(vc => vc.id == itemId));

        if (inUse)
        {
            throw new InvalidOperationException("Vehicle capability dang duoc su dung, khong the xoa.");
        }

        dbContext.vehicle_capabilities.Remove(entity);
        await dbContext.SaveChangesAsync();

        return new { itemId };
    }

    private async Task<object> CreateItemCategory(UpsertCatalogItemRequest request)
    {
        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        var normalizedName = request.Name.Trim();

        var exists = await dbContext.item_categories.AnyAsync(x => x.code == normalizedCode || x.name == normalizedName);
        if (exists)
        {
            throw new InvalidOperationException("Item category code hoac name da ton tai.");
        }

        var entity = new item_category
        {
            id = Guid.NewGuid(),
            code = normalizedCode,
            name = normalizedName
        };

        dbContext.item_categories.Add(entity);
        await dbContext.SaveChangesAsync();

        return new { itemId = entity.id };
    }

    private async Task<object> UpdateItemCategory(Guid itemId, UpsertCatalogItemRequest request)
    {
        var entity = await dbContext.item_categories.FirstOrDefaultAsync(x => x.id == itemId)
            ?? throw new InvalidOperationException("Khong tim thay item category.");

        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        var normalizedName = request.Name.Trim();

        var exists = await dbContext.item_categories.AnyAsync(x => x.id != itemId && (x.code == normalizedCode || x.name == normalizedName));
        if (exists)
        {
            throw new InvalidOperationException("Item category code hoac name da ton tai.");
        }

        entity.code = normalizedCode;
        entity.name = normalizedName;

        await dbContext.SaveChangesAsync();
        return new { itemId = entity.id };
    }

    private async Task<object> DeleteItemCategory(Guid itemId)
    {
        var entity = await dbContext.item_categories.FirstOrDefaultAsync(x => x.id == itemId)
            ?? throw new InvalidOperationException("Khong tim thay item category.");

        var inUse = await dbContext.items.AnyAsync(x => x.item_category_id == itemId);
        if (inUse)
        {
            throw new InvalidOperationException("Item category dang duoc su dung, khong the xoa.");
        }

        dbContext.item_categories.Remove(entity);
        await dbContext.SaveChangesAsync();

        return new { itemId };
    }

    private async Task<RuntimeSettings> ResolveRuntimeSettings()
    {
        var cached = await distributedCache.GetStringAsync(SystemSettingsCacheKey);
        if (!string.IsNullOrWhiteSpace(cached))
        {
            var parsed = JsonSerializer.Deserialize<RuntimeSettings>(cached);
            if (parsed is not null)
            {
                return parsed;
            }
        }

        var settings = new RuntimeSettings(
            OtpTtlMinutes: configuration.GetValue<int?>("Otp:TtlMinutes") ?? 5,
            AccessTokenExpiryMinutes: configuration.GetValue<int?>("Jwt:AccessTokenExpiryMinutes") ?? 60,
            RefreshTokenExpiryHours: configuration.GetValue<int?>("Jwt:RefreshTokenExpiryHours") ?? 168,
            PublicMapCacheSeconds: configuration.GetValue<int?>("Public:MapCacheSeconds") ?? 60,
            PublicHotline: configuration["Public:Hotline"] ?? "1900xxxx",
            UpdatedAtUtc: DateTime.UtcNow);

        return settings;
    }

    private static void ValidateCreateUserRequest(CreateAdminUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username))
        {
            throw new InvalidOperationException("Username khong duoc rong.");
        }

        if (string.IsNullOrWhiteSpace(request.DisplayName))
        {
            throw new InvalidOperationException("DisplayName khong duoc rong.");
        }

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Trim().Length < 6)
        {
            throw new InvalidOperationException("Password toi thieu 6 ky tu.");
        }

        if (request.RoleCodes is null || request.RoleCodes.Length == 0)
        {
            throw new InvalidOperationException("RoleCodes khong duoc rong.");
        }
    }

    private static void ValidateUpdateUserRequest(UpdateAdminUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username))
        {
            throw new InvalidOperationException("Username khong duoc rong.");
        }

        if (string.IsNullOrWhiteSpace(request.DisplayName))
        {
            throw new InvalidOperationException("DisplayName khong duoc rong.");
        }

        if (!string.IsNullOrWhiteSpace(request.NewPassword) && request.NewPassword.Trim().Length < 6)
        {
            throw new InvalidOperationException("NewPassword toi thieu 6 ky tu.");
        }
    }

    private static void ValidateRole(string code, string name)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new InvalidOperationException("Role code khong duoc rong.");
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new InvalidOperationException("Role name khong duoc rong.");
        }
    }

    private static void ValidateCatalogRequest(UpsertCatalogItemRequest request, bool requireDescription)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
        {
            throw new InvalidOperationException("Code khong duoc rong.");
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new InvalidOperationException("Name khong duoc rong.");
        }

        if (requireDescription && request.Description is not null && request.Description.Length > 1000)
        {
            throw new InvalidOperationException("Description qua dai.");
        }
    }

    private static string? NormalizeOptional(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }

    private static string NormalizeCatalogType(string catalogType)
    {
        if (string.IsNullOrWhiteSpace(catalogType))
        {
            throw new InvalidOperationException("Catalog type khong hop le.");
        }

        return catalogType.Trim().ToLowerInvariant();
    }

    private static (DateTime From, DateTime To) ResolveRange(DateTime? fromDateUtc, DateTime? toDateUtc)
    {
        var to = toDateUtc?.ToUniversalTime() ?? DateTime.UtcNow;
        var from = fromDateUtc?.ToUniversalTime() ?? to.AddDays(-30);

        if (from > to)
        {
            throw new InvalidOperationException("Khoang thoi gian khong hop le.");
        }

        return (from, to);
    }
}
