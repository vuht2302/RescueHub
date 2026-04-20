using Microsoft.AspNetCore.Mvc;
using RescueHub.BuildingBlocks.Api;
using RescueHub.Modules.Public.Application;

namespace RescueHub.Modules.Public.Api;

[Route("api/v1/public")]
public sealed class PublicController(IPublicService publicService) : BaseApiController
{
    /// <summary>
    /// Lay du lieu khoi tao cho man hinh public.
    /// </summary>
    /// <returns>Hotline, quick actions va quick incident types.</returns>
    [HttpGet("bootstrap")]
    public async Task<ActionResult<ApiResponse<object>>> GetBootstrap()
        => OkResponse<object>(await publicService.GetBootstrap(), "Lay du lieu khoi tao thanh cong");

    /// <summary>
    /// Lay marker ban do quanh vi tri hien tai.
    /// </summary>
    /// <param name="lat">Vi do tam tim kiem.</param>
    /// <param name="lng">Kinh do tam tim kiem.</param>
    /// <param name="radiusKm">Ban kinh tim kiem theo km.</param>
    /// <returns>Danh sach marker phuc vu ban do public.</returns>
    [HttpGet("map-data")]
    public async Task<ActionResult<ApiResponse<object>>> GetMapData([FromQuery] double lat, [FromQuery] double lng, [FromQuery] double radiusKm = 3)
        => OkResponse<object>(await publicService.GetMapData(lat, lng, radiusKm), "Lay du lieu ban do thanh cong");

    /// <summary>
    /// Lay canh bao cong khai cho nguoi dan.
    /// </summary>
    /// <returns>Danh sach canh bao moi nhat.</returns>
    [HttpGet("alerts")]
    public async Task<ActionResult<ApiResponse<object>>> GetAlerts()
        => OkResponse<object>(await publicService.GetAlerts(), "Lay danh sach canh bao thanh cong");

    /// <summary>
    /// Lay metadata form gui yeu cau cuu ho thuong.
    /// </summary>
    /// <returns>Incident types, dynamic fields, vulnerable groups.</returns>
    [HttpGet("rescue-form")]
    public async Task<ActionResult<ApiResponse<object>>> GetRescueForm()
        => OkResponse<object>(await publicService.GetRescueForm(), "Lay du lieu form cuu ho thanh cong");

    /// <summary>
    /// Gui tin hieu SOS khan cap.
    /// </summary>
    /// <param name="request">Thong tin SOS tu citizen.</param>
    /// <returns>Incident code va tracking code.</returns>
    [HttpPost("incidents/sos")]
    public async Task<ActionResult<ApiResponse<object>>> CreateSos([FromBody] CreateSosRequest request)
    {
        try
        {
            return OkResponse<object>(await publicService.CreateSos(request), "Gui tin hieu SOS thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Tao yeu cau cuu ho thuong (khong phai SOS).
    /// </summary>
    /// <param name="request">Thong tin su co va hien truong.</param>
    /// <returns>Incident moi va tracking code.</returns>
    [HttpPost("incidents")]
    public async Task<ActionResult<ApiResponse<object>>> CreateIncident([FromBody] CreatePublicIncidentRequest request)
    {
        try
        {
            return OkResponse<object>(await publicService.CreateIncident(request), "Gui yeu cau cuu ho thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Gui OTP cho luong tracking.
    /// </summary>
    /// <param name="request">So dien thoai va purpose tracking.</param>
    /// <returns>Thoi gian het han OTP.</returns>
    [HttpPost("tracking/request-otp")]
    public async Task<ActionResult<ApiResponse<object>>> RequestTrackingOtp([FromBody] RequestTrackingOtpRequest request)
    {
        try
        {
            return OkResponse<object>(await publicService.RequestTrackingOtp(request), "Da gui OTP");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Xac thuc OTP de nhan tracking token.
    /// </summary>
    /// <param name="request">Thong tin verify OTP.</param>
    /// <returns>Tracking token tam thoi.</returns>
    [HttpPost("tracking/verify-otp")]
    public async Task<ActionResult<ApiResponse<object>>> VerifyTrackingOtp([FromBody] VerifyTrackingOtpRequest request)
    {
        try
        {
            return OkResponse<object>(await publicService.VerifyTrackingOtp(request), "Xac thuc OTP thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay lich su cac yeu cau cuu ho do citizen da tao theo so dien thoai.
    /// </summary>
    /// <param name="phone">So dien thoai da xac thuc OTP.</param>
    /// <param name="trackingToken">Tracking token nhan duoc sau verify OTP.</param>
    /// <param name="page">So trang.</param>
    /// <param name="pageSize">So ban ghi moi trang.</param>
    /// <returns>Danh sach yeu cau cuu ho cua citizen.</returns>
    [HttpGet("tracking/my-rescues")]
    public async Task<ActionResult<ApiResponse<object>>> GetMyRescues(
        [FromQuery] string phone,
        [FromHeader(Name = "X-Tracking-Token")] string trackingToken,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            return OkResponse<object>(
                await publicService.GetMyRescueRequests(phone, trackingToken, page, pageSize),
                "Lay lich su yeu cau cuu ho thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay lich su cac yeu cau cuu tro do citizen da tao theo so dien thoai.
    /// </summary>
    /// <param name="phone">So dien thoai da xac thuc OTP.</param>
    /// <param name="trackingToken">Tracking token nhan duoc sau verify OTP.</param>
    /// <param name="page">So trang.</param>
    /// <param name="pageSize">So ban ghi moi trang.</param>
    /// <returns>Danh sach yeu cau cuu tro cua citizen.</returns>
    [HttpGet("tracking/my-relief-requests")]
    public async Task<ActionResult<ApiResponse<object>>> GetMyReliefRequests(
        [FromQuery] string phone,
        [FromHeader(Name = "X-Tracking-Token")] string trackingToken,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            return OkResponse<object>(
                await publicService.GetMyReliefRequests(phone, trackingToken, page, pageSize),
                "Lay lich su yeu cau cuu tro thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Theo doi trang thai cuu ho bang tracking code.
    /// </summary>
    /// <param name="trackingCode">Ma theo doi yeu cau.</param>
    /// <returns>Thong tin trang thai va lich su cap nhat.</returns>
    [HttpGet("tracking/rescue/{trackingCode}")]
    public async Task<ActionResult<ApiResponse<object>>> GetTrackingRescue([FromRoute] string trackingCode)
    {
        try
        {
            return OkResponse<object>(await publicService.GetTrackingRescue(trackingCode), "Lay trang thai cuu ho thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Xac nhan da duoc cuu.
    /// </summary>
    /// <param name="trackingCode">Ma theo doi yeu cau.</param>
    /// <param name="request">Thong tin xac nhan.</param>
    /// <returns>Ket qua ack.</returns>
    [HttpPost("tracking/rescue/{trackingCode}/ack")]
    public async Task<ActionResult<ApiResponse<object>>> AckTrackingRescue([FromRoute] string trackingCode, [FromBody] AckRescueRequest request)
    {
        try
        {
            return OkResponse<object>(await publicService.AckTrackingRescue(trackingCode, request), "Xac nhan da duoc cuu thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Tao yeu cau cuu tro cho nguoi dan.
    /// </summary>
    /// <param name="request">Thong tin yeu cau cuu tro.</param>
    /// <returns>Request code de theo doi cuu tro.</returns>
    [HttpPost("relief-requests")]
    public async Task<ActionResult<ApiResponse<object>>> CreateReliefRequest([FromBody] CreateReliefRequest request)
    {
        try
        {
            return OkResponse<object>(await publicService.CreateReliefRequest(request), "Gui yeu cau cuu tro thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Theo doi trang thai cuu tro bang request code.
    /// </summary>
    /// <param name="requestCode">Ma yeu cau cuu tro.</param>
    /// <returns>Thong tin trang thai cuu tro.</returns>
    [HttpGet("tracking/relief/{requestCode}")]
    public async Task<ActionResult<ApiResponse<object>>> GetTrackingRelief([FromRoute] string requestCode)
    {
        try
        {
            return OkResponse<object>(await publicService.GetTrackingRelief(requestCode), "Lay trang thai cuu tro thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Xac nhan da nhan cuu tro.
    /// </summary>
    /// <param name="requestCode">Ma yeu cau cuu tro.</param>
    /// <param name="request">Noi dung xac nhan.</param>
    /// <returns>Ket qua ack cuu tro.</returns>
    [HttpPost("tracking/relief/{requestCode}/ack")]
    public async Task<ActionResult<ApiResponse<object>>> AckTrackingRelief([FromRoute] string requestCode, [FromBody] AckReliefRequest request)
    {
        try
        {
            return OkResponse<object>(await publicService.AckTrackingRelief(requestCode, request), "Xac nhan nhan cuu tro thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }
}
