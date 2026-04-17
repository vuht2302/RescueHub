type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: null | string[];
};

type UploadedMedia = {
  fileId?: string;
  FileId?: string;
  id?: string;
  Id?: string;
};

const DEFAULT_API_BASE_URL = "https://rescuehub.onrender.com";

const getApiBaseUrl = () =>
  (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim();

const requestUploadApi = async <T>(
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

export const uploadIncidentMedia = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", "INCIDENT_MEDIA");

  const data = await requestUploadApi<UploadedMedia>("/api/v1/media/upload", {
    method: "POST",
    body: formData,
  });

  const fileId = data.fileId ?? data.FileId ?? data.id ?? data.Id;
  if (!fileId) {
    throw new Error("Upload thanh cong nhung khong nhan duoc fileId");
  }

  return fileId;
};
