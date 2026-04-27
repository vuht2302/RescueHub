import React from "react";
import {
  FolderKanban,
  AlertCircle,
  Clock,
  CheckCircle,
  Activity,
  RefreshCw,
} from "lucide-react";
import { TeamMissionListItem } from "../services/teamMissionService";

// Map backend status codes to Vietnamese display names
const mapBackendStatusToVietnamese = (statusCode: string): string => {
  const statusMap: Record<string, string> = {
    EN_ROUTE: "Đang di chuyển",
    ASSIGNED: "Đã phân công",
    COMPLETED: "Đã hoàn tất",
    RESCUING: "Đang xử lý",
    ON_SITE: "Đang xử lý",
    ARRIVED: "Đã đến nơi",
    PENDING: "Chờ nhận",
    ACCEPTED: "Đã tiếp nhận",
    CANCELLED: "Đã hủy",
    ABORTED: "Đã hủy",
  };

  return statusMap[statusCode] || statusCode;
};

// Map backend status codes to appropriate colors
const mapBackendStatusToColor = (statusCode: string): string => {
  const colorMap: Record<string, string> = {
    EN_ROUTE: "#3B82F6",
    ASSIGNED: "#14B8A6",
    COMPLETED: "#10B981",
    RESCUING: "#F59E0B",
    ON_SITE: "#F59E0B",
    ARRIVED: "#8B5CF6",
    PENDING: "#6B7280",
    ACCEPTED: "#14B8A6",
    CANCELLED: "#EF4444",
    ABORTED: "#EF4444",
  };

  return colorMap[statusCode] || "#3B82F6";
};

interface DashboardViewProps {
  totalMissionCount: number;
  recentMissions: TeamMissionListItem[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onReloadData: () => void;
  isReloadingData: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  totalMissionCount,
  recentMissions,
  isLoading,
  error,
  onRetry,
  onReloadData,
  isReloadingData,
}) => {
  const sortedRecentMissions = [...recentMissions]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 10);

  const completedStatuses = new Set(["COMPLETED"]);
  const canceledStatuses = new Set(["CANCELLED", "ABORTED", "ABORT_PENDING"]);

  const completedMissionCount = recentMissions.filter((mission) =>
    completedStatuses.has(mission.status.code.toUpperCase()),
  ).length;

  const canceledMissionCount = recentMissions.filter((mission) =>
    canceledStatuses.has(mission.status.code.toUpperCase()),
  ).length;

  const activeMissionCount = recentMissions.filter((mission) => {
    const normalizedStatus = mission.status.code.toUpperCase();
    return (
      !completedStatuses.has(normalizedStatus) &&
      !canceledStatuses.has(normalizedStatus)
    );
  }).length;

  return (
    <div className="col-span-1 xl:col-span-2 space-y-4 overflow-auto">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onReloadData}
          disabled={isReloadingData}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
        >
          <RefreshCw
            size={14}
            className={isReloadingData ? "animate-spin" : undefined}
          />
          {isReloadingData ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm min-h-[420px] flex items-center justify-center text-sm text-gray-500">
          Đang tải dữ liệu dashboard...
        </div>
      ) : error ? (
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm min-h-[420px] flex flex-col items-center justify-center text-center gap-3">
          <p className="text-sm font-semibold text-red-600">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-900"
          >
            <RefreshCw size={16} />
            Tải lại dashboard
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-600">Tổng nhiệm vụ</p>
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <FolderKanban size={20} strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-3xl font-black text-blue-950">
                {totalMissionCount}
              </p>
            </div>

            <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-600">
                  Đang thực hiện
                </p>
                <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                  <AlertCircle size={20} strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-3xl font-black text-blue-950">
                {activeMissionCount}
              </p>
            </div>

            <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-600">Đã hoàn thành</p>
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                  <CheckCircle size={20} strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-3xl font-black text-blue-950">
                {completedMissionCount}
              </p>
            </div>

            <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-600">Đã hủy</p>
                <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                  <Clock size={20} strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-3xl font-black text-blue-950">
                {canceledMissionCount}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-blue-950 font-primary flex items-center gap-2">
                  <Activity size={20} className="text-blue-600" />
                  Nhiệm vụ gần đây
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {sortedRecentMissions.length} nhiệm vụ mới nhất từ danh sách
                  nhiệm vụ của đội.
                </p>
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {sortedRecentMissions.length} mục
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {sortedRecentMissions.map((mission) => (
                <div
                  key={mission.missionId}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-blue-950">
                        {mission.missionCode}
                      </p>
                      <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                        {mission.objective}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-md px-2 py-1 text-[10px] font-bold uppercase text-white"
                      style={{
                        backgroundColor: mapBackendStatusToColor(
                          mission.status.code,
                        ),
                      }}
                    >
                      {mapBackendStatusToVietnamese(mission.status.code)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Cập nhật:{" "}
                    {new Date(mission.updatedAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              ))}

              {sortedRecentMissions.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-6">
                  Chưa có nhiệm vụ gần đây.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
