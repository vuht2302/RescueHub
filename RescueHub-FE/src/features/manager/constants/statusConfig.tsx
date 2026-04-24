export const REQUEST_STATUS: Record<string, { label: string; cls: string }> = {
  NEW: { label: "Mới", cls: "bg-blue-100 text-blue-700" },
  PENDING: { label: "Chờ duyệt", cls: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "Đã duyệt", cls: "bg-green-100 text-green-700" },
  REJECTED: { label: "Từ chối", cls: "bg-red-100 text-red-700" },
  FULFILLED: { label: "Đã cứu trợ", cls: "bg-emerald-100 text-emerald-700" },
};

export const ISSUE_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Đang chờ", cls: "bg-yellow-100 text-yellow-700" },
  PROCESSING: { label: "Đang xử lý", cls: "bg-blue-100 text-blue-700" },
  DELIVERED: { label: "Đã giao", cls: "bg-emerald-100 text-emerald-700" },
  ISSUED: { label: "Đã xuất", cls: "bg-purple-100 text-purple-700" },
  CANCELLED: { label: "Đã hủy", cls: "bg-red-100 text-red-600" },
};

export const DIST_STATUS: Record<string, { label: string; cls: string }> = {
  NEW: { label: "Mới", cls: "bg-blue-100 text-blue-700" },
  PENDING: { label: "Đang chờ xử lý", cls: "bg-yellow-100 text-yellow-700" },
  COMPLETED: { label: "Hoàn thành", cls: "bg-green-100 text-green-700" },
  ACKNOWLEDGED: {
    label: "Đã xác nhận",
    cls: "bg-emerald-100 text-emerald-700",
  },
  CANCELLED: { label: "Đã hủy", cls: "bg-red-100 text-red-600" },
};

export const CAMPAIGN_STATUS: Record<string, { label: string; cls: string }> = {
  PLANNED: { label: "Đang lên kế hoạch", cls: "bg-blue-100 text-blue-700" },
  ACTIVE: { label: "Đang hoạt động", cls: "bg-green-100 text-green-700" },
  COMPLETED: { label: "Hoàn thành", cls: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Đã hủy", cls: "bg-red-100 text-red-600" },
};

export function StatusBadge({
  code,
  statusMap,
}: {
  code: string;
  statusMap: Record<string, { label: string; cls: string }>;
}) {
  const cfg = statusMap[code] ?? {
    label: code,
    cls: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

export function formatDate(iso?: string | null) {
  if (!iso) return "--";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--";
  }
}
