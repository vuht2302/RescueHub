using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using RescueHub.Modules.Media.Domain;
using RescueHub.Modules.Media.Infrastructure;

namespace RescueHub.Modules.Media.Application;

public sealed class MediaService(IOptions<CloudinaryOptions> options, IMediaRepository mediaRepository) : IMediaService
{
    public CloudinarySignatureResult CreateCloudinarySignature(CloudinarySignatureRequest request)
    {
        var cfg = options.Value;
        var folder = ResolveFolder(cfg, request.Folder, request.Purpose);
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var signPayload = $"folder={folder}&timestamp={timestamp}{cfg.ApiSecret}";

        using var sha1 = SHA1.Create();
        var signatureBytes = sha1.ComputeHash(Encoding.UTF8.GetBytes(signPayload));
        var signature = Convert.ToHexString(signatureBytes).ToLowerInvariant();

        return new CloudinarySignatureResult(cfg.CloudName, cfg.ApiKey, timestamp, folder, signature);
    }

    public async Task<MediaAsset> RegisterAsync(RegisterMediaRequest request, CancellationToken cancellationToken)
    {
        var createdAtUtc = DateTime.UtcNow;
        var fileId = Guid.NewGuid();
        var asset = new MediaAsset(
            fileId,
            request.Provider,
            request.PublicId,
            request.ResourceType,
            request.OriginalUrl,
            request.SecureUrl,
            $"{request.SecureUrl}?w=300&h=300&c=fill",
            $"{request.SecureUrl}?w=1024&q=auto&f=auto",
            request.Width,
            request.Height,
            request.Bytes,
            request.ContentType,
            createdAtUtc);

        await mediaRepository.SaveAsync(asset, cancellationToken);
        return asset;
    }

    private static string ResolveFolder(CloudinaryOptions cfg, string? explicitFolder, string purpose)
    {
        if (!string.IsNullOrWhiteSpace(explicitFolder))
        {
            return explicitFolder.Trim();
        }

        if (cfg.Folders.TryGetValue(purpose, out var folderFromMap) && !string.IsNullOrWhiteSpace(folderFromMap))
        {
            return folderFromMap;
        }

        return cfg.DefaultFolder;
    }
}
