namespace RescueHub.Modules.Auth.Application;

public sealed record LoginRequest(string Username, string Password);

public sealed record RefreshTokenRequest(string RefreshToken);

public sealed record RequestOtpRequest(string Phone, string Purpose);

public sealed record VerifyOtpRequest(string Phone, string OtpCode, string Purpose);

public sealed record RegisterCitizenRequest(
    string DisplayName,
    string Phone,
    string? Email,
    string Password);
