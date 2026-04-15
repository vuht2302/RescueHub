using Microsoft.AspNetCore.Http;

namespace RescueHub.Modules.Media.Application;

public sealed class CloudinarySignatureRequest
{
    public string ResourceType { get; init; } = string.Empty;

    public string FileName { get; init; } = string.Empty;

    public string? Type { get; init; }

    public string? Purpose { get; init; }
}

public sealed class UploadMediaFormRequest
{
    public IFormFile? File { get; init; }

    public string? Type { get; init; }

    // Backward-compatible alias for old clients.
    public string? Purpose { get; init; }
}

public sealed record RegisterMediaRequest(
    string Provider,
    string PublicId,
    string ResourceType,
    string OriginalUrl,
    string SecureUrl,
    int Width,
    int Height,
    long Bytes,
    string ContentType,
    string Purpose
);

public sealed record CloudinarySignatureResult(
    string CloudName,
    string ApiKey,
    long Timestamp,
    string Folder,
    string Signature
);
