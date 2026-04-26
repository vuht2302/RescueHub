import React, { useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Search, Trash2, Users } from "lucide-react";
import { getAuthSession } from "../../auth/services/authStorage";
import {
  AddressAutocomplete,
  type AddressSuggestion,
} from "../../../shared/components/AddressAutocomplete";
import { getUsers } from "../../../shared/services/adminUser.service";
import {
  createManagerTeam,
  deleteManagerTeam,
  getManagerTeams,
  updateManagerTeam,
  type CreateTeamPayload,
  type ManagerTeam,
} from "../services/warehouseService";
import { toastError, toastSuccess } from "../../../shared/utils/toast";

type TeamForm = {
  code: string;
  name: string;
  leaderUserId: string;
  homeBaseAddress: string;
  statusCode: string;
  notes: string;
};

const DEFAULT_FORM: TeamForm = {
  code: "",
  name: "",
  leaderUserId: "",
  homeBaseAddress: "",
  statusCode: "AVAILABLE",
  notes: "",
};

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "AVAILABLE", label: "Sẵn sàng" },
  { value: "BUSY", label: "Bận" },
  { value: "OFFLINE", label: "Ngoại tuyến" },
];

const getStatusChip = (statusCode: string) => {
  const code = statusCode.toUpperCase();
  if (code === "AVAILABLE") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (code === "BUSY") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (code === "OFFLINE") {
    return "bg-slate-100 text-slate-700 border-slate-300";
  }
  return "bg-gray-100 text-gray-700 border-gray-300";
};

const getStatusLabel = (statusCode: string, fallbackName?: string) => {
  const code = statusCode.toUpperCase();
  if (code === "AVAILABLE") return "Sẵn sàng";
  if (code === "BUSY") return "Bận";
  if (code === "OFFLINE") return "Ngoại tuyến";
  return fallbackName || statusCode || "Không rõ";
};

type TeamLeader = {
  id: string;
  displayName: string;
  phone?: string;
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
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
    throw new Error("Khong the lay toa do tu dia chi da nhap.");
  }

  const data = (await response.json()) as Array<{ lat?: string; lon?: string }>;
  const firstResult = data[0];
  const lat = Number(firstResult?.lat);
  const lng = Number(firstResult?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Khong tim thay toa do phu hop cho dia chi nay.");
  }
  return { lat, lng };
}

const buildPayload = (
  form: TeamForm,
  location: { lat: number; lng: number },
): CreateTeamPayload => ({
  code: form.code.trim(),
  name: form.name.trim(),
  leaderUserId: form.leaderUserId.trim(),
  homeBase: {
    address: form.homeBaseAddress.trim(),
    location,
  },
  statusCode: form.statusCode.trim(),
  notes: form.notes.trim(),
});

const mapTeamToForm = (team: ManagerTeam): TeamForm => ({
  code: String(team.code ?? team.teamCode ?? ""),
  name: String(team.name ?? team.teamName ?? ""),
  leaderUserId: String(team.leader?.id ?? team.leaderUserId ?? ""),
  homeBaseAddress: String(team.homeBase?.address ?? team.homeAdminArea?.name ?? ""),
  statusCode: String(team.status?.code ?? "AVAILABLE"),
  notes: String(team.notes ?? ""),
});

export const RescueTeamManagementSection: React.FC = () => {
  const [teams, setTeams] = useState<ManagerTeam[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTeam, setEditingTeam] = useState<ManagerTeam | null>(null);
  const [form, setForm] = useState<TeamForm>(DEFAULT_FORM);
  const [leaders, setLeaders] = useState<TeamLeader[]>([]);
  const [isLoadingLeaders, setIsLoadingLeaders] = useState(false);
  const [selectedAddressSuggestion, setSelectedAddressSuggestion] =
    useState<AddressSuggestion | null>(null);

  const [deletingTeam, setDeletingTeam] = useState<ManagerTeam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const accessToken = useMemo(
    () => getAuthSession()?.accessToken ?? "",
    [isFormOpen, statusFilter, keyword],
  );

  const fetchTeams = async () => {
    if (!accessToken) {
      setError("Vui lòng đăng nhập lại");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getManagerTeams(accessToken, {
        keyword: keyword.trim() || undefined,
        statusCode: statusFilter || undefined,
      });
      setTeams(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không thể tải danh sách đội";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchTeams();
  }, [statusFilter]);

  useEffect(() => {
    if (!isFormOpen) return;
    let mounted = true;

    const fetchLeaders = async () => {
      setIsLoadingLeaders(true);
      try {
        const response = await getUsers({
          roleCode: "COORDINATOR",
          isActive: true,
          page: 1,
          pageSize: 100,
        });
        if (!mounted) return;
        const items = (response.items ?? []).map((user) => ({
          id: user.id,
          displayName: user.displayName || user.username,
          phone: user.phone,
        }));
        setLeaders(items);
      } catch {
        if (!mounted) return;
        setLeaders([]);
      } finally {
        if (mounted) {
          setIsLoadingLeaders(false);
        }
      }
    };

    void fetchLeaders();
    return () => {
      mounted = false;
    };
  }, [isFormOpen]);

  const openCreateModal = () => {
    setEditingTeam(null);
    setForm(DEFAULT_FORM);
    setSelectedAddressSuggestion(null);
    setIsFormOpen(true);
  };

  const openEditModal = (team: ManagerTeam) => {
    setEditingTeam(team);
    setForm(mapTeamToForm(team));
    if (
      team.homeBase?.location?.lat != null &&
      team.homeBase?.location?.lng != null &&
      (team.homeBase?.address || team.homeAdminArea?.name)
    ) {
      const addressText = team.homeBase?.address ?? team.homeAdminArea?.name ?? "";
      setSelectedAddressSuggestion({
        id: team.id,
        display: addressText,
        address: addressText,
        lat: team.homeBase.location.lat,
        lng: team.homeBase.location.lng,
      });
    } else if (
      team.currentLocation?.lat != null &&
      team.currentLocation?.lng != null &&
      (team.homeBase?.address || team.homeAdminArea?.name)
    ) {
      const addressText = team.homeBase?.address ?? team.homeAdminArea?.name ?? "";
      setSelectedAddressSuggestion({
        id: `${team.id}-current`,
        display: addressText,
        address: addressText,
        lat: team.currentLocation.lat,
        lng: team.currentLocation.lng,
      });
    } else {
      setSelectedAddressSuggestion(null);
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      toastError("Vui lòng đăng nhập lại");
      return;
    }

    if (
      !form.code.trim() ||
      !form.name.trim() ||
      !form.leaderUserId.trim() ||
      !form.homeBaseAddress.trim() ||
      !form.statusCode.trim()
    ) {
      toastError("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }

    setIsSubmitting(true);
    try {
      const trimmedAddress = form.homeBaseAddress.trim();
      const location =
        selectedAddressSuggestion?.address.trim() === trimmedAddress
          ? {
              lat: selectedAddressSuggestion.lat,
              lng: selectedAddressSuggestion.lng,
            }
          : await geocodeAddress(trimmedAddress);

      const payload = buildPayload(form, location);
      if (editingTeam?.id) {
        await updateManagerTeam(editingTeam.id, payload, accessToken);
        toastSuccess("Cập nhật đội cứu hộ thành công");
      } else {
        await createManagerTeam(payload, accessToken);
        toastSuccess("Tạo đội cứu hộ thành công");
      }
      setIsFormOpen(false);
      await fetchTeams();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Lưu đội cứu hộ thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTeam?.id) return;
    if (!accessToken) {
      toastError("Vui lòng đăng nhập lại");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteManagerTeam(deletingTeam.id, accessToken);
      toastSuccess("Xóa đội cứu hộ thành công");
      setDeletingTeam(null);
      await fetchTeams();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Xóa đội cứu hộ thất bại");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="space-y-4">
      <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3
                className="text-xl font-bold text-slate-900"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                Quản lý đội cứu hộ
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Tạo, chỉnh sửa và xóa đội cứu hộ theo API manager teams
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={16} />
              Thêm đội cứu hộ
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative md:col-span-2">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo mã đội, tên đội..."
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3">
            <button
              onClick={() => void fetchTeams()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Lọc danh sách
            </button>
          </div>
        </div>

        {error && (
          <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Đang tải dữ liệu đội cứu hộ...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-4 py-3">Đội</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Đội trưởng</th>
                  <th className="px-4 py-3">Khu vực</th>
                  <th className="px-4 py-3">Nhiệm vụ song song</th>
                  <th className="px-4 py-3">Nhân sự / xe</th>
                  <th className="px-4 py-3">Vị trí</th>
                  <th className="px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {teams.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                      Chưa có đội cứu hộ nào.
                    </td>
                  </tr>
                )}
                {teams.map((team) => {
                  const statusCode = String(team.status?.code ?? "");
                  const code = team.code ?? team.teamCode ?? "--";
                  const name = team.name ?? team.teamName ?? "Đội cứu hộ";
                  return (
                    <tr key={team.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{name}</p>
                        <p className="text-xs text-slate-500">{code}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusChip(
                            statusCode,
                          )}`}
                        >
                          {getStatusLabel(statusCode, team.status?.name)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <p className="font-medium">{team.leader?.displayName ?? "--"}</p>
                        <p className="text-xs text-slate-500">{team.leader?.phone ?? ""}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <p className="font-medium">
                          {team.homeBase?.address ?? team.homeAdminArea?.name ?? "--"}
                        </p>
                        <p className="text-xs text-slate-500">{team.homeAdminArea?.code ?? ""}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {team.maxParallelMissions ?? 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {team.memberCount ?? 0} / {team.vehicleCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {team.currentLocation?.lat != null && team.currentLocation?.lng != null
                          ? `${team.currentLocation.lat}, ${team.currentLocation.lng}`
                          : "--"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(team)}
                            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-blue-700"
                            title="Sửa đội"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeletingTeam(team)}
                            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-red-700"
                            title="Xóa đội"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl rounded-xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h4 className="text-lg font-bold text-slate-900">
                {editingTeam ? "Cập nhật đội cứu hộ" : "Tạo đội cứu hộ"}
              </h4>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
              <input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="Mã đội *"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Tên đội *"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <select
                value={form.leaderUserId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, leaderUserId: e.target.value }))
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                disabled={isLoadingLeaders}
              >
                <option value="">
                  {isLoadingLeaders
                    ? "Đang tải danh sách coordinator..."
                    : "Chọn đội trưởng (Coordinator) *"}
                </option>
                {leaders.map((leader) => (
                  <option key={leader.id} value={leader.id}>
                    {leader.displayName}
                    {leader.phone ? ` - ${leader.phone}` : ""}
                  </option>
                ))}
              </select>
              <div className="md:col-span-2">
                <AddressAutocomplete
                  value={form.homeBaseAddress}
                  onChange={(address) => {
                    setForm((p) => ({ ...p, homeBaseAddress: address }));
                    setSelectedAddressSuggestion(null);
                  }}
                  onSelect={(suggestion) => {
                    setForm((p) => ({ ...p, homeBaseAddress: suggestion.address }));
                    setSelectedAddressSuggestion(suggestion);
                  }}
                  placeholder="Địa chỉ home base *"
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Tọa độ lat/lng sẽ tự lấy từ địa chỉ đã chọn.
                </p>
              </div>
              <select
                value={form.statusCode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, statusCode: e.target.value }))
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="BUSY">BUSY</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Ghi chú"
                className="md:col-span-2 min-h-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-blue-700"
              >
                <Users size={16} />
                {isSubmitting ? "Đang lưu..." : "Lưu đội"}
              </button>
            </div>
          </form>
        </div>
      )}

      {deletingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <h4 className="text-lg font-bold text-slate-900">Xóa đội cứu hộ</h4>
            <p className="mt-2 text-sm text-slate-600">
              Bạn chắc chắn muốn xóa đội{" "}
              <span className="font-semibold">
                {deletingTeam.name ?? deletingTeam.teamName ?? deletingTeam.code}
              </span>
              ?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeletingTeam(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-red-700"
              >
                {isDeleting ? "Đang xóa..." : "Xóa đội"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
