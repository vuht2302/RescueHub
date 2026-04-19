export type MissionStatus =
  | "Chờ nhận"
  | "Đang di chuyển"
  | "Đang xử lý"
  | "Đã hoàn tất"
  | "Tạm dừng";

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

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: null | string[];
}

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
export interface UpdateMissionStatusResponse {
  missionId: string;
  actionCode: string;
  updatedAt: string;
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
