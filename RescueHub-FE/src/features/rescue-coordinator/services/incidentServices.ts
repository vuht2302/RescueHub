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

export interface IncidentFile {
  fileId: string;
  contentType: "IMAGE" | "VIDEO" | "DOCUMENT" | string;
  url: string;
}

export interface IncidentItem {
  id: string;
  incidentCode: string;
  status: IncidentStatus;
  location: {
    lat: number;
    lng: number;
    addressText: string;
    landmark: string;
  };
  handlingTeams: Array<{
    teamId: string;
    teamCode: string;
    teamName: string;
    isPrimaryTeam: boolean;
    missionId: string;
    missionCode: string;
    missionStatusCode: string;
    assignedAt: string;
  }>;
  reportedAt: string;
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
  files: IncidentFile[];
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

export async function getIncidents(
  accessToken: string,
): Promise<IncidentItem[]> {
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

  const payload = await response.json();

  if (!payload.success) {
    throw new Error(payload.message || "API trả về thất bại khi lấy sự cố");
  }

  const items: IncidentItem[] = Array.isArray(payload.data) ? payload.data : [];

  return items;
}

export async function getIncidentDetail(
  id: string,
  accessToken: string,
): Promise<IncidentDetail> {
  const url = INCIDENT_DETAIL_API_URL(id);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Không thể tải chi tiết sự cố ${id}: HTTP ${response.status}`,
    );
  }

  const payload: IncidentDetailResponse = await response.json();

  if (!payload.success) {
    throw new Error(
      payload.message || "API trả về thất bại khi lấy chi tiết sự cố",
    );
  }

  return payload.data;
}

export async function verifyIncident(
  incidentId: string,
  request: VerifyIncidentRequest,
  accessToken: string,
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
    throw new Error(
      `Không thể xác minh sự cố ${incidentId}: HTTP ${response.status}`,
    );
  }

  const payload = await response.json();

  if (!payload.success) {
    throw new Error(payload.message || "API xác minh thất bại");
  }
}

export async function assessIncident(
  incidentId: string,
  request: AssessIncidentRequest,
  accessToken: string,
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
    throw new Error(
      `Không thể đánh giá sự cố ${incidentId}: HTTP ${response.status}`,
    );
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

export async function rejectIncident(
  incidentId: string,
  request: VerifyIncidentRequest,
  accessToken: string,
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
    throw new Error(
      `Không thể từ chối sự cố ${incidentId}: HTTP ${response.status}`,
    );
  }

  const payload = await response.json();

  if (!payload.success) {
    throw new Error(payload.message || "API từ chối thất bại");
  }
}

// ============ Relief Hotspot Types ============

export interface HotspotCenter {
  lat: number;
  lng: number;
}

export interface ReliefHotspotItem {
  adminAreaId: string | null;
  areaCode: string;
  areaName: string;
  requestCount: number;
  pendingCount: number;
  fulfilledCount: number;
  rejectedCount: number;
  cancelledCount: number;
  latestRequestedAt: string;
  center: HotspotCenter | null;
}

export interface ReliefHotspotFilters {
  statusCode: string | null;
  days: number;
  top: number;
  fromTime: string;
}

export interface ReliefHotspotResponse {
  success: boolean;
  message: string;
  data: {
    filters: ReliefHotspotFilters;
    totalRequests: number;
    hotspotCount: number;
    items: ReliefHotspotItem[];
  };
  errors: null | string[];
}

export async function getReliefHotspots(
  accessToken: string,
  filters?: Partial<ReliefHotspotFilters>,
): Promise<ReliefHotspotResponse["data"]> {
  const params = new URLSearchParams();
  if (filters?.statusCode) params.set("statusCode", filters.statusCode);
  if (filters?.days !== undefined) params.set("days", String(filters.days));
  if (filters?.top !== undefined) params.set("top", String(filters.top));

  const query = params.toString();
  const url = `${INCIDENTS_API_URL}/relief-requests/hotspots${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Không thể tải vùng cứu trợ: HTTP ${response.status}`);
  }

  const payload: ReliefHotspotResponse = await response.json();

  if (!payload.success) {
    throw new Error(
      payload.message || "API trả về thất bại khi lấy vùng cứu trợ",
    );
  }

  return payload.data;
}

// ============ Relief Request Types ============

export interface Requester {
  name: string;
  phone: string;
}

export interface ReliefRequestIncident {
  id: string;
  code: string;
  description: string;
}

export interface ReliefRequestCampaign {
  id: string;
  code: string;
  name: string;
}

export interface RequestedItem {
  reliefRequestItemId: string;
  supportTypeCode: string;
  supportTypeName: string;
  requestedQty: number;
  approvedQty: number | null;
  defaultApprovedQty: number;
  unitCode: string;
}

export interface ReliefRequestItem {
  reliefRequestId: string;
  requestCode: string;
  sourceTypeCode: string;
  status: IncidentStatus;
  requester: Requester;
  householdCount: number;
  addressText: string;
  incident: ReliefRequestIncident | null;
  campaign: ReliefRequestCampaign | null;
  requestedItems: RequestedItem[];
  requestedAt: string;
  updatedAt: string;
}

export interface ReliefRequestListResponse {
  success: boolean;
  message: string;
  data: {
    items: ReliefRequestItem[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  errors: null | string[];
}

export interface CampaignOption {
  campaignId: string;
  campaignCode: string;
  campaignName: string;
  status: string;
  linkedIncidentId: string | null;
  startAt: string;
  endAt: string | null;
}

export interface DecisionOption {
  code: string;
  name: string;
}

export interface ReliefRequestDetail {
  reliefRequestId: string;
  requestCode: string;
  sourceTypeCode: string;
  status: IncidentStatus;
  requester: Requester;
  householdCount: number;
  addressText: string;
  note: string;
  incident: ReliefRequestIncident | null;
  campaign: ReliefRequestCampaign | null;
  requestedItems: RequestedItem[];
  decisionOptions: DecisionOption[];
  campaignOptions: CampaignOption[];
  updatedAt: string;
  requestedAt: string;
}

export interface ReliefRequestDetailResponse {
  success: boolean;
  message: string;
  data: ReliefRequestDetail;
  errors: null | string[];
}

export interface RejectReliefRequestBody {
  reason: string;
}

export interface StandardizeReliefRequestBody {
  decisionCode: string;
  householdCount: number;
  addressText: string;
  requestedItems: Array<{
    reliefRequestItemId: string;
    supportTypeCode: string;
    requestedQty: number;
    approvedQty: number;
  }>;
  note: string;
}

const RELIEF_REQUESTS_API_URL = `${INCIDENTS_API_URL}/relief-requests`;

export async function getReliefRequests(
  accessToken: string,
): Promise<ReliefRequestListResponse["data"]> {
  const response = await fetch(RELIEF_REQUESTS_API_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Không thể tải danh sách yêu cầu cứu trợ: HTTP ${response.status}`,
    );
  }

  const payload: ReliefRequestListResponse = await response.json();

  if (!payload.success) {
    throw new Error(
      payload.message || "API trả về thất bại khi lấy yêu cầu cứu trợ",
    );
  }

  return payload.data;
}

export async function getReliefRequestDetail(
  reliefRequestId: string,
  accessToken: string,
): Promise<ReliefRequestDetail> {
  const url = `${RELIEF_REQUESTS_API_URL}/${reliefRequestId}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Không thể tải chi tiết yêu cầu cứu trợ: HTTP ${response.status}`,
    );
  }

  const payload: ReliefRequestDetailResponse = await response.json();

  if (!payload.success) {
    throw new Error(
      payload.message || "API trả về thất bại khi lấy chi tiết yêu cầu cứu trợ",
    );
  }

  return payload.data;
}

export async function standardizeReliefRequest(
  reliefRequestId: string,
  body: StandardizeReliefRequestBody,
  accessToken: string,
): Promise<void> {
  const url = `${RELIEF_REQUESTS_API_URL}/${reliefRequestId}/standardize`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `Không thể chuẩn hoá yêu cầu cứu trợ: HTTP ${response.status}`,
    );
  }

  const payload = await response.json();
  if (!payload.success) {
    throw new Error(payload.message || "API chuẩn hoá thất bại");
  }
}

export async function rejectReliefRequest(
  reliefRequestId: string,
  body: RejectReliefRequestBody,
  accessToken: string,
): Promise<void> {
  const url = `${RELIEF_REQUESTS_API_URL}/${reliefRequestId}/reject`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `Không thể từ chối yêu cầu cứu trợ: HTTP ${response.status}`,
    );
  }

  const payload = await response.json();
  if (!payload.success) {
    throw new Error(payload.message || "API từ chối thất bại");
  }
}
