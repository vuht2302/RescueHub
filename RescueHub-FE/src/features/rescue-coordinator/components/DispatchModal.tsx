import React, { useState } from "react";
import { X, MapPin, Truck, Users, Fuel, Clock, Shield } from "lucide-react";

interface Team {
  id: string;
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
  onDispatch: (teamId: string) => void;
}

const DispatchModal: React.FC<DispatchModalProps> = ({
  isOpen,
  onClose,
  requestId,
  requestTitle,
  location,
  victimCount,
  onDispatch,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const teams: Team[] = [
    {
      id: "TEAM001",
      name: "Đội Cứu Hộ Nhanh 1",
      members: 4,
      vehicle: "Xe cứu hộ 01",
      status: "available",
      currentLocation: "Trạm Q1",
      distance: 2.3,
      estimatedTime: 8,
      equipment: ["Dây cứu", "Máy cắt", "Bóng nghe"],
      fuel: 95,
      capacity: 6,
      specialization: "Cứu hộ giao thông",
    },
    {
      id: "TEAM002",
      name: "Đội Tìm Kiếm & Cứu Nạn",
      members: 6,
      vehicle: "Xe tìm kiếm 02",
      status: "available",
      currentLocation: "Trạm Q3",
      distance: 4.1,
      estimatedTime: 14,
      equipment: ["Thiết bị tìm kiếm", "Dây cứu chuyên dụng", "Bộ sơ cấp cứu"],
      fuel: 88,
      capacity: 8,
      specialization: "Tìm kiếm & cứu nạn",
    },
    {
      id: "TEAM003",
      name: "Đội Y Tế Khẩn Cấp",
      members: 3,
      vehicle: "Xe cấp cứu 03",
      status: "available",
      currentLocation: "Bệnh viện Quận 1",
      distance: 3.5,
      estimatedTime: 11,
      equipment: ["Máy khử rung", "Oxy", "Thiết bị hồi sức"],
      fuel: 92,
      capacity: 4,
      specialization: "Y tế khẩn cấp",
    },
    {
      id: "TEAM004",
      name: "Đội Cứu Hộ Cao Độc",
      members: 5,
      vehicle: "Xe thang 04",
      status: "available",
      currentLocation: "Trạm Q7",
      distance: 6.2,
      estimatedTime: 20,
      equipment: ["Thang cứu", "Dây bảo hiểm", "Đèn LED"],
      fuel: 78,
      capacity: 5,
      specialization: "Cứu hộ độ cao",
    },
  ];

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

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

  const handleDispatch = () => {
    if (selectedTeamId) {
      onDispatch(selectedTeamId);
      onClose();
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
        <div className="flex-1 overflow-y-auto">
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
                      <MapPin size={14} className="mt-0.5 flex-shrink-0" />
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
                {teams.map((team) => (
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
                      <p className="text-xs text-gray-600 mb-1">Phương tiện:</p>
                      <p className="text-gray-900 font-semibold">
                        {team.vehicle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Team Details - Full Width */}
          {selectedTeam && (
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
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vị trí hiện tại:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedTeam.currentLocation}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Khả năng tiếp nhận:</span>
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
        <div className="border-t border-gray-200 p-6 flex gap-3 justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border-2 border-gray-300 text-gray-900 font-bold hover:bg-gray-100 transition-colors"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleDispatch}
            disabled={!selectedTeamId}
            className="px-6 py-2 rounded-lg text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{
              backgroundColor: selectedTeamId
                ? "var(--color-blue-950)"
                : "#ccc",
              fontFamily: "var(--font-primary)",
            }}
          >
            Điều phối ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export { DispatchModal };
