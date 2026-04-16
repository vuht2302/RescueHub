import { requestApi } from "./apiClient";


export type WorkflowEntityType = "INCIDENT" | "MISSION";

export interface WorkflowTransition {
    actionCode: string;
    fromStateCode: string | null;
    toStateCode: string;
    usedCount: number;
}

export interface WorkflowData {
    entityType: WorkflowEntityType;
    states: string[];
    transitions: WorkflowTransition[];
}


export const getWorkflow = async (
    entityType: WorkflowEntityType
): Promise<WorkflowData> => {
    return requestApi<WorkflowData>(
        `/api/v1/admin/workflows/${entityType}`
    );
};