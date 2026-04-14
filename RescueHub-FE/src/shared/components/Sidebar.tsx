import React from "react";
import { NavLink } from "react-router-dom";
import {
  Bell,
  ClipboardList,
  Crosshair,
  House,
  LifeBuoy,
  Send,
} from "lucide-react";

type SidebarItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const items: SidebarItem[] = [
  { to: "/home", label: "Trang chủ", icon: House },
  { to: "/track", label: "Theo dõi", icon: Crosshair },
  { to: "/alerts", label: "Cảnh báo", icon: Bell },
  { to: "/request", label: "Yêu cầu", icon: Send },
  { to: "/confirmed", label: "Báo cáo", icon: ClipboardList },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-20 md:w-72 border-r border-outline-variant/20 bg-surface-container-low/40 min-h-[calc(100vh-5rem)] sticky top-20 font-primary">
      <div className="px-3 md:px-4 py-6">
        <nav className="space-y-2">
          {items.map((item) => (
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
