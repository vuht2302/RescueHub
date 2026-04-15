import React, { useEffect, useMemo, useState } from "react";
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
import { useCoordinator } from "../../../shared/context/CoordinatorContext";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import { DispatchModal } from "../components/DispatchModal";
import { VerificationModal } from "../components/VerificationModal";
import {
  getIncidents,
  getIncidentDetail,
  type IncidentItem,
  type IncidentDetail,
} from "../services/incidentServices";

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
  incidentDetail?: IncidentDetail | null;
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
  const { activeMenu, setActiveMenu } = useCoordinator();
  const [searchQuery, setSearchQuery] = useState("");
  const [showMapModal, setShowMapModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const [requests, setRequests] = useState<RescueRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  const [selectedIncidentDetail, setSelectedIncidentDetail] =
    useState<IncidentDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const mapIncidentToRescueRequest = (
    incident: IncidentItem,
  ): RescueRequest => {
    const statusCode = incident.status?.code ?? "PENDING";
    const normalizedStatus: RescueRequest["status"] =
      statusCode === "NEW"
        ? "pending"
        : statusCode === "VERIFIED"
          ? "verified"
          : statusCode === "ASSIGNED"
            ? "dispatched"
            : statusCode === "IN_PROGRESS"
              ? "in-progress"
              : statusCode === "COMPLETED"
                ? "completed"
                : "pending";

    const reportedDate = new Date(incident.reportedAt);
    const timeLabel = Number.isNaN(reportedDate.getTime())
      ? "--:--"
      : reportedDate.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });

    return {
      id: incident.id,
      title: `Sự cố ${incident.incidentCode}`,
      location: "Chưa có thông tin vị trí",
      requesterPhone: "Chưa cập nhật",
      requesterName: "Chưa cập nhật",
      signalChannel: "app",
      receivedAt: timeLabel,
      time: timeLabel,
      urgency: "high",
      status: normalizedStatus,
      description:
        "Dữ liệu mô tả chi tiết chưa được cung cấp từ endpoint incidents.",
      verificationNote: "Đang chờ cập nhật ghi chú xác minh từ hệ thống.",
      victimCount: 0,
      latitude: 0,
      longitude: 0,
      incidentDetail: null,
    };
  };

  useEffect(() => {
    const loadIncidents = async () => {
      setIsLoadingRequests(true);
      setRequestsError(null);

      try {
        const authSession = getAuthSession();
        if (!authSession?.accessToken) {
          throw new Error("Không có token xác thực. Vui lòng đăng nhập lại.");
        }
        const incidents = await getIncidents(authSession.accessToken);
        const mappedRequests = incidents.map(mapIncidentToRescueRequest);
        console.log("Raw incidents:", incidents);
        console.log("Mapped requests:", mappedRequests);
        console.log(
          "Pending requests:",
          mappedRequests.filter((r) => r.status === "pending"),
        );
        setRequests(mappedRequests);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu sự cố từ hệ thống";
        setRequestsError(message);
      } finally {
        setIsLoadingRequests(false);
      }
    };

    void loadIncidents();
  }, []);

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
    null,
  );

  // Fetch incident details when selectedRequest changes
  useEffect(() => {
    const fetchIncidentDetail = async () => {
      if (!selectedRequest?.id) {
        setSelectedIncidentDetail(null);
        setDetailError(null);
        return;
      }

      setIsLoadingDetail(true);
      setDetailError(null);

      try {
        const authSession = getAuthSession();
        if (!authSession?.accessToken) {
          throw new Error("Không có token xác thực");
        }

        const detail = await getIncidentDetail(
          selectedRequest.id,
          authSession.accessToken,
        );
        setSelectedIncidentDetail(detail);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể tải chi tiết sự cố";
        setDetailError(message);
        setSelectedIncidentDetail(null);
      } finally {
        setIsLoadingDetail(false);
      }
    };

    void fetchIncidentDetail();
  }, [selectedRequest?.id]);

  useEffect(() => {
    if (!selectedRequest && requests.length > 0) {
      setSelectedRequest(requests[0]);
      return;
    }

    if (selectedRequest) {
      const exists = requests.some(
        (request) => request.id === selectedRequest.id,
      );
      if (!exists) {
        setSelectedRequest(requests[0] ?? null);
      }
    }
  }, [requests, selectedRequest]);

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
        return " Chờ xác minh";
      case "verified":
        return " Đã xác minh";
      case "dispatched":
        return " Đã điều phối";
      case "in-progress":
        return " Đang xử lý";
      case "completed":
        return "✓ Hoàn thành";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-700";
      case "verified":
        return "bg-green-100 text-green-800";
      case "dispatched":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredRequests = useMemo(
    () =>
      requests.filter(
        (req) =>
          req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.id.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [requests, searchQuery],
  );

  return (
    <>
      <main
        className="p-6 bg-gray-50 min-h-screen"
        style={{ fontFamily: "var(--font-primary)" }}
      >
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
            onClick={() => setActiveMenu("overview")}
            className={`pb-4 px-2 font-bold transition-colors ${
              activeMenu === "overview"
                ? "text-blue-950 border-b-2 border-blue-950"
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={
              activeMenu === "overview"
                ? { color: "var(--color-blue-950)" }
                : {}
            }
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveMenu("tasks")}
            className={`pb-4 px-2 font-bold transition-colors ${
              activeMenu === "tasks"
                ? "text-blue-950 border-b-2 border-blue-950"
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={
              activeMenu === "tasks" ? { color: "var(--color-blue-950)" } : {}
            }
          >
            Nhiệm vụ
          </button>
          <button
            onClick={() => setActiveMenu("assets")}
            className={`pb-4 px-2 font-bold transition-colors ${
              activeMenu === "assets"
                ? "text-blue-950 border-b-2 border-blue-950"
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={
              activeMenu === "assets" ? { color: "var(--color-blue-950)" } : {}
            }
          >
            Tài sản
          </button>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {activeMenu === "overview" && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500">
                    <p className="text-gray-600 text-sm">Chờ xác minh</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {requests.filter((r) => r.status === "pending").length}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
                    <p className="text-gray-600 text-sm">Đã xác minh</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {requests.filter((r) => r.status === "verified").length}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                    <p className="text-gray-600 text-sm">Đã phân công</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {requests.filter((r) => r.status === "dispatched").length}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-500">
                    <p className="text-gray-600 text-sm">Đang thực hiện</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {
                        requests.filter((r) => r.status === "in-progress")
                          .length
                      }
                    </p>
                  </div>
                </div>

                {/* Pending Requests */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Yêu cầu chờ xác minh
                  </h2>

                  {isLoadingRequests && (
                    <p className="text-sm text-gray-600">
                      Đang tải dữ liệu sự cố...
                    </p>
                  )}

                  {requestsError && (
                    <div className="border border-red-200 bg-red-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-red-700">{requestsError}</p>
                    </div>
                  )}

                  {!isLoadingRequests &&
                    !requestsError &&
                    requests.length === 0 && (
                      <p className="text-sm text-gray-600">
                        Chưa có sự cố nào từ hệ thống.
                      </p>
                    )}

                  <div className="space-y-3">
                    {requests.map((request) => (
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
                            className={`px-3 py-1 rounded text-xs font-bold ${getStatusColor(request.status)}`}
                          >
                            {getStatusBadge(request.status)}
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

            {activeMenu === "tasks" && (
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
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(request.status)}`}
                        >
                          {getStatusBadge(request.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeMenu === "assets" && (
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
                {isLoadingDetail && (
                  <p className="text-sm text-gray-600">
                    Đang tải chi tiết sự cố...
                  </p>
                )}

                {detailError && (
                  <div className="border border-red-200 bg-red-50 rounded-lg p-3">
                    <p className="text-sm text-red-700">{detailError}</p>
                  </div>
                )}

                {!isLoadingDetail && selectedIncidentDetail ? (
                  <>
                    <div>
                      <span className="text-xs text-gray-600 font-semibold">
                        Mã
                      </span>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedIncidentDetail.incidentCode}
                      </p>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-sm font-bold text-red-900">
                        Sự cố {selectedIncidentDetail.incidentCode}
                      </p>
                      <span className="text-xs text-red-700 font-semibold">
                        {selectedIncidentDetail.priority?.name || "KHẨN CẤP"}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-xs text-gray-600 block">
                          📍 Vị trí
                        </span>
                        <p className="text-gray-900">
                          {selectedIncidentDetail.location?.addressText ||
                            "Chưa có thông tin vị trí"}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600 block">
                          👤 Người gửi tín hiệu
                        </span>
                        <p className="text-gray-900">
                          {selectedIncidentDetail.reporter?.name ||
                            "Chưa cập nhật"}{" "}
                          -{" "}
                          {selectedIncidentDetail.reporter?.phone ||
                            "Chưa cập nhật"}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600 block">
                          ⏰ Thời gian tạo yêu cầu
                        </span>
                        <p className="text-gray-900">
                          {new Date(
                            selectedIncidentDetail.reportedAt,
                          ).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
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
                            {selectedIncidentDetail.channel?.name ||
                              "Chưa cập nhật"}
                          </span>
                        </p>
                        <p className="text-gray-700">
                          Thời điểm nhận tín hiệu:{" "}
                          <span className="font-semibold text-gray-900">
                            {new Date(
                              selectedIncidentDetail.reportedAt,
                            ).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </p>
                        <p className="text-gray-700">
                          Số người cần hỗ trợ:{" "}
                          <span className="font-semibold text-gray-900">
                            {selectedIncidentDetail.victimCountEstimate ?? 0}
                          </span>
                        </p>
                        <p className="text-gray-700">
                          Trạng thái xác minh:{" "}
                          <span
                            className={`inline-block mt-1 font-semibold px-3 py-1 rounded text-xs ${getStatusColor(selectedRequest.status)}`}
                          >
                            {selectedIncidentDetail.status?.name ||
                              getStatusBadge(selectedRequest.status)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <span className="text-xs text-gray-600 block mb-2">
                        Mô tả chi tiết
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {selectedIncidentDetail.description || "Chưa có mô tả"}
                      </p>
                    </div>

                    <div className="border-t pt-4">
                      <span className="text-xs text-gray-600 block mb-2">
                        Ghi chú xác minh
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {selectedIncidentDetail.latestAssessment
                          ? "Đã có thông tin đánh giá mới nhất."
                          : "Đang chờ cập nhật ghi chú xác minh từ hệ thống."}
                      </p>
                    </div>
                  </>
                ) : null}

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
    </>
  );
};

export { RescueCoordinatorPage as RescueCoordinator };
