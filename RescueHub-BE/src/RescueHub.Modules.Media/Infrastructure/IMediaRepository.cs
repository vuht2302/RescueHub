using RescueHub.Modules.Media.Domain;

namespace RescueHub.Modules.Media.Infrastructure;

public interface IMediaRepository
{
    Task SaveAsync(MediaAsset asset, CancellationToken cancellationToken);

    Task<MediaAsset?> GetAsync(Guid fileId, CancellationToken cancellationToken);
}
