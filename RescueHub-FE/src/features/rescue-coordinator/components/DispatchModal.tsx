import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Truck,
  Users,
  Fuel,
  Clock,
  Shield,
  CheckCircle2,
} from "lucide-react";
import {
  getDispatchTeams,
  getTeamVehicles,
  dispatchMission,
  type Team as ApiTeam,
  type TeamVehicle,
  type DispatchMissionRequest,
} from "../services/dispatchService";
import { getAuthSession } from "@/src/features/auth/services/authStorage";
import { toastSuccess, toastError } from "@/src/shared/utils/toast";

interface Team {
  id: string;
  code: string;
  name: string;
  members: number;
  vehicle: string;
  status: "available" | "in-transit" | "on-scene" | "returning";
  currentLocation: string;
  distance: number; // km
  estimatedTime: number; // minutes
  equipment: string[];
  fuel: number; // percentage
  capacity: number; // số người có thể cứu
  specialization: string;
}

interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  requestTitle: string;
  location: string;
  victimCount: number;
  priorityCode?: string;
  onDispatch: (teamId: string) => void;
}

const DispatchModal: React.FC<DispatchModalProps> = ({
  isOpen,
  onClose,
  requestId,
  requestTitle,
  location,
  victimCount,
  priorityCode,
  onDispatch,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [vehicles, setVehicles] = useState<TeamVehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setIsSuccess(false);
      setSelectedTeamId(null);
      setVehicles([]);
      setSelectedVehicleId("");
      return;
    }

    const fetchTeams = async () => {
      setLoading(true);
      setError(null);
      try {
        const session = getAuthSession();
        if (!session?.accessToken) {
          setError("Khong co quyen truy cap");
          return;
        }

        const apiTeams = await getDispatchTeams(session.accessToken);

        // Map API teams to UI teams interface and filter AVAILABLE ones
        const mappedTeams: Team[] = apiTeams
          .filter((team: ApiTeam) => team.status.code === "AVAILABLE")
          .map((team: ApiTeam) => {
            const mockDist = (team.id.charCodeAt(0) % 10) + 2; // 2-11 km
            const mockEta = mockDist * 5; // 5 mins per km

            return {
              id: team.id,
              code: team.code,
              name: team.name,
              members: team.memberCount,
              vehicle: `Xe ${team.code}`,
              status: "available",
              currentLocation: `${team.homeAdminArea.name} [${team.currentLocation?.lat.toFixed(2)}, ${team.currentLocation?.lng.toFixed(2)}]`,
              distance: mockDist,
              estimatedTime: mockEta,
              equipment: team.notes ? [team.notes] : [],
              fuel: 80 + (team.id.charCodeAt(1) % 20),
              capacity: team.maxParallelMissions * 5,
              specialization: team.notes || "Cứu hộ cơ bản",
            };
          });

        setTeams(mappedTeams);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Có lỗi khi tải danh sách team",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [isOpen]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const hasAvailableVehicle = vehicles.some(
    (vehicle) => vehicle.status?.code === "AVAILABLE",
  );

  useEffect(() => {
    if (!isOpen || !selectedTeamId) {
      setVehicles([]);
      setSelectedVehicleId("");
      return;
    }

    const fetchVehicles = async () => {
      setIsLoadingVehicles(true);
      setDispatchError(null);
      try {
        const session = getAuthSession();
        if (!session?.accessToken) {
          setDispatchError("Khong co quyen truy cap");
          return;
        }

        const teamVehicles = await getTeamVehicles(
          session.accessToken,
          selectedTeamId,
        );
        const filteredVehicles = teamVehicles.filter(
          (vehicle) => vehicle.team?.id === selectedTeamId,
        );
        setVehicles(filteredVehicles);

        const firstAvailable = filteredVehicles.find(
          (vehicle) => vehicle.status?.code === "AVAILABLE",
        );
        setSelectedVehicleId(firstAvailable?.id ?? "");
      } catch (err) {
        setVehicles([]);
        setSelectedVehicleId("");
        setDispatchError(
          err instanceof Error
            ? err.message
            : "Có lỗi khi tải danh sách phương tiện",
        );
      } finally {
        setIsLoadingVehicles(false);
      }
    };

    void fetchVehicles();
  }, [isOpen, selectedTeamId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "in-transit":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Sẵn sàng";
      case "in-transit":
        return "Đang tới";
      default:
        return status;
    }
  };

  const handleDispatch = async () => {
    if (!selectedTeamId) return;

    setDispatching(true);
    setDispatchError(null);

    try {
      const session = getAuthSession();
      if (!session?.accessToken) {
        setDispatchError("Khong co quyen truy cap");
        return;
      }

      const selectedTeamData = teams.find((t) => t.id === selectedTeamId);
      if (!selectedTeamData) {
        setDispatchError("Khong tim thay thong tin team");
        return;
      }

      if (hasAvailableVehicle && !selectedVehicleId) {
        setDispatchError("Vui lòng chọn phương tiện cho đội được điều phối");
        return;
      }

      const missionPayload: DispatchMissionRequest = {
        objective: requestTitle,
        priorityCode: priorityCode ?? "HIGH",
        teamAssignments: [
          {
            teamId: selectedTeamId,
            isPrimaryTeam: true,
            memberIds: [],
            vehicleIds: selectedVehicleId ? [selectedVehicleId] : [],
          },
        ],
        etaMinutes: selectedTeamData.estimatedTime,
        note: `Sự cố tại ${location}${victimCount > 0 ? `, ước tính ${victimCount} nạn nhân` : ""}`,
      };

      await dispatchMission(requestId, session.accessToken, missionPayload);
      toastSuccess(
        `Điều phối thành công! Đội cứu hộ đã được phân công đến sự cố.`,
      );
      setIsSuccess(true);

      setTimeout(() => {
        onDispatch(selectedTeamId);
        onClose();
        setIsSuccess(false);
      }, 1500);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Co loi khi dieu phoi team";
      setDispatchError(msg);
      toastError(`Điều phối thất bại: ${msg}`);
    } finally {
      setDispatching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[101] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className="px-6 py-4 flex justify-between items-center"
          style={{ backgroundColor: "var(--color-blue-950)" }}
        >
          <div>
            <h2
              className="text-2xl font-black text-white"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Điều phối cứu hộ
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              {requestTitle} - {requestId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 px-6">
            <CheckCircle2 size={64} className="text-emerald-500 mb-4" />
            <h3 className="text-xl font-black text-gray-900 mb-2">
              Điều phối thành công
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-sm">
              Đội cứu hộ đã được phân công thực hiện nhiệm vụ {requestId}.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 m-6">
                  <p className="text-red-700 font-semibold">{error}</p>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950 mx-auto mb-4"></div>
                    <p className="text-gray-600">Dang tai danh sach team...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-6 p-6">
                  {/* Request Info - Left */}
                  <div className="col-span-1 space-y-4">
                    <div
                      className="bg-blue-50 border-l-4 p-4 rounded"
                      style={{ borderColor: "var(--color-blue-950)" }}
                    >
                      <h3
                        className="text-sm font-bold mb-3"
                        style={{
                          color: "var(--color-blue-950)",
                          fontFamily: "var(--font-primary)",
                        }}
                      >
                        Thông tin yêu cầu
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-gray-600 block text-xs">
                            Địa điểm
                          </span>
                          <p className="font-semibold text-gray-900 flex items-start gap-2">
                            <MapPin
                              size={14}
                              className="mt-0.5 flex-shrink-0"
                            />
                            {location}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600 block text-xs">
                            Số người cần hỗ trợ
                          </span>
                          <p className="font-semibold text-gray-900 flex items-center gap-2">
                            <Users size={14} />
                            {victimCount} người
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Teams List - Center */}
                  <div className="col-span-2 space-y-3">
                    <h3
                      className="font-bold text-gray-900"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Đội cứu hộ gần đó ({teams.length} đội)
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {teams.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          Không có đội cứu hộ nào sẵn sàng gần khu vực này. Vui
                          lòng thử lại sau hoặc mở rộng phạm vi tìm kiếm.
                        </div>
                      ) : (
                        teams.map((team) => (
                          <div
                            key={team.id}
                            onClick={() => setSelectedTeamId(team.id)}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                              selectedTeamId === team.id
                                ? "border-blue-950 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            style={
                              selectedTeamId === team.id
                                ? { borderColor: "var(--color-blue-950)" }
                                : {}
                            }
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4
                                  className="font-bold text-gray-900"
                                  style={{ fontFamily: "var(--font-primary)" }}
                                >
                                  {team.name}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {team.specialization}
                                </p>
                              </div>
                              <span
                                className={`text-xs font-bold px-2 py-1 rounded ${getStatusColor(team.status)}`}
                              >
                                {getStatusText(team.status)}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Clock size={14} />
                                <span>
                                  <strong className="text-gray-900">
                                    {team.estimatedTime}
                                  </strong>{" "}
                                  phút
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin size={14} />
                                <span>
                                  <strong className="text-gray-900">
                                    {team.distance}
                                  </strong>{" "}
                                  km
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Users size={14} />
                                <span>
                                  <strong className="text-gray-900">
                                    {team.members}
                                  </strong>{" "}
                                  thành viên
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Fuel size={14} />
                                <span>
                                  <strong className="text-gray-900">
                                    {team.fuel}%
                                  </strong>{" "}
                                  nhiên liệu
                                </span>
                              </div>
                            </div>

                            <div className="text-sm">
                              <p className="text-xs text-gray-600 mb-1">
                                Phương tiện:
                              </p>
                              <p className="text-gray-900 font-semibold">
                                {team.vehicle}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Team code: {team.code}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Team Details - Full Width */}
              {!loading && selectedTeam && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <h3
                    className="font-bold text-gray-900 mb-4"
                    style={{ fontFamily: "var(--font-primary)" }}
                  >
                    Chi tiết đội được chọn
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Shield
                          size={16}
                          style={{ color: "var(--color-blue-950)" }}
                        />
                        Thiết bị & trang bị
                      </h4>
                      <ul className="space-y-2">
                        {selectedTeam.equipment.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-700">
                            ✓ {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Truck
                          size={16}
                          style={{ color: "var(--color-blue-950)" }}
                        />
                        Thông tin khác
                      </h4>
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                          Chọn phương tiện
                        </p>
                        {isLoadingVehicles ? (
                          <p className="text-sm text-gray-500">
                            Đang tải danh sách phương tiện...
                          </p>
                        ) : vehicles.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            Đội này chưa có phương tiện.
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {vehicles.map((vehicle) => {
                              const isAvailable =
                                vehicle.status?.code === "AVAILABLE";
                              return (
                                <label
                                  key={vehicle.id}
                                  className={`flex items-start gap-2 rounded border p-2 text-sm ${
                                    isAvailable
                                      ? "border-gray-200 bg-white"
                                      : "border-gray-100 bg-gray-50 opacity-70"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="dispatch-vehicle"
                                    value={vehicle.id}
                                    checked={selectedVehicleId === vehicle.id}
                                    onChange={() =>
                                      setSelectedVehicleId(vehicle.id)
                                    }
                                    disabled={!isAvailable}
                                    className="mt-0.5"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">
                                      {vehicle.displayName || vehicle.code}
                                    </p>
                                    <p className="text-xs text-gray-600 truncate">
                                      {vehicle.plateNo} -{" "}
                                      {vehicle.vehicleType?.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Trạng thái: {vehicle.status?.name}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Vị trí hiện tại:
                          </span>
                          <span className="font-semibold text-gray-900">
                            {selectedTeam.currentLocation}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Khả năng tiếp nhận:
                          </span>
                          <span className="font-semibold text-gray-900">
                            {selectedTeam.capacity} người
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tình trạng:</span>
                          <span
                            className={`font-semibold ${getStatusColor(selectedTeam.status)}`}
                          >
                            {getStatusText(selectedTeam.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6 flex flex-col gap-3 bg-gray-50">
              {dispatchError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-red-700 font-semibold">{dispatchError}</p>
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  disabled={dispatching}
                  className="px-6 py-2 rounded-lg border-2 border-gray-300 text-gray-900 font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "var(--font-primary)" }}
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleDispatch}
                  disabled={!selectedTeamId || dispatching}
                  className="px-6 py-2 rounded-lg text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 flex items-center gap-2"
                  style={{
                    backgroundColor:
                      selectedTeamId && !dispatching
                        ? "var(--color-blue-950)"
                        : "#ccc",
                    fontFamily: "var(--font-primary)",
                  }}
                >
                  {dispatching && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {dispatching ? "Dang dieu phoi..." : "Điều Phối Ngay"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export { DispatchModal };
