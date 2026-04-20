import React, { useEffect, useMemo, useState } from "react";
import { Search, MapPin, Map, X } from "lucide-react";
import { useCoordinator } from "../../../shared/context/CoordinatorContext";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import { DispatchModal } from "../components/DispatchModal";
import { VerificationModal } from "../components/VerificationModal";
import { SeverityAssessmentModal } from "../components/SeverityAssessmentModal";
import { CurrentMissionsSection } from "../components/CurrentMissionsSection";
import { MissionMapSection } from "../components/MissionMapSection";
import { IncidentDetailPanel } from "../components/IncidentDetailPanel";
import { TeamManagementSection } from "../components/TeamManagementSection";
import {
  getIncidents,
  getIncidentDetail,
  verifyIncident,
  rejectIncident,
  type IncidentItem,
  type IncidentDetail,
} from "../services/incidentServices";
import {
  toastSuccess,
  toastError,
  toastWarning,
} from "../../../shared/utils/toast";

interface RescueRequest {
  id: string;
  title: string;
  incidentCode: string;
  reportedAt: string; // original ISO timestamp for sorting
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
  handlingTeamName?: string;
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
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showMapModal, setShowMapModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

  const [requests, setRequests] = useState<RescueRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  // Cache location info from detail calls so we can show it in list without re-fetching
  const [detailCache, setDetailCache] = useState<
    Record<string, IncidentDetail>
  >({});

  const [selectedIncidentDetail, setSelectedIncidentDetail] =
    useState<IncidentDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [assessmentSuccess, setAssessmentSuccess] = useState(false);

  const mapIncidentToRescueRequest = (
    incident: IncidentItem,
  ): RescueRequest => {
    let normalizedStatus: RescueRequest["status"] = "pending";
    const statusCode = incident.status?.code ?? "PENDING";
    
    let handlingTeamName = undefined;
    const hasHandlingTeam = incident.handlingTeams && incident.handlingTeams.length > 0;

    if (hasHandlingTeam) {
      const primaryTeam = incident.handlingTeams.find((t) => t.isPrimaryTeam) || incident.handlingTeams[0];
      handlingTeamName = primaryTeam.teamName;
      const mStatus = primaryTeam.missionStatusCode;
      
      if (mStatus === "ASSIGNED" || mStatus === "DISPATCHED") normalizedStatus = "dispatched";
      else if (mStatus === "RESCUING" || mStatus === "IN_PROGRESS") normalizedStatus = "in-progress";
      else if (mStatus === "COMPLETED") normalizedStatus = "completed";
      else normalizedStatus = "dispatched";
    } else {
      if (statusCode === "NEW" || statusCode === "PENDING") normalizedStatus = "pending";
      else if (statusCode === "VERIFIED" || statusCode === "ASSESSED") normalizedStatus = "verified";
      else if (statusCode === "ASSIGNED") normalizedStatus = "dispatched";
      else if (statusCode === "IN_PROGRESS") normalizedStatus = "in-progress";
      else if (statusCode === "COMPLETED") normalizedStatus = "completed";
    }

    const reportedDate = new Date(incident.reportedAt);
    const timeLabel = Number.isNaN(reportedDate.getTime())
      ? "--:--"
      : reportedDate.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });

    return {
      id: incident.id,
      incidentCode: incident.incidentCode,
      reportedAt: incident.reportedAt,
      title: `Sự cố ${incident.incidentCode}`,
      location: incident.location?.addressText ?? "Chưa có vị trí",
      requesterPhone: "Chưa cập nhật",
      requesterName: "Chưa cập nhật",
      signalChannel: "app",
      receivedAt: timeLabel,
      time: timeLabel,
      urgency: "high",
      status: normalizedStatus,
      description: "",
      verificationNote: "",
      victimCount: 0,
      latitude: incident.location?.lat ?? 0,
      longitude: incident.location?.lng ?? 0,
      handlingTeamName,
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
        // Cache location info for display in list
        setDetailCache((prev) => ({ ...prev, [detail.id]: detail }));
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

  const filteredRequests = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return (
      requests
        .filter((req) => {
          const matchesSearch =
            req.title.toLowerCase().includes(q) ||
            req.id.toLowerCase().includes(q) ||
            (detailCache[req.id]?.location?.addressText ?? "")
              .toLowerCase()
              .includes(q);
          const matchesStatus =
            statusFilter === "" || req.status === statusFilter;
          return matchesSearch && matchesStatus;
        })
        // Sort newest first by reportedAt ISO timestamp
        .sort(
          (a, b) =>
            new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime(),
        )
    );
  }, [requests, searchQuery, statusFilter, detailCache]);

  const handleVerifyConfirm = async () => {
    if (!selectedRequest) return;

    try {
      setIsVerifying(true);
      setVerificationError(null);

      const authSession = getAuthSession();
      if (!authSession?.accessToken) {
        throw new Error("Không có token xác thực");
      }

      await verifyIncident(
        selectedRequest.id,
        {
          verified: true,
          note: "Đã gọi xác minh qua điện thoại",
        },
        authSession.accessToken,
      );

      setVerificationSuccess(true);
      toastSuccess(
        `Sự cố ${selectedRequest.incidentCode} đã được xác minh thành công!`,
      );
      setRequests((prev) =>
        prev.map((req) =>
          req.id === selectedRequest.id
            ? { ...req, status: "verified" as const }
            : req,
        ),
      );

      setTimeout(() => {
        setShowVerificationModal(false);
        setVerificationSuccess(false);
        setShowAssessmentModal(true);
      }, 1500);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Lỗi không xác định";
      setVerificationError(message);
      toastError(`Xác minh thất bại: ${message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAssessmentConfirm = async (incidentId: string) => {
    try {
      setIsAssessing(true);
      setAssessmentError(null);

      const authSession = getAuthSession();
      if (!authSession?.accessToken) {
        throw new Error("Không có token xác thực");
      }

      setRequests((prev) =>
        prev.map((req) =>
          req.id === incidentId
            ? { ...req, status: "dispatched" as const }
            : req,
        ),
      );

      setAssessmentSuccess(true);
      toastSuccess(
        "Đánh giá mức độ thành công! Đang chuyển sang bước điều phối...",
      );

      setTimeout(() => {
        setShowAssessmentModal(false);
        setAssessmentSuccess(false);
      }, 1500);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Lỗi không xác định";
      setAssessmentError(message);
      toastError(`Đánh giá thất bại: ${message}`);
    } finally {
      setIsAssessing(false);
    }
  };

  return (
    <>
      <main
        className={`p-6 bg-gray-50 ${activeMenu === "map" || activeMenu === "current" ? "h-screen" : "min-h-screen"}`}
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


        {/* Content Area */}
        <div
          className={`${
            activeMenu === "map" || activeMenu === "current" || activeMenu === "teams"
              ? "grid grid-cols-1 gap-6"
              : "grid grid-cols-3 gap-6"
          } ${activeMenu === "map" || activeMenu === "current" ? "h-screen" : ""}`}
        >
          {/* Main Content */}
          <div
            className={`${
              activeMenu === "map" || activeMenu === "teams" ? "col-span-1 h-full" : "col-span-2"
            } space-y-6`}
          >
            {activeMenu === "map" && <MissionMapSection />}

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

                {/* Incident List */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  {/* List Header with filter */}
                  <div className="flex items-center justify-between mb-4 gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Danh sách sự cố
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {filteredRequests.length} / {requests.length} sự cố •
                        Mới nhất trước
                      </p>
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border-2 border-gray-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-700 focus:outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="pending">Chờ xác minh</option>
                      <option value="verified">Đã xác minh</option>
                      <option value="dispatched">Đã điều phối</option>
                      <option value="in-progress">Đang xử lý</option>
                      <option value="completed">Hoàn thành</option>
                    </select>
                  </div>

                  {isLoadingRequests && (
                    <div className="flex items-center gap-3 py-4">
                      <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      <p className="text-sm text-gray-500">
                        Đang tải dữ liệu sự cố...
                      </p>
                    </div>
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

                  <div className="space-y-2.5">
                    {filteredRequests.length === 0 && !isLoadingRequests && (
                      <p className="text-sm text-gray-400 py-6 text-center">
                        {statusFilter
                          ? "Không có sự cố nào ở trạng thái này."
                          : "Chưa có sự cố nào."}
                      </p>
                    )}
                    {filteredRequests.map((request) => {
                      const cached = detailCache[request.id];
                      const locationText =
                        request.location ||
                        cached?.location?.addressText ||
                        null;
                      const isSelected = selectedRequest?.id === request.id;
                      return (
                        <div
                          key={request.id}
                          onClick={() => setSelectedRequest(request)}
                          className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                            isSelected
                              ? "border-blue-700 bg-blue-50 shadow-sm"
                              : "border-gray-100 hover:border-blue-200 hover:shadow-sm bg-white"
                          }`}
                          style={
                            isSelected
                              ? { borderColor: "var(--color-blue-950)" }
                              : {}
                          }
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900 text-sm truncate">
                                  {request.title}
                                </h3>
                                {/* SOS badge from cache */}
                                {cached?.isSOS && (
                                  <span className="flex-shrink-0 px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-black rounded animate-pulse">
                                    SOS
                                  </span>
                                )}
                              </div>
                              <div className="flex items-start gap-1 text-xs text-gray-500 mt-1.5">
                                <MapPin
                                  size={12}
                                  className="flex-shrink-0 mt-0.5"
                                />
                                <span className="truncate">
                                  {locationText ?? "Đang tải vị trí..."}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <span className="text-xs text-gray-400">
                                  {request.time}
                                </span>
                                {cached?.incidentType?.name && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">
                                    {cached.incidentType.name}
                                  </span>
                                )}
                                {request.handlingTeamName && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-bold truncate max-w-[150px]" title={request.handlingTeamName}>
                                    {request.handlingTeamName}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span
                              className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusColor(request.status)}`}
                            >
                              {getStatusBadge(request.status)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
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

            {activeMenu === "teams" && <TeamManagementSection />}

            {activeMenu === "current" && <CurrentMissionsSection />}
          </div>

          {/* Right Panel - Incident Detail */}
          {activeMenu !== "current" && activeMenu !== "map" && activeMenu !== "teams" && (
            <div
              className="bg-white rounded-xl shadow-sm border border-gray-100 sticky top-6 overflow-hidden"
              style={{
                maxHeight: "calc(100vh - 120px)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Panel Header */}
              <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Chi tiết yêu cầu
                </h3>
              </div>

              {selectedRequest ? (
                <div className="flex-1 overflow-hidden flex flex-col">
                  {isLoadingDetail && (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"
                          style={{ borderWidth: 3 }}
                        />
                        <p className="text-sm text-gray-500">
                          Đang tải chi tiết sự cố...
                        </p>
                      </div>
                    </div>
                  )}

                  {detailError && (
                    <div className="mx-5 mt-4 border border-red-200 bg-red-50 rounded-xl p-4">
                      <p className="text-sm text-red-700 font-medium">
                        {detailError}
                      </p>
                    </div>
                  )}

                  {!isLoadingDetail && selectedIncidentDetail && (
                    <IncidentDetailPanel
                      detail={selectedIncidentDetail}
                      requestStatus={selectedRequest.status}
                      onVerify={() => setShowVerificationModal(true)}
                      onAssess={() => setShowAssessmentModal(true)}
                      onDispatch={() => setShowDispatchModal(true)}
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <MapPin size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">
                    Chọn một yêu cầu để xem chi tiết
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
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
            <div className="flex-1 overflow-hidden h-full">
              <MissionMapSection />
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {selectedRequest && (
        <VerificationModal
          isOpen={showVerificationModal}
          onClose={() => {
            setShowVerificationModal(false);
            setVerificationError(null);
          }}
          requestId={selectedRequest.id}
          requesterName={selectedRequest.requesterName}
          requesterPhone={selectedRequest.requesterPhone}
          requestTitle={selectedRequest.title}
          location={selectedRequest.location}
          description={selectedRequest.description}
          onConfirm={handleVerifyConfirm}
          onReject={async () => {
            try {
              const authSession = getAuthSession();
              if (!authSession?.accessToken) {
                toastError("Không có token xác thực");
                return;
              }
              await rejectIncident(
                selectedRequest.id,
                { verified: false, note: "Đã xác minh là tín hiệu giả" },
                authSession.accessToken,
              );
              toastWarning(
                `Sự cố ${selectedRequest.incidentCode} đã bị đánh dấu là tín hiệu giả`,
              );
              setRequests((prev) =>
                prev.map((req) =>
                  req.id === selectedRequest.id
                    ? { ...req, status: "pending" as const }
                    : req,
                ),
              );
              setShowVerificationModal(false);
            } catch (error) {
              toastError(
                error instanceof Error
                  ? `Từ chối thất bại: ${error.message}`
                  : "Từ chối thất bại",
              );
            }
          }}
          isVerifying={isVerifying}
          error={verificationError}
          success={verificationSuccess}
        />
      )}

      {/* Dispatch Modal */}
      {selectedRequest && (
        <DispatchModal
          isOpen={showDispatchModal}
          onClose={() => setShowDispatchModal(false)}
          requestId={selectedRequest.id}
          requestTitle={selectedRequest.title}
          location={
            selectedIncidentDetail?.location?.addressText ||
            selectedRequest.location
          }
          victimCount={
            selectedIncidentDetail?.victimCountEstimate ??
            selectedRequest.victimCount
          }
          priorityCode={selectedIncidentDetail?.priority?.code}
          onDispatch={(teamId) => {
            console.log(
              `Dispatching team ${teamId} to request ${selectedRequest.id}`,
            );
            setRequests((prev) =>
              prev.map((req) =>
                req.id === selectedRequest.id
                  ? { ...req, status: "dispatched" as const }
                  : req,
              ),
            );
            toastSuccess(`Nhiệm vụ đã được điều phối cho đội ${teamId}.`);
          }}
        />
      )}

      {/* Assessment Modal */}
      {selectedRequest && (
        <SeverityAssessmentModal
          isOpen={showAssessmentModal}
          onClose={() => {
            setShowAssessmentModal(false);
            setAssessmentError(null);
          }}
          incidentId={selectedRequest.id}
          incidentCode={selectedRequest.title}
          onAssessed={(result) => handleAssessmentConfirm(selectedRequest.id)}
          accessToken={getAuthSession()?.accessToken || ""}
          isLoading={isAssessing}
        />
      )}
    </>
  );
};

export { RescueCoordinatorPage as RescueCoordinator };
