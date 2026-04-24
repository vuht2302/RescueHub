import React, { useEffect, useState } from "react";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Users,
  MapPin,
  Clock,
  Shield,
  Radio,
} from "lucide-react";
import { getIncidents, type IncidentItem } from "../services/incidentServices";
import { getAuthSession } from "../../../features/auth/services/authStorage";

// HandlingTeam type from incidents API
interface HandlingTeam {
  teamId: string;
  teamCode: string;
  teamName: string;
  isPrimaryTeam: boolean;
  missionId: string;
  missionCode: string;
  missionStatusCode: string;
  assignedAt: string;
}

// Mission type derived from incident with handlingTeams
interface MissionFromIncident {
  id: string;
  incidentCode: string;
  location: string;
  reportedAt: string;
  handlingTeams: HandlingTeam[];
  status: string;
}

export function CurrentMissionsSection() {
  const [missions, setMissions] = useState<MissionFromIncident[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] =
    useState<MissionFromIncident | null>(null);

  useEffect(() => {
    const fetchIncidentsWithTeams = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const session = getAuthSession();
        if (!session?.accessToken) {
          setError("Không có phiên đăng nhập");
          return;
        }

        // Fetch incidents from API
        const incidents = await getIncidents(session.accessToken);

        // Filter only incidents with handlingTeams (not empty)
        const incidentsWithTeams = incidents.filter(
          (incident: IncidentItem) =>
            incident.handlingTeams && incident.handlingTeams.length > 0,
        );

        // Convert to mission format
        const missionsData: MissionFromIncident[] = incidentsWithTeams.map(
          (incident: IncidentItem) => ({
            id: incident.id,
            incidentCode: incident.incidentCode,
            location: incident.location?.addressText || "Chưa có vị trí",
            reportedAt: incident.reportedAt,
            handlingTeams: incident.handlingTeams || [],
            status: incident.status?.code || "UNKNOWN",
          }),
        );

        setMissions(missionsData);
        if (missionsData.length > 0) {
          setSelectedMission(missionsData[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi khi tải nhiệm vụ");
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncidentsWithTeams();
  }, []);

  // Map mission status code to label
  function getMissionStatusLabel(statusCode: string): string {
    const labels: Record<string, string> = {
      EN_ROUTE: "Đang di chuyển",
      ON_SITE: "Tại hiện trường",
      RESCUING: "Đang cứu hộ",
      IN_PROGRESS: "Đang xử lý",
      COMPLETED: "Hoàn thành",
      RETURNING: "Đang quay về",
      ASSIGNED: "Đã phân công",
      DISPATCHED: "Đã điều phối",
    };
    return labels[statusCode] || statusCode;
  }

  // Map mission status code to color
  function getMissionStatusColor(statusCode: string): string {
    const colors: Record<string, string> = {
      EN_ROUTE: "bg-blue-500",
      ON_SITE: "bg-amber-500",
      RESCUING: "bg-red-500",
      IN_PROGRESS: "bg-amber-500",
      COMPLETED: "bg-green-500",
      RETURNING: "bg-gray-500",
      ASSIGNED: "bg-indigo-500",
      DISPATCHED: "bg-blue-500",
    };
    return colors[statusCode] || "bg-gray-500";
  }

  // Calculate progress based on status
  function calculateProgress(statusCode: string): number {
    const progressMap: Record<string, number> = {
      EN_ROUTE: 25,
      ASSIGNED: 25,
      DISPATCHED: 25,
      ON_SITE: 50,
      RESCUING: 75,
      IN_PROGRESS: 75,
      RETURNING: 90,
      COMPLETED: 100,
    };
    return progressMap[statusCode] || 0;
  }

  // Format date
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
          <p className="text-sm text-gray-700">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Missions List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
                Nhiệm vụ đang thực hiện ({missions.length})
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
                          ? "border-gray-800 bg-gray-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-xs text-gray-900">
                          {mission.incidentCode}
                        </p>
                        <span className="text-xs text-gray-500">
                          {mission.handlingTeams.length} đội
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-1 mb-2">
                        {mission.location}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} />
                        {formatDate(mission.reportedAt)}
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
                <div className="rounded-lg border border-gray-200 p-5 shadow-sm bg-white">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {selectedMission.incidentCode}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                        <MapPin size={16} />
                        {selectedMission.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Báo cáo lúc</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(selectedMission.reportedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Shield size={16} className="text-gray-600" />
                    <span className="text-sm text-gray-700">
                      Trạng thái:{" "}
                      <span className="font-medium">
                        {selectedMission.status}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Assigned Teams */}
                <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
                    Đội được phân công ({selectedMission.handlingTeams.length})
                  </h4>

                  <div className="space-y-3">
                    {selectedMission.handlingTeams.map((team) => {
                      const progress = calculateProgress(
                        team.missionStatusCode,
                      );
                      return (
                        <div
                          key={team.teamId}
                          className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition"
                        >
                          {/* Team Name & Status */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm text-gray-900">
                                  {team.teamName}
                                </p>
                                {team.isPrimaryTeam && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                                    Chính
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Mã đội: {team.teamCode} | Mã nhiệm vụ:{" "}
                                {team.missionCode}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Phân công lúc: {formatDate(team.assignedAt)}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap ${getMissionStatusColor(team.missionStatusCode)}`}
                            >
                              {getMissionStatusLabel(team.missionStatusCode)}
                            </span>
                          </div>

                          {/* Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-700">
                                Tiến độ
                              </span>
                              <span className="text-xs font-bold text-gray-900">
                                {progress}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all bg-gray-800"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
