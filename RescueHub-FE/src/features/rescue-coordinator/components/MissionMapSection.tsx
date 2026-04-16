import React, { useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  MapPin,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { getCurrentMissions, CurrentMission } from "../services/currentMissionsService";
import { getAuthSession } from "../../../features/auth/services/authStorage";

interface SelectedMission extends CurrentMission {
  latitude?: number;
  longitude?: number;
}

export function MissionMapSection() {
  const [missions, setMissions] = useState<SelectedMission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<SelectedMission | null>(
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
        // Add mock coordinates for demo - in real app, API would provide these
        const missionsWithCoords: SelectedMission[] = response.missions.map(
          (mission, index) => ({
            ...mission,
            // Mock coordinates distributed across map
            latitude: 21.0285 + (index % 3) * 0.015,
            longitude: 105.8542 + Math.floor(index / 3) * 0.015,
          }),
        );
        setMissions(missionsWithCoords);
        if (missionsWithCoords.length > 0) {
          setSelectedMission(missionsWithCoords[0]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Lỗi khi tải nhiệm vụ"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMissions();
  }, []);

  const getPriorityColor = (priority: "critical" | "high" | "medium" | "low") => {
    switch (priority) {
      case "critical":
        return { bg: "bg-red-500", border: "border-red-600", light: "bg-red-100" };
      case "high":
        return { bg: "bg-orange-500", border: "border-orange-600", light: "bg-orange-100" };
      case "medium":
        return {
          bg: "bg-yellow-500",
          border: "border-yellow-600",
          light: "bg-yellow-100",
        };
      case "low":
        return { bg: "bg-blue-500", border: "border-blue-600", light: "bg-blue-100" };
    }
  };

  const getPriorityLabel = (priority: "critical" | "high" | "medium" | "low") => {
    const labels = {
      critical: "Rất nghiêm trọng",
      high: "Nghiêm trọng",
      medium: "Trung bình",
      low: "Thấp",
    };
    return labels[priority];
  };

  const getTeamStatusColor = (
    status: "en-route" | "on-scene" | "completed" | "cancelled",
  ) => {
    switch (status) {
      case "en-route":
        return "bg-blue-100 text-blue-800";
      case "on-scene":
        return "bg-orange-100 text-orange-800";
      case "completed":
        return "bg-emerald-100 text-emerald-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
    }
  };

  const getTeamStatusLabel = (
    status: "en-route" | "on-scene" | "completed" | "cancelled",
  ) => {
    switch (status) {
      case "en-route":
        return "Đang tới";
      case "on-scene":
        return "Tại hiện trường";
      case "completed":
        return "Hoàn tất";
      case "cancelled":
        return "Đã hủy";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 border border-red-200">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 flex flex-col items-center justify-center h-96">
        <MapPin className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-gray-500">Không có nhiệm vụ nào đang diễn ra</p>
      </div>
    );
  }

  const minLat = Math.min(...missions.map((m) => m.latitude || 0));
  const maxLat = Math.max(...missions.map((m) => m.latitude || 0));
  const minLng = Math.min(...missions.map((m) => m.longitude || 0));
  const maxLng = Math.max(...missions.map((m) => m.longitude || 0));

  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  const getMapPosition = (mission: SelectedMission) => {
    const lat = mission.latitude || 0;
    const lng = mission.longitude || 0;
    const left = ((lng - minLng) / lngRange) * 100;
    const top = ((lat - minLat) / latRange) * 100;
    return { left: `${left}%`, top: `${top}%` };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen">
      {/* Map View */}
      <div className="lg:col-span-3">
        <div className="relative w-full h-full bg-linear-to-br from-slate-50 to-slate-100 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Map Background */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

          {/* Mission Pins */}
          {missions.map((mission) => {
            const position = getMapPosition(mission);
            const priorityColor = getPriorityColor(mission.priority);
            const isSelected = selectedMission?.id === mission.id;

            return (
              <div
                key={mission.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{
                  left: position.left,
                  top: position.top,
                }}
              >
                {/* Pulse Effect */}
                <div
                  className={`absolute inset-0 rounded-full animate-pulse ${priorityColor.light}`}
                  style={{
                    width: "60px",
                    height: "60px",
                    left: "-30px",
                    top: "-30px",
                  }}
                />

                {/* Pin Button */}
                <button
                  onClick={() => setSelectedMission(mission)}
                  className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg transition-all transform group-hover:scale-110 ${
                    isSelected
                      ? `${priorityColor.bg} ring-4 ring-offset-2 ring-blue-300 scale-125`
                      : priorityColor.bg
                  } border-2 ${priorityColor.border}`}
                >
                  <MapPin className="h-5 w-5" />
                </button>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  <p className="text-xs font-bold text-gray-900">
                    {mission.incidentCode}
                  </p>
                  <p className="text-xs text-gray-600 max-w-xs line-clamp-1">
                    {mission.location}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md border border-gray-200 p-3">
            <p className="text-xs font-bold text-gray-700 mb-2">Mức độ ưu tiên</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-600">Rất nghiêm trọng</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-xs text-gray-600">Nghiêm trọng</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs text-gray-600">Trung bình</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs text-gray-600">Thấp</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Details Panel */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-y-auto flex flex-col">
          {selectedMission ? (
            <>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-start gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedMission.incidentCode}
                  </h3>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ${
                      selectedMission.priority === "critical"
                        ? "bg-red-100 text-red-800"
                        : selectedMission.priority === "high"
                          ? "bg-orange-100 text-orange-800"
                          : selectedMission.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {getPriorityLabel(selectedMission.priority)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {selectedMission.location}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedMission.description}
                </p>
              </div>

              {/* Mission Timeline */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold">Bắt đầu lúc</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 ml-6">
                  {new Date(selectedMission.startedAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Assigned Teams */}
              <div className="p-4 flex-1 overflow-y-auto">
                <h4 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wide">
                  Đội được phân công
                </h4>

                <div className="space-y-2">
                  {selectedMission.assignedTeams.map((team) => (
                    <div
                      key={team.id}
                      className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-900">
                          {team.name}
                        </p>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${getTeamStatusColor(
                            team.status,
                          )}`}
                        >
                          {team.status === "cancelled" && (
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                          )}
                          {team.status === "completed" && (
                            <CheckCircle2 className="h-3 w-3 inline mr-1" />
                          )}
                          {getTeamStatusLabel(team.status)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      {team.status !== "cancelled" && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">
                              {team.progress}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
                      )}

                      {/* ETA or Cancel Reason */}
                      {team.status === "en-route" && (
                        <p className="text-xs text-gray-600">
                          ETA: <span className="font-semibold">{team.etaMinutes} phút</span>
                        </p>
                      )}

                      {team.status === "cancelled" && team.cancelReason && (
                        <p className="text-xs text-red-700 mt-1">
                          <AlertCircle className="h-3 w-3 inline mr-1" />
                          {team.cancelReason}
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mt-1">
                        Cập nhật:{" "}
                        {new Date(team.lastUpdate).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Critical Alert */}
                {selectedMission.assignedTeams.some((t) => t.status === "cancelled") && (
                  <div className="mt-4 rounded-lg bg-red-50 p-3 border border-red-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-red-900">
                          Có đội đã hủy
                        </p>
                        <p className="text-xs text-red-800 mt-1">
                          Cần điều phối đội khác ngay
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Bấm vào biểu tượng trên bản đồ để xem chi tiết
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
