import React from "react";
import { UserCircle, Settings } from "lucide-react";
import { View } from "../../../shared/types";

interface TopBarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onViewChange,
}) => {
  return (
    <nav
      className="fixed top-0 w-full z-50 bg-blue-950 shadow-md flex justify-between items-center px-8 py-4"
      style={{ fontFamily: "var(--font-primary)" }}
    >
      <div className="flex items-center gap-8">
        <div
          className="text-xl font-black text-white tracking-tighter cursor-pointer"
          onClick={() => onViewChange("home")}
          style={{ fontFamily: "var(--font-primary)" }}
        >
          RecuseHub
        </div>
        <div className="hidden md:flex items-center gap-8  tracking-tight">
          <button
            onClick={() => onViewChange("home")}
            className={`pb-1 transition-colors ${currentView === "home" ? "text-white border-b-2 border-white" : "text-gray-300 hover:text-white"}`}
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Trang chủ
          </button>
          <button
            onClick={() => onViewChange("track")}
            className={`pb-1 transition-colors ${currentView === "track" ? "text-white border-b-2 border-white" : "text-gray-300 hover:text-white"}`}
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Theo dõi
          </button>
          <button
            onClick={() => onViewChange("alerts")}
            className={`pb-1 transition-colors ${currentView === "alerts" ? "text-white border-b-2 border-white" : "text-gray-300 hover:text-white"}`}
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Cảnh báo
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => onViewChange("request")}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg font-bold transition-all active:scale-95 text-sm"
          style={{ fontFamily: "var(--font-primary)" }}
        >
          Gửi tín hiệu
        </button>
        <div className="flex gap-2">
          <button className="p-2 text-gray-300 hover:text-white hover:bg-blue-900/50 rounded-full transition-colors">
            <UserCircle size={24} />
          </button>
          <button className="p-2 text-gray-300 hover:text-white hover:bg-blue-900/50 rounded-full transition-colors">
            <Settings size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
};
