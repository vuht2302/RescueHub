import React, { useState } from "react";
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  Truck,
  MapPin,
  Users,
  TrendingUp,
  Map,
  X,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { DispatchModal } from "../components/DispatchModal";
import { VerificationModal } from "../components/VerificationModal";

interface RescueRequest {
  id: string;
  title: string;
  location: string;
  requesterPhone: string;
  requesterName: string;
  signalChannel: "app" | "hotline" | "radio";
  receivedAt: string;
  time: string;
  urgency: "critical" | "high" | "medium" | "low";
  status: "pending" | "verified" | "dispatched" | "in-progress" | "completed";
  description: string;
  verificationNote: string;
  victimCount: number;
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

const RescueCoordinatorPage: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState("overview");
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMapModal, setShowMapModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const [requests] = useState<RescueRequest[]>([
    {
      id: "RG-4492-D",
      title: "Cứu hộ - Người bị thương",
      location: "North-West Ridge, Delta 7",
      requesterPhone: "0987654321",
      requesterName: "Nguyễn Văn An",
      signalChannel: "hotline",
      receivedAt: "10:12",
      time: "10:15",
      urgency: "critical",
      status: "pending",
      description: "Người bị nứt xương, cần sơ cấp cứu ngay lập tức",
      verificationNote:
        "Đã liên hệ lại 1 lần, chờ xác minh vị trí GPS chính xác.",
      victimCount: 1,
      latitude: 46.5782,
      longitude: 7.6541,
    },
    {
      id: "RG-4510-B",
      title: "Sơ tán nhóm leo núi mắc kẹt",
      location: "Suon Dong Glacier Pass, Delta",
      requesterPhone: "0912345678",
      requesterName: "Lê Khánh Hà",
      signalChannel: "app",
      receivedAt: "08:40",
      time: "08:45",
      urgency: "high",
      status: "verified",
      description: "Nhóm 8 người mắc kẹt trong bão tuyết, cần sơ tán khẩn cấp",
      verificationNote: "Đã xác minh qua ảnh/video hiện trường từ ứng dụng.",
      victimCount: 8,
      latitude: 46.45,
      longitude: 7.5,
    },
    {
      id: "RG-4522-A",
      title: "Tiếp tế y tế khẩn cấp",
      location: "Khu nhà tạm tuyến 3, Delta 2",
      requesterPhone: "0999999999",
      requesterName: "Trạm y tế Delta",
      signalChannel: "radio",
      receivedAt: "07:15",
      time: "07:20",
      urgency: "medium",
      status: "dispatched",
      description: "Cung cấp đồn y tế cho khu lều trại khẩn cấp",
      verificationNote: "Đã xác minh bởi đội trực đài khu vực Delta 2.",
      victimCount: 23,
      latitude: 46.3,
      longitude: 7.4,
    },
  ]);

  const [teams] = useState<RescueTeam[]>([
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
    requests[0],
  );

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "🔵 Chờ xác minh";
      case "verified":
        return "✅ Đã xác minh";
      case "dispatched":
        return "🚗 Đã điều phối";
      case "in-progress":
        return "⚙️ Đang xử lý";
      case "completed":
        return "✓ Hoàn thành";
      default:
        return status;
    }
  };

  const filteredRequests = requests.filter(
    (req) =>
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.location.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex" style={{ fontFamily: "var(--font-primary)" }}>
      {/* Sidebar */}
      <Sidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Tổng quan</h1>
            <p className="text-gray-600 text-sm mt-1">
              Quản lý và điều phối cứu hộ
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Tìm kiếm mã nhiệm vụ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-950 focus:outline-none w-80"
              />
            </div>
            <button
              onClick={() => setShowMapModal(true)}
              className="bg-blue-950 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors flex items-center gap-2"
              style={{ backgroundColor: "var(--color-blue-950)" }}
            >
              <Map size={18} />
              Bản đồ
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-gray-300 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-4 px-2 font-bold transition-colors ${
              activeTab === "overview"
                ? "text-blue-950 border-b-2 border-blue-950"
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={
              activeTab === "overview" ? { color: "var(--color-blue-950)" } : {}
            }
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`pb-4 px-2 font-bold transition-colors ${
              activeTab === "tasks"
                ? "text-blue-950 border-b-2 border-blue-950"
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={
              activeTab === "tasks" ? { color: "var(--color-blue-950)" } : {}
            }
          >
            Nhiệm vụ
          </button>
          <button
            onClick={() => setActiveTab("assets")}
            className={`pb-4 px-2 font-bold transition-colors ${
              activeTab === "assets"
                ? "text-blue-950 border-b-2 border-blue-950"
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={
              activeTab === "assets" ? { color: "var(--color-blue-950)" } : {}
            }
          >
            Tài sản
          </button>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {activeTab === "overview" && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500">
                    <p className="text-gray-600 text-sm">Khẩn cấp</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {requests.filter((r) => r.urgency === "critical").length}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                    <p className="text-gray-600 text-sm">Chờ xác minh</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {requests.filter((r) => r.status === "pending").length}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
                    <p className="text-gray-600 text-sm">Đội sẵn sàng</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {teams.filter((t) => t.status === "available").length}
                    </p>
                  </div>
                </div>

                {/* Pending Requests */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Yêu cầu chờ xác minh
                  </h2>
                  <div className="space-y-3">
                    {requests
                      .filter((r) => r.status === "pending")
                      .map((request) => (
                        <div
                          key={request.id}
                          onClick={() => setSelectedRequest(request)}
                          className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-950 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-bold text-gray-900">
                                {request.title}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                                <span className="flex items-center gap-1">
                                  <MapPin size={14} /> {request.location}
                                </span>
                                <span>{request.time}</span>
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1 rounded text-xs font-bold ${getUrgencyColor(request.urgency)}`}
                            >
                              {request.urgency.toUpperCase()}
                            </span>
                          </div>
                          <button className="text-cyan-500 hover:text-cyan-600 font-semibold text-sm mt-3">
                            Xác minh & phân loại →
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === "tasks" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Danh sách nhiệm vụ
                </h2>
                <div className="space-y-3">
                  {filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => setSelectedRequest(request)}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">
                            {request.id}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {request.title}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-gray-600">
                          {getStatusBadge(request.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "assets" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Tài sản & phương tiện
                </h2>
                <div className="space-y-3">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {team.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {team.vehicle}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {team.members} thành viên - {team.currentLocation}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded ${
                            team.status === "available"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {team.status === "available"
                            ? "Sẵn sàng"
                            : "Đang tới"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Current Task */}
          <div className="bg-white rounded-lg shadow-sm p-6 h-fit sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Chi tiết yêu cầu
            </h3>

            {selectedRequest ? (
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-gray-600 font-semibold">
                    Mã
                  </span>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedRequest.id}
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm font-bold text-red-900">
                    {selectedRequest.title}
                  </p>
                  <span className="text-xs text-red-700 font-semibold">
                    KHẨN CẤP
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-xs text-gray-600 block">
                      📍 Vị trí
                    </span>
                    <p className="text-gray-900">{selectedRequest.location}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600 block">
                      👤 Người gửi tín hiệu
                    </span>
                    <p className="text-gray-900">
                      {selectedRequest.requesterName} -{" "}
                      {selectedRequest.requesterPhone}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600 block">
                      ⏰ Thời gian tạo yêu cầu
                    </span>
                    <p className="text-gray-900">{selectedRequest.time}</p>
                  </div>
                </div>

                <div className="border border-blue-100 bg-blue-50 rounded-lg p-3">
                  <h4
                    className="text-sm font-bold mb-2 text-blue-950"
                    style={{ color: "var(--color-blue-950)" }}
                  >
                    Thông tin tín hiệu nhận được
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700">
                      Kênh tiếp nhận:{" "}
                      <span className="font-semibold text-gray-900">
                        {selectedRequest.signalChannel === "app"
                          ? "Ứng dụng"
                          : selectedRequest.signalChannel === "hotline"
                            ? "Hotline"
                            : "Bộ đàm"}
                      </span>
                    </p>
                    <p className="text-gray-700">
                      Thời điểm nhận tín hiệu:{" "}
                      <span className="font-semibold text-gray-900">
                        {selectedRequest.receivedAt}
                      </span>
                    </p>
                    <p className="text-gray-700">
                      Số người cần hỗ trợ:{" "}
                      <span className="font-semibold text-gray-900">
                        {selectedRequest.victimCount}
                      </span>
                    </p>
                    <p className="text-gray-700">
                      Trạng thái xác minh:{" "}
                      <span className="font-semibold text-gray-900">
                        {getStatusBadge(selectedRequest.status)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <span className="text-xs text-gray-600 block mb-2">
                    Mô tả chi tiết
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedRequest.description}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <span className="text-xs text-gray-600 block mb-2">
                    Ghi chú xác minh
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedRequest.verificationNote}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowVerificationModal(true)}
                    className="flex-1 text-white font-bold py-2 rounded text-sm transition-colors hover:opacity-90"
                    style={{ backgroundColor: "var(--color-blue-950)" }}
                  >
                    Xác minh thông tin
                  </button>
                  <button
                    onClick={() => setShowDispatchModal(true)}
                    className="flex-1 text-white font-bold py-2 rounded text-sm transition-colors hover:opacity-90"
                    style={{ backgroundColor: "var(--color-blue-950)" }}
                  >
                    Điều phối ngay
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Chọn một yêu cầu để xem chi tiết
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div
              className="bg-blue-950 px-6 py-4 flex justify-between items-center"
              style={{ backgroundColor: "var(--color-blue-950)" }}
            >
              <h2 className="text-2xl font-black text-white">
                Bản đồ nhiệm vụ
              </h2>
              <button
                onClick={() => setShowMapModal(false)}
                className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-600">
                  Bản đồ OpenStreetMap sẽ hiển thị tại đây
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {selectedRequest && (
        <VerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          requestId={selectedRequest.id}
          requesterName={selectedRequest.requesterName}
          requesterPhone={selectedRequest.requesterPhone}
          requestTitle={selectedRequest.title}
          location={selectedRequest.location}
          description={selectedRequest.description}
          onConfirm={() => {
            console.log(
              `Confirmed request ${selectedRequest.id} as legitimate`,
            );
            // TODO: Gọi API để cập nhật trạng thái xác minh
          }}
          onReject={() => {
            console.log(`Rejected request ${selectedRequest.id} as fake`);
            // TODO: Gọi API để đánh dấu tin giả
          }}
        />
      )}

      {/* Dispatch Modal */}
      {selectedRequest && (
        <DispatchModal
          isOpen={showDispatchModal}
          onClose={() => setShowDispatchModal(false)}
          requestId={selectedRequest.id}
          requestTitle={selectedRequest.title}
          location={selectedRequest.location}
          victimCount={selectedRequest.victimCount}
          onDispatch={(teamId) => {
            console.log(
              `Dispatching team ${teamId} to request ${selectedRequest.id}`,
            );
            // TODO: Gọi API để lưu thông tin điều phối
          }}
        />
      )}
    </div>
  );
};

export { RescueCoordinatorPage as RescueCoordinator };
