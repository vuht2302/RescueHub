namespace RescueHub.Modules.Auth.Domain;

public sealed record UserIdentity(Guid Id, string DisplayName, string Phone, IReadOnlyCollection<string> Roles);
