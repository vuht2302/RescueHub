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

    public Task<object> TeamCreateSupportRequest(Guid missionId, TeamSupportRequest request)
        => repository.TeamCreateSupportRequest(missionId, request);
}
