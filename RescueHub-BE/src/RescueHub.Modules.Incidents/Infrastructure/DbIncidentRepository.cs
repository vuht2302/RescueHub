using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using RescueHub.BuildingBlocks.Application;
using RescueHub.Modules.Incidents.Application;
using RescueHub.Persistence;
using RescueHub.Persistence.Entities.Scaffolded;

namespace RescueHub.Modules.Incidents.Infrastructure;

public sealed class DbIncidentRepository(RescueHubDbContext dbContext) : IIncidentRepository
{
    private static readonly string[] MissionActionCodes =
    [
        "TEAM_ACCEPT",
        "TEAM_REJECT",
        "DEPART",
        "ARRIVED",
        "ON_SCENE",
        "START_RESCUE",
        "IN_PROGRESS",
        "FIELD_REPORT",
        "NEED_SUPPORT",
        "UNREACHABLE",
        "COMPLETE",
        "COMPLETED",
        "ABORTED"
    ];

    public async Task<object> List()
    {
        var items = await dbContext.incidents
            .AsNoTracking()
            .Include(x => x.incident_location)
            .OrderByDescending(x => x.created_at)
            .Take(100)
            .Select(x => new
            {
                id = x.id,
                incidentCode = x.code,
                status = new { code = x.status_code, name = x.status_code, color = (string?)null },
                location = x.incident_location == null
                    ? null
                    : new
                    {
                        lat = x.incident_location.lat,
                        lng = x.incident_location.lng,
                        addressText = x.incident_location.address_text,
                        landmark = x.incident_location.landmark
                    },
                reportedAt = x.created_at
            })
            .ToListAsync();

        var incidentIds = items.Select(x => x.id).ToArray();
        var activeAssignments = await dbContext.mission_teams
            .AsNoTracking()
            .Where(x =>
                incidentIds.Contains(x.mission.incident_id) &&
                x.mission.status_code != "COMPLETED" &&
                x.mission.status_code != "ABORTED" &&
                x.mission.status_code != "REJECTED")
            .OrderByDescending(x => x.is_primary_team)
            .ThenByDescending(x => x.assigned_at)
            .Select(x => new
            {
                incidentId = x.mission.incident_id,
                team = new IncidentHandlingTeamInfo(
                    x.team_id,
                    x.team.code,
                    x.team.name,
                    x.is_primary_team,
                    x.mission_id,
                    x.mission.code,
                    x.mission.status_code,
                    x.assigned_at)
            })
            .ToListAsync();

        var handlingTeamsByIncident = activeAssignments
            .GroupBy(x => x.incidentId)
            .ToDictionary(x => x.Key, x => x.Select(v => v.team).ToList());

        return items.Select(x => new
        {
            x.id,
            x.incidentCode,
            x.status,
            x.location,
            handlingTeams = handlingTeamsByIncident.TryGetValue(x.id, out var teams)
                ? teams
                : new List<IncidentHandlingTeamInfo>(),
            x.reportedAt
        });
    }

    public async Task<object> Get(Guid incidentId)
    {
        var item = await dbContext.incidents
            .AsNoTracking()
            .Include(x => x.incident_location)
            .Include(x => x.incident_media)
            .Include(x => x.incident_assessments)
            .FirstOrDefaultAsync(x => x.id == incidentId);

        if (item is null)
        {
            throw new InvalidOperationException("Khong tim thay su co.");
        }

        var latestAssessment = item.incident_assessments.OrderByDescending(x => x.created_at).FirstOrDefault();
        var handlingTeams = await dbContext.mission_teams
            .AsNoTracking()
            .Where(x =>
                x.mission.incident_id == incidentId &&
                x.mission.status_code != "COMPLETED" &&
                x.mission.status_code != "ABORTED" &&
                x.mission.status_code != "REJECTED")
            .OrderByDescending(x => x.is_primary_team)
            .ThenByDescending(x => x.assigned_at)
            .Select(x => new IncidentHandlingTeamInfo(
                x.team_id,
                x.team.code,
                x.team.name,
                x.is_primary_team,
                x.mission_id,
                x.mission.code,
                x.mission.status_code,
                x.assigned_at))
            .ToListAsync();

        return new
        {
            id = item.id,
            incidentCode = item.code,
            isSOS = item.is_sos,
            incidentType = new { code = item.incident_type_code, name = item.incident_type_code },
            channel = new { code = item.incident_channel_code, name = item.incident_channel_code },
            status = new { code = item.status_code, name = item.status_code, color = (string?)null },
            priority = new { code = item.priority_code, name = item.priority_code, color = (string?)null },
            severity = latestAssessment == null ? null : new { code = latestAssessment.severity_code, name = latestAssessment.severity_code, color = (string?)null },
            description = item.description,
            victimCountEstimate = item.estimated_victim_count,
            injuredCountEstimate = item.estimated_injured_count,
            vulnerableCountEstimate = item.estimated_vulnerable_count,
            needRelief = item.need_relief,
            reporter = new
            {
                name = item.reporter_name,
                phone = item.reporter_phone
            },
            location = item.incident_location == null
                ? null
                : new
                {
                    lat = item.incident_location.lat,
                    lng = item.incident_location.lng,
                    addressText = item.incident_location.address_text,
                    landmark = item.incident_location.landmark
                },
            files = item.incident_media
                .OrderByDescending(x => x.uploaded_at)
                .Select(x => new
                {
                    fileId = x.id,
                    url = x.file_url,
                    contentType = x.media_type_code
                })
                .ToList(),
            latestAssessment = latestAssessment == null
                ? null
                : new
                {
                    assessedAt = latestAssessment.created_at,
                    priority = latestAssessment.priority_code,
                    severity = latestAssessment.severity_code,
                    notes = latestAssessment.notes
                },
            handlingTeams,
            reportedAt = item.created_at,
            updatedAt = item.updated_at
        };
    }

    public async Task<object> Verify(Guid incidentId, VerifyIncidentRequest request)
    {
        var item = await dbContext.incidents.FirstOrDefaultAsync(x => x.id == incidentId);
        if (item is null)
        {
            throw new InvalidOperationException("Khong tim thay su co.");
        }

        var now = DateTime.UtcNow;
        var newStatus = request.Verified ? "VERIFIED" : "REJECTED";
        var oldStatus = item.status_code;
        item.status_code = newStatus;
        item.updated_at = now;

        dbContext.incident_status_histories.Add(new incident_status_history
        {
            id = Guid.NewGuid(),
            incident_id = incidentId,
            from_status_code = oldStatus,
            to_status_code = newStatus,
            action_code = request.Verified ? "VERIFY" : "VERIFY_REJECTED",
            changed_at = now,
            note = request.Note
        });

        await dbContext.SaveChangesAsync();

        return new
        {
            incidentId,
            verified = request.Verified,
            note = request.Note,
            verifiedAt = now
        };
    }

    public async Task<object> Assess(Guid incidentId, AssessIncidentRequest request)
    {
        var item = await dbContext.incidents.FirstOrDefaultAsync(x => x.id == incidentId);
        if (item is null)
        {
            throw new InvalidOperationException("Khong tim thay su co.");
        }

        var now = DateTime.UtcNow;
        item.priority_code = request.PriorityCode;
        item.estimated_victim_count = request.VictimCountEstimate ?? item.estimated_victim_count;
        item.estimated_injured_count = request.InjuredCountEstimate ?? item.estimated_injured_count;
        item.estimated_vulnerable_count = request.VulnerableCountEstimate ?? item.estimated_vulnerable_count;
        item.status_code = "ASSESSED";
        item.updated_at = now;

        dbContext.incident_assessments.Add(new incident_assessment
        {
            id = Guid.NewGuid(),
            incident_id = incidentId,
            priority_code = request.PriorityCode,
            severity_code = request.SeverityCode,
            requires_medical_support = request.RequiresMedicalSupport,
            requires_evacuation = request.RequiresEvacuation,
            notes = request.Notes,
            created_at = now
        });

        dbContext.incident_status_histories.Add(new incident_status_history
        {
            id = Guid.NewGuid(),
            incident_id = incidentId,
            from_status_code = "VERIFIED",
            to_status_code = "ASSESSED",
            action_code = "ASSESS",
            changed_at = now,
            note = request.Notes
        });

        await dbContext.SaveChangesAsync();

        return new
        {
            incidentId,
            assessed = true,
            assessedAt = now
        };
    }

    public async Task<object> CreateSceneObservation(Guid incidentId, SceneObservationRequest request)
    {
        var incident = await dbContext.incidents
            .Include(x => x.incident_location)
            .FirstOrDefaultAsync(x => x.id == incidentId);

        if (incident is null)
        {
            throw new InvalidOperationException("Khong tim thay su co.");
        }

        if (incident.incident_location != null)
        {
            var detailMap = (request.Details ?? Array.Empty<SceneObservationDetailRequest>())
                .Where(x => !string.IsNullOrWhiteSpace(x.FactorCode))
                .Select(x => new
                {
                    FactorCode = FloodSceneFactorCatalog.NormalizeCode(x.FactorCode),
                    Detail = x
                })
                .GroupBy(x => x.FactorCode, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(x => x.Key, x => x.Last().Detail, StringComparer.OrdinalIgnoreCase);

            if (detailMap.TryGetValue(FloodSceneFactorCatalog.WaterLevel, out var floodDepth) && floodDepth.ValueNumber.HasValue)
            {
                incident.incident_location.flood_depth_m = floodDepth.ValueNumber;
            }

            if (detailMap.TryGetValue(FloodSceneFactorCatalog.CurrentLevel, out var waterCurrent) && !string.IsNullOrWhiteSpace(waterCurrent.ValueText))
            {
                incident.incident_location.water_current_code = waterCurrent.ValueText;
            }

            if (detailMap.TryGetValue(FloodSceneFactorCatalog.RoadAccess, out var access) && !string.IsNullOrWhiteSpace(access.ValueText))
            {
                incident.incident_location.accessibility_code = access.ValueText;
            }
        }

        incident.updated_at = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return new
        {
            observationId = Guid.NewGuid(),
            incidentId,
            observedAt = DateTime.UtcNow
        };
    }

    public async Task<object> UpdateRequirements(Guid incidentId, UpdateIncidentRequirementsRequest request)
    {
        var incidentExists = await dbContext.incidents.AnyAsync(x => x.id == incidentId);
        if (!incidentExists)
        {
            throw new InvalidOperationException("Khong tim thay su co.");
        }

        var oldSkillRequirements = await dbContext.incident_requirement_skills
            .Where(x => x.incident_id == incidentId)
            .ToListAsync();
        dbContext.incident_requirement_skills.RemoveRange(oldSkillRequirements);

        var oldVehicleRequirements = await dbContext.incident_requirement_vehicle_capabilities
            .Where(x => x.incident_id == incidentId)
            .ToListAsync();
        dbContext.incident_requirement_vehicle_capabilities.RemoveRange(oldVehicleRequirements);

        if (request.Skills is { Count: > 0 })
        {
            var skillCodes = request.Skills.Select(x => x.SkillCode).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
            var skillMap = await dbContext.skills
                .Where(x => skillCodes.Contains(x.code))
                .ToDictionaryAsync(x => x.code, x => x.id, StringComparer.OrdinalIgnoreCase);

            foreach (var skillReq in request.Skills)
            {
                if (!skillMap.TryGetValue(skillReq.SkillCode, out var skillId))
                {
                    throw new InvalidOperationException($"Skill code khong hop le: {skillReq.SkillCode}");
                }

                dbContext.incident_requirement_skills.Add(new incident_requirement_skill
                {
                    id = Guid.NewGuid(),
                    incident_id = incidentId,
                    skill_id = skillId,
                    level_code = string.IsNullOrWhiteSpace(skillReq.SkillLevelCode) ? "BASIC" : skillReq.SkillLevelCode,
                    required_count = skillReq.RequiredCount
                });
            }
        }

        if (request.VehicleCapabilities is { Count: > 0 })
        {
            var capabilityCodes = request.VehicleCapabilities.Select(x => x.CapabilityCode).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
            var capabilityMap = await dbContext.vehicle_capabilities
                .Where(x => capabilityCodes.Contains(x.code))
                .ToDictionaryAsync(x => x.code, x => x.id, StringComparer.OrdinalIgnoreCase);

            foreach (var capabilityReq in request.VehicleCapabilities)
            {
                if (!capabilityMap.TryGetValue(capabilityReq.CapabilityCode, out var capabilityId))
                {
                    throw new InvalidOperationException($"Vehicle capability code khong hop le: {capabilityReq.CapabilityCode}");
                }

                dbContext.incident_requirement_vehicle_capabilities.Add(new incident_requirement_vehicle_capability
                {
                    id = Guid.NewGuid(),
                    incident_id = incidentId,
                    vehicle_capability_id = capabilityId,
                    required_count = capabilityReq.RequiredCount
                });
            }
        }

        await dbContext.SaveChangesAsync();

        return new
        {
            incidentId,
            updated = true,
            skills = request.Skills?.Count ?? 0,
            vehicleCapabilities = request.VehicleCapabilities?.Count ?? 0
        };
    }

    public async Task<object> GetDispatchOptions(Guid incidentId)
    {
        var incident = await dbContext.incidents
            .AsNoTracking()
            .Include(x => x.incident_location)
            .Include(x => x.incident_requirement_skills)
            .ThenInclude(x => x.skill)
            .FirstOrDefaultAsync(x => x.id == incidentId);

        if (incident is null)
        {
            throw new InvalidOperationException("Khong tim thay su co.");
        }

        var teams = await dbContext.teams
            .AsNoTracking()
            .Include(x => x.team_members)
            .Include(x => x.vehicles)
            .Where(x => x.status_code == "AVAILABLE")
            .OrderBy(x => x.name)
            .Take(20)
            .ToListAsync();

        var requiredSkillCodes = incident.incident_requirement_skills.Select(x => x.skill.code).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();

        var recommendedTeams = teams.Select(team =>
        {
            var distanceKm = EstimateDistanceKm(
                incident.incident_location?.lat,
                incident.incident_location?.lng,
                team.current_location?.Y,
                team.current_location?.X);

            var availableMembers = team.team_members.Count(x => x.status_code == "AVAILABLE");
            var vehicles = team.vehicles
                .Where(x => x.status_code == "AVAILABLE")
                .Take(5)
                .Select(x => new
                {
                    vehicleId = x.id,
                    vehicleName = x.display_name,
                    vehicleType = x.vehicle_type_id,
                    status = x.status_code
                })
                .ToList();

            var matchScore = Math.Max(30, 100 - (int)Math.Round((double)distanceKm * 5) + availableMembers * 3);

            return new
            {
                teamId = team.id,
                teamName = team.name,
                matchScore,
                distanceKm,
                etaMinutes = (int)Math.Ceiling((double)(distanceKm * 3.5m)),
                availableMembers,
                matchedSkills = requiredSkillCodes.Select(code => new { skillCode = code, matchedCount = availableMembers > 0 ? 1 : 0 }).ToList(),
                missingSkills = Array.Empty<object>(),
                vehicles,
                warnings = Array.Empty<object>()
            };
        })
        .OrderByDescending(x => x.matchScore)
        .Take(10)
        .ToList();

        return new { recommendedTeams };
    }

    public async Task<object> CreateMission(Guid incidentId, CreateMissionRequest request)
    {
        var incident = await dbContext.incidents.FirstOrDefaultAsync(x => x.id == incidentId);
        if (incident is null)
        {
            throw new InvalidOperationException("Khong tim thay su co.");
        }

        if (request.TeamAssignments is null || request.TeamAssignments.Count == 0)
        {
            throw new InvalidOperationException("TeamAssignments la bat buoc.");
        }

        var now = DateTime.UtcNow;
        var missionPrefix = $"NV-{now:yyyyMMdd}";
        var missionCount = await dbContext.missions.CountAsync(x => x.code.StartsWith(missionPrefix));
        var missionCode = $"{missionPrefix}-{(missionCount + 1):000}";

        var primaryTeamId = request.TeamAssignments.FirstOrDefault(x => x.IsPrimaryTeam)?.TeamId;

        var mission = new mission
        {
            id = Guid.NewGuid(),
            code = missionCode,
            incident_id = incidentId,
            status_code = "ASSIGNED",
            priority_code = string.IsNullOrWhiteSpace(request.PriorityCode) ? incident.priority_code : request.PriorityCode,
            objective = string.IsNullOrWhiteSpace(request.Objective) ? "Rescue operation" : request.Objective,
            primary_team_id = primaryTeamId,
            eta_minutes = request.EtaMinutes,
            created_at = now,
            updated_at = now
        };
        dbContext.missions.Add(mission);

        foreach (var assignment in request.TeamAssignments)
        {
            var teamExists = await dbContext.teams.AnyAsync(x => x.id == assignment.TeamId);
            if (!teamExists)
            {
                throw new InvalidOperationException($"Khong tim thay team: {assignment.TeamId}");
            }

            dbContext.mission_teams.Add(new mission_team
            {
                id = Guid.NewGuid(),
                mission_id = mission.id,
                team_id = assignment.TeamId,
                is_primary_team = assignment.IsPrimaryTeam,
                assigned_at = now
            });

            if (assignment.MemberIds is { Count: > 0 })
            {
                var validMemberIds = await dbContext.team_members
                    .Where(x => x.team_id == assignment.TeamId && assignment.MemberIds.Contains(x.id))
                    .Select(x => x.id)
                    .ToListAsync();

                foreach (var memberId in validMemberIds.Distinct())
                {
                    dbContext.mission_members.Add(new mission_member
                    {
                        id = Guid.NewGuid(),
                        mission_id = mission.id,
                        team_member_id = memberId
                    });
                }
            }

            if (assignment.VehicleIds is { Count: > 0 })
            {
                var validVehicleIds = await dbContext.vehicles
                    .Where(x => assignment.VehicleIds.Contains(x.id))
                    .Select(x => x.id)
                    .ToListAsync();

                foreach (var vehicleId in validVehicleIds.Distinct())
                {
                    dbContext.mission_vehicles.Add(new mission_vehicle
                    {
                        id = Guid.NewGuid(),
                        mission_id = mission.id,
                        vehicle_id = vehicleId
                    });
                }
            }
        }

        incident.status_code = "ASSIGNED";
        incident.updated_at = now;

        dbContext.incident_status_histories.Add(new incident_status_history
        {
            id = Guid.NewGuid(),
            incident_id = incidentId,
            from_status_code = "ASSESSED",
            to_status_code = "ASSIGNED",
            action_code = "DISPATCH",
            changed_at = now,
            note = request.Note
        });

        await dbContext.SaveChangesAsync();

        var handlingTeams = await dbContext.mission_teams
            .AsNoTracking()
            .Where(x => x.mission_id == mission.id)
            .OrderByDescending(x => x.is_primary_team)
            .ThenByDescending(x => x.assigned_at)
            .Select(x => new IncidentHandlingTeamInfo(
                x.team_id,
                x.team.code,
                x.team.name,
                x.is_primary_team,
                x.mission_id,
                x.mission.code,
                x.mission.status_code,
                x.assigned_at))
            .ToListAsync();

        return new
        {
            missionId = mission.id,
            missionCode = mission.code,
            incident = new
            {
                incidentId = incident.id,
                status = new
                {
                    code = incident.status_code,
                    name = incident.status_code,
                    color = "#F59E0B"
                },
                handlingTeams
            },
            status = new
            {
                code = "ASSIGNED",
                name = "Da giao nhiem vu",
                color = "#F59E0B"
            }
        };
    }

    public async Task<object> CreateReliefRequestFromIncident(Guid incidentId, CreateIncidentReliefRequest request)
    {
        var incident = await dbContext.incidents
            .Include(x => x.incident_location)
            .FirstOrDefaultAsync(x => x.id == incidentId);

        if (incident is null)
        {
            throw new InvalidOperationException("Khong tim thay incident.");
        }

        var householdCount = request.HouseholdCount <= 0 ? 1 : request.HouseholdCount;
        var now = DateTime.UtcNow;

        var codePrefix = $"RR-{now:yyyyMMdd}";
        var todayCount = await dbContext.relief_requests.CountAsync(x => x.code.StartsWith(codePrefix));
        var requestCode = $"{codePrefix}-{(todayCount + 1):000}";

        var reliefAdminAreaId = incident.incident_location?.admin_area_id;
        if (!reliefAdminAreaId.HasValue && incident.incident_location is not null)
        {
            reliefAdminAreaId = await ResolveAdminAreaIdFromPoint(incident.incident_location.lat, incident.incident_location.lng);
        }

        var reliefRequest = new relief_request
        {
            id = Guid.NewGuid(),
            code = requestCode,
            source_type_code = "INCIDENT_FOLLOWUP",
            requester_name = incident.reporter_name,
            requester_phone = incident.reporter_phone,
            linked_incident_id = incident.id,
            campaign_id = null,
            status_code = "NEW",
            admin_area_id = reliefAdminAreaId,
            address_text = incident.incident_location?.address_text ?? "UNKNOWN",
            geom = incident.incident_location?.geom,
            household_count = householdCount,
            note = string.IsNullOrWhiteSpace(request.Note) ? incident.description : request.Note,
            created_at = now,
            updated_at = now
        };

        dbContext.relief_requests.Add(reliefRequest);

        var incomingItems = request.Items?.ToArray() ?? Array.Empty<IncidentReliefItemRequest>();
        if (incomingItems.Length > 0)
        {
            var supportTypeCodes = incomingItems
                .Select(x => x.SupportTypeCode?.Trim())
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x!.ToUpperInvariant())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            var itemMap = supportTypeCodes.Length == 0
                ? new Dictionary<string, item>(StringComparer.OrdinalIgnoreCase)
                : await dbContext.items
                    .Where(x => supportTypeCodes.Contains(x.code))
                    .ToDictionaryAsync(x => x.code, x => x, StringComparer.OrdinalIgnoreCase);

            foreach (var incoming in incomingItems)
            {
                var supportTypeCode = incoming.SupportTypeCode?.Trim().ToUpperInvariant();
                if (string.IsNullOrWhiteSpace(supportTypeCode))
                {
                    throw new InvalidOperationException("SupportTypeCode la bat buoc.");
                }

                if (incoming.RequestedQty <= 0)
                {
                    throw new InvalidOperationException("RequestedQty phai lon hon 0.");
                }

                if (!itemMap.TryGetValue(supportTypeCode, out var mappedItem))
                {
                    throw new InvalidOperationException($"SupportTypeCode khong hop le: {supportTypeCode}");
                }

                dbContext.relief_request_items.Add(new relief_request_item
                {
                    id = Guid.NewGuid(),
                    relief_request_id = reliefRequest.id,
                    item_id = mappedItem.id,
                    requested_qty = incoming.RequestedQty,
                    approved_qty = null,
                    unit_code = string.IsNullOrWhiteSpace(incoming.UnitCode)
                        ? mappedItem.unit_code
                        : incoming.UnitCode.Trim().ToUpperInvariant()
                });
            }
        }

        incident.need_relief = true;
        if (incident.status_code != "CANCELLED" && incident.status_code != "CLOSED")
        {
            var fromStatus = incident.status_code;
            incident.status_code = "RELIEF_REQUIRED";
            incident.updated_at = now;

            dbContext.incident_status_histories.Add(new incident_status_history
            {
                id = Guid.NewGuid(),
                incident_id = incident.id,
                from_status_code = fromStatus,
                to_status_code = "RELIEF_REQUIRED",
                action_code = "REQUEST_RELIEF",
                note = request.Note,
                changed_at = now
            });
        }

        await dbContext.SaveChangesAsync();

        return new
        {
            incidentId = incident.id,
            incidentCode = incident.code,
            reliefRequestId = reliefRequest.id,
            requestCode = reliefRequest.code,
            status = new { code = reliefRequest.status_code, name = reliefRequest.status_code, color = "#F59E0B" },
            createdAt = reliefRequest.created_at
        };
    }

    public async Task<object> GetReliefRequestHotspotsForCoordinator(string? statusCode, int days, int top)
    {
        var normalizedDays = days <= 0 ? 7 : Math.Min(days, 90);
        var normalizedTop = top <= 0 ? 10 : Math.Min(top, 100);
        var fromTime = DateTime.UtcNow.AddDays(-normalizedDays);

        var query = dbContext.relief_requests
            .AsNoTracking()
            .Include(x => x.admin_area)
            .Where(x => x.created_at >= fromTime)
            .AsQueryable();

        var normalizedStatusCode = string.IsNullOrWhiteSpace(statusCode)
            ? null
            : statusCode.Trim().ToUpperInvariant();

        if (!string.IsNullOrWhiteSpace(normalizedStatusCode))
        {
            query = query.Where(x => x.status_code == normalizedStatusCode);
        }

        var requests = await query
            .Select(x => new
            {
                x.id,
                x.code,
                x.status_code,
                x.created_at,
                x.address_text,
                adminAreaId = x.admin_area_id,
                adminAreaCode = x.admin_area != null ? x.admin_area.code : null,
                adminAreaName = x.admin_area != null ? x.admin_area.name : null,
                lat = x.geom == null ? (double?)null : x.geom.Y,
                lng = x.geom == null ? (double?)null : x.geom.X
            })
            .ToListAsync();

        var unresolvedRequests = requests
            .Where(x => x.adminAreaId == null && x.lat.HasValue && x.lng.HasValue)
            .ToList();

        var resolvedAreaByRequestId = new Dictionary<Guid, ResolvedAreaInfo>();
        if (unresolvedRequests.Count > 0)
        {
            var areas = await dbContext.admin_areas
                .AsNoTracking()
                .Where(x => x.geom != null)
                .Select(x => new { x.id, x.code, x.name, x.level_code, x.geom })
                .ToListAsync();

            foreach (var requestItem in unresolvedRequests)
            {
                var point = new Point(requestItem.lng!.Value, requestItem.lat!.Value) { SRID = 4326 };
                var matched = areas
                    .Where(x => x.geom != null && x.geom.Contains(point))
                    .OrderBy(x => AdminAreaPriority(x.level_code))
                    .FirstOrDefault();

                if (matched is not null)
                {
                    resolvedAreaByRequestId[requestItem.id] = new ResolvedAreaInfo(matched.id, matched.code, matched.name);
                }
            }
        }

        var enrichedRequests = requests.Select(x =>
        {
            if (x.adminAreaId.HasValue)
            {
                return new
                {
                    x.id,
                    x.code,
                    x.status_code,
                    x.created_at,
                    x.address_text,
                    x.lat,
                    x.lng,
                    adminAreaId = x.adminAreaId,
                    adminAreaCode = x.adminAreaCode,
                    adminAreaName = x.adminAreaName
                };
            }

            if (resolvedAreaByRequestId.TryGetValue(x.id, out var resolvedArea))
            {
                return new
                {
                    x.id,
                    x.code,
                    x.status_code,
                    x.created_at,
                    x.address_text,
                    x.lat,
                    x.lng,
                    adminAreaId = (Guid?)resolvedArea.Id,
                    adminAreaCode = resolvedArea.Code,
                    adminAreaName = resolvedArea.Name
                };
            }

            return new
            {
                x.id,
                x.code,
                x.status_code,
                x.created_at,
                x.address_text,
                x.lat,
                x.lng,
                adminAreaId = x.adminAreaId,
                adminAreaCode = x.adminAreaCode,
                adminAreaName = x.adminAreaName
            };
        }).ToList();

        var items = enrichedRequests
            .GroupBy(x => new
            {
                x.adminAreaId,
                areaCode = x.adminAreaCode ?? "UNKNOWN",
                areaName = x.adminAreaName ?? "Chua xac dinh"
            })
            .Select(group =>
            {
                var pendingCount = group.Count(x => x.status_code == "NEW" || x.status_code == "APPROVED");
                var fulfilledCount = group.Count(x => x.status_code == "FULFILLED");
                var rejectedCount = group.Count(x => x.status_code == "REJECTED");
                var cancelledCount = group.Count(x => x.status_code == "CANCELLED");
                var points = group.Where(x => x.lat.HasValue && x.lng.HasValue).ToList();

                return new
                {
                    adminAreaId = group.Key.adminAreaId,
                    areaCode = group.Key.areaCode,
                    areaName = group.Key.areaName,
                    requestCount = group.Count(),
                    pendingCount,
                    fulfilledCount,
                    rejectedCount,
                    cancelledCount,
                    latestRequestedAt = group.Max(x => x.created_at),
                    center = points.Count == 0
                        ? null
                        : new
                        {
                            lat = Math.Round(points.Average(x => x.lat!.Value), 6),
                            lng = Math.Round(points.Average(x => x.lng!.Value), 6)
                        },
                    sampleLocations = group
                        .Where(x => x.lat.HasValue && x.lng.HasValue)
                        .OrderByDescending(x => x.created_at)
                        .Take(5)
                        .Select(x => new
                        {
                            reliefRequestId = x.id,
                            requestCode = x.code,
                            lat = Math.Round(x.lat!.Value, 6),
                            lng = Math.Round(x.lng!.Value, 6),
                            addressText = x.address_text,
                            requestedAt = x.created_at
                        })
                        .ToList()
                };
            })
            .OrderByDescending(x => x.requestCount)
            .ThenByDescending(x => x.pendingCount)
            .ThenByDescending(x => x.latestRequestedAt)
            .Take(normalizedTop)
            .ToList();

        return new
        {
            filters = new
            {
                statusCode = normalizedStatusCode,
                days = normalizedDays,
                top = normalizedTop,
                fromTime
            },
            totalRequests = enrichedRequests.Count,
            hotspotCount = items.Count,
            items
        };
    }

    private async Task<Guid?> ResolveAdminAreaIdFromPoint(decimal lat, decimal lng)
    {
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

    private static int AdminAreaPriority(string? levelCode)
        => levelCode switch
        {
            "WARD" => 0,
            "DISTRICT" => 1,
            "PROVINCE" => 2,
            _ => 9
        };

    public async Task<object> ListReliefRequestsForCoordinator(string? statusCode, string? keyword, int page, int pageSize)
    {
        var normalizedPage = page <= 0 ? 1 : page;
        var normalizedPageSize = pageSize <= 0 ? 20 : Math.Min(pageSize, 100);

        var query = dbContext.relief_requests
            .AsNoTracking()
            .Include(x => x.relief_request_items)
            .ThenInclude(x => x.item)
            .Include(x => x.linked_incident)
            .Include(x => x.campaign)
            .Include(x => x.admin_area)
            .AsQueryable();

        var normalizedStatusCode = string.IsNullOrWhiteSpace(statusCode)
            ? "NEW"
            : statusCode.Trim().ToUpperInvariant();

        query = query.Where(x => x.status_code == normalizedStatusCode);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var normalizedKeyword = keyword.Trim();
            query = query.Where(x =>
                x.code.Contains(normalizedKeyword) ||
                x.requester_name.Contains(normalizedKeyword) ||
                x.requester_phone.Contains(normalizedKeyword) ||
                x.address_text.Contains(normalizedKeyword));
        }

        var totalItems = await query.CountAsync();

        var items = await query
            .OrderByDescending(x => x.created_at)
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .Select(x => new
            {
                reliefRequestId = x.id,
                requestCode = x.code,
                sourceTypeCode = x.source_type_code,
                status = new { code = x.status_code, name = x.status_code, color = (string?)null },
                requester = new
                {
                    name = x.requester_name,
                    phone = x.requester_phone
                },
                householdCount = x.household_count,
                addressText = x.address_text,
                location = new
                {
                    lat = x.geom == null ? (double?)null : x.geom.Y,
                    lng = x.geom == null ? (double?)null : x.geom.X,
                    addressText = x.address_text,
                    adminArea = x.admin_area == null
                        ? null
                        : new
                        {
                            id = x.admin_area.id,
                            code = x.admin_area.code,
                            name = x.admin_area.name
                        }
                },
                incident = x.linked_incident_id == null
                    ? null
                    : new
                    {
                        id = x.linked_incident_id,
                        code = x.linked_incident != null ? x.linked_incident.code : null
                    },
                campaign = x.campaign_id == null
                    ? null
                    : new
                    {
                        id = x.campaign_id,
                        code = x.campaign != null ? x.campaign.code : null,
                        name = x.campaign != null ? x.campaign.name : null
                    },
                requestedItems = x.relief_request_items
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
                requestedAt = x.created_at,
                updatedAt = x.updated_at
            })
            .ToListAsync();

        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)normalizedPageSize);

        return new
        {
            items,
            page = normalizedPage,
            pageSize = normalizedPageSize,
            totalItems,
            totalPages
        };
    }

    public async Task<object> GetReliefRequestForCoordinator(Guid reliefRequestId)
    {
        var reliefRequest = await dbContext.relief_requests
            .AsNoTracking()
            .Include(x => x.relief_request_items)
            .ThenInclude(x => x.item)
            .Include(x => x.linked_incident)
            .Include(x => x.campaign)
            .Include(x => x.admin_area)
            .FirstOrDefaultAsync(x => x.id == reliefRequestId);

        if (reliefRequest is null)
        {
            throw new InvalidOperationException("Khong tim thay relief request.");
        }

        var campaignOptions = await dbContext.relief_campaigns
            .AsNoTracking()
            .Where(x => x.status_code == "PLANNED" || x.status_code == "ACTIVE")
            .OrderByDescending(x => x.start_at)
            .Take(50)
            .Select(x => new
            {
                campaignId = x.id,
                campaignCode = x.code,
                campaignName = x.name,
                status = x.status_code,
                linkedIncidentId = x.linked_incident_id,
                startAt = x.start_at,
                endAt = x.end_at
            })
            .ToListAsync();

        return new
        {
            reliefRequestId = reliefRequest.id,
            requestCode = reliefRequest.code,
            sourceTypeCode = reliefRequest.source_type_code,
            status = new { code = reliefRequest.status_code, name = reliefRequest.status_code, color = (string?)null },
            requester = new
            {
                name = reliefRequest.requester_name,
                phone = reliefRequest.requester_phone
            },
            householdCount = reliefRequest.household_count,
            addressText = reliefRequest.address_text,
            location = new
            {
                lat = reliefRequest.geom == null ? (double?)null : reliefRequest.geom.Y,
                lng = reliefRequest.geom == null ? (double?)null : reliefRequest.geom.X,
                addressText = reliefRequest.address_text,
                adminArea = reliefRequest.admin_area == null
                    ? null
                    : new
                    {
                        id = reliefRequest.admin_area.id,
                        code = reliefRequest.admin_area.code,
                        name = reliefRequest.admin_area.name
                    }
            },
            note = reliefRequest.note,
            incident = reliefRequest.linked_incident_id == null
                ? null
                : new
                {
                    id = reliefRequest.linked_incident_id,
                    code = reliefRequest.linked_incident != null ? reliefRequest.linked_incident.code : null,
                    description = reliefRequest.linked_incident != null ? reliefRequest.linked_incident.description : null
                },
            campaign = reliefRequest.campaign_id == null
                ? null
                : new
                {
                    id = reliefRequest.campaign_id,
                    code = reliefRequest.campaign != null ? reliefRequest.campaign.code : null,
                    name = reliefRequest.campaign != null ? reliefRequest.campaign.name : null
                },
            requestedItems = reliefRequest.relief_request_items
                .OrderBy(x => x.item.code)
                .Select(x => new
                {
                    reliefRequestItemId = x.id,
                    supportTypeCode = x.item.code,
                    supportTypeName = x.item.name,
                    requestedQty = x.requested_qty,
                    approvedQty = x.approved_qty,
                    defaultApprovedQty = x.approved_qty ?? x.requested_qty,
                    unitCode = x.unit_code
                })
                .ToList(),
            decisionOptions = new[]
            {
                new { code = "APPROVE", name = "Duyet" },
                new { code = "REJECT", name = "Tu choi" }
            },
            campaignOptions,
            updatedAt = reliefRequest.updated_at,
            requestedAt = reliefRequest.created_at
        };
    }

    public async Task<object> StandardizeReliefRequest(Guid reliefRequestId, StandardizeReliefRequest request)
    {
        var reliefRequest = await dbContext.relief_requests
            .Include(x => x.relief_request_items)
            .ThenInclude(x => x.item)
            .FirstOrDefaultAsync(x => x.id == reliefRequestId);

        if (reliefRequest is null)
        {
            throw new InvalidOperationException("Khong tim thay relief request.");
        }

        var decisionCode = request.DecisionCode?.Trim().ToUpperInvariant();
        if (decisionCode is not ("APPROVE" or "REJECT"))
        {
            throw new InvalidOperationException("DecisionCode chi nhan APPROVE hoac REJECT.");
        }

        var now = DateTime.UtcNow;

        await using var transaction = await dbContext.Database.BeginTransactionAsync();

        if (decisionCode == "REJECT")
        {
            foreach (var reliefItem in reliefRequest.relief_request_items)
            {
                reliefItem.approved_qty = 0;
            }

            reliefRequest.status_code = "REJECTED";
            reliefRequest.note = request.Note;
            reliefRequest.updated_at = now;

            await dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            return new
            {
                reliefRequestId = reliefRequest.id,
                requestCode = reliefRequest.code,
                decisionCode,
                status = "REJECTED",
                approvedItemCount = 0,
                approvedTotalQty = 0m,
                standardizedAt = now
            };
        }

        if (request.CampaignId.HasValue)
        {
            var campaign = await dbContext.relief_campaigns
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.id == request.CampaignId.Value);

            if (campaign is null)
            {
                throw new InvalidOperationException("CampaignId khong ton tai.");
            }

            if (campaign.status_code is "CLOSED" or "CANCELLED")
            {
                throw new InvalidOperationException("Campaign khong con hoat dong de gan vao relief request.");
            }

            reliefRequest.campaign_id = campaign.id;
        }

        var incomingItems = request.Items?.ToArray() ?? Array.Empty<StandardizedReliefItemRequest>();

        var existingById = reliefRequest.relief_request_items.ToDictionary(x => x.id, x => x);
        var existingBySupportTypeCode = reliefRequest.relief_request_items
            .Where(x => x.item != null)
            .GroupBy(x => x.item.code, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);

        foreach (var reliefItem in reliefRequest.relief_request_items)
        {
            reliefItem.approved_qty = incomingItems.Length == 0 ? reliefItem.requested_qty : 0;
        }

        if (incomingItems.Length > 0)
        {
            var incomingSupportTypeCodes = incomingItems
                .Where(x => !string.IsNullOrWhiteSpace(x.SupportTypeCode))
                .Select(x => x.SupportTypeCode!.Trim().ToUpperInvariant())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            var supportTypeMap = incomingSupportTypeCodes.Length == 0
                ? new Dictionary<string, item>(StringComparer.OrdinalIgnoreCase)
                : await dbContext.items
                    .Where(x => incomingSupportTypeCodes.Contains(x.code))
                    .ToDictionaryAsync(x => x.code, x => x, StringComparer.OrdinalIgnoreCase);

            foreach (var incoming in incomingItems)
            {
                if (incoming.ApprovedQty <= 0)
                {
                    throw new InvalidOperationException("ApprovedQty phai lon hon 0.");
                }

                relief_request_item? targetItem = null;

                if (incoming.ReliefRequestItemId.HasValue)
                {
                    if (!existingById.TryGetValue(incoming.ReliefRequestItemId.Value, out targetItem))
                    {
                        throw new InvalidOperationException($"ReliefRequestItemId khong ton tai trong request: {incoming.ReliefRequestItemId}");
                    }
                }
                else
                {
                    var normalizedSupportTypeCode = incoming.SupportTypeCode?.Trim().ToUpperInvariant();
                    if (string.IsNullOrWhiteSpace(normalizedSupportTypeCode))
                    {
                        throw new InvalidOperationException("Can ReliefRequestItemId hoac SupportTypeCode de chuan hoa.");
                    }

                    if (existingBySupportTypeCode.TryGetValue(normalizedSupportTypeCode, out var existingItem))
                    {
                        targetItem = existingItem;
                    }
                    else
                    {
                        if (!supportTypeMap.TryGetValue(normalizedSupportTypeCode, out var mappedItem))
                        {
                            throw new InvalidOperationException($"SupportTypeCode khong hop le: {normalizedSupportTypeCode}");
                        }

                        targetItem = new relief_request_item
                        {
                            id = Guid.NewGuid(),
                            relief_request_id = reliefRequest.id,
                            item_id = mappedItem.id,
                            requested_qty = incoming.ApprovedQty,
                            approved_qty = 0,
                            unit_code = mappedItem.unit_code
                        };

                        dbContext.relief_request_items.Add(targetItem);
                        existingById[targetItem.id] = targetItem;
                        existingBySupportTypeCode[mappedItem.code] = targetItem;
                    }
                }

                targetItem.approved_qty = incoming.ApprovedQty;

                if (!string.IsNullOrWhiteSpace(incoming.UnitCode))
                {
                    targetItem.unit_code = incoming.UnitCode.Trim().ToUpperInvariant();
                }
            }
        }

        var approvedItems = reliefRequest.relief_request_items
            .Where(x => x.approved_qty.HasValue && x.approved_qty.Value > 0)
            .ToList();

        if (approvedItems.Count == 0)
        {
            throw new InvalidOperationException("Khong co item nao duoc phe duyet sau chuan hoa.");
        }

        reliefRequest.status_code = "APPROVED";
        reliefRequest.note = request.Note;
        reliefRequest.updated_at = now;

        await dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return new
        {
            reliefRequestId = reliefRequest.id,
            requestCode = reliefRequest.code,
            decisionCode,
            status = reliefRequest.status_code,
            campaignId = reliefRequest.campaign_id,
            approvedItemCount = approvedItems.Count,
            approvedTotalQty = approvedItems.Sum(x => x.approved_qty ?? 0),
            approvedItems = approvedItems
                .OrderBy(x => x.item.code)
                .Select(x => new
                {
                    reliefRequestItemId = x.id,
                    supportTypeCode = x.item.code,
                    supportTypeName = x.item.name,
                    approvedQty = x.approved_qty,
                    unitCode = x.unit_code
                })
                .ToList(),
            standardizedAt = now
        };
    }

    public async Task<object> GetTeamDashboard()
    {
        var todayUtc = DateTime.UtcNow.Date;

        var pendingResponseCount = await dbContext.mission_teams
            .AsNoTracking()
            .CountAsync(x => x.accepted_at == null && x.rejected_at == null);

        var activeMissionCount = await dbContext.missions
            .AsNoTracking()
            .CountAsync(x => x.status_code != "COMPLETED" && x.status_code != "CANCELLED");

        var completedTodayCount = await dbContext.missions
            .AsNoTracking()
            .CountAsync(x => x.completed_at.HasValue && x.completed_at.Value >= todayUtc);

        var pendingAbortCount = await dbContext.mission_abort_requests
            .AsNoTracking()
            .CountAsync(x => x.status_code == "PENDING");

        var pendingSupportCount = await dbContext.mission_support_requests
            .AsNoTracking()
            .CountAsync(x => x.status_code == "PENDING");

        var recentMissions = await dbContext.missions
            .AsNoTracking()
            .OrderByDescending(x => x.updated_at)
            .Take(5)
            .Select(x => new
            {
                missionId = x.id,
                missionCode = x.code,
                objective = x.objective,
                status = new
                {
                    code = x.status_code,
                    name = x.status_code,
                    color = "#3B82F6"
                },
                updatedAt = x.updated_at
            })
            .ToListAsync();

        return new
        {
            pendingResponseCount,
            activeMissionCount,
            completedTodayCount,
            pendingAbortCount,
            pendingSupportCount,
            recentMissions
        };
    }

    public async Task<object> GetTeamMissions()
    {
        var items = await dbContext.missions
            .AsNoTracking()
            .Include(x => x.incident)
            .Include(x => x.mission_teams)
            .ThenInclude(x => x.team)
            .OrderByDescending(x => x.created_at)
            .Take(100)
            .Select(x => new
            {
                missionId = x.id,
                missionCode = x.code,
                incidentId = x.incident_id,
                incidentCode = x.incident.code,
                objective = x.objective,
                etaMinutes = x.eta_minutes,
                status = new
                {
                    code = x.status_code,
                    name = x.status_code,
                    color = "#3B82F6"
                },
                teams = x.mission_teams
                    .Select(a => new
                    {
                        teamId = a.team_id,
                        teamName = a.team.name,
                        isPrimary = a.is_primary_team,
                        responseStatus = a.accepted_at != null ? "ACCEPTED" : a.rejected_at != null ? "REJECTED" : "ASSIGNED",
                        respondedAt = a.accepted_at ?? a.rejected_at
                    })
                    .OrderByDescending(t => t.isPrimary)
                    .ThenBy(t => t.teamName)
                    .ToList(),
                createdAt = x.created_at,
                updatedAt = x.updated_at
            })
            .ToListAsync();

        return new { items };
    }

    public async Task<object> GetMyTeamMembers(Guid leaderUserId)
    {
        var teams = await dbContext.teams
            .AsNoTracking()
            .Where(x => x.leader_user_id == leaderUserId)
            .Include(x => x.team_members)
            .ThenInclude(x => x.user)
            .Include(x => x.team_members)
            .ThenInclude(x => x.team_member_skills)
            .ThenInclude(x => x.skill)
            .OrderBy(x => x.name)
            .ToListAsync();

        if (teams.Count == 0)
        {
            throw new InvalidOperationException("Tai khoan hien tai khong la leader cua team nao.");
        }

        var items = teams.Select(team => new
        {
            teamId = team.id,
            teamCode = team.code,
            teamName = team.name,
            status = new
            {
                code = team.status_code,
                name = team.status_code,
                color = (string?)null
            },
            members = team.team_members
                .OrderBy(x => x.is_team_leader ? 0 : 1)
                .ThenBy(x => x.full_name)
                .Select(member => new
                {
                    memberId = member.id,
                    fullName = member.full_name,
                    phone = member.phone,
                    userId = member.user_id,
                    username = member.user?.username,
                    displayName = member.user?.display_name,
                    isTeamLeader = member.is_team_leader,
                    status = new
                    {
                        code = member.status_code,
                        name = member.status_code,
                        color = (string?)null
                    },
                    lastKnownLocation = member.last_known_location == null
                        ? null
                        : new
                        {
                            lat = (decimal)member.last_known_location.Y,
                            lng = (decimal)member.last_known_location.X
                        },
                    skills = member.team_member_skills
                        .OrderByDescending(x => x.is_primary)
                        .ThenBy(x => x.skill.code)
                        .Select(x => new
                        {
                            teamMemberSkillId = x.id,
                            skillId = x.skill_id,
                            skillCode = x.skill.code,
                            skillName = x.skill.name,
                            levelCode = x.level_code,
                            isPrimary = x.is_primary
                        })
                        .ToList(),
                    notes = member.notes,
                    createdAt = member.created_at
                })
                .ToList()
        }).ToList();

        return new { items };
    }

    public Task<object> GetMissionActionCodes()
    {
        var items = MissionActionCodes.Select(x => new
        {
            actionCode = x,
            targetStatusCode = MapActionToStatus(x),
            requestFormat = new
            {
                actionCode = x,
                note = "string"
            }
        }).ToList();

        return Task.FromResult<object>(new
        {
            items,
            updateEndpoint = "/api/v1/team/missions/{missionId}/status"
        });
    }

    public async Task<object> GetTeamMissionDetail(Guid missionId)
    {
        var mission = await dbContext.missions
            .AsNoTracking()
            .Include(x => x.incident)
            .Include(x => x.mission_teams)
            .ThenInclude(x => x.team)
            .Include(x => x.mission_status_histories)
            .Include(x => x.mission_field_reports)
            .Include(x => x.mission_abort_requests)
            .Include(x => x.mission_support_requests)
            .FirstOrDefaultAsync(x => x.id == missionId);

        if (mission is null)
        {
            throw new InvalidOperationException("Khong tim thay nhiem vu.");
        }

        return new
        {
            missionId = mission.id,
            missionCode = mission.code,
            incident = new
            {
                incidentId = mission.incident_id,
                incidentCode = mission.incident.code,
                description = mission.incident.description
            },
            objective = mission.objective,
            etaMinutes = mission.eta_minutes,
            actualStartAt = mission.started_at,
            actualEndAt = mission.completed_at,
            resultCode = mission.status_code,
            resultSummary = mission.objective,
            status = new
            {
                code = mission.status_code,
                name = mission.status_code,
                color = "#3B82F6"
            },
            teams = mission.mission_teams
                .Select(x => new
                {
                    assignmentId = x.id,
                    teamId = x.team_id,
                    teamName = x.team.name,
                    isPrimary = x.is_primary_team,
                    responseStatus = x.accepted_at != null ? "ACCEPTED" : x.rejected_at != null ? "REJECTED" : "ASSIGNED",
                    respondedAt = x.accepted_at ?? x.rejected_at,
                    rejectionNote = x.response_note
                })
                .OrderByDescending(x => x.isPrimary)
                .ThenBy(x => x.teamName)
                .ToList(),
            statusHistory = mission.mission_status_histories
                .OrderByDescending(x => x.changed_at)
                .Select(x => new
                {
                    changedAt = x.changed_at,
                    actionCode = x.action_code,
                    fromState = x.from_status_code,
                    toState = x.to_status_code,
                    reasonCode = (string?)null,
                    note = x.note
                })
                .ToList(),
            reports = mission.mission_field_reports
                .OrderByDescending(x => x.created_at)
                .Select(x => new
                {
                    reportId = x.id,
                    reportTypeCode = x.report_type_code,
                    summary = x.summary,
                    victimRescuedCount = x.rescued_count,
                    victimUnreachableCount = x.unreachable_count,
                    casualtyCount = x.casualty_count,
                    reportedAt = x.created_at
                })
                .ToList(),
            abortRequests = mission.mission_abort_requests
                .OrderByDescending(x => x.requested_at)
                .Select(x => new
                {
                    requestId = x.id,
                    reasonCode = x.reason_code,
                    detailNote = x.detail_note,
                    decisionStatus = x.status_code,
                    requestedAt = x.requested_at,
                    decidedAt = x.decided_at
                })
                .ToList(),
            supportRequests = mission.mission_support_requests
                .OrderByDescending(x => x.requested_at)
                .Select(x => new
                {
                    requestId = x.id,
                    supportTypeCode = x.support_type_code,
                    detailNote = x.detail_note,
                    status = x.status_code,
                    requestedAt = x.requested_at
                })
                .ToList(),
            allActionCodes = MissionActionCodes,
            actionCodeCatalog = MissionActionCodes.Select(x => new
            {
                actionCode = x,
                targetStatusCode = MapActionToStatus(x)
            }).ToList(),
            historyActionCodes = mission.mission_status_histories
                .OrderByDescending(x => x.changed_at)
                .Select(x => x.action_code)
                .Distinct()
                .ToList(),
            createdAt = mission.created_at,
            updatedAt = mission.updated_at
        };
    }

    public async Task<object> TeamRespondMission(Guid missionId, TeamRespondMissionRequest request)
    {
        var mission = await dbContext.missions
            .Include(x => x.mission_teams)
            .FirstOrDefaultAsync(x => x.id == missionId);

        if (mission is null)
        {
            throw new InvalidOperationException("Khong tim thay nhiem vu.");
        }

        var assignment = mission.mission_teams
            .OrderByDescending(x => x.is_primary_team)
            .ThenBy(x => x.assigned_at)
            .FirstOrDefault();

        if (assignment is null)
        {
            throw new InvalidOperationException("Nhiem vu chua co phan cong doi.");
        }

        var response = request.Response.Trim().ToUpperInvariant();
        if (response is not ("ACCEPT" or "REJECT"))
        {
            throw new InvalidOperationException("Response chi nhan ACCEPT hoac REJECT.");
        }

        var now = DateTime.UtcNow;
        assignment.response_note = request.Note;

        var fromStatus = mission.status_code;
        string toStatus;

        if (response == "ACCEPT")
        {
            assignment.accepted_at = now;
            assignment.rejected_at = null;
            if (!mission.started_at.HasValue)
            {
                mission.started_at = now;
            }

            toStatus = "EN_ROUTE";
            mission.status_code = toStatus;
        }
        else
        {
            assignment.rejected_at = now;
            assignment.accepted_at = null;
            toStatus = fromStatus;
        }

        mission.updated_at = now;

        dbContext.mission_status_histories.Add(new mission_status_history
        {
            id = Guid.NewGuid(),
            mission_id = missionId,
            from_status_code = fromStatus,
            to_status_code = toStatus,
            action_code = response == "ACCEPT" ? "TEAM_ACCEPT" : "TEAM_REJECT",
            changed_at = now,
            note = request.Note
        });

        await SyncIncidentStatusFromMission(mission, now, request.Note);

        await dbContext.SaveChangesAsync();

        return new
        {
            missionId,
            response,
            assignmentStatus = response == "ACCEPT" ? "ACCEPTED" : "REJECTED",
            respondedAt = now
        };
    }

    public async Task<object> TeamUpdateMissionStatus(Guid missionId, TeamMissionStatusRequest request)
    {
        var mission = await dbContext.missions
            .FirstOrDefaultAsync(x => x.id == missionId);

        if (mission is null)
        {
            throw new InvalidOperationException("Khong tim thay nhiem vu.");
        }

        var actionCode = request.ActionCode.Trim().ToUpperInvariant();
        var mappedStateCode = actionCode switch
        {
            "DEPART" => "EN_ROUTE",
            "ARRIVED" => "ON_SITE",
            "ON_SCENE" => "ON_SITE",
            "START_RESCUE" => "RESCUING",
            "IN_PROGRESS" => "RESCUING",
            "FIELD_REPORT" => "RESCUING",
            "NEED_SUPPORT" => "NEED_SUPPORT",
            "COMPLETE" => "COMPLETED",
            "COMPLETED" => "COMPLETED",
            "ABORTED" => "ABORTED",
            "UNREACHABLE" => "ABORTED",
            _ => actionCode
        };

        var fromStatus = mission.status_code;
        var now = DateTime.UtcNow;
        mission.status_code = mappedStateCode;
        mission.updated_at = now;

        if ((actionCode is "DEPART" or "START_RESCUE" or "IN_PROGRESS") && !mission.started_at.HasValue)
        {
            mission.started_at = now;
        }

        if (mappedStateCode is "COMPLETED" or "CANCELLED")
        {
            mission.completed_at = now;
        }

        dbContext.mission_status_histories.Add(new mission_status_history
        {
            id = Guid.NewGuid(),
            mission_id = missionId,
            from_status_code = fromStatus,
            to_status_code = mappedStateCode,
            action_code = actionCode,
            changed_at = now,
            note = request.Note
        });

        await SyncIncidentStatusFromMission(mission, now, request.Note);

        await dbContext.SaveChangesAsync();

        return new
        {
            missionId,
            actionCode,
            updatedAt = now
        };
    }

    private static string MapActionToStatus(string actionCode)
        => actionCode switch
        {
            "DEPART" => "EN_ROUTE",
            "ARRIVED" => "ON_SITE",
            "ON_SCENE" => "ON_SITE",
            "START_RESCUE" => "RESCUING",
            "IN_PROGRESS" => "RESCUING",
            "COMPLETE" => "COMPLETED",
            "COMPLETED" => "COMPLETED",
            "ABORTED" => "ABORTED",
            "TEAM_ACCEPT" => "EN_ROUTE",
            "TEAM_REJECT" => "REJECTED",
            "FIELD_REPORT" => "RESCUING",
            "NEED_SUPPORT" => "NEED_SUPPORT",
            "UNREACHABLE" => "ABORTED",
            _ => actionCode
        };

    private async Task SyncIncidentStatusFromMission(mission mission, DateTime now, string? note)
    {
        var incident = await dbContext.incidents.FirstOrDefaultAsync(x => x.id == mission.incident_id);
        if (incident is null)
        {
            return;
        }

        string? targetIncidentStatus = mission.status_code switch
        {
            "EN_ROUTE" or "ON_SITE" or "RESCUING" or "NEED_SUPPORT" => "IN_PROGRESS",
            "COMPLETED" => incident.need_relief ? "RELIEF_REQUIRED" : "RESCUED",
            _ => null
        };

        if (targetIncidentStatus is null)
        {
            return;
        }

        // Do not move backward once incident already reaches terminal/relief-required states.
        if (targetIncidentStatus == "IN_PROGRESS" &&
            (incident.status_code == "RESCUED" || incident.status_code == "RELIEF_REQUIRED" || incident.status_code == "CLOSED"))
        {
            return;
        }

        if (string.Equals(incident.status_code, targetIncidentStatus, StringComparison.Ordinal))
        {
            return;
        }

        var fromStatus = incident.status_code;
        incident.status_code = targetIncidentStatus;
        incident.updated_at = now;

        dbContext.incident_status_histories.Add(new incident_status_history
        {
            id = Guid.NewGuid(),
            incident_id = incident.id,
            from_status_code = fromStatus,
            to_status_code = targetIncidentStatus,
            action_code = "MISSION_STATUS_SYNC",
            note = string.IsNullOrWhiteSpace(note)
                ? $"Dong bo theo mission {mission.code} -> {mission.status_code}"
                : note,
            changed_at = now
        });
    }

    public async Task<object> TeamCreateFieldReport(Guid missionId, TeamFieldReportRequest request)
    {
        var mission = await dbContext.missions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.id == missionId);

        if (mission is null)
        {
            throw new InvalidOperationException("Khong tim thay nhiem vu.");
        }

        var now = DateTime.UtcNow;
        var report = new mission_field_report
        {
            id = Guid.NewGuid(),
            mission_id = missionId,
            report_type_code = request.ReportTypeCode,
            summary = request.Summary ?? string.Empty,
            rescued_count = request.VictimRescuedCount ?? 0,
            unreachable_count = request.VictimUnreachableCount ?? 0,
            casualty_count = request.CasualtyCount ?? 0,
            next_action_note = request.NextActionNote,
            created_at = now
        };
        dbContext.mission_field_reports.Add(report);

        var attachedFileCount = 0;
        if (request.FileIds is { Count: > 0 })
        {
            foreach (var fileId in request.FileIds.Distinct())
            {
                dbContext.mission_field_report_media.Add(new mission_field_report_medium
                {
                    id = Guid.NewGuid(),
                    mission_field_report_id = report.id,
                    file_public_id = fileId.ToString("N"),
                    file_url = $"media://{fileId:N}",
                    media_type_code = "IMAGE",
                    uploaded_at = now
                });
                attachedFileCount++;
            }
        }

        dbContext.mission_status_histories.Add(new mission_status_history
        {
            id = Guid.NewGuid(),
            mission_id = missionId,
            from_status_code = mission.status_code,
            to_status_code = mission.status_code,
            action_code = "FIELD_REPORT",
            changed_at = now,
            note = request.Summary
        });

        await dbContext.SaveChangesAsync();

        return new
        {
            missionId,
            reportId = report.id,
            reportedAt = now,
            attachedFileCount
        };
    }

    public async Task<object> TeamCreateAbortRequest(Guid missionId, TeamAbortRequest request)
    {
        var mission = await dbContext.missions
            .FirstOrDefaultAsync(x => x.id == missionId);

        if (mission is null)
        {
            throw new InvalidOperationException("Khong tim thay nhiem vu.");
        }

        var now = DateTime.UtcNow;
        var abortRequest = new mission_abort_request
        {
            id = Guid.NewGuid(),
            mission_id = missionId,
            requested_at = now,
            reason_code = request.ReasonCode,
            detail_note = request.DetailNote,
            status_code = "PENDING"
        };
        dbContext.mission_abort_requests.Add(abortRequest);

        dbContext.mission_status_histories.Add(new mission_status_history
        {
            id = Guid.NewGuid(),
            mission_id = missionId,
            from_status_code = mission.status_code,
            to_status_code = mission.status_code,
            action_code = "REQUEST_ABORT",
            changed_at = now,
            note = request.DetailNote
        });

        await dbContext.SaveChangesAsync();

        return new
        {
            missionId,
            requestId = abortRequest.id,
            status = abortRequest.status_code,
            requestedAt = now
        };
    }

    public async Task<object> TeamCreateSupportRequest(Guid missionId, TeamSupportRequest request)
    {
        var mission = await dbContext.missions
            .FirstOrDefaultAsync(x => x.id == missionId);

        if (mission is null)
        {
            throw new InvalidOperationException("Khong tim thay nhiem vu.");
        }

        var now = DateTime.UtcNow;
        var supportRequest = new mission_support_request
        {
            id = Guid.NewGuid(),
            mission_id = missionId,
            support_type_code = request.SupportTypeCode,
            requested_at = now,
            status_code = "PENDING",
            reason_code = "REQUESTED",
            detail_note = request.DetailNote
        };
        dbContext.mission_support_requests.Add(supportRequest);

        dbContext.mission_status_histories.Add(new mission_status_history
        {
            id = Guid.NewGuid(),
            mission_id = missionId,
            from_status_code = mission.status_code,
            to_status_code = mission.status_code,
            action_code = "REQUEST_SUPPORT",
            changed_at = now,
            note = request.DetailNote
        });

        await dbContext.SaveChangesAsync();

        return new
        {
            missionId,
            requestId = supportRequest.id,
            status = supportRequest.status_code,
            requestedAt = now
        };
    }

    private static decimal EstimateDistanceKm(decimal? lat1, decimal? lng1, double? lat2, double? lng2)
    {
        if (!lat1.HasValue || !lng1.HasValue || !lat2.HasValue || !lng2.HasValue)
        {
            return 0;
        }

        var dLat = Math.Abs((double)lat1.Value - lat2.Value);
        var dLng = Math.Abs((double)lng1.Value - lng2.Value);
        return (decimal)Math.Sqrt((dLat * dLat) + (dLng * dLng)) * 111m;
    }

    private sealed record IncidentHandlingTeamInfo(
        Guid TeamId,
        string TeamCode,
        string TeamName,
        bool IsPrimaryTeam,
        Guid MissionId,
        string MissionCode,
        string MissionStatusCode,
        DateTime AssignedAt);

    private sealed record ResolvedAreaInfo(Guid Id, string? Code, string? Name);
}
