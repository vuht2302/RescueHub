import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import MasterDataModal from "../components/MasterDataModal";
import { getMasterDataBootstrap } from "@/src/shared/services/masterData.service";

type TabType = "incident" | "skill" | "vehicle";

const MasterDataPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>("incident");
  const [showModal, setShowModal] = useState(false);

  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    incident: [],
    skill: [],
    vehicle: [],
    priorityLevels: [],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getMasterDataBootstrap();

      setData({
        incident: res.incidentTypes || [],
        skill: res.skills || [],
        vehicle: res.vehicleTypes || [],
        priorityLevels: res.priorityLevels || [],
      });
    } catch (err) {
      console.error(err);
      alert("Load dữ liệu thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCurrentData = () => data[activeTab];

  const handleAdd = (item: any) => {
    setData((prev) => ({
      ...prev,
      [activeTab]: [...prev[activeTab], item],
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Danh mục hệ thống</h1>
        <p className="text-gray-600 text-sm">
          Quản lý các danh mục phục vụ hệ thống cứu hộ
        </p>
      </div>

      <div className="flex gap-6 border-b">
        {[
          { key: "incident", label: "Loại sự cố" },
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

      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-950 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={18} /> Thêm mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        {loading ? (
          <div>Loading...</div>
        ) : (
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
              {getCurrentData().map((item: any, index) => (
                <tr key={index} className="border-t">
                  <td className="py-2">{item.code}</td>
                  <td>{item.name}</td>

                  {activeTab === "incident" && (
                    <td>
                      {data.priorityLevels.find(
                        (p) => p.code === item.priority
                      )?.name || "-"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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