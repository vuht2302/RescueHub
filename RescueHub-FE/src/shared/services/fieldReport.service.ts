import { requestApi } from "./apiClient";

// ===== TYPES =====
export interface SceneDetailPayload {
    factorCode: string;
    valueText?: string;
    valueNumber?: number;
    unitCode?: string;
}

export interface CreateFieldReportPayload {
    reportTypeCode: string;
    summary: string;
    victimRescuedCount: number;
    victimUnreachableCount: number;
    casualtyCount: number;
    nextActionNote: string;
    sceneDetails: SceneDetailPayload[];
    fileIds: string[];
}

export const createFieldReport = async (
    missionId: string,
    payload: CreateFieldReportPayload
) => {
    return requestApi<any>(
        `/api/v1/team/missions/${missionId}/field-reports`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        }
    );
};