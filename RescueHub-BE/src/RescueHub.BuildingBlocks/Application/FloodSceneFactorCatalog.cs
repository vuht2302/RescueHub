namespace RescueHub.BuildingBlocks.Application;

public sealed record FloodSceneFactorDefinition(
    string Code,
    string Name,
    string ValueType,
    string? UnitCode,
    int SortOrder);

public static class FloodSceneFactorCatalog
{
    public const string WaterLevel = "WATER_LEVEL";
    public const string CurrentLevel = "CURRENT_LEVEL";
    public const string RoadAccess = "ROAD_ACCESS";
    public const string BoatAccess = "BOAT_ACCESS";
    public const string IsolatedArea = "ISOLATED_AREA";
    public const string PowerOutage = "POWER_OUTAGE";
    public const string FoodShortage = "FOOD_SHORTAGE";
    public const string DrinkingWaterShortage = "DRINKING_WATER_SHORTAGE";
    public const string MedicalNeed = "MEDICAL_NEED";
    public const string EvacuationNeeded = "EVACUATION_NEEDED";

    public static IReadOnlyList<FloodSceneFactorDefinition> Definitions { get; } =
    [
        new(WaterLevel, "Muc nuoc", "NUMBER", "M", 1),
        new(CurrentLevel, "Dong chay", "TEXT", null, 2),
        new(RoadAccess, "Duong bo tiep can", "TEXT", null, 3),
        new(BoatAccess, "Tiep can bang thuyen", "TEXT", null, 4),
        new(IsolatedArea, "Khu vuc bi co lap", "TEXT", null, 5),
        new(PowerOutage, "Mat dien", "TEXT", null, 6),
        new(FoodShortage, "Thieu luong thuc", "TEXT", null, 7),
        new(DrinkingWaterShortage, "Thieu nuoc uong", "TEXT", null, 8),
        new(MedicalNeed, "Nhu cau y te", "TEXT", null, 9),
        new(EvacuationNeeded, "Can so tan", "TEXT", null, 10)
    ];

    public static string NormalizeCode(string factorCode)
    {
        var normalized = factorCode.Trim().ToUpperInvariant();
        return normalized switch
        {
            // Legacy aliases kept for backward compatibility.
            "FLOOD_DEPTH_M" => WaterLevel,
            "WATER_CURRENT" => CurrentLevel,
            "ACCESSIBILITY" => RoadAccess,
            _ => normalized
        };
    }

    public static bool IsSupported(string factorCode)
    {
        var normalized = NormalizeCode(factorCode);
        return Definitions.Any(x => string.Equals(x.Code, normalized, StringComparison.OrdinalIgnoreCase));
    }
}
