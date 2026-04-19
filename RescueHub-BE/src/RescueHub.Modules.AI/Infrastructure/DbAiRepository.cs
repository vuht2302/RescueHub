using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RescueHub.Persistence;
using RescueHub.Persistence.Entities.Scaffolded;

namespace RescueHub.Modules.AI.Infrastructure;

public sealed class DbAiRepository(RescueHubDbContext dbContext, IGenerativeAiClient generativeAiClient) : IAiRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly TimeSpan ReuseWindow = TimeSpan.FromMinutes(5);

    public async Task<object> AnalyzeIncident(
        Guid incidentId,
        bool includeDispatchRecommendation,
        bool includeDedupe,
        Guid? requestedByUserId,
        CancellationToken cancellationToken)
    {
        var triage = await RunOnDemandJob(
            "INCIDENT_TRIAGE",
            "INCIDENT",
            incidentId,
            new { incidentId, jobTypeCode = "INCIDENT_TRIAGE" },
            requestedByUserId,
            cancellationToken);

        object? dispatchRecommendation = null;
        if (includeDispatchRecommendation)
        {
            dispatchRecommendation = await RunOnDemandJob(
                "DISPATCH_RECOMMENDATION",
                "INCIDENT",
                incidentId,
                new { incidentId, jobTypeCode = "DISPATCH_RECOMMENDATION" },
                requestedByUserId,
                cancellationToken);
        }

        object? dedupe = null;
        if (includeDedupe)
        {
            dedupe = await RunOnDemandJob(
                "INCIDENT_DEDUPE",
                "INCIDENT",
                incidentId,
                new { incidentId, jobTypeCode = "INCIDENT_DEDUPE" },
                requestedByUserId,
                cancellationToken);
        }

        var pendingSuggestions = await dbContext.ai_suggestions
            .AsNoTracking()
            .Include(x => x.ai_job)
            .Where(x => x.target_entity_type_code == "INCIDENT" && x.target_entity_id == incidentId && x.approval_status_code == "PENDING")
            .OrderByDescending(x => x.created_at)
            .Select(x => new
            {
                suggestionId = x.id,
                jobId = x.ai_job_id,
                jobTypeCode = x.ai_job.job_type_code,
                suggestionTypeCode = x.suggestion_type_code,
                payload = DeserializeJson(x.payload_json),
                confidenceScore = x.confidence_score,
                createdAt = x.created_at
            })
            .ToListAsync(cancellationToken);

        return new
        {
            targetEntityTypeCode = "INCIDENT",
            targetEntityId = incidentId,
            analyzedAt = DateTime.UtcNow,
            jobs = new
            {
                triage,
                dispatchRecommendation,
                dedupe
            },
            pendingSuggestions
        };
    }

    public async Task<object> AnalyzeReliefCampaign(Guid reliefCampaignId, Guid? requestedByUserId, CancellationToken cancellationToken)
    {
        var forecast = await RunOnDemandJob(
            "RELIEF_FORECAST",
            "RELIEF_CAMPAIGN",
            reliefCampaignId,
            new { reliefCampaignId, jobTypeCode = "RELIEF_FORECAST" },
            requestedByUserId,
            cancellationToken);

        var pendingSuggestions = await dbContext.ai_suggestions
            .AsNoTracking()
            .Include(x => x.ai_job)
            .Where(x => x.target_entity_type_code == "RELIEF_CAMPAIGN" && x.target_entity_id == reliefCampaignId && x.approval_status_code == "PENDING")
            .OrderByDescending(x => x.created_at)
            .Select(x => new
            {
                suggestionId = x.id,
                jobId = x.ai_job_id,
                jobTypeCode = x.ai_job.job_type_code,
                suggestionTypeCode = x.suggestion_type_code,
                payload = DeserializeJson(x.payload_json),
                confidenceScore = x.confidence_score,
                createdAt = x.created_at
            })
            .ToListAsync(cancellationToken);

        return new
        {
            targetEntityTypeCode = "RELIEF_CAMPAIGN",
            targetEntityId = reliefCampaignId,
            analyzedAt = DateTime.UtcNow,
            jobs = new
            {
                forecast
            },
            pendingSuggestions
        };
    }

    public async Task<object> ListSuggestions(
        string? targetEntityTypeCode,
        Guid? targetEntityId,
        string? approvalStatusCode,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var normalizedEntityType = NormalizeUpper(targetEntityTypeCode);
        var normalizedStatus = NormalizeUpper(approvalStatusCode);
        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var query = dbContext.ai_suggestions
            .AsNoTracking()
            .Include(x => x.ai_job)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(normalizedEntityType))
        {
            query = query.Where(x => x.target_entity_type_code == normalizedEntityType);
        }

        if (targetEntityId.HasValue)
        {
            query = query.Where(x => x.target_entity_id == targetEntityId.Value);
        }

        if (!string.IsNullOrWhiteSpace(normalizedStatus))
        {
            query = query.Where(x => x.approval_status_code == normalizedStatus);
        }

        var total = await query.CountAsync(cancellationToken);

        var rows = await query
            .OrderByDescending(x => x.created_at)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        var items = rows.Select(x => new
        {
            suggestionId = x.id,
            jobId = x.ai_job_id,
            jobTypeCode = x.ai_job.job_type_code,
            suggestionTypeCode = x.suggestion_type_code,
            targetEntityTypeCode = x.target_entity_type_code,
            targetEntityId = x.target_entity_id,
            payload = DeserializeJson(x.payload_json),
            confidenceScore = x.confidence_score,
            approvalStatusCode = x.approval_status_code,
            approvedByUserId = x.approved_by_user_id,
            approvedAt = x.approved_at,
            createdAt = x.created_at
        });

        return new
        {
            page = safePage,
            pageSize = safePageSize,
            total,
            items
        };
    }

    public async Task<object> ApproveSuggestion(Guid suggestionId, Guid? approvedByUserId, CancellationToken cancellationToken)
    {
        var suggestion = await dbContext.ai_suggestions
            .FirstOrDefaultAsync(x => x.id == suggestionId, cancellationToken)
            ?? throw new InvalidOperationException("Khong tim thay AI suggestion.");

        if (suggestion.approval_status_code != "PENDING")
        {
            throw new InvalidOperationException("AI suggestion da duoc xu ly truoc do.");
        }

        var now = DateTime.UtcNow;
        suggestion.approval_status_code = "APPROVED";
        suggestion.approved_by_user_id = approvedByUserId;
        suggestion.approved_at = now;

        await ApplySuggestionSideEffects(suggestion, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new
        {
            suggestionId = suggestion.id,
            approvalStatusCode = suggestion.approval_status_code,
            approvedByUserId = suggestion.approved_by_user_id,
            approvedAt = suggestion.approved_at
        };
    }

    public async Task<object> IgnoreSuggestion(Guid suggestionId, Guid? ignoredByUserId, CancellationToken cancellationToken)
    {
        var suggestion = await dbContext.ai_suggestions
            .FirstOrDefaultAsync(x => x.id == suggestionId, cancellationToken)
            ?? throw new InvalidOperationException("Khong tim thay AI suggestion.");

        if (suggestion.approval_status_code != "PENDING")
        {
            throw new InvalidOperationException("AI suggestion da duoc xu ly truoc do.");
        }

        suggestion.approval_status_code = "IGNORED";
        suggestion.approved_by_user_id = ignoredByUserId;
        suggestion.approved_at = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return new
        {
            suggestionId = suggestion.id,
            approvalStatusCode = suggestion.approval_status_code,
            ignoredByUserId = ignoredByUserId,
            ignoredAt = suggestion.approved_at
        };
    }

    private async Task<object> RunOnDemandJob(
        string jobTypeCode,
        string targetEntityTypeCode,
        Guid targetEntityId,
        object inputPayload,
        Guid? requestedByUserId,
        CancellationToken cancellationToken)
    {
        await ValidateTarget(jobTypeCode, targetEntityId, cancellationToken);

        var reuseCutoff = DateTime.UtcNow.Subtract(ReuseWindow);
        var reusedJobId = await dbContext.ai_jobs
            .AsNoTracking()
            .Where(x =>
                x.job_type_code == jobTypeCode &&
                x.target_entity_type_code == targetEntityTypeCode &&
                x.target_entity_id == targetEntityId &&
                x.status_code == "COMPLETED" &&
                x.completed_at.HasValue &&
                x.completed_at.Value >= reuseCutoff)
            .OrderByDescending(x => x.completed_at)
            .Select(x => (Guid?)x.id)
            .FirstOrDefaultAsync(cancellationToken);

        if (reusedJobId.HasValue)
        {
            return await BuildJobResult(reusedJobId.Value, reused: true, cancellationToken);
        }

        var job = new ai_job
        {
            id = Guid.NewGuid(),
            job_type_code = jobTypeCode,
            target_entity_type_code = targetEntityTypeCode,
            target_entity_id = targetEntityId,
            status_code = "PENDING",
            requested_by_user_id = requestedByUserId,
            requested_at = DateTime.UtcNow,
            input_payload = JsonSerializer.Serialize(inputPayload, JsonOptions)
        };

        dbContext.ai_jobs.Add(job);
        await dbContext.SaveChangesAsync(cancellationToken);

        await ProcessSingleJob(job, cancellationToken);
        return await BuildJobResult(job.id, reused: false, cancellationToken);
    }

    private async Task<object> BuildJobResult(Guid jobId, bool reused, CancellationToken cancellationToken)
    {
        var job = await dbContext.ai_jobs
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.id == jobId, cancellationToken)
            ?? throw new InvalidOperationException("Khong tim thay AI job.");

        var suggestionCount = await dbContext.ai_suggestions
            .AsNoTracking()
            .CountAsync(x => x.ai_job_id == jobId, cancellationToken);

        return new
        {
            jobId = job.id,
            reused,
            jobTypeCode = job.job_type_code,
            targetEntityTypeCode = job.target_entity_type_code,
            targetEntityId = job.target_entity_id,
            status = job.status_code,
            requestedAt = job.requested_at,
            startedAt = job.started_at,
            completedAt = job.completed_at,
            inputPayload = DeserializeJson(job.input_payload),
            outputPayload = DeserializeJson(job.output_payload),
            errorMessage = job.error_message,
            suggestionCount
        };
    }

    private async Task ProcessSingleJob(ai_job job, CancellationToken cancellationToken)
    {
        job.status_code = "PROCESSING";
        job.started_at = DateTime.UtcNow;
        job.error_message = null;
        await dbContext.SaveChangesAsync(cancellationToken);

        try
        {
            var execution = job.job_type_code switch
            {
                "INCIDENT_TRIAGE" => await ExecuteIncidentTriage(job.target_entity_id, cancellationToken),
                "DISPATCH_RECOMMENDATION" => await ExecuteDispatchRecommendation(job.target_entity_id, cancellationToken),
                "INCIDENT_DEDUPE" => await ExecuteIncidentDedupe(job.target_entity_id, cancellationToken),
                "RELIEF_FORECAST" => await ExecuteReliefForecast(job.target_entity_id, cancellationToken),
                _ => throw new InvalidOperationException($"Khong ho tro jobTypeCode {job.job_type_code}.")
            };

            job.status_code = "COMPLETED";
            job.output_payload = JsonSerializer.Serialize(execution.OutputPayload, JsonOptions);
            job.completed_at = DateTime.UtcNow;

            if (execution.Suggestions.Count > 0)
            {
                var suggestions = execution.Suggestions.Select(x => new ai_suggestion
                {
                    id = Guid.NewGuid(),
                    ai_job_id = job.id,
                    suggestion_type_code = x.SuggestionTypeCode,
                    target_entity_type_code = job.target_entity_type_code,
                    target_entity_id = job.target_entity_id,
                    payload_json = JsonSerializer.Serialize(x.Payload, JsonOptions),
                    confidence_score = x.ConfidenceScore,
                    approval_status_code = "PENDING",
                    created_at = DateTime.UtcNow
                });

                dbContext.ai_suggestions.AddRange(suggestions);
            }

            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            job.status_code = "FAILED";
            job.error_message = ex.Message;
            job.completed_at = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task<JobExecutionResult> ExecuteIncidentTriage(Guid incidentId, CancellationToken cancellationToken)
    {
        var incident = await dbContext.incidents
            .Include(x => x.incident_location)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.id == incidentId, cancellationToken)
            ?? throw new InvalidOperationException("Khong tim thay incident de phan tich AI.");

        var floodDepth = incident.incident_location?.flood_depth_m ?? 0m;
        var severityScore =
            incident.estimated_victim_count * 1.0m +
            incident.estimated_injured_count * 2.5m +
            incident.estimated_vulnerable_count * 1.5m +
            (incident.is_sos ? 5m : 0m) +
            floodDepth * 4m;

        var priority = severityScore switch
        {
            >= 20m => "CRITICAL",
            >= 12m => "HIGH",
            >= 6m => "MEDIUM",
            _ => "LOW"
        };

        var fallbackSummary =
            $"{incident.description}. Uoc tinh {incident.estimated_victim_count} nguoi mac ket, " +
            $"{incident.estimated_injured_count} nguoi bi thuong, {incident.estimated_vulnerable_count} doi tuong de bi ton thuong.";

        var fallbackConfidence = DecimalMin(0.99m, 0.65m + (severityScore / 40m));

        var triageAi = await generativeAiClient.GenerateIncidentTriageAsync(
            new IncidentTriageAiInput(
                incident.code,
                incident.description,
                incident.estimated_victim_count,
                incident.estimated_injured_count,
                incident.estimated_vulnerable_count,
                floodDepth,
                incident.is_sos),
            cancellationToken);

        var summary = string.IsNullOrWhiteSpace(triageAi.Summary) ? fallbackSummary : triageAi.Summary;
        priority = IsIncidentPriority(triageAi.PriorityCode) ? triageAi.PriorityCode : priority;
        var confidence = triageAi.Confidence > 0 ? triageAi.Confidence : fallbackConfidence;

        return new JobExecutionResult(
            new
            {
                incidentCode = incident.code,
                summary,
                priority,
                severityScore
            },
            [
                new SuggestionDraft(
                    "SUMMARY",
                    new { summary },
                    confidence),
                new SuggestionDraft(
                    "PRIORITY",
                    new
                    {
                        priorityCode = priority,
                        severityScore,
                        factors = new[]
                        {
                            $"victims:{incident.estimated_victim_count}",
                            $"injured:{incident.estimated_injured_count}",
                            $"vulnerable:{incident.estimated_vulnerable_count}",
                            $"isSos:{incident.is_sos}",
                            $"floodDepth:{floodDepth}"
                        }
                    },
                    confidence)
            ]);
    }

    private async Task<JobExecutionResult> ExecuteDispatchRecommendation(Guid incidentId, CancellationToken cancellationToken)
    {
        var incident = await dbContext.incidents
            .Include(x => x.incident_location)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.id == incidentId, cancellationToken)
            ?? throw new InvalidOperationException("Khong tim thay incident de de xuat dieu phoi.");

        var incidentLat = incident.incident_location?.lat;
        var incidentLng = incident.incident_location?.lng;

        var activeMissionCounts = await dbContext.mission_teams
            .AsNoTracking()
            .Where(x => x.mission.status_code != "COMPLETED" && x.mission.status_code != "ABORTED" && x.mission.status_code != "REJECTED")
            .GroupBy(x => x.team_id)
            .Select(x => new { TeamId = x.Key, Count = x.Count() })
            .ToDictionaryAsync(x => x.TeamId, x => x.Count, cancellationToken);

        var teamRows = await dbContext.teams
            .AsNoTracking()
            .Where(x => x.status_code == "AVAILABLE" || x.status_code == "BUSY")
            .Select(x => new
            {
                x.id,
                x.code,
                x.name,
                x.status_code,
                x.max_parallel_missions,
                Lat = x.current_location != null ? (double?)x.current_location.Y : null,
                Lng = x.current_location != null ? (double?)x.current_location.X : null
            })
            .ToListAsync(cancellationToken);

        var rankedTeams = teamRows
            .Select(x =>
            {
                var active = activeMissionCounts.TryGetValue(x.id, out var count) ? count : 0;
                var slots = Math.Max(0, x.max_parallel_missions - active);
                var distanceKm = ComputeDistanceKm((double?)incidentLat, (double?)incidentLng, x.Lat, x.Lng);
                var availabilityScore = x.status_code == "AVAILABLE" ? 0.4m : 0.2m;
                var score = availabilityScore + (decimal)(1d / (1d + distanceKm)) * 0.35m + (slots / (decimal)Math.Max(1, x.max_parallel_missions)) * 0.25m;

                return new
                {
                    teamId = x.id,
                    teamCode = x.code,
                    teamName = x.name,
                    statusCode = x.status_code,
                    activeMissions = active,
                    maxParallelMissions = x.max_parallel_missions,
                    availableSlots = slots,
                    distanceKm = Math.Round(distanceKm, 2),
                    score = Math.Round(score, 4)
                };
            })
            .OrderByDescending(x => x.score)
            .ThenBy(x => x.distanceKm)
            .Take(5)
            .ToList();

        var vehicleRows = await dbContext.vehicles
            .AsNoTracking()
            .Include(x => x.vehicle_type)
            .Include(x => x.vehicle_capabilities)
            .Where(x => x.status_code == "AVAILABLE" || x.status_code == "IN_USE")
            .Select(x => new
            {
                x.id,
                x.code,
                displayName = x.display_name,
                typeCode = x.vehicle_type.code,
                x.status_code,
                x.capacity_person,
                x.capacity_weight_kg,
                teamId = x.team_id,
                Lat = x.current_location != null ? (double?)x.current_location.Y : null,
                Lng = x.current_location != null ? (double?)x.current_location.X : null,
                capabilities = x.vehicle_capabilities.Select(c => c.code).ToList()
            })
            .ToListAsync(cancellationToken);

        var rankedVehicles = vehicleRows
            .Select(x =>
            {
                var distanceKm = ComputeDistanceKm((double?)incidentLat, (double?)incidentLng, x.Lat, x.Lng);
                var statusScore = x.status_code == "AVAILABLE" ? 0.45m : 0.2m;
                var capacityScore = DecimalMin(0.35m, (x.capacity_person / 25m) + (x.capacity_weight_kg / 2000m));
                var proximityScore = (decimal)(1d / (1d + distanceKm)) * 0.2m;
                var score = statusScore + capacityScore + proximityScore;

                return new
                {
                    vehicleId = x.id,
                    vehicleCode = x.code,
                    x.displayName,
                    x.typeCode,
                    statusCode = x.status_code,
                    capacityPerson = x.capacity_person,
                    capacityWeightKg = x.capacity_weight_kg,
                    teamId = x.teamId,
                    distanceKm = Math.Round(distanceKm, 2),
                    capabilities = x.capabilities,
                    score = Math.Round(score, 4)
                };
            })
            .OrderByDescending(x => x.score)
            .ThenBy(x => x.distanceKm)
            .Take(5)
            .ToList();

        var confidence = rankedTeams.Count > 0 ? 0.83m : 0.61m;

        var aiNote = await generativeAiClient.GenerateDispatchRecommendationNoteAsync(
            new DispatchRecommendationAiInput(incident.code, incident.description, rankedTeams, rankedVehicles),
            cancellationToken);

        return new JobExecutionResult(
            new
            {
                incidentCode = incident.code,
                teamRanking = rankedTeams,
                vehicleRanking = rankedVehicles,
                recommendationNote = aiNote
            },
            [
                new SuggestionDraft("TEAM_RANKING", new { teams = rankedTeams, recommendationNote = aiNote }, confidence),
                new SuggestionDraft("VEHICLE_RANKING", new { vehicles = rankedVehicles, recommendationNote = aiNote }, DecimalMin(0.97m, confidence + 0.05m))
            ]);
    }

    private async Task<JobExecutionResult> ExecuteIncidentDedupe(Guid incidentId, CancellationToken cancellationToken)
    {
        var target = await dbContext.incidents
            .Include(x => x.incident_location)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.id == incidentId, cancellationToken)
            ?? throw new InvalidOperationException("Khong tim thay incident de dedupe.");

        var targetLat = (double?)target.incident_location?.lat;
        var targetLng = (double?)target.incident_location?.lng;
        var fromTime = DateTime.UtcNow.AddDays(-3);

        var candidates = await dbContext.incidents
            .AsNoTracking()
            .Include(x => x.incident_location)
            .Where(x => x.id != target.id && x.created_at >= fromTime && x.status_code != "CANCELLED")
            .Select(x => new
            {
                x.id,
                x.code,
                x.status_code,
                x.description,
                x.created_at,
                Lat = x.incident_location != null ? (double?)x.incident_location.lat : null,
                Lng = x.incident_location != null ? (double?)x.incident_location.lng : null
            })
            .ToListAsync(cancellationToken);

        var duplicates = candidates
            .Select(x =>
            {
                var distanceKm = ComputeDistanceKm(targetLat, targetLng, x.Lat, x.Lng);
                var textSimilarity = ComputeTokenSimilarity(target.description, x.description);
                var distanceSimilarity = (decimal)(1d / (1d + distanceKm));
                var score = Math.Round((distanceSimilarity * 0.6m) + (textSimilarity * 0.4m), 4);

                return new
                {
                    incidentId = x.id,
                    incidentCode = x.code,
                    statusCode = x.status_code,
                    distanceKm = Math.Round(distanceKm, 2),
                    textSimilarity = Math.Round(textSimilarity, 4),
                    score,
                    createdAt = x.created_at
                };
            })
            .Where(x => x.score >= 0.55m)
            .OrderByDescending(x => x.score)
            .ThenBy(x => x.distanceKm)
            .Take(5)
            .ToList();

        var confidence = duplicates.Count switch
        {
            0 => 0.58m,
            > 2 => 0.9m,
            _ => 0.78m
        };

        var aiNote = await generativeAiClient.GenerateDedupeNoteAsync(
            new IncidentDedupeAiInput(target.code, target.description, duplicates),
            cancellationToken);

        return new JobExecutionResult(
            new
            {
                incidentCode = target.code,
                duplicateCount = duplicates.Count,
                duplicates,
                recommendationNote = aiNote
            },
            [
                new SuggestionDraft(
                    "DUPLICATE_INCIDENT",
                    new
                    {
                        duplicates,
                        recommendationNote = aiNote
                    },
                    confidence)
            ]);
    }

    private async Task<JobExecutionResult> ExecuteReliefForecast(Guid reliefCampaignId, CancellationToken cancellationToken)
    {
        var campaign = await dbContext.relief_campaigns
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.id == reliefCampaignId, cancellationToken)
            ?? throw new InvalidOperationException("Khong tim thay relief campaign de du bao.");

        var demandRows = await dbContext.relief_request_items
            .AsNoTracking()
            .Where(x => x.relief_request.campaign_id == reliefCampaignId)
            .GroupBy(x => new { x.item_id, x.item.code, x.item.name, x.unit_code })
            .Select(x => new
            {
                x.Key.item_id,
                itemCode = x.Key.code,
                itemName = x.Key.name,
                unitCode = x.Key.unit_code,
                requestedQty = x.Sum(v => v.approved_qty ?? v.requested_qty)
            })
            .ToListAsync(cancellationToken);

        var issuedRows = await dbContext.relief_issue_lines
            .AsNoTracking()
            .Where(x => x.relief_issue.campaign_id == reliefCampaignId && (x.relief_issue.status_code == "ISSUED" || x.relief_issue.status_code == "DELIVERED"))
            .GroupBy(x => x.item_id)
            .Select(x => new
            {
                ItemId = x.Key,
                IssuedQty = x.Sum(v => v.issue_qty)
            })
            .ToDictionaryAsync(x => x.ItemId, x => x.IssuedQty, cancellationToken);

        var stockRows = await dbContext.stock_balances
            .AsNoTracking()
            .GroupBy(x => x.item_id)
            .Select(x => new
            {
                ItemId = x.Key,
                AvailableQty = x.Sum(v => v.qty_on_hand - v.qty_reserved)
            })
            .ToDictionaryAsync(x => x.ItemId, x => x.AvailableQty, cancellationToken);

        var recommendations = demandRows
            .Select(x =>
            {
                var issued = issuedRows.TryGetValue(x.item_id, out var issuedQty) ? issuedQty : 0m;
                var available = stockRows.TryGetValue(x.item_id, out var availableQty) ? availableQty : 0m;
                var safetyDemand = Math.Ceiling((double)(x.requestedQty * 1.1m));
                var suggestQty = DecimalMax(0m, (decimal)safetyDemand - issued);
                var shortageQty = DecimalMax(0m, suggestQty - available);

                return new
                {
                    itemId = x.item_id,
                    x.itemCode,
                    x.itemName,
                    x.unitCode,
                    demandQty = Math.Round(x.requestedQty, 2),
                    issuedQty = Math.Round(issued, 2),
                    availableQty = Math.Round(available, 2),
                    recommendedIssueQty = Math.Round(suggestQty, 2),
                    shortageQty = Math.Round(shortageQty, 2)
                };
            })
            .Where(x => x.recommendedIssueQty > 0)
            .OrderByDescending(x => x.shortageQty)
            .ThenByDescending(x => x.recommendedIssueQty)
            .Take(20)
            .ToList();

        var totalHouseholds = await dbContext.relief_requests
            .AsNoTracking()
            .Where(x => x.campaign_id == reliefCampaignId)
            .SumAsync(x => (int?)x.household_count, cancellationToken) ?? 0;

        var confidence = recommendations.Count > 0 ? 0.84m : 0.6m;

        var aiNote = await generativeAiClient.GenerateReliefForecastNoteAsync(
            new ReliefForecastAiInput(campaign.code, totalHouseholds, recommendations),
            cancellationToken);

        return new JobExecutionResult(
            new
            {
                campaignCode = campaign.code,
                totalHouseholds,
                recommendedIssue = recommendations.Select(x => new
                {
                    x.itemCode,
                    qty = x.recommendedIssueQty,
                    unitCode = x.unitCode
                }),
                details = recommendations,
                recommendationNote = aiNote
            },
            [
                new SuggestionDraft(
                    "RELIEF_FORECAST",
                    new
                    {
                        campaignCode = campaign.code,
                        totalHouseholds,
                        recommendationNote = aiNote,
                        recommendedIssue = recommendations.Select(x => new
                        {
                            x.itemCode,
                            qty = x.recommendedIssueQty,
                            unitCode = x.unitCode,
                            shortageQty = x.shortageQty
                        })
                    },
                    confidence)
            ]);
    }

    private async Task ApplySuggestionSideEffects(ai_suggestion suggestion, CancellationToken cancellationToken)
    {
        if (suggestion.target_entity_type_code != "INCIDENT")
        {
            return;
        }

        if (suggestion.suggestion_type_code is not ("SUMMARY" or "PRIORITY"))
        {
            return;
        }

        var incident = await dbContext.incidents
            .FirstOrDefaultAsync(x => x.id == suggestion.target_entity_id, cancellationToken);

        if (incident is null)
        {
            return;
        }

        if (suggestion.suggestion_type_code == "SUMMARY")
        {
            var payload = DeserializeJsonObject(suggestion.payload_json);
            if (payload.TryGetValue("summary", out var summary) && !string.IsNullOrWhiteSpace(summary))
            {
                incident.ai_summary = summary;
                incident.updated_at = DateTime.UtcNow;
            }

            return;
        }

        var priorityPayload = DeserializeJsonObject(suggestion.payload_json);
        if (priorityPayload.TryGetValue("priorityCode", out var priorityCode) && IsIncidentPriority(priorityCode))
        {
            incident.priority_code = priorityCode;
            incident.updated_at = DateTime.UtcNow;
        }
    }

    private async Task ValidateTarget(string jobTypeCode, Guid targetEntityId, CancellationToken cancellationToken)
    {
        switch (jobTypeCode)
        {
            case "INCIDENT_TRIAGE":
            case "DISPATCH_RECOMMENDATION":
            case "INCIDENT_DEDUPE":
                {
                    var exists = await dbContext.incidents
                        .AsNoTracking()
                        .AnyAsync(x => x.id == targetEntityId, cancellationToken);
                    if (!exists)
                    {
                        throw new InvalidOperationException("Incident khong ton tai.");
                    }

                    break;
                }
            case "RELIEF_FORECAST":
                {
                    var exists = await dbContext.relief_campaigns
                        .AsNoTracking()
                        .AnyAsync(x => x.id == targetEntityId, cancellationToken);
                    if (!exists)
                    {
                        throw new InvalidOperationException("Relief campaign khong ton tai.");
                    }

                    break;
                }
            default:
                throw new InvalidOperationException($"Khong ho tro jobTypeCode {jobTypeCode}.");
        }
    }

    private static string? NormalizeUpper(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToUpperInvariant();

    private static object? DeserializeJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        return JsonSerializer.Deserialize<object>(json, JsonOptions);
    }

    private static Dictionary<string, string> DeserializeJsonObject(string json)
    {
        var dict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json, JsonOptions) ?? [];
        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var (key, value) in dict)
        {
            if (value.ValueKind == JsonValueKind.String)
            {
                result[key] = value.GetString() ?? string.Empty;
            }
            else
            {
                result[key] = value.ToString();
            }
        }

        return result;
    }

    private static decimal ComputeTokenSimilarity(string left, string right)
    {
        var leftTokens = Tokenize(left);
        var rightTokens = Tokenize(right);

        if (leftTokens.Count == 0 || rightTokens.Count == 0)
        {
            return 0m;
        }

        var intersection = leftTokens.Intersect(rightTokens).Count();
        var union = leftTokens.Union(rightTokens).Count();
        if (union == 0)
        {
            return 0m;
        }

        return Math.Round(intersection / (decimal)union, 4);
    }

    private static HashSet<string> Tokenize(string text)
    {
        return text
            .ToLowerInvariant()
            .Split([' ', ',', '.', ';', ':', '-', '_', '/', '\\', '\n', '\r', '\t'], StringSplitOptions.RemoveEmptyEntries)
            .Where(x => x.Length >= 2)
            .ToHashSet(StringComparer.Ordinal);
    }

    private static double ComputeDistanceKm(double? fromLat, double? fromLng, double? toLat, double? toLng)
    {
        if (!fromLat.HasValue || !fromLng.HasValue || !toLat.HasValue || !toLng.HasValue)
        {
            return 9999d;
        }

        const double earthRadiusKm = 6371d;
        var dLat = DegreesToRadians(toLat.Value - fromLat.Value);
        var dLon = DegreesToRadians(toLng.Value - fromLng.Value);
        var lat1 = DegreesToRadians(fromLat.Value);
        var lat2 = DegreesToRadians(toLat.Value);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(lat1) * Math.Cos(lat2) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private static double DegreesToRadians(double degree) => degree * Math.PI / 180d;

    private static decimal DecimalMin(decimal left, decimal right) => left < right ? left : right;

    private static decimal DecimalMax(decimal left, decimal right) => left > right ? left : right;

    private static bool IsIncidentPriority(string priorityCode)
        => priorityCode is "LOW" or "MEDIUM" or "HIGH" or "CRITICAL";

    private sealed record SuggestionDraft(string SuggestionTypeCode, object Payload, decimal ConfidenceScore);

    private sealed record JobExecutionResult(object OutputPayload, List<SuggestionDraft> Suggestions);
}