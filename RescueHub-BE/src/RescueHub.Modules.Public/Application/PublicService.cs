using System.Security.Cryptography;
using System.Collections.Concurrent;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NetTopologySuite.Geometries;
using RescueHub.BuildingBlocks.Application;
using RescueHub.Modules.Media.Application;
using RescueHub.Persistence;
using RescueHub.Persistence.Entities.Scaffolded;
using Twilio;
using Twilio.Rest.Verify.V2.Service;

namespace RescueHub.Modules.Public.Application;

public sealed class PublicService(
    RescueHubDbContext dbContext,
    IMediaService mediaService,
    IConfiguration configuration,
    IDistributedCache distributedCache,
    ILogger<PublicService> logger) : IPublicService
{
    private static readonly ConcurrentDictionary<string, LocalOtpEntry> LocalOtpStore = new();
    private const string DefaultTwilioFixedPhone = "+84968675585";

    private sealed record LocalOtpEntry(string OtpCode, DateTime ExpiredAtUtc);

    public async Task<object> GetBootstrap()
    {
        var quickIncidentTypes = await dbContext.incidents
            .Select(x => x.incident_type_code)
            .Distinct()
            .OrderBy(x => x)
            .Select(x => new { code = x, name = x })
            .Take(10)
            .ToListAsync();

        return new
        {
            hotline = "1900xxxx",
            defaultMapCenter = new { lat = 10.123, lng = 106.123 },
            quickIncidentTypes,
            quickActions = new object[]
            {
                new { code = "SOS", label = "SOS khan cap" },
                new { code = "RESCUE_REQUEST", label = "Gui cuu ho" },
                new { code = "RELIEF_REQUEST", label = "Toi can cuu tro" },
                new { code = "TRACK", label = "Theo doi yeu cau" }
            }
        };
    }

    public async Task<object> GetMapData(double lat, double lng, double radiusKm)
    {
        var radiusDeg = radiusKm / 111d;

        var rawPoints = await dbContext.relief_points
            .AsNoTracking()
            .Where(x => x.geom != null)
            .OrderByDescending(x => x.opens_at)
            .Take(100)
            .Select(x => new
            {
                x.id,
                x.name,
                address = x.address_text,
                lat = x.geom == null ? (double?)null : x.geom.Y,
                lng = x.geom == null ? (double?)null : x.geom.X,
                statusCode = x.status_code
            })
            .ToListAsync();

        var markers = rawPoints
            .Where(x => x.lat.HasValue && x.lng.HasValue)
            .Where(x => Math.Abs(x.lat!.Value - lat) <= radiusDeg && Math.Abs(x.lng!.Value - lng) <= radiusDeg)
            .Select(x => new
            {
                id = x.id,
                markerType = "RELIEF_POINT",
                title = x.name,
                position = new { lat = x.lat, lng = x.lng, addressText = x.address },
                status = new
                {
                    code = x.statusCode,
                    name = string.Equals(x.statusCode, "OPEN", StringComparison.OrdinalIgnoreCase) ? "Dang mo" : x.statusCode,
                    color = string.Equals(x.statusCode, "OPEN", StringComparison.OrdinalIgnoreCase) ? "#22C55E" : "#9CA3AF"
                }
            })
            .ToList();

        return new { markers };
    }

    public async Task<object> GetAlerts()
    {
        var items = await dbContext.notifications
            .AsNoTracking()
            .Where(x => x.type_code == "PUBLIC_ALERT" || x.type_code == "INCIDENT")
            .OrderByDescending(x => x.created_at)
            .Take(20)
            .Select(x => new
            {
                id = x.id,
                eventType = x.type_code,
                title = x.title,
                message = x.content,
                sentAt = x.created_at
            })
            .ToListAsync();

        return new { items };
    }

    public async Task<object> GetRescueForm()
    {
        var incidentTypes = await dbContext.incidents
            .Select(x => x.incident_type_code)
            .Distinct()
            .OrderBy(x => x)
            .Select(x => new { code = x, name = x })
            .ToListAsync();

        var dynamicFields = FloodSceneFactorCatalog.Definitions
            .Select(x => new
            {
                factorCode = x.Code,
                factorName = x.Name,
                valueType = x.ValueType,
                unitCode = x.UnitCode,
                sortOrder = x.SortOrder
            })
            .ToArray();

        return new
        {
            incidentTypes,
            dynamicFields,
            vulnerableGroups = new[]
            {
                new { code = "CHILDREN", name = "Tre em" },
                new { code = "ELDERLY", name = "Nguoi cao tuoi" },
                new { code = "PREGNANT", name = "Phu nu mang thai" },
                new { code = "PWD", name = "Nguoi khuyet tat" }
            }
        };
    }

    public async Task<object> CreateSos(CreateSosRequest request)
        => await CreateIncidentCore(
            request.IncidentTypeCode,
            request.ReporterName,
            request.ReporterPhone,
            request.Description,
            request.VictimCountEstimate,
            request.HasInjured ? 1 : 0,
            request.HasVulnerablePeople ? 1 : 0,
            request.Location,
            request.FileIds,
            null,
            isSos: true);

    public async Task<object> CreateIncident(CreatePublicIncidentRequest request)
        => await CreateIncidentCore(
            request.IncidentTypeCode,
            request.ReporterName,
            request.ReporterPhone,
            request.Description,
            request.VictimCountEstimate,
            request.InjuredCountEstimate,
            request.VulnerableCountEstimate,
            request.Location,
            request.FileIds,
            request.SceneDetails,
            isSos: false);

    public async Task<object> RequestTrackingOtp(RequestTrackingOtpRequest request)
    {
        var purpose = request.Purpose.Trim().ToUpperInvariant();
        var normalizedPhone = NormalizePhoneForOtp(request.Phone);
        if (!string.Equals(purpose, "TRACKING", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Purpose khong hop le cho tracking.");
        }

        var otpCode = GenerateOtp();
        var expiredAt = DateTime.UtcNow.AddMinutes(5);

        await SaveOtpAsync(normalizedPhone, purpose, otpCode, expiredAt);

        if (IsTwilioVerifyEnabled())
        {
            var sent = await SendOtpViaTwilioVerifyAsync(normalizedPhone, purpose);
            if (sent)
            {
                return new
                {
                    expiredAt,
                    channel = "SMS"
                };
            }
        }

        return new
        {
            expiredAt,
            otpCode
        };
    }

    public async Task<object> VerifyTrackingOtp(VerifyTrackingOtpRequest request)
    {
        var purpose = request.Purpose.Trim().ToUpperInvariant();
        var normalizedPhone = NormalizePhoneForOtp(request.Phone);
        if (!string.Equals(purpose, "TRACKING", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Purpose khong hop le cho tracking.");
        }

        var valid = IsTwilioVerifyEnabled()
            ? await ValidateOtpByTwilioVerifyAsync(normalizedPhone, purpose, request.OtpCode)
            : await ValidateOtpAsync(normalizedPhone, purpose, request.OtpCode);

        if (!valid)
        {
            throw new InvalidOperationException("OTP khong hop le hoac da het han.");
        }

        var trackingToken = BuildSignedTrackingToken(normalizedPhone);

        return new { trackingToken };
    }

    public async Task<object> GetMyRescueRequests(string phone, string trackingToken, int page, int pageSize)
    {
        EnsureTrackingAccess(phone, trackingToken);

        var normalizedPhone = NormalizePhoneForOtp(phone);
        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var query = dbContext.incidents
            .AsNoTracking()
            .Include(x => x.incident_location)
            .Where(x => x.reporter_phone == normalizedPhone)
            .OrderByDescending(x => x.created_at)
            .AsQueryable();

        var total = await query.CountAsync();
        var items = await query
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(x => new
            {
                incidentId = x.id,
                incidentCode = x.code,
                trackingCode = x.code,
                incidentTypeCode = x.incident_type_code,
                status = new { code = x.status_code, name = x.status_code, color = (string?)null },
                priority = new { code = x.priority_code, name = x.priority_code, color = (string?)null },
                description = x.description,
                location = x.incident_location == null
                    ? null
                    : new
                    {
                        lat = x.incident_location.lat,
                        lng = x.incident_location.lng,
                        addressText = x.incident_location.address_text,
                        landmark = x.incident_location.landmark
                    },
                reportedAt = x.created_at,
                updatedAt = x.updated_at
            })
            .ToListAsync();

        return new
        {
            page = safePage,
            pageSize = safePageSize,
            total,
            items
        };
    }

    public async Task<object> GetMyReliefRequests(string phone, string trackingToken, int page, int pageSize)
    {
        EnsureTrackingAccess(phone, trackingToken);

        var normalizedPhone = NormalizePhoneForOtp(phone);
        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var query = dbContext.relief_requests
            .AsNoTracking()
            .Include(x => x.relief_request_items)
            .ThenInclude(x => x.item)
            .Where(x => x.requester_phone == normalizedPhone)
            .OrderByDescending(x => x.created_at)
            .AsQueryable();

        var total = await query.CountAsync();
        var items = await query
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(x => new
            {
                reliefRequestId = x.id,
                requestCode = x.code,
                status = new { code = x.status_code, name = x.status_code, color = (string?)null },
                householdCount = x.household_count,
                note = x.note,
                requestedAt = x.created_at,
                updatedAt = x.updated_at,
                items = x.relief_request_items.Select(i => new
                {
                    supportTypeCode = i.item.code,
                    supportTypeName = i.item.name,
                    requestedQty = i.requested_qty,
                    approvedQty = i.approved_qty,
                    unitCode = i.unit_code
                }).ToList()
            })
            .ToListAsync();

        return new
        {
            page = safePage,
            pageSize = safePageSize,
            total,
            items
        };
    }

    public async Task<object> GetMyHistory(Guid? userId, string? phone, int page, int pageSize)
    {
        var normalizedPhone = NormalizePhoneForOtp(phone ?? string.Empty);
        if (!userId.HasValue && string.IsNullOrWhiteSpace(normalizedPhone))
        {
            throw new InvalidOperationException("Khong xac dinh duoc citizen dang dang nhap.");
        }

        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var rescueQuery = dbContext.incidents
            .AsNoTracking()
            .Include(x => x.incident_location)
            .AsQueryable();

        if (userId.HasValue && !string.IsNullOrWhiteSpace(normalizedPhone))
        {
            var uid = userId.Value;
            rescueQuery = rescueQuery.Where(x => x.created_by_user_id == uid || x.reporter_phone == normalizedPhone);
        }
        else if (userId.HasValue)
        {
            var uid = userId.Value;
            rescueQuery = rescueQuery.Where(x => x.created_by_user_id == uid);
        }
        else
        {
            rescueQuery = rescueQuery.Where(x => x.reporter_phone == normalizedPhone);
        }

        rescueQuery = rescueQuery.OrderByDescending(x => x.created_at);

        var rescueTotal = await rescueQuery.CountAsync();
        var rescueItems = await rescueQuery
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(x => new
            {
                incidentId = x.id,
                incidentCode = x.code,
                trackingCode = x.code,
                incidentTypeCode = x.incident_type_code,
                status = new { code = x.status_code, name = x.status_code, color = (string?)null },
                priority = new { code = x.priority_code, name = x.priority_code, color = (string?)null },
                description = x.description,
                location = x.incident_location == null
                    ? null
                    : new
                    {
                        lat = x.incident_location.lat,
                        lng = x.incident_location.lng,
                        addressText = x.incident_location.address_text,
                        landmark = x.incident_location.landmark
                    },
                reportedAt = x.created_at,
                updatedAt = x.updated_at
            })
            .ToListAsync();

        IQueryable<relief_request> reliefQuery = dbContext.relief_requests
            .AsNoTracking()
            .Include(x => x.relief_request_items)
            .ThenInclude(x => x.item)
            .AsQueryable();

        if (string.IsNullOrWhiteSpace(normalizedPhone))
        {
            reliefQuery = reliefQuery.Where(_ => false);
        }
        else
        {
            reliefQuery = reliefQuery.Where(x => x.requester_phone == normalizedPhone);
        }

        reliefQuery = reliefQuery.OrderByDescending(x => x.created_at);

        var reliefTotal = await reliefQuery.CountAsync();
        var reliefItems = await reliefQuery
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(x => new
            {
                reliefRequestId = x.id,
                requestCode = x.code,
                status = new { code = x.status_code, name = x.status_code, color = (string?)null },
                householdCount = x.household_count,
                note = x.note,
                requestedAt = x.created_at,
                updatedAt = x.updated_at,
                items = x.relief_request_items.Select(i => new
                {
                    supportTypeCode = i.item.code,
                    supportTypeName = i.item.name,
                    requestedQty = i.requested_qty,
                    approvedQty = i.approved_qty,
                    unitCode = i.unit_code
                }).ToList()
            })
            .ToListAsync();

        return new
        {
            rescues = new
            {
                page = safePage,
                pageSize = safePageSize,
                total = rescueTotal,
                items = rescueItems
            },
            reliefRequests = new
            {
                page = safePage,
                pageSize = safePageSize,
                total = reliefTotal,
                items = reliefItems
            }
        };
    }

    public async Task<object> GetTrackingRescue(string trackingCode)
    {
        var incident = await ResolveIncidentByTrackingCode(trackingCode);

        var history = await dbContext.incident_status_histories
            .AsNoTracking()
            .Where(x => x.incident_id == incident.id)
            .OrderByDescending(x => x.changed_at)
            .Take(20)
            .Select(x => new
            {
                time = x.changed_at,
                statusName = x.to_status_code,
                note = x.note
            })
            .ToListAsync();

        var hasAcked = await dbContext.rescue_acks
            .AsNoTracking()
            .AnyAsync(x => x.incident_id == incident.id);

        return new
        {
            incidentCode = incident.code,
            status = new { code = incident.status_code, name = incident.status_code, color = "#3B82F6" },
            latestUpdate = history.FirstOrDefault()?.note ?? "He thong da tiep nhan yeu cau",
            history,
            canAckRescue = !hasAcked,
            relatedRelief = new
            {
                needed = incident.need_relief,
                status = incident.need_relief ? "PENDING" : "NONE"
            }
        };
    }

    public async Task<object> AckTrackingRescue(string trackingCode, AckRescueRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.AckCode))
        {
            throw new InvalidOperationException("Ack code la bat buoc.");
        }

        var incident = await ResolveIncidentByTrackingCode(trackingCode);
        var now = DateTime.UtcNow;

        var existingAck = await dbContext.rescue_acks.FirstOrDefaultAsync(x => x.incident_id == incident.id);
        if (existingAck is not null)
        {
            existingAck.ack_method_code = request.AckMethodCode;
            existingAck.note = request.Note;
            existingAck.ack_at = now;
        }
        else
        {
            dbContext.rescue_acks.Add(new rescue_ack
            {
                id = Guid.NewGuid(),
                incident_id = incident.id,
                ack_method_code = request.AckMethodCode,
                ack_by_name = incident.reporter_name,
                ack_phone = incident.reporter_phone,
                ack_at = now,
                note = request.Note
            });
        }

        await dbContext.SaveChangesAsync();

        return new
        {
            trackingCode,
            acked = true,
            ackedAt = now
        };
    }

    public async Task<object> CreateReliefRequest(CreateReliefRequest request)
    {
        var now = DateTime.UtcNow;
        var prefix = $"CT-{now:yyyyMMdd}";
        var todayCount = await dbContext.relief_requests.CountAsync(x => x.code.StartsWith(prefix));
        var requestCode = $"{prefix}-{(todayCount + 1):000}";

        var reliefRequest = new relief_request
        {
            id = Guid.NewGuid(),
            code = requestCode,
            source_type_code = "PUBLIC",
            requester_name = request.RequesterName,
            requester_phone = request.RequesterPhone,
            status_code = "NEW",
            household_count = request.HouseholdCount ?? 1,
            address_text = "UNKNOWN",
            note = request.Note,
            created_at = now,
            updated_at = now
        };
        dbContext.relief_requests.Add(reliefRequest);

        var incomingItems = request.Items?.ToArray() ?? Array.Empty<ReliefItemRequest>();
        var itemCodes = incomingItems
            .Select(x => x.SupportTypeCode?.Trim())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x!.ToUpperInvariant())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var itemMap = itemCodes.Length == 0
            ? new Dictionary<string, item>(StringComparer.OrdinalIgnoreCase)
            : await dbContext.items
                .Where(x => itemCodes.Contains(x.code))
                .ToDictionaryAsync(x => x.code, x => x, StringComparer.OrdinalIgnoreCase);

        var ignoredItems = new List<object>();
        var acceptedCount = 0;

        foreach (var item in incomingItems)
        {
            var normalizedSupportTypeCode = item.SupportTypeCode?.Trim().ToUpperInvariant();
            if (string.IsNullOrWhiteSpace(normalizedSupportTypeCode))
            {
                ignoredItems.Add(new
                {
                    supportTypeCode = item.SupportTypeCode,
                    reason = "supportTypeCode is empty"
                });
                continue;
            }

            if (item.RequestedQty <= 0)
            {
                ignoredItems.Add(new
                {
                    supportTypeCode = normalizedSupportTypeCode,
                    reason = "requestedQty must be greater than 0"
                });
                continue;
            }

            if (!itemMap.TryGetValue(normalizedSupportTypeCode, out var mappedItem))
            {
                ignoredItems.Add(new
                {
                    supportTypeCode = normalizedSupportTypeCode,
                    reason = "supportTypeCode not mapped to item master"
                });
                continue;
            }

            dbContext.relief_request_items.Add(new relief_request_item
            {
                id = Guid.NewGuid(),
                relief_request_id = reliefRequest.id,
                item_id = mappedItem.id,
                requested_qty = item.RequestedQty,
                approved_qty = 0,
                unit_code = string.IsNullOrWhiteSpace(item.UnitCode) ? mappedItem.unit_code : item.UnitCode
            });
            acceptedCount++;
        }

        await dbContext.SaveChangesAsync();

        return new
        {
            reliefRequestId = reliefRequest.id,
            requestCode = reliefRequest.code,
            status = new { code = "NEW", name = "Da tiep nhan", color = "#EF4444" },
            requestedAt = reliefRequest.created_at,
            itemSummary = new
            {
                receivedCount = incomingItems.Length,
                acceptedCount,
                ignoredCount = ignoredItems.Count,
                ignoredItems
            }
        };
    }

    public async Task<object> GetTrackingRelief(string requestCode)
    {
        var reliefRequest = await dbContext.relief_requests
            .AsNoTracking()
            .Include(x => x.relief_request_items)
            .ThenInclude(x => x.item)
            .FirstOrDefaultAsync(x => x.code == requestCode);

        if (reliefRequest is null)
        {
            throw new InvalidOperationException("Khong tim thay yeu cau cuu tro theo request code.");
        }

        var distributions = await dbContext.distributions
            .AsNoTracking()
            .Where(x => x.linked_incident_id == reliefRequest.linked_incident_id || x.code == requestCode)
            .Select(x => new { x.id, distribution_code = x.code, distributed_at = x.created_at, x.ack_method_code })
            .Take(10)
            .ToListAsync();

        var hasAck = await dbContext.distribution_acks
            .AsNoTracking()
            .AnyAsync(x => x.distribution.code == requestCode || x.distribution.linked_incident_id == reliefRequest.linked_incident_id);

        return new
        {
            requestCode = reliefRequest.code,
            status = new { code = reliefRequest.status_code, name = reliefRequest.status_code, color = "#F59E0B" },
            latestUpdate = reliefRequest.note,
            requestedAt = reliefRequest.created_at,
            items = reliefRequest.relief_request_items.Select(x => new
            {
                supportTypeCode = x.item.code,
                requestedQty = x.requested_qty,
                approvedQty = x.approved_qty,
                fulfilledQty = 0
            }).ToList(),
            canAckRelief = !hasAck,
            distributions
        };
    }

    public async Task<object> AckTrackingRelief(string requestCode, AckReliefRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.AckCode))
        {
            throw new InvalidOperationException("Ack code la bat buoc.");
        }

        var distribution = await dbContext.distributions
            .OrderByDescending(x => x.created_at)
            .FirstOrDefaultAsync(x => x.code == requestCode);

        if (distribution is null)
        {
            var reliefRequest = await dbContext.relief_requests.FirstOrDefaultAsync(x => x.code == requestCode);
            if (reliefRequest?.linked_incident_id != null)
            {
                distribution = await dbContext.distributions
                    .OrderByDescending(x => x.created_at)
                    .FirstOrDefaultAsync(x => x.linked_incident_id == reliefRequest.linked_incident_id);
            }
        }

        if (distribution is null)
        {
            throw new InvalidOperationException("Khong tim thay phat cuu tro theo request code.");
        }

        var now = DateTime.UtcNow;
        dbContext.distribution_acks.Add(new distribution_ack
        {
            id = Guid.NewGuid(),
            distribution_id = distribution.id,
            ack_method_code = request.AckMethodCode,
            ack_code = request.AckCode,
            ack_note = request.Note,
            ack_at = now
        });

        await dbContext.SaveChangesAsync();

        return new
        {
            requestCode,
            acked = true,
            ackedAt = now
        };
    }

    private async Task<object> CreateIncidentCore(
        string incidentTypeCode,
        string reporterName,
        string reporterPhone,
        string? description,
        int? victimCountEstimate,
        int? injuredCountEstimate,
        int? vulnerableCountEstimate,
        SosLocationRequest location,
        IReadOnlyCollection<Guid>? fileIds,
        IReadOnlyCollection<PublicSceneDetailRequest>? sceneDetails,
        bool isSos)
    {
        ValidateCreateIncidentInput(
            incidentTypeCode,
            reporterName,
            reporterPhone,
            victimCountEstimate,
            injuredCountEstimate,
            vulnerableCountEstimate,
            location);

        ValidateSceneDetailCodes(sceneDetails);

        incidentTypeCode = incidentTypeCode.Trim().ToUpperInvariant();
        reporterName = reporterName.Trim();
        reporterPhone = reporterPhone.Trim();

        var now = DateTime.UtcNow;
        var prefix = $"SC-{now:yyyyMMdd}";
        var todayCount = await dbContext.incidents.CountAsync(x => x.code.StartsWith(prefix));
        var incidentCode = $"{prefix}-{(todayCount + 1):000}";

        var incident = new incident
        {
            id = Guid.NewGuid(),
            code = incidentCode,
            incident_type_code = incidentTypeCode,
            incident_channel_code = "WEB",
            status_code = "NEW",
            priority_code = "HIGH",
            is_sos = isSos,
            reporter_name = reporterName,
            reporter_phone = reporterPhone,
            description = description ?? string.Empty,
            estimated_victim_count = victimCountEstimate ?? 0,
            estimated_injured_count = injuredCountEstimate ?? 0,
            estimated_vulnerable_count = vulnerableCountEstimate ?? 0,
            need_relief = sceneDetails is { Count: > 0 },
            contact_verified = false,
            created_at = now,
            updated_at = now
        };

        dbContext.incidents.Add(incident);

        dbContext.incident_locations.Add(new incident_location
        {
            id = Guid.NewGuid(),
            incident_id = incident.id,
            address_text = string.IsNullOrWhiteSpace(location.AddressText) ? "UNKNOWN" : location.AddressText,
            landmark = location.Landmark,
            lat = location.Lat,
            lng = location.Lng,
            geom = new Point((double)location.Lng, (double)location.Lat) { SRID = 4326 },
            created_at = now
        });

        if (fileIds is { Count: > 0 })
        {
            foreach (var fileId in fileIds.Distinct())
            {
                var media = await mediaService.GetAsync(fileId, CancellationToken.None);
                if (media is null)
                {
                    throw new InvalidOperationException($"FileId khong ton tai: {fileId}");
                }

                dbContext.incident_media.Add(new incident_medium
                {
                    id = Guid.NewGuid(),
                    incident_id = incident.id,
                    file_public_id = media.PublicId,
                    file_url = media.SecureUrl,
                    thumbnail_url = media.ThumbnailUrl,
                    ai_optimized_url = media.AiOptimizedUrl,
                    media_type_code = media.ResourceType.ToUpperInvariant(),
                    width = media.Width == 0 ? null : media.Width,
                    height = media.Height == 0 ? null : media.Height,
                    bytes = media.Bytes == 0 ? null : media.Bytes,
                    captured_at = now,
                    uploaded_at = media.CreatedAtUtc
                });
            }
        }

        dbContext.incident_status_histories.Add(new incident_status_history
        {
            id = Guid.NewGuid(),
            incident_id = incident.id,
            from_status_code = null,
            to_status_code = "NEW",
            action_code = "CREATE",
            note = description,
            changed_at = now
        });

        await dbContext.SaveChangesAsync();

        var trackingCode = incident.code;

        return new
        {
            incidentId = incident.id,
            incidentCode = incident.code,
            trackingCode,
            status = new { code = "NEW", name = "Da tiep nhan", color = "#EF4444" },
            reportedAt = incident.created_at
        };
    }

    private static void ValidateCreateIncidentInput(
        string incidentTypeCode,
        string reporterName,
        string reporterPhone,
        int? victimCountEstimate,
        int? injuredCountEstimate,
        int? vulnerableCountEstimate,
        SosLocationRequest location)
    {
        if (!string.Equals(incidentTypeCode?.Trim(), "FLOOD", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("IncidentTypeCode chi chap nhan FLOOD trong phien ban hien tai.");
        }

        if (string.IsNullOrWhiteSpace(reporterName))
        {
            throw new InvalidOperationException("ReporterName la bat buoc.");
        }

        if (string.IsNullOrWhiteSpace(reporterPhone))
        {
            throw new InvalidOperationException("ReporterPhone la bat buoc.");
        }

        if (!Regex.IsMatch(reporterPhone.Trim(), @"^\+?\d{9,15}$"))
        {
            throw new InvalidOperationException("ReporterPhone khong hop le.");
        }

        if (victimCountEstimate is < 0 || injuredCountEstimate is < 0 || vulnerableCountEstimate is < 0)
        {
            throw new InvalidOperationException("So lieu uoc tinh khong duoc am.");
        }

        var victim = victimCountEstimate ?? 0;
        var injured = injuredCountEstimate ?? 0;
        var vulnerable = vulnerableCountEstimate ?? 0;

        if (victim == 0 && (injured > 0 || vulnerable > 0))
        {
            throw new InvalidOperationException("Khi VictimCountEstimate = 0 thi Injured/Vulnerable phai = 0.");
        }

        if (victim > 0 && (injured > victim || vulnerable > victim))
        {
            throw new InvalidOperationException("Injured/Vulnerable khong duoc lon hon VictimCountEstimate.");
        }

        if (location.Lat < -90 || location.Lat > 90 || location.Lng < -180 || location.Lng > 180)
        {
            throw new InvalidOperationException("Toa do khong hop le.");
        }
    }

    private static void ValidateSceneDetailCodes(IReadOnlyCollection<PublicSceneDetailRequest>? sceneDetails)
    {
        if (sceneDetails is null || sceneDetails.Count == 0)
        {
            return;
        }

        foreach (var detail in sceneDetails)
        {
            if (string.IsNullOrWhiteSpace(detail.FactorCode))
            {
                throw new InvalidOperationException("SceneDetails.factorCode la bat buoc.");
            }

            if (!FloodSceneFactorCatalog.IsSupported(detail.FactorCode))
            {
                throw new InvalidOperationException($"FactorCode khong hop le: {detail.FactorCode}");
            }
        }
    }

    private async Task<incident> ResolveIncidentByTrackingCode(string trackingCode)
    {
        var incidentByCode = await dbContext.incidents.FirstOrDefaultAsync(x => x.code == trackingCode);

        if (incidentByCode is not null)
        {
            return incidentByCode;
        }

        if (trackingCode.StartsWith("TK-", StringComparison.OrdinalIgnoreCase) && trackingCode.Length > 3)
        {
            var suffix = trackingCode[3..];
            var incidentFromSuffix = await dbContext.incidents
                .FirstOrDefaultAsync(x => x.id.ToString("N").StartsWith(suffix, StringComparison.OrdinalIgnoreCase));
            if (incidentFromSuffix is not null)
            {
                return incidentFromSuffix;
            }
        }

        throw new InvalidOperationException("Khong tim thay yeu cau theo tracking code.");
    }

    private static string GenerateOtp()
    {
        Span<byte> bytes = stackalloc byte[4];
        RandomNumberGenerator.Fill(bytes);
        var value = Math.Abs(BitConverter.ToInt32(bytes)) % 1_000_000;
        return value.ToString("D6");
    }

    private async Task<bool> ValidateOtpAsync(string phone, string purpose, string otpCode)
    {
        var key = BuildOtpCacheKey(phone, purpose);
        try
        {
            var cachedOtp = await distributedCache.GetStringAsync(key);
            if (string.IsNullOrWhiteSpace(cachedOtp))
            {
                return TryValidateLocalOtp(key, otpCode);
            }

            var isValid = string.Equals(cachedOtp, otpCode, StringComparison.Ordinal);
            if (isValid)
            {
                await distributedCache.RemoveAsync(key);
                LocalOtpStore.TryRemove(key, out _);
            }

            return isValid;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis unavailable when validating tracking OTP. Falling back to local memory cache.");
            return TryValidateLocalOtp(key, otpCode);
        }
    }

    private async Task SaveOtpAsync(string phone, string purpose, string otpCode, DateTime expiredAtUtc)
    {
        var key = BuildOtpCacheKey(phone, purpose);
        var ttl = expiredAtUtc - DateTime.UtcNow;
        if (ttl <= TimeSpan.Zero)
        {
            ttl = TimeSpan.FromMinutes(5);
        }

        try
        {
            await distributedCache.SetStringAsync(
                key,
                otpCode,
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = ttl
                });
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis unavailable when saving tracking OTP. Falling back to local memory cache.");
            LocalOtpStore[key] = new LocalOtpEntry(otpCode, expiredAtUtc);
        }
    }

    private static bool TryValidateLocalOtp(string key, string otpCode)
    {
        if (!LocalOtpStore.TryGetValue(key, out var entry))
        {
            return false;
        }

        if (entry.ExpiredAtUtc <= DateTime.UtcNow)
        {
            LocalOtpStore.TryRemove(key, out _);
            return false;
        }

        var isValid = string.Equals(entry.OtpCode, otpCode, StringComparison.Ordinal);
        if (isValid)
        {
            LocalOtpStore.TryRemove(key, out _);
        }

        return isValid;
    }

    private static string BuildOtpCacheKey(string phone, string purpose)
        => $"otp:{purpose.Trim().ToUpperInvariant()}:{NormalizePhoneForOtp(phone)}";

    private static string NormalizePhoneForOtp(string phone)
    {
        var input = phone?.Trim() ?? string.Empty;
        if (input.Length == 0)
        {
            return string.Empty;
        }

        if (input.StartsWith("+", StringComparison.Ordinal))
        {
            var digitsAfterPlus = Regex.Replace(input[1..], "[^0-9]", string.Empty);
            if (digitsAfterPlus.StartsWith("84", StringComparison.Ordinal))
            {
                var local = digitsAfterPlus[2..];
                if (local.Length > 0 && !local.StartsWith("0", StringComparison.Ordinal))
                {
                    return "0" + local;
                }
            }

            return "+" + digitsAfterPlus;
        }

        return Regex.Replace(input, "[^0-9]", string.Empty);
    }

    private bool IsTwilioVerifyEnabled()
        => !string.IsNullOrWhiteSpace(configuration["Twilio:Verify:AccountSid"])
            && !string.IsNullOrWhiteSpace(configuration["Twilio:Verify:AuthToken"])
            && !string.IsNullOrWhiteSpace(configuration["Twilio:Verify:ServiceSid"]);

    private async Task<bool> SendOtpViaTwilioVerifyAsync(string inputPhone, string purpose)
    {
        try
        {
            TwilioClient.Init(
                configuration["Twilio:Verify:AccountSid"],
                configuration["Twilio:Verify:AuthToken"]);

            var verification = await VerificationResource.CreateAsync(
                to: ResolveTwilioDestinationPhone(),
                channel: "sms",
                pathServiceSid: configuration["Twilio:Verify:ServiceSid"]);

            logger.LogInformation(
                "Twilio tracking OTP request sent for purpose {Purpose}. Input phone {InputPhone}. Twilio SID: {Sid}",
                purpose,
                inputPhone,
                verification.Sid);

            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Cannot send tracking OTP by Twilio Verify. Fallback to local OTP mode.");
            return false;
        }
    }

    private async Task<bool> ValidateOtpByTwilioVerifyAsync(string phone, string purpose, string otpCode)
    {
        var hasRequested = await HasCachedOtpRequestAsync(phone, purpose);
        if (!hasRequested)
        {
            return false;
        }

        try
        {
            TwilioClient.Init(
                configuration["Twilio:Verify:AccountSid"],
                configuration["Twilio:Verify:AuthToken"]);

            var check = await VerificationCheckResource.CreateAsync(
                to: ResolveTwilioDestinationPhone(),
                code: otpCode,
                pathServiceSid: configuration["Twilio:Verify:ServiceSid"]);

            var approved = string.Equals(check.Status, "approved", StringComparison.OrdinalIgnoreCase);
            if (approved)
            {
                await RemoveCachedOtpRequestAsync(phone, purpose);
            }

            return approved;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Cannot verify tracking OTP by Twilio Verify.");
            return false;
        }
    }

    private async Task<bool> HasCachedOtpRequestAsync(string phone, string purpose)
    {
        var key = BuildOtpCacheKey(phone, purpose);

        try
        {
            var cachedOtp = await distributedCache.GetStringAsync(key);
            if (!string.IsNullOrWhiteSpace(cachedOtp))
            {
                return true;
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis unavailable when checking tracking OTP request marker. Falling back to local memory cache.");
        }

        if (!LocalOtpStore.TryGetValue(key, out var entry))
        {
            return false;
        }

        if (entry.ExpiredAtUtc <= DateTime.UtcNow)
        {
            LocalOtpStore.TryRemove(key, out _);
            return false;
        }

        return true;
    }

    private async Task RemoveCachedOtpRequestAsync(string phone, string purpose)
    {
        var key = BuildOtpCacheKey(phone, purpose);

        try
        {
            await distributedCache.RemoveAsync(key);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis unavailable when removing tracking OTP request marker.");
        }

        LocalOtpStore.TryRemove(key, out _);
    }

    private string ResolveTwilioDestinationPhone()
        => configuration["Twilio:Verify:FixedDestinationPhone"]?.Trim() ?? DefaultTwilioFixedPhone;

    private string BuildSignedTrackingToken(string phone)
    {
        var secret = configuration["Otp:Secret"] ?? configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Missing Otp:Secret or Jwt:Key configuration.");
        var expiresAt = DateTimeOffset.UtcNow.AddHours(2).ToUnixTimeSeconds();
        var payload = $"{phone.Trim()}:{expiresAt}";

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var signature = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload))).ToLowerInvariant();

        return Convert.ToBase64String(Encoding.UTF8.GetBytes($"{payload}:{signature}"));
    }

    private void EnsureTrackingAccess(string phone, string trackingToken)
    {
        var normalizedPhone = NormalizePhoneForOtp(phone);
        if (string.IsNullOrWhiteSpace(normalizedPhone))
        {
            throw new InvalidOperationException("Phone la bat buoc.");
        }

        if (string.IsNullOrWhiteSpace(trackingToken))
        {
            throw new InvalidOperationException("Tracking token la bat buoc.");
        }

        var token = ParseTrackingToken(trackingToken);
        if (!string.Equals(token.Phone, normalizedPhone, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Tracking token khong hop le cho so dien thoai nay.");
        }

        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        if (token.ExpiresAtUnix < now)
        {
            throw new InvalidOperationException("Tracking token da het han.");
        }
    }

    private (string Phone, long ExpiresAtUnix) ParseTrackingToken(string trackingToken)
    {
        try
        {
            var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(trackingToken));
            var parts = decoded.Split(':');
            if (parts.Length < 3)
            {
                throw new InvalidOperationException("Tracking token khong hop le.");
            }

            var phone = parts[0];
            if (!long.TryParse(parts[1], out var expiresAtUnix))
            {
                throw new InvalidOperationException("Tracking token khong hop le.");
            }

            var signature = parts[2];
            var payload = $"{phone}:{expiresAtUnix}";

            var secret = configuration["Otp:Secret"] ?? configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("Missing Otp:Secret or Jwt:Key configuration.");

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            var expectedSignature = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload))).ToLowerInvariant();

            var providedBytes = Encoding.UTF8.GetBytes(signature);
            var expectedBytes = Encoding.UTF8.GetBytes(expectedSignature);
            var isValid = providedBytes.Length == expectedBytes.Length &&
                CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes);

            if (!isValid)
            {
                throw new InvalidOperationException("Tracking token khong hop le.");
            }

            return (phone, expiresAtUnix);
        }
        catch (FormatException)
        {
            throw new InvalidOperationException("Tracking token khong hop le.");
        }
    }
}
