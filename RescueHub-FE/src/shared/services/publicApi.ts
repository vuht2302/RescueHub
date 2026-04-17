import type {
  ApiResponse,
  BootstrapData,
  PublicAckRequest,
  PublicAckResponse,
  PublicAlertsData,
  PublicIncidentRequest,
  PublicIncidentResponse,
  PublicMapData,
  PublicReliefRequest,
  PublicReliefResponse,
  PublicRescueFormData,
  PublicSosRequest,
  PublicTrackingOtpRequest,
  PublicTrackingOtpResponse,
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
  PublicReliefRequestItem,
  PublicReliefRequest,
  PublicReliefResponse,
  PublicTrackingOtpRequest,
  PublicTrackingOtpResponse,
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
): Promise<PublicReliefResponse> => {
  return requestPublicApi<PublicReliefResponse>(
    "/api/v1/public/relief-requests",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
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
