using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RescueHub.BuildingBlocks.Api;
using RescueHub.Persistence;

namespace RescueHub.Api.Controllers;

[Route("api/v1/system")]
public sealed class SystemController(RescueHubDbContext dbContext) : BaseApiController
{
    [HttpGet("db-check")]
    public async Task<ActionResult<ApiResponse<object>>> CheckDatabase(CancellationToken cancellationToken)
    {
        var canConnect = await dbContext.Database.CanConnectAsync(cancellationToken);

        if (!canConnect)
        {
            return BadRequestResponse<object>("Khong ket noi duoc PostgreSQL");
        }

        var incidentCount = await dbContext.incidents.CountAsync(cancellationToken);

        return OkResponse<object>(new
        {
            canConnect,
            incidentCount,
            checkedAt = DateTime.UtcNow
        }, "Ket noi PostgreSQL thanh cong");
    }
}
