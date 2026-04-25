using RescueHub.Modules.Incidents.Infrastructure;

namespace RescueHub.Modules.Incidents.Application;

public sealed class IncidentService(IIncidentRepository repository) : IIncidentService
{
    public Task<object> List() => repository.List();

    public Task<object> Get(Guid incidentId) => repository.Get(incidentId);

    public Task<object> Verify(Guid incidentId, VerifyIncidentRequest request) => repository.Verify(incidentId, request);

    public Task<object> Assess(Guid incidentId, AssessIncidentRequest request) => repository.Assess(incidentId, request);

    public Task<object> CreateSceneObservation(Guid incidentId, SceneObservationRequest request)
        => repository.CreateSceneObservation(incidentId, request);

    public Task<object> UpdateRequirements(Guid incidentId, UpdateIncidentRequirementsRequest request)
        => repository.UpdateRequirements(incidentId, request);

    public Task<object> GetDispatchOptions(Guid incidentId)
        => repository.GetDispatchOptions(incidentId);

    public Task<object> CreateMission(Guid incidentId, CreateMissionRequest request)
        => repository.CreateMission(incidentId, request);

    public Task<object> CreateReliefRequestFromIncident(Guid incidentId, CreateIncidentReliefRequest request)
        => repository.CreateReliefRequestFromIncident(incidentId, request);

    public Task<object> GetReliefRequestHotspotsForCoordinator(string? statusCode, int days, int top)
        => repository.GetReliefRequestHotspotsForCoordinator(statusCode, days, top);

    public Task<object> ListReliefRequestsForCoordinator(string? statusCode, string? keyword, int page, int pageSize)
        => repository.ListReliefRequestsForCoordinator(statusCode, keyword, page, pageSize);

    public Task<object> GetReliefRequestForCoordinator(Guid reliefRequestId)
        => repository.GetReliefRequestForCoordinator(reliefRequestId);

    public Task<object> StandardizeReliefRequest(Guid reliefRequestId, StandardizeReliefRequest request)
        => repository.StandardizeReliefRequest(reliefRequestId, request);

    public Task<object> GetTeamDashboard()
        => repository.GetTeamDashboard();

    public Task<object> GetTeamMissions()
        => repository.GetTeamMissions();

    public Task<object> GetMyTeamMembers(Guid leaderUserId)
        => repository.GetMyTeamMembers(leaderUserId);

    public Task<object> GetMissionActionCodes()
        => repository.GetMissionActionCodes();

    public Task<object> GetTeamMissionDetail(Guid missionId)
        => repository.GetTeamMissionDetail(missionId);

    public Task<object> TeamRespondMission(Guid missionId, TeamRespondMissionRequest request)
        => repository.TeamRespondMission(missionId, request);

    public Task<object> TeamUpdateMissionStatus(Guid missionId, TeamMissionStatusRequest request)
        => repository.TeamUpdateMissionStatus(missionId, request);

    public Task<object> TeamCreateFieldReport(Guid missionId, TeamFieldReportRequest request)
        => repository.TeamCreateFieldReport(missionId, request);

    public Task<object> TeamCreateAbortRequest(Guid missionId, TeamAbortRequest request)
        => repository.TeamCreateAbortRequest(missionId, request);

    public Task<object> ListMissionAbortRequestsForCoordinator(string? statusCode, int page, int pageSize)
        => repository.ListMissionAbortRequestsForCoordinator(statusCode, page, pageSize);

    public Task<object> DecideMissionAbortRequest(Guid missionId, Guid abortRequestId, DecideMissionAbortRequest request)
        => repository.DecideMissionAbortRequest(missionId, abortRequestId, request);

    public Task<object> TeamCreateSupportRequest(Guid missionId, TeamSupportRequest request)
        => repository.TeamCreateSupportRequest(missionId, request);

    public Task<object> TeamUpdateReliefDistributionStatus(Guid distributionId, TeamReliefStatusRequest request)
        => repository.TeamUpdateReliefDistributionStatus(distributionId, request);

    public Task<object> GetMyReliefHistory(Guid leaderUserId, Guid? teamId, string? statusCode, int page, int pageSize)
        => repository.GetMyReliefHistory(leaderUserId, teamId, statusCode, page, pageSize);

    public Task<object> TeamUpdateMyStatus(Guid leaderUserId, TeamSelfStatusRequest request)
        => repository.TeamUpdateMyStatus(leaderUserId, request);
}
