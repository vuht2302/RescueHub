import { requestApi } from "./apiClient";

export interface LocationPayload {
    lat: number;
    lng: number;
    addressText: string;
    landmark?: string;
}

export interface CreateSOSPayload {
    incidentTypeCode: string;
    reporterName: string;
    reporterPhone: string;
    victimCountEstimate: number;
    hasInjured: boolean;
    hasVulnerablePeople: boolean;
    description: string;
    location: LocationPayload;
    fileIds: string[];
}

export const createSOSIncident = async (payload: CreateSOSPayload) => {
    return requestApi<string>("/api/v1/public/incidents/sos", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
};