using RescueHub.Modules.Media.Domain;

namespace RescueHub.Modules.Media.Application;

public interface IMediaService
{
    IReadOnlyCollection<string> GetSupportedUploadTypes();

    CloudinarySignatureResult CreateCloudinarySignature(CloudinarySignatureRequest request);

    Task<MediaAsset> UploadAsync(Stream fileStream, string fileName, string contentType, string purpose, CancellationToken cancellationToken);

    Task<MediaAsset> RegisterAsync(RegisterMediaRequest request, CancellationToken cancellationToken);

    Task<MediaAsset?> GetAsync(Guid fileId, CancellationToken cancellationToken);
}
