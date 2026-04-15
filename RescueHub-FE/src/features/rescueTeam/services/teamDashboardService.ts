import { getAuthSession } from "../../auth/services/authStorage";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: null | string[];
};

export interface TeamDashboardStatus {
  code: string;
  name: string;
  color: string;
}

export interface TeamDashboardMission {
  missionId: string;
  missionCode: string;
  objective: string;
  status: TeamDashboardStatus;
  updatedAt: string;
}

export interface TeamDashboardData {
  pendingResponseCount: number;
  activeMissionCount: number;
  completedTodayCount: number;
  pendingAbortCount: number;
  pendingSupportCount: number;
  recentMissions: TeamDashboardMission[];
}

const DEFAULT_API_BASE_URL = "https://rescuehub.onrender.com";

const getApiBaseUrl = () =>
  (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim();

const requestTeamApi = async <T>(path: string): Promise<T> => {
  const session = getAuthSession();
  if (!session?.accessToken) {
    throw new Error("Ban can dang nhap de xem dashboard doi");
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
    throw new Error(backendError || "Tai dashboard doi that bai");
  }

  return result.data;
};

export const getTeamDashboard = async (): Promise<TeamDashboardData> => {
  return requestTeamApi<TeamDashboardData>("/api/v1/team/dashboard");
};
