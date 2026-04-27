namespace RescueHub.Modules.Auth.Application;

public interface IAuthService
{
    Task<object> Login(LoginRequest request);

    Task<object> Refresh(RefreshTokenRequest request);

    Task<object> RequestOtp(RequestOtpRequest request);

    Task<object> VerifyOtp(VerifyOtpRequest request);

    Task<object> RegisterCitizen(RegisterCitizenRequest request);
}
