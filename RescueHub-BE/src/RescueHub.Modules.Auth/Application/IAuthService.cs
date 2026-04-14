namespace RescueHub.Modules.Auth.Application;

public interface IAuthService
{
    object Login(LoginRequest request);

    object Refresh(RefreshTokenRequest request);

    object RequestOtp(RequestOtpRequest request);

    object VerifyOtp(VerifyOtpRequest request);
}
