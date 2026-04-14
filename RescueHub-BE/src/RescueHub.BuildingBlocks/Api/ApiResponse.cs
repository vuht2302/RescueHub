namespace RescueHub.BuildingBlocks.Api;

public sealed class ApiResponse<T>
{
    public bool Success { get; init; }

    public string Message { get; init; } = string.Empty;

    public T? Data { get; init; }

    public IReadOnlyCollection<ApiError>? Errors { get; init; }

    public static ApiResponse<T> Ok(T? data, string message) =>
        new()
        {
            Success = true,
            Message = message,
            Data = data
        };

    public static ApiResponse<T> Fail(string message, IReadOnlyCollection<ApiError>? errors = null) =>
        new()
        {
            Success = false,
            Message = message,
            Errors = errors,
            Data = default
        };
}

public sealed record ApiError(string Field, string Message);
