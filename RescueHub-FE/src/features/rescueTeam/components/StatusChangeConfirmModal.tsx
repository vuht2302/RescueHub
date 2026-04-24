import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { MissionStatus } from "../types/mission";

interface StatusChangeConfirmModalProps {
  isOpen: boolean;
  currentStatus: MissionStatus;
  nextStatus: MissionStatus;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const StatusChangeConfirmModal: React.FC<
  StatusChangeConfirmModalProps
> = ({
  isOpen,
  currentStatus,
  nextStatus,
  onConfirm,
  onCancel,
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-[#c8ced6] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-950 px-6 py-4 flex items-center justify-between">
          <h3
            className="text-white font-bold text-lg font-primary"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Xác nhận chuyển trạng thái
          </h3>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="text-amber-600" size={24} />
            </div>
            <div>
              <p
                className="text-[#1f2329] font-semibold mb-2 font-primary"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                Bạn có chắc chắn muốn chuyển trạng thái nhiệm vụ?
              </p>
              <p className="text-sm text-[#3f4650] leading-relaxed">
                Hành động này sẽ cập nhật trạng thái nhiệm vụ và không thể hoàn
                tác.
              </p>
            </div>
          </div>

          {/* Status transition display */}
          <div className="bg-[#f8f9fa] rounded-xl p-4 border border-[#e7ebef] mb-6">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-xs text-[#6c757d] uppercase tracking-wider font-semibold mb-1">
                  Trạng thái hiện tại
                </p>
                <span className="inline-block px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-sm font-bold">
                  {currentStatus}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-8 h-0.5 bg-blue-950 rounded-full"></div>
                <div className="text-blue-950 mt-1">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-[#6c757d] uppercase tracking-wider font-semibold mb-1">
                  Trạng thái mới
                </p>
                <span className="inline-block px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-bold">
                  {nextStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg border border-[#c8ced6] bg-white text-[#3f4650] font-semibold text-sm hover:bg-[#f8f9fa] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Hủy
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-950 text-white font-semibold text-sm hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận chuyển trạng thái"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
