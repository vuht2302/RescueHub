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
        await EnsureAdminAreaExists(request.HomeAdminAreaId);

        var now = DateTime.UtcNow;
        var team = new team
        {
            id = Guid.NewGuid(),
            code = normalizedCode,
            name = normalizedName,
            leader_user_id = request.LeaderUserId,
            home_admin_area_id = request.HomeAdminAreaId,
            status_code = normalizedStatusCode,
            max_parallel_missions = maxParallelMissions,
            current_location = ToPointOrNull(request.CurrentLocation),
            notes = NormalizeOptional(request.Notes),
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
}
