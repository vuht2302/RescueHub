const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ?? "https://rescuehub.onrender.com"
).trim();

const RELIEF_POINTS_API_URL = `${API_BASE}/api/v1/manager/relief-points`;

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function apiFetch<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const payload = await response.json();

  if (!response.ok || payload.success === false) {
    const message =
      (Array.isArray(payload.errors) ? payload.errors[0] : null) ??
      payload.message ??
      `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload.data as T;
}

export interface ReliefPointLocation {
  lat: number;
  lng: number;
}

export interface ReliefPointStatus {
  code: string;
  name: string;
  color: string | null;
}

export interface ReliefPointCampaign {
  id: string;
  code: string;
  name: string;
}

export interface ReliefPointItem {
  id: string;
  code: string;
  name: string;
  status: ReliefPointStatus;
  addressText: string;
  location: ReliefPointLocation;
  campaign: ReliefPointCampaign;
}

export interface CreateReliefPointPayload {
  code: string;
  name: string;
  campaignId: string;
  adminAreaId: string;
  addressText: string;
  location: ReliefPointLocation;
  managerUserId: string;
  statusCode: string;
  opensAt: string;
  closesAt: string | null;
}

export interface ReliefPointCampaignOption {
  id: string;
  code: string;
  name: string;
}

export interface ReliefPointAdminAreaOption {
  id: string;
  code?: string;
  name: string;
}

export interface ReliefPointStatusOption {
  code: string;
  name: string;
  color: string | null;
}

export interface ReliefPointFormOptions {
  campaigns: ReliefPointCampaignOption[];
  adminAreas: ReliefPointAdminAreaOption[];
  statusCodes: ReliefPointStatusOption[];
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors: null | string[];
}

interface WarehouseLite {
  adminArea: {
    id: string;
    code?: string;
    name: string;
  } | null;
}

const toUniqueBy = <T>(items: T[], keyGetter: (item: T) => string) => {
  const map = new Map<string, T>();
  items.forEach((item) => {
    const key = keyGetter(item);
    if (!map.has(key)) map.set(key, item);
  });
  return Array.from(map.values());
};

const requestRaw = async <T>(url: string, token: string): Promise<T> => {
  const response = await fetch(url, {
    method: "GET",
    headers: authHeaders(token),
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || payload.success === false) {
    const message =
      (Array.isArray(payload.errors) ? payload.errors[0] : null) ??
      payload.message ??
      `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload.data;
};

export async function getReliefPointFormOptions(
  token: string,
): Promise<ReliefPointFormOptions> {
  try {
    const options = await requestRaw<{
      campaigns?: ReliefPointCampaignOption[];
      adminAreas?: ReliefPointAdminAreaOption[];
      statusCodes?: ReliefPointStatusOption[];
      reliefPointStatusCodes?: ReliefPointStatusOption[];
    }>(`${API_BASE}/api/v1/manager/relief-points/options`, token);

    return {
      campaigns: options.campaigns ?? [],
      adminAreas: options.adminAreas ?? [],
      statusCodes: options.statusCodes ?? options.reliefPointStatusCodes ?? [],
    };
  } catch {
    const [distributionOptions, warehouses, masterData] = await Promise.all([
      requestRaw<{
        campaigns?: ReliefPointCampaignOption[];
      }>(`${API_BASE}/api/v1/manager/distributions/options`, token),
      requestRaw<WarehouseLite[] | { items: WarehouseLite[] }>(
        `${API_BASE}/api/v1/manager/warehouses`,
        token,
      ),
      requestRaw<{
        reliefPointStatuses?: ReliefPointStatusOption[];
        statusCodes?: ReliefPointStatusOption[];
      }>(`${API_BASE}/api/v1/master-data/bootstrap`, token).catch(() => ({
        reliefPointStatuses: [],
        statusCodes: [],
      })),
    ]);

    const warehouseItems = Array.isArray(warehouses)
      ? warehouses
      : (warehouses.items ?? []);
    const adminAreas = toUniqueBy(
      warehouseItems
        .map((w) => w.adminArea)
        .filter((area): area is NonNullable<typeof area> => Boolean(area))
        .map((area) => ({
          id: area.id,
          code: area.code,
          name: area.name,
        })),
      (area) => area.id,
    );

    const fallbackStatuses =
      masterData.reliefPointStatuses ??
      masterData.statusCodes ??
      ([
        { code: "OPEN", name: "Hoạt động", color: null },
        { code: "CLOSE", name: "Không hoạt động", color: null },
      ] as ReliefPointStatusOption[]);

    return {
      campaigns: distributionOptions.campaigns ?? [],
      adminAreas,
      statusCodes: fallbackStatuses,
    };
  }
}

export async function getManagerReliefPoints(
  token: string,
  statusCode?: string,
): Promise<ReliefPointItem[]> {
  const url = statusCode
    ? `${RELIEF_POINTS_API_URL}?statusCode=${statusCode}`
    : RELIEF_POINTS_API_URL;

  const data = await apiFetch<ReliefPointItem[] | { items: ReliefPointItem[] }>(
    url,
    {
      method: "GET",
      headers: authHeaders(token),
    },
  );

  return Array.isArray(data) ? data : (data.items ?? []);
}

export async function createManagerReliefPoint(
  token: string,
  payload: CreateReliefPointPayload,
): Promise<ReliefPointItem | null> {
  const data = await apiFetch<ReliefPointItem | null>(RELIEF_POINTS_API_URL, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  return data;
}

export async function deleteManagerReliefPoint(
  token: string,
  reliefPointId: string,
): Promise<boolean> {
  await apiFetch<null>(`${RELIEF_POINTS_API_URL}/${reliefPointId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  return true;
}
