using System.Collections.Concurrent;
using RescueHub.Modules.Media.Domain;

namespace RescueHub.Modules.Media.Infrastructure;

public sealed class InMemoryMediaRepository : IMediaRepository
{
    private readonly ConcurrentDictionary<Guid, MediaAsset> _store = new();

    public Task SaveAsync(MediaAsset asset, CancellationToken cancellationToken)
    {
        _store[asset.FileId] = asset;
        return Task.CompletedTask;
    }

    public Task<MediaAsset?> GetAsync(Guid fileId, CancellationToken cancellationToken)
    {
        _store.TryGetValue(fileId, out var asset);
        return Task.FromResult(asset);
    }
}
