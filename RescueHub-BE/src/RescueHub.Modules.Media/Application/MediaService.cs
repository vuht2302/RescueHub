using System.Security.Cryptography;
using System.Text;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;
using RescueHub.Modules.Media.Domain;
using RescueHub.Modules.Media.Infrastructure;

namespace RescueHub.Modules.Media.Application;

public sealed class MediaService(
    IOptions<CloudinaryOptions> options,
    IMediaRepository mediaRepository) : IMediaService
{
    public IReadOnlyCollection<string> GetSupportedUploadTypes()
        => options.Value.Folders.Keys
            .OrderBy(x => x)
            .ToArray();

    public CloudinarySignatureResult CreateCloudinarySignature(CloudinarySignatureRequest request)
    {
        var cfg = ResolveCloudinaryConfig();
        var uploadType = ResolveUploadType(request.Type, request.Purpose);
        var folder = ResolveFolder(cfg, uploadType);
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var signPayload = $"folder={folder}&timestamp={timestamp}{cfg.ApiSecret}";

        using var sha1 = SHA1.Create();
        var signatureBytes = sha1.ComputeHash(Encoding.UTF8.GetBytes(signPayload));
        var signature = Convert.ToHexString(signatureBytes).ToLowerInvariant();

        return new CloudinarySignatureResult(cfg.CloudName, cfg.ApiKey, timestamp, folder, signature);
    }

    public async Task<MediaAsset> UploadAsync(Stream fileStream, string fileName, string contentType, string uploadType, CancellationToken cancellationToken)
    {
        var cfg = ResolveCloudinaryConfig();
        var cloudinary = CreateCloudinaryClient(cfg);
        var normalizedUploadType = ResolveUploadType(uploadType, null);
        var folder = ResolveFolder(cfg, normalizedUploadType);
        var resourceType = ResolveResourceType(contentType);

        UploadResult uploadResult;
        try
        {
            if (resourceType == "video")
            {
                uploadResult = await cloudinary.UploadAsync(new VideoUploadParams
                {
                    File = new FileDescription(fileName, fileStream),
                    Folder = folder,
                    UseFilename = true,
                    UniqueFilename = true,
                    Overwrite = false
                }, cancellationToken);
            }
            else if (resourceType == "image")
            {
                uploadResult = await cloudinary.UploadAsync(new ImageUploadParams
                {
                    File = new FileDescription(fileName, fileStream),
                    Folder = folder,
                    UseFilename = true,
                    UniqueFilename = true,
                    Overwrite = false
                }, cancellationToken);
            }
            else
            {
                throw new InvalidOperationException("Chi ho tro upload image/video.");
            }
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Upload Cloudinary that bai: Khong the ket noi/ky request voi Cloudinary. Kiem tra CLOUDINARY_URL.", ex);
        }

        if (uploadResult.Error is not null)
        {
            throw new InvalidOperationException($"Upload Cloudinary that bai: {uploadResult.Error.Message}");
        }

        var publicId = uploadResult.PublicId ?? throw new InvalidOperationException("Cloudinary response thieu public_id.");
        var secureUrl = uploadResult.SecureUrl?.ToString() ?? string.Empty;
        var originalUrl = uploadResult.Url?.ToString() ?? secureUrl;

        var width = uploadResult is ImageUploadResult imageResult ? imageResult.Width : uploadResult is VideoUploadResult videoResult ? videoResult.Width : 0;
        var height = uploadResult is ImageUploadResult imageResult2 ? imageResult2.Height : uploadResult is VideoUploadResult videoResult2 ? videoResult2.Height : 0;
        var bytes = uploadResult.Bytes;
        var uploadResourceType = resourceType;

        var registerRequest = new RegisterMediaRequest(
            "CLOUDINARY",
            publicId,
            uploadResourceType,
            originalUrl,
            secureUrl,
            width,
            height,
            bytes,
            contentType,
            normalizedUploadType);

        return await RegisterAsync(registerRequest, cancellationToken);
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

    public async Task<MediaAsset?> GetAsync(Guid fileId, CancellationToken cancellationToken)
    {
        return await mediaRepository.GetAsync(fileId, cancellationToken);
    }

    private static string ResolveFolder(CloudinaryOptions cfg, string uploadType)
    {
        if (string.IsNullOrWhiteSpace(uploadType))
        {
            throw new InvalidOperationException("Type la bat buoc de xac dinh folder upload.");
        }

        if (cfg.Folders.TryGetValue(uploadType, out var folderFromMap) && !string.IsNullOrWhiteSpace(folderFromMap))
        {
            return folderFromMap;
        }

        var availableTypes = string.Join(", ", cfg.Folders.Keys.OrderBy(x => x));
        throw new InvalidOperationException($"Type khong hop le hoac chua duoc cau hinh folder. Cac type hop le: {availableTypes}");
    }

    private CloudinaryOptions ResolveCloudinaryConfig()
    {
        var configured = options.Value;
        var cloudinaryUrl = configured.CloudinaryUrl;

        if (!TryParseCloudinaryUrl(cloudinaryUrl, out var cloudNameFromUrl, out var apiKeyFromUrl, out var apiSecretFromUrl))
        {
            throw new InvalidOperationException("Cloudinary config khong hop le. Bat buoc set Cloudinary:CloudinaryUrl trong appsettings theo format cloudinary://<api_key>:<api_secret>@<cloud_name>.");
        }

        return new CloudinaryOptions
        {
            CloudinaryUrl = cloudinaryUrl,
            CloudName = cloudNameFromUrl,
            ApiKey = apiKeyFromUrl,
            ApiSecret = apiSecretFromUrl,
            DefaultFolder = configured.DefaultFolder,
            Folders = configured.Folders
        };
    }

    private static bool TryParseCloudinaryUrl(string? cloudinaryUrl, out string cloudName, out string apiKey, out string apiSecret)
    {
        cloudName = string.Empty;
        apiKey = string.Empty;
        apiSecret = string.Empty;

        if (string.IsNullOrWhiteSpace(cloudinaryUrl))
        {
            return false;
        }

        if (!Uri.TryCreate(cloudinaryUrl.Trim(), UriKind.Absolute, out var uri))
        {
            return false;
        }

        if (!string.Equals(uri.Scheme, "cloudinary", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(uri.Host) || string.IsNullOrWhiteSpace(uri.UserInfo))
        {
            return false;
        }

        var userInfo = uri.UserInfo.Split(':', 2, StringSplitOptions.TrimEntries);
        if (userInfo.Length != 2 || string.IsNullOrWhiteSpace(userInfo[0]) || string.IsNullOrWhiteSpace(userInfo[1]))
        {
            return false;
        }

        cloudName = uri.Host;
        apiKey = Uri.UnescapeDataString(userInfo[0]);
        apiSecret = Uri.UnescapeDataString(userInfo[1]);
        return true;
    }

    private static Cloudinary CreateCloudinaryClient(CloudinaryOptions cfg)
    {
        var account = new Account(cfg.CloudName, cfg.ApiKey, cfg.ApiSecret);
        var cloudinary = new Cloudinary(account);
        cloudinary.Api.Secure = true;
        return cloudinary;
    }

    private static string ResolveUploadType(string? type, string? purpose)
    {
        var input = !string.IsNullOrWhiteSpace(type) ? type : purpose;
        if (string.IsNullOrWhiteSpace(input))
        {
            throw new InvalidOperationException("Type la bat buoc.");
        }

        return input.Trim().ToUpperInvariant();
    }

    private static string BuildThumbnailUrl(string secureUrl)
        => string.IsNullOrWhiteSpace(secureUrl)
            ? string.Empty
            : $"{secureUrl}?w=300&h=300&c=fill";

    private static string BuildAiOptimizedUrl(string secureUrl)
        => string.IsNullOrWhiteSpace(secureUrl)
            ? string.Empty
            : $"{secureUrl}?w=1024&q=auto&f=auto";

    private static string ResolveResourceType(string contentType)
    {
        if (contentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase))
        {
            return "video";
        }

        if (contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            return "image";
        }

        return "raw";
    }
}
