import { requestApi } from "./apiClient";


export interface BaseOption {
    code: string;
    name: string;
    color?: string | null;
}

// scene factor
export interface SceneFactor {
    code: string;
    name: string;
    valueType: "TEXT" | "NUMBER";
    unitCode: string | null;
    sortOrder: number;
}

export interface MasterDataBootstrap {
    incidentTypes: BaseOption[];
    channels: BaseOption[];
    priorityLevels: BaseOption[];
    severityLevels: BaseOption[];
    skills: BaseOption[];
    skillLevels: BaseOption[];
    vehicleTypes: BaseOption[];
    vehicleCapabilities: BaseOption[];
    warehouseTypes: BaseOption[];
    units: BaseOption[];
    sceneFactors: SceneFactor[];
}

export interface SceneFactorsResponse {
    items: SceneFactor[];
}


export const getMasterDataBootstrap = async (): Promise<MasterDataBootstrap> => {
    return requestApi("/api/v1/master-data/bootstrap");
};

export const getSceneFactors = async (): Promise<SceneFactor[]> => {
    const res = await requestApi<SceneFactorsResponse>(
        "/api/v1/master-data/scene-factors"
    );

    return res.items.sort((a, b) => a.sortOrder - b.sortOrder);
};