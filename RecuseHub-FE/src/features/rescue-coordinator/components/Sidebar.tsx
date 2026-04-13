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
        <p className="text-xs text-gray-500 mt-1">BỘ CHỈ HUY QUẢN LÝ</p>
        <p className="text-xs text-gray-500">Khu vực 7 Delta</p>
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
};
