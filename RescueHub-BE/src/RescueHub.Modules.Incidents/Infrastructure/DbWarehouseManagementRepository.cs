using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using RescueHub.Modules.Incidents.Application;
using RescueHub.Persistence;
using RescueHub.Persistence.Entities.Scaffolded;

namespace RescueHub.Modules.Incidents.Infrastructure;

public sealed class DbWarehouseManagementRepository(RescueHubDbContext dbContext) : IWarehouseManagementRepository
{
    private sealed record StockMovementLine(Guid ItemId, Guid? LotId, decimal Qty, string UnitCode);

    private static readonly HashSet<string> WarehouseStatusCodes = ["ACTIVE", "INACTIVE"];
    private static readonly HashSet<string> ItemUnitCodes = ["THUNG", "GOI", "CHAI", "SUAT", "KIT", "CAI"];
    private static readonly HashSet<string> IssuePolicyCodes = ["FIFO", "FEFO"];
    private static readonly HashSet<string> LotStatusCodes = ["AVAILABLE", "NEAR_EXPIRY", "EXPIRED", "QUARANTINED"];
    private static readonly HashSet<string> StockTransactionTypeCodes = ["RECEIPT", "ISSUE"];
    private static readonly HashSet<string> DistributionStatusCodes = ["PENDING", "COMPLETED", "CANCELLED"];
    private static readonly HashSet<string> ReliefPointStatusCodes = ["OPEN", "CLOSED", "PAUSED"];
    private static readonly HashSet<string> CampaignStatusCodes = ["PLANNED", "ACTIVE", "CLOSED", "CANCELLED"];
    private static readonly HashSet<string> AckMethodCodes = ["OTP", "MANUAL"];

    public async Task<object> GetManagerDashboard()
    {
        var todayUtc = DateTime.UtcNow.Date;

        var warehouseActiveCount = await dbContext.warehouses
            .AsNoTracking()
            .CountAsync(x => x.status_code == "ACTIVE");

        var campaignActiveCount = await dbContext.relief_campaigns
            .AsNoTracking()
            .CountAsync(x => x.status_code == "ACTIVE" || x.status_code == "PLANNED");

        var reliefPointOpenCount = await dbContext.relief_points
            .AsNoTracking()
            .CountAsync(x => x.status_code == "OPEN");

        var distributionPendingCount = await dbContext.distributions
            .AsNoTracking()
            .CountAsync(x => x.status_code == "PENDING");

        var distributionCompletedTodayCount = await dbContext.distributions
            .AsNoTracking()
            .CountAsync(x => x.status_code == "COMPLETED" && x.distribution_ack != null && x.distribution_ack.ack_at >= todayUtc);

        var reliefRequestPendingCount = await dbContext.relief_requests
            .AsNoTracking()
            .CountAsync(x => x.status_code == "NEW" || x.status_code == "APPROVED");

        var unresolvedStockAlertCount = await dbContext.stock_alerts
            .AsNoTracking()
            .CountAsync(x => !x.is_resolved);

        var totalOnHandQty = await dbContext.stock_balances
            .AsNoTracking()
            .SumAsync(x => x.qty_on_hand);

        var recentDistributions = await dbContext.distributions
            .AsNoTracking()
            .Include(x => x.campaign)
            .Include(x => x.relief_point!)
            .ThenInclude(x => x.admin_area)
            .OrderByDescending(x => x.created_at)
            .Take(5)
            .Select(x => new
            {
                distributionId = x.id,
                distributionCode = x.code,
                status = new { code = x.status_code, name = x.status_code, color = (string?)null },
                campaign = x.campaign == null ? null : new { id = x.campaign.id, code = x.campaign.code, name = x.campaign.name },
                adminArea = x.relief_point == null || x.relief_point.admin_area == null
                    ? null
                    : new { id = x.relief_point.admin_area.id, code = x.relief_point.admin_area.code, name = x.relief_point.admin_area.name },
                createdAt = x.created_at
            })
            .ToListAsync();

        return new
        {
            warehouseActiveCount,
            campaignActiveCount,
            reliefPointOpenCount,
            distributionPendingCount,
            distributionCompletedTodayCount,
            reliefRequestPendingCount,
            unresolvedStockAlertCount,
            totalOnHandQty,
            recentDistributions
        };
    }

    public async Task<object> ListWarehouses(string? keyword, string? statusCode)
    {
        var query = dbContext.warehouses
            .AsNoTracking()
            .Include(x => x.admin_area)
            .Include(x => x.manager_user)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var q = keyword.Trim();
            query = query.Where(x => x.code.Contains(q) || x.name.Contains(q) || x.address_text.Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            var normalized = NormalizeCode(statusCode);
            query = query.Where(x => x.status_code == normalized);
        }

        var items = await query
            .OrderBy(x => x.code)
            .Select(x => new
            {
                id = x.id,
                warehouseCode = x.code,
                warehouseName = x.name,
                status = new { code = x.status_code, name = x.status_code, color = (string?)null },
                address = x.address_text,
                location = ToLocationItem(x.geom),
                adminArea = x.admin_area == null ? null : new { id = x.admin_area.id, code = x.admin_area.code, name = x.admin_area.name },
                manager = x.manager_user == null ? null : new { id = x.manager_user.id, username = x.manager_user.username, displayName = x.manager_user.display_name },
                zoneCount = x.warehouse_zones.Count,
                stockLineCount = x.stock_balances.Count,
                createdAt = x.created_at
            })
            .ToListAsync();

        return new { items };
    }

    public async Task<object> GetWarehouse(Guid warehouseId)
    {
        var warehouse = await dbContext.warehouses
            .AsNoTracking()
            .Include(x => x.admin_area)
            .Include(x => x.manager_user)
            .FirstOrDefaultAsync(x => x.id == warehouseId);

        if (warehouse is null)
        {
            throw new InvalidOperationException("Khong tim thay kho.");
        }

        return new
        {
            id = warehouse.id,
            warehouseCode = warehouse.code,
            warehouseName = warehouse.name,
            status = new { code = warehouse.status_code, name = warehouse.status_code, color = (string?)null },
            address = warehouse.address_text,
            location = ToLocationItem(warehouse.geom),
            adminArea = warehouse.admin_area == null ? null : new { id = warehouse.admin_area.id, code = warehouse.admin_area.code, name = warehouse.admin_area.name },
            manager = warehouse.manager_user == null ? null : new { id = warehouse.manager_user.id, username = warehouse.manager_user.username, displayName = warehouse.manager_user.display_name },
            createdAt = warehouse.created_at
        };
    }

    public async Task<object> CreateWarehouse(CreateWarehouseRequest request)
    {
        var code = NormalizeCode(request.WarehouseCode);
        var name = NormalizeRequired(request.WarehouseName, nameof(request.WarehouseName));
        var address = NormalizeRequired(request.Address, nameof(request.Address));
        var status = NormalizeCode(request.StatusCode);
        var adminAreaId = await ResolveAdminAreaIdFromLocation(request.Location);
        EnsureAllowed(status, WarehouseStatusCodes, nameof(request.StatusCode));

        if (await dbContext.warehouses.AnyAsync(x => x.code == code))
        {
            throw new InvalidOperationException($"Ma kho da ton tai: {code}");
        }

        await EnsureUserExists(request.ManagerUserId);

        var entity = new warehouse
        {
            id = Guid.NewGuid(),
            code = code,
            name = name,
            admin_area_id = adminAreaId,
            address_text = address,
            geom = ToPointOrNull(request.Location),
            manager_user_id = request.ManagerUserId,
            status_code = status,
            created_at = DateTime.UtcNow
        };

        dbContext.warehouses.Add(entity);

        // Auto-create a default storage layout so manager flows can work without zone/bin setup.
        var defaultZone = new warehouse_zone
        {
            id = Guid.NewGuid(),
            warehouse_id = entity.id,
            code = "DEFAULT",
            name = "Mac dinh"
        };
        dbContext.warehouse_zones.Add(defaultZone);

        dbContext.warehouse_bins.Add(new warehouse_bin
        {
            id = Guid.NewGuid(),
            warehouse_zone_id = defaultZone.id,
            code = "DEFAULT",
            name = "Mac dinh"
        });

        await dbContext.SaveChangesAsync();

        return new { id = entity.id, warehouseCode = entity.code, createdAt = entity.created_at };
    }

    public async Task<object> UpdateWarehouse(Guid warehouseId, UpdateWarehouseRequest request)
    {
        var warehouse = await dbContext.warehouses.FirstOrDefaultAsync(x => x.id == warehouseId);
        if (warehouse is null)
        {
            throw new InvalidOperationException("Khong tim thay kho.");
        }

        var code = NormalizeCode(request.WarehouseCode);
        var name = NormalizeRequired(request.WarehouseName, nameof(request.WarehouseName));
        var address = NormalizeRequired(request.Address, nameof(request.Address));
        var status = NormalizeCode(request.StatusCode);
        var adminAreaId = await ResolveAdminAreaIdFromLocation(request.Location);
        EnsureAllowed(status, WarehouseStatusCodes, nameof(request.StatusCode));

        if (await dbContext.warehouses.AnyAsync(x => x.id != warehouseId && x.code == code))
        {
            throw new InvalidOperationException($"Ma kho da ton tai: {code}");
        }

        await EnsureUserExists(request.ManagerUserId);

        warehouse.code = code;
        warehouse.name = name;
        warehouse.admin_area_id = adminAreaId;
        warehouse.address_text = address;
        warehouse.geom = ToPointOrNull(request.Location);
        warehouse.manager_user_id = request.ManagerUserId;
        warehouse.status_code = status;

        await dbContext.SaveChangesAsync();
        return new { id = warehouse.id, updated = true };
    }

    public async Task<object> DeleteWarehouse(Guid warehouseId)
    {
        var warehouse = await dbContext.warehouses.FirstOrDefaultAsync(x => x.id == warehouseId);
        if (warehouse is null)
        {
            throw new InvalidOperationException("Khong tim thay kho.");
        }

        var hasStock = await dbContext.stock_balances.AnyAsync(x => x.warehouse_id == warehouseId && x.qty_on_hand > 0);
        if (hasStock)
        {
            throw new InvalidOperationException("Kho dang con ton kho, khong the xoa.");
        }

        var hasTransactions = await dbContext.stock_transactions.AnyAsync(x => x.warehouse_id == warehouseId);
        if (hasTransactions)
        {
            throw new InvalidOperationException("Kho da phat sinh giao dich kho, khong the xoa.");
        }

        var hasReliefIssues = await dbContext.relief_issues.AnyAsync(x => x.from_warehouse_id == warehouseId);
        if (hasReliefIssues)
        {
            throw new InvalidOperationException("Kho da phat sinh cap phat cuu tro, khong the xoa.");
        }

        dbContext.warehouses.Remove(warehouse);
        await dbContext.SaveChangesAsync();

        return new { id = warehouseId, deleted = true };
    }

    public async Task<object> ListStocks(Guid? warehouseId, Guid? itemId, string? lotNo, bool nearExpiry, int page, int pageSize)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var query = dbContext.stock_balances
            .AsNoTracking()
            .Include(x => x.warehouse)
            .Include(x => x.warehouse_bin)
            .ThenInclude(x => x.warehouse_zone)
            .Include(x => x.item)
            .Include(x => x.item_lot)
            .AsQueryable();

        if (warehouseId.HasValue)
        {
            query = query.Where(x => x.warehouse_id == warehouseId.Value);
        }

        if (itemId.HasValue)
        {
            query = query.Where(x => x.item_id == itemId.Value);
        }

        if (!string.IsNullOrWhiteSpace(lotNo))
        {
            var normalizedLot = lotNo.Trim().ToUpperInvariant();
            query = query.Where(x => x.item_lot.lot_no.ToUpper() == normalizedLot);
        }

        if (nearExpiry)
        {
            var now = DateOnly.FromDateTime(DateTime.UtcNow);
            var threshold = now.AddDays(30);
            query = query.Where(x => x.item_lot.exp_date != null && x.item_lot.exp_date >= now && x.item_lot.exp_date <= threshold);
        }

        var totalItems = await query.CountAsync();
        var items = await query
            .OrderBy(x => x.warehouse.code)
            .ThenBy(x => x.warehouse_bin.warehouse_zone.code)
            .ThenBy(x => x.warehouse_bin.code)
            .ThenBy(x => x.item.code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                id = x.id,
                warehouse = new { id = x.warehouse.id, code = x.warehouse.code, name = x.warehouse.name },
                item = new { id = x.item.id, code = x.item.code, name = x.item.name, unitCode = x.item.unit_code },
                qtyOnHand = x.qty_on_hand
            })
            .ToListAsync();

        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);

        return new
        {
            items,
            page,
            pageSize,
            totalItems,
            totalPages
        };
    }

    public async Task<object> ListItems(string? keyword, string? categoryCode, bool? isActive)
    {
        var query = dbContext.items
            .AsNoTracking()
            .Include(x => x.item_category)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var q = keyword.Trim();
            query = query.Where(x => x.code.Contains(q) || x.name.Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(categoryCode))
        {
            var normalized = NormalizeCode(categoryCode);
            query = query.Where(x => x.item_category.code == normalized);
        }

        if (isActive.HasValue)
        {
            query = query.Where(x => x.is_active == isActive.Value);
        }

        var items = await query
            .OrderBy(x => x.code)
            .Select(x => new
            {
                id = x.id,
                itemCode = x.code,
                itemName = x.name,
                itemCategoryCode = x.item_category.code,
                itemCategory = new { id = x.item_category.id, code = x.item_category.code, name = x.item_category.name },
                unitCode = x.unit_code,
                requiresLotTracking = x.requires_lot_tracking,
                requiresExpiryTracking = x.requires_expiry_tracking,
                issuePolicyCode = x.issue_policy_code,
                expDate = x.exp_date,
                receivedAt = x.received_at,
                isActive = x.is_active
            })
            .ToListAsync();

        return new { items };
    }

    public async Task<object> GetItemOptions()
    {
        var itemCategories = await dbContext.item_categories
            .AsNoTracking()
            .OrderBy(x => x.code)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                name = x.name
            })
            .ToListAsync();

        return new
        {
            itemCategories,
            unitCodes = ItemUnitCodes.Order().Select(x => new { code = x, name = x }).ToArray(),
            issuePolicyCodes = IssuePolicyCodes.Order().Select(x => new { code = x, name = x }).ToArray(),
            lotStatusCodes = LotStatusCodes.Order().Select(x => new { code = x, name = x }).ToArray()
        };
    }

    public async Task<object> GetItem(Guid itemId)
    {
        var item = await dbContext.items
            .AsNoTracking()
            .Include(x => x.item_category)
            .Include(x => x.item_lots)
            .FirstOrDefaultAsync(x => x.id == itemId);

        if (item is null)
        {
            throw new InvalidOperationException("Khong tim thay item.");
        }

        return new
        {
            id = item.id,
            itemCode = item.code,
            itemName = item.name,
            itemCategoryCode = item.item_category.code,
            itemCategory = new { id = item.item_category.id, code = item.item_category.code, name = item.item_category.name },
            unitCode = item.unit_code,
            requiresLotTracking = item.requires_lot_tracking,
            requiresExpiryTracking = item.requires_expiry_tracking,
            issuePolicyCode = item.issue_policy_code,
            expDate = item.exp_date,
            receivedAt = item.received_at,
            isActive = item.is_active
        };
    }

    public async Task<object> CreateItem(CreateItemRequest request)
    {
        var code = NormalizeCode(request.ItemCode);
        var name = NormalizeRequired(request.ItemName, nameof(request.ItemName));
        var categoryCode = NormalizeCode(request.ItemCategoryCode);
        var unitCode = NormalizeCode(request.UnitCode);
        var issuePolicyCode = NormalizeCode(request.IssuePolicyCode);

        EnsureAllowed(unitCode, ItemUnitCodes, nameof(request.UnitCode));
        EnsureAllowed(issuePolicyCode, IssuePolicyCodes, nameof(request.IssuePolicyCode));

        if (request.ExpDate.HasValue && request.ReceivedAt.HasValue && request.ExpDate.Value < DateOnly.FromDateTime(request.ReceivedAt.Value))
        {
            throw new InvalidOperationException("expDate khong duoc nho hon ngay receivedAt.");
        }

        if (await dbContext.items.AnyAsync(x => x.code == code))
        {
            throw new InvalidOperationException($"Ma item da ton tai: {code}");
        }

        var category = await dbContext.item_categories.FirstOrDefaultAsync(x => x.code == categoryCode);
        if (category is null)
        {
            throw new InvalidOperationException($"Khong tim thay item category: {categoryCode}");
        }

        var entity = new item
        {
            id = Guid.NewGuid(),
            code = code,
            name = name,
            item_category_id = category.id,
            unit_code = unitCode,
            requires_lot_tracking = request.RequiresLotTracking,
            requires_expiry_tracking = request.RequiresExpiryTracking,
            issue_policy_code = issuePolicyCode,
            exp_date = request.ExpDate,
            received_at = request.ReceivedAt ?? DateTime.UtcNow,
            is_active = request.IsActive
        };

        dbContext.items.Add(entity);
        await dbContext.SaveChangesAsync();

        return new
        {
            id = entity.id,
            itemCode = entity.code,
            itemCategoryCode = category.code,
            expDate = entity.exp_date,
            receivedAt = entity.received_at
        };
    }

    public async Task<object> UpdateItem(Guid itemId, UpdateItemRequest request)
    {
        var entity = await dbContext.items.FirstOrDefaultAsync(x => x.id == itemId);
        if (entity is null)
        {
            throw new InvalidOperationException("Khong tim thay item.");
        }

        var code = NormalizeCode(request.ItemCode);
        var name = NormalizeRequired(request.ItemName, nameof(request.ItemName));
        var categoryCode = NormalizeCode(request.ItemCategoryCode);
        var unitCode = NormalizeCode(request.UnitCode);
        var issuePolicyCode = NormalizeCode(request.IssuePolicyCode);

        EnsureAllowed(unitCode, ItemUnitCodes, nameof(request.UnitCode));
        EnsureAllowed(issuePolicyCode, IssuePolicyCodes, nameof(request.IssuePolicyCode));

        var effectiveReceivedAt = request.ReceivedAt ?? entity.received_at;
        if (request.ExpDate.HasValue && request.ExpDate.Value < DateOnly.FromDateTime(effectiveReceivedAt))
        {
            throw new InvalidOperationException("expDate khong duoc nho hon ngay receivedAt.");
        }

        if (await dbContext.items.AnyAsync(x => x.id != itemId && x.code == code))
        {
            throw new InvalidOperationException($"Ma item da ton tai: {code}");
        }

        var category = await dbContext.item_categories.FirstOrDefaultAsync(x => x.code == categoryCode);
        if (category is null)
        {
            throw new InvalidOperationException($"Khong tim thay item category: {categoryCode}");
        }

        entity.code = code;
        entity.name = name;
        entity.item_category_id = category.id;
        entity.unit_code = unitCode;
        entity.requires_lot_tracking = request.RequiresLotTracking;
        entity.requires_expiry_tracking = request.RequiresExpiryTracking;
        entity.issue_policy_code = issuePolicyCode;
        entity.exp_date = request.ExpDate;
        if (request.ReceivedAt.HasValue)
        {
            entity.received_at = request.ReceivedAt.Value;
        }
        entity.is_active = request.IsActive;

        await dbContext.SaveChangesAsync();
        return new
        {
            id = entity.id,
            updated = true,
            itemCode = entity.code,
            itemCategoryCode = category.code,
            expDate = entity.exp_date,
            receivedAt = entity.received_at
        };
    }

    public async Task<object> DeleteItem(Guid itemId)
    {
        var entity = await dbContext.items.FirstOrDefaultAsync(x => x.id == itemId);
        if (entity is null)
        {
            throw new InvalidOperationException("Khong tim thay item.");
        }

        entity.is_active = false;
        await dbContext.SaveChangesAsync();

        return new { id = entity.id, deleted = true, mode = "SOFT_DELETE" };
    }

    public async Task<object> ListLots(Guid? itemId, string? statusCode, string? keyword)
    {
        var query = dbContext.item_lots
            .AsNoTracking()
            .Include(x => x.item)
            .AsQueryable();

        if (itemId.HasValue)
        {
            query = query.Where(x => x.item_id == itemId.Value);
        }

        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            var normalized = NormalizeCode(statusCode);
            query = query.Where(x => x.status_code == normalized);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var q = keyword.Trim();
            query = query.Where(x => x.lot_no.Contains(q) || (x.donor_name != null && x.donor_name.Contains(q)));
        }

        var items = await query
            .OrderByDescending(x => x.received_at)
            .Select(x => new
            {
                id = x.id,
                item = new { id = x.item.id, code = x.item.code, name = x.item.name },
                lotNo = x.lot_no,
                mfgDate = x.mfg_date,
                expDate = x.exp_date,
                donorName = x.donor_name,
                receivedAt = x.received_at,
                statusCode = x.status_code
            })
            .ToListAsync();

        return new { items };
    }

    public async Task<object> GetLot(Guid lotId)
    {
        var lot = await dbContext.item_lots
            .AsNoTracking()
            .Include(x => x.item)
            .FirstOrDefaultAsync(x => x.id == lotId);

        if (lot is null)
        {
            throw new InvalidOperationException("Khong tim thay lo hang.");
        }

        return new
        {
            id = lot.id,
            item = new { id = lot.item.id, code = lot.item.code, name = lot.item.name, unitCode = lot.item.unit_code },
            lotNo = lot.lot_no,
            mfgDate = lot.mfg_date,
            expDate = lot.exp_date,
            donorName = lot.donor_name,
            receivedAt = lot.received_at,
            statusCode = lot.status_code
        };
    }

    public async Task<object> CreateLot(CreateLotRequest request)
    {
        await EnsureItemExists(request.ItemId);

        var lotNo = NormalizeRequired(request.LotNo, nameof(request.LotNo)).ToUpperInvariant();
        var statusCode = NormalizeCode(request.StatusCode);
        EnsureAllowed(statusCode, LotStatusCodes, nameof(request.StatusCode));
        ValidateLotDates(request.MfgDate, request.ExpDate);

        var exists = await dbContext.item_lots.AnyAsync(x => x.item_id == request.ItemId && x.lot_no == lotNo);
        if (exists)
        {
            throw new InvalidOperationException($"Lot da ton tai cho item: {lotNo}");
        }

        var entity = new item_lot
        {
            id = Guid.NewGuid(),
            item_id = request.ItemId,
            lot_no = lotNo,
            mfg_date = request.MfgDate,
            exp_date = request.ExpDate,
            donor_name = NormalizeOptional(request.DonorName),
            received_at = DateTime.UtcNow,
            status_code = statusCode
        };

        dbContext.item_lots.Add(entity);
        await dbContext.SaveChangesAsync();

        return new { id = entity.id, lotNo = entity.lot_no };
    }

    public async Task<object> UpdateLot(Guid lotId, UpdateLotRequest request)
    {
        var entity = await dbContext.item_lots.FirstOrDefaultAsync(x => x.id == lotId);
        if (entity is null)
        {
            throw new InvalidOperationException("Khong tim thay lo hang.");
        }

        await EnsureItemExists(request.ItemId);

        var lotNo = NormalizeRequired(request.LotNo, nameof(request.LotNo)).ToUpperInvariant();
        var statusCode = NormalizeCode(request.StatusCode);
        EnsureAllowed(statusCode, LotStatusCodes, nameof(request.StatusCode));
        ValidateLotDates(request.MfgDate, request.ExpDate);

        var exists = await dbContext.item_lots.AnyAsync(x => x.id != lotId && x.item_id == request.ItemId && x.lot_no == lotNo);
        if (exists)
        {
            throw new InvalidOperationException($"Lot da ton tai cho item: {lotNo}");
        }

        entity.item_id = request.ItemId;
        entity.lot_no = lotNo;
        entity.mfg_date = request.MfgDate;
        entity.exp_date = request.ExpDate;
        entity.donor_name = NormalizeOptional(request.DonorName);
        entity.status_code = statusCode;

        await dbContext.SaveChangesAsync();

        return new { id = entity.id, updated = true };
    }

    public async Task<object> DeleteLot(Guid lotId)
    {
        var entity = await dbContext.item_lots.FirstOrDefaultAsync(x => x.id == lotId);
        if (entity is null)
        {
            throw new InvalidOperationException("Khong tim thay lo hang.");
        }

        var hasStock = await dbContext.stock_balances.AnyAsync(x => x.item_lot_id == lotId && (x.qty_on_hand > 0 || x.qty_reserved > 0));
        if (hasStock)
        {
            throw new InvalidOperationException("Lot dang con ton kho, khong the xoa.");
        }

        var hasTransactions = await dbContext.stock_transaction_lines.AnyAsync(x => x.item_lot_id == lotId);
        if (hasTransactions)
        {
            throw new InvalidOperationException("Lot da phat sinh giao dich kho, khong the xoa.");
        }

        dbContext.item_lots.Remove(entity);
        await dbContext.SaveChangesAsync();

        return new { id = lotId, deleted = true };
    }

    public async Task<object> ListStockTransactions(Guid? warehouseId, string? transactionTypeCode, int page, int pageSize)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var query = dbContext.stock_transactions
            .AsNoTracking()
            .Include(x => x.warehouse)
            .AsQueryable();

        if (warehouseId.HasValue)
        {
            query = query.Where(x => x.warehouse_id == warehouseId.Value);
        }

        if (!string.IsNullOrWhiteSpace(transactionTypeCode))
        {
            var normalized = NormalizeCode(transactionTypeCode);
            query = query.Where(x => x.transaction_type_code == normalized);
        }

        var totalItems = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.happened_at)
            .ThenByDescending(x => x.created_at)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                transactionTypeCode = x.transaction_type_code,
                warehouse = new { id = x.warehouse.id, code = x.warehouse.code, name = x.warehouse.name },
                referenceType = x.reference_type_code,
                referenceId = x.reference_id,
                happenedAt = x.happened_at,
                note = x.note,
                createdAt = x.created_at,
                lineCount = x.stock_transaction_lines.Count
            })
            .ToListAsync();

        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);
        return new { items, page, pageSize, totalItems, totalPages };
    }

    public async Task<object> GetStockTransaction(Guid stockTransactionId)
    {
        var transaction = await dbContext.stock_transactions
            .AsNoTracking()
            .Include(x => x.warehouse)
            .Include(x => x.stock_transaction_lines)
            .ThenInclude(x => x.item)
            .Include(x => x.stock_transaction_lines)
            .ThenInclude(x => x.item_lot)
            .FirstOrDefaultAsync(x => x.id == stockTransactionId);

        if (transaction is null)
        {
            throw new InvalidOperationException("Khong tim thay giao dich kho.");
        }

        return new
        {
            id = transaction.id,
            code = transaction.code,
            transactionTypeCode = transaction.transaction_type_code,
            warehouse = new { id = transaction.warehouse.id, code = transaction.warehouse.code, name = transaction.warehouse.name },
            referenceType = transaction.reference_type_code,
            referenceId = transaction.reference_id,
            happenedAt = transaction.happened_at,
            note = transaction.note,
            lines = transaction.stock_transaction_lines
                .Select(x => new
                {
                    id = x.id,
                    item = new { id = x.item.id, code = x.item.code, name = x.item.name },
                    lot = new { id = x.item_lot.id, lotNo = x.item_lot.lot_no },
                    qty = x.qty,
                    unitCode = x.unit_code
                })
                .ToList(),
            createdAt = transaction.created_at
        };
    }

    public async Task<object> CreateStockTransaction(CreateStockTransactionRequest request)
    {
        var transactionType = NormalizeCode(request.TransactionTypeCode);
        EnsureAllowed(transactionType, StockTransactionTypeCodes, nameof(request.TransactionTypeCode));
        var referenceType = NormalizeOptionalCode(request.ReferenceType);

        if (request.Lines is null || request.Lines.Length == 0)
        {
            throw new InvalidOperationException("Danh sach lines khong duoc rong.");
        }

        var warehouse = await dbContext.warehouses.FirstOrDefaultAsync(x => x.id == request.WarehouseId);
        if (warehouse is null)
        {
            throw new InvalidOperationException("Khong tim thay kho.");
        }

        await using var tx = await dbContext.Database.BeginTransactionAsync();

        var transaction = new stock_transaction
        {
            id = Guid.NewGuid(),
            code = GenerateCode("STX"),
            transaction_type_code = transactionType,
            warehouse_id = request.WarehouseId,
            reference_type_code = referenceType,
            reference_id = request.ReferenceId,
            happened_at = request.HappenedAt,
            note = NormalizeOptional(request.Note),
            created_by_user_id = null,
            created_at = DateTime.UtcNow
        };

        dbContext.stock_transactions.Add(transaction);

        var movementLines = request.Lines
            .Select(x => new StockMovementLine(x.ItemId, null, x.Qty, x.UnitCode))
            .ToArray();

        var createdLines = await ApplyStockMovement(transaction.id, request.WarehouseId, transactionType, movementLines);
        dbContext.stock_transaction_lines.AddRange(createdLines);

        await dbContext.SaveChangesAsync();
        await tx.CommitAsync();

        return new { id = transaction.id, code = transaction.code, lineCount = createdLines.Count };
    }

    public async Task<object> ListHouseholds(string? keyword, Guid? adminAreaId, int page, int pageSize)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var query = dbContext.households
            .AsNoTracking()
            .Include(x => x.admin_area)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var q = keyword.Trim();
            query = query.Where(x => x.code.Contains(q) || x.head_name.Contains(q) || x.address_text.Contains(q) || (x.phone != null && x.phone.Contains(q)));
        }

        if (adminAreaId.HasValue)
        {
            query = query.Where(x => x.admin_area_id == adminAreaId.Value);
        }

        var totalItems = await query.CountAsync();
        var items = await query
            .OrderBy(x => x.code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                headName = x.head_name,
                phone = x.phone,
                adminArea = x.admin_area == null ? null : new { id = x.admin_area.id, code = x.admin_area.code, name = x.admin_area.name },
                address = x.address_text,
                location = ToLocationItem(x.geom),
                memberCount = x.member_count,
                vulnerableCount = x.vulnerable_count
            })
            .ToListAsync();

        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);
        return new { items, page, pageSize, totalItems, totalPages };
    }

    public async Task<object> GetHousehold(Guid householdId)
    {
        var household = await dbContext.households
            .AsNoTracking()
            .Include(x => x.admin_area)
            .FirstOrDefaultAsync(x => x.id == householdId);

        if (household is null)
        {
            throw new InvalidOperationException("Khong tim thay ho dan.");
        }

        return new
        {
            id = household.id,
            code = household.code,
            headName = household.head_name,
            phone = household.phone,
            adminArea = household.admin_area == null ? null : new { id = household.admin_area.id, code = household.admin_area.code, name = household.admin_area.name },
            address = household.address_text,
            location = ToLocationItem(household.geom),
            memberCount = household.member_count,
            vulnerableCount = household.vulnerable_count
        };
    }

    public async Task<object> CreateHousehold(CreateHouseholdRequest request)
    {
        var headName = NormalizeRequired(request.HeadName, nameof(request.HeadName));
        var address = NormalizeRequired(request.Address, nameof(request.Address));
        var memberCount = request.MemberCount;
        var vulnerableCount = request.VulnerableCount;

        if (memberCount <= 0)
        {
            throw new InvalidOperationException("MemberCount phai lon hon 0.");
        }

        if (vulnerableCount < 0 || vulnerableCount > memberCount)
        {
            throw new InvalidOperationException("VulnerableCount khong hop le.");
        }

        await EnsureAdminAreaExists(request.AdminAreaId);

        var entity = new household
        {
            id = Guid.NewGuid(),
            code = GenerateCode("HH"),
            head_name = headName,
            phone = NormalizeOptional(request.Phone),
            admin_area_id = request.AdminAreaId,
            address_text = address,
            geom = ToPointOrNull(request.Location),
            member_count = memberCount,
            vulnerable_count = vulnerableCount
        };

        dbContext.households.Add(entity);
        await dbContext.SaveChangesAsync();

        return new { id = entity.id, code = entity.code };
    }

    public async Task<object> UpdateHousehold(Guid householdId, UpdateHouseholdRequest request)
    {
        var entity = await dbContext.households.FirstOrDefaultAsync(x => x.id == householdId);
        if (entity is null)
        {
            throw new InvalidOperationException("Khong tim thay ho dan.");
        }

        var headName = NormalizeRequired(request.HeadName, nameof(request.HeadName));
        var address = NormalizeRequired(request.Address, nameof(request.Address));
        var memberCount = request.MemberCount;
        var vulnerableCount = request.VulnerableCount;

        if (memberCount <= 0)
        {
            throw new InvalidOperationException("MemberCount phai lon hon 0.");
        }

        if (vulnerableCount < 0 || vulnerableCount > memberCount)
        {
            throw new InvalidOperationException("VulnerableCount khong hop le.");
        }

        await EnsureAdminAreaExists(request.AdminAreaId);

        entity.head_name = headName;
        entity.phone = NormalizeOptional(request.Phone);
        entity.admin_area_id = request.AdminAreaId;
        entity.address_text = address;
        entity.geom = ToPointOrNull(request.Location);
        entity.member_count = memberCount;
        entity.vulnerable_count = vulnerableCount;

        await dbContext.SaveChangesAsync();
        return new { id = entity.id, updated = true };
    }

    public async Task<object> DeleteHousehold(Guid householdId)
    {
        var entity = await dbContext.households.FirstOrDefaultAsync(x => x.id == householdId);
        if (entity is null)
        {
            throw new InvalidOperationException("Khong tim thay ho dan.");
        }

        var hasDistribution = await dbContext.distributions.AnyAsync(x => x.household_id == householdId);
        if (hasDistribution)
        {
            throw new InvalidOperationException("Ho dan da co lich su phan phoi, khong the xoa.");
        }

        dbContext.households.Remove(entity);
        await dbContext.SaveChangesAsync();

        return new { id = householdId, deleted = true };
    }

    public async Task<object> ListDistributions(Guid? campaignId, Guid? adminAreaId, string? statusCode, int page, int pageSize)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var query = dbContext.distributions
            .AsNoTracking()
            .Include(x => x.campaign)
            .Include(x => x.relief_point!)
            .ThenInclude(x => x.admin_area)
            .Include(x => x.household)
            .AsQueryable();

        if (campaignId.HasValue)
        {
            query = query.Where(x => x.campaign_id == campaignId.Value);
        }

        if (adminAreaId.HasValue)
        {
            query = query.Where(x => x.relief_point != null && x.relief_point.admin_area_id == adminAreaId.Value);
        }

        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            var normalized = NormalizeCode(statusCode);
            query = query.Where(x => x.status_code == normalized);
        }

        var totalItems = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.created_at)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                status = new { code = x.status_code, name = x.status_code, color = (string?)null },
                campaign = x.campaign == null ? null : new { id = x.campaign.id, code = x.campaign.code, name = x.campaign.name },
                adminArea = x.relief_point == null || x.relief_point.admin_area == null
                    ? null
                    : new { id = x.relief_point.admin_area.id, code = x.relief_point.admin_area.code, name = x.relief_point.admin_area.name },
                recipient = new
                {
                    id = x.household.id,
                    code = x.household.code,
                    name = x.household.head_name,
                    phone = x.household.phone,
                    address = x.household.address_text,
                    memberCount = x.household.member_count,
                    vulnerableCount = x.household.vulnerable_count
                },
                ackMethodCode = x.ack_method_code,
                note = x.note,
                lineCount = x.distribution_lines.Count,
                createdAt = x.created_at
            })
            .ToListAsync();

        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);
        return new { items, page, pageSize, totalItems, totalPages };
    }

    public async Task<object> ListReliefCampaigns(string? keyword, string? statusCode)
    {
        var query = dbContext.relief_campaigns
            .AsNoTracking()
            .Include(x => x.admin_area)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var q = keyword.Trim();
            query = query.Where(x => x.code.Contains(q) || x.name.Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            var normalized = NormalizeCode(statusCode);
            query = query.Where(x => x.status_code == normalized);
        }

        var campaigns = await query
            .OrderByDescending(x => x.start_at)
            .ThenBy(x => x.code)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                name = x.name,
                status = new { code = x.status_code, name = x.status_code, color = (string?)null },
                adminArea = x.admin_area == null ? null : new { id = x.admin_area.id, code = x.admin_area.code, name = x.admin_area.name },
                startAt = x.start_at,
                endAt = x.end_at,
                description = x.description
            })
            .ToListAsync();

        var campaignIds = campaigns.Select(x => x.id).ToArray();
        var reliefPointRows = await dbContext.campaign_relief_points
            .AsNoTracking()
            .Where(x => campaignIds.Contains(x.campaign_id))
            .Select(x => new { x.campaign_id, point = x.relief_point })
            .OrderBy(x => x.point.code)
            .Select(x => new
            {
                campaignId = x.campaign_id,
                point = new
                {
                    id = x.point.id,
                    code = x.point.code,
                    name = x.point.name,
                    statusCode = x.point.status_code,
                    addressText = x.point.address_text,
                    adminArea = x.point.admin_area == null ? null : new { id = x.point.admin_area.id, code = x.point.admin_area.code, name = x.point.admin_area.name }
                }
            })
            .ToListAsync();

        var reliefPointsByCampaign = reliefPointRows
            .GroupBy(x => x.campaignId)
            .ToDictionary(x => x.Key, x => x.Select(v => v.point).ToList());

        var reliefRequestIdsByCampaign = await dbContext.relief_requests
            .AsNoTracking()
            .Where(x => x.campaign_id.HasValue && campaignIds.Contains(x.campaign_id.Value))
            .GroupBy(x => x.campaign_id!.Value)
            .ToDictionaryAsync(
                x => x.Key,
                x => x.Select(v => v.id).Distinct().ToArray());

        var items = campaigns.Select(x =>
        {
            var reliefPoints = reliefPointsByCampaign.TryGetValue(x.id, out var points)
                ? points
                : [];
            var reliefRequestIds = reliefRequestIdsByCampaign.TryGetValue(x.id, out var requestIds)
                ? requestIds
                : Array.Empty<Guid>();

            return new
            {
                x.id,
                x.code,
                x.name,
                x.status,
                x.adminArea,
                x.startAt,
                x.endAt,
                x.description,
                reliefPointCount = reliefPoints.Count,
                reliefPoints,
                reliefRequestCount = reliefRequestIds.Length,
                reliefRequestIds
            };
        });

        return new { items };
    }

    public async Task<object> GetReliefCampaign(Guid campaignId)
    {
        var campaign = await dbContext.relief_campaigns
            .AsNoTracking()
            .Include(x => x.admin_area)
            .FirstOrDefaultAsync(x => x.id == campaignId)
            ?? throw new InvalidOperationException("Khong tim thay chien dich.");

        var reliefPoints = await dbContext.campaign_relief_points
            .AsNoTracking()
            .Where(x => x.campaign_id == campaignId)
            .Select(x => x.relief_point)
            .OrderBy(x => x.code)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                name = x.name,
                statusCode = x.status_code,
                addressText = x.address_text,
                adminAreaId = x.admin_area_id,
                adminArea = x.admin_area == null ? null : new { id = x.admin_area.id, code = x.admin_area.code, name = x.admin_area.name }
            })
            .ToListAsync();

        var campaignAdminAreaIds = reliefPoints
            .Where(x => x.adminAreaId.HasValue)
            .Select(x => x.adminAreaId!.Value)
            .Distinct()
            .ToArray();

        var reliefRequests = await dbContext.relief_requests
            .AsNoTracking()
            .Include(x => x.admin_area)
            .Include(x => x.linked_incident)
            .Include(x => x.relief_request_items)
            .ThenInclude(x => x.item)
            .Where(x =>
                x.campaign_id == campaignId
                || (x.campaign_id == null
                    && x.admin_area_id.HasValue
                    && campaignAdminAreaIds.Contains(x.admin_area_id.Value)))
            .OrderByDescending(x => x.updated_at)
            .ThenByDescending(x => x.created_at)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                sourceTypeCode = x.source_type_code,
                status = new { code = x.status_code, name = x.status_code, color = (string?)null },
                requester = new
                {
                    name = x.requester_name,
                    phone = x.requester_phone
                },
                householdCount = x.household_count,
                addressText = x.address_text,
                adminArea = x.admin_area == null
                    ? null
                    : new { id = x.admin_area.id, code = x.admin_area.code, name = x.admin_area.name },
                location = x.geom == null ? null : new
                {
                    lat = (decimal)x.geom.Y,
                    lng = (decimal)x.geom.X
                },
                incident = x.linked_incident == null
                    ? null
                    : new { id = x.linked_incident.id, code = x.linked_incident.code, statusCode = x.linked_incident.status_code },
                items = x.relief_request_items
                    .OrderBy(i => i.item.code)
                    .Select(i => new
                    {
                        reliefRequestItemId = i.id,
                        supportTypeCode = i.item.code,
                        supportTypeName = i.item.name,
                        requestedQty = i.requested_qty,
                        approvedQty = i.approved_qty,
                        unitCode = i.unit_code
                    })
                    .ToList(),
                note = x.note,
                createdAt = x.created_at,
                updatedAt = x.updated_at
            })
            .ToListAsync();

        var reliefRequestSummary = new
        {
            total = reliefRequests.Count,
            newCount = reliefRequests.Count(x => x.status.code == "NEW"),
            approvedCount = reliefRequests.Count(x => x.status.code == "APPROVED"),
            fulfilledCount = reliefRequests.Count(x => x.status.code == "FULFILLED"),
            rejectedCount = reliefRequests.Count(x => x.status.code == "REJECTED"),
            cancelledCount = reliefRequests.Count(x => x.status.code == "CANCELLED")
        };

        return new
        {
            id = campaign.id,
            code = campaign.code,
            name = campaign.name,
            status = new { code = campaign.status_code, name = campaign.status_code, color = (string?)null },
            adminArea = campaign.admin_area == null ? null : new { id = campaign.admin_area.id, code = campaign.admin_area.code, name = campaign.admin_area.name },
            startAt = campaign.start_at,
            endAt = campaign.end_at,
            description = campaign.description,
            reliefPointCount = reliefPoints.Count,
            reliefPoints,
            reliefRequestSummary,
            reliefRequests
        };
    }

    public async Task<object> GetDistributionContextByCampaign(Guid campaignId)
    {
        var campaign = await dbContext.relief_campaigns
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.id == campaignId)
            ?? throw new InvalidOperationException("Khong tim thay chien dich.");

        var reliefPoints = await dbContext.campaign_relief_points
            .AsNoTracking()
            .Where(x => x.campaign_id == campaignId && x.relief_point.status_code == "OPEN")
            .Select(x => x.relief_point)
            .OrderBy(x => x.code)
            .Select(x => new
            {
                x.id,
                x.code,
                x.name,
                x.admin_area_id
            })
            .ToListAsync();

        var campaignAdminAreaIds = reliefPoints
            .Where(x => x.admin_area_id.HasValue)
            .Select(x => x.admin_area_id!.Value)
            .Distinct()
            .ToArray();

        var reliefRequests = await dbContext.relief_requests
            .AsNoTracking()
            .Where(x =>
                (x.campaign_id == campaignId
                 || (x.campaign_id == null
                     && x.admin_area_id.HasValue
                     && campaignAdminAreaIds.Contains(x.admin_area_id.Value))) &&
                x.linked_incident_id.HasValue &&
                x.status_code != "REJECTED" &&
                x.status_code != "FULFILLED")
            .OrderByDescending(x => x.status_code == "APPROVED")
            .ThenByDescending(x => x.updated_at)
            .ThenByDescending(x => x.created_at)
            .Select(x => new
            {
                x.id,
                x.code,
                x.linked_incident_id,
                x.status_code
            })
            .ToListAsync();

        var adminAreas = reliefPoints
            .Where(x => x.admin_area_id.HasValue)
            .GroupBy(x => x.admin_area_id!.Value)
            .Select(g => new
            {
                id = g.Key,
                reliefPointCount = g.Count()
            })
            .OrderBy(x => x.id)
            .ToList();

        var incidentIds = reliefRequests
            .Where(x => x.linked_incident_id.HasValue)
            .Select(x => x.linked_incident_id!.Value)
            .Distinct()
            .ToArray();

        var incidentTeamAssignments = await dbContext.mission_teams
            .AsNoTracking()
            .Where(x => incidentIds.Contains(x.mission.incident_id))
            .Select(x => new
            {
                incidentId = x.mission.incident_id,
                teamId = x.team_id,
                teamCode = x.team.code,
                teamName = x.team.name
            })
            .Distinct()
            .ToListAsync();

        var teams = incidentTeamAssignments
            .GroupBy(x => x.teamId)
            .Select(x => new
            {
                id = x.Key,
                code = x.First().teamCode,
                name = x.First().teamName
            })
            .OrderBy(x => x.code)
            .ToList();

        var teamIdsByIncident = incidentTeamAssignments
            .GroupBy(x => x.incidentId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(v => v.teamId).Distinct().ToArray());

        var combinations = new List<object>();
        foreach (var reliefRequest in reliefRequests)
        {
            if (!reliefRequest.linked_incident_id.HasValue ||
                !teamIdsByIncident.TryGetValue(reliefRequest.linked_incident_id.Value, out var validTeamIds))
            {
                continue;
            }

            foreach (var teamId in validTeamIds)
            {
                foreach (var reliefPoint in reliefPoints)
                {
                    combinations.Add(new
                    {
                        adminAreaId = reliefPoint.admin_area_id,
                        teamId,
                        reliefRequestId = (Guid?)reliefRequest.id
                    });
                }
            }
        }

        return new
        {
            campaign = new
            {
                id = campaign.id,
                code = campaign.code,
                name = campaign.name,
                statusCode = campaign.status_code
            },
            adminAreas,
            reliefPoints = reliefPoints.Select(x => new { id = x.id, code = x.code, name = x.name, adminAreaId = x.admin_area_id }).ToList(),
            teams,
            reliefRequests = reliefRequests.Select(x => new
            {
                id = x.id,
                code = x.code,
                linkedIncidentId = x.linked_incident_id,
                statusCode = x.status_code
            }).ToList(),
            combinations
        };
    }

    public async Task<object> CreateReliefCampaign(CreateReliefCampaignRequest request)
    {
        var code = NormalizeCode(request.Code);
        var name = NormalizeRequired(request.Name, nameof(request.Name));
        var statusCode = NormalizeCode(request.StatusCode);
        EnsureAllowed(statusCode, CampaignStatusCodes, nameof(request.StatusCode));
        ValidateCampaignDates(request.StartAt, request.EndAt);

        await EnsureAdminAreaExists(request.AdminAreaId);

        if (await dbContext.relief_campaigns.AnyAsync(x => x.code == code))
        {
            throw new InvalidOperationException($"Ma chien dich da ton tai: {code}");
        }

        var normalizedReliefRequestIds = NormalizeGuidArray(request.ReliefRequestIds);
        if (normalizedReliefRequestIds.Length == 0)
        {
            throw new InvalidOperationException("Tao chien dich bat buoc phai co it nhat 1 relief request.");
        }

        var entity = new relief_campaign
        {
            id = Guid.NewGuid(),
            code = code,
            name = name,
            status_code = statusCode,
            linked_incident_id = null,
            admin_area_id = request.AdminAreaId,
            start_at = request.StartAt,
            end_at = request.EndAt,
            description = NormalizeOptional(request.Description)
        };

        dbContext.relief_campaigns.Add(entity);
        await AssignCampaignReliefPoints(entity.id, request.ReliefPointIds);
        await AssignCampaignReliefRequests(entity.id, request.AdminAreaId, normalizedReliefRequestIds, replaceExistingForCampaign: false);
        await dbContext.SaveChangesAsync();

        return new
        {
            id = entity.id,
            code = entity.code,
            created = true,
            reliefRequestCount = normalizedReliefRequestIds.Length,
            reliefRequestIds = normalizedReliefRequestIds
        };
    }

    public async Task<object> UpdateReliefCampaign(Guid campaignId, UpdateReliefCampaignRequest request)
    {
        var entity = await dbContext.relief_campaigns.FirstOrDefaultAsync(x => x.id == campaignId)
            ?? throw new InvalidOperationException("Khong tim thay chien dich.");

        var code = NormalizeCode(request.Code);
        var name = NormalizeRequired(request.Name, nameof(request.Name));
        var statusCode = NormalizeCode(request.StatusCode);
        EnsureAllowed(statusCode, CampaignStatusCodes, nameof(request.StatusCode));
        ValidateCampaignDates(request.StartAt, request.EndAt);

        await EnsureAdminAreaExists(request.AdminAreaId);

        if (await dbContext.relief_campaigns.AnyAsync(x => x.id != campaignId && x.code == code))
        {
            throw new InvalidOperationException($"Ma chien dich da ton tai: {code}");
        }

        entity.code = code;
        entity.name = name;
        entity.admin_area_id = request.AdminAreaId;
        entity.start_at = request.StartAt;
        entity.end_at = request.EndAt;
        entity.status_code = statusCode;
        entity.description = NormalizeOptional(request.Description);

        await AssignCampaignReliefPoints(entity.id, request.ReliefPointIds);
        await AssignCampaignReliefRequests(entity.id, request.AdminAreaId, NormalizeGuidArray(request.ReliefRequestIds), replaceExistingForCampaign: true);
        await dbContext.SaveChangesAsync();

        return new { id = entity.id, code = entity.code, updated = true };
    }

    public async Task<object> DeleteReliefCampaign(Guid campaignId)
    {
        var entity = await dbContext.relief_campaigns.FirstOrDefaultAsync(x => x.id == campaignId)
            ?? throw new InvalidOperationException("Khong tim thay chien dich.");

        entity.status_code = "CANCELLED";
        await dbContext.SaveChangesAsync();

        return new { id = entity.id, deleted = true, mode = "SOFT_CANCEL" };
    }

    public async Task<object> UpdateReliefRequestStatus(Guid reliefRequestId, UpdateReliefRequestStatusRequest request)
    {
        var entity = await dbContext.relief_requests.FirstOrDefaultAsync(x => x.id == reliefRequestId)
            ?? throw new InvalidOperationException("Khong tim thay relief request.");

        var statusCode = NormalizeCode(request.StatusCode);
        var allowedStatuses = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "NEW",
            "APPROVED",
            "REJECTED",
            "FULFILLED",
            "NOT_RECEIVED",
            "CANCELLED"
        };

        EnsureAllowed(statusCode, allowedStatuses, nameof(request.StatusCode));

        var current = entity.status_code?.Trim().ToUpperInvariant() ?? string.Empty;
        if (current is "CANCELLED" or "FULFILLED" && !string.Equals(current, statusCode, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"Khong the chuyen trang thai tu {current} sang {statusCode}.");
        }

        entity.status_code = statusCode;
        entity.note = NormalizeOptional(request.Note);
        entity.updated_at = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();
        return new
        {
            reliefRequestId = entity.id,
            requestCode = entity.code,
            status = entity.status_code,
            updatedAt = entity.updated_at
        };
    }

    public async Task<object> GetDistributionOptions()
    {
        var campaigns = await dbContext.relief_campaigns
            .AsNoTracking()
            .Where(x => x.status_code == "PLANNED" || x.status_code == "ACTIVE")
            .OrderByDescending(x => x.start_at)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                name = x.name,
                statusCode = x.status_code,
                startAt = x.start_at,
                endAt = x.end_at
            })
            .ToListAsync();

        var reliefPoints = await dbContext.relief_points
            .AsNoTracking()
            .OrderBy(x => x.code)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                name = x.name,
                statusCode = x.status_code,
                addressText = x.address_text,
                location = ToLocationItem(x.geom)
            })
            .ToListAsync();

        var warehouses = await dbContext.warehouses
            .AsNoTracking()
            .Include(x => x.admin_area)
            .OrderBy(x => x.code)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                name = x.name,
                statusCode = x.status_code,
                adminArea = x.admin_area == null ? null : new { id = x.admin_area.id, code = x.admin_area.code, name = x.admin_area.name }
            })
            .ToListAsync();

        return new
        {
            campaigns,
            reliefPoints,
            warehouses,
            ackMethodCodes = AckMethodCodes.Order().Select(x => new { code = x, name = x }).ToArray(),
            distributionStatusCodes = DistributionStatusCodes.Order().Select(x => new { code = x, name = x }).ToArray()
        };
    }

    public async Task<object> ListReliefPoints(string? keyword, string? statusCode)
    {
        var query = dbContext.relief_points
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var q = keyword.Trim();
            query = query.Where(x => x.code.Contains(q) || x.name.Contains(q) || x.address_text.Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            var normalized = NormalizeCode(statusCode);
            query = query.Where(x => x.status_code == normalized);
        }

        var items = await query
            .OrderBy(x => x.code)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                name = x.name,
                status = new { code = x.status_code, name = x.status_code, color = (string?)null },
                addressText = x.address_text,
                location = ToLocationItem(x.geom)
            })
            .ToListAsync();

        var pointIds = items.Select(x => x.id).ToArray();
        var campaignLinks = await dbContext.campaign_relief_points
            .AsNoTracking()
            .Where(x => pointIds.Contains(x.relief_point_id))
            .OrderBy(x => x.campaign.code)
            .Select(x => new
            {
                pointId = x.relief_point_id,
                campaign = (object)new { id = x.campaign_id, code = x.campaign.code, name = x.campaign.name, statusCode = x.campaign.status_code }
            })
            .ToListAsync();

        var campaignsByPoint = campaignLinks
            .GroupBy(x => x.pointId)
            .ToDictionary(x => x.Key, x => x.Select(v => v.campaign).ToList());

        var mappedItems = items.Select(x => new
        {
            x.id,
            x.code,
            x.name,
            x.status,
            x.addressText,
            x.location,
            campaigns = campaignsByPoint.TryGetValue(x.id, out var campaigns)
                ? campaigns
                : new List<object>()
        });

        return new { items = mappedItems };
    }

    public async Task<object> CreateReliefPoint(CreateReliefPointRequest request)
    {
        var code = NormalizeCode(request.Code);
        var name = NormalizeRequired(request.Name, nameof(request.Name));
        var addressText = NormalizeRequired(request.Location?.AddressText, nameof(request.Location.AddressText));
        var statusCode = NormalizeCode(request.StatusCode);

        if (request.Location is null)
        {
            throw new InvalidOperationException("Location la bat buoc.");
        }

        if (request.Location.Lat < -90 || request.Location.Lat > 90 ||
            request.Location.Lng < -180 || request.Location.Lng > 180)
        {
            throw new InvalidOperationException("Toa do location khong hop le.");
        }

        EnsureAllowed(statusCode, ReliefPointStatusCodes, nameof(request.StatusCode));
        await EnsureUserExists(request.ManagerUserId);

        if (await dbContext.relief_points.AnyAsync(x => x.code == code))
        {
            throw new InvalidOperationException($"Ma diem cuu tro da ton tai: {code}");
        }

        var adminAreaId = await ResolveAdminAreaIdFromLocation(new GeoPointRequest(request.Location.Lat, request.Location.Lng));
        var entity = new relief_point
        {
            id = Guid.NewGuid(),
            code = code,
            name = name,
            admin_area_id = adminAreaId,
            address_text = addressText,
            geom = new Point((double)request.Location.Lng, (double)request.Location.Lat) { SRID = 4326 },
            manager_user_id = request.ManagerUserId,
            status_code = statusCode,
            opens_at = null,
            closes_at = null
        };

        dbContext.relief_points.Add(entity);
        await dbContext.SaveChangesAsync();

        return new
        {
            id = entity.id,
            code = entity.code,
            name = entity.name,
            statusCode = entity.status_code,
            addressText = entity.address_text,
            adminAreaId,
            location = new { lat = request.Location.Lat, lng = request.Location.Lng }
        };
    }

    public async Task<object> GetReliefPoint(Guid reliefPointId)
    {
        var entity = await dbContext.relief_points
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.id == reliefPointId)
            ?? throw new InvalidOperationException("Khong tim thay diem cuu tro.");

        var campaigns = await dbContext.campaign_relief_points
            .AsNoTracking()
            .Where(x => x.relief_point_id == reliefPointId)
            .OrderBy(x => x.campaign.code)
            .Select(x => new { id = x.campaign_id, code = x.campaign.code, name = x.campaign.name, statusCode = x.campaign.status_code })
            .ToListAsync();

        return new
        {
            id = entity.id,
            code = entity.code,
            name = entity.name,
            statusCode = entity.status_code,
            addressText = entity.address_text,
            campaigns,
            location = ToLocationItem(entity.geom),
            opensAt = entity.opens_at,
            closesAt = entity.closes_at
        };
    }

    public async Task<object> UpdateReliefPoint(Guid reliefPointId, UpdateReliefPointRequest request)
    {
        var entity = await dbContext.relief_points.FirstOrDefaultAsync(x => x.id == reliefPointId)
            ?? throw new InvalidOperationException("Khong tim thay diem cuu tro.");

        var code = NormalizeCode(request.Code);
        var name = NormalizeRequired(request.Name, nameof(request.Name));
        var addressText = NormalizeRequired(request.Location?.AddressText, nameof(request.Location.AddressText));
        var statusCode = NormalizeCode(request.StatusCode);

        if (request.Location is null)
        {
            throw new InvalidOperationException("Location la bat buoc.");
        }

        if (request.Location.Lat < -90 || request.Location.Lat > 90 ||
            request.Location.Lng < -180 || request.Location.Lng > 180)
        {
            throw new InvalidOperationException("Toa do location khong hop le.");
        }

        EnsureAllowed(statusCode, ReliefPointStatusCodes, nameof(request.StatusCode));
        await EnsureAdminAreaExists(request.AdminAreaId);
        await EnsureUserExists(request.ManagerUserId);

        if (await dbContext.relief_points.AnyAsync(x => x.id != reliefPointId && x.code == code))
        {
            throw new InvalidOperationException($"Ma diem cuu tro da ton tai: {code}");
        }

        entity.code = code;
        entity.name = name;
        entity.admin_area_id = request.AdminAreaId;
        entity.address_text = addressText;
        entity.geom = new Point((double)request.Location.Lng, (double)request.Location.Lat) { SRID = 4326 };
        entity.manager_user_id = request.ManagerUserId;
        entity.status_code = statusCode;

        await EnsureCampaignExists(request.CampaignId);
        await LinkReliefPointToCampaign(request.CampaignId, reliefPointId);
        await dbContext.SaveChangesAsync();

        return new
        {
            id = entity.id,
            updated = true,
            code = entity.code,
            statusCode = entity.status_code
        };
    }

    public async Task<object> DeleteReliefPoint(Guid reliefPointId)
    {
        var entity = await dbContext.relief_points.FirstOrDefaultAsync(x => x.id == reliefPointId)
            ?? throw new InvalidOperationException("Khong tim thay diem cuu tro.");

        entity.status_code = "CLOSED";
        await dbContext.SaveChangesAsync();

        return new { id = entity.id, deleted = true, mode = "SOFT_CLOSE" };
    }

    public async Task<object> GetDistribution(Guid distributionId)
    {
        var distribution = await dbContext.distributions
            .AsNoTracking()
            .Include(x => x.campaign)
            .Include(x => x.relief_point!)
            .ThenInclude(x => x.admin_area)
            .Include(x => x.household)
            .Include(x => x.distribution_lines)
            .ThenInclude(x => x.item)
            .Include(x => x.distribution_lines)
            .ThenInclude(x => x.item_lot)
            .Include(x => x.distribution_ack)
            .FirstOrDefaultAsync(x => x.id == distributionId);

        if (distribution is null)
        {
            throw new InvalidOperationException("Khong tim thay phieu phan phoi.");
        }

        return new
        {
            id = distribution.id,
            code = distribution.code,
            status = new { code = distribution.status_code, name = distribution.status_code, color = (string?)null },
            campaign = distribution.campaign == null ? null : new { id = distribution.campaign.id, code = distribution.campaign.code, name = distribution.campaign.name },
            adminArea = distribution.relief_point == null || distribution.relief_point.admin_area == null
                ? null
                : new { id = distribution.relief_point.admin_area.id, code = distribution.relief_point.admin_area.code, name = distribution.relief_point.admin_area.name },
            recipient = new
            {
                id = distribution.household.id,
                code = distribution.household.code,
                name = distribution.household.head_name,
                phone = distribution.household.phone,
                address = distribution.household.address_text,
                memberCount = distribution.household.member_count,
                vulnerableCount = distribution.household.vulnerable_count
            },
            ackMethodCode = distribution.ack_method_code,
            note = distribution.note,
            lines = distribution.distribution_lines.Select(x => new
            {
                id = x.id,
                item = new { id = x.item.id, code = x.item.code, name = x.item.name },
                qty = x.qty,
                unitCode = x.unit_code
            }).ToList(),
            ack = distribution.distribution_ack == null ? null : new
            {
                ackMethodCode = distribution.distribution_ack.ack_method_code,
                ackCode = distribution.distribution_ack.ack_code,
                ackByName = distribution.distribution_ack.ack_by_name,
                ackPhone = distribution.distribution_ack.ack_phone,
                ackNote = distribution.distribution_ack.ack_note,
                ackAt = distribution.distribution_ack.ack_at
            },
            createdAt = distribution.created_at
        };
    }

    public async Task<object> CreateDistribution(CreateDistributionRequest request)
    {
        if (request.Lines is null || request.Lines.Length == 0)
        {
            throw new InvalidOperationException("Danh sach lines khong duoc rong.");
        }

        await EnsureCampaignExists(request.CampaignId);
        await EnsureAdminAreaExists(request.AdminAreaId);
        await EnsureTeamExists(request.TeamId);
        var warehouse = await dbContext.warehouses
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.id == request.WarehouseId)
            ?? throw new InvalidOperationException("Khong tim thay kho.");

        var effectiveCampaignId = request.CampaignId;
        var effectiveAdminAreaId = request.AdminAreaId;
        var reliefPoint = await ResolveReliefPointForDistribution(effectiveCampaignId, effectiveAdminAreaId);

        var team = await dbContext.teams
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.id == request.TeamId)
            ?? throw new InvalidOperationException("Khong tim thay team duoc phan cong.");

        var recipientName = $"TEAM {team.code}";
        var recipientAddress = NormalizeRequired(reliefPoint.address_text, nameof(reliefPoint.address_text));
        var recipientAdminAreaId = effectiveAdminAreaId ?? reliefPoint.admin_area_id;
        var recipientMemberCount = 1;

        var household = await dbContext.households.FirstOrDefaultAsync(x =>
            x.head_name == recipientName &&
            x.address_text == recipientAddress &&
            x.phone == null);

        if (household is null)
        {
            household = new household
            {
                id = Guid.NewGuid(),
                code = GenerateCode("HH"),
                head_name = recipientName,
                phone = null,
                admin_area_id = recipientAdminAreaId,
                address_text = recipientAddress,
                geom = reliefPoint.geom,
                member_count = recipientMemberCount,
                vulnerable_count = 0
            };
            dbContext.households.Add(household);
        }
        else
        {
            household.admin_area_id = recipientAdminAreaId;
            household.member_count = recipientMemberCount;
            household.geom = reliefPoint.geom;
        }

        var ackMethod = NormalizeCode(request.AckMethodCode);
        EnsureAllowed(ackMethod, AckMethodCodes, nameof(request.AckMethodCode));

        var warehouseId = warehouse.id;

        await using var tx = await dbContext.Database.BeginTransactionAsync();

        var distribution = new distribution
        {
            id = Guid.NewGuid(),
            code = GenerateCode("DS"),
            campaign_id = effectiveCampaignId,
            relief_point_id = reliefPoint.id,
            household_id = household.id,
            linked_incident_id = null,
            ack_method_code = ackMethod,
            status_code = "PENDING",
            note = NormalizeOptional(request.Note) is { Length: > 0 } note
                ? $"TEAM:{team.id}; {note}"
                : $"TEAM:{team.id}",
            created_by_user_id = null,
            created_at = DateTime.UtcNow
        };

        dbContext.distributions.Add(distribution);

        var stockTransaction = new stock_transaction
        {
            id = Guid.NewGuid(),
            code = GenerateCode("STX"),
            transaction_type_code = "ISSUE",
            warehouse_id = warehouseId,
            reference_type_code = "DISTRIBUTION",
            reference_id = distribution.id,
            happened_at = DateTime.UtcNow,
            note = $"Issue for distribution {distribution.code}",
            created_by_user_id = null,
            created_at = DateTime.UtcNow
        };
        dbContext.stock_transactions.Add(stockTransaction);

        var movementLines = request.Lines
            .Select(x => new StockMovementLine(x.ItemId, null, x.Qty, x.UnitCode))
            .ToArray();
        var createdTransactionLines = await ApplyStockMovement(stockTransaction.id, warehouseId, "ISSUE", movementLines);
        dbContext.stock_transaction_lines.AddRange(createdTransactionLines);

        var distributionLines = createdTransactionLines.Select(x => new distribution_line
        {
            id = Guid.NewGuid(),
            distribution_id = distribution.id,
            item_id = x.item_id,
            item_lot_id = x.item_lot_id,
            qty = x.qty,
            unit_code = x.unit_code
        }).ToArray();
        dbContext.distribution_lines.AddRange(distributionLines);

        var ackCode = ackMethod == "OTP" ? GenerateAckCode() : null;
        var ack = new distribution_ack
        {
            id = Guid.NewGuid(),
            distribution_id = distribution.id,
            ack_method_code = ackMethod,
            ack_code = ackCode,
            ack_at = DateTime.UtcNow
        };
        dbContext.distribution_acks.Add(ack);

        await dbContext.SaveChangesAsync();
        await tx.CommitAsync();

        return new
        {
            id = distribution.id,
            distributionId = distribution.id,
            distributionCode = distribution.code,
            ackCode,
            team = new { id = team.id, code = team.code, name = team.name }
        };
    }

    public async Task<object> AckDistribution(Guid distributionId, DistributionAckRequest request)
    {
        var distribution = await dbContext.distributions.FirstOrDefaultAsync(x => x.id == distributionId)
            ?? throw new InvalidOperationException("Khong tim thay phieu phan phoi.");

        var ack = await dbContext.distribution_acks.FirstOrDefaultAsync(x => x.distribution_id == distributionId)
            ?? throw new InvalidOperationException("Khong tim thay thong tin ACK.");

        if (distribution.status_code == "COMPLETED")
        {
            throw new InvalidOperationException("Phieu phan phoi da duoc xac nhan truoc do.");
        }

        ack.ack_note = NormalizeOptional(request.Note);
        ack.ack_at = DateTime.UtcNow;

        distribution.status_code = "COMPLETED";

        await dbContext.SaveChangesAsync();

        return new { id = distributionId, statusCode = distribution.status_code, ackAt = ack.ack_at };
    }

    private async Task<List<stock_transaction_line>> ApplyStockMovement(
        Guid stockTransactionId,
        Guid warehouseId,
        string transactionType,
        IReadOnlyCollection<StockMovementLine> lines)
    {
        var result = new List<stock_transaction_line>();

        foreach (var line in lines)
        {
            var qty = line.Qty;
            if (qty <= 0)
            {
                throw new InvalidOperationException("Qty phai lon hon 0.");
            }

            var unitCode = NormalizeCode(line.UnitCode);
            EnsureAllowed(unitCode, ItemUnitCodes, nameof(line.UnitCode));

            var item = await dbContext.items.FirstOrDefaultAsync(x => x.id == line.ItemId)
                ?? throw new InvalidOperationException($"Khong tim thay item: {line.ItemId}");

            if (!string.Equals(item.unit_code, unitCode, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"UnitCode khong hop le voi item {item.code}. Unit hop le: {item.unit_code}");
            }

            if (transactionType == "RECEIPT")
            {
                var lot = await ResolveLotForReceipt(item, line.LotId);
                var toBin = await EnsureDefaultBinForWarehouse(warehouseId);
                var receiptBalance = await GetOrCreateStockBalance(warehouseId, toBin.id, item.id, lot.id);
                receiptBalance.qty_on_hand += qty;

                result.Add(new stock_transaction_line
                {
                    id = Guid.NewGuid(),
                    stock_transaction_id = stockTransactionId,
                    item_id = item.id,
                    item_lot_id = lot.id,
                    from_bin_id = null,
                    to_bin_id = toBin.id,
                    qty = qty,
                    unit_code = unitCode
                });

                continue;
            }

            var remainingQty = qty;
            var candidateBalances = await ResolveIssueBalances(warehouseId, item.id, item.issue_policy_code, line.LotId);

            foreach (var balance in candidateBalances)
            {
                if (remainingQty <= 0)
                {
                    break;
                }

                var lot = balance.item_lot;
                ValidateIssueLot(lot);

                if (balance.qty_on_hand <= 0)
                {
                    continue;
                }

                var deductQty = Math.Min(remainingQty, balance.qty_on_hand);
                balance.qty_on_hand -= deductQty;
                remainingQty -= deductQty;

                result.Add(new stock_transaction_line
                {
                    id = Guid.NewGuid(),
                    stock_transaction_id = stockTransactionId,
                    item_id = item.id,
                    item_lot_id = lot.id,
                    from_bin_id = balance.warehouse_bin_id,
                    to_bin_id = null,
                    qty = deductQty,
                    unit_code = unitCode
                });
            }

            if (remainingQty > 0)
            {
                throw new InvalidOperationException("So luong ton kho khong du de ISSUE.");
            }
        }

        return result;
    }

    private async Task<item_lot> ResolveLotForReceipt(item item, Guid? requestedLotId)
    {
        if (requestedLotId.HasValue)
        {
            var lot = await dbContext.item_lots.FirstOrDefaultAsync(x => x.id == requestedLotId.Value)
                ?? throw new InvalidOperationException($"Khong tim thay lot: {requestedLotId.Value}");

            if (lot.item_id != item.id)
            {
                throw new InvalidOperationException("Lot khong thuoc item duoc khai bao.");
            }

            return lot;
        }

        var trackedLot = dbContext.item_lots.Local
            .Where(x => x.item_id == item.id && x.status_code != "EXPIRED" && x.status_code != "QUARANTINED")
            .OrderByDescending(x => x.received_at)
            .FirstOrDefault();
        if (trackedLot is not null)
        {
            return trackedLot;
        }

        var existingLot = await dbContext.item_lots
            .Where(x => x.item_id == item.id && x.status_code != "EXPIRED" && x.status_code != "QUARANTINED")
            .OrderByDescending(x => x.received_at)
            .FirstOrDefaultAsync();

        if (existingLot is not null)
        {
            return existingLot;
        }

        var suffix = DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");
        var autoLotNo = $"AUTO-{item.code}-{suffix}";

        var lotEntity = new item_lot
        {
            id = Guid.NewGuid(),
            item_id = item.id,
            lot_no = autoLotNo,
            mfg_date = null,
            exp_date = item.exp_date,
            donor_name = "SYSTEM",
            received_at = DateTime.UtcNow,
            status_code = "AVAILABLE"
        };

        dbContext.item_lots.Add(lotEntity);
        return lotEntity;
    }

    private async Task<List<stock_balance>> ResolveIssueBalances(Guid warehouseId, Guid itemId, string issuePolicyCode, Guid? requestedLotId)
    {
        var baseQuery = dbContext.stock_balances
            .Include(x => x.item_lot)
            .Where(x =>
                x.warehouse_id == warehouseId &&
                x.item_id == itemId &&
                x.qty_on_hand > 0);

        if (requestedLotId.HasValue)
        {
            return await baseQuery
                .Where(x => x.item_lot_id == requestedLotId.Value)
                .OrderByDescending(x => x.qty_on_hand)
                .ToListAsync();
        }

        var normalizedPolicy = NormalizeCode(issuePolicyCode);
        if (normalizedPolicy == "FEFO")
        {
            return await baseQuery
                .OrderBy(x => x.item_lot.exp_date == null ? 1 : 0)
                .ThenBy(x => x.item_lot.exp_date)
                .ThenBy(x => x.item_lot.received_at)
                .ThenByDescending(x => x.qty_on_hand)
                .ToListAsync();
        }

        return await baseQuery
            .OrderBy(x => x.item_lot.received_at)
            .ThenBy(x => x.item_lot.exp_date == null ? 1 : 0)
            .ThenBy(x => x.item_lot.exp_date)
            .ThenByDescending(x => x.qty_on_hand)
            .ToListAsync();
    }

    private async Task<stock_balance> GetOrCreateStockBalance(Guid warehouseId, Guid binId, Guid itemId, Guid lotId)
    {
        var trackedBalance = dbContext.stock_balances.Local.FirstOrDefault(x =>
            x.warehouse_id == warehouseId &&
            x.warehouse_bin_id == binId &&
            x.item_id == itemId &&
            x.item_lot_id == lotId);
        if (trackedBalance is not null)
        {
            return trackedBalance;
        }

        var balance = await dbContext.stock_balances.FirstOrDefaultAsync(x =>
            x.warehouse_id == warehouseId &&
            x.warehouse_bin_id == binId &&
            x.item_id == itemId &&
            x.item_lot_id == lotId);

        if (balance is not null)
        {
            return balance;
        }

        balance = new stock_balance
        {
            id = Guid.NewGuid(),
            warehouse_id = warehouseId,
            warehouse_bin_id = binId,
            item_id = itemId,
            item_lot_id = lotId,
            qty_on_hand = 0,
            qty_reserved = 0
        };

        dbContext.stock_balances.Add(balance);
        return balance;
    }

    private async Task<warehouse_bin> EnsureDefaultBinForWarehouse(Guid warehouseId)
    {
        var existingBin = await dbContext.warehouse_bins
            .Include(x => x.warehouse_zone)
            .Where(x => x.warehouse_zone.warehouse_id == warehouseId)
            .OrderBy(x => x.warehouse_zone.code)
            .ThenBy(x => x.code)
            .FirstOrDefaultAsync();

        if (existingBin is not null)
        {
            return existingBin;
        }

        var zone = await dbContext.warehouse_zones
            .Where(x => x.warehouse_id == warehouseId)
            .OrderBy(x => x.code)
            .FirstOrDefaultAsync();

        if (zone is null)
        {
            zone = new warehouse_zone
            {
                id = Guid.NewGuid(),
                warehouse_id = warehouseId,
                code = "DEFAULT",
                name = "Mac dinh"
            };
            dbContext.warehouse_zones.Add(zone);
        }

        var bin = new warehouse_bin
        {
            id = Guid.NewGuid(),
            warehouse_zone_id = zone.id,
            code = "DEFAULT",
            name = "Mac dinh"
        };
        dbContext.warehouse_bins.Add(bin);

        return bin;
    }

    private static void ValidateIssueLot(item_lot lot)
    {
        if (lot.status_code == "EXPIRED" || lot.status_code == "QUARANTINED")
        {
            throw new InvalidOperationException($"Lot {lot.lot_no} khong duoc phep cap phat vi status {lot.status_code}.");
        }

        if (lot.exp_date.HasValue)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            if (lot.exp_date.Value < today)
            {
                throw new InvalidOperationException($"Lot {lot.lot_no} da het han, khong duoc cap phat.");
            }
        }
    }

    private async Task<relief_request> ResolveReliefRequestForDistributionCreation(Guid teamId, Guid? campaignId)
    {
        var incidentIds = await dbContext.mission_teams
            .AsNoTracking()
            .Where(x => x.team_id == teamId)
            .OrderByDescending(x => x.assigned_at)
            .Select(x => x.mission.incident_id)
            .Distinct()
            .ToArrayAsync();

        var baseQuery = dbContext.relief_requests
            .AsNoTracking()
            .Where(x => x.status_code != "REJECTED" && x.status_code != "FULFILLED")
            .AsQueryable();

        if (campaignId.HasValue)
        {
            baseQuery = baseQuery.Where(x => x.campaign_id == campaignId.Value);
        }

        if (incidentIds.Length > 0)
        {
            var byTeamIncidents = await baseQuery
                .Where(x => x.linked_incident_id.HasValue && incidentIds.Contains(x.linked_incident_id.Value))
                .OrderByDescending(x => x.status_code == "APPROVED")
                .ThenByDescending(x => x.updated_at)
                .ThenByDescending(x => x.created_at)
                .FirstOrDefaultAsync();

            if (byTeamIncidents is not null)
            {
                return byTeamIncidents;
            }
        }

        // Fallback: team chua co mission lien quan campaign, nhung campaign van co relief request hop le.
        var reliefRequest = await baseQuery
            .OrderByDescending(x => x.status_code == "APPROVED")
            .ThenByDescending(x => x.updated_at)
            .ThenByDescending(x => x.created_at)
            .FirstOrDefaultAsync();

        if (reliefRequest is null)
        {
            if (campaignId.HasValue)
            {
                throw new InvalidOperationException("Khong tim thay relief request hop le trong campaign.");
            }

            throw new InvalidOperationException("Khong tim thay relief request phu hop. Vui long cung cap CampaignId hoac gan mission cho team.");
        }

        return reliefRequest;
    }

    private async Task<relief_point> ResolveReliefPointForDistribution(Guid? campaignId, Guid? adminAreaId)
    {
        var query = dbContext.relief_points
            .AsNoTracking()
            .Where(x => x.status_code == "OPEN")
            .AsQueryable();

        if (campaignId.HasValue)
        {
            query = query.Where(x =>
                dbContext.campaign_relief_points.Any(link => link.campaign_id == campaignId.Value && link.relief_point_id == x.id));
        }

        if (adminAreaId.HasValue)
        {
            query = query.Where(x => x.admin_area_id == adminAreaId.Value);
        }

        var reliefPoint = await query
            .OrderBy(x => x.code)
            .FirstOrDefaultAsync();

        if (reliefPoint is not null)
        {
            return reliefPoint;
        }

        if (campaignId.HasValue)
        {
            reliefPoint = await dbContext.campaign_relief_points
                .AsNoTracking()
                .Where(x => x.campaign_id == campaignId.Value && x.relief_point.status_code == "OPEN")
                .Select(x => x.relief_point)
                .OrderBy(x => x.code)
                .FirstOrDefaultAsync();
        }

        if (reliefPoint is not null)
        {
            return reliefPoint;
        }

        throw new InvalidOperationException("Khong tim thay relief point OPEN phu hop de tao phan phoi.");
    }

    private async Task<relief_campaign> ResolveCampaignForReliefPoint(Guid? adminAreaId)
    {
        var now = DateTime.UtcNow;
        var query = dbContext.relief_campaigns
            .AsNoTracking()
            .Where(x =>
                x.status_code == "PLANNED" ||
                x.status_code == "ACTIVE" ||
                (x.start_at <= now && x.status_code != "CLOSED" && x.status_code != "CANCELLED"))
            .AsQueryable();

        if (adminAreaId.HasValue)
        {
            query = query.Where(x => x.admin_area_id == adminAreaId.Value);
        }

        var campaign = await query
            .OrderByDescending(x => x.status_code == "ACTIVE")
            .ThenByDescending(x => x.start_at)
            .FirstOrDefaultAsync();

        if (campaign is not null)
        {
            return campaign;
        }

        campaign = await dbContext.relief_campaigns
            .AsNoTracking()
            .Where(x => x.status_code == "PLANNED" || x.status_code == "ACTIVE")
            .OrderByDescending(x => x.status_code == "ACTIVE")
            .ThenByDescending(x => x.start_at)
            .FirstOrDefaultAsync();

        return campaign ?? throw new InvalidOperationException("Khong tim thay chien dich cuu tro de gan diem cuu tro.");
    }

    private async Task<Guid?> ResolveAdminAreaIdFromLocation(GeoPointRequest? location)
    {
        if (location is null)
        {
            return null;
        }

        var lat = location.Lat;
        var lng = location.Lng;
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
        {
            throw new InvalidOperationException("Toa do khong hop le.");
        }

        var point = new Point((double)lng, (double)lat) { SRID = 4326 };

        var areas = await dbContext.admin_areas
            .AsNoTracking()
            .Where(x => x.geom != null)
            .Select(x => new { x.id, x.level_code, x.geom })
            .ToListAsync();

        var matched = areas
            .Where(x => x.geom != null && x.geom.Contains(point))
            .OrderBy(x => AdminAreaPriority(x.level_code))
            .FirstOrDefault();

        return matched?.id;
    }

    private async Task EnsureAdminAreaExists(Guid? adminAreaId)
    {
        if (!adminAreaId.HasValue)
        {
            return;
        }

        var exists = await dbContext.admin_areas.AnyAsync(x => x.id == adminAreaId.Value);
        if (!exists)
        {
            throw new InvalidOperationException($"Khong tim thay admin area: {adminAreaId}");
        }
    }

    private async Task EnsureUserExists(Guid? userId)
    {
        if (!userId.HasValue)
        {
            return;
        }

        var exists = await dbContext.app_users.AnyAsync(x => x.id == userId.Value);
        if (!exists)
        {
            throw new InvalidOperationException($"Khong tim thay user: {userId}");
        }
    }

    private async Task EnsureCampaignExists(Guid? campaignId)
    {
        if (!campaignId.HasValue)
        {
            return;
        }

        var exists = await dbContext.relief_campaigns.AnyAsync(x => x.id == campaignId.Value);
        if (!exists)
        {
            throw new InvalidOperationException($"Khong tim thay campaign: {campaignId}");
        }
    }

    private async Task AssignCampaignReliefPoints(Guid campaignId, Guid[]? reliefPointIds)
    {
        if (reliefPointIds is null)
        {
            return;
        }

        var normalizedIds = reliefPointIds
            .Where(x => x != Guid.Empty)
            .Distinct()
            .ToArray();

        if (normalizedIds.Length == 0)
        {
            return;
        }

        var reliefPoints = await dbContext.relief_points
            .Where(x => normalizedIds.Contains(x.id))
            .ToListAsync();

        if (reliefPoints.Count != normalizedIds.Length)
        {
            throw new InvalidOperationException("Co relief point khong hop le trong danh sach ReliefPointIds.");
        }

        var existingLinks = await dbContext.campaign_relief_points
            .Where(x => x.campaign_id == campaignId && normalizedIds.Contains(x.relief_point_id))
            .Select(x => x.relief_point_id)
            .ToArrayAsync();

        var existingSet = existingLinks.ToHashSet();
        var linksToAdd = normalizedIds
            .Where(x => !existingSet.Contains(x))
            .Select(x => new campaign_relief_point
            {
                campaign_id = campaignId,
                relief_point_id = x,
                created_at = DateTime.UtcNow
            })
            .ToArray();

        if (linksToAdd.Length > 0)
        {
            dbContext.campaign_relief_points.AddRange(linksToAdd);
        }
    }

    private async Task AssignCampaignReliefRequests(Guid campaignId, Guid? campaignAdminAreaId, Guid[] reliefRequestIds, bool replaceExistingForCampaign)
    {
        if (reliefRequestIds.Length == 0)
        {
            return;
        }

        var reliefRequests = await dbContext.relief_requests
            .Where(x => reliefRequestIds.Contains(x.id))
            .ToListAsync();

        if (reliefRequests.Count != reliefRequestIds.Length)
        {
            throw new InvalidOperationException("Co relief request khong hop le trong danh sach ReliefRequestIds.");
        }

        var assignedToOtherCampaign = reliefRequests
            .Where(x => x.campaign_id.HasValue && x.campaign_id.Value != campaignId)
            .Select(x => new { x.id, x.campaign_id })
            .ToList();
        if (assignedToOtherCampaign.Count > 0)
        {
            var conflictedIds = string.Join(", ", assignedToOtherCampaign.Select(x => x.id));
            throw new InvalidOperationException($"Co relief request da thuoc campaign khac: {conflictedIds}");
        }

        if (campaignAdminAreaId.HasValue)
        {
            var invalidAdminAreas = reliefRequests
                .Where(x => x.admin_area_id.HasValue && x.admin_area_id.Value != campaignAdminAreaId.Value)
                .Select(x => x.id)
                .ToArray();
            if (invalidAdminAreas.Length > 0)
            {
                var ids = string.Join(", ", invalidAdminAreas);
                throw new InvalidOperationException($"Co relief request khong thuoc khu vuc campaign: {ids}");
            }
        }

        var now = DateTime.UtcNow;
        foreach (var reliefRequest in reliefRequests)
        {
            reliefRequest.campaign_id = campaignId;
            reliefRequest.updated_at = now;
        }

        if (!replaceExistingForCampaign)
        {
            return;
        }

        var selectedIds = reliefRequestIds.ToHashSet();
        var toClear = await dbContext.relief_requests
            .Where(x => x.campaign_id == campaignId && !selectedIds.Contains(x.id))
            .ToListAsync();
        foreach (var reliefRequest in toClear)
        {
            reliefRequest.campaign_id = null;
            reliefRequest.updated_at = now;
        }
    }

    private async Task LinkReliefPointToCampaign(Guid campaignId, Guid reliefPointId)
    {
        var exists = await dbContext.campaign_relief_points
            .AnyAsync(x => x.campaign_id == campaignId && x.relief_point_id == reliefPointId);

        if (exists)
        {
            return;
        }

        dbContext.campaign_relief_points.Add(new campaign_relief_point
        {
            campaign_id = campaignId,
            relief_point_id = reliefPointId,
            created_at = DateTime.UtcNow
        });
    }

    private async Task EnsureReliefPointExists(Guid? reliefPointId)
    {
        if (!reliefPointId.HasValue)
        {
            return;
        }

        var exists = await dbContext.relief_points.AnyAsync(x => x.id == reliefPointId.Value);
        if (!exists)
        {
            throw new InvalidOperationException($"Khong tim thay relief point: {reliefPointId}");
        }
    }

    private async Task EnsureIncidentExists(Guid? incidentId)
    {
        if (!incidentId.HasValue)
        {
            return;
        }

        var exists = await dbContext.incidents.AnyAsync(x => x.id == incidentId.Value);
        if (!exists)
        {
            throw new InvalidOperationException($"Khong tim thay incident: {incidentId}");
        }
    }

    private async Task EnsureTeamExists(Guid teamId)
    {
        var exists = await dbContext.teams.AnyAsync(x => x.id == teamId);
        if (!exists)
        {
            throw new InvalidOperationException($"Khong tim thay team: {teamId}");
        }
    }

    private async Task EnsureItemExists(Guid itemId)
    {
        var exists = await dbContext.items.AnyAsync(x => x.id == itemId);
        if (!exists)
        {
            throw new InvalidOperationException($"Khong tim thay item: {itemId}");
        }
    }

    private static void ValidateLotDates(DateOnly? mfgDate, DateOnly? expDate)
    {
        if (mfgDate.HasValue && expDate.HasValue && expDate.Value < mfgDate.Value)
        {
            throw new InvalidOperationException("ExpDate khong duoc nho hon MfgDate.");
        }
    }

    private static void ValidateCampaignDates(DateTime startAt, DateTime? endAt)
    {
        if (endAt.HasValue && endAt.Value < startAt)
        {
            throw new InvalidOperationException("EndAt khong duoc nho hon StartAt.");
        }
    }

    private static string NormalizeCode(string value)
        => NormalizeRequired(value, nameof(value)).ToUpperInvariant();

    private static Guid[] NormalizeGuidArray(Guid[]? values)
        => values is null
            ? Array.Empty<Guid>()
            : values.Where(x => x != Guid.Empty).Distinct().ToArray();

    private static string? NormalizeOptionalCode(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToUpperInvariant();

    private static string NormalizeRequired(string? value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"{fieldName} khong duoc rong.");
        }

        return value.Trim();
    }

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static void EnsureAllowed(string value, HashSet<string> allowedValues, string fieldName)
    {
        if (!allowedValues.Contains(value))
        {
            throw new InvalidOperationException($"{fieldName} khong hop le. Gia tri hop le: {string.Join(", ", allowedValues.Order())}");
        }
    }

    private static (int Page, int PageSize) NormalizePaging(int page, int pageSize)
    {
        var normalizedPage = page <= 0 ? 1 : page;
        var normalizedPageSize = pageSize <= 0 ? 20 : Math.Min(pageSize, 200);
        return (normalizedPage, normalizedPageSize);
    }

    private static int AdminAreaPriority(string? levelCode)
        => levelCode switch
        {
            "WARD" => 0,
            "DISTRICT" => 1,
            "PROVINCE" => 2,
            _ => 9
        };

    private static Point? ToPointOrNull(GeoPointRequest? point)
    {
        if (point is null)
        {
            return null;
        }

        var lat = (double)point.Lat;
        var lng = (double)point.Lng;
        return new Point(lng, lat) { SRID = 4326 };
    }

    private static object? ToLocationItem(Point? point)
    {
        if (point is null)
        {
            return null;
        }

        return new
        {
            lat = Math.Round((decimal)point.Y, 6),
            lng = Math.Round((decimal)point.X, 6)
        };
    }

    private static string GenerateCode(string prefix)
        => $"{prefix}-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(1000, 9999)}";

    private static string GenerateAckCode()
        => Random.Shared.Next(100000, 999999).ToString();
}
