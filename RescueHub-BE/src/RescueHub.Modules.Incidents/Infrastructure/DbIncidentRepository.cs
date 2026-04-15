using Microsoft.EntityFrameworkCore;
using RescueHub.BuildingBlocks.Application;
using RescueHub.Modules.Incidents.Application;
using RescueHub.Persistence;
using RescueHub.Persistence.Entities.Scaffolded;

namespace RescueHub.Modules.Incidents.Infrastructure;

public sealed class DbIncidentRepository(RescueHubDbContext dbContext) : IIncidentRepository
{
    public async Task<object> List()
    {
        var items = await dbContext.incidents
            .AsNoTracking()
            .OrderByDescending(x => x.created_at)
            .Take(100)
            .Select(x => new
            {
                id = x.id,
                incidentCode = x.code,
                status = new { code = x.status_code, name = x.status_code, color = (string?)null },
                reportedAt = x.created_at
            })
            .ToListAsync();

        return items;
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

        incident.status_code = "DISPATCHED";
        incident.updated_at = now;

        dbContext.incident_status_histories.Add(new incident_status_history
        {
            id = Guid.NewGuid(),
            incident_id = incidentId,
            from_status_code = "ASSESSED",
            to_status_code = "DISPATCHED",
            action_code = "DISPATCH",
            changed_at = now,
            note = request.Note
        });

        await dbContext.SaveChangesAsync();

        return new
        {
            missionId = mission.id,
            missionCode = mission.code,
            status = new
            {
                code = "ASSIGNED",
                name = "Da giao nhiem vu",
                color = "#F59E0B"
            }
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
            "ARRIVED" => "ON_SCENE",
            "ON_SCENE" => "ON_SCENE",
            "START_RESCUE" => "IN_PROGRESS",
            "IN_PROGRESS" => "IN_PROGRESS",
            "COMPLETE" => "COMPLETED",
            "COMPLETED" => "COMPLETED",
            "ABORTED" => "CANCELLED",
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

        await dbContext.SaveChangesAsync();

        return new
        {
            missionId,
            actionCode,
            updatedAt = now
        };
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
}
