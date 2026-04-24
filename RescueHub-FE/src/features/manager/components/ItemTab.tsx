import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Package,
  Eye,
} from "lucide-react";
import {
  getItems,
  getItemDetail,
  createItem,
  updateItem,
  deleteItem,
  type Item,
  type ItemDetail,
  type ItemLot,
  type ItemPayload,
} from "../services/warehouseService";
import { getAuthSession } from "../../../features/auth/services/authStorage";

const EMPTY: ItemPayload = {
  itemCode: "",
  itemName: "",
  itemCategoryCode: "ESSENTIAL",
  unitCode: "THUNG",
  requiresLotTracking: true,
  requiresExpiryTracking: true,
  issuePolicyCode: "FEFO",
  receivedAt: new Date().toISOString().slice(0, 16),
  expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10),
  isActive: true,
};

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
        <h3 className="text-lg font-bold text-center mb-1">Xóa hàng hóa?</h3>
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

function SuccessModal({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-center mb-1">Thành công!</h3>
        <p className="text-sm text-gray-600 text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function FormModal({
  item,
  onClose,
  onSaved,
}: {
  item?: Item | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ItemPayload>(
    item
      ? {
          itemCode: item.itemCode,
          itemName: item.itemName,
          itemCategoryCode: item.itemCategory?.code ?? "ESSENTIAL",
          unitCode: item.unit?.code ?? "THUNG",
          requiresLotTracking: item.requiresLotTracking,
          requiresExpiryTracking: item.requiresExpiryTracking,
          issuePolicyCode: item.issuePolicyCode,
          receivedAt: new Date().toISOString().slice(0, 16),
          expDate: item.requiresExpiryTracking
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                .toISOString()
                .slice(0, 10)
            : undefined,
          isActive: item.isActive,
        }
      : { ...EMPTY },
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const token = getAuthSession()?.accessToken ?? "";
        const response = await fetch(
          "https://rescuehub.onrender.com/api/v1/manager/items/options",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Invalid response format: Expected JSON");
        }

        const data = await response.json();
        if (data.success) {
          setOptions(data.data);
        } else {
          setError(data.message || "Failed to fetch options.");
        }
      } catch (e) {
        console.error("Error fetching options:", e);
        setError(e instanceof Error ? e.message : "Unknown error occurred.");
      }
    };

    fetchOptions();
  }, []);

  const [options, setOptions] = useState({
    itemCategories: [],
    unitCodes: [],
    issuePolicyCodes: [],
  });

  const renderOptions = (options: { code: string; name: string }[]) =>
    options.map((opt) => (
      <option key={opt.code} value={opt.code}>
        {opt.name}
      </option>
    ));

  const handleSave = async () => {
    if (!form.itemCode.trim() || !form.itemName.trim()) {
      setError("Vui lòng điền mã và tên hàng hóa.");
      return;
    }
    if (!form.receivedAt) {
      setError("Vui lòng chọn ngày nhập hàng.");
      return;
    }
    if (form.requiresExpiryTracking && !form.expDate) {
      setError("Vui lòng chọn hạn sử dụng khi bật theo dõi hạn.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = getAuthSession()?.accessToken ?? "";
      // Prepare payload: remove expDate if requiresExpiryTracking is false
      const payload: ItemPayload = {
        ...form,
        expDate: form.requiresExpiryTracking ? form.expDate : undefined,
      };
      if (item) await updateItem(item.id, payload, token);
      else await createItem(payload, token);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  const F =
    (key: keyof ItemPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));
  const BoolF =
    (key: keyof ItemPayload) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.checked }));

  return (
    <div className="fixed inset-0 bg-black/40 z-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">
            {item ? "Chỉnh sửa hàng hóa" : "Thêm hàng hóa"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Mã hàng *
              </label>
              <input
                value={form.itemCode}
                onChange={F("itemCode")}
                placeholder="NUOC-500ML"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Tên hàng hóa *
              </label>
              <input
                value={form.itemName}
                onChange={F("itemName")}
                placeholder="Nước uống 500ml"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Danh mục
              </label>
              <select
                value={form.itemCategoryCode}
                onChange={F("itemCategoryCode")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn danh mục</option>
                {renderOptions(options.itemCategories)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Đơn vị
              </label>
              <select
                value={form.unitCode}
                onChange={F("unitCode")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn đơn vị</option>
                {renderOptions(options.unitCodes)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Ngày nhập hàng *
              </label>
              <input
                type="datetime-local"
                value={form.receivedAt}
                onChange={F("receivedAt")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Chính sách xuất (FEFO/FIFO)
              </label>
              <select
                value={form.issuePolicyCode}
                onChange={F("issuePolicyCode")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn chính sách</option>
                {renderOptions(options.issuePolicyCodes)}
              </select>
            </div>
          </div>
          {form.requiresExpiryTracking && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">
                  Hạn sử dụng{" "}
                  {form.requiresExpiryTracking && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <input
                  type="date"
                  value={form.expDate || ""}
                  onChange={F("expDate")}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={BoolF("isActive")}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-sm text-gray-700">Đang hoạt động</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.requiresExpiryTracking}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setForm((p) => ({
                    ...p,
                    requiresExpiryTracking: checked,
                    expDate: checked
                      ? p.expDate ||
                        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                          .toISOString()
                          .slice(0, 10)
                      : undefined,
                  }));
                }}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-sm text-gray-700">Theo dõi hạn</span>
            </label>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-sm"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#1e3a5f,#1e40af)" }}
          >
            {loading ? "Đang lưu..." : item ? "Cập nhật" : "Thêm mới"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function DetailModal({
  item,
  onClose,
}: {
  item: ItemDetail;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-220 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold">Chi tiết hàng hóa</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {item.itemCode} - {item.itemName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 uppercase">Danh mục</p>
              <p className="font-semibold text-gray-900 mt-1">
                {item.itemCategory?.name || "-"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 uppercase">Đơn vị</p>
              <p className="font-semibold text-gray-900 mt-1">
                {item.unitCode || "-"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 uppercase">Số lô</p>
              <p className="font-semibold text-gray-900 mt-1">
                {item.lots?.length ?? 0}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Danh sách lô
            </h3>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                      Mã lô
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                      Ngày nhập
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                      Hạn dùng
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                      Nhà tài trợ
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(item.lots || []).length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-6 text-gray-400"
                      >
                        Chưa có dữ liệu lô
                      </td>
                    </tr>
                  ) : (
                    item.lots.map((lot) => (
                      <tr key={lot.id}>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {lot.lotNo}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(lot.receivedAt)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(lot.expDate)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {lot.donorName || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {lot.statusCode}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ItemTab: React.FC = () => {
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailItem, setDetailItem] = useState<ItemDetail | null>(null);
  const [editTarget, setEditTarget] = useState<Item | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getItems(getAuthSession()?.accessToken ?? ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải hàng hóa");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteItem(deleteTarget.id, getAuthSession()?.accessToken ?? "");
      setDeleteTarget(null);
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lỗi xóa");
    } finally {
      setDeleting(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const token = getAuthSession()?.accessToken ?? "";
      const detail = await getItemDetail(id, token);
      setDetailItem(detail);
      setShowDetail(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Không thể tải chi tiết hàng hóa",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const getNearestExpiry = (lots: ItemLot[] = []) => {
    const expiries = lots
      .filter((lot) => !!lot.expDate)
      .map((lot) => new Date(lot.expDate as string))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    if (expiries.length === 0) return "-";
    return expiries[0].toLocaleDateString("vi-VN");
  };

  const getLatestReceivedAt = (lots: ItemLot[] = []) => {
    if (!lots.length) return "-";
    const sorted = [...lots].sort(
      (a, b) =>
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
    );
    return new Date(sorted[0]?.receivedAt).toLocaleDateString("vi-VN") || "-";
  };

  const getLatestLotNo = (lots: ItemLot[] = []) => {
    if (!lots.length) return "-";
    const sorted = [...lots].sort(
      (a, b) =>
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
    );
    return sorted[0]?.lotNo || "-";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditTarget(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg,#1e3a5f,#1e40af)" }}
        >
          <Plus size={15} /> Thêm hàng hoá
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Mã hàng", "Tên hàng hóa", "Danh mục", "Trạng thái", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  Đang tải...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Package size={32} className="text-gray-300" />
                    <p className="text-gray-400 text-sm">Chưa có hàng hóa</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">
                    {item.itemCode}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {item.itemName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {item.itemCategory?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${item.isActive ? "bg-emerald-500" : "bg-gray-400"}`}
                      />
                      {item.isActive ? "Có sẵn" : "Ngừng"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => void handleViewDetail(item.id)}
                        disabled={detailLoading}
                        className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-600 disabled:opacity-50"
                        title="Xem chi tiết"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setEditTarget(item);
                          setShowForm(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showForm && (
        <FormModal
          item={editTarget}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setSuccessMessage(
              editTarget
                ? "Cập nhật hàng hóa thành công!"
                : "Tạo mới hàng hóa thành công!",
            );
            void load();
          }}
        />
      )}
      {successMessage && (
        <SuccessModal
          message={successMessage}
          onClose={() => {
            setSuccessMessage(null);
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDelete
          name={deleteTarget.itemName}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
      {showDetail && detailItem && (
        <DetailModal
          item={detailItem}
          onClose={() => {
            setShowDetail(false);
            setDetailItem(null);
          }}
        />
      )}
      <p className="text-xs text-gray-400 text-right">{data.length} hàng hóa</p>
    </div>
  );
};
