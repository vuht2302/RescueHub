import React from "react";
import {
  LayoutGrid,
  Map,
  FolderKanban,
  UserRound,
  BookText,
  Rocket,
} from "lucide-react";

type MenuItemType = "dashboard" | "map" | "missions" | "team" | "reports";

type MenuItem = {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  id: MenuItemType;
};

interface SidebarProps {
  activeMenu: MenuItemType;
  onMenuClick: (menuId: MenuItemType) => void;
}

const leftMenu: MenuItem[] = [
  { icon: LayoutGrid, label: "Trung tâm điều hành", id: "dashboard" },
  { icon: Map, label: "Bản đồ nhiệm vụ", id: "map" },
  { icon: FolderKanban, label: "Nhiệm vụ hiện tại", id: "missions" },
  { icon: UserRound, label: "Trạng thái đội ngũ", id: "team" },
  { icon: BookText, label: "Báo cáo", id: "reports" },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  onMenuClick,
}) => {
  return (
    <aside className="hidden lg:flex flex-col bg-[#edf0f3] border-r border-[#d1d7df] font-primary">
      <div className="px-6 py-5 border-b border-[#d1d7df]">
        <h2 className="text-3xl tracking-tight font-black text-blue-950">
          RescueHub
        </h2>
      </div>

      <nav className="px-4 py-5 space-y-1">
        {leftMenu.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onMenuClick(item.id)}
            className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl transition-colors ${
              activeMenu === item.id
                ? "bg-blue-950/10 text-blue-950"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <item.icon size={18} />
            <span className="font-semibold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};
