import React, { useEffect, useState } from "react";
import { Bell, Crosshair, Settings } from "lucide-react";
import { useRescueTeam } from "../../../shared/context/RescueTeamContext";
import { DashboardView } from "./DashboardView";
import { MapView } from "./MapView";
import { MissionsView } from "./MissionsView";
import { ReliefHistoryView } from "./ReliefHistoryView";
import { TeamView } from "./TeamView";
import {
  getTeamDashboard,
  TeamDashboardData,
} from "../services/teamDashboardService";
import {
  getTeamMissionDetail,
  getTeamMissions,
  getTeamMembers,
  TeamMissionDetail,
  TeamMissionListItem,
  TeamMemberItem,
  TeamMemberSkill,
} from "../services/teamMissionService";
import {
  Mission,
  MissionLog,
  MissionStatus,
  UiTeamMember,
} from "../types/mission";
import { getIncidentDetailWithAuth } from "../../rescue-coordinator/services/incidentServices";

const getInitialsFromName = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "--";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

const mapMemberSkills = (skills: TeamMemberSkill[]): UiTeamMember["skills"] => {
  return skills.map((skill) => ({
    id: skill.teamMemberSkillId,
    code: skill.skillCode,
    name: skill.skillName,
    levelCode: skill.levelCode,
    isPrimary: skill.isPrimary,
  }));
};

const mapApiMemberToUiMember = (member: TeamMemberItem): UiTeamMember => {
  const displayName =
    member.displayName ??
    member.fullName ??
    member.username ??
    "Thanh vien chua cap nhat";

  const primarySkill = member.skills.find((skill) => skill.isPrimary);
  const role = member.isTeamLeader
    ? "Đội trưởng"
    : (primarySkill?.skillName ?? "Thành viên");

  return {
    id: member.memberId,
    name: displayName,
    role,
    status: member.status.code === "AVAILABLE" ? "Sẵn sàng" : "Không sẵn sàng",
    avatar: getInitialsFromName(displayName),
    phone: member.phone,
    isTeamLeader: member.isTeamLeader,
    notes: member.notes,
    lastKnownLocation: member.lastKnownLocation,
    skills: mapMemberSkills(member.skills),
    memberId: member.memberId,
    fullName: member.fullName,
    userId: member.userId,
    username: member.username,
    displayName: member.displayName,
    createdAt: member.createdAt,
  };
};

const statusStyles: Record<MissionStatus, string> = {
  "Chờ nhận": "bg-surface-container-high text-on-surface-variant",
  "Đang di chuyển": "bg-blue-950/10 text-blue-950",
  "Đang xử lý": "bg-amber-100 text-amber-800",
  "Đã hoàn tất": "bg-emerald-100 text-emerald-700",
  "Tạm dừng": "bg-error-container text-error",
};

const priorityStyles: Record<string, string> = {
  "Khẩn cấp": "bg-error-container text-error",
  Cao: "bg-amber-100 text-amber-800",
  "Trung bình": "bg-blue-100 text-blue-800",
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

const formatMissionLogTime = (isoDateTime: string) => {
  const parsedDate = new Date(isoDateTime);
  if (Number.isNaN(parsedDate.getTime())) {
    return "--:--";
  }

  return parsedDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const RescueTeamMission: React.FC = () => {
  const { activeMenu, setActiveMenu } = useRescueTeam();
  const [dashboard, setDashboard] = useState<TeamDashboardData | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [teamMissions, setTeamMissions] = useState<TeamMissionListItem[]>([]);
  const [missionDetailsById, setMissionDetailsById] = useState<
    Record<string, TeamMissionDetail>
  >({});
  const [incidentCoordsById, setIncidentCoordsById] = useState<
    Record<string, { lat: number; lng: number }>
  >({});
  const [incidentAddressesById, setIncidentAddressesById] = useState<
    Record<string, string>
  >({});
  const [incidentReportersById, setIncidentReportersById] = useState<
    Record<string, { name: string; phone: string }>
  >({});
  const [isTeamMissionsLoading, setIsTeamMissionsLoading] = useState(false);
  const [teamMissionsError, setTeamMissionsError] = useState<string | null>(
    null,
  );
  const [teamMembers, setTeamMembers] = useState<UiTeamMember[]>([]);
  const [teamId, setTeamId] = useState<string>("");
  const [teamStatus, setTeamStatus] = useState<string>("AVAILABLE");
  const [isTeamMembersLoading, setIsTeamMembersLoading] = useState(false);
  const [teamMembersError, setTeamMembersError] = useState<string | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState("");
  const [statusMap, setStatusMap] = useState<Record<string, MissionStatus>>({});
  const [logs, setLogs] = useState<MissionLog[]>([]);
  const [reportStatus, setReportStatus] = useState<MissionStatus>("Đang xử lý");

  const loadDashboard = async () => {
    setIsDashboardLoading(true);
    setDashboardError(null);

    try {
      const response = await getTeamDashboard();
      setDashboard(response);
    } catch (error) {
      setDashboardError(
        error instanceof Error ? error.message : "Khong tai duoc dashboard doi",
      );
    } finally {
      setIsDashboardLoading(false);
    }
  };

  const loadTeamMissions = async () => {
    setIsTeamMissionsLoading(true);
    setTeamMissionsError(null);

    try {
      const response = await getTeamMissions();
      setTeamMissions(response.items);
    } catch (error) {
      setTeamMissionsError(
        error instanceof Error
          ? error.message
          : "Khong tai duoc danh sach nhiem vu doi",
      );
    } finally {
      setIsTeamMissionsLoading(false);
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

      // Fetch incident detail to get coordinates and reporter info for the map marker.
      const incidentId =
        detail.incident?.incidentId ?? detail.incident?.incidentCode;
      if (incidentId) {
        try {
          const incident = await getIncidentDetailWithAuth(incidentId);
          if (
            incident.location?.lat != null &&
            incident.location?.lng != null
          ) {
            setIncidentCoordsById((prev) => ({
              ...prev,
              [missionId]: {
                lat: incident.location.lat,
                lng: incident.location.lng,
              },
            }));
          }
          if (incident.location?.addressText) {
            setIncidentAddressesById((prev) => ({
              ...prev,
              [missionId]: incident.location.addressText,
            }));
          }
          if (incident.reporter?.name || incident.reporter?.phone) {
            setIncidentReportersById((prev) => ({
              ...prev,
              [missionId]: {
                name: incident.reporter.name,
                phone: incident.reporter.phone,
              },
            }));
          }
        } catch {
          // Silently ignore — missing incident data won't crash the UI.
        }
      }
    } catch {
      // Keep list data as fallback when mission detail endpoint is unavailable.
    }
  };

  const loadTeamMembers = async () => {
    setIsTeamMembersLoading(true);
    setTeamMembersError(null);

    try {
      const response = await getTeamMembers();
      const flattenedMembers = response.items.flatMap((team) => team.members);
      const mappedMembers = flattenedMembers.map(mapApiMemberToUiMember);

      setTeamMembers(mappedMembers);
      // Extract teamId and teamStatus from the first team item if available
      if (response.items.length > 0) {
        setTeamId(response.items[0].teamId);
        setTeamStatus(response.items[0].status?.code ?? "AVAILABLE");
      }
    } catch (error) {
      setTeamMembersError(
        error instanceof Error
          ? error.message
          : "Khong tai duoc danh sach thanh vien doi",
      );
    } finally {
      setIsTeamMembersLoading(false);
    }
  };

  useEffect(() => {
    void loadTeamMissions();
    void loadTeamMembers();
  }, []);

  useEffect(() => {
    if (teamMissions.length === 0) {
      return;
    }

    const hasSelectedMission = teamMissions.some(
      (mission) => mission.missionId === selectedMissionId,
    );

    if (!hasSelectedMission) {
      const firstMissionId = teamMissions[0].missionId;
      setSelectedMissionId(firstMissionId);
      void loadTeamMissionDetail(firstMissionId);
    }
  }, [teamMissions, selectedMissionId]);

  useEffect(() => {
    const isApiMissionSelected = teamMissions.some(
      (mission) => mission.missionId === selectedMissionId,
    );

    if (!isApiMissionSelected) {
      return;
    }

    void loadTeamMissionDetail(selectedMissionId);
  }, [selectedMissionId, teamMissions]);

  useEffect(() => {
    if (teamMissions.length === 0) {
      return;
    }

    const mappedStatus = teamMissions.reduce<Record<string, MissionStatus>>(
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

    setStatusMap((prev) => ({
      ...prev,
      ...mappedStatus,
    }));
  }, [teamMissions]);

  useEffect(() => {
    const currentDetail = missionDetailsById[selectedMissionId];
    if (!currentDetail) {
      return;
    }

    const primaryTeam =
      currentDetail.teams.find((team) => team.isPrimary) ??
      currentDetail.teams[0];

    setStatusMap((prev) => ({
      ...prev,
      [selectedMissionId]: mapBackendStatusToUiStatus(
        currentDetail.status?.code,
        primaryTeam?.responseStatus,
      ),
    }));
  }, [missionDetailsById, selectedMissionId]);

  useEffect(() => {
    void loadDashboard();
  }, []);

  const reloadAllRescueTeamData = async () => {
    await Promise.all([loadDashboard(), loadTeamMissions(), loadTeamMembers()]);
  };

  const reloadMapData = async () => {
    await loadTeamMissions();
    if (selectedMissionId) {
      await loadTeamMissionDetail(selectedMissionId, true);
    }
  };

  // Chuẩn hóa dữ liệu API sang mô hình UI dùng chung cho các view.
  const mappedApiMissions: Mission[] = teamMissions.map((mission) => {
    const detail = missionDetailsById[mission.missionId];
    const etaMinutes = detail?.etaMinutes ?? mission.etaMinutes;
    const missionSummary =
      detail?.incident?.description?.trim() ||
      detail?.resultSummary ||
      mission.objective;

    const incidentCoord = incidentCoordsById[mission.missionId];
    const incidentAddress = incidentAddressesById[mission.missionId];
    const reporter = incidentReportersById[mission.missionId];
    const primaryTeam =
      detail?.teams.find((team) => team.isPrimary) ??
      detail?.teams[0] ??
      mission.teams.find((team) => team.isPrimary) ??
      mission.teams[0];

    return {
      id: mission.missionId,
      code: mission.missionCode,
      incidentId: mission.incidentId,
      incidentCode: mission.incidentCode,
      type: "Cứu hộ",
      title: mission.objective,
      requester: reporter?.name ?? "",
      phone: reporter?.phone ?? "",
      address: incidentAddress ?? "",
      priority:
        etaMinutes <= 10 ? "Khẩn cấp" : etaMinutes <= 20 ? "Cao" : "Trung bình",
      summary: missionSummary,
      assignedTeam: primaryTeam?.teamName ?? "",
      assignedMembers: [],
      assignedVehicles: [],
      coord: incidentCoord ?? { lat: 0, lng: 0 },
    };
  });

  const sourceMissions = mappedApiMissions;

  const selectedMission =
    sourceMissions.find((mission) => mission.id === selectedMissionId) ??
    sourceMissions[0];

  const selectedMissionDetail = selectedMission
    ? missionDetailsById[selectedMission.id]
    : undefined;

  const detailHistoryLogs: MissionLog[] = selectedMissionDetail
    ? selectedMissionDetail.statusHistory.map((historyItem, index) => ({
        id: `history-${selectedMissionDetail.missionId}-${index}`,
        missionId: selectedMissionDetail.missionId,
        time: formatMissionLogTime(historyItem.changedAt),
        content:
          historyItem.note?.trim() ||
          `[${historyItem.actionCode}] ${historyItem.fromState ?? "--"} -> ${historyItem.toState}`,
      }))
    : [];

  const detailReportLogs: MissionLog[] = selectedMissionDetail
    ? selectedMissionDetail.reports.map((reportItem) => ({
        id: `report-${reportItem.reportId}`,
        missionId: selectedMissionDetail.missionId,
        time: formatMissionLogTime(reportItem.reportedAt),
        content: `[${reportItem.reportTypeCode}] ${reportItem.summary}`,
      }))
    : [];

  const missionLogs = [...detailHistoryLogs, ...detailReportLogs, ...logs];

  const handleAcceptMission = (missionId: string) => {
    setStatusMap((prev) => ({ ...prev, [missionId]: "Đang di chuyển" }));
    void loadTeamMissionDetail(missionId, true);
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}`,
        missionId,
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        content: "Đội cứu hộ đã tiếp nhận nhiệm vụ và bắt đầu di chuyển.",
      },
    ]);
  };

  const handleSubmitReport = (status: MissionStatus, reportText: string) => {
    if (!selectedMission) {
      return;
    }

    setStatusMap((prev) => ({ ...prev, [selectedMission.id]: status }));
    void loadTeamMissionDetail(selectedMission.id, true);
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}`,
        missionId: selectedMission.id,
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        content: `Cập nhật ${status}: ${reportText}`,
      },
    ]);
  };

  const handleAbortRequestSubmitted = (
    reasonCode: string,
    detailNote: string,
  ) => {
    if (!selectedMission) {
      return;
    }

    void loadTeamMissionDetail(selectedMission.id, true);
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}`,
        missionId: selectedMission.id,
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        content: `Đã gửi yêu cầu hủy nhiệm vụ (${reasonCode}): ${detailNote}`,
      },
    ]);
  };

  const handleViewMission = (
    mission: TeamMissionListItem,
    status: MissionStatus,
  ) => {
    setTeamMissions((prev) => {
      const existed = prev.some((item) => item.missionId === mission.missionId);
      if (existed) {
        return prev;
      }

      return [mission, ...prev];
    });

    setSelectedMissionId(mission.missionId);
    setReportStatus(status);
    void loadTeamMissionDetail(mission.missionId, true);
    setActiveMenu("map");
  };

  const handleRequestMissionAction = (
    missionId: string,
    action: "Xin hủy" | "Xin chi viện",
  ) => {
    const mission = sourceMissions.find((item) => item.id === missionId);
    if (!mission) {
      return;
    }

    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}`,
        missionId,
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        content: `Đội trưởng đã gửi yêu cầu ${action.toLowerCase()} cho nhiệm vụ ${mission.code}.`,
      },
    ]);
    setSelectedMissionId(missionId);
  };

  return (
    <div className="h-screen bg-gray-50 overflow-hidden font-sans text-gray-800">
      <section className="h-full flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-8 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-6 h-6 rounded-md bg-blue-950 lg:hidden" />
            <div className="hidden md:flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 min-w-[260px] shadow-sm">
              <Crosshair size={14} className="text-on-surface-variant" />
              <input
                className="ml-2 text-sm bg-transparent outline-none w-full"
                placeholder="Tìm kiếm mã nhiệm vụ..."
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-on-surface-variant">
            <Bell size={18} />
            <Settings size={18} />
            <div className="w-8 h-8 rounded-full bg-blue-950 text-white grid place-items-center text-xs font-bold">
              AG
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_430px] gap-4 p-4 md:p-6 h-[calc(100vh-4rem)]">
          {activeMenu === "dashboard" && (
            <DashboardView
              dashboard={dashboard}
              isLoading={isDashboardLoading}
              error={dashboardError}
              onRetry={() => {
                void loadDashboard();
              }}
              onReloadData={() => {
                void loadDashboard();
              }}
              isReloadingData={isDashboardLoading}
            />
          )}

          {activeMenu === "map" &&
            (selectedMission ? (
              <MapView
                selectedMission={selectedMission}
                statusMap={statusMap}
                logs={missionLogs}
                priorityStyles={priorityStyles}
                missions={sourceMissions}
                teamMembers={teamMembers}
                onMissionSelect={setSelectedMissionId}
                reportStatus={reportStatus}
                onStatusChange={setReportStatus}
                onSubmitReport={handleSubmitReport}
                onAbortRequestSubmitted={handleAbortRequestSubmitted}
                onReloadData={() => {
                  void reloadMapData();
                }}
                isReloadingData={isTeamMissionsLoading}
              />
            ) : (
              <article className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
                Chưa có nhiệm vụ để hiển thị bản đồ.
              </article>
            ))}

          {activeMenu === "missions" && (
            <MissionsView
              onViewMission={handleViewMission}
              onMissionAccepted={(missionId) => {
                setSelectedMissionId(missionId);
                setReportStatus("Đang di chuyển");
                setActiveMenu("map");
              }}
            />
          )}

          {activeMenu === "team" && (
            <TeamView
              teamMembers={teamMembers}
              teamId={teamId}
              isLeader
              isLoading={isTeamMembersLoading}
              error={teamMembersError}
              onReloadData={() => {
                void loadTeamMembers();
              }}
              isReloadingData={isTeamMembersLoading}
              onRetry={() => {
                void loadTeamMembers();
              }}
              currentTeamStatus={teamStatus}
              onStatusUpdated={(newStatus) => {
                if (newStatus) {
                  setTeamStatus(newStatus);
                }
                void loadDashboard();
              }}
            />
          )}

          {activeMenu === "relief-history" && <ReliefHistoryView />}
        </div>
      </section>
    </div>
  );
};
