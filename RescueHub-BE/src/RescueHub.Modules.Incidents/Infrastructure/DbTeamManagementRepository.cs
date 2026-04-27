using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using RescueHub.Modules.Incidents.Application;
using RescueHub.Persistence;
using RescueHub.Persistence.Entities.Scaffolded;

namespace RescueHub.Modules.Incidents.Infrastructure;

public sealed class DbTeamManagementRepository(RescueHubDbContext dbContext) : ITeamManagementRepository
{
    private static readonly HashSet<string> TeamStatusCodes =
    [
        "AVAILABLE",
        "BUSY",
        "OFFLINE",
        "MAINTENANCE"
    ];

    private static readonly HashSet<string> TeamMemberStatusCodes =
    [
        "AVAILABLE",
        "ON_MISSION",
        "OFF_SHIFT",
        "INJURED",
        "UNREACHABLE"
    ];

    private static readonly HashSet<string> SkillLevelCodes =
    [
        "LEVEL_1",
        "LEVEL_2",
        "LEVEL_3"
    ];

    private static readonly HashSet<string> VehicleStatusCodes =
    [
        "AVAILABLE",
        "IN_USE",
        "OUT_OF_SERVICE",
        "MAINTENANCE"
    ];

    private static readonly HashSet<string> MissionResponseStatuses =
    [
        "ASSIGNED",
        "ACCEPTED",
        "REJECTED"
    ];

    public Task<object> GetStatusOptions()
    {
        var data = new
        {
            teamStatusCodes = TeamStatusCodes.Select(ToCodeItem).ToArray(),
            teamMemberStatusCodes = TeamMemberStatusCodes.Select(ToCodeItem).ToArray(),
            skillLevelCodes = SkillLevelCodes.Select(ToCodeItem).ToArray()
        };

        return Task.FromResult<object>(data);
    }

    public async Task<object> ListAdminAreas(string? keyword, string? levelCode, Guid? parentId, int page, int pageSize)
    {
        var normalizedPage = page <= 0 ? 1 : page;
        var normalizedPageSize = pageSize <= 0 ? 20 : Math.Min(pageSize, 200);
        var normalizedKeyword = NormalizeOptional(keyword);
        var normalizedLevelCode = NormalizeOptional(levelCode)?.ToUpperInvariant();

        var query = dbContext.admin_areas
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(normalizedKeyword))
        {
            query = query.Where(x => x.code.Contains(normalizedKeyword) || x.name.Contains(normalizedKeyword));
        }

        if (!string.IsNullOrWhiteSpace(normalizedLevelCode))
        {
            query = query.Where(x => x.level_code == normalizedLevelCode);
        }

        if (parentId.HasValue)
        {
            query = query.Where(x => x.parent_id == parentId.Value);
        }

        var totalItems = await query.CountAsync();
        var items = await query
            .OrderBy(x => x.level_code)
            .ThenBy(x => x.code)
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                name = x.name,
                levelCode = x.level_code,
                parentId = x.parent_id
            })
            .ToListAsync();

        var parentIds = items
            .Where(x => x.parentId.HasValue)
            .Select(x => x.parentId!.Value)
            .Distinct()
            .ToArray();

        var parentLookup = await dbContext.admin_areas
            .AsNoTracking()
            .Where(x => parentIds.Contains(x.id))
            .ToDictionaryAsync(x => x.id, x => new { x.id, x.code, x.name });

        var shapedItems = items.Select(x => new
        {
            x.id,
            x.code,
            x.name,
            x.levelCode,
            parent = x.parentId.HasValue && parentLookup.TryGetValue(x.parentId.Value, out var parent)
                ? parent
                : null
        });

        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)normalizedPageSize);
        return new
        {
            items = shapedItems,
            page = normalizedPage,
            pageSize = normalizedPageSize,
            totalItems,
            totalPages
        };
    }

    public async Task<object> GetAdminArea(Guid adminAreaId)
    {
        var entity = await dbContext.admin_areas
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.id == adminAreaId)
            ?? throw new InvalidOperationException("Khong tim thay admin area.");

        var childCount = await dbContext.admin_areas
            .AsNoTracking()
            .CountAsync(x => x.parent_id == adminAreaId);

        object? parent = null;
        if (entity.parent_id.HasValue)
        {
            parent = await dbContext.admin_areas
                .AsNoTracking()
                .Where(x => x.id == entity.parent_id.Value)
                .Select(x => new { id = x.id, code = x.code, name = x.name })
                .FirstOrDefaultAsync();
        }

        return new
        {
            id = entity.id,
            code = entity.code,
            name = entity.name,
            levelCode = entity.level_code,
            parent,
            childCount
        };
    }

    public async Task<object> ListTeams(string? keyword, string? statusCode)
    {
        var query = dbContext.teams
            .AsNoTracking()
            .Include(x => x.leader_user)
            .Include(x => x.home_admin_area)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var q = keyword.Trim();
            query = query.Where(x => x.code.Contains(q) || x.name.Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            var normalizedStatusCode = NormalizeCode(statusCode);
            query = query.Where(x => x.status_code == normalizedStatusCode);
        }

        var items = await query
            .OrderBy(x => x.code)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                name = x.name,
                status = new { code = x.status_code, name = x.status_code, color = (string?)null },
                leader = x.leader_user == null
                    ? null
                    : new
                    {
                        id = x.leader_user.id,
                        username = x.leader_user.username,
                        displayName = x.leader_user.display_name,
                        phone = x.leader_user.phone
                    },
                homeAdminArea = x.home_admin_area == null
                    ? null
                    : new
                    {
                        id = x.home_admin_area.id,
                        code = x.home_admin_area.code,
                        name = x.home_admin_area.name,
                        levelCode = x.home_admin_area.level_code
                    },
                maxParallelMissions = x.max_parallel_missions,
                currentLocation = ToLocationItem(x.current_location),
                notes = x.notes,
                memberCount = x.team_members.Count,
                vehicleCount = x.vehicles.Count,
                createdAt = x.created_at
            })
            .ToListAsync();

        return new { items };
    }

    public async Task<object> GetTeam(Guid teamId)
    {
        var team = await dbContext.teams
            .AsNoTracking()
            .Include(x => x.leader_user)
            .Include(x => x.home_admin_area)
            .Include(x => x.team_members)
            .Include(x => x.vehicles)
            .FirstOrDefaultAsync(x => x.id == teamId);

        if (team is null)
        {
            throw new InvalidOperationException("Khong tim thay team.");
        }

        return new
        {
            id = team.id,
            code = team.code,
            name = team.name,
            status = new { code = team.status_code, name = team.status_code, color = (string?)null },
            leader = team.leader_user == null
                ? null
                : new
                {
                    id = team.leader_user.id,
                    username = team.leader_user.username,
                    displayName = team.leader_user.display_name,
                    phone = team.leader_user.phone
                },
            homeAdminArea = team.home_admin_area == null
                ? null
                : new
                {
                    id = team.home_admin_area.id,
                    code = team.home_admin_area.code,
                    name = team.home_admin_area.name,
                    levelCode = team.home_admin_area.level_code
                },
            maxParallelMissions = team.max_parallel_missions,
            currentLocation = ToLocationItem(team.current_location),
            notes = team.notes,
            createdAt = team.created_at,
            members = team.team_members
                .OrderBy(x => x.full_name)
                .Select(x => new
                {
                    id = x.id,
                    fullName = x.full_name,
                    status = new { code = x.status_code, name = x.status_code, color = (string?)null },
                    isTeamLeader = x.is_team_leader,
                    createdAt = x.created_at
                })
                .ToList(),
            vehicles = team.vehicles
                .OrderBy(x => x.code)
                .Select(x => new
                {
                    id = x.id,
                    code = x.code,
                    name = x.display_name,
                    status = new { code = x.status_code, name = x.status_code, color = (string?)null }
                })
                .ToList()
        };
    }

    public async Task<object> GetTeamRescueHistory(Guid teamId, string? responseStatus, int page, int pageSize)
    {
        await EnsureTeamExists(teamId);

        var normalizedPage = page <= 0 ? 1 : page;
        var normalizedPageSize = pageSize <= 0 ? 20 : Math.Min(pageSize, 200);
        var normalizedResponseStatus = string.IsNullOrWhiteSpace(responseStatus)
            ? null
            : NormalizeCode(responseStatus);

        if (normalizedResponseStatus is not null && !MissionResponseStatuses.Contains(normalizedResponseStatus))
        {
            throw new InvalidOperationException("responseStatus khong hop le. Chi nhan ASSIGNED, ACCEPTED, REJECTED.");
        }

        var query = dbContext.mission_teams
            .AsNoTracking()
            .Where(x => x.team_id == teamId)
            .Include(x => x.mission)
            .ThenInclude(x => x.incident)
            .AsQueryable();

        if (normalizedResponseStatus == "ASSIGNED")
        {
            query = query.Where(x => x.accepted_at == null && x.rejected_at == null);
        }
        else if (normalizedResponseStatus == "ACCEPTED")
        {
            query = query.Where(x => x.accepted_at != null);
        }
        else if (normalizedResponseStatus == "REJECTED")
        {
            query = query.Where(x => x.rejected_at != null);
        }

        var totalItems = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.assigned_at)
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .Select(x => new
            {
                assignmentId = x.id,
                responseStatus = x.accepted_at != null
                    ? "ACCEPTED"
                    : x.rejected_at != null
                        ? "REJECTED"
                        : "ASSIGNED",
                assignedAt = x.assigned_at,
                respondedAt = x.accepted_at ?? x.rejected_at,
                responseNote = x.response_note,
                isPrimaryTeam = x.is_primary_team,
                mission = new
                {
                    id = x.mission.id,
                    code = x.mission.code,
                    objective = x.mission.objective,
                    statusCode = x.mission.status_code,
                    priorityCode = x.mission.priority_code,
                    etaMinutes = x.mission.eta_minutes,
                    startedAt = x.mission.started_at,
                    completedAt = x.mission.completed_at,
                    createdAt = x.mission.created_at,
                    updatedAt = x.mission.updated_at
                },
                incident = new
                {
                    id = x.mission.incident.id,
                    code = x.mission.incident.code,
                    incidentTypeCode = x.mission.incident.incident_type_code,
                    statusCode = x.mission.incident.status_code,
                    createdAt = x.mission.incident.created_at
                }
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

    public async Task<object> CreateTeam(CreateTeamRequest request)
    {
        var normalizedCode = NormalizeCode(request.Code);
        var normalizedName = ResolveNameOrFallback(request.Name, normalizedCode);
        var normalizedStatusCode = NormalizeCode(request.StatusCode);
        ValidateTeamStatus(normalizedStatusCode);

        var maxParallelMissions = request.MaxParallelMissions ?? 2;
        if (maxParallelMissions <= 0)
        {
            throw new InvalidOperationException("MaxParallelMissions phai lon hon 0.");
        }

        var codeExists = await dbContext.teams.AnyAsync(x => x.code == normalizedCode);
        if (codeExists)
        {
            throw new InvalidOperationException($"Ma team da ton tai: {normalizedCode}");
        }

        await EnsureLeaderUserExists(request.LeaderUserId);
        if (request.HomeBase is null)
        {
            throw new InvalidOperationException("HomeBase la bat buoc.");
        }

        var homeAddress = NormalizeRequired(request.HomeBase.Address, nameof(request.HomeBase.Address));
        var homeAdminAreaId = await ResolveAdminAreaIdFromLocation(request.HomeBase.Location);
        if (!homeAdminAreaId.HasValue)
        {
            throw new InvalidOperationException("Khong the suy ra admin area tu toa do home base.");
        }
        var currentLocation = request.CurrentLocation;

        var now = DateTime.UtcNow;
        var team = new team
        {
            id = Guid.NewGuid(),
            code = normalizedCode,
            name = normalizedName,
            leader_user_id = request.LeaderUserId,
            home_admin_area_id = homeAdminAreaId.Value,
            status_code = normalizedStatusCode,
            max_parallel_missions = maxParallelMissions,
            current_location = ToPointOrNull(currentLocation),
            notes = MergeTeamNotes(homeAddress, request.Notes),
            created_at = now
        };

        dbContext.teams.Add(team);
        await dbContext.SaveChangesAsync();

        return new
        {
            id = team.id,
            code = team.code,
            createdAt = team.created_at
        };
    }

    public async Task<object> UpdateTeam(Guid teamId, UpdateTeamRequest request)
    {
        var team = await dbContext.teams.FirstOrDefaultAsync(x => x.id == teamId);
        if (team is null)
        {
            throw new InvalidOperationException("Khong tim thay team.");
        }

        var normalizedCode = NormalizeCode(request.Code);
        var normalizedName = NormalizeRequired(request.Name, "Name");
        var normalizedStatusCode = NormalizeCode(request.StatusCode);
        ValidateTeamStatus(normalizedStatusCode);

        var maxParallelMissions = request.MaxParallelMissions ?? team.max_parallel_missions;
        if (maxParallelMissions <= 0)
        {
            throw new InvalidOperationException("MaxParallelMissions phai lon hon 0.");
        }

        var codeExists = await dbContext.teams.AnyAsync(x => x.id != teamId && x.code == normalizedCode);
        if (codeExists)
        {
            throw new InvalidOperationException($"Ma team da ton tai: {normalizedCode}");
        }

        await EnsureLeaderUserExists(request.LeaderUserId);
        await EnsureAdminAreaExists(request.HomeAdminAreaId);

        team.code = normalizedCode;
        team.name = normalizedName;
        team.leader_user_id = request.LeaderUserId;
        team.home_admin_area_id = request.HomeAdminAreaId;
        team.status_code = normalizedStatusCode;
        team.max_parallel_missions = maxParallelMissions;
        team.current_location = ToPointOrNull(request.CurrentLocation);
        team.notes = NormalizeOptional(request.Notes);

        await dbContext.SaveChangesAsync();

        return new
        {
            id = team.id,
            code = team.code,
            updated = true
        };
    }

    public async Task<object> DeleteTeam(Guid teamId)
    {
        var team = await dbContext.teams.FirstOrDefaultAsync(x => x.id == teamId);
        if (team is null)
        {
            throw new InvalidOperationException("Khong tim thay team.");
        }

        var hasMissionAssignments = await dbContext.mission_teams.AnyAsync(x => x.team_id == teamId);
        if (hasMissionAssignments)
        {
            throw new InvalidOperationException("Team da duoc gan vao mission, khong the xoa.");
        }

        var hasMissionMembers = await dbContext.team_members
            .Where(x => x.team_id == teamId)
            .AnyAsync(x => x.mission_members.Any());
        if (hasMissionMembers)
        {
            throw new InvalidOperationException("Team co thanh vien da tham gia mission, khong the xoa.");
        }

        var members = await dbContext.team_members
            .Where(x => x.team_id == teamId)
            .Include(x => x.team_member_skills)
            .ToListAsync();

        foreach (var member in members)
        {
            dbContext.team_member_skills.RemoveRange(member.team_member_skills);
        }

        dbContext.team_members.RemoveRange(members);

        var vehicles = await dbContext.vehicles.Where(x => x.team_id == teamId).ToListAsync();
        foreach (var vehicle in vehicles)
        {
            vehicle.team_id = null;
        }

        dbContext.teams.Remove(team);
        await dbContext.SaveChangesAsync();

        return new
        {
            id = teamId,
            deleted = true
        };
    }

    public async Task<object> ListTeamMembers(Guid teamId, string? statusCode)
    {
        await EnsureTeamExists(teamId);

        var query = dbContext.team_members
            .AsNoTracking()
            .Where(x => x.team_id == teamId)
            .Include(x => x.user)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            var normalizedStatusCode = NormalizeCode(statusCode);
            query = query.Where(x => x.status_code == normalizedStatusCode);
        }

        var items = await query
            .OrderBy(x => x.full_name)
            .Select(x => new
            {
                id = x.id,
                userId = x.user_id,
                user = x.user == null
                    ? null
                    : new
                    {
                        id = x.user.id,
                        username = x.user.username,
                        displayName = x.user.display_name,
                        phone = x.user.phone
                    },
                fullName = x.full_name,
                phone = x.phone,
                status = new { code = x.status_code, name = x.status_code, color = (string?)null },
                isTeamLeader = x.is_team_leader,
                lastKnownLocation = ToLocationItem(x.last_known_location),
                notes = x.notes,
                skillCount = x.team_member_skills.Count,
                createdAt = x.created_at
            })
            .ToListAsync();

        return new { items };
    }

    public async Task<object> GetTeamMember(Guid teamId, Guid memberId)
    {
        var member = await dbContext.team_members
            .AsNoTracking()
            .Include(x => x.user)
            .Include(x => x.team_member_skills)
            .ThenInclude(x => x.skill)
            .FirstOrDefaultAsync(x => x.team_id == teamId && x.id == memberId);

        if (member is null)
        {
            throw new InvalidOperationException("Khong tim thay thanh vien team.");
        }

        return new
        {
            id = member.id,
            teamId = member.team_id,
            userId = member.user_id,
            user = member.user == null
                ? null
                : new
                {
                    id = member.user.id,
                    username = member.user.username,
                    displayName = member.user.display_name,
                    phone = member.user.phone
                },
            fullName = member.full_name,
            phone = member.phone,
            status = new { code = member.status_code, name = member.status_code, color = (string?)null },
            isTeamLeader = member.is_team_leader,
            lastKnownLocation = ToLocationItem(member.last_known_location),
            notes = member.notes,
            createdAt = member.created_at,
            skills = member.team_member_skills
                .OrderBy(x => x.skill.code)
                .Select(x => new
                {
                    id = x.id,
                    skillId = x.skill_id,
                    skillCode = x.skill.code,
                    skillName = x.skill.name,
                    levelCode = x.level_code,
                    isPrimary = x.is_primary
                })
                .ToList()
        };
    }

    public async Task<object> CreateTeamMember(Guid teamId, CreateTeamMemberRequest request)
    {
        var team = await dbContext.teams.FirstOrDefaultAsync(x => x.id == teamId);
        if (team is null)
        {
            throw new InvalidOperationException("Khong tim thay team.");
        }

        var fullName = NormalizeRequired(request.FullName, "FullName");
        var phone = NormalizeOptional(request.Phone);
        var normalizedStatusCode = NormalizeCode(request.StatusCode);
        ValidateTeamMemberStatus(normalizedStatusCode);

        await EnsureAppUserExists(request.UserId);

        var member = new team_member
        {
            id = Guid.NewGuid(),
            team_id = teamId,
            user_id = request.UserId,
            full_name = fullName,
            phone = phone,
            status_code = normalizedStatusCode,
            is_team_leader = request.IsTeamLeader,
            last_known_location = ToPointOrNull(request.LastKnownLocation),
            notes = NormalizeOptional(request.Notes),
            created_at = DateTime.UtcNow
        };

        dbContext.team_members.Add(member);

        if (request.IsTeamLeader)
        {
            await ClearOtherTeamLeaders(teamId, member.id);
            if (request.UserId.HasValue)
            {
                team.leader_user_id = request.UserId;
            }
        }

        await dbContext.SaveChangesAsync();

        return new
        {
            id = member.id,
            teamId,
            createdAt = member.created_at
        };
    }

    public async Task<object> UpdateTeamMember(Guid teamId, Guid memberId, UpdateTeamMemberRequest request)
    {
        var member = await dbContext.team_members
            .Include(x => x.team)
            .FirstOrDefaultAsync(x => x.team_id == teamId && x.id == memberId);

        if (member is null)
        {
            throw new InvalidOperationException("Khong tim thay thanh vien team.");
        }

        var fullName = NormalizeRequired(request.FullName, "FullName");
        var phone = NormalizeOptional(request.Phone);
        var normalizedStatusCode = NormalizeCode(request.StatusCode);
        ValidateTeamMemberStatus(normalizedStatusCode);

        await EnsureAppUserExists(request.UserId);

        member.user_id = request.UserId;
        member.full_name = fullName;
        member.phone = phone;
        member.status_code = normalizedStatusCode;
        member.is_team_leader = request.IsTeamLeader;
        member.last_known_location = ToPointOrNull(request.LastKnownLocation);
        member.notes = NormalizeOptional(request.Notes);

        if (request.IsTeamLeader)
        {
            await ClearOtherTeamLeaders(teamId, memberId);
            if (request.UserId.HasValue)
            {
                member.team.leader_user_id = request.UserId;
            }
        }

        if (!request.IsTeamLeader && member.team.leader_user_id == member.user_id)
        {
            member.team.leader_user_id = null;
        }

        await dbContext.SaveChangesAsync();

        return new
        {
            id = member.id,
            teamId,
            updated = true
        };
    }

    public async Task<object> DeleteTeamMember(Guid teamId, Guid memberId)
    {
        var member = await dbContext.team_members
            .Include(x => x.team)
            .Include(x => x.team_member_skills)
            .FirstOrDefaultAsync(x => x.team_id == teamId && x.id == memberId);

        if (member is null)
        {
            throw new InvalidOperationException("Khong tim thay thanh vien team.");
        }

        var hasMissionHistory = await dbContext.mission_members.AnyAsync(x => x.team_member_id == memberId);
        if (hasMissionHistory)
        {
            throw new InvalidOperationException("Thanh vien da tham gia mission, khong the xoa.");
        }

        dbContext.team_member_skills.RemoveRange(member.team_member_skills);
        dbContext.team_members.Remove(member);

        if (member.team.leader_user_id == member.user_id)
        {
            member.team.leader_user_id = null;
        }

        await dbContext.SaveChangesAsync();

        return new
        {
            id = memberId,
            teamId,
            deleted = true
        };
    }

    public async Task<object> ListSkills(string? keyword)
    {
        var query = dbContext.skills.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var q = keyword.Trim();
            query = query.Where(x => x.code.Contains(q) || x.name.Contains(q));
        }

        var items = await query
            .OrderBy(x => x.code)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                name = x.name,
                description = x.description,
                memberCount = x.team_member_skills.Count,
                incidentRequirementCount = x.incident_requirement_skills.Count
            })
            .ToListAsync();

        return new { items };
    }

    public async Task<object> GetSkill(Guid skillId)
    {
        var skill = await dbContext.skills
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.id == skillId);

        if (skill is null)
        {
            throw new InvalidOperationException("Khong tim thay skill.");
        }

        return new
        {
            id = skill.id,
            code = skill.code,
            name = skill.name,
            description = skill.description,
            memberCount = await dbContext.team_member_skills.CountAsync(x => x.skill_id == skillId),
            incidentRequirementCount = await dbContext.incident_requirement_skills.CountAsync(x => x.skill_id == skillId)
        };
    }

    public async Task<object> CreateSkill(CreateSkillRequest request)
    {
        var code = NormalizeCode(request.Code);
        var name = NormalizeRequired(request.Name, "Name");

        var codeExists = await dbContext.skills.AnyAsync(x => x.code == code);
        if (codeExists)
        {
            throw new InvalidOperationException($"Ma skill da ton tai: {code}");
        }

        var skill = new skill
        {
            id = Guid.NewGuid(),
            code = code,
            name = name,
            description = NormalizeOptional(request.Description)
        };

        dbContext.skills.Add(skill);
        await dbContext.SaveChangesAsync();

        return new
        {
            id = skill.id,
            code = skill.code
        };
    }

    public async Task<object> UpdateSkill(Guid skillId, UpdateSkillRequest request)
    {
        var skill = await dbContext.skills.FirstOrDefaultAsync(x => x.id == skillId);
        if (skill is null)
        {
            throw new InvalidOperationException("Khong tim thay skill.");
        }

        var code = NormalizeCode(request.Code);
        var name = NormalizeRequired(request.Name, "Name");

        var codeExists = await dbContext.skills.AnyAsync(x => x.id != skillId && x.code == code);
        if (codeExists)
        {
            throw new InvalidOperationException($"Ma skill da ton tai: {code}");
        }

        skill.code = code;
        skill.name = name;
        skill.description = NormalizeOptional(request.Description);

        await dbContext.SaveChangesAsync();

        return new
        {
            id = skill.id,
            updated = true
        };
    }

    public async Task<object> DeleteSkill(Guid skillId)
    {
        var skill = await dbContext.skills.FirstOrDefaultAsync(x => x.id == skillId);
        if (skill is null)
        {
            throw new InvalidOperationException("Khong tim thay skill.");
        }

        var usedByMembers = await dbContext.team_member_skills.AnyAsync(x => x.skill_id == skillId);
        if (usedByMembers)
        {
            throw new InvalidOperationException("Skill dang duoc gan cho team member, khong the xoa.");
        }

        var usedByIncidentRequirements = await dbContext.incident_requirement_skills.AnyAsync(x => x.skill_id == skillId);
        if (usedByIncidentRequirements)
        {
            throw new InvalidOperationException("Skill dang duoc su dung boi incident requirements, khong the xoa.");
        }

        dbContext.skills.Remove(skill);
        await dbContext.SaveChangesAsync();

        return new
        {
            id = skillId,
            deleted = true
        };
    }

    public async Task<object> ListTeamMemberSkills(Guid teamId, Guid memberId)
    {
        await EnsureTeamMemberExists(teamId, memberId);

        var items = await dbContext.team_member_skills
            .AsNoTracking()
            .Include(x => x.skill)
            .Where(x => x.team_member_id == memberId)
            .OrderBy(x => x.skill.code)
            .Select(x => new
            {
                id = x.id,
                teamMemberId = x.team_member_id,
                skill = new
                {
                    id = x.skill.id,
                    code = x.skill.code,
                    name = x.skill.name
                },
                levelCode = x.level_code,
                isPrimary = x.is_primary
            })
            .ToListAsync();

        return new { items };
    }

    public async Task<object> CreateTeamMemberSkill(Guid teamId, Guid memberId, CreateTeamMemberSkillRequest request)
    {
        await EnsureTeamMemberExists(teamId, memberId);
        await EnsureSkillExists(request.SkillId);

        var levelCode = NormalizeCode(request.LevelCode);
        ValidateSkillLevel(levelCode);

        var existed = await dbContext.team_member_skills
            .AnyAsync(x => x.team_member_id == memberId && x.skill_id == request.SkillId);

        if (existed)
        {
            throw new InvalidOperationException("Skill da ton tai tren team member.");
        }

        if (request.IsPrimary)
        {
            var existingPrimary = await dbContext.team_member_skills
                .Where(x => x.team_member_id == memberId && x.is_primary)
                .ToListAsync();

            foreach (var item in existingPrimary)
            {
                item.is_primary = false;
            }
        }

        var row = new team_member_skill
        {
            id = Guid.NewGuid(),
            team_member_id = memberId,
            skill_id = request.SkillId,
            level_code = levelCode,
            is_primary = request.IsPrimary
        };

        dbContext.team_member_skills.Add(row);
        await dbContext.SaveChangesAsync();

        return new
        {
            id = row.id,
            teamMemberId = memberId
        };
    }

    public async Task<object> UpdateTeamMemberSkill(Guid teamId, Guid memberId, Guid teamMemberSkillId, UpdateTeamMemberSkillRequest request)
    {
        await EnsureTeamMemberExists(teamId, memberId);
        await EnsureSkillExists(request.SkillId);

        var row = await dbContext.team_member_skills
            .FirstOrDefaultAsync(x => x.id == teamMemberSkillId && x.team_member_id == memberId);

        if (row is null)
        {
            throw new InvalidOperationException("Khong tim thay team member skill.");
        }

        var levelCode = NormalizeCode(request.LevelCode);
        ValidateSkillLevel(levelCode);

        var duplicate = await dbContext.team_member_skills
            .AnyAsync(x => x.id != teamMemberSkillId && x.team_member_id == memberId && x.skill_id == request.SkillId);
        if (duplicate)
        {
            throw new InvalidOperationException("Skill da ton tai tren team member.");
        }

        if (request.IsPrimary)
        {
            var existingPrimary = await dbContext.team_member_skills
                .Where(x => x.team_member_id == memberId && x.id != teamMemberSkillId && x.is_primary)
                .ToListAsync();

            foreach (var item in existingPrimary)
            {
                item.is_primary = false;
            }
        }

        row.skill_id = request.SkillId;
        row.level_code = levelCode;
        row.is_primary = request.IsPrimary;

        await dbContext.SaveChangesAsync();

        return new
        {
            id = row.id,
            updated = true
        };
    }

    public async Task<object> DeleteTeamMemberSkill(Guid teamId, Guid memberId, Guid teamMemberSkillId)
    {
        await EnsureTeamMemberExists(teamId, memberId);

        var row = await dbContext.team_member_skills
            .FirstOrDefaultAsync(x => x.id == teamMemberSkillId && x.team_member_id == memberId);

        if (row is null)
        {
            throw new InvalidOperationException("Khong tim thay team member skill.");
        }

        dbContext.team_member_skills.Remove(row);
        await dbContext.SaveChangesAsync();

        return new
        {
            id = teamMemberSkillId,
            deleted = true
        };
    }

    public async Task<object> ListVehicles(string? keyword, string? statusCode, Guid? teamId)
    {
        var query = dbContext.vehicles
            .AsNoTracking()
            .Include(x => x.vehicle_type)
            .Include(x => x.team)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var q = keyword.Trim();
            query = query.Where(x =>
                x.code.Contains(q) ||
                x.display_name.Contains(q) ||
                (x.plate_no != null && x.plate_no.Contains(q)));
        }

        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            var normalizedStatusCode = NormalizeCode(statusCode);
            query = query.Where(x => x.status_code == normalizedStatusCode);
        }

        if (teamId.HasValue)
        {
            query = query.Where(x => x.team_id == teamId.Value);
        }

        var items = await query
            .OrderBy(x => x.code)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                displayName = x.display_name,
                plateNo = x.plate_no,
                status = new { code = x.status_code, name = x.status_code, color = (string?)null },
                vehicleType = new { id = x.vehicle_type.id, code = x.vehicle_type.code, name = x.vehicle_type.name },
                team = x.team == null
                    ? null
                    : new { id = x.team.id, code = x.team.code, name = x.team.name },
                capacityPerson = x.capacity_person,
                capacityWeightKg = x.capacity_weight_kg,
                currentLocation = ToLocationItem(x.current_location),
                capabilityCount = x.vehicle_capabilities.Count,
                notes = x.notes,
                createdAt = x.created_at
            })
            .ToListAsync();

        return new { items };
    }

    public async Task<object> GetVehicleOptions()
    {
        var vehicleTypes = await dbContext.vehicle_types
            .AsNoTracking()
            .OrderBy(x => x.code)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                name = x.name,
                description = x.description
            })
            .ToListAsync();

        var capabilities = await dbContext.vehicle_capabilities
            .AsNoTracking()
            .OrderBy(x => x.code)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                name = x.name,
                description = x.description
            })
            .ToListAsync();

        var teams = await dbContext.teams
            .AsNoTracking()
            .OrderBy(x => x.code)
            .Select(x => new
            {
                id = x.id,
                code = x.code,
                name = x.name,
                statusCode = x.status_code
            })
            .ToListAsync();

        return new
        {
            vehicleTypes,
            capabilities,
            teams,
            vehicleStatusCodes = VehicleStatusCodes.Select(ToCodeItem).ToArray()
        };
    }

    public async Task<object> GetVehicle(Guid vehicleId)
    {
        var vehicle = await dbContext.vehicles
            .AsNoTracking()
            .Include(x => x.vehicle_type)
            .Include(x => x.team)
            .Include(x => x.vehicle_capabilities)
            .FirstOrDefaultAsync(x => x.id == vehicleId);

        if (vehicle is null)
        {
            throw new InvalidOperationException("Khong tim thay vehicle.");
        }

        return new
        {
            id = vehicle.id,
            code = vehicle.code,
            displayName = vehicle.display_name,
            plateNo = vehicle.plate_no,
            status = new { code = vehicle.status_code, name = vehicle.status_code, color = (string?)null },
            vehicleType = new { id = vehicle.vehicle_type.id, code = vehicle.vehicle_type.code, name = vehicle.vehicle_type.name },
            team = vehicle.team == null
                ? null
                : new { id = vehicle.team.id, code = vehicle.team.code, name = vehicle.team.name },
            capacityPerson = vehicle.capacity_person,
            capacityWeightKg = vehicle.capacity_weight_kg,
            currentLocation = ToLocationItem(vehicle.current_location),
            capabilities = vehicle.vehicle_capabilities
                .OrderBy(x => x.code)
                .Select(x => new { id = x.id, code = x.code, name = x.name })
                .ToList(),
            notes = vehicle.notes,
            createdAt = vehicle.created_at
        };
    }

    public async Task<object> CreateVehicle(CreateVehicleRequest request)
    {
        var code = NormalizeCode(request.Code);
        var displayName = NormalizeRequired(request.DisplayName, "DisplayName");
        var statusCode = NormalizeCode(request.StatusCode);
        ValidateVehicleStatus(statusCode);

        if (request.CapacityPerson < 0)
        {
            throw new InvalidOperationException("CapacityPerson khong hop le.");
        }

        if (request.CapacityWeightKg < 0)
        {
            throw new InvalidOperationException("CapacityWeightKg khong hop le.");
        }

        var codeExists = await dbContext.vehicles.AnyAsync(x => x.code == code);
        if (codeExists)
        {
            throw new InvalidOperationException($"Ma vehicle da ton tai: {code}");
        }

        await EnsureVehicleTypeExists(request.VehicleTypeId);
        await EnsureTeamExistsOptional(request.TeamId);

        var vehicle = new vehicle
        {
            id = Guid.NewGuid(),
            code = code,
            vehicle_type_id = request.VehicleTypeId,
            display_name = displayName,
            plate_no = NormalizeOptional(request.PlateNo),
            team_id = request.TeamId,
            status_code = statusCode,
            capacity_person = request.CapacityPerson,
            capacity_weight_kg = request.CapacityWeightKg,
            current_location = ToPointOrNull(request.CurrentLocation),
            notes = NormalizeOptional(request.Notes),
            created_at = DateTime.UtcNow
        };

        dbContext.vehicles.Add(vehicle);
        await AssignVehicleCapabilities(vehicle, request.CapabilityIds);
        await dbContext.SaveChangesAsync();

        return new
        {
            id = vehicle.id,
            code = vehicle.code,
            createdAt = vehicle.created_at
        };
    }

    public async Task<object> UpdateVehicle(Guid vehicleId, UpdateVehicleRequest request)
    {
        var vehicle = await dbContext.vehicles
            .Include(x => x.vehicle_capabilities)
            .FirstOrDefaultAsync(x => x.id == vehicleId);

        if (vehicle is null)
        {
            throw new InvalidOperationException("Khong tim thay vehicle.");
        }

        var code = NormalizeCode(request.Code);
        var displayName = NormalizeRequired(request.DisplayName, "DisplayName");
        var statusCode = NormalizeCode(request.StatusCode);
        ValidateVehicleStatus(statusCode);

        if (request.CapacityPerson < 0)
        {
            throw new InvalidOperationException("CapacityPerson khong hop le.");
        }

        if (request.CapacityWeightKg < 0)
        {
            throw new InvalidOperationException("CapacityWeightKg khong hop le.");
        }

        var codeExists = await dbContext.vehicles.AnyAsync(x => x.id != vehicleId && x.code == code);
        if (codeExists)
        {
            throw new InvalidOperationException($"Ma vehicle da ton tai: {code}");
        }

        await EnsureVehicleTypeExists(request.VehicleTypeId);
        await EnsureTeamExistsOptional(request.TeamId);

        vehicle.code = code;
        vehicle.vehicle_type_id = request.VehicleTypeId;
        vehicle.display_name = displayName;
        vehicle.plate_no = NormalizeOptional(request.PlateNo);
        vehicle.team_id = request.TeamId;
        vehicle.status_code = statusCode;
        vehicle.capacity_person = request.CapacityPerson;
        vehicle.capacity_weight_kg = request.CapacityWeightKg;
        vehicle.current_location = ToPointOrNull(request.CurrentLocation);
        vehicle.notes = NormalizeOptional(request.Notes);

        await AssignVehicleCapabilities(vehicle, request.CapabilityIds);
        await dbContext.SaveChangesAsync();

        return new
        {
            id = vehicle.id,
            updated = true
        };
    }

    public async Task<object> DeleteVehicle(Guid vehicleId)
    {
        var vehicle = await dbContext.vehicles
            .Include(x => x.vehicle_capabilities)
            .FirstOrDefaultAsync(x => x.id == vehicleId);

        if (vehicle is null)
        {
            throw new InvalidOperationException("Khong tim thay vehicle.");
        }

        var hasMissionHistory = await dbContext.mission_vehicles.AnyAsync(x => x.vehicle_id == vehicleId);
        if (hasMissionHistory)
        {
            throw new InvalidOperationException("Vehicle da duoc gan vao mission, khong the xoa.");
        }

        vehicle.vehicle_capabilities.Clear();
        dbContext.vehicles.Remove(vehicle);
        await dbContext.SaveChangesAsync();

        return new
        {
            id = vehicleId,
            deleted = true
        };
    }

    private async Task EnsureTeamExists(Guid teamId)
    {
        var exists = await dbContext.teams.AnyAsync(x => x.id == teamId);
        if (!exists)
        {
            throw new InvalidOperationException("Khong tim thay team.");
        }
    }

    private async Task EnsureTeamMemberExists(Guid teamId, Guid memberId)
    {
        var exists = await dbContext.team_members.AnyAsync(x => x.id == memberId && x.team_id == teamId);
        if (!exists)
        {
            throw new InvalidOperationException("Khong tim thay thanh vien team.");
        }
    }

    private async Task EnsureSkillExists(Guid skillId)
    {
        var exists = await dbContext.skills.AnyAsync(x => x.id == skillId);
        if (!exists)
        {
            throw new InvalidOperationException("Khong tim thay skill.");
        }
    }

    private async Task EnsureVehicleTypeExists(Guid vehicleTypeId)
    {
        var exists = await dbContext.vehicle_types.AnyAsync(x => x.id == vehicleTypeId);
        if (!exists)
        {
            throw new InvalidOperationException($"Khong tim thay vehicle type: {vehicleTypeId}");
        }
    }

    private async Task EnsureTeamExistsOptional(Guid? teamId)
    {
        if (!teamId.HasValue)
        {
            return;
        }

        var exists = await dbContext.teams.AnyAsync(x => x.id == teamId.Value);
        if (!exists)
        {
            throw new InvalidOperationException($"Khong tim thay team: {teamId}");
        }
    }

    private async Task AssignVehicleCapabilities(vehicle vehicle, IReadOnlyCollection<Guid>? capabilityIds)
    {
        vehicle.vehicle_capabilities.Clear();

        if (capabilityIds is not { Count: > 0 })
        {
            return;
        }

        var distinctIds = capabilityIds.Distinct().ToArray();
        var capabilities = await dbContext.vehicle_capabilities
            .Where(x => distinctIds.Contains(x.id))
            .ToListAsync();

        if (capabilities.Count != distinctIds.Length)
        {
            throw new InvalidOperationException("Co vehicle capability khong hop le.");
        }

        foreach (var capability in capabilities)
        {
            vehicle.vehicle_capabilities.Add(capability);
        }
    }

    private async Task EnsureLeaderUserExists(Guid? userId)
    {
        if (!userId.HasValue)
        {
            return;
        }

        var exists = await dbContext.app_users.AnyAsync(x => x.id == userId);
        if (!exists)
        {
            throw new InvalidOperationException($"Khong tim thay user: {userId}");
        }
    }

    private async Task EnsureAdminAreaExists(Guid? adminAreaId)
    {
        if (!adminAreaId.HasValue)
        {
            return;
        }

        var exists = await dbContext.admin_areas.AnyAsync(x => x.id == adminAreaId);
        if (!exists)
        {
            throw new InvalidOperationException($"Khong tim thay admin area: {adminAreaId}");
        }
    }

    private async Task<Guid?> ResolveAdminAreaIdFromLocation(GeoPointRequest? location)
    {
        var point = ToPointOrNull(location);
        if (point is null)
        {
            return null;
        }

        var areas = await dbContext.admin_areas
            .AsNoTracking()
            .Where(x => x.geom != null && x.geom.Contains(point))
            .Select(x => new { x.id, x.level_code })
            .ToListAsync();

        return areas
            .OrderBy(x => AdminAreaPriority(x.level_code))
            .Select(x => (Guid?)x.id)
            .FirstOrDefault();
    }

    private async Task EnsureAppUserExists(Guid? userId)
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

    private async Task ClearOtherTeamLeaders(Guid teamId, Guid excludeMemberId)
    {
        var otherLeaders = await dbContext.team_members
            .Where(x => x.team_id == teamId && x.id != excludeMemberId && x.is_team_leader)
            .ToListAsync();

        foreach (var otherLeader in otherLeaders)
        {
            otherLeader.is_team_leader = false;
        }
    }

    private static string NormalizeRequired(string? input, string fieldName)
    {
        var value = NormalizeOptional(input);
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"{fieldName} la bat buoc.");
        }

        return value;
    }

    private static string? NormalizeOptional(string? input)
        => string.IsNullOrWhiteSpace(input) ? null : input.Trim();

    private static string NormalizeCode(string? input)
        => NormalizeRequired(input, "Code").ToUpperInvariant();

    private static string ResolveNameOrFallback(string? name, string fallbackCode)
    {
        var normalizedName = NormalizeOptional(name);
        return string.IsNullOrWhiteSpace(normalizedName) ? fallbackCode : normalizedName;
    }

    private static Point? ToPointOrNull(GeoPointRequest? location)
    {
        if (location is null)
        {
            return null;
        }

        if (location.Lat < -90 || location.Lat > 90)
        {
            throw new InvalidOperationException("Lat khong hop le.");
        }

        if (location.Lng < -180 || location.Lng > 180)
        {
            throw new InvalidOperationException("Lng khong hop le.");
        }

        return new Point((double)location.Lng, (double)location.Lat) { SRID = 4326 };
    }

    private static object? ToLocationItem(Point? point)
        => point == null
            ? null
            : new
            {
                lat = (decimal)point.Y,
                lng = (decimal)point.X
            };

    private static object ToCodeItem(string code)
        => new { code, name = code, color = (string?)null };

    private static string? MergeTeamNotes(string homeAddress, string? notes)
    {
        var normalizedNote = NormalizeOptional(notes);
        return string.IsNullOrWhiteSpace(normalizedNote)
            ? $"HOME_ADDRESS:{homeAddress}"
            : $"HOME_ADDRESS:{homeAddress}; {normalizedNote}";
    }

    private static void ValidateTeamStatus(string code)
    {
        if (!TeamStatusCodes.Contains(code))
        {
            throw new InvalidOperationException($"Status team khong hop le: {code}");
        }
    }

    private static void ValidateTeamMemberStatus(string code)
    {
        if (!TeamMemberStatusCodes.Contains(code))
        {
            throw new InvalidOperationException($"Status team member khong hop le: {code}");
        }
    }

    private static void ValidateSkillLevel(string code)
    {
        if (!SkillLevelCodes.Contains(code))
        {
            throw new InvalidOperationException($"Skill level khong hop le: {code}");
        }
    }

    private static void ValidateVehicleStatus(string code)
    {
        if (!VehicleStatusCodes.Contains(code))
        {
            throw new InvalidOperationException($"Status vehicle khong hop le: {code}");
        }
    }

    private static int AdminAreaPriority(string? levelCode)
        => levelCode?.ToUpperInvariant() switch
        {
            "WARD" => 0,
            "DISTRICT" => 1,
            "PROVINCE" => 2,
            _ => 3
        };
}
