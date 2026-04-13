import React, { useState } from "react";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Truck,
  MapPin,
  PhoneCall,
  Edit2,
  Eye,
  MoreVertical,
  Users,
  Activity,
  TrendingUp,
} from "lucide-react";

interface RescueRequest {
  id: string;
  title: string;
  location: string;
  requesterPhone: string;
  time: string;
  urgency: "critical" | "high" | "medium" | "low";
  status: "pending" | "verified" | "dispatched" | "in-progress" | "completed";
  description: string;
  latitude: number;
  longitude: number;
}

interface RescueTeam {
  id: string;
  name: string;
  members: number;
  vehicle: string;
  status: "available" | "in-transit" | "on-scene" | "returning";
  currentLocation: string;
}

export const RescueCoordinator: React.FC = () => {
  const [requests, setRequests] = useState<RescueRequest[]>([
    {
      id: "REQ001",
      title: "Tai nạn giao thông - Người bị thương",
      location: "Quận 1, TP HCM",
      requesterPhone: "0987654321",
      time: "10:15",
      urgency: "critical",
      status: "pending",
      description: "Hai xe máy va chạm gần công viên Tao Đàn",
      latitude: 10.7769,
      longitude: 106.7009,
    },
    {
      id: "REQ002",
      title: "Nạn nhân mất tích",
      location: "Quận 7, TP HCM",
      requesterPhone: "0912345678",
      time: "09:45",
      urgency: "high",
      status: "verified",
      description: "Cô gái 22 tuổi mất tích kể từ chiều hôm qua",
      latitude: 10.7315,
      longitude: 106.7289,
    },
  ]);

  const [teams, setTeams] = useState<RescueTeam[]>([
    {
      id: "TEAM001",
      name: "Đội Cứu Hộ Nhanh 1",
      members: 4,
      vehicle: "Xe cứu hộ 01",
      status: "available",
      currentLocation: "Trạm Q1",
    },
    {
      id: "TEAM002",
      name: "Đội Tìm Kiếm & Cứu Nạn",
      members: 6,
      vehicle: "Xe tìm kiếm 02",
      status: "in-transit",
      currentLocation: "Đường Nguyễn Huệ",
    },
  ]);

  const [selectedRequest, setSelectedRequest] = useState<RescueRequest | null>(
    null,
  );
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedTeamRequest, setSelectedTeamRequest] =
    useState<RescueRequest | null>(null);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-red-100 text-red-900 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-900 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-900 border-yellow-300";
      default:
        return "bg-blue-100 text-blue-900 border-blue-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "dispatched":
        return "bg-purple-100 text-purple-800";
      case "verified":
        return "bg-cyan-100 text-cyan-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusTextVie = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ xác minh";
      case "verified":
        return "Đã xác minh";
      case "dispatched":
        return "Đã điều phối";
      case "in-progress":
        return "Đang xử lý";
      case "completed":
        return "Hoàn thành";
      default:
        return status;
    }
  };

  const verifyRequest = (requestId: string) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, status: "verified" } : req,
      ),
    );
    setShowVerifyModal(false);
  };

  const dispatchTeam = (requestId: string, teamId: string) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, status: "dispatched" } : req,
      ),
    );
    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId ? { ...team, status: "in-transit" } : team,
      ),
    );
  };

  const updateRequestStatus = (requestId: string, newStatus: string) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? { ...req, status: newStatus as RescueRequest["status"] }
          : req,
      ),
    );
  };

  return (
    <div
      className="max-w-7xl mx-auto"
      style={{ fontFamily: "var(--font-primary)" }}
    >
      {/* Header */}
      <header className="mb-8">
        <h1
          className="text-5xl font-black text-on-surface mb-2 tracking-tighter"
          style={{ fontFamily: "var(--font-primary)" }}
        >
          Trung Tâm Điều Phối Cứu Hộ
        </h1>
        <p className="text-on-surface-variant text-lg">
          Quản lý, xác minh yêu cầu và điều phối đội cứu hộ
        </p>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={24} />
            <div>
              <p className="text-sm text-gray-600">Yêu cầu khẩn cấp</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter((r) => r.urgency === "critical").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <Clock className="text-blue-500" size={24} />
            <div>
              <p className="text-sm text-gray-600">Chờ xác minh</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter((r) => r.status === "pending").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center gap-3">
            <Truck className="text-purple-500" size={24} />
            <div>
              <p className="text-sm text-gray-600">Đang điều phối</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter((r) => r.status === "dispatched").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-green-500" size={24} />
            <div>
              <p className="text-sm text-gray-600">Đội khả dụng</p>
              <p className="text-2xl font-bold text-gray-900">
                {teams.filter((t) => t.status === "available").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Tiếp nhận & Xác minh */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="text-blue-950" size={24} />
              <h2
                className="text-2xl font-bold text-gray-900"
                style={{ color: "var(--color-blue-950)" }}
              >
                Yêu Cầu Chờ Xác Minh
              </h2>
            </div>

            <div className="space-y-3">
              {requests.filter((r) => r.status === "pending").length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Không có yêu cầu chờ xác minh
                </p>
              ) : (
                requests
                  .filter((r) => r.status === "pending")
                  .map((request) => (
                    <div
                      key={request.id}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-950 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">
                            {request.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                            <div className="flex items-center gap-1">
                              <MapPin size={16} />
                              {request.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={16} />
                              {request.time}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${getUrgencyColor(request.urgency)}`}
                        >
                          {request.urgency.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-4">
                        {request.description}
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowVerifyModal(true);
                          }}
                          className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 rounded-lg transition-colors text-sm"
                        >
                          <Eye size={16} className="inline mr-2" />
                          Xác Minh & Phân Loại
                        </button>
                        <button className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </section>

          {/* Section 2: Phân loại mức độ & Điều phối */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="text-blue-950" size={24} />
              <h2
                className="text-2xl font-bold text-gray-900"
                style={{ color: "var(--color-blue-950)" }}
              >
                Đã Xác Minh - Chờ Điều Phối
              </h2>
            </div>

            <div className="space-y-3">
              {requests.filter((r) => r.status === "verified").length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Không có yêu cầu cần điều phối
                </p>
              ) : (
                requests
                  .filter((r) => r.status === "verified")
                  .map((request) => (
                    <div
                      key={request.id}
                      className="border-2 border-gray-200 rounded-lg p-4 bg-cyan-50/30"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">
                            {request.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                            <div className="flex items-center gap-1">
                              <MapPin size={16} />
                              {request.location}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${getUrgencyColor(request.urgency)}`}
                        >
                          {request.urgency.toUpperCase()}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Chọn đội cứu hộ:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {teams
                            .filter((t) => t.status === "available")
                            .map((team) => (
                              <button
                                key={team.id}
                                onClick={() =>
                                  dispatchTeam(request.id, team.id)
                                }
                                className="bg-white border-2 border-gray-300 hover:border-cyan-500 hover:bg-cyan-50 text-gray-900 font-semibold py-2 rounded-lg transition-all text-sm"
                              >
                                <Users size={14} className="inline mr-1" />
                                {team.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </section>

          {/* Section 3: Theo dõi & Điều chỉnh */}
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="text-blue-950" size={24} />
              <h2
                className="text-2xl font-bold text-gray-900"
                style={{ color: "var(--color-blue-950)" }}
              >
                Theo Dõi & Điều Chỉnh Trạng Thái
              </h2>
            </div>

            <div className="space-y-3">
              {requests
                .filter((r) => ["dispatched", "in-progress"].includes(r.status))
                .map((request) => (
                  <div
                    key={request.id}
                    className="border-2 border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">
                          {request.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {request.location}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(request.status)}`}
                      >
                        {getStatusTextVie(request.status)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {request.status === "dispatched" && (
                        <button
                          onClick={() =>
                            updateRequestStatus(request.id, "in-progress")
                          }
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition-colors text-sm"
                        >
                          <Activity size={16} className="inline mr-2" />
                          Bắt Đầu Xử Lý
                        </button>
                      )}
                      {request.status === "in-progress" && (
                        <button
                          onClick={() =>
                            updateRequestStatus(request.id, "completed")
                          }
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg transition-colors text-sm"
                        >
                          <CheckCircle2 size={16} className="inline mr-2" />
                          Đánh Dấu Hoàn Thành
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedTeamRequest(request)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-semibold"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </div>

        {/* Sidebar: Đội Cứu Hộ */}
        <aside className="space-y-6">
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <Truck className="text-blue-950" size={24} />
              <h2
                className="text-xl font-bold text-gray-900"
                style={{ color: "var(--color-blue-950)" }}
              >
                Đội Cứu Hộ
              </h2>
            </div>

            <div className="space-y-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border-l-4 border-blue-950"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{team.name}</h3>
                      <p className="text-sm text-gray-600">{team.vehicle}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        team.status === "available"
                          ? "bg-green-100 text-green-800"
                          : team.status === "in-transit"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {team.status === "available"
                        ? "Sẵn sàng"
                        : team.status === "in-transit"
                          ? "Đang tới"
                          : "Tại hiện trường"}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Users size={14} />
                      <span>{team.members} thành viên</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin size={14} />
                      <span className="text-xs">{team.currentLocation}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="bg-blue-950 rounded-2xl shadow-sm p-6">
            <h3
              className="text-lg font-bold text-white mb-4"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Hành Động Nhanh
            </h3>
            <div className="space-y-2">
              <button className="w-full bg-white text-blue-950 hover:bg-gray-100 font-bold py-2 rounded-lg transition-colors text-sm">
                <PhoneCall size={16} className="inline mr-2" />
                Gọi Điều Phối Viên
              </button>
              <button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 rounded-lg transition-colors text-sm">
                <AlertTriangle size={16} className="inline mr-2" />
                Báo Động Toàn Bộ
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};
