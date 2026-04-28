import React, { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Warehouse,
} from "lucide-react";
import {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  type Warehouse as WH,
  type WarehousePayload,
} from "../services/warehouseService";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import {
  AddressAutocomplete,
  type AddressSuggestion,
} from "../../../shared/components/AddressAutocomplete";
import { toastError, toastSuccess } from "../../../shared/utils/toast";

const EMPTY_FORM: WarehousePayload = {
  warehouseCode: "",
  warehouseName: "",
  statusCode: "ACTIVE",
  address: "",
  location: { lat: 0, lng: 0 },
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number }> {
  const params = new URLSearchParams({
    q: address,
    format: "json",
    limit: "1",
    countrycodes: "vn",
  });

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: {
      "Accept-Language": "vi",
    },
  });

  if (!response.ok) {
    throw new Error("Không thể lấy tọa độ từ địa chỉ đã nhập.");
  }

  const data = (await response.json()) as Array<{ lat?: string; lon?: string }>;
  const firstResult = data[0];
  const lat = Number(firstResult?.lat);
  const lng = Number(firstResult?.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Không tìm thấy tọa độ phù hợp cho địa chỉ này.");
  }

  return { lat, lng };
}

function Badge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-gray-400"
        }`}
      />
      {active ? "Hoạt động" : "Ngừng"}
    </span>
  );
}

interface ConfirmDeleteProps {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmDelete({
  name,
  onConfirm,
  onCancel,
  loading,
}: ConfirmDeleteProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <Trash2 size={22} className="text-red-600" />
        </div>
        <h3 className="mb-1 text-center text-lg font-bold text-gray-900">
          Xác nhận xóa
        </h3>
        <p className="mb-6 text-center text-sm text-gray-600">
          Xóa kho <strong>{name}</strong>? Thao tác không thể hoàn tác.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Đang xóa..." : "Xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface FormModalProps {
  wh?: WH | null;
  onClose: () => void;
  onSaved: () => void;
}

function FormModal({ wh, onClose, onSaved }: FormModalProps) {
  const [form, setForm] = useState<WarehousePayload>(
    wh
      ? {
          warehouseCode: wh.warehouseCode,
          warehouseName: wh.warehouseName,
          statusCode: wh.status?.code ?? "ACTIVE",
          address: wh.address,
          location: wh.location ?? { lat: 0, lng: 0 },
        }
      : { ...EMPTY_FORM },
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddressSuggestion, setSelectedAddressSuggestion] =
    useState<AddressSuggestion | null>(
      wh?.location
        ? {
            id: wh.id,
            display: wh.address,
            address: wh.address,
            lat: wh.location.lat,
            lng: wh.location.lng,
          }
        : null,
    );

  const handleSave = async () => {
    if (
      !form.warehouseCode.trim() ||
      !form.warehouseName.trim() ||
      !form.address.trim()
    ) {
      setError("Vui lòng điền mã kho, tên kho và địa chỉ.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = getAuthSession()?.accessToken ?? "";
      const trimmedAddress = form.address.trim();
      const addressChanged = trimmedAddress !== (wh?.address ?? "").trim();
      const location =
        !addressChanged && wh?.location
          ? wh.location
          : selectedAddressSuggestion?.address.trim() === trimmedAddress
            ? {
                lat: selectedAddressSuggestion.lat,
                lng: selectedAddressSuggestion.lng,
              }
            : await geocodeAddress(trimmedAddress);

      const payload: WarehousePayload = {
        warehouseCode: form.warehouseCode.trim(),
        warehouseName: form.warehouseName.trim(),
        address: trimmedAddress,
        location,
        statusCode: form.statusCode,
      };

      if (wh) {
        await updateWarehouse(wh.id, payload, token);
        toastSuccess("Cập nhật kho thành công.");
      } else {
        await createWarehouse(payload, token);
        toastSuccess("Tạo kho mới thành công.");
      }

      onSaved();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Lỗi không xác định");
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange =
    (key: "warehouseCode" | "warehouseName" | "statusCode") =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            {wh ? "Chỉnh sửa kho" : "Tạo kho mới"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                Mã kho *
              </label>
              <input
                value={form.warehouseCode}
                onChange={handleFieldChange("warehouseCode")}
                placeholder="KHO-001"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                Tên kho *
              </label>
              <input
                value={form.warehouseName}
                onChange={handleFieldChange("warehouseName")}
                placeholder="Kho trung tâm..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">
              Địa chỉ *
            </label>
            <AddressAutocomplete
              value={form.address}
              onChange={(address) => {
                setForm((prev) => ({ ...prev, address }));
                setSelectedAddressSuggestion(null);
              }}
              onSelect={(suggestion) => {
                setForm((prev) => ({
                  ...prev,
                  address: suggestion.address,
                  location: {
                    lat: suggestion.lat,
                    lng: suggestion.lng,
                  },
                }));
                setSelectedAddressSuggestion(suggestion);
              }}
              placeholder="Nhập địa chỉ kho..."
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-400">
              Hệ thống sẽ tự lấy kinh độ, vĩ độ từ địa chỉ khi lưu.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">
              Trạng thái
            </label>
            <select
              value={form.statusCode}
              onChange={handleFieldChange("statusCode")}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Ngừng</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 border-t bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 text-sm font-semibold text-gray-700"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{
              background: loading
                ? "#9ca3af"
                : "linear-gradient(135deg,#1e3a5f,#1e40af)",
            }}
          >
            {loading ? "Đang lưu..." : wh ? "Cập nhật" : "Tạo mới"}
          </button>
        </div>
      </div>
    </div>
  );
}

export const WarehouseTab: React.FC = () => {
  const [data, setData] = useState<WH[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<WH | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WH | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthSession()?.accessToken ?? "";
      const res = await getWarehouses(token, {
        keyword: keyword || undefined,
        statusCode: statusFilter || undefined,
      });
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải kho");
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteWarehouse(
        deleteTarget.id,
        getAuthSession()?.accessToken ?? "",
      );
      toastSuccess("Xóa kho thành công.");
      setDeleteTarget(null);
      void load();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Lỗi xóa kho");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên, mã kho..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="INACTIVE">Ngừng</option>
        </select>
        <button
          onClick={() => {
            setEditTarget(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#1e3a5f,#1e40af)" }}
        >
          <Plus size={15} /> Tạo kho
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {[
                "Mã kho",
                "Tên kho",
                "Trạng thái",
                "Địa chỉ",
                "Khu vực",
                "Khu",
                "Tồn",
                "Ngày tạo",
                "",
              ].map((heading) => (
                <th
                  key={heading}
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td
                  colSpan={10}
                  className="py-12 text-center text-sm text-gray-400"
                >
                  Đang tải...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Warehouse size={32} className="text-gray-300" />
                    <p className="text-sm text-gray-400">Chưa có kho nào</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((warehouse) => (
                <tr
                  key={warehouse.id}
                  className="transition-colors hover:bg-blue-50/30"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-blue-700">
                    {warehouse.warehouseCode}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                    {warehouse.warehouseName}
                  </td>
                  <td className="px-4 py-3">
                    <Badge active={warehouse.status?.code === "ACTIVE"} />
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-gray-600">
                    {warehouse.address || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {warehouse.adminArea?.name || "—"}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-gray-800">
                      {warehouse.zoneCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-gray-800">
                      {warehouse.stockLineCount}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                    {new Date(warehouse.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditTarget(warehouse);
                          setShowForm(true);
                        }}
                        className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-100"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(warehouse)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-100"
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
          wh={editTarget}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void load();
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDelete
          name={deleteTarget.warehouseName}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
      <p className="text-right text-xs text-gray-400">{data.length} kho</p>
    </div>
  );
};
