namespace RescueHub.Modules.Media.Application;

public sealed record CloudinarySignatureRequest(string? Folder, string ResourceType, string FileName, string Purpose);

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
