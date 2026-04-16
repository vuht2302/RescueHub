import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Package } from "lucide-react";
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black">Danh mục hệ thống</h1>
          <p className="text-gray-500 text-sm">
            Quản lý dữ liệu danh mục dùng trong hệ thống
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-950 hover:bg-blue-800 text-white px-4 py-2 rounded-xl shadow transition"
        >
          <Plus size={18} /> Thêm mới
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-3 bg-white p-2 rounded-xl shadow">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeTab === tab.key
                ? "bg-blue-950 text-white shadow"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-gray-100 animate-pulse rounded-xl"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white p-10 rounded-xl shadow text-center text-gray-500">
          Không có dữ liệu
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group bg-white p-4 rounded-xl shadow hover:shadow-lg transition space-y-3"
            >
              {/* TOP */}
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <Package size={18} className="text-blue-600" />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-800">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {item.code}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowModal(true);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 hover:bg-red-100 rounded"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="text-sm text-gray-600">
                {item.description || "Không có mô tả"}
              </div>

              {/* BADGE */}
              <div className="flex justify-between items-center">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {activeTab}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

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