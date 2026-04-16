import React, { useState } from "react";
import { X, AlertCircle, CheckCircle2, MapPin, Clock } from "lucide-react";
import { type UnsyncedRequest } from "../services/syncService";

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  unsyncedRequests: UnsyncedRequest[];
  onConfirmSync: () => Promise<void>;
  onSkip: () => void;
}

const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  unsyncedRequests,
  onConfirmSync,
  onSkip,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await onConfirmSync();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Co loi khi dong bo hoa du lieu",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Cho xac minh",
          color: "bg-yellow-100 text-yellow-800",
        };
      case "verified":
        return { label: "Da xac minh", color: "bg-green-100 text-green-800" };
      case "completed":
        return {
          label: "Hoan thanh",
          color: "bg-blue-100 text-blue-800",
        };
      default:
        return { label: status, color: "bg-gray-100 text-gray-800" };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={16} className="text-green-600" />;
      case "verified":
        return <CheckCircle2 size={16} className="text-blue-600" />;
      default:
        return <AlertCircle size={16} className="text-yellow-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[102] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className="px-6 py-4 flex justify-between items-center"
          style={{ backgroundColor: "var(--color-blue-950)" }}
        >
          <div>
            <h2
              className="text-2xl font-black text-white"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Đồng bộ hoá dữ liệu
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Bạn có {unsyncedRequests.length} yêu cầu cứu hộ cần đồng bộ hoá
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-semibold">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {unsyncedRequests.map((request) => {
              const statusBadge = getStatusBadge(request.status);
              const createdDate = new Date(request.createdAt);
              const timeLabel = createdDate.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const dateLabel = createdDate.toLocaleDateString("vi-VN");

              return (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(request.status)}
                        <h4
                          className="font-bold text-gray-900"
                          style={{ fontFamily: "var(--font-primary)" }}
                        >
                          {request.title}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <MapPin size={14} /> {request.location}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded whitespace-nowrap ml-4 ${statusBadge.color}`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-2">
                    {request.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {timeLabel} - {dateLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Đồng bộ hoá tự động?</span> ác yêu
              cầu này sẽ được liên kết với tài khoản của bạn và bạn có thể xem
              toàn bộ lịch sử cứu hộ của mình.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex gap-3 justify-end bg-gray-50">
          <button
            onClick={onSkip}
            disabled={isLoading}
            className="px-6 py-2 rounded-lg border-2 border-gray-300 text-gray-900 font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Bỏ qua
          </button>
          <button
            onClick={handleSync}
            disabled={isLoading}
            className="px-6 py-2 rounded-lg text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 flex items-center gap-2"
            style={{
              backgroundColor: "var(--color-blue-950)",
              fontFamily: "var(--font-primary)",
            }}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isLoading ? "Đang đồng bộ hoá..." : "Đồng bộ hoá ngay"}
          </button>
        </div>
      </div>
    </div>
  );
};

export { SyncModal };
