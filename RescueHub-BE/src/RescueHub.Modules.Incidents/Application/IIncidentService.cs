namespace RescueHub.Modules.Incidents.Application;

public interface IIncidentService
{
    Task<object> List();

    Task<object> Get(Guid incidentId);

    Task<object> Verify(Guid incidentId, VerifyIncidentRequest request);

    Task<object> Assess(Guid incidentId, AssessIncidentRequest request);

    Task<object> CreateSceneObservation(Guid incidentId, SceneObservationRequest request);

    Task<object> UpdateRequirements(Guid incidentId, UpdateIncidentRequirementsRequest request);

    Task<object> GetDispatchOptions(Guid incidentId);

    Task<object> CreateMission(Guid incidentId, CreateMissionRequest request);

    Task<object> CreateReliefRequestFromIncident(Guid incidentId, CreateIncidentReliefRequest request);

    Task<object> GetReliefRequestHotspotsForCoordinator(string? statusCode, int days, int top);

    Task<object> ListReliefRequestsForCoordinator(string? statusCode, string? keyword, int page, int pageSize);

    Task<object> GetReliefRequestForCoordinator(Guid reliefRequestId);

    Task<object> StandardizeReliefRequest(Guid reliefRequestId, StandardizeReliefRequest request);

    Task<object> GetTeamDashboard();

    Task<object> GetTeamMissions();

    Task<object> GetMyTeamMembers(Guid leaderUserId);

    Task<object> GetMissionActionCodes();

    Task<object> GetTeamMissionDetail(Guid missionId);

    Task<object> TeamRespondMission(Guid missionId, TeamRespondMissionRequest request);

    Task<object> TeamUpdateMissionStatus(Guid missionId, TeamMissionStatusRequest request);

    Task<object> TeamCreateFieldReport(Guid missionId, TeamFieldReportRequest request);

    Task<object> TeamCreateAbortRequest(Guid missionId, TeamAbortRequest request);

    Task<object> TeamCreateSupportRequest(Guid missionId, TeamSupportRequest request);

    Task<object> TeamUpdateReliefDistributionStatus(Guid distributionId, TeamReliefStatusRequest request);

    Task<object> TeamUpdateMyStatus(Guid leaderUserId, TeamSelfStatusRequest request);
}
