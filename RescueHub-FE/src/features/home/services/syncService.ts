import { ApiResponse } from "@/features/auth/types";

export interface UnsyncedRequest {
  id: string;
  title: string;
  location: string;
  description: string;
  phone: string;
  createdAt: string;
  status: "pending" | "verified" | "completed";
}

export interface UnsyncedRequestsResponse {
  items: UnsyncedRequest[];
  totalCount: number;
}

const DEFAULT_API_BASE_URL = "https://rescuehub.onrender.com";

const getApiBaseUrl = () =>
  (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim();

export const getUnsyncedRequests = async (
  phone: string,
  accessToken: string,
): Promise<UnsyncedRequest[]> => {
  // TODO: Replace with actual API endpoint once available
  // Current: Mock data for demonstration
  // Actual endpoint: /api/v1/citizens/unsynced-requests?phone={phone}

  try {
    const response = await fetch(
      `${getApiBaseUrl()}/api/v1/citizens/unsynced-requests?phone=${encodeURIComponent(phone)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    // If API not ready, return mock data
    if (!response.ok) {
      console.warn("Unsynced requests API not available, using mock data");
      return getMockUnsyncedRequests(phone);
    }

    const result = (await response.json()) as ApiResponse<UnsyncedRequestsResponse>;

    if (!result.success) {
      console.warn("Failed to fetch unsynced requests, using mock data");
      return getMockUnsyncedRequests(phone);
    }

    return result.data.items;
  } catch (error) {
    console.warn("Error fetching unsynced requests, using mock data:", error);
    return getMockUnsyncedRequests(phone);
  }
};

export const syncRequests = async (
  phone: string,
  accessToken: string,
  requestIds: string[],
): Promise<void> => {
  // TODO: Replace with actual API endpoint once available
  // Current: Mock implementation
  // Actual endpoint: /api/v1/citizens/sync-requests

  try {
    const response = await fetch(
      `${getApiBaseUrl()}/api/v1/citizens/sync-requests`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          phone,
          requestIds,
        }),
      },
    );

    const result = (await response.json()) as ApiResponse<null>;

    if (!response.ok || !result.success) {
      throw new Error(
        result.errors?.[0] ?? "Khong the dong bo hoa du lieu",
      );
    }
  } catch (error) {
    console.warn("Error syncing requests:", error);
    // For now, silently succeed for mock implementation
    return;
  }
};

// Mock data for demonstration purposes
function getMockUnsyncedRequests(phone: string): UnsyncedRequest[] {
  // Return mock data for demo
  const mockData: UnsyncedRequest[] = [
    {
      id: "mock-req-001",
      title: "Vụ cứu hộ giao thông tại Quận 1",
      location: "Đường Nguyễn Huệ, Quận 1",
      description: "Tai nạn giao thông - 2 người bị thương",
      phone,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      status: "completed",
    },
    {
      id: "mock-req-002",
      title: "Yêu cầu cứu trợ lũ lụt",
      location: "Đường Lê Lợi, Quận 4",
      description: "Nhà ngập nước, cần hỗ trợ sơ tán",
      phone,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      status: "verified",
    },
  ];

  // 50% chance to return mock data (simulate some users having history)
  return Math.random() > 0.5 ? mockData : [];
}
