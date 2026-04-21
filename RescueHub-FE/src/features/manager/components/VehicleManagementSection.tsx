import React, { useEffect, useState } from "react";
import {
  MoreVertical,
  AlertTriangle,
  Truck,
  MapPin,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import { getAuthSession } from "@/src/features/auth/services/authStorage";
import { VehicleFormModal } from "./VehicleFormModal";

const DEFAULT_API_BASE_URL = "https://rescuehub.onrender.com";

const getApiBaseUrl = () =>
  (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim();

interface VehicleStatus {
  code: string;
  name: string;
  color: string | null;
}

interface VehicleType {
  id: string;
  code: string;
  name: string;
}

interface Team {
  id: string;
  code: string;
  name: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface Vehicle {
  id: string;
  code: string;
  displayName: string;
  plateNo: string;
  status: VehicleStatus;
  vehicleType: VehicleType;
  team: Team | null;
  capacityPerson: number;
  capacityWeightKg: number;
  currentLocation: Coordinates;
  capabilityCount: number;
  notes: string;
  createdAt: string;
}

export function VehicleManagementSection() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const fetchVehicles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const session = getAuthSession();
      if (!session?.accessToken) throw new Error("Vui lòng đăng nhập lại");

      const res = await fetch(`${getApiBaseUrl()}/api/v1/manager/vehicles`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Không thể tải danh sách phương tiện");
      }

      setVehicles(data.data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleEdit = async (vehicle: Vehicle) => {
    // Nếu có endpoint lấy API chi tiết thì gọi ở đây, tạm thời dùng dữ liệu từ danh sách
    // API chi tiết method: GET /api/v1/manager/vehicles/{id} (Nếu backend có)
    // Tạm thời nếu không có full capabilities thì gán tạm từ bảng. Tốt nhất là fetch GET detail nếu backend hỗ trợ trả về full capabilityIds
    try {
      const session = getAuthSession();
      if (!session?.accessToken) throw new Error("Vui lòng đăng nhập lại");

      // Cố gắng gọi API detail nếu backend có, hoặc fallback về fallbackVehicle
      let vehicleData = { ...vehicle, capabilityIds: [] };
      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/manager/vehicles/${vehicle.id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          vehicleData = data.data;
        }
      }
      setVehicleToEdit(vehicleData as any);
      setIsFormModalOpen(true);
    } catch (err) {
      setVehicleToEdit(vehicle as any); // Fallback to list item
      setIsFormModalOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!vehicleToDelete) return;

    try {
      const session = getAuthSession();
      if (!session?.accessToken) throw new Error("Vui lòng đăng nhập lại");

      const res = await fetch(
        `${getApiBaseUrl()}/api/v1/manager/vehicles/${vehicleToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      );

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Không thể xoá phương tiện");
      }

      setVehicleToDelete(null);
      fetchVehicles();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Đã xảy ra lỗi khi xoá");
    }
  };

  const getStatusStyle = (statusCode: string) => {
    switch (statusCode) {
      case "AVAILABLE":
        return "bg-emerald-50 text-emerald-600";
      case "IN_USE":
        return "bg-blue-50 text-blue-600";
      case "MAINTENANCE":
        return "bg-orange-50 text-orange-600";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  const getStatusPoint = (statusCode: string) => {
    switch (statusCode) {
      case "AVAILABLE":
        return "bg-emerald-600";
      case "IN_USE":
        return "bg-blue-600";
      case "MAINTENANCE":
        return "bg-orange-600";
      default:
        return "bg-gray-600";
    }
  };

  const getStatusText = (status: VehicleStatus) => {
    switch (status.code) {
      case "AVAILABLE":
        return "Sẵn sàng";
      case "IN_USE":
        return "Đang sử dụng";
      case "MAINTENANCE":
        return "Bảo dưỡng";
      default:
        return status.name;
    }
  };

  return (
    <section className="space-y-6">
      <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6 flex justify-between items-center">
          <div>
            <h3
              className="text-xl font-bold text-slate-900"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Quản lý phương tiện cứu hộ
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Danh sách chi tiết phương tiện và trạng thái
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold">
              {vehicles.length} phương tiện
            </div>
            <button
              onClick={() => {
                setVehicleToEdit(null);
                setIsFormModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Thêm mới
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 m-6 border border-red-200 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="p-10 flex flex-col items-center justify-center">
            <div
              className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"
              style={{ borderWidth: 3 }}
            ></div>
            <p className="mt-3 text-sm text-gray-500">
              Đang tải dữ liệu phương tiện...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-4 py-3">Phương tiện</th>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">Thuộc đội</th>
                  <th className="px-4 py-3">Tình trạng</th>
                  <th className="px-4 py-3">Sức chứa</th>
                  <th className="px-4 py-3">Vị trí</th>
                  <th className="px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 && !isLoading && !error && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      Chưa có phương tiện nào trong hệ thống.
                    </td>
                  </tr>
                )}
                {vehicles.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{v.plateNo}</p>
                      <p className="text-xs text-slate-500">{v.displayName}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">
                      {v.vehicleType.name}
                    </td>
                    <td className="px-4 py-3">
                      {v.team ? (
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {v.team.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {v.team.code}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm italic text-slate-400">
                          Chưa phân công
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${getStatusStyle(v.status.code)}`}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${getStatusPoint(v.status.code)}`}
                        />
                        {getStatusText(v.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-slate-800">
                          {v.capacityPerson} người
                        </span>
                        <span className="text-xs text-slate-500">
                          {v.capacityWeightKg} kg
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {v.currentLocation ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-slate-400" />
                          <span className="text-xs">
                            {v.currentLocation.lat.toFixed(3)},{" "}
                            {v.currentLocation.lng.toFixed(3)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Không xác định
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(v)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setVehicleToDelete(v)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <VehicleFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        editData={vehicleToEdit}
        onSuccess={() => {
          fetchVehicles();
        }}
      />

      {/* Delete Confirmation Modal */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Xác nhận xóa phương tiện
              </h3>
            </div>

            <p className="text-slate-600 mb-6 ml-[52px]">
              Bạn có chắc chắn muốn xóa phương tiện{" "}
              <span className="font-semibold text-slate-800">
                {vehicleToDelete.plateNo}
              </span>{" "}
              ({vehicleToDelete.displayName}) không?
              <br />
              Hành động này không thể hoàn tác.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setVehicleToDelete(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 active:bg-slate-200"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:bg-red-800"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
