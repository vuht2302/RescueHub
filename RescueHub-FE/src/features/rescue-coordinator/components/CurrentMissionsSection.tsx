import React, { useEffect, useState } from "react";
import { Loader2, AlertTriangle, CheckCircle2, Navigation } from "lucide-react";
import {
  CurrentMission,
  getCurrentMissions,
} from "../services/currentMissionsService";
import { getAuthSession } from "../../../features/auth/services/authStorage";

export function CurrentMissionsSection() {
  const [missions, setMissions] = useState<CurrentMission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<CurrentMission | null>(
    null,
  );

  useEffect(() => {
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
  }, []);

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
        return "border-red-300 bg-red-50";
      case "high":
        return "border-orange-300 bg-orange-50";
      case "medium":
        return "border-yellow-300 bg-yellow-50";
      case "low":
        return "border-blue-300 bg-blue-50";
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
    <>
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Missions List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
                Nhiệm vụ đang thực hiện
              </h3>

              {missions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">
                    Không có nhiệm vụ nào đang diễn ra
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {missions.map((mission) => (
                    <button
                      key={mission.id}
                      onClick={() => setSelectedMission(mission)}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selectedMission?.id === mission.id
                          ? "border-cyan-500 bg-cyan-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <p className="font-semibold text-xs text-gray-900">
                        {mission.incidentCode}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                        {mission.location}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {mission.assignedTeams.length} đội
                        </span>
                        <span className="text-xs font-bold">
                          {mission.priority === "critical"
                            ? "🔴"
                            : mission.priority === "high"
                              ? "🟠"
                              : mission.priority === "medium"
                                ? "🟡"
                                : "🟢"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mission Details */}
          <div className="lg:col-span-2">
            {selectedMission ? (
              <div className="space-y-4">
                {/* Header Info */}
                <div
                  className={`rounded-lg border-2 p-5 shadow-sm bg-white ${getPriorityColor(
                    selectedMission.priority,
                  )}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {selectedMission.incidentCode}
                      </h3>
                      <p className="text-sm text-gray-600 mt-2">
                        {selectedMission.description}
                      </p>
                    </div>
                    <span className="text-xs font-bold whitespace-nowrap ml-4">
                      {getPriorityLabel(selectedMission.priority)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-300">
                    <div>
                      <p className="text-xs font-semibold text-gray-700 uppercase">
                        Vị trí
                      </p>
                      <p className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                        <Navigation className="h-4 w-4 flex-shrink-0" />
                        {selectedMission.location}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 uppercase">
                        Bắt đầu lúc
                      </p>
                      <p className="text-sm text-gray-900 mt-1">
                        {new Date(selectedMission.startedAt).toLocaleTimeString(
                          "vi-VN",
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assigned Teams */}
                <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                    Đội được phân công ({selectedMission.assignedTeams.length})
                  </h4>

                  <div className="space-y-3">
                    {selectedMission.assignedTeams.map((team) => {
                      const badge = getStatusBadge(team.status);
                      return (
                        <div
                          key={team.id}
                          className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition"
                        >
                          {/* Team Name & Status */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-gray-900">
                                {team.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Cập nhật:{" "}
                                {new Date(team.lastUpdate).toLocaleTimeString(
                                  "vi-VN",
                                )}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color} whitespace-nowrap`}
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
                            <div className="space-y-3">
                              {team.status === "en-route" && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">ETA:</span>
                                  <span className="font-semibold text-gray-900">
                                    {team.etaMinutes} phút
                                  </span>
                                </div>
                              )}

                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-gray-700">
                                    Tiến độ
                                  </span>
                                  <span className="text-xs font-bold text-gray-900">
                                    {team.progress}%
                                  </span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
                    <div className="mt-4 rounded-lg bg-orange-50 p-4 border border-orange-300">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-orange-900 text-sm">
                            ⚠️ Có đội đã hủy nhiệm vụ
                          </p>
                          <p className="text-sm text-orange-800 mt-1">
                            Vui lòng điều phối các đội khác để thay thế ngay
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 flex items-center justify-center h-96">
                <p className="text-gray-500">
                  Chọn một nhiệm vụ để xem chi tiết
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
