import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Package,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  DistributionHistoryItem,
  getDistributionHistory,
  updateDistributionStatus,
} from "../services/teamMissionService";

const statusStyles: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  PENDING: "bg-gray-100 text-gray-700",
};

const DISTRIBUTION_STATUS_OPTIONS = [
  { code: "COMPLETED", label: "Hoàn tất", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { code: "IN_PROGRESS", label: "Đang thực hiện", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { code: "PENDING", label: "Chờ xử lý", color: "bg-gray-100 text-gray-700 border-gray-200" },
];

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface ReliefHistoryViewProps {
  onReload?: () => void;
  isReloading?: boolean;
}

export const ReliefHistoryView: React.FC<ReliefHistoryViewProps> = ({
  onReload,
  isReloading = false,
}) => {
  const [history, setHistory] = useState<DistributionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItem, setSelectedItem] = useState<DistributionHistoryItem | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState<DistributionHistoryItem | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const PAGE_SIZE = 10;

  const handleOpenStatusModal = (item: DistributionHistoryItem) => {
    setSelectedDistribution(item);
    setSelectedStatus(item.status.code);
    setStatusNote(item.note || "");
    setSubmitError(null);
    setIsStatusModalOpen(true);
  };

  const handleSubmitStatus = async () => {
    if (!selectedDistribution) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await updateDistributionStatus(selectedDistribution.distributionId, {
        statusCode: selectedStatus,
        note: statusNote.trim() || undefined,
      });
      setIsStatusModalOpen(false);
      setSelectedDistribution(null);
      setStatusNote("");
      void loadHistory();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadHistory = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await getDistributionHistory();
      setHistory(response.items);
      setTotalItems(response.totalItems);
      setTotalPages(Math.max(1, response.totalPages));
      setCurrentPage(1);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Không tải được lịch sử cứu trợ.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const filteredHistory = history.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.distributionCode.toLowerCase().includes(term) ||
      item.campaign.name.toLowerCase().includes(term) ||
      item.recipient.name.toLowerCase().includes(term) ||
      item.recipient.address.toLowerCase().includes(term) ||
      item.reliefPoint.name.toLowerCase().includes(term)
    );
  });

  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const completedCount = history.filter(
    (item) => item.status.code === "COMPLETED",
  ).length;

  const completedPages = Math.ceil(completedCount / PAGE_SIZE);

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages] as const;
    }
    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ] as const;
    }
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ] as const;
  };

  return (
    <>
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedItem(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="relative bg-gradient-to-br from-blue-950 to-blue-800 px-6 py-5 text-white">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="absolute right-3 top-3 rounded-full p-1.5 hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
              <h3 className="text-lg font-black font-primary">
                Chi tiết phân phối cứu trợ
              </h3>
              <p className="text-sm text-blue-200 mt-1">
                {selectedItem.distributionCode}
              </p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Chiến dịch
                  </p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {selectedItem.campaign.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedItem.campaign.code}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Điểm cứu trợ
                  </p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {selectedItem.reliefPoint.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedItem.reliefPoint.code}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Người nhận
                  </p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {selectedItem.recipient.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedItem.recipient.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Địa chỉ
                  </p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {selectedItem.recipient.address}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Số dòng
                  </p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {selectedItem.lineCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Trạng thái
                  </p>
                  <span
                    className={`inline-block mt-1 text-xs px-2 py-1 rounded-md font-bold ${
                      statusStyles[selectedItem.status.code] ??
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {selectedItem.status.name}
                  </span>
                </div>
              </div>

              {selectedItem.note && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Ghi chú
                  </p>
                  <div className="mt-1 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                    <p className="text-sm text-amber-800">
                      {selectedItem.note}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Ngày tạo
                  </p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {formatDateTime(selectedItem.createdAt)}
                  </p>
                </div>
                {selectedItem.ackAt && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Ngày xác nhận
                    </p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">
                      {formatDateTime(selectedItem.ackAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="col-span-1 xl:col-span-2 rounded-xl bg-white border border-gray-200 p-6 overflow-auto shadow-sm">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-blue-950 font-primary flex items-center gap-2">
              <Package size={24} />
              Lịch sử cứu trợ
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Xem lại lịch sử phân phối cứu trợ của đội
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void loadHistory();
              onReload?.();
            }}
            disabled={isLoading || isReloading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
          >
            <RefreshCw
              size={14}
              className={isLoading || isReloading ? "animate-spin" : undefined}
            />
            {isLoading || isReloading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm min-h-105 flex items-center justify-center text-sm text-gray-500">
            Đang tải dữ liệu lịch sử cứu trợ...
          </div>
        ) : loadError ? (
          <div className="rounded-xl bg-red-50 border border-red-200 p-6 min-h-105 flex flex-col items-center justify-center text-sm text-red-700 gap-3">
            <AlertCircle size={20} />
            <p className="font-semibold">{loadError}</p>
            <button
              type="button"
              onClick={() => {
                void loadHistory();
              }}
              className="text-xs font-bold text-red-700 hover:text-red-800 underline"
            >
              Thử lại
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-xl border border-gray-200 p-6 min-h-105 flex items-center justify-center text-sm text-gray-500">
            Chưa có lịch sử cứu trợ nào.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm font-semibold text-blue-900">
                  Tổng phân phối
                </p>
                <p className="text-3xl font-black text-blue-950 mt-1">
                  {totalItems}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  Hoàn tất
                </p>
                <p className="text-3xl font-black text-emerald-700 mt-1">
                  {completedCount}
                </p>
              </div>
              <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
                <p className="text-sm font-semibold text-purple-900">
                  Đang thực hiện
                </p>
                <p className="text-3xl font-black text-purple-700 mt-1">
                  {totalItems - completedCount}
                </p>
              </div>
            </div>

            <div className="mb-4 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm kiếm theo mã, chiến dịch, người nhận, địa chỉ..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr className="text-left border-b border-gray-200">
                    <th className="px-4 py-3 font-primary font-bold">
                      Mã phân phối
                    </th>
                    <th className="px-4 py-3 font-primary font-bold">
                      Chiến dịch
                    </th>
                    <th className="px-4 py-3 font-primary font-bold">
                      Người nhận
                    </th>
                    <th className="px-4 py-3 font-primary font-bold">
                      Địa chỉ
                    </th>
                    <th className="px-4 py-3 font-primary font-bold">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 font-primary font-bold">
                      Ngày tạo
                    </th>
                    <th className="px-4 py-3 font-primary font-bold">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHistory.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-sm text-gray-500"
                      >
                        Không tìm thấy kết quả phù hợp.
                      </td>
                    </tr>
                  ) : (
                    paginatedHistory.map((item) => (
                      <tr
                        key={item.distributionId}
                        className="border-t border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-primary font-black text-blue-950 whitespace-nowrap">
                          {item.distributionCode}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800">
                            {item.campaign.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.campaign.code}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800">
                            {item.recipient.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.recipient.phone}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                          {item.recipient.address}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block text-xs px-2 py-1 rounded-md font-semibold whitespace-nowrap ${
                              statusStyles[item.status.code] ??
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {item.status.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedItem(item)}
                              className="text-xs bg-blue-950 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-900 transition-colors"
                            >
                              Chi tiết
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenStatusModal(item)}
                              className="text-xs border border-blue-200 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors"
                            >
                              Cập nhật
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredHistory.length > PAGE_SIZE && (
              <div className="mt-4 flex justify-center pointer-events-auto">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 disabled:opacity-50 hover:bg-gray-50"
                  >
                    Trước
                  </button>

                  {getPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 text-sm text-gray-500"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-9 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                          currentPage === page
                            ? "border-blue-900 bg-blue-950 text-white"
                            : "border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 disabled:opacity-50 hover:bg-gray-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isStatusModalOpen && selectedDistribution && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsStatusModalOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 md:p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-black text-gray-800 font-primary uppercase tracking-wide">
                Cập nhật trạng thái phân phối
              </h3>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700">
                Mã phân phối:{" "}
                <span className="text-blue-950">{selectedDistribution.distributionCode}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trạng thái hiện tại:
                  <span
                    className={`ml-2 inline-block text-xs px-2 py-1 rounded-md font-bold ${
                      statusStyles[selectedDistribution.status.code] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {selectedDistribution.status.name}
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chọn trạng thái mới
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DISTRIBUTION_STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => setSelectedStatus(option.code)}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                        selectedStatus === option.code
                          ? `${option.color} border-current`
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {selectedStatus === option.code && (
                        <CheckCircle2 size={14} />
                      )}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Ghi chú (không bắt buộc)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  placeholder="Nhập ghi chú nếu cần..."
                  className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {submitError && (
                <p className="text-sm font-semibold text-red-700">
                  {submitError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSubmitStatus();
                  }}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-sm font-bold text-white hover:bg-blue-900 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    "Cập nhật"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
