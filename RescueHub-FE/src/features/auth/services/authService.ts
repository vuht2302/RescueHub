import type {
  ApiResponse,
  AuthSession,
  InternalRole,
  LoginRequest,
} from "../types";

const DEFAULT_API_BASE_URL = "https://rescuehub.onrender.com";

const getApiBaseUrl = () =>
  (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim();

export const login = async (payload: LoginRequest): Promise<AuthSession> => {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      Accept: "text/plain",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as ApiResponse<AuthSession>;

  if (!response.ok || !result.success) {
    const backendError = result.errors?.[0] ?? result.message;
    throw new Error(backendError || "Dang nhap that bai");
  }

  return result.data;
};

export const logout = async (accessToken: string): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
    method: "POST",
    headers: {
      Accept: "text/plain",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const result = (await response.json()) as ApiResponse<null>;

  if (!response.ok || !result.success) {
    const backendError = result.errors?.[0] ?? result.message;
    throw new Error(backendError || "Dang xuat that bai");
  }
};

export const getDefaultRouteForRoles = (roles: InternalRole[]): string => {
  if (roles.includes("ADMIN")) return "/admin";
  if (roles.includes("MANAGER")) return "/manager";
  if (roles.includes("RELIEF_OPERATOR")) return "/rescue-coordinator";
  if (roles.includes("TEAM_LEADER") || roles.includes("TEAM_MEMBER")) {
    return "/rescue-team";
  }

  // Citizen has empty roles by default.
  return "/home";
};
