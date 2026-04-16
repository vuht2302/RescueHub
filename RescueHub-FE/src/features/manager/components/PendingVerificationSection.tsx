import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  ChevronRight,
  Clock,
  Phone,
  MapPin,
  Loader2,
} from "lucide-react";
import {
  getIncidents,
  IncidentItem,
  getIncidentDetail,
  IncidentDetail,
  AssessIncidentResponse,
} from "../../../features/rescue-coordinator/services/incidentServices";
import { VerificationDetailsModal } from "./VerificationDetailsModal";
import { SeverityAssessmentModal } from "./SeverityAssessmentModal";

interface PendingVerificationSectionProps {
  accessToken: string;
}

export function PendingVerificationSection({
  accessToken,
}: PendingVerificationSectionProps) {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [selectedIncident, setSelectedIncident] =
    useState<IncidentDetail | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessmentResult, setAssessmentResult] =
    useState<AssessIncidentResponse | null>(null);

  useEffect(() => {
    loadIncidents();
  }, [accessToken]);

  const loadIncidents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getIncidents(accessToken);
      // Filter incidents with "pending" or "waiting for verification" status
      const pendingIncidents = data.filter(
        (incident) =>
          incident.status?.code === "PENDING_VERIFICATION" ||
          incident.status?.code === "WAITING_FOR_VERIFICATION" ||
          incident.status?.code?.toLowerCase().includes("verify"),
      );
      setIncidents(pendingIncidents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenVerification = async (incident: IncidentItem) => {
    try {
      const details = await getIncidentDetail(incident.id, accessToken);
      setSelectedIncident(details);
      setShowVerificationModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    }
  };

  const handleOpenAssessment = () => {
    setShowVerificationModal(false);
    setShowAssessmentModal(true);
  };

  const handleVerified = (incidentId: string) => {
    // Remove from list and reload
    setIncidents(incidents.filter((i) => i.id !== incidentId));
  };

  const handleAssessed = (result: AssessIncidentResponse) => {
    setAssessmentResult(result);
    setIncidents(incidents.filter((i) => i.id !== result.data.incidentId));
    // Show success message or notification
    setTimeout(() => {
      setAssessmentResult(null);
    }, 5000);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center">
        <div>
          <h3
            className="text-xl font-bold text-slate-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Yêu cầu chờ xác minh
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Danh sách sự cố đang chờ xác minh thông tin
          </p>
        </div>
        <button
          onClick={loadIncidents}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
          style={{ fontFamily: "var(--font-primary)" }}
        >
          Làm mới
        </button>
      </div>

      {/* Success Message */}
      {assessmentResult && (
        <div className="border-b border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
          <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center mt-0.5">
            <span className="text-white font-bold text-sm">✓</span>
          </div>
          <div>
            <p className="font-semibold text-emerald-900">
              {assessmentResult.message}
            </p>
            <p className="text-sm text-emerald-700 mt-1">
              Mức ưu tiên:{" "}
              <span
                style={{ color: assessmentResult.data.priority.color }}
                className="font-semibold"
              >
                {assessmentResult.data.priority.name}
              </span>
              {" | "}
              Mức độ:{" "}
              <span
                style={{ color: assessmentResult.data.severity.color }}
                className="font-semibold"
              >
                {assessmentResult.data.severity.name}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="p-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Lỗi tải dữ liệu</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-blue-100 p-3">
                <AlertCircle className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <p className="text-slate-600">Không có sự cố cần xác minh</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <th className="px-4 py-3">Mã sự cố</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Thời gian báo cáo</th>
                <th className="px-4 py-3">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => (
                <tr
                  key={incident.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">
                      {incident.incidentCode}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-orange-50 text-orange-600"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {incident.status?.name || "Chờ xác minh"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(incident.reportedAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleOpenVerification(incident)}
                      className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Xem chi tiết
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {selectedIncident && (
        <>
          <VerificationDetailsModal
            incident={selectedIncident}
            isOpen={showVerificationModal}
            onClose={() => setShowVerificationModal(false)}
            onVerified={handleVerified}
            onAssess={handleOpenAssessment}
            accessToken={accessToken}
          />
          <SeverityAssessmentModal
            incidentId={selectedIncident.id}
            incidentCode={selectedIncident.incidentCode}
            isOpen={showAssessmentModal}
            onClose={() => setShowAssessmentModal(false)}
            onAssessed={handleAssessed}
            accessToken={accessToken}
          />
        </>
      )}
    </section>
  );
}
