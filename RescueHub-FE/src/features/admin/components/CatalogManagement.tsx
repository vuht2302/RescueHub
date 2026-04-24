import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  AlertCircle,
  Search,
  X,
} from "lucide-react";
import CatalogModal from "./CatalogModal";

import {
  getCatalogByType,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
} from "@/src/shared/services/catalog.service";

const tabs = [
  {
    key: "skills",
    label: "Kỹ năng",
    shortLabel: "Kỹ năng",
    description: "Danh mục kỹ năng đội cứu hộ",
  },
  {
    key: "vehicleTypes",
    label: "Phương tiện",
    shortLabel: "Phương tiện",
    description: "Các loại phương tiện cứu hộ",
  },
  {
    key: "vehicleCapabilities",
    label: "Khả năng xe",
    shortLabel: "Khả năng",
    description: "Khả năng của phương tiện",
  },
  {
    key: "itemCategories",
    label: "Danh mục vật phẩm",
    shortLabel: "Vật phẩm",
    description: "Phân loại vật phẩm cứu trợ",
  },
];

// Confirm Delete Modal
function ConfirmDelete({
  name,
  onConfirm,
  onCancel,
  loading,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-center mb-1">Xóa danh mục?</h3>
        <p className="text-sm text-gray-600 text-center mb-6">
          Xóa <strong>{name}</strong>? Thao tác không thể hoàn tác.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-sm"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm disabled:opacity-60"
          >
            {loading ? "Đang xóa..." : "Xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}

const CatalogManagement = () => {
  const [activeTab, setActiveTab] = useState("skills");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Search
  const [search, setSearch] = useState("");

  const currentTab = tabs.find((t) => t.key === activeTab)!;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCatalogByType(activeTab);
      setItems(res.items);
    } catch (err) {
      console.error(err);
      setError("Load dữ liệu thất bại");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData, activeTab]);

  const handleAdd = async (data: any) => {
    await createCatalogItem(activeTab, data);
    await fetchData();
  };

  const handleEdit = async (data: any) => {
    await updateCatalogItem(activeTab, data.id, data);
    await fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCatalogItem(activeTab, deleteTarget.id);
      setDeleteTarget(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Lỗi xóa danh mục");
    } finally {
      setDeleting(false);
    }
  };

  // Filter items
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2
            className="text-2xl font-black text-gray-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Danh mục sản phẩm
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {currentTab.description}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setShowModal(true);
          }}
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
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
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
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-full md:w-1/3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
          <Search size={16} className="text-gray-400" />
          <input
            placeholder="Tìm danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="outline-none w-full text-sm bg-transparent"
          />
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
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-gray-100 animate-pulse rounded-xl"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-12 text-center">
          <div className="flex flex-col items-center gap-2">
            <Package size={32} className="text-gray-300" />
            <p className="text-gray-400 text-sm">Chưa có dữ liệu</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              {/* TOP */}
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <Package size={18} className="text-blue-600" />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">
                      {item.code}
                    </p>
                  </div>
                </div>

                {/* ACTION */}
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowModal(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600"
                    title="Sửa"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"
                    title="Xóa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* DESCRIPTION */}
              <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                {item.description || "Không có mô tả"}
              </p>

              {/* FOOTER */}
              <div className="mt-4 flex justify-between items-center">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  {activeTab}
                </span>

                <span className="text-xs text-gray-400 font-mono">
                  ID: {item.id.slice(0, 6)}...
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-right">
        {filteredItems.length} danh mục
      </p>

      {/* MODAL */}
      {showModal && (
        <CatalogModal
          onClose={() => setShowModal(false)}
          onSubmit={editingItem ? handleEdit : handleAdd}
          defaultData={editingItem}
        />
      )}

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <ConfirmDelete
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
};

export default CatalogManagement;
