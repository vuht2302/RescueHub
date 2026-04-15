export type RescueEvent = {
  id: string;
  name: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  latitude: number;
  longitude: number;
  type: "relief" | "rescue" | "evacuation" | "medical" | "other";
  priority: "low" | "medium" | "high" | "critical";
  status: "planning" | "ongoing" | "completed" | "cancelled";
  team: string;
  requiredResources: string[];
  budget: string;
  createdAt: string;
  createdBy: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  location: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  lastRestocked: string;
};

export type Transaction = {
  id: string;
  date: string;
  type: "import" | "export";
  supplier: string;
  items: number;
  quantity: number;
  status: "Hoàn tất" | "Đang xử lý" | "Chờ xác nhận";
};

export type ExpiryItem = {
  id: string;
  product: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  location: string;
  status: "Safe" | "Warning" | "Critical" | "Expired";
  daysRemaining: number;
};
