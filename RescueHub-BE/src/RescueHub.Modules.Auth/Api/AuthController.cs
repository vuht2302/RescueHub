using Microsoft.AspNetCore.Mvc;
using RescueHub.BuildingBlocks.Api;
using RescueHub.Modules.Auth.Application;

namespace RescueHub.Modules.Auth.Api;

[Route("api/v1/auth")]
public sealed class AuthController(IAuthService authService) : BaseApiController
{
    /// <summary>
    /// Dang nhap cho nguoi dung noi bo bang username/password.
    /// </summary>
    /// <param name="request">Thong tin dang nhap.</param>
    /// <returns>JWT access token, refresh token va thong tin user.</returns>
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<object>>> Login([FromBody] LoginRequest request)
    {
        try
        {
            return OkResponse<object>(await authService.Login(request), "Dang nhap thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lam moi access token bang refresh token.
    /// </summary>
    /// <param name="request">Refresh token dang con hieu luc.</param>
    /// <returns>Cap token moi.</returns>
    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<object>>> Refresh([FromBody] RefreshTokenRequest request)
    {
        try
        {
            return OkResponse<object>(await authService.Refresh(request), "Lam moi token thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Gui OTP theo muc dich (LOGIN, TRACKING, ...).
    /// </summary>
    /// <param name="request">Thong tin so dien thoai va purpose.</param>
    /// <returns>Thoi gian het han OTP.</returns>
    [HttpPost("request-otp")]
    public async Task<ActionResult<ApiResponse<object>>> RequestOtp([FromBody] RequestOtpRequest request)
    {
        try
        {
            return OkResponse<object>(await authService.RequestOtp(request), "Da gui OTP");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Xac thuc OTP theo muc dich.
    /// </summary>
    /// <param name="request">Thong tin verify OTP.</param>
    /// <returns>Ket qua xac thuc va token neu la login.</returns>
    [HttpPost("verify-otp")]
    public async Task<ActionResult<ApiResponse<object>>> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        try
        {
            return OkResponse<object>(await authService.VerifyOtp(request), "Xac thuc OTP thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Dang ky tai khoan citizen.
    /// </summary>
    /// <param name="request">Thong tin citizen.</param>
    /// <returns>Thong tin tai khoan citizen da tao.</returns>
    [HttpPost("citizen/register")]
    public async Task<ActionResult<ApiResponse<object>>> RegisterCitizen([FromBody] RegisterCitizenRequest request)
    {
        try
        {
            return OkResponse<object>(await authService.RegisterCitizen(request), "Dang ky citizen thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Dang xuat khoi he thong.
    /// </summary>
    /// <returns>Thong bao dang xuat thanh cong.</returns>
    [HttpPost("logout")]
    public ActionResult<ApiResponse<object>> Logout()
        => OkResponse<object>(null, "Dang xuat thanh cong");
}
