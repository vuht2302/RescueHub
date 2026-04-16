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
  color: string | null;
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

export interface TeamMissionAbortRequestItem {
  requestId: string;
  reasonCode: string;
  detailNote: string;
  decisionStatus: string;
  requestedAt: string;
  decidedAt: string | null;
}

export interface TeamMissionSupportRequestItem {
  requestId: string;
  supportTypeCode: string;
  detailNote: string;
  decisionStatus: string;
  requestedAt: string;
  decidedAt: string | null;
}

export interface TeamMissionActionCodeCatalogItem {
  actionCode: string;
  targetStatusCode: string;
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
  abortRequests: TeamMissionAbortRequestItem[];
  supportRequests: TeamMissionSupportRequestItem[];
  allActionCodes: string[];
  actionCodeCatalog: TeamMissionActionCodeCatalogItem[];
  historyActionCodes: string[];
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
  note?: string;
}

export interface UpdateMissionStatusResponse {
  missionId: string;
  actionCode: string;
  updatedAt: string;
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
      note: request.note,
    },
  );
};

export interface TeamMemberStatus {
  code: string;
  name: string;
  color: string | null;
}

export interface TeamMemberLocation {
  lat: number;
  lng: number;
}

export interface TeamMemberSkill {
  teamMemberSkillId: string;
  skillId: string;
  skillCode: string;
  skillName: string;
  levelCode: string;
  isPrimary: boolean;
}

export interface TeamMemberItem {
  memberId: string;
  fullName: string;
  phone: string;
  userId: string | null;
  username: string | null;
  displayName: string | null;
  isTeamLeader: boolean;
  status: TeamMemberStatus;
  lastKnownLocation: TeamMemberLocation | null;
  skills: TeamMemberSkill[];
  notes: string | null;
  createdAt: string;
}

export interface TeamMembersGroupItem {
  teamId: string;
  teamCode: string;
  teamName: string;
  status: TeamMemberStatus;
  members: TeamMemberItem[];
}

export interface ListMembersResponse {
  items: TeamMembersGroupItem[];
}

export const getTeamMembers = async (): Promise<ListMembersResponse> => {
  return requestTeamApi<ListMembersResponse>("/api/v1/team/my-members");
};

export interface TeamRespondMissionRequest {
  response: "ACCEPT" | "REJECT";
  reasonCode?: string;
  note?: string;
}

export interface TeamRespondMissionResponse {
  missionId: string;
  response: string;
  respondedAt: string;
}

export interface TeamAbortMissionRequest {
  reasonCode: string;
  detailNote: string;
}

export interface TeamAbortMissionResponse {
  missionId: string;
  abortRequestId?: string;
  reasonCode?: string;
  detailNote?: string;
  createdAt?: string;
}

export const respondToMission = async (
  missionId: string,
  request: TeamRespondMissionRequest,
): Promise<TeamRespondMissionResponse> => {
  return requestTeamApiWithBody<TeamRespondMissionResponse>(
    `/api/v1/team/missions/${missionId}/respond`,
    "POST",
    {
      response: request.response,
      reasonCode: request.reasonCode,
      note: request.note,
    },
  );
};

export const requestMissionAbort = async (
  missionId: string,
  request: TeamAbortMissionRequest,
): Promise<TeamAbortMissionResponse> => {
  return requestTeamApiWithBody<TeamAbortMissionResponse>(
    `/api/v1/team/missions/${missionId}/abort-requests`,
    "POST",
    {
      reasonCode: request.reasonCode,
      detailNote: request.detailNote,
    },
  );
};
