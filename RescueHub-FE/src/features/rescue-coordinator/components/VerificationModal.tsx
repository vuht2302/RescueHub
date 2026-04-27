import React, { useState } from "react";
import {
  X,
  Phone,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  User,
} from "lucide-react";
import incidentPlaceholder from "../../../assets/incident-placeholder.png";

interface IncidentImage {
  fileId: string;
  url: string;
}

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  incidentCode: string;
  reporterName: string;
  reporterPhone: string;
  requestTitle: string;
  location: string;
  description: string;
  images: IncidentImage[];
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
  incidentCode,
  reporterName,
  reporterPhone,
  requestTitle,
  location,
  description,
  images,
  onConfirm,
  onReject,
  isVerifying = false,
  error = null,
  success = false,
}) => {
  // Image gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  const filteredImages = images.filter((img) => img.url);
  const hasImages = filteredImages.length > 0;
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
              {incidentCode || requestId} &bull; {requestTitle}
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
                      <p className="text-sm font-bold text-red-900">
                        Lỗi xác minh
                      </p>
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
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-blue-600" />
                        <p className="text-sm font-bold text-on-surface">
                          {reporterName || "Chưa cập nhật"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-on-surface-variant block mb-1">
                        Số điện thoại
                      </span>
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-blue-600" />
                        <p className="text-base font-black text-on-surface">
                          {reporterPhone || "Chưa cập nhật"}
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
                      <p className="text-sm font-semibold text-on-surface">
                        {location}
                      </p>
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
                  <AlertTriangle
                    className="text-amber-600 shrink-0"
                    size={18}
                  />
                  <div>
                    <h3 className="text-xs font-bold text-amber-900 mb-1">
                      Xác minh hiện trường
                    </h3>
                    <p className="text-[11px] text-amber-800">
                      Hãy kiểm tra cẩn thận các hình ảnh từ hiện trường trước
                      khi xác minh là tin thật hay giả.
                    </p>
                  </div>
                </div>

                {/* Image Gallery */}
                <div className="rounded-xl border border-[#c8ced6] bg-white p-4">
                  {hasImages ? (
                    <div
                      className="relative rounded-xl overflow-hidden border border-gray-100 shadow-sm"
                      style={{ height: 200 }}
                    >
                      {imageErrors[currentImageIndex] ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 gap-2">
                          <ImageOff size={24} className="text-gray-400" />
                          <p className="text-xs text-gray-400">
                            Không thể tải ảnh
                          </p>
                        </div>
                      ) : (
                        <img
                          key={filteredImages[currentImageIndex]?.fileId}
                          src={filteredImages[currentImageIndex]?.url}
                          alt={`Ảnh hiện trường ${currentImageIndex + 1}`}
                          className="w-full h-full object-cover transition-opacity duration-300"
                          onError={() => handleImageError(currentImageIndex)}
                        />
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                      {/* Nav buttons — only if more than 1 image */}
                      {filteredImages.length > 1 && (
                        <>
                          <button
                            onClick={() =>
                              setCurrentImageIndex(
                                (c) =>
                                  (c - 1 + filteredImages.length) %
                                  filteredImages.length,
                              )
                            }
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            onClick={() =>
                              setCurrentImageIndex(
                                (c) => (c + 1) % filteredImages.length,
                              )
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </>
                      )}

                      {/* Bottom bar */}
                      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-2">
                        <p className="text-white text-xs font-semibold drop-shadow">
                          Ảnh hiện trường
                        </p>
                        {filteredImages.length > 1 && (
                          <div className="flex items-center gap-1">
                            {filteredImages.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCurrentImageIndex(i)}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${
                                  i === currentImageIndex
                                    ? "bg-white w-3"
                                    : "bg-white/50"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        <span className="text-white/70 text-[10px] font-mono">
                          {currentImageIndex + 1}/{filteredImages.length}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="relative rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center bg-gray-50"
                      style={{ height: 200 }}
                    >
                      <img
                        src={incidentPlaceholder}
                        alt="Chưa có ảnh"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <p className="absolute bottom-2 left-3 text-white text-xs font-semibold opacity-80">
                        Chưa có ảnh hiện trường
                      </p>
                    </div>
                  )}
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
                Sự cố <b>{incidentCode || requestId}</b> đã được xác nhận là
                thông tin chính xác. Đang chuyển sang điều phối...
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
                Sự cố <b>{incidentCode || requestId}</b> đã bị đánh dấu là tin
                giả. Thông tin sẽ được lưu lại để xử lý.
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
