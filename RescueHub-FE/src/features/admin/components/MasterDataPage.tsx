import React, { useState } from "react";
import { Plus } from "lucide-react";
import MasterDataModal from "../components/MasterDataModal";

type TabType = "incident" | "reason" | "skill" | "vehicle";

const MasterDataPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>("incident");
  const [showModal, setShowModal] = useState(false);

  // ===== MOCK DATA =====
  const [data, setData] = useState({
    incident: [
      { id: "1", code: "FLOOD", name: "Lũ lụt", priority: "HIGH" },
      { id: "2", code: "FIRE", name: "Cháy", priority: "CRITICAL" },
    ],
    reason: [
      { id: "1", code: "VEHICLE_BROKEN", name: "Hỏng xe" },
    ],
    skill: [
      { id: "1", code: "WATER_RESCUE", name: "Cứu hộ nước" },
    ],
    vehicle: [
      { id: "1", code: "BOAT", name: "Xuồng" },
    ],
  });

  const getCurrentData = () => data[activeTab];

  const handleAdd = (item: any) => {
    setData((prev) => ({
      ...prev,
      [activeTab]: [
        ...prev[activeTab],
        { ...item, id: Date.now().toString() },
      ],
    }));
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-black">Danh mục hệ thống</h1>
        <p className="text-gray-600 text-sm">
          Quản lý các danh mục phục vụ hệ thống cứu hộ
        </p>
      </div>

      {/* TABS */}
      <div className="flex gap-6 border-b">
        {[
          { key: "incident", label: "Loại sự cố" },
          { key: "reason", label: "Lý do" },
          { key: "skill", label: "Kỹ năng" },
          { key: "vehicle", label: "Phương tiện" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabType)}
            className={`pb-3 font-semibold ${
              activeTab === tab.key
                ? "border-b-2 border-blue-950 text-blue-950"
                : "text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ACTION */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-950 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={18} /> Thêm mới
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow p-4">
        <table className="w-full text-sm">
          <thead className="border-b text-gray-600">
            <tr>
              <th className="text-left py-2">Code</th>
              <th className="text-left py-2">Tên</th>
              {activeTab === "incident" && (
                <th className="text-left py-2">Độ ưu tiên</th>
              )}
            </tr>
          </thead>

          <tbody>
            {getCurrentData().map((item: any) => (
              <tr key={item.id} className="border-t">
                <td className="py-2">{item.code}</td>
                <td>{item.name}</td>
                {activeTab === "incident" && (
                  <td>{item.priority}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <MasterDataModal
          type={activeTab}
          onClose={() => setShowModal(false)}
          onSubmit={handleAdd}
        />
      )}
    </div>
  );
};

export default MasterDataPage;