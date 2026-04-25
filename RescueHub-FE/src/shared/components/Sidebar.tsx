import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  House,
  LifeBuoy,
  LayoutDashboard,
  Package,
  Truck,
  Car,
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
  LayoutGrid,
  SquareMenu,
  TrendingUp,
  PackageCheck,
  History,
} from "lucide-react";
import {
  useManager,
  type ManagerMenuItemType,
} from "../context/ManagerContext";
import { useCoordinator } from "../context/CoordinatorContext";
import { useRescueTeam } from "../context/RescueTeamContext";
import {
  getAuthSession,
  performLogout,
} from "../../features/auth/services/authStorage";

// Manager Menu Items
interface ManagerMenuItem {
  id: ManagerMenuItemType;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}

const managerMenuItems: ManagerMenuItem[] = [
  {
    id: "overview",
    label: "Tổng quan",
    icon: LayoutDashboard,
    color: "text-black-600",
  },
  {
    id: "inventory",
    label: "Quản lý kho",
    icon: Package,
    color: "text-black-600",
  },
  {
    id: "vehicle",
    label: "Quản lý phương tiện",
    icon: Car,
    color: "text-black-600",
  },
  {
    id: "rescue-team",
    label: "Quản lý đội cứu hộ",
    icon: Users,
    color: "text-black-600",
  },

  {
    id: "relief-distribution",
    label: "Phân phối cứu trợ",
    icon: PackageCheck,
    color: "text-black-600",
  },
  {
    id: "relief-hotspot",
    label: "Vùng cứu trợ",
    icon: TrendingUp,
    color: "text-black-600",
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
  icon: React.ComponentType<{ size?: number; className?: string }>;
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
    label: "Nhiệm vụ",
    icon: AlertCircle,
  },
  {
    id: "teams",
    label: "Trạng thái đội ngũ",
    icon: Users,
  },
];

// Rescue Team Menu Items
type RescueTeamMenuItemType =
  | "dashboard"
  | "map"
  | "missions"
  | "team"
  | "reports"
  | "relief-history";

interface RescueTeamMenuItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  id: RescueTeamMenuItemType;
}

const rescueTeamMenuItems: RescueTeamMenuItem[] = [
  { icon: LayoutGrid, label: "Trung tâm điều hành", id: "dashboard" },
  { icon: Map, label: "Bản đồ nhiệm vụ", id: "map" },
  { icon: FolderKanban, label: "Nhiệm vụ", id: "missions" },
  { icon: UserRound, label: "Trạng thái đội ngũ", id: "team" },
  { icon: History, label: "Lịch sử cứu trợ", id: "relief-history" },
];

interface CitizenMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
}

const citizenMenuItems: CitizenMenuItem[] = [
  {
    id: "overview",
    label: "Trung tâm bản đồ",
    icon: House,
    href: "/citizen",
  },

  {
    id: "relief-history",
    label: "Lịch sử",
    icon: LifeBuoy,
    href: "/citizen/history#history-relief",
  },
  {
    id: "profile",
    label: "Hồ sơ cá nhân",
    icon: UserRound,
    href: "/citizen/profile",
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const authSession = getAuthSession();
  const pathSegment = location.pathname.split("/")[1];

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await performLogout();
    } finally {
      navigate("/home", { replace: true });
      setIsLoggingOut(false);
    }
  };

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

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-semibold"
          >
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
      <aside
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
          <p className="text-xs text-gray-600 mt-1">Quản lý cứu hộ</p>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {coordinatorMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeCoordinator === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveCoordinator(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive ? "bg-blue-50 shadow-sm" : "hover:bg-gray-50"
                }`}
              >
                <Icon
                  size={20}
                  className={isActive ? "text-blue-600" : "text-gray-600"}
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

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-60 transition-colors text-sm font-semibold"
          >
            <LogOut size={16} />
            {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
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
      <aside
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
          <p className="text-xs text-gray-600 mt-1">Quản lý nhiệm vụ cứu hộ</p>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {rescueTeamMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTeam === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTeam(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive ? "bg-blue-50 shadow-sm" : "hover:bg-gray-50"
                }`}
              >
                <Icon
                  size={20}
                  className={isActive ? "text-blue-600" : "text-gray-600"}
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

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-60 transition-colors text-sm font-semibold"
          >
            <LogOut size={16} />
            {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
          </button>
        </div>
      </aside>
    );
  }

  if (pathSegment === "citizen") {
    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    const displayName = authSession?.user.displayName?.trim() || "Công dân";

    const isCitizenItemActive = (href: string) => {
      if (href === "/citizen") {
        return (
          location.pathname === "/citizen" && !location.search && !location.hash
        );
      }

      return currentPath.startsWith(href);
    };

    return (
      <aside
        className="fixed left-0 top-0 w-64 h-screen bg-white shadow-lg flex flex-col border-r border-gray-200"
        style={{ fontFamily: "var(--font-primary)" }}
      >
        <div className="p-6 border-b border-gray-200">
          <h1
            className="text-2xl font-black"
            style={{ color: "var(--color-blue-950)" }}
          >
            RescueHub
          </h1>
          <p className="text-xs text-gray-600 mt-1">Cổng dịch vụ công dân</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {citizenMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isCitizenItemActive(item.href);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive ? "bg-blue-50 shadow-sm" : "hover:bg-gray-50"
                }`}
              >
                <Icon
                  size={20}
                  className={isActive ? "text-blue-600" : "text-gray-600"}
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

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between gap-3">
            <p
              className="text-sm font-semibold text-slate-800 truncate"
              title={displayName}
            >
              {displayName}
            </p>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-60 transition-colors text-sm font-semibold"
            >
              <LogOut size={16} />
              {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // No left sidebar for public routes.
  return null;
};
