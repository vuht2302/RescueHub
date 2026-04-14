using Microsoft.AspNetCore.Mvc;
using RescueHub.BuildingBlocks.Api;
using RescueHub.Modules.Auth.Application;

namespace RescueHub.Modules.Auth.Api;

[Route("api/v1/auth")]
public sealed class AuthController(IAuthService authService) : BaseApiController
{
    [HttpPost("login")]
    public ActionResult<ApiResponse<object>> Login([FromBody] LoginRequest request)
        => OkResponse<object>(authService.Login(request), "Dang nhap thanh cong");

    [HttpPost("refresh")]
    public ActionResult<ApiResponse<object>> Refresh([FromBody] RefreshTokenRequest request)
        => OkResponse<object>(authService.Refresh(request), "Lam moi token thanh cong");

    [HttpPost("request-otp")]
    public ActionResult<ApiResponse<object>> RequestOtp([FromBody] RequestOtpRequest request)
        => OkResponse<object>(authService.RequestOtp(request), "Da gui OTP");

    [HttpPost("verify-otp")]
    public ActionResult<ApiResponse<object>> VerifyOtp([FromBody] VerifyOtpRequest request)
        => OkResponse<object>(authService.VerifyOtp(request), "Xac thuc OTP thanh cong");

    [HttpPost("logout")]
    public ActionResult<ApiResponse<object>> Logout()
        => OkResponse<object>(null, "Dang xuat thanh cong");
}
