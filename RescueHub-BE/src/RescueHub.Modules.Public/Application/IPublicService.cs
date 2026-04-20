namespace RescueHub.Modules.Public.Application;

public interface IPublicService
{
    Task<object> GetBootstrap();

    Task<object> GetMapData(double lat, double lng, double radiusKm);

    Task<object> GetAlerts();

    Task<object> GetRescueForm();

    Task<object> CreateSos(CreateSosRequest request);

    Task<object> CreateIncident(CreatePublicIncidentRequest request);

    Task<object> RequestTrackingOtp(RequestTrackingOtpRequest request);

    Task<object> VerifyTrackingOtp(VerifyTrackingOtpRequest request);

    Task<object> GetMyRescueRequests(string phone, string trackingToken, int page, int pageSize);

    Task<object> GetMyReliefRequests(string phone, string trackingToken, int page, int pageSize);

    Task<object> GetTrackingRescue(string trackingCode);

    Task<object> AckTrackingRescue(string trackingCode, AckRescueRequest request);

    Task<object> CreateReliefRequest(CreateReliefRequest request);

    Task<object> GetTrackingRelief(string requestCode);

    Task<object> AckTrackingRelief(string requestCode, AckReliefRequest request);
}
