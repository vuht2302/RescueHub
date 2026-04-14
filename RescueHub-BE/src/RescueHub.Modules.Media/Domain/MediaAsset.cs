namespace RescueHub.Modules.Media.Domain;

public sealed record MediaAsset(
    Guid FileId,
    string Provider,
    string PublicId,
    string ResourceType,
    string OriginalUrl,
    string SecureUrl,
    string ThumbnailUrl,
    string AiOptimizedUrl,
    int Width,
    int Height,
    long Bytes,
    string ContentType,
    DateTime CreatedAtUtc
);
