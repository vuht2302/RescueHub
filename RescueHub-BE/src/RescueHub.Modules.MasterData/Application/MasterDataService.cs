using Microsoft.EntityFrameworkCore;
using RescueHub.BuildingBlocks.Application;
using RescueHub.Persistence;

namespace RescueHub.Modules.MasterData.Application;

public sealed class MasterDataService(RescueHubDbContext dbContext) : IMasterDataService
{
    public async Task<object> GetBootstrap()
    {
        var incidentTypes = await dbContext.incidents
            .AsNoTracking()
            .Select(x => x.incident_type_code)
            .Distinct()
            .OrderBy(x => x)
            .Select(x => new { code = x, name = x })
            .ToListAsync();

        var channels = await dbContext.incidents
            .AsNoTracking()
            .Select(x => x.incident_channel_code)
            .Distinct()
            .OrderBy(x => x)
            .Select(x => new { code = x, name = x })
            .ToListAsync();

        var priorityLevels = await dbContext.incidents
            .AsNoTracking()
            .Select(x => x.priority_code)
            .Distinct()
            .OrderBy(x => x)
            .Select(x => new { code = x, name = x, color = (string?)null })
            .ToListAsync();

        var severityLevels = await dbContext.incident_assessments
            .AsNoTracking()
            .Select(x => x.severity_code)
            .Distinct()
            .OrderBy(x => x)
            .Select(x => new { code = x, name = x, color = (string?)null })
            .ToListAsync();

        var skills = await dbContext.skills
            .AsNoTracking()
            .OrderBy(x => x.name)
            .Select(x => new { code = x.code, name = x.name })
            .ToListAsync();

        var skillLevels = await dbContext.team_member_skills
            .AsNoTracking()
            .Select(x => x.level_code)
            .Concat(dbContext.incident_requirement_skills.AsNoTracking().Select(x => x.level_code))
            .Distinct()
            .OrderBy(x => x)
            .Select(x => new { code = x, name = x })
            .ToListAsync();

        var vehicleTypes = await dbContext.vehicle_types
            .AsNoTracking()
            .OrderBy(x => x.name)
            .Select(x => new { code = x.code, name = x.name })
            .ToListAsync();

        var vehicleCapabilities = await dbContext.vehicle_capabilities
            .AsNoTracking()
            .OrderBy(x => x.name)
            .Select(x => new { code = x.code, name = x.name })
            .ToListAsync();

        var warehouseTypes = await dbContext.warehouses
            .AsNoTracking()
            .Select(x => x.status_code)
            .Distinct()
            .OrderBy(x => x)
            .Select(x => new { code = x, name = x })
            .ToListAsync();

        var units = await dbContext.items
            .AsNoTracking()
            .Select(x => x.unit_code)
            .Distinct()
            .OrderBy(x => x)
            .Select(x => new { code = x, name = x })
            .ToListAsync();

        var sceneFactors = FloodSceneFactorCatalog.Definitions
            .Select(x => new
            {
                code = x.Code,
                name = x.Name,
                valueType = x.ValueType,
                unitCode = x.UnitCode,
                sortOrder = x.SortOrder
            })
            .ToArray();

        return new
        {
            incidentTypes,
            channels,
            priorityLevels,
            severityLevels,
            skills,
            skillLevels,
            vehicleTypes,
            vehicleCapabilities,
            warehouseTypes,
            units,
            sceneFactors
        };
    }

    public Task<object> GetSceneFactors()
    {
        var items = FloodSceneFactorCatalog.Definitions
            .Select(x => new
            {
                code = x.Code,
                name = x.Name,
                valueType = x.ValueType,
                unitCode = x.UnitCode,
                sortOrder = x.SortOrder
            })
            .ToArray();

        return Task.FromResult<object>(new { items });
    }

    public async Task<object> GetWorkflow(string entityType)
    {
        var normalized = entityType.Trim().ToUpperInvariant();

        List<string> stateCodes;
        object transitions;

        if (normalized is "INCIDENT" or "SU_CO")
        {
            stateCodes = await dbContext.incidents
                .AsNoTracking()
                .Select(x => x.status_code)
                .Concat(dbContext.incident_status_histories.AsNoTracking().Select(x => x.to_status_code))
                .Concat(dbContext.incident_status_histories.AsNoTracking().Where(x => x.from_status_code != null).Select(x => x.from_status_code!))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            transitions = await dbContext.incident_status_histories
                .AsNoTracking()
                .Where(x => x.action_code != null)
                .GroupBy(x => new { x.action_code, x.from_status_code, x.to_status_code })
                .OrderByDescending(g => g.Count())
                .Select(g => new
                {
                    actionCode = g.Key.action_code,
                    actionName = g.Key.action_code,
                    fromStateCode = g.Key.from_status_code,
                    toStateCode = g.Key.to_status_code,
                    requiresReason = false,
                    requiresNote = false
                })
                .ToListAsync();
        }
        else if (normalized is "MISSION" or "NHIEM_VU")
        {
            stateCodes = await dbContext.missions
                .AsNoTracking()
                .Select(x => x.status_code)
                .Concat(dbContext.mission_status_histories.AsNoTracking().Select(x => x.to_status_code))
                .Concat(dbContext.mission_status_histories.AsNoTracking().Where(x => x.from_status_code != null).Select(x => x.from_status_code!))
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            transitions = await dbContext.mission_status_histories
                .AsNoTracking()
                .Where(x => x.action_code != null)
                .GroupBy(x => new { x.action_code, x.from_status_code, x.to_status_code })
                .OrderByDescending(g => g.Count())
                .Select(g => new
                {
                    actionCode = g.Key.action_code,
                    actionName = g.Key.action_code,
                    fromStateCode = g.Key.from_status_code,
                    toStateCode = g.Key.to_status_code,
                    requiresReason = false,
                    requiresNote = false
                })
                .ToListAsync();
        }
        else
        {
            throw new InvalidOperationException("Khong tim thay workflow process theo entity type.");
        }

        var orderedStateCodes = stateCodes
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(x => x)
            .ToArray();

        var states = orderedStateCodes
            .Select((code, index) => new
            {
                code,
                name = code,
                category = (code.Contains("RESOLVED", StringComparison.OrdinalIgnoreCase)
                            || code.Contains("CLOSED", StringComparison.OrdinalIgnoreCase)
                            || code.Contains("COMPLETED", StringComparison.OrdinalIgnoreCase)
                            || code.Contains("CANCELLED", StringComparison.OrdinalIgnoreCase))
                    ? "CLOSED"
                    : "OPEN",
                sortOrder = index + 1,
                isInitial = index == 0,
                isTerminal = code.Contains("RESOLVED", StringComparison.OrdinalIgnoreCase)
                    || code.Contains("CLOSED", StringComparison.OrdinalIgnoreCase)
                    || code.Contains("COMPLETED", StringComparison.OrdinalIgnoreCase)
                    || code.Contains("CANCELLED", StringComparison.OrdinalIgnoreCase),
                color = (string?)null
            })
            .ToArray();

        return new { entityType = normalized, states, transitions };
    }
}
