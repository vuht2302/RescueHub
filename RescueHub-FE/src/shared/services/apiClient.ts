export type ApiResponse<T> = {
    success: boolean;
    message: string;
    data: T;
    errors: null | string[];
};

const DEFAULT_API_BASE_URL = "https://rescuehub.onrender.com";

export const getApiBaseUrl = () =>
    (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim();

// 🔥 CORE REQUEST DÙNG CHUNG
export const requestApi = async <T>(
    path: string,
    init?: RequestInit,
): Promise<T> => {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
        ...init,
        headers: {
            Accept: "text/plain",
            ...(init?.headers ?? {}),
        },
    });

    const result = (await response.json()) as ApiResponse<T>;

    if (!response.ok || !result.success) {
        const backendError = result.errors?.[0] ?? result.message;
        throw new Error(backendError || "Yeu cau that bai");
    }

    return result.data;
};