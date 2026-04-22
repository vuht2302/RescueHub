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
    private static readonly HashSet<string> ReliefIssueStatusCodes = ["DRAFT", "ISSUED", "DELIVERED", "CANCELLED"];
    private static readonly HashSet<string> DistributionStatusCodes = ["PENDING", "COMPLETED", "CANCELLED"];
    private static readonly HashSet<string> ReliefPointStatusCodes = ["OPEN", "CLOSED", "PAUSED"];
    private static readonly HashSet<string> AckMethodCodes = ["OTP", "MANUAL"];

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
        EnsureAllowed(status, WarehouseStatusCodes, nameof(request.StatusCode));

        if (await dbContext.warehouses.AnyAsync(x => x.code == code))
        {
            throw new InvalidOperationException($"Ma kho da ton tai: {code}");
        }

        await EnsureAdminAreaExists(request.AdminAreaId);
        await EnsureUserExists(request.ManagerUserId);

        var entity = new warehouse
        {
            id = Guid.NewGuid(),
            code = code,
            name = name,
            admin_area_id = request.AdminAreaId,
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
        EnsureAllowed(status, WarehouseStatusCodes, nameof(request.StatusCode));

        if (await dbContext.warehouses.AnyAsync(x => x.id != warehouseId && x.code == code))
        {
            throw new InvalidOperationException($"Ma kho da ton tai: {code}");
        }

        await EnsureAdminAreaExists(request.AdminAreaId);
        await EnsureUserExists(request.ManagerUserId);

        warehouse.code = code;
        warehouse.name = name;
        warehouse.admin_area_id = request.AdminAreaId;
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
                lot = new { id = x.item_lot.id, lotNo = x.item_lot.lot_no, expDate = x.item_lot.exp_date, statusCode = x.item_lot.status_code },
                qtyOnHand = x.qty_on_hand,
                qtyReserved = x.qty_reserved,
                qtyAvailable = x.qty_on_hand - x.qty_reserved
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

    public async Task<object> ListReliefIssues(Guid? campaignId, Guid? reliefPointId, string? statusCode, int page, int pageSize)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var query = dbContext.relief_issues
            .AsNoTracking()
            .Include(x => x.campaign)
            .Include(x => x.relief_point)
            .Include(x => x.from_warehouse)
            .AsQueryable();

        if (campaignId.HasValue)
        {
            query = query.Where(x => x.campaign_id == campaignId.Value);
        }

        if (reliefPointId.HasValue)
        {
            query = query.Where(x => x.relief_point_id == reliefPointId.Value);
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
                reliefPoint = new { id = x.relief_point.id, code = x.relief_point.code, name = x.relief_point.name },
                fromWarehouse = new { id = x.from_warehouse.id, code = x.from_warehouse.code, name = x.from_warehouse.name },
                note = x.note,
                lineCount = x.relief_issue_lines.Count,
                createdAt = x.created_at
            })
            .ToListAsync();

        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);
        return new { items, page, pageSize, totalItems, totalPages };
    }

    public async Task<object> GetReliefIssue(Guid reliefIssueId)
    {
        var issue = await dbContext.relief_issues
            .AsNoTracking()
            .Include(x => x.campaign)
            .Include(x => x.relief_point)
            .Include(x => x.from_warehouse)
            .Include(x => x.relief_issue_lines)
            .ThenInclude(x => x.item)
            .Include(x => x.relief_issue_lines)
            .ThenInclude(x => x.item_lot)
            .FirstOrDefaultAsync(x => x.id == reliefIssueId);

        if (issue is null)
        {
            throw new InvalidOperationException("Khong tim thay phieu cap phat.");
        }

        return new
        {
            id = issue.id,
            code = issue.code,
            status = new { code = issue.status_code, name = issue.status_code, color = (string?)null },
            campaign = issue.campaign == null ? null : new { id = issue.campaign.id, code = issue.campaign.code, name = issue.campaign.name },
            reliefPoint = new { id = issue.relief_point.id, code = issue.relief_point.code, name = issue.relief_point.name },
            fromWarehouse = new { id = issue.from_warehouse.id, code = issue.from_warehouse.code, name = issue.from_warehouse.name },
            note = issue.note,
            lines = issue.relief_issue_lines.Select(x => new
            {
                id = x.id,
                item = new { id = x.item.id, code = x.item.code, name = x.item.name },
                lot = new { id = x.item_lot.id, lotNo = x.item_lot.lot_no },
                issueQty = x.issue_qty,
                unitCode = x.unit_code
            }).ToList(),
            createdAt = issue.created_at
        };
    }

    public async Task<object> CreateReliefIssue(CreateReliefIssueRequest request)
    {
        if (request.Lines is null || request.Lines.Length == 0)
        {
            throw new InvalidOperationException("Danh sach lines khong duoc rong.");
        }

        await EnsureCampaignExists(request.CampaignId);
        var reliefPoint = await dbContext.relief_points.FirstOrDefaultAsync(x => x.id == request.ReliefPointId)
            ?? throw new InvalidOperationException("Khong tim thay diem cuu tro.");
        var warehouse = await dbContext.warehouses.FirstOrDefaultAsync(x => x.id == request.FromWarehouseId)
            ?? throw new InvalidOperationException("Khong tim thay kho.");

        await using var tx = await dbContext.Database.BeginTransactionAsync();

        var issue = new relief_issue
        {
            id = Guid.NewGuid(),
            code = GenerateCode("RI"),
            campaign_id = request.CampaignId,
            relief_point_id = reliefPoint.id,
            from_warehouse_id = warehouse.id,
            status_code = "ISSUED",
            note = NormalizeOptional(request.Note),
            created_by_user_id = null,
            created_at = DateTime.UtcNow
        };

        dbContext.relief_issues.Add(issue);

        var transactionLines = request.Lines
            .Select(x => new StockMovementLine(x.ItemId, x.LotId, x.IssueQty, x.UnitCode))
            .ToArray();

        var stockTransaction = new stock_transaction
        {
            id = Guid.NewGuid(),
            code = GenerateCode("STX"),
            transaction_type_code = "ISSUE",
            warehouse_id = warehouse.id,
            reference_type_code = "RELIEF_ISSUE",
            reference_id = issue.id,
            happened_at = DateTime.UtcNow,
            note = $"Issue for relief issue {issue.code}",
            created_by_user_id = null,
            created_at = DateTime.UtcNow
        };
        dbContext.stock_transactions.Add(stockTransaction);

        var createdTransactionLines = await ApplyStockMovement(stockTransaction.id, warehouse.id, "ISSUE", transactionLines);
        dbContext.stock_transaction_lines.AddRange(createdTransactionLines);

        var issueLines = request.Lines.Select(x => new relief_issue_line
        {
            id = Guid.NewGuid(),
            relief_issue_id = issue.id,
            item_id = x.ItemId,
            item_lot_id = x.LotId,
            issue_qty = x.IssueQty,
            unit_code = NormalizeCode(x.UnitCode)
        }).ToArray();
        dbContext.relief_issue_lines.AddRange(issueLines);

        await dbContext.SaveChangesAsync();
        await tx.CommitAsync();

        return new { id = issue.id, code = issue.code, stockTransactionCode = stockTransaction.code };
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

    public async Task<object> ListDistributions(Guid? campaignId, Guid? reliefPointId, string? statusCode, int page, int pageSize)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var query = dbContext.distributions
            .AsNoTracking()
            .Include(x => x.campaign)
            .Include(x => x.relief_point)
            .Include(x => x.household)
            .AsQueryable();

        if (campaignId.HasValue)
        {
            query = query.Where(x => x.campaign_id == campaignId.Value);
        }

        if (reliefPointId.HasValue)
        {
            query = query.Where(x => x.relief_point_id == reliefPointId.Value);
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
                reliefPoint = x.relief_point == null ? null : new { id = x.relief_point.id, code = x.relief_point.code, name = x.relief_point.name },
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
            .Include(x => x.campaign)
            .OrderBy(x => x.code)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                name = x.name,
                statusCode = x.status_code,
                addressText = x.address_text,
                campaign = x.campaign == null
                    ? null
                    : new { id = x.campaign.id, code = x.campaign.code, name = x.campaign.name },
                location = ToLocationItem(x.geom)
            })
            .ToListAsync();

        return new
        {
            campaigns,
            reliefPoints,
            ackMethodCodes = AckMethodCodes.Order().Select(x => new { code = x, name = x }).ToArray(),
            distributionStatusCodes = DistributionStatusCodes.Order().Select(x => new { code = x, name = x }).ToArray()
        };
    }

    public async Task<object> ListReliefPoints(string? keyword, string? statusCode)
    {
        var query = dbContext.relief_points
            .AsNoTracking()
            .Include(x => x.campaign)
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
                location = ToLocationItem(x.geom),
                campaign = x.campaign == null
                    ? null
                    : new { id = x.campaign.id, code = x.campaign.code, name = x.campaign.name }
            })
            .ToListAsync();

        return new { items };
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

        await EnsureCampaignExists(request.CampaignId);
        await EnsureAdminAreaExists(request.AdminAreaId);
        await EnsureUserExists(request.ManagerUserId);

        if (await dbContext.relief_points.AnyAsync(x => x.code == code))
        {
            throw new InvalidOperationException($"Ma diem cuu tro da ton tai: {code}");
        }

        var campaign = await dbContext.relief_campaigns
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.id == request.CampaignId)
            ?? throw new InvalidOperationException("Khong tim thay campaign.");

        var entity = new relief_point
        {
            id = Guid.NewGuid(),
            code = code,
            name = name,
            campaign_id = request.CampaignId,
            admin_area_id = request.AdminAreaId,
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
            campaign = new { id = campaign.id, code = campaign.code, name = campaign.name },
            location = new { lat = request.Location.Lat, lng = request.Location.Lng }
        };
    }

    public async Task<object> GetReliefPoint(Guid reliefPointId)
    {
        var entity = await dbContext.relief_points
            .AsNoTracking()
            .Include(x => x.campaign)
            .FirstOrDefaultAsync(x => x.id == reliefPointId)
            ?? throw new InvalidOperationException("Khong tim thay diem cuu tro.");

        return new
        {
            id = entity.id,
            code = entity.code,
            name = entity.name,
            statusCode = entity.status_code,
            addressText = entity.address_text,
            campaign = entity.campaign == null ? null : new { id = entity.campaign.id, code = entity.campaign.code, name = entity.campaign.name },
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
        await EnsureCampaignExists(request.CampaignId);
        await EnsureAdminAreaExists(request.AdminAreaId);
        await EnsureUserExists(request.ManagerUserId);

        if (await dbContext.relief_points.AnyAsync(x => x.id != reliefPointId && x.code == code))
        {
            throw new InvalidOperationException($"Ma diem cuu tro da ton tai: {code}");
        }

        entity.code = code;
        entity.name = name;
        entity.campaign_id = request.CampaignId;
        entity.admin_area_id = request.AdminAreaId;
        entity.address_text = addressText;
        entity.geom = new Point((double)request.Location.Lng, (double)request.Location.Lat) { SRID = 4326 };
        entity.manager_user_id = request.ManagerUserId;
        entity.status_code = statusCode;

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
            .Include(x => x.relief_point)
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
            reliefPoint = distribution.relief_point == null ? null : new { id = distribution.relief_point.id, code = distribution.relief_point.code, name = distribution.relief_point.name },
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
                lot = new { id = x.item_lot.id, lotNo = x.item_lot.lot_no },
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
        await EnsureReliefPointExists(request.ReliefPointId);
        await EnsureTeamExists(request.TeamId);

        var reliefRequest = await dbContext.relief_requests
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.id == request.ReliefRequestId)
            ?? throw new InvalidOperationException("Khong tim thay relief request.");

        var team = await dbContext.teams
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.id == request.TeamId)
            ?? throw new InvalidOperationException("Khong tim thay team duoc phan cong.");

        var recipientName = NormalizeRequired(reliefRequest.requester_name, nameof(reliefRequest.requester_name));
        var recipientAddress = NormalizeRequired(reliefRequest.address_text, nameof(reliefRequest.address_text));
        var normalizedRecipientPhone = NormalizeOptional(reliefRequest.requester_phone);
        var recipientMemberCount = reliefRequest.household_count <= 0 ? 1 : reliefRequest.household_count;

        var household = await dbContext.households.FirstOrDefaultAsync(x =>
            x.head_name == recipientName &&
            x.address_text == recipientAddress &&
            x.phone == normalizedRecipientPhone);

        if (household is null)
        {
            household = new household
            {
                id = Guid.NewGuid(),
                code = GenerateCode("HH"),
                head_name = recipientName,
                phone = normalizedRecipientPhone,
                admin_area_id = reliefRequest.admin_area_id,
                address_text = recipientAddress,
                geom = reliefRequest.geom,
                member_count = recipientMemberCount,
                vulnerable_count = 0
            };
            dbContext.households.Add(household);
        }
        else
        {
            household.admin_area_id = reliefRequest.admin_area_id;
            household.member_count = recipientMemberCount;
            household.geom = reliefRequest.geom;
        }

        var ackMethod = NormalizeCode(request.AckMethodCode);
        EnsureAllowed(ackMethod, AckMethodCodes, nameof(request.AckMethodCode));

        var warehouseId = await ResolveWarehouseForDistribution(request.ReliefPointId);

        await using var tx = await dbContext.Database.BeginTransactionAsync();

        var distribution = new distribution
        {
            id = Guid.NewGuid(),
            code = GenerateCode("DS"),
            campaign_id = request.CampaignId ?? reliefRequest.campaign_id,
            relief_point_id = request.ReliefPointId,
            household_id = household.id,
            linked_incident_id = reliefRequest.linked_incident_id,
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
            .Select(x => new StockMovementLine(x.ItemId, x.LotId, x.Qty, x.UnitCode))
            .ToArray();
        var createdTransactionLines = await ApplyStockMovement(stockTransaction.id, warehouseId, "ISSUE", movementLines);
        dbContext.stock_transaction_lines.AddRange(createdTransactionLines);

        var distributionLines = request.Lines.Select(x => new distribution_line
        {
            id = Guid.NewGuid(),
            distribution_id = distribution.id,
            item_id = x.ItemId,
            item_lot_id = x.LotId,
            qty = x.Qty,
            unit_code = NormalizeCode(x.UnitCode)
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
            distributionId = distribution.id,
            distributionCode = distribution.code,
            ackCode,
            team = new { id = team.id, code = team.code, name = team.name },
            reliefRequest = new { id = reliefRequest.id, code = reliefRequest.code }
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

    private async Task<Guid> ResolveWarehouseForDistribution(Guid? reliefPointId)
    {
        if (!reliefPointId.HasValue)
        {
            throw new InvalidOperationException("Can reliefPointId de xac dinh kho cap phat.");
        }

        var reliefPoint = await dbContext.relief_points
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.id == reliefPointId.Value)
            ?? throw new InvalidOperationException("Khong tim thay diem cuu tro.");

        var candidateWarehouse = await dbContext.warehouses
            .AsNoTracking()
            .Where(x => x.admin_area_id == reliefPoint.admin_area_id)
            .OrderBy(x => x.code)
            .FirstOrDefaultAsync();

        if (candidateWarehouse is not null)
        {
            return candidateWarehouse.id;
        }

        var fallback = await dbContext.warehouses.AsNoTracking().OrderBy(x => x.code).FirstOrDefaultAsync();
        if (fallback is null)
        {
            throw new InvalidOperationException("He thong chua co kho de cap phat.");
        }

        return fallback.id;
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

    private static string NormalizeCode(string value)
        => NormalizeRequired(value, nameof(value)).ToUpperInvariant();

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
