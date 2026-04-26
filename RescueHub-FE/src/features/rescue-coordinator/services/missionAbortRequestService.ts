import { ApiResponse } from "@/src/features/auth/types";

export interface AbortRequestTeamInfo {
  teamId: string;
  teamCode: string;
  teamName: string;
}

export interface AbortRequestMissionInfo {
  id: string;
  code: string;
  statusCode: string;
  primaryTeam: AbortRequestTeamInfo | null;
}

export interface AbortRequestIncidentInfo {
  id: string;
  code: string;
  statusCode: string;
}

export interface MissionAbortRequestItem {
  abortRequestId: string;
  statusCode: string;
  reasonCode: string;
  detailNote: string | null;
  requestedAt: string;
  decidedAt: string | null;
  mission: AbortRequestMissionInfo;
  incident: AbortRequestIncidentInfo;
}

export interface MissionAbortRequestListData {
  items: MissionAbortRequestItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface GetMissionAbortRequestsParams {
  statusCode?: string;
  page?: number;
  pageSize?: number;
}

export interface MissionAbortDecisionPayload {
  decisionCode: "APPROVE" | "REJECT";
  note: string;
}

const DEFAULT_API_BASE_URL = "https://rescuehub.onrender.com";

const getApiBaseUrl = () =>
  (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim();

export const getMissionAbortRequests = async (
  accessToken: string,
  params?: GetMissionAbortRequestsParams,
): Promise<MissionAbortRequestListData> => {
  const searchParams = new URLSearchParams();

  if (params?.statusCode) searchParams.set("statusCode", params.statusCode);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));

  const query = searchParams.toString();
  const url = `${getApiBaseUrl()}/api/v1/incidents/missions/abort-requests${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const result = (await response.json()) as ApiResponse<MissionAbortRequestListData>;

  if (!response.ok || !result.success) {
    const backendError = result.errors?.[0] ?? result.message;
    throw new Error(backendError || "Khong the lay danh sach yeu cau huy");
  }

  return result.data;
};

export const decideMissionAbortRequest = async (
  missionId: string,
  abortRequestId: string,
  payload: MissionAbortDecisionPayload,
  accessToken: string,
): Promise<void> => {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/incidents/missions/${missionId}/abort-requests/${abortRequestId}/decision`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const result = (await response.json()) as ApiResponse<null>;

  if (!response.ok || !result.success) {
    const backendError = result.errors?.[0] ?? result.message;
    throw new Error(backendError || "Khong the xu ly yeu cau huy");
  }
};
