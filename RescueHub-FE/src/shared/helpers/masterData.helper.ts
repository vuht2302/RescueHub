import { BaseOption, SceneFactor } from "../services/masterData.service";

export const toSelectOptions = (data: BaseOption[]) => {
    return data.map((item) => ({
        label: item.name,
        value: item.code,
    }));
};

export const mapSceneFactorsToForm = (factors: SceneFactor[]) => {
    return factors.map((f) => ({
        name: f.code,
        label: f.name,
        type: f.valueType === "NUMBER" ? "number" : "text",
        unit: f.unitCode,
    }));
};