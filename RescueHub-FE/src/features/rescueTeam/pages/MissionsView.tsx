import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Ban,
  Eye,
  FileText,
  Loader,
  RefreshCw,
  X,
} from "lucide-react";
import { DetailsMission } from "../components/DetailsMission";
import {
  getTeamMissions,
  requestMissionAbort,
  respondToMission,
  getTeamMissionDetail,
  UpdateMissionStatusRequest,
} from "../services/teamMissionService";
import {
  MissionStatus,
  TeamMissionListItem,
  TeamMissionDetail,
} from "../types/mission";

const priorityStyles: Record<string, string> = {
  "Khẩn cấp": "bg-error-container text-error",
  Cao: "bg-amber-100 text-amber-800",
  "Trung bình": "bg-blue-100 text-blue-800",
};

const statusStyles: Record<MissionStatus, string> = {
  "Chờ nhận": "bg-surface-container-high text-on-surface-variant",
  "Đang di chuyển": "bg-blue-950/10 text-blue-950",
  "Đang xử lý": "bg-amber-100 text-amber-800",
  "Đã hoàn tất": "bg-emerald-100 text-emerald-700",
  "Tạm dừng": "bg-error-container text-error",
};

const mapBackendStatusToUiStatus = (
  statusCode?: string,
  teamResponseStatus?: string,
): MissionStatus => {
  const normalizedStatusCode = statusCode?.toUpperCase();
  const normalizedResponseStatus = teamResponseStatus?.toUpperCase();

  if (normalizedStatusCode === "COMPLETED") {
    return "Đã hoàn tất";
  }

  if (normalizedStatusCode === "RESCUING") {
    return "Đang xử lý";
  }

  if (
    normalizedStatusCode === "ON_SITE" ||
    normalizedStatusCode === "ARRIVED" ||
    normalizedStatusCode === "EN_ROUTE"
  ) {
    return "Đang di chuyển";
  }

  if (normalizedResponseStatus === "ACCEPTED") {
    return "Đang di chuyển";
  }

  return "Chờ nhận";
};

const getPriority = (etaMinutes: number): string => {
  if (etaMinutes <= 10) return "Khẩn cấp";
  if (etaMinutes <= 20) return "Cao";
  return "Trung bình";
};

interface MissionsViewProps {
  onViewMission?: (missionId: string, status: MissionStatus) => void;
  onMissionAccepted?: (missionId: string) => void;
}

export const MissionsView: React.FC<MissionsViewProps> = ({
  onViewMission,
  onMissionAccepted,
}) => {
  const [missions, setMissions] = useState<TeamMissionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [missionDetailsById, setMissionDetailsById] = useState<
    Record<string, TeamMissionDetail>
  >({});
  const [statusMap, setStatusMap] = useState<Record<string, MissionStatus>>({});

  const ITEMS_PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMissionId, setSelectedMissionId] = useState<string>("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [acceptingMissionId, setAcceptingMissionId] = useState<string | null>(
    null,
  );
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [isAbortModalOpen, setIsAbortModalOpen] = useState(false);
  const [abortMissionId, setAbortMissionId] = useState<string | null>(null);
  const [abortReasonCode, setAbortReasonCode] =
    useState<string>("RESOURCE_LIMIT");
  const [abortDetailNote, setAbortDetailNote] = useState("");
  const [isAbortSubmitting, setIsAbortSubmitting] = useState(false);
  const [abortError, setAbortError] = useState<string | null>(null);

  const loadTeamMissions = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await getTeamMissions();
      const items = response.items;

      setMissions(items);

      const mappedStatus = items.reduce<Record<string, MissionStatus>>(
        (acc, mission) => {
          const primaryTeam =
            mission.teams.find((team) => team.isPrimary) ?? mission.teams[0];
          acc[mission.missionId] = mapBackendStatusToUiStatus(
            mission.status?.code,
            primaryTeam?.responseStatus,
          );
          return acc;
        },
        {},
      );
      setStatusMap(mappedStatus);

      if (items.length > 0 && !selectedMissionId) {
        setSelectedMissionId(items[0].missionId);
      }
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Không tải được danh sách nhiệm vụ.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamMissionDetail = async (missionId: string, force = false) => {
    if (!missionId || (!force && missionDetailsById[missionId])) {
      return;
    }

    try {
      const detail = await getTeamMissionDetail(missionId);
      setMissionDetailsById((prev) => ({
        ...prev,
        [missionId]: detail,
      }));

      const primaryTeam =
        detail.teams.find((team) => team.isPrimary) ?? detail.teams[0];
      setStatusMap((prev) => ({
        ...prev,
        [missionId]: mapBackendStatusToUiStatus(
          detail.status?.code,
          primaryTeam?.responseStatus,
        ),
      }));
    } catch {
      // Silently ignore — list data remains as fallback.
    }
  };

  useEffect(() => {
    void loadTeamMissions();
  }, []);

  useEffect(() => {
    if (selectedMissionId) {
      void loadTeamMissionDetail(selectedMissionId);
    }
  }, [selectedMissionId]);

  const pendingCount = missions.filter(
    (m) => (statusMap[m.missionId] ?? "Chờ nhận") === "Chờ nhận",
  ).length;

  const inProgressCount = missions.filter((m) =>
    ["Đang di chuyển", "Đang xử lý"].includes(
      statusMap[m.missionId] ?? "Chờ nhận",
    ),
  ).length;

  const totalPages = Math.max(1, Math.ceil(missions.length / ITEMS_PAGE_SIZE));
  const startIndex = (currentPage - 1) * ITEMS_PAGE_SIZE;
  const paginatedMissions = missions.slice(
    startIndex,
    startIndex + ITEMS_PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage((prevPage) => Math.min(Math.max(prevPage, 1), totalPages));
  }, [totalPages]);

  const selectedMission =
    missions.find((mission) => mission.missionId === selectedMissionId) ??
    missions[0];
  const selectedMissionDetail = selectedMission
    ? missionDetailsById[selectedMission.missionId]
    : undefined;

  const openDetail = (missionId: string) => {
    setSelectedMissionId(missionId);
    void loadTeamMissionDetail(missionId, true);
    setIsDetailOpen(true);
  };

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

  const handleAcceptMissionClick = async (missionId: string) => {
    setAcceptingMissionId(missionId);
    setAcceptError(null);

    try {
      await respondToMission(missionId, {
        response: "ACCEPT",
        note: "Đội chấp nhận nhiệm vụ",
      });

      setStatusMap((prev) => ({ ...prev, [missionId]: "Đang di chuyển" }));
      void loadTeamMissionDetail(missionId, true);
      onMissionAccepted?.(missionId);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể chấp nhận nhiệm vụ. Vui lòng thử lại.";
      setAcceptError(errorMessage);
    } finally {
      setAcceptingMissionId(null);
    }
  };

  const openAbortModal = (missionId: string) => {
    setAbortMissionId(missionId);
    setAbortReasonCode("RESOURCE_LIMIT");
    setAbortDetailNote("");
    setAbortError(null);
    setIsAbortModalOpen(true);
  };

  const handleSubmitAbortRequest = async () => {
    if (!abortMissionId) {
      return;
    }

    const trimmedDetailNote = abortDetailNote.trim();
    if (!trimmedDetailNote) {
      setAbortError("Vui lòng nhập chi tiết lý do hủy nhiệm vụ.");
      return;
    }

    setIsAbortSubmitting(true);
    setAbortError(null);

    try {
      await requestMissionAbort(abortMissionId, {
        reasonCode: abortReasonCode,
        detailNote: trimmedDetailNote,
      });
      setIsAbortModalOpen(false);
      setAbortMissionId(null);
      setAbortDetailNote("");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Gửi yêu cầu hủy thất bại. Vui lòng thử lại.";
      setAbortError(errorMessage);
    } finally {
      setIsAbortSubmitting(false);
    }
  };

  return (
    <div className="col-span-1 xl:col-span-2 rounded-2xl bg-white border border-[#c8ced6] p-6 overflow-auto">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-blue-950 font-primary">
            Nhiệm vụ của đội
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Xem nhanh mục tiêu, vị trí, mô tả hiện trường, nhân sự và phương
            tiện được gán cho từng nhiệm vụ.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void loadTeamMissions();
          }}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#c7ced7] bg-white px-3 py-2 text-sm font-semibold text-on-surface hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={14}
            className={isLoading ? "animate-spin" : undefined}
          />
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl bg-white border border-[#c8ced6] p-6 shadow-md min-h-[420px] flex items-center justify-center text-sm text-on-surface-variant">
          Đang tải dữ liệu nhiệm vụ...
        </div>
      ) : loadError ? (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-6 min-h-[420px] flex flex-col items-center justify-center text-sm text-red-700 gap-3">
          <AlertCircle size={20} />
          <p className="font-semibold">{loadError}</p>
          <button
            type="button"
            onClick={() => {
              void loadTeamMissions();
            }}
            className="text-xs font-bold text-red-700 hover:text-red-800 underline"
          >
            Thử lại
          </button>
        </div>
      ) : missions.length === 0 ? (
        <div className="rounded-2xl border border-[#c8ced6] p-6 min-h-[420px] flex items-center justify-center text-sm text-on-surface-variant">
          Chưa có nhiệm vụ nào.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm font-semibold text-blue-900">
                Tổng nhiệm vụ
              </p>
              <p className="text-3xl font-black text-blue-950 mt-1">
                {missions.length}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm font-semibold text-amber-900">Chờ nhận</p>
              <p className="text-3xl font-black text-amber-700 mt-1">
                {pendingCount}
              </p>
            </div>
            <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
              <p className="text-sm font-semibold text-purple-900">
                Đang thực hiện
              </p>
              <p className="text-3xl font-black text-purple-700 mt-1">
                {inProgressCount}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#c7ced7]">
            <table className="w-full text-sm">
              <thead className="bg-[#f0f2f5] text-on-surface-variant">
                <tr className="text-left border-b border-[#c7ced7]">
                  <th className="px-4 py-3 font-primary font-bold">
                    Mã nhiệm vụ
                  </th>
                  <th className="px-4 py-3 font-primary font-bold">Nhiệm vụ</th>
                  <th className="px-4 py-3 font-primary font-bold">Mã sự cố</th>
                  <th className="px-4 py-3 font-primary font-bold">Ưu tiên</th>
                  <th className="px-4 py-3 font-primary font-bold">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 font-primary font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMissions.map((mission) => {
                  const missionStatus =
                    statusMap[mission.missionId] ?? "Chờ nhận";
                  const priority = getPriority(mission.etaMinutes);
                  const isSelected =
                    selectedMissionId === mission.missionId && isDetailOpen;

                  return (
                    <tr
                      key={mission.missionId}
                      onClick={() => setSelectedMissionId(mission.missionId)}
                      className={`border-t border-[#c7ced7] cursor-pointer ${
                        isSelected ? "bg-blue-50" : "hover:bg-[#f9fafb]"
                      }`}
                    >
                      <td className="px-4 py-3 font-primary font-black text-blue-950">
                        {mission.missionCode}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-on-surface">
                          {mission.objective}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-1">
                          {mission.teams[0]?.teamName ?? ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">
                        {mission.incidentCode}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-md font-bold uppercase ${priorityStyles[priority]}`}
                        >
                          {priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-md font-semibold ${statusStyles[missionStatus]}`}
                        >
                          {missionStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {missionStatus === "Chờ nhận" ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleAcceptMissionClick(
                                  mission.missionId,
                                );
                              }}
                              disabled={
                                acceptingMissionId === mission.missionId
                              }
                              className="text-xs bg-blue-950 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-900 disabled:bg-slate-400 flex items-center gap-1 transition-colors"
                            >
                              {acceptingMissionId === mission.missionId ? (
                                <>
                                  <Loader size={14} className="animate-spin" />
                                  Đang xử lý...
                                </>
                              ) : (
                                "Nhận và xem"
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openAbortModal(mission.missionId);
                              }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                              aria-label="Hủy nhiệm vụ"
                              title="Hủy nhiệm vụ"
                            >
                              <Ban size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {onViewMission && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onViewMission(
                                    mission.missionId,
                                    missionStatus,
                                  );
                                }}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                                aria-label="Xem bản đồ"
                                title="Xem bản đồ"
                              >
                                <Eye size={16} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openDetail(mission.missionId);
                              }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-950 text-white hover:bg-blue-900"
                              aria-label="Xem chi tiết nhiệm vụ"
                              title="Xem chi tiết nhiệm vụ"
                            >
                              <FileText size={16} />
                            </button>
                            {missionStatus !== "Đã hoàn tất" && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openAbortModal(mission.missionId);
                                }}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                                aria-label="Hủy nhiệm vụ"
                                title="Hủy nhiệm vụ"
                              >
                                <Ban size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {missions.length > ITEMS_PAGE_SIZE && (
            <div className="mt-4 flex justify-center pointer-events-auto">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="rounded-lg border border-[#c7ced7] px-3 py-1.5 text-sm font-semibold text-on-surface disabled:opacity-50"
                >
                  Trước
                </button>

                {getPageNumbers().map((page, index) =>
                  page === "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-2 text-sm text-on-surface-variant"
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
                          : "border-[#c7ced7] text-on-surface hover:bg-[#f3f4f6]"
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
                  className="rounded-lg border border-[#c7ced7] px-3 py-1.5 text-sm font-semibold text-on-surface disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {acceptError && (
        <div className="fixed bottom-5 left-5 right-5 md:left-auto md:right-5 md:w-96 z-50 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle
            size={20}
            className="text-red-600 flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="text-sm font-semibold text-red-700">
              Lỗi chấp nhận nhiệm vụ
            </p>
            <p className="text-sm text-red-600 mt-1">{acceptError}</p>
            <button
              onClick={() => setAcceptError(null)}
              className="mt-3 text-xs font-semibold text-red-700 hover:text-red-800"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      <DetailsMission
        isOpen={isDetailOpen}
        mission={selectedMission ?? null}
        detail={selectedMissionDetail}
        onClose={() => setIsDetailOpen(false)}
        canAccept={
          (statusMap[selectedMission?.missionId ?? ""] ?? "Chờ nhận") ===
          "Chờ nhận"
        }
        isAccepting={acceptingMissionId === selectedMission?.missionId}
        onAccept={() => {
          if (selectedMission?.missionId) {
            void handleAcceptMissionClick(selectedMission.missionId);
            setIsDetailOpen(false);
          }
        }}
        onRequestAbort={() => {
          if (selectedMission?.missionId) {
            setIsDetailOpen(false);
            openAbortModal(selectedMission.missionId);
          }
        }}
      />

      {isAbortModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#c8ced6] bg-[#d7dce2] p-5 md:p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black tracking-[0.08em] text-[#1f2329] font-primary uppercase">
                Yêu cầu hủy nhiệm vụ
              </h3>
              <button
                type="button"
                onClick={() => setIsAbortModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-[#d6dde6] text-gray-600 hover:bg-gray-100"
                aria-label="Đóng modal hủy nhiệm vụ"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-sm font-semibold text-[#1f2329]">
                Lý do hủy
                <select
                  value={abortReasonCode}
                  onChange={(event) => setAbortReasonCode(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#c7ced7] bg-[#eef2f5] px-3 py-2.5 text-sm"
                >
                  <option value="RESOURCE_LIMIT">Thiếu nguồn lực</option>
                  <option value="UNSAFE_CONDITION">
                    Hiện trường không an toàn
                  </option>
                  <option value="DUPLICATED_MISSION">Nhiệm vụ bị trùng</option>
                  <option value="OTHER">Lý do khác</option>
                </select>
              </label>

              <label className="block text-sm font-semibold text-[#1f2329]">
                Chi tiết lý do hủy
                <textarea
                  value={abortDetailNote}
                  onChange={(event) => setAbortDetailNote(event.target.value)}
                  rows={4}
                  placeholder="Mô tả lý do cần hủy nhiệm vụ..."
                  className="mt-2 w-full resize-none rounded-xl border border-[#c7ced7] bg-[#eef2f5] px-3 py-2.5 text-sm"
                />
              </label>

              {abortError && (
                <p className="text-sm font-semibold text-red-700">
                  {abortError}
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  void handleSubmitAbortRequest();
                }}
                disabled={isAbortSubmitting}
                className="mt-2 w-full rounded-2xl bg-[#c9141b] px-4 py-3 text-2xl font-black text-white hover:bg-[#b01017] disabled:bg-slate-400"
              >
                {isAbortSubmitting ? "Đang gửi..." : "Gửi yêu cầu hủy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
