export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: null | string[];
};

export interface BootstrapIncidentType {
  code: string;
  name: string;
}

export interface BootstrapQuickAction {
  code: string;
  label: string;
}

export interface BootstrapData {
  hotline: string;
  defaultMapCenter: {
    lat: number;
    lng: number;
  };
  quickIncidentTypes: BootstrapIncidentType[];
  quickActions: BootstrapQuickAction[];
}

export interface PublicAlertItem {
  id: string;
  eventType: string;
  title: string;
  message: string;
  sentAt: string;
}

export interface PublicAlertsData {
  items: PublicAlertItem[];
}

export interface PublicMapMarker {
  id: string;
  markerType: string;
  title: string;
  position: {
    lat: number;
    lng: number;
    addressText?: string;
  };
  status?: {
    code?: string;
    name?: string;
    color?: string;
  };
}

export interface PublicMapData {
  markers: PublicMapMarker[];
}

export interface PublicRescueFormField {
  factorCode: string;
  factorName: string;
  valueType: string;
  unitCode?: string;
  sortOrder: number;
}

export interface PublicRescueFormData {
  incidentTypes: BootstrapIncidentType[];
  dynamicFields: PublicRescueFormField[];
  vulnerableGroups: Array<{
    code: string;
    name: string;
  }>;
}

export interface PublicIncidentRequest {
  incidentTypeCode: string;
  reporterName: string;
  reporterPhone: string;
  description?: string;
  victimCountEstimate?: number;
  injuredCountEstimate?: number;
  vulnerableCountEstimate?: number;
  location: {
    lat: number;
    lng: number;
    addressText?: string;
    landmark?: string;
  };
  sceneDetails?: Array<{
    factorCode: string;
    valueText?: string;
    valueNumber?: number;
    unitCode?: string;
  }>;
  fileIds?: string[];
}

export interface PublicSosRequest {
  incidentTypeCode: string;
  reporterName: string;
  reporterPhone: string;
  victimCountEstimate?: number;
  hasInjured: boolean;
  hasVulnerablePeople: boolean;
  description?: string;
  location: {
    lat: number;
    lng: number;
    addressText?: string;
    landmark?: string;
  };
  fileIds?: string[];
}

export interface PublicIncidentResponse {
  incidentId: string;
  incidentCode: string;
  trackingCode: string;
  status: {
    code: string;
    name: string;
    color: string;
  };
  reportedAt: string;
}

export interface PublicReliefRequestItem {
  supportTypeCode: string;
  requestedQty: number;
  unitCode?: string;
}

export interface PublicReliefRequest {
  requesterName: string;
  requesterPhone: string;
  householdCount?: number;
  note?: string;
  items: PublicReliefRequestItem[];
}

export interface PublicReliefResponse {
  reliefRequestId: string;
  requestCode: string;
  status: {
    code: string;
    name: string;
    color: string;
  };
  requestedAt: string;
}

export interface PublicTrackingOtpRequest {
  phone: string;
  purpose: "TRACKING";
}

export interface PublicTrackingOtpResponse {
  expiredAt: string;
  otpCode?: string;
}

export interface PublicVerifyTrackingOtpRequest {
  phone: string;
  otpCode: string;
  purpose: "TRACKING";
}

export interface PublicVerifyTrackingOtpResponse {
  trackingToken: string;
}

export interface PublicTrackingHistoryItem {
  time: string;
  statusName: string;
  note?: string;
}

export interface PublicTrackingRescueResponse {
  incidentCode: string;
  status: {
    code: string;
    name: string;
    color: string;
  };
  latestUpdate?: string;
  history: PublicTrackingHistoryItem[];
  canAckRescue: boolean;
  relatedRelief: {
    needed: boolean;
    status: string;
  };
}

export interface PublicTrackingReliefItem {
  supportTypeCode: string;
  requestedQty: number;
  approvedQty: number;
  fulfilledQty: number;
}

export interface PublicTrackingReliefDistribution {
  id: string;
  distribution_code: string;
  distributed_at: string;
  ack_method_code?: string;
}

export interface PublicTrackingReliefResponse {
  requestCode: string;
  status: {
    code: string;
    name: string;
    color: string;
  };
  latestUpdate?: string;
  requestedAt: string;
  items: PublicTrackingReliefItem[];
  canAckRelief: boolean;
  distributions: PublicTrackingReliefDistribution[];
}

export interface PublicTrackingMyHistoryItem {
  id?: string;
  code?: string;
  title?: string;
  description?: string;
  addressText?: string;
  statusName?: string;
  statusCode?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface PublicTrackingMyHistoryResponse {
  items: PublicTrackingMyHistoryItem[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
}

export interface PublicAckRequest {
  ackMethodCode: string;
  ackCode: string;
  note?: string;
}

export interface PublicAckResponse {
  acked: boolean;
  ackedAt: string;
}

export type UploadedMedia = {
  fileId?: string;
  FileId?: string;
  id?: string;
  Id?: string;
};
export interface BootstrapData {
  hotline: string;
  defaultMapCenter: {
    lat: number;
    lng: number;
  };
  quickIncidentTypes: quickIncidentTypes[];
  quickActions: quickActions[];
}
export interface quickIncidentTypes {
  code: string;
  name: string;
}
export interface quickActions {
  code: string;
  label: string;
}

export interface getPublicBootstrapResponse {
  success: boolean;
  message: string;
  data: BootstrapData;
  errors: null | string[];
}
