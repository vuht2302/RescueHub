const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ?? "https://rescuehub.onrender.com"
).trim();

const MANAGER_BASE = `${API_BASE}/api/v1/manager`;

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors: null | string[];
}

async function apiFetch<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || payload.success === false) {
    const message =
      (Array.isArray(payload.errors) ? payload.errors[0] : null) ??
      payload.message ??
      `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload.data;
}

export interface DashboardStatusInfo {
  code: string;
  name: string;
  color: string | null;
}

export interface DashboardCampaignInfo {
  id: string;
  code: string;
  name: string;
}

export interface DashboardAdminAreaInfo {
  id: string;
  code: string;
  name: string;
}

export interface RecentDistribution {
  distributionId: string;
  distributionCode: string;
  status: DashboardStatusInfo;
  campaign: DashboardCampaignInfo | null;
  adminArea: DashboardAdminAreaInfo | null;
  createdAt: string;
}

export interface ManagerDashboardData {
  warehouseActiveCount: number;
  campaignActiveCount: number;
  reliefPointOpenCount: number;
  distributionPendingCount: number;
  distributionCompletedTodayCount: number;
  reliefRequestPendingCount: number;
  unresolvedStockAlertCount: number;
  totalOnHandQty: number;
  recentDistributions: RecentDistribution[];
}

export async function getManagerDashboard(
  token: string,
): Promise<ManagerDashboardData> {
  return apiFetch<ManagerDashboardData>(`${MANAGER_BASE}/dashboard`, {
    method: "GET",
    headers: authHeaders(token),
  });
}
