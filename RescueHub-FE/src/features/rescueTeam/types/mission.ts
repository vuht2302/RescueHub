export type MissionPriority = "Khẩn cấp" | "Cao" | "Trung bình";
export type MissionStatus =
  | "Chờ nhận"
  | "Đang di chuyển"
  | "Đang xử lý"
  | "Đã hoàn tất"
  | "Tạm dừng";

export type Mission = {
  id: string;
  code: string;
  type: "Cứu hộ" | "Cứu trợ";
  title: string;
  requester: string;
  phone: string;
  address: string;
  priority: MissionPriority;
  summary: string;
  assignedTeam: string;
  assignedMembers: string[];
  assignedVehicles: string[];
  coord: {
    lat: number;
    lng: number;
  };
};

export type MissionLog = {
  id: string;
  missionId: string;
  time: string;
  content: string;
};

export type TeamMemberSkill = {
  id: string;
  code: string;
  name: string;
  levelCode: string;
  isPrimary: boolean;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  status: "Available" | "Unavailable";
  avatar: string;
  phone?: string;
  isTeamLeader?: boolean;
  notes?: string | null;
  lastKnownLocation?: {
    lat: number;
    lng: number;
  } | null;
  skills?: TeamMemberSkill[];
};
