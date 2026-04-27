import type {
  ApiResponse,
  BootstrapData,
  CitizenReliefAckRequest,
  PublicAckRequest,
  PublicAckResponse,
  PublicAlertsData,
  PublicIncidentRequest,
  PublicIncidentResponse,
  PublicMeHistoryData,
  PublicMeHistoryReliefItem,
  PublicMeHistoryRescueItem,
  PublicMapData,
  PublicReliefRequest,
  PublicReliefResponse,
  PublicRescueFormData,
  PublicSosRequest,
  PublicTrackingOtpRequest,
  PublicTrackingOtpResponse,
  PublicTrackingMyHistoryResponse,
  PublicTrackingReliefResponse,
  PublicTrackingRescueResponse,
  PublicVerifyTrackingOtpRequest,
  PublicVerifyTrackingOtpResponse,
} from "../types/publicApi.types";

export type {
  BootstrapIncidentType,
  BootstrapQuickAction,
  BootstrapData,
  PublicAlertItem,
  PublicAlertsData,
  PublicMapMarker,
  PublicMapData,
  PublicRescueFormField,
  PublicRescueFormData,
  PublicIncidentRequest,
  PublicSosRequest,
  PublicIncidentResponse,
  PublicMeHistoryData,
  PublicMeHistoryReliefItem,
  PublicMeHistoryRescueItem,
  PublicReliefRequestItem,
  PublicReliefRequest,
  PublicReliefResponse,
  PublicTrackingOtpRequest,
  PublicTrackingOtpResponse,
  PublicTrackingMyHistoryItem,
  PublicTrackingMyHistoryResponse,
  PublicVerifyTrackingOtpRequest,
  PublicVerifyTrackingOtpResponse,
  PublicTrackingHistoryItem,
  PublicTrackingRescueResponse,
  PublicTrackingReliefItem,
  PublicTrackingReliefDistribution,
  PublicTrackingReliefResponse,
  PublicAckRequest,
  PublicAckResponse,
} from "../types/publicApi.types";

const DEFAULT_API_BASE_URL = "https://rescuehub.onrender.com";

const getApiBaseUrl = () =>
  (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim();

const buildTrackingHeaders = (trackingToken?: string): HeadersInit => {
  if (!trackingToken?.trim()) {
    return {};
  }

  return {
    Authorization: `Bearer ${trackingToken.trim()}`,
    "X-Tracking-Token": trackingToken.trim(),
  };
};

const requestPublicApi = async <T>(
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

export const getPublicBootstrap = async (): Promise<BootstrapData> => {
  return requestPublicApi<BootstrapData>("/api/v1/public/bootstrap");
};

export const getPublicAlerts = async (): Promise<PublicAlertsData> => {
  return requestPublicApi<PublicAlertsData>("/api/v1/public/alerts");
};

export const getPublicMapData = async (
  lat: number,
  lng: number,
  radiusKm = 3,
): Promise<PublicMapData> => {
  const query = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    radiusKm: radiusKm.toString(),
  });

  return requestPublicApi<PublicMapData>(
    `/api/v1/public/map-data?${query.toString()}`,
  );
};

export const getPublicRescueForm = async (): Promise<PublicRescueFormData> => {
  return requestPublicApi<PublicRescueFormData>("/api/v1/public/rescue-form");
};

export const createPublicSos = async (
  payload: PublicSosRequest,
): Promise<PublicIncidentResponse> => {
  return requestPublicApi<PublicIncidentResponse>(
    "/api/v1/public/incidents/sos",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
};

export const createPublicIncident = async (
  payload: PublicIncidentRequest,
): Promise<PublicIncidentResponse> => {
  return requestPublicApi<PublicIncidentResponse>("/api/v1/public/incidents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

export const createPublicReliefRequest = async (
  payload: PublicReliefRequest,
  accessToken?: string,
): Promise<PublicReliefResponse> => {
  return requestPublicApi<PublicReliefResponse>(
    "/api/v1/public/relief-requests",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken?.trim()
          ? {
              Authorization: `Bearer ${accessToken.trim()}`,
            }
          : {}),
      },
      body: JSON.stringify(payload),
    },
  );
};

export interface ReliefCatalogItem {
  id: string;
  itemCode: string;
  itemName: string;
  unitCode: string;
  categoryName: string;
}

export const getReliefItems = async (
  token: string,
): Promise<ReliefCatalogItem[]> => {
  const API_BASE =
    (import.meta.env.VITE_API_BASE_URL ?? "https://rescuehub.onrender.com").trim();

  const res = await fetch(`${API_BASE}/api/v1/manager/items`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message ?? "Không thể tải danh sách vật phẩm");
  }

  const items = json.data?.items ?? json.data ?? [];
  return items
    .filter((item: { isActive: boolean }) => item.isActive !== false)
    .map((item: {
      id: string;
      itemCode: string;
      itemName: string;
      unitCode: string;
      itemCategory: { name: string };
    }) => ({
      id: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      unitCode: item.unitCode,
      categoryName: item.itemCategory?.name ?? "",
    }));
};

export const requestPublicTrackingOtp = async (
  payload: PublicTrackingOtpRequest,
): Promise<PublicTrackingOtpResponse> => {
  return requestPublicApi<PublicTrackingOtpResponse>(
    "/api/v1/public/tracking/request-otp",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
};

export const verifyPublicTrackingOtp = async (
  payload: PublicVerifyTrackingOtpRequest,
): Promise<PublicVerifyTrackingOtpResponse> => {
  return requestPublicApi<PublicVerifyTrackingOtpResponse>(
    "/api/v1/public/tracking/verify-otp",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
};

export const getPublicTrackingRescue = async (
  trackingCode: string,
  trackingToken?: string,
): Promise<PublicTrackingRescueResponse> => {
  return requestPublicApi<PublicTrackingRescueResponse>(
    `/api/v1/public/tracking/rescue/${encodeURIComponent(trackingCode)}`,
    {
      headers: {
        ...buildTrackingHeaders(trackingToken),
      },
    },
  );
};

export const ackPublicTrackingRescue = async (
  trackingCode: string,
  payload: PublicAckRequest,
  trackingToken?: string,
): Promise<PublicAckResponse> => {
  return requestPublicApi<PublicAckResponse>(
    `/api/v1/public/tracking/rescue/${encodeURIComponent(trackingCode)}/ack`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...buildTrackingHeaders(trackingToken),
      },
      body: JSON.stringify(payload),
    },
  );
};

export const getPublicTrackingRelief = async (
  requestCode: string,
  trackingToken?: string,
): Promise<PublicTrackingReliefResponse> => {
  return requestPublicApi<PublicTrackingReliefResponse>(
    `/api/v1/public/tracking/relief/${encodeURIComponent(requestCode)}`,
    {
      headers: {
        ...buildTrackingHeaders(trackingToken),
      },
    },
  );
};

export const ackPublicTrackingRelief = async (
  requestCode: string,
  payload: PublicAckRequest,
  trackingToken?: string,
): Promise<PublicAckResponse> => {
  return requestPublicApi<PublicAckResponse>(
    `/api/v1/public/tracking/relief/${encodeURIComponent(requestCode)}/ack`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...buildTrackingHeaders(trackingToken),
      },
      body: JSON.stringify(payload),
    },
  );
};

type PublicMyTrackingQuery = {
  phone: string;
  page?: number;
  pageSize?: number;
  trackingToken?: string;
};

const buildMyTrackingQuery = ({
  phone,
  page = 1,
  pageSize = 20,
}: Omit<PublicMyTrackingQuery, "trackingToken">): string => {
  const query = new URLSearchParams({
    phone: phone.trim(),
    page: String(page),
    pageSize: String(pageSize),
  });

  return query.toString();
};

export const getPublicTrackingMyRescues = async ({
  phone,
  page = 1,
  pageSize = 20,
  trackingToken,
}: PublicMyTrackingQuery): Promise<PublicTrackingMyHistoryResponse> => {
  return requestPublicApi<PublicTrackingMyHistoryResponse>(
    `/api/v1/public/tracking/my-rescues?${buildMyTrackingQuery({
      phone,
      page,
      pageSize,
    })}`,
    {
      headers: {
        ...buildTrackingHeaders(trackingToken),
      },
    },
  );
};

export const getPublicTrackingMyReliefRequests = async ({
  phone,
  page = 1,
  pageSize = 20,
  trackingToken,
}: PublicMyTrackingQuery): Promise<PublicTrackingMyHistoryResponse> => {
  return requestPublicApi<PublicTrackingMyHistoryResponse>(
    `/api/v1/public/tracking/my-relief-requests?${buildMyTrackingQuery({
      phone,
      page,
      pageSize,
    })}`,
    {
      headers: {
        ...buildTrackingHeaders(trackingToken),
      },
    },
  );
};

export const getPublicMeHistory = async (
  accessToken?: string,
): Promise<PublicMeHistoryData> => {
  return requestPublicApi<PublicMeHistoryData>("/api/v1/public/me/history", {
    headers: {
      ...(accessToken?.trim()
        ? {
            Authorization: `Bearer ${accessToken.trim()}`,
          }
        : {}),
    },
  });
};

export const ackPublicMeReliefRequest = async (
  requestCode: string,
  payload: CitizenReliefAckRequest,
  accessToken?: string,
): Promise<PublicAckResponse> => {
  return requestPublicApi<PublicAckResponse>(
    `/api/v1/public/me/relief-requests/${encodeURIComponent(requestCode)}/ack`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken?.trim()
          ? {
              Authorization: `Bearer ${accessToken.trim()}`,
            }
          : {}),
      },
      body: JSON.stringify(payload),
    },
  );
};

export const markReliefRequestNotReceived = async (
  requestCode: string,
  payload: CitizenReliefAckRequest,
  accessToken?: string,
): Promise<PublicAckResponse> => {
  return requestPublicApi<PublicAckResponse>(
    `/api/v1/public/me/relief-requests/${encodeURIComponent(requestCode)}/not-received`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken?.trim()
          ? {
              Authorization: `Bearer ${accessToken.trim()}`,
            }
          : {}),
      },
      body: JSON.stringify(payload),
    },
  );
};
