namespace RescueHub.Modules.AI.Domain;

public sealed record AiJob(Guid JobId, string JobTypeCode, string StatusCode, DateTime RequestedAtUtc, DateTime? CompletedAtUtc);
