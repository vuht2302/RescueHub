import React from "react";
import {
  MapPin,
  FileText,
  AlertCircle,
  Users,
  BarChart3,
  Rocket,
  Home,
} from "lucide-react";

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  onMenuChange,
}) => {
  const menuItems = [
    {
      id: "overview",
      label: "Trung tâm điều hành",
      icon: Home,
    },
    {
      id: "map",
      label: "Bản đồ nhiệm vụ",
      icon: MapPin,
    },
    {
      id: "current",
      label: "Nhiệm vụ hiện tạii",
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
  ];

  return (
    <aside className="w-64 bg-white shadow-lg h-screen overflow-y-auto fixed left-0 top-0 pt-6">
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
      </div>

      {/* Menu */}
      <nav className="space-y-2 px-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onMenuChange(item.id)}
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
    </aside>
  );
};
