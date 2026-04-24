import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  AlertTriangle,
  Wrench,
  Truck,
  AlertCircle,
  Settings,
} from "lucide-react";
import MasterDataModal from "../components/MasterDataModal";
import { getMasterDataBootstrap } from "@/src/shared/services/masterData.service";

type TabType = "incident" | "skill" | "vehicle";

const tabs = [
  {
    key: "incident",
    label: "Loại sự cố",
    shortLabel: "Sự cố",
    icon: AlertTriangle,
    description: "Quản lý các loại sự cố cứu hộ",
  },
  {
    key: "skill",
    label: "Kỹ năng",
    shortLabel: "Kỹ năng",
    icon: Wrench,
    description: "Danh mục kỹ năng của đội cứu hộ",
  },
  {
    key: "vehicle",
    label: "Phương tiện",
    shortLabel: "Phương tiện",
    icon: Truck,
    description: "Các loại phương tiện cứu hộ",
  },
];

const MasterDataPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>("incident");
  const [showModal, setShowModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<{
    incident: any[];
    skill: any[];
    vehicle: any[];
    priorityLevels: any[];
  }>({
    incident: [],
    skill: [],
    vehicle: [],
    priorityLevels: [],
  });

  const currentTab = tabs.find((t) => t.key === activeTab)!;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMasterDataBootstrap();

      setData({
        incident: res.incidentTypes || [],
        skill: res.skills || [],
        vehicle: res.vehicleTypes || [],
        priorityLevels: res.priorityLevels || [],
      });
    } catch (err) {
      console.error(err);
      setError("Load dữ liệu thất bại");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCurrentData = () => data[activeTab];

  const handleAdd = (item: any) => {
    setData((prev) => ({
      ...prev,
      [activeTab]: [...prev[activeTab], item],
    }));
  };

  const getPriorityColor = (code: string) => {
    switch (code) {
      case "CRITICAL":
        return "bg-red-100 text-red-700";
      case "HIGH":
        return "bg-orange-100 text-orange-700";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700";
      case "LOW":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2
            className="text-2xl font-black text-gray-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Danh mục hệ thống
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {currentTab.description}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg,#1e3a5f,#1e40af)" }}
        >
          <Plus size={15} /> Thêm mới
        </button>
      </div>

      {/* TABS */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`
                  relative flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap
                  transition-all flex-shrink-0 border-b-2
                  ${
                    isActive
                      ? "border-blue-700 text-blue-800 bg-blue-50/60"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }
                `}
                style={isActive ? { color: "var(--color-blue-950)" } : {}}
              >
                <Icon
                  size={15}
                  className={isActive ? "text-blue-700" : "text-gray-400"}
                  style={isActive ? { color: "var(--color-blue-950)" } : {}}
                />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* CONTENT */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-10 bg-gray-100 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : getCurrentData().length === 0 ? (
          <div className="py-12 text-center">
            <div className="flex flex-col items-center gap-2">
              <Settings size={32} className="text-gray-300" />
              <p className="text-gray-400 text-sm">Chưa có dữ liệu</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Mã
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Tên
                </th>
                {activeTab === "incident" && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    Độ ưu tiên
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {getCurrentData().map((item: any, index) => (
                <tr
                  key={index}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">
                    {item.code}
                  </td>

                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {item.name}
                  </td>

                  {activeTab === "incident" && (
                    <td className="px-4 py-3">
                      {(() => {
                        const priority = data.priorityLevels.find(
                          (p) => p.code === item.priority,
                        );

                        return priority ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getPriorityColor(
                              priority.code,
                            )}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                priority.code === "CRITICAL"
                                  ? "bg-red-500"
                                  : priority.code === "HIGH"
                                    ? "bg-orange-500"
                                    : priority.code === "MEDIUM"
                                      ? "bg-yellow-500"
                                      : "bg-emerald-500"
                              }`}
                            />
                            {priority.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        );
                      })()}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400 text-right">
        {getCurrentData().length} mục
      </p>

      {/* MODAL */}
      {showModal && (
        <MasterDataModal
          type={activeTab}
          priorities={data.priorityLevels}
          onClose={() => setShowModal(false)}
          onSubmit={handleAdd}
        />
      )}
    </div>
  );
};

export default MasterDataPage;
