import React, { useState } from "react";
import { X, AlertCircle, Users, Ambulance, Truck } from "lucide-react";
import {
  assessIncident,
  AssessIncidentRequest,
  AssessIncidentResponse,
} from "../../../features/rescue-coordinator/services/incidentServices";

interface SeverityAssessmentModalProps {
  incidentId: string;
  incidentCode: string;
  isOpen: boolean;
  onClose: () => void;
  onAssessed: (result: AssessIncidentResponse) => void;
  accessToken: string;
}

const PRIORITY_CODES = [
  { code: "LOW", name: "Thấp", color: "#10b981" },
  { code: "MEDIUM", name: "Trung bình", color: "#f59e0b" },
  { code: "HIGH", name: "Cao", color: "#ef4444" },
  { code: "CRITICAL", name: "Khẩn cấp", color: "#7c3aed" },
];

const SEVERITY_CODES = [
  { code: "LOW", name: "Thấp", color: "#10b981" },
  { code: "MEDIUM", name: "Trung bình", color: "#f59e0b" },
  { code: "HIGH", name: "Cao", color: "#ef4444" },
  { code: "CRITICAL", name: "Rất nghiêm trọng", color: "#7c3aed" },
];

export function SeverityAssessmentModal({
  incidentId,
  incidentCode,
  isOpen,
  onClose,
  onAssessed,
  accessToken,
}: SeverityAssessmentModalProps) {
  const [formData, setFormData] = useState({
    priorityCode: "CRITICAL",
    severityCode: "HIGH",
    victimCountEstimate: 0,
    injuredCountEstimate: 0,
    vulnerableCountEstimate: 0,
    requiresMedicalSupport: true,
    requiresEvacuation: true,
    notes: "Nước đang cao",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);

      const request: AssessIncidentRequest = {
        priorityCode: formData.priorityCode,
        severityCode: formData.severityCode,
        victimCountEstimate: Number(formData.victimCountEstimate),
        injuredCountEstimate: Number(formData.injuredCountEstimate),
        vulnerableCountEstimate: Number(formData.vulnerableCountEstimate),
        requiresMedicalSupport: formData.requiresMedicalSupport,
        requiresEvacuation: formData.requiresEvacuation,
        notes: formData.notes,
      };

      const result = await assessIncident(incidentId, request, accessToken);
      onAssessed(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
      setIsSubmitting(false);
    }
  };

  const getPriorityLabel = (code: string) =>
    PRIORITY_CODES.find((p) => p.code === code)?.name || code;

  const getSeverityLabel = (code: string) =>
    SEVERITY_CODES.find((s) => s.code === code)?.name || code;

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
              Đánh giá mức độ nghiêm trọng
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Mã sự cố: <span className="font-semibold">{incidentCode}</span>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Priority and Severity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                Mức ưu tiên
              </label>
              <select
                value={formData.priorityCode}
                onChange={(e) =>
                  setFormData({ ...formData, priorityCode: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {PRIORITY_CODES.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                Mức độ nghiêm trọng
              </label>
              <select
                value={formData.severityCode}
                onChange={(e) =>
                  setFormData({ ...formData, severityCode: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {SEVERITY_CODES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Victim and Injured Counts */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                <Users className="h-4 w-4 inline mr-1" />
                Nạn nhân ước tính
              </label>
              <input
                type="number"
                min="0"
                value={formData.victimCountEstimate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    victimCountEstimate: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Người bị thương
              </label>
              <input
                type="number"
                min="0"
                value={formData.injuredCountEstimate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    injuredCountEstimate: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Nhóm dễ tổn thương
              </label>
              <input
                type="number"
                min="0"
                value={formData.vulnerableCountEstimate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vulnerableCountEstimate: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-3 border border-slate-200 rounded-lg p-4 bg-slate-50">
            <p className="text-xs font-semibold text-slate-600 uppercase">
              Yêu cầu hỗ trợ
            </p>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresMedicalSupport}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requiresMedicalSupport: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded"
              />
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Ambulance className="h-4 w-4" />
                Cần hỗ trợ y tế
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresEvacuation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requiresEvacuation: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded"
              />
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Truck className="h-4 w-4" />
                Cần sơ tán
              </div>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
              Ghi chú
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Thêm ghi chú về sự cố..."
              style={{ fontFamily: "var(--font-sans)" }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">Lỗi đánh giá</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            {isSubmitting ? "Đang lưu..." : "Lưu đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
}
