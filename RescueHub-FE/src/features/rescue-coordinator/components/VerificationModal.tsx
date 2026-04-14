import React, { useState } from "react";
import { X, Phone, AlertTriangle, CheckCircle2, Image } from "lucide-react";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  requesterName: string;
  requesterPhone: string;
  requestTitle: string;
  location: string;
  description: string;
  onConfirm: () => void;
  onReject: () => void;
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
}) => {
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "confirmed" | "rejected"
  >("pending");

  const handleConfirm = () => {
    setVerificationStatus("confirmed");
    setTimeout(() => {
      onConfirm();
      setVerificationStatus("pending");
      onClose();
    }, 1500);
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
    <div className="fixed inset-0 bg-black/50 z-[102] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
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
              Xác minh thông tin yêu cầu
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              {requestId} - {requestTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            disabled={verificationStatus !== "pending"}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {verificationStatus === "pending" && (
            <div className="grid grid-cols-2 gap-6 p-6">
              {/* Left: Contact Info */}
              <div className="space-y-4">
                <div
                  className="bg-blue-50 border-l-4 p-4 rounded"
                  style={{ borderColor: "var(--color-blue-950)" }}
                >
                  <h3
                    className="text-sm font-bold mb-4"
                    style={{
                      color: "var(--color-blue-950)",
                      fontFamily: "var(--font-primary)",
                    }}
                  >
                    Thông tin liên hệ
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-gray-600 block mb-1">
                        Họ tên người gửi tín hiệu
                      </span>
                      <p
                        className="text-lg font-bold text-gray-900"
                        style={{ fontFamily: "var(--font-primary)" }}
                      >
                        {requesterName}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border-2 border-blue-200">
                      <span className="text-xs text-gray-600 block mb-2">
                        Số điện thoại liên hệ
                      </span>
                      <div className="flex items-center gap-3">
                        <Phone
                          size={20}
                          style={{ color: "var(--color-blue-950)" }}
                        />
                        <p
                          className="text-2xl font-black text-gray-900"
                          style={{ fontFamily: "var(--font-primary)" }}
                        >
                          {requesterPhone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Request Details */}
                <div className="border-2 border-gray-200 p-4 rounded-lg">
                  <h3
                    className="font-bold text-gray-900 mb-3"
                    style={{ fontFamily: "var(--font-primary)" }}
                  >
                    Chi tiết yêu cầu
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-xs text-gray-600 block">
                        Loại yêu cầu
                      </span>
                      <p className="font-semibold text-gray-900">
                        {requestTitle}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600 block">
                        Địa điểm
                      </span>
                      <p className="font-semibold text-gray-900">{location}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600 block">Mô tả</span>
                      <p className="text-gray-700 leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Scene Images */}
              <div className="space-y-4">
                <div
                  className="bg-orange-50 border-l-4 p-4 rounded"
                  style={{ borderColor: "#dc3545" }}
                >
                  <h3
                    className="text-sm font-bold mb-2 text-orange-900"
                    style={{ fontFamily: "var(--font-primary)" }}
                  >
                    ⚠️ Xác minh hiện trường
                  </h3>
                  <p className="text-xs text-orange-800">
                    Hãy kiểm tra cẩn thận các ảnh từ hiện trường trước khi xác
                    minh
                  </p>
                </div>

                {/* Image Gallery */}
                <div className="space-y-3">
                  <div className="bg-gray-100 rounded-lg p-4 aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                    <Image size={48} className="text-gray-400 mb-2" />
                    <p className="text-gray-600 text-sm text-center">
                      Ảnh hiện trường 1
                    </p>
                    <span className="text-xs text-gray-500 mt-1">
                      Chưa có ảnh
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-100 rounded-lg p-3 aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                      <Image size={32} className="text-gray-400 mb-1" />
                      <p className="text-gray-600 text-xs text-center">Ảnh 2</p>
                      <span className="text-xs text-gray-500 mt-0.5">
                        Chưa có ảnh
                      </span>
                    </div>

                    <div className="bg-gray-100 rounded-lg p-3 aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                      <Image size={32} className="text-gray-400 mb-1" />
                      <p className="text-gray-600 text-xs text-center">Ảnh 3</p>
                      <span className="text-xs text-gray-500 mt-0.5">
                        Chưa có ảnh
                      </span>
                    </div>
                  </div>

                  <button className="w-full py-2 rounded-lg border-2 border-gray-300 text-gray-900 text-sm font-semibold hover:bg-gray-50 transition-colors">
                    Tải ảnh từ thiết bị
                  </button>
                </div>

                {/* Warning */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-900 leading-relaxed">
                    <strong>⚠️ Lưu ý:</strong> Chỉ xác minh nếu bạn chắc chắn
                    ảnh/video là hợp lệ và không phải tín hiệu giả
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success States */}
          {verificationStatus === "confirmed" && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="mb-6">
                <CheckCircle2 size={80} className="text-green-500 mx-auto" />
              </div>
              <h3
                className="text-2xl font-black text-gray-900 mb-2"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                Xác minh thành công
              </h3>
              <p className="text-gray-600 text-center">
                Yêu cầu {requestId} đã được xác minh là tin thật. <br />
                Đang chuyển sang bước điều phối...
              </p>
            </div>
          )}

          {verificationStatus === "rejected" && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="mb-6">
                <AlertTriangle size={80} className="text-red-500 mx-auto" />
              </div>
              <h3
                className="text-2xl font-black text-gray-900 mb-2"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                Đã từ chối
              </h3>
              <p className="text-gray-600 text-center">
                Yêu cầu {requestId} đã được đánh dấu là tin giả. <br />
                Dữ liệu sẽ được lưu lại để cảnh báo...
              </p>
            </div>
          )}
        </div>

        {/* Footer - Only show for pending status */}
        {verificationStatus === "pending" && (
          <div className="border-t border-gray-200 p-6 flex gap-3 justify-end bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg border-2 border-gray-300 text-gray-900 font-bold hover:bg-gray-100 transition-colors"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleReject}
              className="px-6 py-2 rounded-lg text-white font-bold transition-colors hover:opacity-90"
              style={{
                backgroundColor: "#dc3545",
                fontFamily: "var(--font-primary)",
              }}
            >
              Từ chối
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 rounded-lg text-white font-bold transition-colors hover:opacity-90"
              style={{
                backgroundColor: "var(--color-blue-950)",
                fontFamily: "var(--font-primary)",
              }}
            >
              Xác minh
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export { VerificationModal };
