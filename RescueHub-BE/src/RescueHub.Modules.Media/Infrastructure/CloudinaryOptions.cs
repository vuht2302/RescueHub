namespace RescueHub.Modules.Media.Infrastructure;

public sealed class CloudinaryOptions
{
    public const string SectionName = "Cloudinary";

    public string? CloudinaryUrl { get; init; }

    public string CloudName { get; init; } = string.Empty;

    public string ApiKey { get; init; } = string.Empty;

    public string ApiSecret { get; init; } = string.Empty;

    public string DefaultFolder { get; init; } = "flood-rescue/misc";

    public Dictionary<string, string> Folders { get; init; } = new(StringComparer.OrdinalIgnoreCase);
}
