namespace RescueHub.Modules.AI.Application;

/// <summary>
/// Tham so phan tich AI cho man hinh chi tiet incident.
/// </summary>
/// <param name="IncidentId">Id incident can phan tich.</param>
/// <param name="IncludeDispatchRecommendation">Co chay de xuat dieu phoi hay khong.</param>
/// <param name="IncludeDedupe">Co chay phat hien trung lap hay khong.</param>
public sealed record AnalyzeIncidentRequest(Guid IncidentId, bool IncludeDispatchRecommendation = true, bool IncludeDedupe = true);

/// <summary>
/// Tham so phan tich AI cho man hinh chi tiet campaign cuu tro.
/// </summary>
/// <param name="ReliefCampaignId">Id campaign can phan tich du bao cap phat.</param>
public sealed record AnalyzeReliefCampaignRequest(Guid ReliefCampaignId);

/// <summary>
/// Dieu kien truy van danh sach AI suggestions.
/// </summary>
/// <param name="TargetEntityType">Loai entity dich (vi du INCIDENT, RELIEF_CAMPAIGN).</param>
/// <param name="TargetEntityId">Id entity dich can loc.</param>
/// <param name="ApprovalStatusCode">Trang thai duyet suggestion (PENDING, APPROVED, IGNORED).</param>
/// <param name="Page">So trang (bat dau tu 1).</param>
/// <param name="PageSize">So phan tu moi trang.</param>
public sealed record ListAiSuggestionsQuery(string? TargetEntityType, Guid? TargetEntityId, string? ApprovalStatusCode, int Page = 1, int PageSize = 20);