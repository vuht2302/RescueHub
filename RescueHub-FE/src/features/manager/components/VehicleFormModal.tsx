import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { getAuthSession } from "@/src/features/auth/services/authStorage";

const DEFAULT_API_BASE_URL = "https://rescuehub.onrender.com";

const getApiBaseUrl = () =>
  (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim();

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
}

interface VehicleOptions {
  vehicleTypes: {
    id: string;
    code: string;
    name: string;
    description: string;
  }[];
  capabilities: {
    id: string;
    code: string;
    name: string;
    description: string;
  }[];
  teams: { id: string; code: string; name: string; statusCode: string }[];
  vehicleStatusCodes: { code: string; name: string; color: string | null }[];
}

export function VehicleFormModal({
  isOpen,
  onClose,
  onSuccess,
  editData,
}: VehicleFormModalProps) {
  const [options, setOptions] = useState<VehicleOptions | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isEditMode = !!editData;

  const [formData, setFormData] = useState({
    code: "",
    vehicleTypeId: "",
    displayName: "",
    plateNo: "",
    teamId: "",
    statusCode: "",
    capacityPerson: 0,
    capacityWeightKg: 0,
    lat: 0,
    lng: 0,
    capabilityIds: [] as string[],
    notes: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          code: editData.code || "",
          vehicleTypeId: editData.vehicleType?.id || "",
          displayName: editData.displayName || "",
          plateNo: editData.plateNo || "",
          teamId: editData.team?.id || "",
          statusCode: editData.status?.code || "",
          capacityPerson: editData.capacityPerson || 0,
          capacityWeightKg: editData.capacityWeightKg || 0,
          lat: editData.currentLocation?.lat || 0,
          lng: editData.currentLocation?.lng || 0,
          capabilityIds: editData.capabilityIds || [], // Fallback, later map capabilities if editData has them
          notes: editData.notes || "",
        });
      } else {
        setFormData({
          code: "",
          vehicleTypeId: "",
          displayName: "",
          plateNo: "",
          teamId: "",
          statusCode: "",
          capacityPerson: 0,
          capacityWeightKg: 0,
          lat: 0,
          lng: 0,
          capabilityIds: [],
          notes: "",
        });
      }
      fetchOptions();
    }
  }, [isOpen, editData]);

  const fetchOptions = async () => {
    setIsLoadingOptions(true);
    setError("");
    try {
      const session = getAuthSession();
      if (!session?.accessToken) throw new Error("Vui lòng đăng nhập lại");

      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/manager/vehicles/options`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      );

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Không thể tải cấu hình phương tiện");
      }

      setOptions(data.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải cấu hình",
      );
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;

    // For multiple select (capabilities)
    if (e.target instanceof HTMLSelectElement && e.target.multiple) {
      const selectedOptions = Array.from(e.target.selectedOptions).map(
        (opt) => opt.value,
      );
      setFormData((prev) => ({ ...prev, [name]: selectedOptions }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
    setError("");
  };

  const handleCapabilityToggle = (capabilityId: string) => {
    setFormData((prev) => {
      const isSelected = prev.capabilityIds.includes(capabilityId);
      if (isSelected) {
        return {
          ...prev,
          capabilityIds: prev.capabilityIds.filter((id) => id !== capabilityId),
        };
      } else {
        return {
          ...prev,
          capabilityIds: [...prev.capabilityIds, capabilityId],
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.code ||
      !formData.vehicleTypeId ||
      !formData.displayName ||
      !formData.plateNo ||
      !formData.statusCode
    ) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const session = getAuthSession();
      if (!session?.accessToken) throw new Error("Vui lòng đăng nhập lại");

      const payload = {
        code: formData.code,
        vehicleTypeId: formData.vehicleTypeId,
        displayName: formData.displayName,
        plateNo: formData.plateNo,
        teamId: formData.teamId || null,
        statusCode: formData.statusCode,
        capacityPerson: formData.capacityPerson,
        capacityWeightKg: formData.capacityWeightKg,
        currentLocation: {
          lat: formData.lat,
          lng: formData.lng,
        },
        capabilityIds: formData.capabilityIds,
        notes: formData.notes,
      };

      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/manager/vehicles${isEditMode ? `/${editData.id}` : ""}`,
        {
          method: isEditMode ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.message ||
            data.title ||
            `Lỗi khi ${isEditMode ? "cập nhật" : "tạo"} phương tiện`,
        );
      }

      setFormData({
        code: "",
        vehicleTypeId: "",
        displayName: "",
        plateNo: "",
        teamId: "",
        statusCode: "",
        capacityPerson: 0,
        capacityWeightKg: 0,
        lat: 0,
        lng: 0,
        capabilityIds: [],
        notes: "",
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto pt-10 pb-10">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg my-auto max-h-[90vh] overflow-y-auto scrollbar-none">
        <div className="mb-6 flex items-center justify-between">
          <h2
            className="text-xl font-bold text-slate-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            {isEditMode ? "Cập nhật phương tiện" : "Tạo phương tiện mới"}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {isLoadingOptions ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Mã hiển thị (Code) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Biển số <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="plateNo"
                  value={formData.plateNo}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Tên hiển thị <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Loại phương tiện <span className="text-red-500">*</span>
                </label>
                <select
                  name="vehicleTypeId"
                  value={formData.vehicleTypeId}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="">Chọn loại phương tiện</option>
                  {options?.vehicleTypes.map((vt) => (
                    <option key={vt.id} value={vt.id}>
                      {vt.name} ({vt.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <select
                  name="statusCode"
                  value={formData.statusCode}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="">Chọn trạng thái</option>
                  {options?.vehicleStatusCodes.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Sức chứa (người)
                </label>
                <input
                  type="number"
                  name="capacityPerson"
                  value={formData.capacityPerson}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Sức chở (kg)
                </label>
                <input
                  type="number"
                  name="capacityWeightKg"
                  value={formData.capacityWeightKg}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Đội cứu hộ
              </label>
              <select
                name="teamId"
                value={formData.teamId}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="">Không phân công</option>
                {options?.teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Vĩ độ (Lat)
                </label>
                <input
                  type="number"
                  step="any"
                  name="lat"
                  value={formData.lat}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Kinh độ (Lng)
                </label>
                <input
                  type="number"
                  step="any"
                  name="lng"
                  value={formData.lng}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Capabilities */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Khả năng đặc biệt
              </label>
              <div className="grid grid-cols-2 gap-2">
                {options?.capabilities.map((cap) => (
                  <label
                    key={cap.id}
                    className="flex items-center space-x-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={formData.capabilityIds.includes(cap.id)}
                      onChange={() => handleCapabilityToggle(cap.id)}
                    />
                    <span>{cap.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Ghi chú
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditMode ? "Cập nhật phương tiện" : "Lưu phương tiện"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
