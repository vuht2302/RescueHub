export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: null | string[];
};

const DEFAULT_API_BASE_URL = "https://rescuehub.onrender.com";

export const getApiBaseUrl = () =>
  (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim();

const isNetworkOnline = (): boolean => {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
};

interface QueuedRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  path: string;
  init?: RequestInit;
}

const offlineQueue: QueuedRequest[] = [];

const processOfflineQueue = async () => {
  while (offlineQueue.length > 0 && isNetworkOnline()) {
    const request = offlineQueue.shift();
    if (request) {
      try {
        const result = await requestApiInternal(request.path, request.init);
        request.resolve(result);
      } catch (err) {
        request.reject(err as Error);
      }
    }
  }
};

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("[Network] Back online - processing offline queue");
    processOfflineQueue();
  });
}

const SESSION_KEY = "rescuehub.auth.session";

const getAccessToken = (): string | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.accessToken ?? null;
  } catch {
    return null;
  }
};

const isTokenExpired = (): boolean => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return true;
    const session = JSON.parse(raw);
    if (!session?.expiresAt) return true;
    return new Date(session.expiresAt) < new Date();
  } catch {
    return true;
  }
};

const requestApiInternal = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const token = getAccessToken();
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "text/plain",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !result.success) {
    const backendError = result.errors?.[0] ?? result.message;

    if (response.status === 401 || isTokenExpired()) {
      console.warn("Token het han → logout");
      localStorage.removeItem(SESSION_KEY);
      window.location.href = "/login";
    }

    throw new Error(backendError || "Yeu cau that bai");
  }

  return result.data;
};

export const requestApi = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  if (!isNetworkOnline()) {
    console.warn("[Network] Offline - request queued:", path);
    return new Promise((resolve, reject) => {
      offlineQueue.push({
        resolve: resolve as (value: unknown) => void,
        reject,
        path,
        init,
      });
    });
  }

  try {
    return await requestApiInternal<T>(path, init);
  } catch (err) {
    if (!isNetworkOnline()) {
      console.warn("[Network] Request failed due to offline:", path);
      return new Promise((resolve, reject) => {
        offlineQueue.push({
          resolve: resolve as (value: unknown) => void,
          reject,
          path,
          init,
        });
      });
    }
    throw err;
  }
};

export const isOnline = isNetworkOnline;
