import type { AuthSession, InternalRole } from "../types";
import { logout as callLogoutApi } from "./authService";

const AUTH_STORAGE_KEY = "rescuehub.auth.session";

const notifyAuthChanged = () => {
  window.dispatchEvent(new Event("auth-changed"));
};

export const setAuthSession = (session: AuthSession): void => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  notifyAuthChanged();
};

export const getAuthSession = (): AuthSession | null => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (
      !parsed?.accessToken ||
      !parsed?.user ||
      !Array.isArray(parsed.user.roles)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const clearAuthSession = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  notifyAuthChanged();
};

export const hasAnyRole = (
  session: AuthSession | null,
  roles: InternalRole[],
): boolean => {
  if (!session) return false;

  return session.user.roles.some((role) => roles.includes(role));
};

export const performLogout = async (): Promise<void> => {
  const session = getAuthSession();

  try {
    if (session) {
      await callLogoutApi(session.accessToken);
    }
  } catch (error) {
    console.error("Logout API error (continuing with local clear):", error);
  } finally {
    clearAuthSession();
  }
};
