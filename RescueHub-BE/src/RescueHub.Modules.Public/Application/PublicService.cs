using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NetTopologySuite.Geometries;
using RescueHub.BuildingBlocks.Application;
using RescueHub.Modules.Media.Application;
using RescueHub.Persistence;
using RescueHub.Persistence.Entities.Scaffolded;

namespace RescueHub.Modules.Public.Application;

public sealed class PublicService(
    RescueHubDbContext dbContext,
    IMediaService mediaService,
    IConfiguration configuration) : IPublicService
{
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

    public Task<object> RequestTrackingOtp(RequestTrackingOtpRequest request)
    {
        var purpose = request.Purpose.Trim().ToUpperInvariant();
        if (!string.Equals(purpose, "TRACKING", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Purpose khong hop le cho tracking.");
        }

        var otpCode = GenerateOtp(request.Phone, purpose);
        var expiredAt = DateTime.UtcNow.AddMinutes(5);

        return Task.FromResult<object>(new
        {
            expiredAt,
            otpCode
        });
    }

    public Task<object> VerifyTrackingOtp(VerifyTrackingOtpRequest request)
    {
        var purpose = request.Purpose.Trim().ToUpperInvariant();
        if (!string.Equals(purpose, "TRACKING", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Purpose khong hop le cho tracking.");
        }

        if (!ValidateOtp(request.Phone, purpose, request.OtpCode))
        {
            throw new InvalidOperationException("OTP khong hop le hoac da het han.");
        }

        var trackingToken = BuildSignedTrackingToken(request.Phone);

        return Task.FromResult<object>(new { trackingToken });
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
        if (request.Items is null || request.Items.Count == 0)
        {
            throw new InvalidOperationException("Items la bat buoc.");
        }

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

        var itemCodes = request.Items
            .Select(x => x.SupportTypeCode)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var itemMap = await dbContext.items
            .Where(x => itemCodes.Contains(x.code))
            .ToDictionaryAsync(x => x.code, x => x, StringComparer.OrdinalIgnoreCase);

        foreach (var item in request.Items)
        {
            if (!itemMap.TryGetValue(item.SupportTypeCode, out var mappedItem))
            {
                throw new InvalidOperationException($"SupportTypeCode khong hop le: {item.SupportTypeCode}");
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
        }

        await dbContext.SaveChangesAsync();

        return new
        {
            reliefRequestId = reliefRequest.id,
            requestCode = reliefRequest.code,
            status = new { code = "NEW", name = "Da tiep nhan", color = "#EF4444" },
            requestedAt = reliefRequest.created_at
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

    private string GenerateOtp(string phone, string purpose)
    {
        var phoneKey = phone.Trim();
        var normalizedPurpose = purpose.Trim().ToUpperInvariant();
        var window = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 300;
        var hash = ComputeOtpHmac(phoneKey, normalizedPurpose, window);
        var value = Math.Abs(BitConverter.ToInt32(hash, 0)) % 1_000_000;
        return value.ToString("D6");
    }

    private bool ValidateOtp(string phone, string purpose, string otpCode)
    {
        var phoneKey = phone.Trim();
        var normalizedPurpose = purpose.Trim().ToUpperInvariant();
        var nowWindow = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 300;

        for (var offset = -1; offset <= 1; offset++)
        {
            var hash = ComputeOtpHmac(phoneKey, normalizedPurpose, nowWindow + offset);
            var value = Math.Abs(BitConverter.ToInt32(hash, 0)) % 1_000_000;
            if (string.Equals(value.ToString("D6"), otpCode, StringComparison.Ordinal))
            {
                return true;
            }
        }

        return false;
    }

    private byte[] ComputeOtpHmac(string phone, string purpose, long window)
    {
        var secret = configuration["Otp:Secret"] ?? configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Missing Otp:Secret or Jwt:Key configuration.");
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        return hmac.ComputeHash(Encoding.UTF8.GetBytes($"{phone}:{purpose}:{window}"));
    }

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
}
