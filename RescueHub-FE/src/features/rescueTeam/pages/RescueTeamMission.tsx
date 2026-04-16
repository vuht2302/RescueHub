import React, { useEffect, useState } from "react";
import { Bell, Crosshair, Settings } from "lucide-react";
import { useRescueTeam } from "../../../shared/context/RescueTeamContext";
import { DashboardView } from "./DashboardView";
import { MapView } from "./MapView";
import { MissionsView } from "./MissionsView";
import { TeamView } from "./TeamView";
import { ReportsView } from "./ReportsView";
import {
  getTeamDashboard,
  TeamDashboardData,
} from "../services/teamDashboardService";
import {
  getTeamMissions,
  getTeamMembers,
  TeamMissionListItem,
  TeamMemberItem,
  TeamMemberSkill,
} from "../services/teamMissionService";
import {
  Mission,
  MissionLog,
  MissionStatus,
  TeamMember,
} from "../types/mission";

const missions: Mission[] = [
  {
    id: "rg-4492-d",
    code: "RG-4492-D",
    type: "Cứu hộ",
    title: "Cứu hộ khe nứt băng hà",
    requester: "Arthur Miller",
    phone: "(+84) 909 228 721",
    address: "North-West Ridge, Delta 7",
    priority: "Khẩn cấp",
    summary:
      "Nạn nhân bị ngã vào khe nứt nông, có dấu hiệu hạ thân nhiệt. Tín hiệu định vị còn hoạt động.",
    assignedTeam: "Đội phản ứng nhanh Alpha-2",
    assignedMembers: ["Nguyễn Văn An", "Trần Minh Tuấn", "Phạm Thị Linh"],
    assignedVehicles: ["Xe cứu hộ RH-21", "Mô tô tuyết ST-07"],
    coord: { lat: 10.7769, lng: 106.7009 },
  },
  {
    id: "rg-4510-b",
    code: "RG-4510-B",
    type: "Cứu hộ",
    title: "Sơ tán nhóm leo núi mắc kẹt",
    requester: "Lê Khánh Hà",
    phone: "(+84) 901 712 198",
    address: "Sườn Đông Glacier Pass, Delta 5",
    priority: "Cao",
    summary:
      "Nhóm 3 người mắc kẹt do gió lớn, không thể tự di chuyển xuống trạm an toàn.",
    assignedTeam: "Đội cứu nạn Bravo-1",
    assignedMembers: ["Lý Trung Kiên", "Đỗ Quốc Huy"],
    assignedVehicles: ["Xe địa hình BR-11"],
    coord: { lat: 16.0471, lng: 108.2068 },
  },
  {
    id: "rg-4522-a",
    code: "RG-4522-A",
    type: "Cứu trợ",
    title: "Tiếp tế y tế khẩn cấp",
    requester: "Trạm y tế Delta",
    phone: "(+84) 283 811 2299",
    address: "Khu nhà tạm tuyến 3, Delta 2",
    priority: "Trung bình",
    summary:
      "Yêu cầu cấp phát thuốc chống lạnh và oxy cho nhóm cư dân đang trú ẩn.",
    assignedTeam: "Đội hậu cần Charlie",
    assignedMembers: ["Phạm Thị Linh", "Lý Trung Kiên"],
    assignedVehicles: ["Xe tải y tế CL-03", "Xe bán tải CL-09"],
    coord: { lat: 21.0285, lng: 105.8542 },
  },
];

const teamMembersFallback: TeamMember[] = [
  {
    id: "tm-1",
    name: "Nguyễn Văn An",
    role: "Trưởng đội Alpha-2",
    status: "Unavailable",
    avatar: "NA",
  },
  {
    id: "tm-2",
    name: "Trần Minh Tuấn",
    role: "Thành viên Bravo-1",
    status: "Unavailable",
    avatar: "TT",
  },
  {
    id: "tm-3",
    name: "Phạm Thị Linh",
    role: "Chuyên viên y tế",
    status: "Available",
    avatar: "PL",
  },
  {
    id: "tm-4",
    name: "Lý Trung Kiên",
    role: "Thành viên Charlie",
    status: "Available",
    avatar: "LK",
  },
  {
    id: "tm-5",
    name: "Đỗ Quốc Huy",
    role: "Lái xe cứu hộ",
    status: "Unavailable",
    avatar: "DQ",
  },
];

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

const mapMemberSkills = (skills: TeamMemberSkill[]): TeamMember["skills"] => {
  return skills.map((skill) => ({
    id: skill.teamMemberSkillId,
    code: skill.skillCode,
    name: skill.skillName,
    levelCode: skill.levelCode,
    isPrimary: skill.isPrimary,
  }));
};

const mapApiMemberToUiMember = (member: TeamMemberItem): TeamMember => {
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
    status: member.status.code === "AVAILABLE" ? "Available" : "Unavailable",
    avatar: getInitialsFromName(displayName),
    phone: member.phone,
    isTeamLeader: member.isTeamLeader,
    notes: member.notes,
    lastKnownLocation: member.lastKnownLocation,
    skills: mapMemberSkills(member.skills),
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

export const RescueTeamMission: React.FC = () => {
  const { activeMenu, setActiveMenu } = useRescueTeam();
  const [dashboard, setDashboard] = useState<TeamDashboardData | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [teamMissions, setTeamMissions] = useState<TeamMissionListItem[]>([]);
  const [isTeamMissionsLoading, setIsTeamMissionsLoading] = useState(false);
  const [teamMissionsError, setTeamMissionsError] = useState<string | null>(
    null,
  );
  const [teamMembers, setTeamMembers] =
    useState<TeamMember[]>(teamMembersFallback);
  const [isTeamMembersLoading, setIsTeamMembersLoading] = useState(false);
  const [teamMembersError, setTeamMembersError] = useState<string | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState(missions[0].id);
  const [statusMap, setStatusMap] = useState<Record<string, MissionStatus>>({
    "rg-4492-d": "Chờ nhận",
    "rg-4510-b": "Đang di chuyển",
    "rg-4522-a": "Chờ nhận",
  });
  const [logs, setLogs] = useState<MissionLog[]>([
    {
      id: "log-1",
      missionId: "rg-4510-b",
      time: "10:22",
      content: "Đội Bravo-1 đã rời trạm và đang di chuyển đến điểm tập kết.",
    },
  ]);
  const [reportStatus, setReportStatus] = useState<MissionStatus>("Đang xử lý");

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

  const loadTeamMembers = async () => {
    setIsTeamMembersLoading(true);
    setTeamMembersError(null);

    try {
      const response = await getTeamMembers();
      const flattenedMembers = response.items.flatMap((team) => team.members);
      const mappedMembers = flattenedMembers.map(mapApiMemberToUiMember);

      setTeamMembers(mappedMembers);
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
    let isMounted = true;
  }, []);

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
    let isMounted = true;

    const loadDashboard = async () => {
      setIsDashboardLoading(true);
      setDashboardError(null);

      try {
        const response = await getTeamDashboard();
        if (!isMounted) {
          return;
        }

        setDashboard(response);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setDashboardError(
          error instanceof Error
            ? error.message
            : "Khong tai duoc dashboard doi",
        );
      } finally {
        if (isMounted) {
          setIsDashboardLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const mappedApiMissions: Mission[] = teamMissions.map((mission, index) => ({
    id: mission.missionId,
    code: mission.missionCode,
    type: "Cứu hộ",
    title: mission.objective,
    requester: "Chưa cập nhật",
    phone: "--",
    address: mission.incidentCode,
    priority:
      mission.etaMinutes <= 10
        ? "Khẩn cấp"
        : mission.etaMinutes <= 20
          ? "Cao"
          : "Trung bình",
    summary: mission.objective,
    assignedTeam:
      mission.teams.find((team) => team.isPrimary)?.teamName ??
      mission.teams[0]?.teamName ??
      "Chưa có đội",
    assignedMembers: [],
    assignedVehicles: [],
    coord: missions[index % missions.length].coord,
  }));

  const sourceMissions =
    mappedApiMissions.length > 0 ? mappedApiMissions : missions;

  const selectedMission =
    sourceMissions.find((mission) => mission.id === selectedMissionId) ??
    sourceMissions[0];

  const handleAcceptMission = (missionId: string) => {
    setStatusMap((prev) => ({ ...prev, [missionId]: "Đang di chuyển" }));
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
    setStatusMap((prev) => ({ ...prev, [selectedMission.id]: status }));
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

  const handleViewMission = (missionId: string, status: MissionStatus) => {
    setSelectedMissionId(missionId);
    setReportStatus(status);
    setActiveMenu("map");
  };

  const handleRequestMissionAction = (
    missionId: string,
    action: "Xin hủy" | "Xin chi viện",
  ) => {
    const mission = missions.find((item) => item.id === missionId);
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
    setActiveMenu("map");
  };

  return (
    <div className="h-screen bg-[#dfe3e8] overflow-hidden font-sans text-on-surface">
      <section className="h-full flex flex-col">
        <header className="h-16 bg-[#f0f2f5] border-b border-[#d1d7df] px-4 md:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-6 h-6 rounded-md bg-blue-950 lg:hidden" />
            <div className="hidden md:flex items-center bg-white border border-[#d4dbe3] rounded-lg px-3 py-2 min-w-[260px]">
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
                void (async () => {
                  setIsDashboardLoading(true);
                  setDashboardError(null);

                  try {
                    const response = await getTeamDashboard();
                    setDashboard(response);
                  } catch (error) {
                    setDashboardError(
                      error instanceof Error
                        ? error.message
                        : "Khong tai duoc dashboard doi",
                    );
                  } finally {
                    setIsDashboardLoading(false);
                  }
                })();
              }}
            />
          )}

          {activeMenu === "map" && (
            <MapView
              selectedMission={selectedMission}
              statusMap={statusMap}
              logs={logs}
              priorityStyles={priorityStyles}
              missions={sourceMissions}
              onMissionSelect={setSelectedMissionId}
              reportStatus={reportStatus}
              onStatusChange={setReportStatus}
              onSubmitReport={handleSubmitReport}
              onAbortRequestSubmitted={handleAbortRequestSubmitted}
            />
          )}

          {activeMenu === "missions" && (
            <MissionsView
              missions={sourceMissions}
              statusMap={statusMap}
              priorityStyles={priorityStyles}
              statusStyles={statusStyles}
              onAcceptMission={(missionId) => {
                handleAcceptMission(missionId);
                setSelectedMissionId(missionId);
                setReportStatus("Đang di chuyển");
                setActiveMenu("map");
              }}
              onViewMission={handleViewMission}
              onRequestMissionAction={handleRequestMissionAction}
            />
          )}

          {activeMenu === "team" && (
            <TeamView
              teamMembers={teamMembers}
              isLeader
              isLoading={isTeamMembersLoading}
              error={teamMembersError}
              onRetry={() => {
                void loadTeamMembers();
              }}
            />
          )}

          {activeMenu === "reports" && <ReportsView />}
        </div>
      </section>
    </div>
  );
};
