import { getAuthSession } from "../../auth/services/authStorage";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: null | string[];
};

export interface TeamMissionStatus {
  code: string;
  name: string;
  color: string;
}

export interface TeamMissionTeamSummary {
  teamId: string;
  teamName: string;
  isPrimary: boolean;
  responseStatus: string;
  respondedAt: string | null;
}

export interface TeamMissionListItem {
  missionId: string;
  missionCode: string;
  incidentId: string;
  incidentCode: string;
  objective: string;
  etaMinutes: number;
  status: TeamMissionStatus;
  teams: TeamMissionTeamSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMissionListData {
  items: TeamMissionListItem[];
}

export interface TeamMissionIncidentDetail {
  incidentId: string;
  incidentCode: string;
  description: string;
}

export interface TeamMissionTeamDetail {
  assignmentId: string;
  teamId: string;
  teamName: string;
  isPrimary: boolean;
  responseStatus: string;
  respondedAt: string | null;
  rejectionNote: string | null;
}

export interface TeamMissionStatusHistoryItem {
  changedAt: string;
  actionCode: string;
  fromState: string | null;
  toState: string;
  reasonCode: string | null;
  note: string | null;
}

export interface TeamMissionReportItem {
  reportId: string;
  reportTypeCode: string;
  summary: string;
  victimRescuedCount: number;
  victimUnreachableCount: number;
  casualtyCount: number;
  reportedAt: string;
}

export interface TeamMissionDetail {
  missionId: string;
  missionCode: string;
  incident: TeamMissionIncidentDetail;
  objective: string;
  etaMinutes: number;
  actualStartAt: string | null;
  actualEndAt: string | null;
  resultCode: string | null;
  resultSummary: string | null;
  status: TeamMissionStatus;
  teams: TeamMissionTeamDetail[];
  statusHistory: TeamMissionStatusHistoryItem[];
  reports: TeamMissionReportItem[];
  abortRequests: unknown[];
  supportRequests: unknown[];
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_API_BASE_URL = "https://rescuehub.onrender.com";

const getApiBaseUrl = () =>
  (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim();

const requestTeamApi = async <T>(path: string): Promise<T> => {
  const session = getAuthSession();
  if (!session?.accessToken) {
    throw new Error("Ban can dang nhap de xem nhiem vu doi");
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "GET",
    headers: {
      Accept: "text/plain",
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !result.success) {
    const backendError = result.errors?.[0] ?? result.message;
    throw new Error(backendError || "Tai nhiem vu doi that bai");
  }

  return result.data;
};

export const getTeamMissions = async (): Promise<TeamMissionListData> => {
  return requestTeamApi<TeamMissionListData>("/api/v1/team/missions");
};

export const getTeamMissionDetail = async (
  missionId: string,
): Promise<TeamMissionDetail> => {
  return requestTeamApi<TeamMissionDetail>(
    `/api/v1/team/missions/${missionId}`,
  );
};

export interface UpdateMissionStatusRequest {
  actionCode: string;
  notes: string;
}

export interface UpdateMissionStatusResponse {
  missionId: string;
  message: string;
}

const requestTeamApiWithBody = async <T>(
  path: string,
  method: "POST" | "PUT" | "PATCH",
  body: Record<string, unknown>,
): Promise<T> => {
  const session = getAuthSession();
  if (!session?.accessToken) {
    throw new Error("Ban can dang nhap de cap nhat trang thai nhiem vu");
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !result.success) {
    const backendError = result.errors?.[0] ?? result.message;
    throw new Error(backendError || "Cap nhat trang thai nhiem vu that bai");
  }

  return result.data;
};

export const updateMissionStatus = async (
  missionId: string,
  request: UpdateMissionStatusRequest,
): Promise<UpdateMissionStatusResponse> => {
  return requestTeamApiWithBody<UpdateMissionStatusResponse>(
    `/api/v1/team/missions/${missionId}/status`,
    "POST",
    {
      actionCode: request.actionCode,
      notes: request.notes,
    },
  );
};
