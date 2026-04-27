import React, { useState, useEffect } from "react";
import { AlertCircle, Loader, RefreshCw, X } from "lucide-react";
import { DetailsMission } from "../components/DetailsMission";
import {
  getTeamMissions,
  requestMissionAbort,
  respondToMission,
  getTeamMissionDetail,
} from "../services/teamMissionService";
import {
  MissionStatus,
  TeamMissionListItem,
  TeamMissionDetail,
} from "../types/mission";
import { createSupportRequest } from "@/src/shared/services/team.service";
import { createFieldReport } from "@/src/shared/services/fieldReport.service";

const priorityStyles: Record<string, string> = {
  "Khẩn cấp": "bg-red-100 text-red-700",
  Cao: "bg-amber-100 text-amber-800",
  "Trung bình": "bg-blue-100 text-blue-800",
};

const statusStyles: Record<MissionStatus, string> = {
  "Chờ nhận": "bg-gray-100 text-gray-700",
  "Đang di chuyển": "bg-blue-100 text-blue-800",
  "Đang xử lý": "bg-amber-100 text-amber-800",
  "Đã hoàn tất": "bg-emerald-100 text-emerald-700",
  "Tạm dừng": "bg-red-100 text-red-700",
};

const mapBackendStatusToUiStatus = (
  statusCode?: string,
  teamResponseStatus?: string,
): MissionStatus => {
  const normalizedStatusCode = statusCode?.toUpperCase();
  const normalizedResponseStatus = teamResponseStatus?.toUpperCase();

  if (
    normalizedStatusCode === "ABORTED" ||
    normalizedStatusCode === "CANCELLED" ||
    normalizedStatusCode === "ABORT_PENDING"
  ) {
    return "Tạm dừng";
  }

  if (normalizedStatusCode === "COMPLETED") {
    return "Đã hoàn tất";
  }

  if (
    normalizedStatusCode === "RESCUING" ||
    normalizedStatusCode === "IN_PROGRESS" ||
    normalizedStatusCode === "ON_SITE"
  ) {
    return "Đang xử lý";
  }

  if (
    normalizedStatusCode === "ASSIGNED" ||
    normalizedStatusCode === "DISPATCHED" ||
    normalizedStatusCode === "ARRIVED" ||
    normalizedStatusCode === "EN_ROUTE"
  ) {
    return "Đang di chuyển";
  }

  if (normalizedResponseStatus === "ACCEPTED") {
    return "Đang di chuyển";
  }

  if (normalizedResponseStatus === "REJECTED") {
    return "Tạm dừng";
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
  const [totalMissionCount, setTotalMissionCount] = useState(0);
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
  const [openActionMenuMissionId, setOpenActionMenuMissionId] = useState<
    string | null
  >(null);
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
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportMissionId, setSupportMissionId] = useState<string | null>(null);
  const [supportTypeCode, setSupportTypeCode] = useState("MEDICAL");
  const [supportDetailNote, setSupportDetailNote] = useState("");
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const openSupportModal = (missionId: string) => {
    setSupportMissionId(missionId);
    setSupportTypeCode("MEDICAL");
    setSupportDetailNote("");
    setSupportError(null);
    setIsSupportModalOpen(true);
  };
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportMissionId, setReportMissionId] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportData, setReportData] = useState({
    reportTypeCode: "PROGRESS",
    summary: "",
    victimRescuedCount: 0,
    victimUnreachableCount: 0,
    casualtyCount: 0,
    nextActionNote: "",
  });
  const openReportModal = (missionId: string) => {
    setReportMissionId(missionId);
    setReportError(null);
    setIsReportModalOpen(true);
  };
  const handleSubmitReport = async () => {
    if (!reportMissionId) return;

    if (!reportData.summary.trim()) {
      setReportError("Vui lòng nhập mô tả báo cáo");
      return;
    }

    try {
      setReportLoading(true);
      setReportError(null);

      await createFieldReport(reportMissionId, {
        ...reportData,

        sceneDetails: [
          {
            factorCode: "GENERAL",
            valueText: reportData.summary,
          },
        ],
        fileIds: [],
      });

      alert("Gửi báo cáo thành công");

      setIsReportModalOpen(false);
      setReportMissionId(null);
    } catch (err: any) {
      console.log(err);
      setReportError(err.message || "Gửi báo cáo thất bại");
    } finally {
      setReportLoading(false);
    }
  };
  const handleSubmitSupportRequest = async () => {
    if (!supportMissionId) return;

    if (!supportDetailNote.trim()) {
      setSupportError("Vui lòng nhập nội dung hỗ trợ");
      return;
    }

    try {
      setIsSubmittingSupport(true);
      setSupportError(null);

      await createSupportRequest(supportMissionId, {
        supportTypeCode,
        detailNote: supportDetailNote,
      });

      setIsSupportModalOpen(false);
      setSupportMissionId(null);
      setSupportDetailNote("");

      alert("Gửi yêu cầu hỗ trợ thành công");
    } catch (err: any) {
      setSupportError(err.message || "Gửi thất bại");
    } finally {
      setIsSubmittingSupport(false);
    }
  };
  const loadTeamMissions = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await getTeamMissions();
      const items = response.items;

      setMissions(items);
      setTotalMissionCount(response.totalItems ?? items.length);

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

  const completedStatuses = new Set(["COMPLETED"]);
  const canceledStatuses = new Set(["CANCELLED", "ABORTED", "ABORT_PENDING"]);

  const completedCount = missions.filter((mission) =>
    completedStatuses.has(mission.status.code.toUpperCase()),
  ).length;

  const canceledCount = missions.filter((mission) =>
    canceledStatuses.has(mission.status.code.toUpperCase()),
  ).length;

  const inProgressCount = missions.filter((mission) => {
    const normalizedStatus = mission.status.code.toUpperCase();
    return (
      !completedStatuses.has(normalizedStatus) &&
      !canceledStatuses.has(normalizedStatus)
    );
  }).length;

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
  const toNumber = (val: string) => (val ? Number(val) : 0);
  return (
    <div className="col-span-1 xl:col-span-2 rounded-xl bg-white border border-gray-200 p-6 overflow-auto shadow-sm">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Nhiệm vụ của đội</h2>
          <p className="text-sm text-gray-500 mt-1">
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
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
        >
          <RefreshCw
            size={14}
            className={isLoading ? "animate-spin" : undefined}
          />
          {isLoading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm min-h-105 flex items-center justify-center text-sm text-gray-500">
          Đang tải dữ liệu nhiệm vụ...
        </div>
      ) : loadError ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 min-h-105 flex flex-col items-center justify-center text-sm text-red-700 gap-3">
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
        <div className="rounded-xl border border-gray-200 p-6 min-h-105 flex items-center justify-center text-sm text-gray-500">
          Chưa có nhiệm vụ nào.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm font-semibold text-blue-900">
                Tổng nhiệm vụ
              </p>
              <p className="text-3xl font-black text-blue-950 mt-1">
                {totalMissionCount}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm font-semibold text-amber-900">
                Đang thực hiện
              </p>
              <p className="text-3xl font-black text-amber-700 mt-1">
                {inProgressCount}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <p className="text-sm font-semibold text-emerald-900">
                Đã hoàn thành
              </p>
              <p className="text-3xl font-black text-emerald-700 mt-1">
                {completedCount}
              </p>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
              <p className="text-sm font-semibold text-rose-900">Đã hủy</p>
              <p className="text-3xl font-black text-rose-700 mt-1">
                {canceledCount}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr className="text-left border-b border-gray-200">
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
                      onClick={() => {
                        setSelectedMissionId(mission.missionId);
                        setOpenActionMenuMissionId(null);
                      }}
                      className={`border-t border-gray-200 cursor-pointer ${
                        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 font-primary font-black text-blue-950">
                        {mission.missionCode}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">
                          {mission.objective}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {mission.teams[0]?.teamName ?? ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {mission.incidentCode}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs px-2 py-1 rounded-md font-bold uppercase whitespace-nowrap ${priorityStyles[priority]}`}
                        >
                          {priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs px-2 py-1 rounded-md font-semibold whitespace-nowrap ${statusStyles[missionStatus]}`}
                        >
                          {missionStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {missionStatus === "Chờ nhận" ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleAcceptMissionClick(mission.missionId);
                            }}
                            disabled={acceptingMissionId === mission.missionId}
                            className="text-xs bg-blue-950 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-900 disabled:bg-gray-400 inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                          >
                            {acceptingMissionId === mission.missionId ? (
                              <>
                                <Loader size={12} className="animate-spin" />
                                <span className="hidden sm:inline">
                                  Đang xử lý...
                                </span>
                              </>
                            ) : (
                              "Nhận nhiệm vụ"
                            )}
                          </button>
                        ) : (
                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenActionMenuMissionId((prev) =>
                                  prev === mission.missionId
                                    ? null
                                    : mission.missionId,
                                );
                              }}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                            >
                              Thao tác
                            </button>

                            {openActionMenuMissionId === mission.missionId && (
                              <div
                                className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg z-20 p-1"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openSupportModal(mission.missionId);
                                    setOpenActionMenuMissionId(null);
                                  }}
                                  className="w-full rounded-md px-2.5 py-2 text-left text-xs font-semibold text-yellow-700 hover:bg-yellow-50"
                                >
                                  Yêu cầu hỗ trợ
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openAbortModal(mission.missionId);
                                    setOpenActionMenuMissionId(null);
                                  }}
                                  className="w-full rounded-md px-2.5 py-2 text-left text-xs font-semibold text-red-700 hover:bg-red-50"
                                >
                                  Yêu cầu hủy
                                </button>
                                {onViewMission && (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onViewMission(
                                        mission.missionId,
                                        missionStatus,
                                      );
                                      setOpenActionMenuMissionId(null);
                                    }}
                                    className="w-full rounded-md px-2.5 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-100"
                                  >
                                    Xem bản đồ
                                  </button>
                                )}
                              </div>
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
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 disabled:opacity-50 hover:bg-gray-50"
                >
                  Trước
                </button>

                {getPageNumbers().map((page, index) =>
                  page === "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-2 text-sm text-gray-500"
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
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
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
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 disabled:opacity-50 hover:bg-gray-50"
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
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
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
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-5 md:p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-gray-800 font-primary uppercase tracking-wide">
                Yêu cầu hủy nhiệm vụ
              </h3>
              <button
                type="button"
                onClick={() => setIsAbortModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200"
                aria-label="Đóng modal hủy nhiệm vụ"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Lý do hủy
                <select
                  value={abortReasonCode}
                  onChange={(event) => setAbortReasonCode(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="RESOURCE_LIMIT">Thiếu nguồn lực</option>
                  <option value="UNSAFE_CONDITION">
                    Hiện trường không an toàn
                  </option>
                  <option value="DUPLICATED_MISSION">Nhiệm vụ bị trùng</option>
                  <option value="OTHER">Lý do khác</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                Chi tiết lý do hủy
                <textarea
                  value={abortDetailNote}
                  onChange={(event) => setAbortDetailNote(event.target.value)}
                  rows={4}
                  placeholder="Mô tả lý do cần hủy nhiệm vụ..."
                  className="mt-2 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              >
                Submit
              </button>
              ;
            </div>
          </div>
        </div>
      )}

      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-5 md:p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-gray-800 font-primary uppercase tracking-wide">
                Yêu cầu hỗ trợ
              </h3>
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200"
                aria-label="Đóng modal hỗ trợ"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Loại hỗ trợ
                <select
                  value={supportTypeCode}
                  onChange={(event) => setSupportTypeCode(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MEDICAL">Y tế</option>
                  <option value="TECHNICAL">Công nghệ</option>
                  <option value="LOGISTICS">Vận chuyển</option>
                  <option value="OTHER">Lý do khác</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                Nội dung hỗ trợ
                <textarea
                  value={supportDetailNote}
                  onChange={(event) => setSupportDetailNote(event.target.value)}
                  rows={4}
                  placeholder="Mô tả nội dung hỗ trợ..."
                  className="mt-2 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              {supportError && (
                <p className="text-sm font-semibold text-red-700">
                  {supportError}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  void handleSubmitSupportRequest();
                }}
                disabled={isSubmittingSupport}
              >
                Submit
              </button>
              ;
            </div>
          </div>
        </div>
      )}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl">
            {/* HEADER */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Báo cáo hiện trường</h3>
              <button onClick={() => setIsReportModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* SUMMARY */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Mô tả hiện trường
                </label>
                <textarea
                  value={reportData.summary}
                  onChange={(e) =>
                    setReportData({ ...reportData, summary: e.target.value })
                  }
                  className="mt-1 w-full border rounded-lg p-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Loại báo cáo
                </label>
                <select
                  value={reportData.reportTypeCode}
                  onChange={(e) =>
                    setReportData({
                      ...reportData,
                      reportTypeCode: e.target.value,
                    })
                  }
                  className="mt-1 w-full border rounded-lg p-2"
                >
                  <option value="PROGRESS">Đang xử lý</option>
                  <option value="ON_SITE">Đã có mặt</option>
                  <option value="FINAL">Hoàn tất</option>
                </select>
              </div>

              {/* RESCUED */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Số người cứu được
                </label>
                <input
                  type="number"
                  value={reportData.victimRescuedCount}
                  onChange={(e) =>
                    setReportData({
                      ...reportData,
                      victimRescuedCount: toNumber(e.target.value),
                    })
                  }
                  className="mt-1 w-full border rounded-lg p-2"
                />
              </div>

              {/* UNREACHABLE */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Số người chưa tiếp cận
                </label>
                <input
                  type="number"
                  value={reportData.victimUnreachableCount}
                  onChange={(e) =>
                    setReportData({
                      ...reportData,
                      victimUnreachableCount: Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full border rounded-lg p-2"
                />
              </div>

              {/* CASUALTY */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Số thương vong
                </label>
                <input
                  type="number"
                  value={reportData.casualtyCount}
                  onChange={(e) =>
                    setReportData({
                      ...reportData,
                      casualtyCount: Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full border rounded-lg p-2"
                />
              </div>

              {/* NEXT ACTION */}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Hành động tiếp theo
                </label>
                <textarea
                  value={reportData.nextActionNote}
                  onChange={(e) =>
                    setReportData({
                      ...reportData,
                      nextActionNote: e.target.value,
                    })
                  }
                  className="mt-1 w-full border rounded-lg p-2"
                  rows={3}
                />
              </div>

              {/* ERROR */}
              {reportError && (
                <p className="text-red-500 text-sm">{reportError}</p>
              )}

              {/* BUTTON */}
              <button
                onClick={handleSubmitReport}
                disabled={reportLoading}
                className="w-full bg-green-700 text-white py-3 rounded-xl font-bold"
              >
                {reportLoading ? "Đang gửi..." : "Gửi báo cáo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
