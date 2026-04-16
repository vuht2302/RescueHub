export interface CurrentMission {
  id: string;
  incidentCode: string;
  location: string;
  assignedTeams: {
    id: string;
    name: string;
    status: "en-route" | "on-scene" | "completed" | "cancelled";
    etaMinutes: number;
    progress: number; // 0-100
    cancelReason?: string;
    lastUpdate: string;
  }[];
  priority: "critical" | "high" | "medium" | "low";
  startedAt: string;
  description: string;
}

export interface CurrentMissionsResponse {
  missions: CurrentMission[];
}

const BASE_URL = import.meta.env.VITE_API_URL || "https://rescuehub.onrender.com";

export async function getCurrentMissions(accessToken: string): Promise<CurrentMissionsResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/coordinator/current-missions`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch current missions: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching current missions:", error);
    // Return mock data for testing
    return getMockCurrentMissions();
  }
}

function getMockCurrentMissions(): CurrentMissionsResponse {
  return {
    missions: [
      {
        id: "MISSION001",
        incidentCode: "INC-2026-0425-001",
        location: "Ngã tư Võ Văn Kiệt & Lê Lợi, Quận 1",
        priority: "critical",
        startedAt: "2026-04-16T14:30:00Z",
        description: "Tai nạn giao thông, 2 xe máy đâm nhau",
        assignedTeams: [
          {
            id: "TEAM001",
            name: "Đội PCCC Q1 - Ca 2",
            status: "on-scene",
            etaMinutes: 0,
            progress: 75,
            lastUpdate: "2026-04-16T14:45:30Z",
          },
          {
            id: "TEAM002",
            name: "Đội Y tế Q1",
            status: "on-scene",
            etaMinutes: 0,
            progress: 80,
            lastUpdate: "2026-04-16T14:44:15Z",
          },
        ],
      },
      {
        id: "MISSION002",
        incidentCode: "INC-2026-0425-002",
        location: "Đường Trần Hưng Đạo, Quận 1",
        priority: "high",
        startedAt: "2026-04-16T14:15:00Z",
        description: "Cháy nhà dân, cần sơ tán dân cư",
        assignedTeams: [
          {
            id: "TEAM003",
            name: "Đội PCCC Q1 - Ca 1",
            status: "en-route",
            etaMinutes: 5,
            progress: 45,
            lastUpdate: "2026-04-16T14:46:00Z",
          },
          {
            id: "TEAM004",
            name: "Đội cứu hộ Q2",
            status: "en-route",
            etaMinutes: 8,
            progress: 30,
            lastUpdate: "2026-04-16T14:45:45Z",
          },
          {
            id: "TEAM005",
            name: "Đội kiểm soát giao thông",
            status: "cancelled",
            etaMinutes: 0,
            progress: 0,
            cancelReason: "Xe bị hỏng trên đường",
            lastUpdate: "2026-04-16T14:42:30Z",
          },
        ],
      },
      {
        id: "MISSION003",
        incidentCode: "INC-2026-0425-003",
        location: "Bến xe Miền Đông, Q. Bình Thạnh",
        priority: "medium",
        startedAt: "2026-04-16T13:45:00Z",
        description: "Người bị mắc kẹt, cần giải cứu",
        assignedTeams: [
          {
            id: "TEAM006",
            name: "Đội cứu hộ Q2 - Ca 1",
            status: "on-scene",
            etaMinutes: 0,
            progress: 90,
            lastUpdate: "2026-04-16T14:46:15Z",
          },
        ],
      },
    ],
  };
}
