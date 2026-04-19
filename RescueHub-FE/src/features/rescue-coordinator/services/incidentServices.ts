export interface IncidentStatus {
  code: string;
  name: string;
  color: string | null;
}

export interface IncidentType {
  code: string;
  name: string;
}

export interface Channel {
  code: string;
  name: string;
}

export interface Reporter {
  name: string;
  phone: string;
}

export interface Location {
  lat: number;
  lng: number;
  addressText: string;
  landmark: string;
}

export interface IncidentDetail {
  id: string;
  incidentCode: string;
  isSOS: boolean;
  incidentType: IncidentType;
  channel: Channel;
  status: IncidentStatus;
  priority: IncidentStatus;
  severity: any;
  description: string;
  victimCountEstimate: number;
  injuredCountEstimate: number;
  vulnerableCountEstimate: number;
  needRelief: boolean;
  reporter: Reporter;
  location: Location;
  files: any[];
  latestAssessment: any;
  reportedAt: string;
  updatedAt: string;
}

export interface IncidentDetailResponse {
  success: boolean;
  message: string;
  data: IncidentDetail;
  errors: unknown;
}

export interface IncidentItem {
  id: string;
  incidentCode: string;
  status: IncidentStatus;
  reportedAt: string;
}

export interface IncidentsApiResponse {
  success: boolean;
  message: string;
  data: IncidentItem[];
  errors: unknown;
}

export interface VerifyIncidentRequest {
  verified: boolean;
  note: string;
}

export interface AssessIncidentRequest {
  priorityCode: string;
  severityCode: string;
  victimCountEstimate: number;
  injuredCountEstimate: number;
  vulnerableCountEstimate: number;
  requiresMedicalSupport: boolean;
  requiresEvacuation: boolean;
  notes: string;
}

export interface PriorityData {
  code: string;
  name: string;
  color: string;
}

export interface SeverityData {
  code: string;
  name: string;
  color: string;
}

export interface AssessIncidentResponse {
  success: boolean;
  message: string;
  data: {
    incidentId: string;
    priority: PriorityData;
    severity: SeverityData;
  };
  errors: unknown;
}

import { getAuthSession } from "../../auth/services/authStorage";

const INCIDENTS_API_URL = "https://rescuehub.onrender.com/api/v1/incidents";

const INCIDENT_DETAIL_API_URL = (id: string) => `${INCIDENTS_API_URL}/${id}`;

export async function getIncidents(accessToken: string): Promise<IncidentItem[]> {
  const response = await fetch(INCIDENTS_API_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Không thể tải danh sách sự cố: HTTP ${response.status}`);
  }

  const payload: IncidentsApiResponse = await response.json();

  if (!payload.success) {
    throw new Error(payload.message || "API trả về thất bại khi lấy sự cố");
  }

  return payload.data ?? [];
}

export async function getIncidentDetail(id: string, accessToken: string): Promise<IncidentDetail> {
  const url = INCIDENT_DETAIL_API_URL(id);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Không thể tải chi tiết sự cố ${id}: HTTP ${response.status}`);
  }

  const payload: IncidentDetailResponse = await response.json();

  if (!payload.success) {
    throw new Error(payload.message || "API trả về thất bại khi lấy chi tiết sự cố");
  }

  return payload.data;
}

export async function verifyIncident(
  incidentId: string,
  request: VerifyIncidentRequest,
  accessToken: string
): Promise<void> {
  const url = `${INCIDENTS_API_URL}/${incidentId}/verify`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Không thể xác minh sự cố ${incidentId}: HTTP ${response.status}`);
  }

  const payload = await response.json();

  if (!payload.success) {
    throw new Error(payload.message || "API xác minh thất bại");
  }
}

export async function assessIncident(
  incidentId: string,
  request: AssessIncidentRequest,
  accessToken: string
): Promise<AssessIncidentResponse> {
  const url = `${INCIDENTS_API_URL}/${incidentId}/assess`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Không thể đánh giá sự cố ${incidentId}: HTTP ${response.status}`);
  }

  const payload: AssessIncidentResponse = await response.json();

  if (!payload.success) {
    throw new Error(payload.message || "API đánh giá thất bại");
  }

  return payload;
}

export const getIncidentDetailWithAuth = async (
  incidentId: string,
): Promise<IncidentDetail> => {
  const session = getAuthSession();
  if (!session?.accessToken) {
    throw new Error("Bạn cần đăng nhập để xem chi tiết sự cố");
  }
  return getIncidentDetail(incidentId, session.accessToken);
};
