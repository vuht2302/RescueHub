import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import CatalogModal from "./CatalogModal";

import {
  getCatalogByType,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
} from "@/src/shared/services/catalog.service";

const tabs = [
  { key: "skills", label: "Kỹ năng" },
  { key: "vehicleTypes", label: "Phương tiện" },
  { key: "vehicleCapabilities", label: "Khả năng xe" },
  { key: "itemCategories", label: "Danh mục vật phẩm" },
];

const CatalogManagement = () => {
  const [activeTab, setActiveTab] = useState("skills");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // ===== LOAD =====
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getCatalogByType(activeTab);
      setItems(res.items);
    } catch (err) {
      console.error(err);
      alert("Load thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // ===== ADD =====
  const handleAdd = async (data: any) => {
    try {
      await createCatalogItem(activeTab, data);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ===== EDIT =====
  const handleEdit = async (data: any) => {
    try {
      await updateCatalogItem(activeTab, data.id, data);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ===== DELETE =====
  const handleDelete = async (id: string) => {
    if (confirm("Xoá item này?")) {
      try {
        await deleteCatalogItem(activeTab, id);
        await fetchData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-black">Danh mục hệ thống</h1>
        <p className="text-gray-600 text-sm">
          Quản lý dữ liệu danh mục dùng trong hệ thống
        </p>
      </div>

      {/* TABS */}
      <div className="flex gap-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
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
          onClick={() => {
            setEditingItem(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-950 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={18} /> Thêm mới
        </button>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-2 gap-4">
        {loading ? (
          <div>Loading...</div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-xl shadow space-y-3"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{item.name}</h3>
                  <p className="text-sm text-gray-500">
                    {item.code}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowModal(true);
                    }}
                  >
                    <Edit size={18} />
                  </button>

                  <button onClick={() => handleDelete(item.id)}>
                    <Trash2 size={18} className="text-red-500" />
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                {item.description || "Không có mô tả"}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <CatalogModal
          onClose={() => setShowModal(false)}
          onSubmit={editingItem ? handleEdit : handleAdd}
          defaultData={editingItem}
        />
      )}
    </div>
  );
};

export default CatalogManagement;