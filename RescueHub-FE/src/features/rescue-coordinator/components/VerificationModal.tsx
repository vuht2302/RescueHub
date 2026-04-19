import React, { useState } from "react";
import {
  X,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Image,
  AlertCircle,
} from "lucide-react";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  requesterName: string;
  requesterPhone: string;
  requestTitle: string;
  location: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  onReject: () => void;
  isVerifying?: boolean;
  error?: string | null;
  success?: boolean;
}

const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  requestId,
  requesterName,
  requesterPhone,
  requestTitle,
  location,
  description,
  onConfirm,
  onReject,
  isVerifying = false,
  error = null,
  success = false,
}) => {
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "confirmed" | "rejected"
  >("pending");

  const handleConfirm = async () => {
    setVerificationStatus("confirmed");
    await onConfirm();
  };

  const handleReject = () => {
    setVerificationStatus("rejected");
    setTimeout(() => {
      onReject();
      setVerificationStatus("pending");
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-[102] flex items-center justify-center p-4 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-[#c8ced6]">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#c8ced6] bg-[#f8fafc]">
          <div>
            <h2 className="text-xl font-black text-blue-950 flex items-center gap-2">
              <CheckCircle2 size={24} className="text-blue-600" />
              Xác minh thông tin
            </h2>
            <p className="text-sm font-semibold text-on-surface-variant mt-1">
              {requestId} &bull; {requestTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:bg-[#e2e8f0] hover:text-blue-950 p-2 rounded-xl transition-colors"
            disabled={verificationStatus !== "pending" || isVerifying}
          >
            <X size={20} className="stroke-[2.5px]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {verificationStatus === "pending" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {/* Left: Info */}
              <div className="space-y-4">
                {/* Error Message */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-900">Lỗi xác minh</p>
                      <p className="text-xs text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-[#c8ced6] bg-white p-4">
                  <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">
                    Thông tin liên hệ
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-on-surface-variant block mb-1">
                        Họ tên người gửi
                      </span>
                      <p className="text-sm font-bold text-on-surface">
                        {requesterName}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-on-surface-variant block mb-1">
                        Số điện thoại
                      </span>
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-blue-600" />
                        <p className="text-base font-black text-on-surface">
                          {requesterPhone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#c8ced6] bg-white p-4">
                  <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">
                    Chi tiết yêu cầu
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-on-surface-variant block mb-1">
                        Loại yêu cầu
                      </span>
                      <p className="text-sm font-semibold text-on-surface">
                        {requestTitle}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-on-surface-variant block mb-1">
                        Địa điểm
                      </span>
                      <p className="text-sm font-semibold text-on-surface">{location}</p>
                    </div>
                    <div>
                      <span className="text-xs text-on-surface-variant block mb-1">
                        Mô tả
                      </span>
                      <p className="text-sm text-on-surface leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Scene Images & Warning */}
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex gap-3">
                  <AlertTriangle className="text-amber-600 shrink-0" size={18} />
                  <div>
                    <h3 className="text-xs font-bold text-amber-900 mb-1">
                      Xác minh hiện trường
                    </h3>
                    <p className="text-[11px] text-amber-800">
                      Hãy kiểm tra cẩn thận các hình ảnh từ hiện trường trước khi xác minh là tin thật hay giả.
                    </p>
                  </div>
                </div>

                {/* Image Gallery */}
                <div className="rounded-xl border border-[#c8ced6] bg-white p-4">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="col-span-2 bg-[#f8fafc] rounded-xl p-4 aspect-video flex flex-col items-center justify-center border border-dashed border-[#c8ced6]">
                      <Image size={32} className="text-on-surface-variant opacity-50 mb-2" />
                      <p className="text-xs font-semibold text-on-surface-variant">Ảnh 1</p>
                    </div>
                    <div className="bg-[#f8fafc] rounded-xl p-3 aspect-video flex flex-col items-center justify-center border border-dashed border-[#c8ced6]">
                      <Image size={24} className="text-on-surface-variant opacity-50 mb-1" />
                      <p className="text-[10px] font-semibold text-on-surface-variant">Ảnh 2</p>
                    </div>
                    <div className="bg-[#f8fafc] rounded-xl p-3 aspect-video flex flex-col items-center justify-center border border-dashed border-[#c8ced6]">
                      <Image size={24} className="text-on-surface-variant opacity-50 mb-1" />
                      <p className="text-[10px] font-semibold text-on-surface-variant">Ảnh 3</p>
                    </div>
                  </div>
                  <button className="w-full py-2 rounded-lg border border-[#c8ced6] bg-white text-xs font-bold text-on-surface-variant hover:bg-[#f8fafc] transition-colors">
                    Tải ảnh từ thiết bị
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success / Rejected States */}
          {verificationStatus === "confirmed" && (
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <CheckCircle2 size={64} className="text-emerald-500 mb-4" />
              <h3 className="text-xl font-black text-on-surface mb-2">
                Xác minh thành công
              </h3>
              <p className="text-sm text-on-surface-variant text-center max-w-sm">
                Yêu cầu <b>{requestId}</b> đã được xác nhận là thông tin chính xác. Đang chuyển sang điều phối...
              </p>
            </div>
          )}

          {verificationStatus === "rejected" && (
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <AlertTriangle size={64} className="text-rose-500 mb-4" />
              <h3 className="text-xl font-black text-on-surface mb-2">
                Đã từ chối (Tin giả)
              </h3>
              <p className="text-sm text-on-surface-variant text-center max-w-sm">
                Yêu cầu <b>{requestId}</b> đã bị đánh dấu là tin giả. Thông tin sẽ được lưu lại để xử lý.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {verificationStatus === "pending" && (
          <div className="border-t border-[#c8ced6] p-4 flex items-center justify-end gap-3 bg-[#f8fafc]">
            <button
              onClick={onClose}
              disabled={isVerifying}
              className="px-4 py-2 rounded-xl border border-[#c8ced6] bg-white text-sm font-semibold text-on-surface hover:bg-[#f0f4f8] transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleReject}
              disabled={isVerifying}
              className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 text-sm font-bold hover:bg-rose-50 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <AlertTriangle size={16} />
              Đánh dấu tin giả
            </button>
            <button
              onClick={handleConfirm}
              disabled={isVerifying}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              <CheckCircle2 size={16} />
              {isVerifying ? "Đang xử lý..." : "Xác nhận tin thật"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export { VerificationModal };
