import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Bell,
  ClipboardList,
  Crosshair,
  House,
  LifeBuoy,
  Send,
  LayoutDashboard,
  Package,
  Truck,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  MapPin,
  AlertCircle,
  Users,
  Rocket,
  Map,
  FolderKanban,
  UserRound,
  BookText,
  LayoutGrid,
} from "lucide-react";
import { useManager } from "../context/ManagerContext";
import { useCoordinator } from "../context/CoordinatorContext";
import { useRescueTeam } from "../context/RescueTeamContext";

type SidebarItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const generalItems: SidebarItem[] = [
  { to: "/home", label: "Trang chủ", icon: House },
  { to: "/track", label: "Theo dõi", icon: Crosshair },
  { to: "/alerts", label: "Cảnh báo", icon: Bell },
  { to: "/request", label: "Yêu cầu", icon: Send },
  { to: "/confirmed", label: "Báo cáo", icon: ClipboardList },
];

// Manager Menu Items
interface ManagerMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}

const managerMenuItems: ManagerMenuItem[] = [
  {
    id: "overview",
    label: "Tổng quan",
    icon: LayoutDashboard,
    color: "text-blue-600",
  },
  {
    id: "inventory",
    label: "Quản lý kho",
    icon: Package,
    color: "text-orange-600",
  },
  {
    id: "import-export",
    label: "Xuất nhập kho",
    icon: Truck,
    color: "text-green-600",
  },
  {
    id: "expiry",
    label: "Hạn sử dụng",
    icon: Calendar,
    color: "text-red-600",
  },
  {
    id: "reports",
    label: "Báo cáo & thống kê",
    icon: BarChart3,
    color: "text-purple-600",
  },
  {
    id: "settings",
    label: "Cài đặt",
    icon: Settings,
    color: "text-gray-600",
  },
];

// Rescue Coordinator Menu Items
type CoordinatorMenuItemType =
  | "overview"
  | "map"
  | "current"
  | "teams"
  | "reports"
  | "dispatch";

interface CoordinatorMenuItem {
  id: CoordinatorMenuItemType;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

const coordinatorMenuItems: CoordinatorMenuItem[] = [
  {
    id: "overview",
    label: "Trung tâm điều hành",
    icon: House,
  },
  {
    id: "map",
    label: "Bản đồ nhiệm vụ",
    icon: MapPin,
  },
  {
    id: "current",
    label: "Nhiệm vụ hiện tại",
    icon: AlertCircle,
  },
  {
    id: "teams",
    label: "Trạng thái đội ngũ",
    icon: Users,
  },
  {
    id: "reports",
    label: "Báo cáo",
    icon: BarChart3,
  },
  {
    id: "dispatch",
    label: "Triển khai đơn vị",
    icon: Rocket,
  },
];

// Rescue Team Menu Items
type RescueTeamMenuItemType =
  | "dashboard"
  | "map"
  | "missions"
  | "team"
  | "reports";

interface RescueTeamMenuItem {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  id: RescueTeamMenuItemType;
}

const rescueTeamMenuItems: RescueTeamMenuItem[] = [
  { icon: LayoutGrid, label: "Trung tâm điều hành", id: "dashboard" },
  { icon: Map, label: "Bản đồ nhiệm vụ", id: "map" },
  { icon: FolderKanban, label: "Nhiệm vụ hiện tại", id: "missions" },
  { icon: UserRound, label: "Trạng thái đội ngũ", id: "team" },
  { icon: BookText, label: "Báo cáo", id: "reports" },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const pathSegment = location.pathname.split("/")[1];

  // Manager Sidebar
  if (pathSegment === "manager") {
    const { activeMenu: activeManager, setActiveMenu: setActiveManager } =
      useManager();
    return (
      <div
        className="fixed left-0 top-0 w-64 h-screen bg-white shadow-lg flex flex-col border-r border-gray-200"
        style={{ fontFamily: "var(--font-primary)" }}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <h1
            className="text-2xl font-black"
            style={{ color: "var(--color-blue-950)" }}
          >
            RescueHub
          </h1>
          <p className="text-xs text-gray-600 mt-1">Quản lý kho & tài sản</p>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {managerMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeManager === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveManager(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive ? "bg-blue-50 shadow-sm" : "hover:bg-gray-50"
                }`}
                style={
                  isActive
                    ? {
                        borderLeft: `4px solid var(--color-blue-950)`,
                        paddingLeft: "12px",
                      }
                    : {}
                }
              >
                <Icon
                  size={20}
                  className={isActive ? "text-blue-600" : item.color}
                />
                <span
                  className={`text-sm font-semibold flex-1 text-left ${
                    isActive
                      ? "text-blue-950"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                  style={isActive ? { color: "var(--color-blue-950)" } : {}}
                >
                  {item.label}
                </span>
                {isActive && (
                  <ChevronRight
                    size={16}
                    style={{ color: "var(--color-blue-950)" }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Action */}
        <div className="p-4 border-t border-gray-200">
          <button
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-white font-bold transition-all hover:shadow-lg"
            style={{
              backgroundColor: "var(--color-blue-950)",
              fontFamily: "var(--font-primary)",
            }}
          >
            <Truck size={18} />
            Yêu cầu nhập kho
          </button>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button className="w-full flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-semibold">
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  // Rescue Coordinator Sidebar
  if (pathSegment === "rescue-coordinator") {
    const {
      activeMenu: activeCoordinator,
      setActiveMenu: setActiveCoordinator,
    } = useCoordinator();

    return (
      <aside className="fixed left-0 top-0 w-64 bg-white shadow-lg h-screen overflow-y-auto border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="px-6 mb-8">
          <h1
            className="text-2xl font-black text-gray-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Rescue
          </h1>
          <h2
            className="text-2xl font-black text-blue-950"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Guardian
          </h2>
          <p className="text-xs text-gray-500 mt-1">BỘ CHỈ HUY QUẢN LÝ</p>
          <p className="text-xs text-gray-500">Khu vực 7 Delta</p>
        </div>

        {/* Menu */}
        <nav className="space-y-2 px-4">
          {coordinatorMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeCoordinator === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveCoordinator(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-950 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Button */}
        <div className="absolute bottom-6 left-4 right-4">
          <button
            className="w-full bg-blue-950 hover:bg-blue-900 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            style={{
              backgroundColor: "var(--color-blue-950)",
              fontFamily: "var(--font-primary)",
            }}
          >
            <Rocket size={18} />
            Triển khai đơn vị
          </button>
        </div>
      </aside>
    );
  }

  // Rescue Team Sidebar
  if (pathSegment === "rescue-team") {
    const { activeMenu: activeTeam, setActiveMenu: setActiveTeam } =
      useRescueTeam();
    return (
      <aside className="fixed left-0 top-0 w-64 h-screen bg-[#edf0f3] border-r border-[#d1d7df] flex flex-col overflow-y-auto">
        <div className="px-6 py-5 border-b border-[#d1d7df] flex-shrink-0">
          <h2 className="text-3xl tracking-tight font-black text-blue-950">
            RescueHub
          </h2>
        </div>

        <nav className="px-4 py-5 space-y-1">
          {rescueTeamMenuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTeam(item.id)}
              className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl transition-colors ${
                activeTeam === item.id
                  ? "bg-blue-950/10 text-blue-950"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <item.icon size={18} />
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto px-4 pb-6">
          <button
            type="button"
            className="w-full rounded-2xl bg-blue-950 text-white px-4 py-3.5 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-950/25"
          >
            <Rocket size={16} />
            Triển khai đơn vị
          </button>
        </div>
      </aside>
    );
  }

  // General Sidebar (for other routes)
  return (
    <aside className="w-20 md:w-72 border-r border-outline-variant/20 bg-surface-container-low/40 min-h-[calc(100vh-5rem)] sticky top-20 font-primary">
      <div className="px-3 md:px-4 py-6">
        <p className="hidden md:block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-4">
          Điều hướng
        </p>

        <nav className="space-y-2">
          {generalItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-3 font-semibold transition-all ${
                  isActive
                    ? "bg-blue-950 text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`
              }
            >
              <item.icon size={18} className="shrink-0" />
              <span className="hidden md:inline text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};
