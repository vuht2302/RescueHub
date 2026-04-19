import React from "react";
import {
  FolderKanban,
  AlertCircle,
  Clock,
  CheckCircle,
  Activity,
  RefreshCw,
} from "lucide-react";
import { TeamDashboardData } from "../services/teamDashboardService";

interface DashboardViewProps {
  dashboard: TeamDashboardData | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onReloadData: () => void;
  isReloadingData: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  dashboard,
  isLoading,
  error,
  onRetry,
  onReloadData,
  isReloadingData,
}) => {
  const recentMissions = dashboard?.recentMissions ?? [];

  return (
    <div className="col-span-1 xl:col-span-2 space-y-4 overflow-auto">
      <div className="rounded-2xl bg-white border border-[#c8ced6] p-3 flex justify-end">
        <button
          type="button"
          onClick={onReloadData}
          disabled={isReloadingData}
          className="inline-flex items-center gap-2 rounded-lg border border-[#c7ced7] bg-white px-3 py-2 text-sm font-semibold text-on-surface hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={14}
            className={isReloadingData ? "animate-spin" : undefined}
          />
          {isReloadingData ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl bg-white border border-[#c8ced6] p-6 shadow-md min-h-[420px] flex items-center justify-center text-sm text-on-surface-variant">
          Đang tải dữ liệu dashboard...
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-white border border-[#c8ced6] p-6 shadow-md min-h-[420px] flex flex-col items-center justify-center text-center gap-3">
          <p className="text-sm font-semibold text-red-600">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-900"
          >
            <RefreshCw size={16} />
            Tải lại dashboard
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="rounded-2xl bg-white border border-[#c8ced6] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-on-surface-variant">
                  Chờ phản hồi
                </p>
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <FolderKanban size={20} strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-3xl font-black text-blue-950">
                {dashboard?.pendingResponseCount ?? 0}
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-[#c8ced6] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-on-surface-variant">
                  Đang hoạt động
                </p>
                <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                  <AlertCircle size={20} strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-3xl font-black text-blue-950">
                {dashboard?.activeMissionCount ?? 0}
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-[#c8ced6] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-on-surface-variant">
                  H.thành hôm nay
                </p>
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                  <CheckCircle size={20} strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-3xl font-black text-blue-950">
                {dashboard?.completedTodayCount ?? 0}
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-[#c8ced6] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-on-surface-variant">
                  Chờ hủy
                </p>
                <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                  <Clock size={20} strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-3xl font-black text-blue-950">
                {dashboard?.pendingAbortCount ?? 0}
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-[#c8ced6] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-on-surface-variant">
                  Chờ chi viện
                </p>
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                  <Activity size={20} strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-3xl font-black text-blue-950">
                {dashboard?.pendingSupportCount ?? 0}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[#c8ced6] p-6 shadow-md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-blue-950 font-primary flex items-center gap-2">
                  <Activity size={20} className="text-blue-600" />
                  Nhiệm vụ gần đây
                </h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  5 nhiệm vụ mới nhất từ dashboard team.
                </p>
              </div>
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.16em]">
                {recentMissions.length} mục
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {recentMissions.map((mission) => (
                <div
                  key={mission.missionId}
                  className="rounded-xl border border-[#d6dde6] bg-[#f8fafc] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-blue-950">
                        {mission.missionCode}
                      </p>
                      <p className="text-sm text-on-surface mt-1 line-clamp-2">
                        {mission.objective}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-md px-2 py-1 text-[10px] font-bold uppercase text-white"
                      style={{ backgroundColor: mission.status.color }}
                    >
                      {mission.status.name}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-on-surface-variant">
                    Cập nhật:{" "}
                    {new Date(mission.updatedAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              ))}

              {recentMissions.length === 0 && (
                <p className="text-sm text-on-surface-variant text-center py-6">
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
