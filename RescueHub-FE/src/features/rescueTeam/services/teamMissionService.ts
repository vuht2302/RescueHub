import { getAuthSession } from "../../auth/services/authStorage";

import {
  ApiResponse,
  TeamMissionListData,
  TeamMissionDetail,
  ListMembersResponse,
  TeamRespondMissionRequest,
  TeamRespondMissionResponse,
  TeamAbortMissionRequest,
  TeamAbortMissionResponse,
  UpdateMissionStatusResponse,
  DistributionHistoryItem,
  DistributionHistoryResponse,
  DistributionStatusUpdateRequest,
  DistributionStatusUpdateResponse,
} from "../types/mission";

export type {
  TeamMissionDetail,
  TeamMissionListItem,
  TeamMemberItem,
  TeamMemberSkill,
  DistributionHistoryItem,
} from "../types/mission";

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
// Lấy danh sách nhiệm vụ của đội cứu hộ hiện tại
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

export const getTeamMembers = async (): Promise<ListMembersResponse> => {
  return requestTeamApi<ListMembersResponse>("/api/v1/team/my-members");
};

// Hàm xử lý yêu cầu chấp nhận nhiệm vụ
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
// Hàm xử lý yêu cầu hủy nhiệm vụ
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

// Lấy lịch sử phân phối cứu trợ của đội
export const getDistributionHistory = async (): Promise<DistributionHistoryResponse> => {
  return requestTeamApi<DistributionHistoryResponse>("/api/v1/team/distributions/history");
};

// Cập nhật trạng thái phân phối cứu trợ
export const updateDistributionStatus = async (
  distributionId: string,
  request: DistributionStatusUpdateRequest,
): Promise<DistributionStatusUpdateResponse> => {
  return requestTeamApiWithBody<DistributionStatusUpdateResponse>(
    `/api/v1/team/distributions/${distributionId}/status`,
    "PATCH",
    {
      statusCode: request.statusCode,
      note: request.note,
    },
  );
};
