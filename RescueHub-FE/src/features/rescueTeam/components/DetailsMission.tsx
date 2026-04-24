import React from "react";
import { Clock3, MapPinned, ShieldAlert, UsersRound, X } from "lucide-react";
import {
  TeamMissionDetail,
  TeamMissionListItem,
} from "../services/teamMissionService";

interface DetailsMissionProps {
  isOpen: boolean;
  mission: TeamMissionListItem | null;
  detail?: TeamMissionDetail;
  onClose: () => void;
  onRequestAbort: () => void;
  canAccept: boolean;
  isAccepting: boolean;
  onAccept: () => void;
}

const formatDateTime = (isoDateTime: string | null) => {
  if (!isoDateTime) {
    return "--";
  }

  const parsedDate = new Date(isoDateTime);
  if (Number.isNaN(parsedDate.getTime())) {
    return "--";
  }

  return parsedDate.toLocaleString("vi-VN");
};

const actionCodeLabelMap: Record<string, string> = {
  CREATE_MISSION: "Tạo nhiệm vụ",
  ACCEPT: "Xác nhận nhận nhiệm vụ",
  TEAM_ACCEPT: "Đội chấp nhận",
  TEAM_REJECT: "Đội từ chối",
  DEPART: "Xuất phát",
  START_MOVING: "Bắt đầu di chuyển",
  ARRIVED: "Đã đến hiện trường",
  ON_SCENE: "Có mặt tại hiện trường",
  START_RESCUE: "Bắt đầu cứu hộ",
  IN_PROGRESS: "Đang xử lý",
  FIELD_REPORT: "Báo cáo hiện trường",
  NEED_SUPPORT: "Yêu cầu chi viện",
  REQUEST_ABORT: "Yêu cầu hủy",
  UNREACHABLE: "Không thể tiếp cận",
  COMPLETE: "Hoàn tất",
  COMPLETED: "Đã hoàn tất",
  ABORTED: "Đã hủy",
};

const statusCodeLabelMap: Record<string, string> = {
  ASSIGNED: "Đã giao",
  ACCEPTED: "Đã nhận",
  REJECTED: "Đã từ chối",
  EN_ROUTE: "Đang di chuyển",
  ON_SITE: "Tại hiện trường",
  RESCUING: "Đang cứu hộ",
  NEED_SUPPORT: "Cần chi viện",
  COMPLETED: "Đã hoàn tất",
  ABORTED: "Đã hủy",
};

const decisionStatusLabelMap: Record<string, string> = {
  PENDING: "Đang chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

const reasonCodeLabelMap: Record<string, string> = {
  RESOURCE_LIMIT: "Thiếu nguồn lực",
  UNSAFE_CONDITION: "Hiện trường không an toàn",
  DUPLICATED_MISSION: "Nhiệm vụ bị trùng",
  OTHER: "Lý do khác",
};

const reportTypeLabelMap: Record<string, string> = {
  ON_SITE: "Báo cáo tại hiện trường",
  PROGRESS: "Báo cáo tiến độ",
  RESULT: "Báo cáo kết quả",
};

const supportTypeLabelMap: Record<string, string> = {
  RELIEF_SUPPORT: "Chi viện cứu trợ",
  MEDICAL_SUPPORT: "Chi viện y tế",
  VEHICLE_SUPPORT: "Chi viện phương tiện",
  HUMAN_SUPPORT: "Chi viện nhân lực",
};

const responseStatusLabelMap: Record<string, string> = {
  ACCEPTED: "Đã chấp nhận",
  REJECTED: "Đã từ chối",
  PENDING: "Đang chờ phản hồi",
};

const getCodeLabel = (
  code: string | null | undefined,
  map: Record<string, string>,
) => {
  if (!code) {
    return "--";
  }

  const normalizedCode = code.toUpperCase();
  return map[normalizedCode] ?? code;
};

export const DetailsMission: React.FC<DetailsMissionProps> = ({
  isOpen,
  mission,
  detail,
  onClose,
  onRequestAbort,
  canAccept,
  isAccepting,
  onAccept,
}) => {
  if (!isOpen || !mission) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl border border-[#c8ced6] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#e2e8f0] bg-[#f8fafc] px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
              Chi tiết nhiệm vụ
            </p>
            <h3 className="mt-1 font-primary text-2xl font-black text-blue-950">
              {detail?.missionCode ?? mission.missionCode}
            </h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              {detail?.objective ?? mission.objective}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d6dde6] bg-white text-gray-600 hover:bg-gray-100"
            aria-label="Đóng chi tiết nhiệm vụ"
          >
            <X size={18} />
          </button>
        </div>

        {!detail ? (
          <div className="px-6 py-8 text-center text-sm text-on-surface-variant">
            Đang tải chi tiết nhiệm vụ...
          </div>
        ) : (
          <div className="space-y-4 bg-[#f8fafc] p-6 text-sm">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-[#d6dde6] bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                  Mã sự cố
                </p>
                <p className="mt-2 font-semibold text-on-surface">
                  {detail.incident.incidentCode}
                </p>
                <p className="mt-2 leading-relaxed text-on-surface-variant">
                  {detail.incident.description}
                </p>
              </div>

              <div className="rounded-xl border border-[#d6dde6] bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                  Trạng thái
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="inline-flex rounded-md px-2 py-1 text-xs font-bold text-white"
                    style={{
                      backgroundColor: detail.status.color ?? "#1e293b",
                    }}
                  >
                    {getCodeLabel(detail.status.code, statusCodeLabelMap)}
                  </span>
                  <span className="font-semibold text-on-surface">
                    {getCodeLabel(detail.status.name, statusCodeLabelMap)}
                  </span>
                </div>
                <p className="mt-3 text-on-surface-variant">
                  Kết quả: {getCodeLabel(detail.resultCode, statusCodeLabelMap)}
                </p>
                <p className="mt-1 text-on-surface-variant">
                  {detail.resultSummary ?? "--"}
                </p>
              </div>

              <div className="rounded-xl border border-[#d6dde6] bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                  Mốc thời gian
                </p>
                <p className="mt-2 flex items-start gap-2 text-on-surface">
                  <Clock3 size={16} className="mt-0.5 text-blue-900" /> ETA:{" "}
                  {detail.etaMinutes} phút
                </p>
                <p className="mt-2 text-on-surface-variant">
                  Bắt đầu: {formatDateTime(detail.actualStartAt)}
                </p>
                <p className="mt-1 text-on-surface-variant">
                  Kết thúc: {formatDateTime(detail.actualEndAt)}
                </p>
                <p className="mt-1 text-on-surface-variant">
                  Tạo: {formatDateTime(detail.createdAt)}
                </p>
                <p className="mt-1 text-on-surface-variant">
                  Cập nhật: {formatDateTime(detail.updatedAt)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-xl border border-[#d6dde6] bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                  Đội tham gia
                </p>
                <div className="mt-3 space-y-2">
                  {detail.teams.map((team) => (
                    <div
                      key={team.assignmentId}
                      className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3"
                    >
                      <p className="font-semibold text-on-surface">
                        {team.teamName} {team.isPrimary ? "(Đội chính)" : ""}
                      </p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        Response:{" "}
                        {getCodeLabel(
                          team.responseStatus,
                          responseStatusLabelMap,
                        )}{" "}
                        | Responded: {formatDateTime(team.respondedAt)}
                      </p>
                      {team.rejectionNote && (
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Ghi chú: {team.rejectionNote}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-[#d6dde6] bg-white p-4 lg:col-span-2">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                  Lịch sử trạng thái
                </p>
                <div className="mt-3 max-h-[300px] space-y-2 overflow-auto pr-1">
                  {detail.statusHistory.map((item, index) => (
                    <div
                      key={`${item.changedAt}-${item.actionCode}-${index}`}
                      className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3"
                    >
                      <p className="font-semibold text-on-surface">
                        {getCodeLabel(item.actionCode, actionCodeLabelMap)} |{" "}
                        {getCodeLabel(item.fromState, statusCodeLabelMap)}
                        {" -> "}
                        {getCodeLabel(item.toState, statusCodeLabelMap)}
                      </p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {formatDateTime(item.changedAt)}
                      </p>
                      {item.note && (
                        <p className="mt-1 text-xs text-on-surface">
                          {item.note}
                        </p>
                      )}
                      {item.reasonCode && (
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Lý do:{" "}
                          {getCodeLabel(item.reasonCode, reasonCodeLabelMap)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-[#d6dde6] bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                    Báo cáo
                  </p>
                  <div className="mt-3 max-h-[180px] space-y-2 overflow-auto pr-1">
                    {detail.reports.length === 0 ? (
                      <p className="text-xs text-on-surface-variant">
                        Chưa có báo cáo.
                      </p>
                    ) : (
                      detail.reports.map((report) => (
                        <div
                          key={report.reportId}
                          className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3"
                        >
                          <p className="text-xs font-semibold text-on-surface">
                            {getCodeLabel(
                              report.reportTypeCode,
                              reportTypeLabelMap,
                            )}
                          </p>
                          <p className="mt-1 text-xs text-on-surface-variant">
                            {report.summary}
                          </p>
                          <p className="mt-1 text-xs text-on-surface-variant">
                            Rescued: {report.victimRescuedCount} | Unreachable:{" "}
                            {report.victimUnreachableCount} | Casualty:{" "}
                            {report.casualtyCount}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-[#d6dde6] bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                    Yêu cầu huỷ
                  </p>
                  <div className="mt-3 max-h-[140px] space-y-2 overflow-auto pr-1">
                    {detail.abortRequests.length === 0 ? (
                      <p className="text-xs text-on-surface-variant">
                        Không có yêu cầu hủy.
                      </p>
                    ) : (
                      detail.abortRequests.map((request) => (
                        <div
                          key={request.requestId}
                          className="rounded-lg border border-[#fde2e4] bg-[#fff5f5] p-3"
                        >
                          <p className="text-xs font-semibold text-red-700">
                            {getCodeLabel(
                              request.reasonCode,
                              reasonCodeLabelMap,
                            )}{" "}
                            |{" "}
                            {getCodeLabel(
                              request.decisionStatus,
                              decisionStatusLabelMap,
                            )}
                          </p>
                          <p className="mt-1 text-xs text-red-700">
                            {request.detailNote}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-[#d6dde6] bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                    Yêu cầu hỗ trợ
                  </p>
                  <div className="mt-3 max-h-[120px] space-y-2 overflow-auto pr-1">
                    {detail.supportRequests.length === 0 ? (
                      <p className="text-xs text-on-surface-variant">
                        Không có yêu cầu chi viện.
                      </p>
                    ) : (
                      detail.supportRequests.map((request) => (
                        <div
                          key={request.requestId}
                          className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3"
                        >
                          <p className="text-xs font-semibold text-on-surface">
                            {getCodeLabel(
                              request.supportTypeCode,
                              supportTypeLabelMap,
                            )}{" "}
                            |{" "}
                            {getCodeLabel(
                              request.decisionStatus,
                              decisionStatusLabelMap,
                            )}
                          </p>
                          <p className="mt-1 text-xs text-on-surface-variant">
                            {request.detailNote}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-[#e2e8f0] bg-white px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end">
          {canAccept && (
            <button
              type="button"
              onClick={onAccept}
              disabled={isAccepting}
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              {isAccepting ? "Đang chấp nhận..." : "Chấp nhận nhiệm vụ"}
            </button>
          )}

          <button
            type="button"
            onClick={onRequestAbort}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100"
          >
            <ShieldAlert size={16} /> Xin hủy
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d6dde6] bg-white px-4 py-2.5 text-sm font-bold text-on-surface hover:bg-[#f8fafc]"
          >
            <MapPinned size={16} /> Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
