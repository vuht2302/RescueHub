using RescueHub.Modules.Incidents.Application;

namespace RescueHub.Modules.Incidents.Infrastructure;

public interface IIncidentRepository
{
    Task<object> List();

    Task<object> Get(Guid incidentId);

    Task<object> Verify(Guid incidentId, VerifyIncidentRequest request);

    Task<object> Assess(Guid incidentId, AssessIncidentRequest request);

    Task<object> CreateSceneObservation(Guid incidentId, SceneObservationRequest request);

    Task<object> UpdateRequirements(Guid incidentId, UpdateIncidentRequirementsRequest request);

    Task<object> GetDispatchOptions(Guid incidentId);

    Task<object> CreateMission(Guid incidentId, CreateMissionRequest request);

    Task<object> GetTeamDashboard();

    Task<object> GetTeamMissions();

    Task<object> GetTeamMissionDetail(Guid missionId);

    Task<object> TeamRespondMission(Guid missionId, TeamRespondMissionRequest request);

    Task<object> TeamUpdateMissionStatus(Guid missionId, TeamMissionStatusRequest request);

    Task<object> TeamCreateFieldReport(Guid missionId, TeamFieldReportRequest request);

    Task<object> TeamCreateAbortRequest(Guid missionId, TeamAbortRequest request);

    Task<object> TeamCreateSupportRequest(Guid missionId, TeamSupportRequest request);
}
