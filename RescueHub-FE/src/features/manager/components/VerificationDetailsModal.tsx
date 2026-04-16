import React, { useState } from "react";
import { X, Phone, MapPin, AlertCircle, Users } from "lucide-react";
import {
  IncidentDetail,
  verifyIncident,
} from "../../../features/rescue-coordinator/services/incidentServices";

interface VerificationDetailsModalProps {
  incident: IncidentDetail;
  isOpen: boolean;
  onClose: () => void;
  onVerified: (incidentId: string) => void;
  onAssess: (incidentId: string) => void;
  accessToken: string;
}

export function VerificationDetailsModal({
  incident,
  isOpen,
  onClose,
  onVerified,
  onAssess,
  accessToken,
}: VerificationDetailsModalProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      setError(null);
      await verifyIncident(
        incident.id,
        {
          verified: true,
          note: "Đã gọi xác minh qua điện thoại",
        },
        accessToken,
      );
      onVerified(incident.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <div>
            <h2
              className="text-xl font-bold text-slate-900"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Thông tin xác minh sự cố
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Mã sự cố:{" "}
              <span className="font-semibold">{incident.incidentCode}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Incident Type and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Loại sự cố
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {incident.incidentType?.name || "Không xác định"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Kênh báo cáo
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {incident.channel?.name || "Không xác định"}
              </p>
            </div>
          </div>

          {/* Reporter Info */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-3">
              Thông tin người báo cáo
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-600">Tên người báo cáo</p>
                  <p className="text-sm font-medium text-slate-900">
                    {incident.reporter?.name || "Không xác định"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-600">Số điện thoại</p>
                  <p className="text-sm font-medium text-slate-900">
                    {incident.reporter?.phone || "Không xác định"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-3">
              Địa điểm sự cố
            </p>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-slate-600">Địa chỉ</p>
                <p className="text-sm font-medium text-slate-900">
                  {incident.location?.addressText || "Không xác định"}
                </p>
                {incident.location?.landmark && (
                  <p className="text-xs text-slate-600 mt-1">
                    Điểm đánh dấu: {incident.location.landmark}
                  </p>
                )}
                <p className="text-xs text-slate-600 mt-1">
                  Tọa độ: ({incident.location?.lat}, {incident.location?.lng})
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-3">
              Mô tả sự cố
            </p>
            <div className="border border-slate-200 rounded-lg p-3 bg-white">
              <p className="text-sm text-slate-700">
                {incident.description || "Không có mô tả"}
              </p>
            </div>
          </div>

          {/* Estimated Counts */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-slate-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Nạn nhân ước tính
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {incident.victimCountEstimate || 0}
              </p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Số người bị thương
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {incident.injuredCountEstimate || 0}
              </p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Nhóm dễ bị tổn thương
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {incident.vulnerableCountEstimate || 0}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">Lỗi xác minh</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Đóng
          </button>
          <button
            onClick={() => {
              onClose();
              onAssess(incident.id);
            }}
            className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Đánh giá mức độ
          </button>
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            {isVerifying ? "Đang xác minh..." : "Xác minh thông tin"}
          </button>
        </div>
      </div>
    </div>
  );
}
