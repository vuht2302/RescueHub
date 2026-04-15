type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: null | string[];
};

export interface BootstrapIncidentType {
  code: string;
  name: string;
}

export interface BootstrapQuickAction {
  code: string;
  label: string;
}

export interface BootstrapData {
  hotline: string;
  defaultMapCenter: {
    lat: number;
    lng: number;
  };
  quickIncidentTypes: BootstrapIncidentType[];
  quickActions: BootstrapQuickAction[];
}

export interface PublicAlertItem {
  id: string;
  eventType: string;
  title: string;
  message: string;
  sentAt: string;
}

export interface PublicAlertsData {
  items: PublicAlertItem[];
}

export interface PublicIncidentRequest {
  incidentTypeCode: string;
  reporterName: string;
  reporterPhone: string;
  description: string;
  victimCountEstimate: number;
  injuredCountEstimate: number;
  vulnerableCountEstimate: number;
  location: {
    lat: number;
    lng: number;
    addressText: string;
    landmark: string;
  };
  sceneDetails: Array<{
    factorCode: string;
    valueText: string;
    valueNumber: number;
    unitCode: string;
  }>;
  fileIds: string[];
}

type UploadedMedia = {
  fileId?: string;
  FileId?: string;
  id?: string;
  Id?: string;
};

const DEFAULT_API_BASE_URL = "https://rescuehub.onrender.com";

const getApiBaseUrl = () =>
  (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim();

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

export const createPublicIncident = async (
  payload: PublicIncidentRequest,
): Promise<void> => {
  await requestPublicApi<null>("/api/v1/public/incidents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

export const uploadIncidentMedia = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", "INCIDENT_MEDIA");

  const data = await requestPublicApi<UploadedMedia>("/api/v1/media/upload", {
    method: "POST",
    body: formData,
  });

  const fileId = data.fileId ?? data.FileId ?? data.id ?? data.Id;
  if (!fileId) {
    throw new Error("Upload thanh cong nhung khong nhan duoc fileId");
  }

  return fileId;
};
