import React, { useEffect, useState } from "react";
import {
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Navigation,
} from "lucide-react";
import {
  CurrentMission,
  getCurrentMissions,
} from "../services/currentMissionsService";
import { getAuthSession } from "../../../features/auth/services/authStorage";

interface CurrentMissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CurrentMissionsModal({
  isOpen,
  onClose,
}: CurrentMissionsModalProps) {
  const [missions, setMissions] = useState<CurrentMission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<CurrentMission | null>(
    null,
  );

  useEffect(() => {
    if (!isOpen) return;

    const fetchMissions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const session = getAuthSession();
        if (!session?.accessToken) {
          setError("Không có phiên đăng nhập");
          return;
        }

        const response = await getCurrentMissions(session.accessToken);
        setMissions(response.missions);
        if (response.missions.length > 0) {
          setSelectedMission(response.missions[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi khi tải nhiệm vụ");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMissions();
  }, [isOpen]);

  if (!isOpen) return null;

  const getStatusBadge = (
    status: "en-route" | "on-scene" | "completed" | "cancelled",
  ) => {
    switch (status) {
      case "en-route":
        return { label: "Đang tới", color: "bg-blue-100 text-blue-800" };
      case "on-scene":
        return {
          label: "Tại hiện trường",
          color: "bg-orange-100 text-orange-800",
        };
      case "completed":
        return { label: "Hoàn tất", color: "bg-emerald-100 text-emerald-800" };
      case "cancelled":
        return { label: "Đã hủy", color: "bg-red-100 text-red-800" };
    }
  };

  const getPriorityColor = (
    priority: "critical" | "high" | "medium" | "low",
  ) => {
    switch (priority) {
      case "critical":
        return "border-red-200 bg-red-50";
      case "high":
        return "border-orange-200 bg-orange-50";
      case "medium":
        return "border-yellow-200 bg-yellow-50";
      case "low":
        return "border-blue-200 bg-blue-50";
    }
  };

  const getPriorityLabel = (
    priority: "critical" | "high" | "medium" | "low",
  ) => {
    const labels = {
      critical: "🔴 Rất nghiêm trọng",
      high: "🟠 Nghiêm trọng",
      medium: "🟡 Trung bình",
      low: "🟢 Thấp",
    };
    return labels[priority];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-lg bg-white shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 p-6">
          <h2
            className="text-2xl font-bold text-slate-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Nhiệm vụ hiện tại
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Missions List */}
          <div className="w-80 border-r border-slate-200 overflow-y-auto bg-slate-50">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="p-4">
                <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            ) : missions.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-slate-500">
                  Không có nhiệm vụ nào đang diễn ra
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {missions.map((mission) => (
                  <button
                    key={mission.id}
                    onClick={() => setSelectedMission(mission)}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      selectedMission?.id === mission.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-white hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-slate-900">
                          {mission.incidentCode}
                        </p>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                          {mission.location}
                        </p>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-full">
                        {mission.assignedTeams.length}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mission Details */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedMission ? (
              <div className="space-y-6">
                {/* Header Info */}
                <div
                  className={`rounded-lg border-2 p-4 ${getPriorityColor(
                    selectedMission.priority,
                  )}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {selectedMission.incidentCode}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {selectedMission.description}
                      </p>
                    </div>
                    <span className="text-sm font-bold">
                      {getPriorityLabel(selectedMission.priority)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-current border-opacity-20">
                    <div>
                      <p className="text-xs font-semibold text-slate-700 uppercase">
                        Vị trí
                      </p>
                      <p className="text-sm text-slate-900 mt-1 flex items-center gap-2">
                        <Navigation className="h-4 w-4" />
                        {selectedMission.location}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700 uppercase">
                        Bắt đầu lúc
                      </p>
                      <p className="text-sm text-slate-900 mt-1">
                        {new Date(selectedMission.startedAt).toLocaleTimeString(
                          "vi-VN",
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assigned Teams */}
                <div>
                  <h4
                    className="text-lg font-bold text-slate-900 mb-4"
                    style={{ fontFamily: "var(--font-primary)" }}
                  >
                    Đội được phân công ({selectedMission.assignedTeams.length})
                  </h4>

                  <div className="space-y-3">
                    {selectedMission.assignedTeams.map((team) => {
                      const badge = getStatusBadge(team.status);
                      return (
                        <div
                          key={team.id}
                          className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition"
                        >
                          {/* Team Name & Status */}
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {team.name}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Cập nhật lần cuối:{" "}
                                {new Date(team.lastUpdate).toLocaleTimeString(
                                  "vi-VN",
                                )}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}
                            >
                              {team.status === "cancelled" && (
                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                              )}
                              {team.status === "completed" && (
                                <CheckCircle2 className="h-3 w-3 inline mr-1" />
                              )}
                              {badge.label}
                            </span>
                          </div>

                          {/* Cancel Reason */}
                          {team.status === "cancelled" && team.cancelReason && (
                            <div className="mb-3 rounded-lg bg-red-50 p-3 border border-red-200">
                              <p className="text-xs font-semibold text-red-700">
                                Lý do hủy:
                              </p>
                              <p className="text-sm text-red-700 mt-1">
                                {team.cancelReason}
                              </p>
                            </div>
                          )}

                          {/* ETA & Progress */}
                          {team.status !== "cancelled" && (
                            <div className="space-y-2">
                              {team.status === "en-route" && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600">ETA:</span>
                                  <span className="font-semibold text-slate-900">
                                    {team.etaMinutes} phút
                                  </span>
                                </div>
                              )}

                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-slate-700">
                                    Tiến độ
                                  </span>
                                  <span className="text-xs font-bold text-slate-900">
                                    {team.progress}%
                                  </span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${team.progress}%`,
                                      backgroundColor:
                                        team.progress >= 80
                                          ? "#22c55e"
                                          : team.progress >= 50
                                            ? "#f59e0b"
                                            : "#ef4444",
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Cancelled Teams Alert */}
                  {selectedMission.assignedTeams.some(
                    (t) => t.status === "cancelled",
                  ) && (
                    <div className="mt-4 rounded-lg bg-orange-50 p-4 border border-orange-200">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-orange-900">
                            Có đội đã hủy nhiệm vụ
                          </p>
                          <p className="text-sm text-orange-800 mt-1">
                            Vui lòng điều phối các đội khác để thay thế
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">
                  Chọn một nhiệm vụ để xem chi tiết
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <button
            onClick={onClose}
            className="ml-auto block rounded-lg border border-slate-300 px-6 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
