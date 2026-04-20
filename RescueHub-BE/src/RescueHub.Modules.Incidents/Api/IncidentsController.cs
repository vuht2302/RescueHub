using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RescueHub.BuildingBlocks.Api;
using RescueHub.Modules.Incidents.Application;

namespace RescueHub.Modules.Incidents.Api;

[Route("api/v1/incidents")]
[Authorize]
public sealed class IncidentsController(IIncidentService service) : BaseApiController
{
    /// <summary>
    /// Lay danh sach su co cho command center.
    /// </summary>
    /// <returns>Danh sach su co gan nhat.</returns>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> List()
        => OkResponse<object>(await service.List(), "Lay danh sach su co thanh cong");

    /// <summary>
    /// Lay chi tiet su co theo id.
    /// </summary>
    /// <param name="incidentId">Id su co.</param>
    /// <returns>Thong tin day du su co.</returns>
    [HttpGet("{incidentId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetById([FromRoute] Guid incidentId)
    {
        try
        {
            return OkResponse<object>(await service.Get(incidentId), "Lay chi tiet su co thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Xac minh su co.
    /// </summary>
    /// <param name="incidentId">Id su co.</param>
    /// <param name="request">Thong tin xac minh.</param>
    /// <returns>Ket qua xac minh.</returns>
    [HttpPost("{incidentId:guid}/verify")]
    public async Task<ActionResult<ApiResponse<object>>> Verify([FromRoute] Guid incidentId, [FromBody] VerifyIncidentRequest request)
    {
        try
        {
            return OkResponse<object>(await service.Verify(incidentId, request), "Xac minh su co thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Danh gia muc do uu tien va nghiem trong cua su co.
    /// </summary>
    /// <param name="incidentId">Id su co.</param>
    /// <param name="request">Noi dung danh gia.</param>
    /// <returns>Ket qua danh gia.</returns>
    [HttpPost("{incidentId:guid}/assess")]
    public async Task<ActionResult<ApiResponse<object>>> Assess([FromRoute] Guid incidentId, [FromBody] AssessIncidentRequest request)
    {
        try
        {
            return OkResponse<object>(await service.Assess(incidentId, request), "Danh gia su co thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Tao ghi nhan hien truong.
    /// </summary>
    /// <param name="incidentId">Id su co.</param>
    /// <param name="request">Thong tin quan sat hien truong.</param>
    /// <returns>Observation moi duoc tao.</returns>
    [HttpPost("{incidentId:guid}/scene-observations")]
    public async Task<ActionResult<ApiResponse<object>>> CreateSceneObservation([FromRoute] Guid incidentId, [FromBody] SceneObservationRequest request)
    {
        try
        {
            return OkResponse<object>(await service.CreateSceneObservation(incidentId, request), "Tao ghi nhan hien truong thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Cap nhat nhu cau ky nang va nang luc phuong tien cho su co.
    /// </summary>
    /// <param name="incidentId">Id su co.</param>
    /// <param name="request">Danh sach nhu cau.</param>
    /// <returns>Ket qua cap nhat.</returns>
    [HttpPost("{incidentId:guid}/requirements")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateRequirements([FromRoute] Guid incidentId, [FromBody] UpdateIncidentRequirementsRequest request)
    {
        try
        {
            return OkResponse<object>(await service.UpdateRequirements(incidentId, request), "Cap nhat nhu cau su co thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay goi y dieu phoi doi cuu ho.
    /// </summary>
    /// <param name="incidentId">Id su co.</param>
    /// <returns>Danh sach doi duoc de xuat.</returns>
    [HttpGet("{incidentId:guid}/dispatch-options")]
    public async Task<ActionResult<ApiResponse<object>>> GetDispatchOptions([FromRoute] Guid incidentId)
    {
        try
        {
            return OkResponse<object>(await service.GetDispatchOptions(incidentId), "Lay phuong an dieu phoi thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Tao nhiem vu cuu ho tu su co.
    /// </summary>
    /// <param name="incidentId">Id su co.</param>
    /// <param name="request">Thong tin tao nhiem vu.</param>
    /// <returns>Nhiem vu moi da duoc tao.</returns>
    [HttpPost("{incidentId:guid}/missions")]
    public async Task<ActionResult<ApiResponse<object>>> CreateMission([FromRoute] Guid incidentId, [FromBody] CreateMissionRequest request)
    {
        try
        {
            return OkResponse<object>(await service.CreateMission(incidentId, request), "Tao nhiem vu cuu ho thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Coordinator tao yeu cau cuu tro tu incident/SOS sau khi danh gia can cuu tro.
    /// </summary>
    [HttpPost("{incidentId:guid}/relief-requests")]
    public async Task<ActionResult<ApiResponse<object>>> CreateReliefRequestFromIncident(
        [FromRoute] Guid incidentId,
        [FromBody] CreateIncidentReliefRequest request)
    {
        try
        {
            return OkResponse<object>(
                await service.CreateReliefRequestFromIncident(incidentId, request),
                "Tao yeu cau cuu tro tu incident thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Lay cac khu vuc co nhieu yeu cau cuu tro de coordinator uu tien dieu phoi.
    /// </summary>
    [HttpGet("relief-requests/hotspots")]
    public async Task<ActionResult<ApiResponse<object>>> GetReliefRequestHotspots(
        [FromQuery] string? statusCode,
        [FromQuery] int days = 7,
        [FromQuery] int top = 10)
        => OkResponse<object>(
            await service.GetReliefRequestHotspotsForCoordinator(statusCode, days, top),
            "Lay diem nong yeu cau cuu tro thanh cong");

    /// <summary>
    /// Lay danh sach yeu cau cuu tro cho coordinator xu ly chuan hoa phan phoi.
    /// </summary>
    [HttpGet("relief-requests")]
    public async Task<ActionResult<ApiResponse<object>>> ListReliefRequests(
        [FromQuery] string? statusCode,
        [FromQuery] string? keyword,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
        => OkResponse<object>(await service.ListReliefRequestsForCoordinator(statusCode, keyword, page, pageSize), "Lay danh sach relief request thanh cong");

    /// <summary>
    /// Lay chi tiet yeu cau cuu tro de coordinator chuan hoa.
    /// </summary>
    [HttpGet("relief-requests/{reliefRequestId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> GetReliefRequest([FromRoute] Guid reliefRequestId)
    {
        try
        {
            return OkResponse<object>(await service.GetReliefRequestForCoordinator(reliefRequestId), "Lay chi tiet relief request thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }

    /// <summary>
    /// Coordinator chuan hoa phan phoi: approve/reject va chot approved qty.
    /// </summary>
    [HttpPost("relief-requests/{reliefRequestId:guid}/standardize")]
    public async Task<ActionResult<ApiResponse<object>>> StandardizeReliefRequest([FromRoute] Guid reliefRequestId, [FromBody] StandardizeReliefRequest request)
    {
        try
        {
            return OkResponse<object>(await service.StandardizeReliefRequest(reliefRequestId, request), "Chuan hoa relief request thanh cong");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequestResponse<object>(ex.Message);
        }
    }
}
