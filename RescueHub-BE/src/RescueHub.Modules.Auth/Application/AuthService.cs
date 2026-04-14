using RescueHub.Modules.Auth.Infrastructure;

namespace RescueHub.Modules.Auth.Application;

public sealed class AuthService(InMemoryRefreshTokenRepository tokenRepository) : IAuthService
{
    public object Login(LoginRequest request)
    {
        var refreshToken = $"refresh-{Guid.NewGuid():N}";
        tokenRepository.Save(refreshToken, request.Username);

        return new
        {
            accessToken = $"jwt-{Guid.NewGuid():N}",
            refreshToken,
            expiresAt = DateTime.UtcNow.AddHours(1),
            user = new
            {
                id = Guid.NewGuid(),
                displayName = request.Username,
                phone = "0900000000",
                roles = new[] { "COORDINATOR" }
            }
        };
    }

    public object Refresh(RefreshTokenRequest request) => new
    {
        accessToken = $"jwt-{Guid.NewGuid():N}",
        refreshToken = $"refresh-{Guid.NewGuid():N}",
        expiresAt = DateTime.UtcNow.AddHours(1)
    };

    public object RequestOtp(RequestOtpRequest request) => new
    {
        expiredAt = DateTime.UtcNow.AddMinutes(5)
    };

    public object VerifyOtp(VerifyOtpRequest request) => new { verified = true };
}
