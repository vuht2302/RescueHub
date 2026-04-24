import { requestApi } from "./apiClient";

export interface ReportPeriod {
    fromDate: string;
    toDate: string;
}

export interface ReportOverview {
    period: ReportPeriod;

    incidents: {
        total: number;
        sos: number;
        open: number;
    };

    missions: {
        total: number;
        inProgress: number;
        completed: number;
    };

    relief: {
        requestsTotal: number;
        pending: number;
        approved: number;
        distributionsTotal: number;
    };
}

export const getReportOverview = async (): Promise<ReportOverview> => {
    return requestApi("/api/v1/admin/reports/overview");
};

export interface StatusItem {
    statusCode: string;
    count: number;
}

export interface IncidentByStatusResponse {
    period: ReportPeriod;
    items: StatusItem[];
}

export const getIncidentByStatus = async (): Promise<IncidentByStatusResponse> => {
    return requestApi("/api/v1/admin/reports/incidents/by-status");
};

export interface MissionByStatusResponse {
    period: ReportPeriod;
    items: StatusItem[];
}

export const getMissionByStatus = async (): Promise<MissionByStatusResponse> => {
    return requestApi("/api/v1/admin/reports/missions/by-status");
};

export interface ReliefStatusItem {
    statusCode: string;
    count: number;
}

export interface ReliefByStatusResponse {
    period: ReportPeriod;
    requests: ReliefStatusItem[];
    distributions: ReliefStatusItem[];
}

export const getReliefByStatus = async (): Promise<ReliefByStatusResponse> => {
    return requestApi("/api/v1/admin/reports/relief/by-status");
};

export interface HotspotItem {
    adminAreaId: string | null;
    adminAreaCode: string | null;
    adminAreaName: string | null;
    adminAreaLevelCode: string | null;
    fallbackAddress: string;
    incidentCount: number;
    lat?: number;
    lng?: number;
}

export interface HotspotResponse {
    period: ReportPeriod;
    topN: number;
    items: HotspotItem[];
}

export const getHotspots = async (): Promise<HotspotResponse> => {
    return requestApi("/api/v1/admin/reports/hotspots");
};