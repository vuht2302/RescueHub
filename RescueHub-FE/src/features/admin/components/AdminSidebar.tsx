import React from "react";
import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  SquareMenu,
  BarChart3,
  ChevronRight,
} from "lucide-react";

export const adminMenu = [
  { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { id: "users", label: "Tài khoản", icon: Users },
  { id: "roles", label: "Vai trò", icon: Shield },
  { id: "master-data", label: "Danh mục hệ thống", icon: Settings },
  { id: "workflow", label: "Workflow", icon: SquareMenu },
  { id: "reports", label: "Báo cáo", icon: BarChart3 },
];

export const AdminSidebar = ({ active, setActive }) => {
  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-white shadow-lg flex flex-col border-r">
      {/* Logo */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-black text-blue-950">RescueHub</h1>
        <p className="text-xs text-gray-600">Quản trị hệ thống</p>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {adminMenu.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
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
                  isActive ? "text-blue-950" : "text-gray-700"
                }`}
              >
                {item.label}
              </span>
              {isActive && <ChevronRight size={16} />}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};