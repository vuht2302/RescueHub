namespace RescueHub.Modules.Auth.Infrastructure;

public sealed class InMemoryRefreshTokenRepository
{
    private readonly Dictionary<string, string> _tokens = new(StringComparer.Ordinal);

    public void Save(string refreshToken, string username) => _tokens[refreshToken] = username;
}
