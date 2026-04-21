namespace RescueHub.Modules.Incidents.Application;

public sealed record CreateWarehouseRequest(
    string WarehouseCode,
    string WarehouseName,
    Guid? AdminAreaId,
    string Address,
    GeoPointRequest? Location,
    Guid? ManagerUserId,
    string StatusCode);

public sealed record UpdateWarehouseRequest(
    string WarehouseCode,
    string WarehouseName,
    Guid? AdminAreaId,
    string Address,
    GeoPointRequest? Location,
    Guid? ManagerUserId,
    string StatusCode);

public sealed record CreateItemRequest(
    string ItemCode,
    string ItemName,
    string ItemCategoryCode,
    string UnitCode,
    bool RequiresLotTracking,
    bool RequiresExpiryTracking,
    string IssuePolicyCode,
    bool IsActive);

public sealed record UpdateItemRequest(
    string ItemCode,
    string ItemName,
    string ItemCategoryCode,
    string UnitCode,
    bool RequiresLotTracking,
    bool RequiresExpiryTracking,
    string IssuePolicyCode,
    bool IsActive);

public sealed record CreateLotRequest(
    Guid ItemId,
    string LotNo,
    DateOnly? MfgDate,
    DateOnly? ExpDate,
    string? DonorName,
    string StatusCode);

public sealed record UpdateLotRequest(
    Guid ItemId,
    string LotNo,
    DateOnly? MfgDate,
    DateOnly? ExpDate,
    string? DonorName,
    string StatusCode);

public sealed record CreateStockTransactionLineRequest(
    Guid ItemId,
    Guid LotId,
    decimal Qty,
    string UnitCode);

public sealed record CreateStockTransactionRequest(
    string TransactionTypeCode,
    Guid WarehouseId,
    string? ReferenceType,
    Guid? ReferenceId,
    DateTime HappenedAt,
    string? Note,
    CreateStockTransactionLineRequest[] Lines);

public sealed record CreateReliefIssueLineRequest(
    Guid ItemId,
    Guid LotId,
    decimal IssueQty,
    string UnitCode);

public sealed record CreateReliefIssueRequest(
    Guid? CampaignId,
    Guid ReliefPointId,
    Guid FromWarehouseId,
    CreateReliefIssueLineRequest[] Lines,
    string? Note);

public sealed record CreateHouseholdRequest(
    string HeadName,
    string? Phone,
    Guid? AdminAreaId,
    string Address,
    GeoPointRequest? Location,
    int MemberCount,
    int VulnerableCount);

public sealed record UpdateHouseholdRequest(
    string HeadName,
    string? Phone,
    Guid? AdminAreaId,
    string Address,
    GeoPointRequest? Location,
    int MemberCount,
    int VulnerableCount);

public sealed record CreateDistributionLineRequest(
    Guid ItemId,
    Guid LotId,
    decimal Qty,
    string UnitCode);

public sealed record RecipientLocationRequest(
    decimal Lat,
    decimal Lng,
    string? AddressText);

public sealed record CreateDistributionRequest(
    Guid? CampaignId,
    Guid? ReliefPointId,
    string RecipientName,
    string? RecipientPhone,
    Guid? RecipientAdminAreaId,
    RecipientLocationRequest RecipientLocation,
    int RecipientMemberCount,
    int RecipientVulnerableCount,
    Guid? IncidentId,
    CreateDistributionLineRequest[] Lines,
    string AckMethodCode,
    string? Note);

public sealed record DistributionAckRequest(
    string AckMethodCode,
    string? AckCode,
    string? AckByName,
    string? AckPhone,
    string? AckNote);