namespace RescueHub.Modules.MasterData.Domain;

public sealed record WorkflowDefinition(string EntityType, IReadOnlyCollection<string> States);
