import { requestApi } from "./apiClient";

export interface CreateSupportRequestPayload {
    supportTypeCode: string;
    detailNote: string;
}

export const createSupportRequest = async (
    missionId: string,
    payload: CreateSupportRequestPayload
) => {
    return requestApi<string>(
        `/api/v1/team/missions/${missionId}/support-requests`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        }
    );
};