import { ApiResponse } from "@/src/features/auth/types";

export interface TeamStatus {
  code: "AVAILABLE" | "BUSY" | "OFFLINE" | "INACTIVE";
  name: string;
  color: string | null;
}

export interface TeamLeader {
  id: string;
  username: string;
  displayName: string;
  phone: string;
}

export interface AdminArea {
  id: string;
  code: string;
  name: string;
  levelCode: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Team {
  id: string;
  code: string;
  name: string;
  status: TeamStatus;
  leader: TeamLeader;
  homeAdminArea: AdminArea;
  maxParallelMissions: number;
  currentLocation: Coordinates;
  notes: string;
  memberCount: number;
  vehicleCount: number;
  createdAt: string;
}

export interface DispatchTeamsResponse {
  items: Team[];
}

export interface TeamAssignment {
  teamId: string;
  isPrimaryTeam: boolean;
  memberIds: string[];
  vehicleIds: string[];
}

export interface DispatchMissionRequest {
  objective: string;
  priorityCode: string;
  teamAssignments: TeamAssignment[];
  etaMinutes: number;
  note: string;
}

const DEFAULT_API_BASE_URL = "https://rescuehub.onrender.com";

const getApiBaseUrl = () =>
  (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim();

export const getDispatchTeams = async (
  accessToken: string,
): Promise<Team[]> => {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/manager/teams`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const result = (await response.json()) as ApiResponse<DispatchTeamsResponse>;

  if (!response.ok || !result.success) {
    const backendError = result.errors?.[0] ?? result.message;
    throw new Error(backendError || "Khong the lay danh sach team");
  }

  return result.data.items;
};

export const dispatchMission = async (
  incidentId: string,
  accessToken: string,
  payload: DispatchMissionRequest,
): Promise<void> => {
  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/incidents/${incidentId}/missions`,
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
    throw new Error(backendError || "Khong the dieu phoi team");
  }
};
