using RescueHub.Modules.Media.Domain;

namespace RescueHub.Modules.Media.Application;

public interface IMediaService
{
    CloudinarySignatureResult CreateCloudinarySignature(CloudinarySignatureRequest request);

    Task<MediaAsset> RegisterAsync(RegisterMediaRequest request, CancellationToken cancellationToken);
}
