import React, { useEffect, useState, useCallback } from "react";
import {
  Package,
  MapPin,
  User,
  Phone,
  CheckCircle,
  Search,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Calendar,
  Home,
  FileText,
  AlertCircle,
  Edit3,
} from "lucide-react";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import { toast } from "react-toastify";
import {
  getReliefRequests,
  getReliefRequestDetail,
  type ReliefRequestItem,
  type ReliefRequestDetail,
} from "../../rescue-coordinator/services/incidentServices";
import {
  approveReliefRequest,
  type ApproveReliefRequestPayload,
  getAllItems,
  type ItemListItem,
  getDistributions,
  getDistribution,
  getManagerTeams,
  updateDistribution,
  type DistributionListItem,
  type Distribution,
  type DistributionPayload,
  type PagedResponse,
  type ManagerTeam,
} from "../services/warehouseService";
import {
  REQUEST_STATUS,
  DIST_STATUS,
  StatusBadge,
} from "../constants/statusConfig";
import { DistributionDetailModal } from "../components/DistributionDetailModal";
import { CreateReliefDistributionModal } from "../components/CreateReliefDistributionModal";
import { ReliefCampaignTab } from "../components/ReliefDistributionPage/TabReliefCampaign/ReliefCampaignTab";

export const ReliefDistributionPage: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState<
    "campaigns" | "requests" | "distributions"
  >("campaigns");

  // Relief Requests state
  const [reliefRequests, setReliefRequests] = useState<ReliefRequestItem[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestSearch, setRequestSearch] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const [requestDetail, setRequestDetail] =
    useState<ReliefRequestDetail | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Distributions state
  const [distributions, setDistributions] = useState<DistributionListItem[]>(
    [],
  );
  const [isLoadingDist, setIsLoadingDist] = useState(false);
  const [viewDistId, setViewDistId] = useState<string | null>(null);
  const [viewDistDetail, setViewDistDetail] = useState<Distribution | null>(
    null,
  );
  const [editDistId, setEditDistId] = useState<string | null>(null);
  const [editTeams, setEditTeams] = useState<ManagerTeam[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [showReliefDistModal, setShowReliefDistModal] = useState(false);
  const [initialCampaignIdForDist, setInitialCampaignIdForDist] = useState<
    string | undefined
  >();
  const [distPage, setDistPage] = useState(1);
  const [distTotalPages, setDistTotalPages] = useState(1);

  // Load Campaigns
  const loadCampaigns = useCallback(async () => {
    // Campaigns are loaded inside ReliefCampaignTab component
  }, []);

  // Load Relief Requests
  const loadReliefRequests = useCallback(async () => {
    setIsLoadingRequests(true);
    try {
      const data = await getReliefRequests(getAuthSession()?.accessToken ?? "");
      setReliefRequests(data.items);
    } catch (e) {
      console.error("Error:", e);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  // Load Distributions
  const loadDistributions = useCallback(async (page = 1) => {
    setIsLoadingDist(true);
    try {
      const res = await getDistributions(getAuthSession()?.accessToken ?? "");
      if (Array.isArray(res)) {
        setDistributions(res);
      } else if (res && "items" in res) {
        setDistributions(
          (res as PagedResponse<DistributionListItem>).items ?? [],
        );
        setDistTotalPages(
          (res as PagedResponse<DistributionListItem>).totalPages ?? 1,
        );
      } else {
        setDistributions([]);
      }
      setDistPage(page);
    } catch (e) {
      console.error("Error loading distributions:", e);
    } finally {
      setIsLoadingDist(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "campaigns") void loadCampaigns();
    else if (activeTab === "requests") void loadReliefRequests();
    else if (activeTab === "distributions") void loadDistributions(distPage);
  }, [
    activeTab,
    distPage,
    loadReliefRequests,
    loadDistributions,
    loadCampaigns,
  ]);

  // Filter relief requests
  const filteredRequests = reliefRequests.filter((r) => {
    const matchSearch =
      r.requestCode.toLowerCase().includes(requestSearch.toLowerCase()) ||
      r.requester.name.toLowerCase().includes(requestSearch.toLowerCase()) ||
      r.requester.phone.includes(requestSearch);
    const matchStatus = !requestStatus || r.status.code === requestStatus;
    return matchSearch && matchStatus;
  });

  // Handle click on request - show modal
  const handleSelectRequest = async (request: ReliefRequestItem) => {
    setSelectedRequestId(request.reliefRequestId);
    try {
      const detail = await getReliefRequestDetail(
        request.reliefRequestId,
        getAuthSession()?.accessToken ?? "",
      );
      setRequestDetail(detail);
    } catch (e) {
      console.error(e);
      setRequestDetail(null);
    }
  };

  // Handle distribution created
  const handleDistributionCreated = (dist: any) => {
    setShowCreateModal(false);
    setSelectedRequestId(null);
    setRequestDetail(null);
    setActiveTab("distributions");
    void loadDistributions();
  };

  // Handle relief distribution created
  const handleReliefDistributionCreated = (dist: {
    id: string;
    code: string;
  }) => {
    setShowReliefDistModal(false);
    void loadDistributions();
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl">
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === "requests" ? "text-blue-950 border-b-2 border-blue-950" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
        >
          <ClipboardCheck size={16} className="inline mr-2" />
          Yêu cầu
        </button>
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === "campaigns" ? "text-blue-950 border-b-2 border-blue-950" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
        >
          <Calendar size={16} className="inline mr-2" />
          Chiến dịch
        </button>
        <button
          onClick={() => setActiveTab("distributions")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === "distributions" ? "text-blue-950 border-b-2 border-blue-950" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
        >
          <Package size={16} className="inline mr-2" />
          Phân phối
        </button>
      </div>

      {/* Content - Full width */}
      <div className="flex-1 overflow-hidden bg-gray-50 rounded-b-xl">
        {/* RELIEF CAMPAIGNS */}
        {activeTab === "campaigns" && (
          <ReliefCampaignTab
            onCreateDistribution={(campaignId) => {
              setInitialCampaignIdForDist(campaignId);
              setShowReliefDistModal(true);
              setActiveTab("distributions");
            }}
          />
        )}

        {/* RELIEF REQUESTS */}
        {activeTab === "requests" && (
          <div className="h-full flex flex-col">
            {/* Search & Filter */}
            <div className="p-4 bg-white border-b border-gray-100 space-y-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Tìm mã, tên, SĐT..."
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <select
                value={requestStatus}
                onChange={(e) => setRequestStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="NEW">Mới</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="REJECTED">Từ chối</option>
                <option value="FULFILLED">Đã cứu trợ</option>
              </select>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {isLoadingRequests ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-800 rounded-full animate-spin" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardCheck size={32} className="text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">
                    Không có yêu cầu cứu trợ
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                      <th className="px-4 py-3">Mã yêu cầu</th>
                      <th className="px-4 py-3">Người yêu cầu</th>
                      <th className="px-4 py-3">Số hộ</th>
                      <th className="px-4 py-3">Địa chỉ</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRequests.map((req) => (
                      <tr
                        key={req.reliefRequestId}
                        onClick={() => void handleSelectRequest(req)}
                        className={`cursor-pointer transition-colors hover:bg-blue-50 ${
                          selectedRequestId === req.reliefRequestId
                            ? "bg-blue-50"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-blue-700 font-mono">
                            {req.requestCode}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-700 truncate">
                              {req.requester.name}
                            </p>
                            <p className="text-[11px] text-gray-400 flex items-center gap-1">
                              <Phone size={10} />
                              {req.requester.phone}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-xs font-semibold">
                            {req.householdCount} hộ
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-sm text-gray-600 truncate max-w-[200px]">
                            <MapPin size={12} />
                            {req.addressText}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            code={req.status.code}
                            statusMap={REQUEST_STATUS}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleSelectRequest(req);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <FileText size={12} />
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* DISTRIBUTIONS - Full width */}
        {activeTab === "distributions" && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 bg-white border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 font-semibold">
                  {distributions.length} phiếu phân phối
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {isLoadingDist ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-800 rounded-full animate-spin" />
                </div>
              ) : distributions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package size={32} className="text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">
                    Chưa có phiếu phân phối nào
                  </p>
                </div>
              ) : (
                <>
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                        <th className="px-4 py-3 text-center">Mã phiếu</th>
                        <th className="px-4 py-3 text-center">Đội cứu trợ</th>
                        <th className="px-4 py-3 text-center">Khu vực</th>
                        <th className="px-4 py-3 text-center">Trạng thái</th>
                        <th className="px-4 py-3 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {distributions.map((dist) => (
                        <tr
                          key={dist.id}
                          onClick={() => setViewDistId(dist.id)}
                          className="cursor-pointer transition-colors hover:bg-blue-50"
                        >
                          <td className="px-4 py-3 text-center">
                            <p className="text-sm font-bold text-blue-700 font-mono">
                              {dist.code}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <p className="text-sm font-semibold text-gray-700 truncate">
                              {dist.recipient?.name || "—"}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="flex items-center justify-center gap-1 text-sm text-gray-600">
                              <MapPin size={12} />
                              {dist.adminArea?.name || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge
                              code={dist.status?.code ?? ""}
                              statusMap={DIST_STATUS}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {(dist.status?.code === "CANCELLED" ||
                                dist.status?.code === "CANCEL") && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log(
                                      "Edit clicked for dist:",
                                      dist.id,
                                      "Status:",
                                      dist.status?.code,
                                    );
                                    setEditDistId(dist.id);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-orange-100 text-orange-600"
                                  title="Sửa phiếu đã hủy"
                                >
                                  <Edit3 size={14} />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewDistId(dist.id);
                                }}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-colors"
                              >
                                <FileText size={12} />
                                Chi tiết
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {distTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 py-3 border-t bg-white">
                      <button
                        disabled={distPage <= 1}
                        onClick={() => void loadDistributions(distPage - 1)}
                        className="px-3 py-1 rounded border text-xs disabled:opacity-40 hover:bg-gray-50"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-xs text-gray-500">
                        Trang {distPage}/{distTotalPages}
                      </span>
                      <button
                        disabled={distPage >= distTotalPages}
                        onClick={() => void loadDistributions(distPage + 1)}
                        className="px-3 py-1 rounded border text-xs disabled:opacity-40 hover:bg-gray-50"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {requestDetail && (
        <ReliefRequestDetailModal
          detail={requestDetail}
          onClose={() => {
            setRequestDetail(null);
            setSelectedRequestId(null);
          }}
          onApproveSuccess={loadReliefRequests}
        />
      )}
      {viewDistId && (
        <DistributionDetailModal
          distId={viewDistId}
          onClose={() => {
            setViewDistId(null);
            setViewDistDetail(null);
          }}
          onAckSuccess={() => {
            void loadDistributions();
          }}
        />
      )}
      {showReliefDistModal && (
        <CreateReliefDistributionModal
          initialCampaignId={initialCampaignIdForDist}
          onClose={() => {
            setShowReliefDistModal(false);
            setInitialCampaignIdForDist(undefined);
          }}
          onSuccess={handleReliefDistributionCreated}
        />
      )}
      {editDistId && (
        <EditCancelledDistModal
          distId={editDistId}
          onClose={() => {
            setEditDistId(null);
          }}
          onSuccess={() => {
            void loadDistributions();
            setEditDistId(null);
          }}
        />
      )}
    </div>
  );
};

// Relief Request Detail Modal
interface ReliefRequestDetailModalProps {
  detail: ReliefRequestDetail;
  onClose: () => void;
  onApproveSuccess?: () => void;
}

function ReliefRequestDetailModal({
  detail,
  onClose,
  onApproveSuccess,
}: ReliefRequestDetailModalProps) {
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [approvalNote, setApprovalNote] = useState("");
  const [approvedItems, setApprovedItems] = useState<
    Record<string, { approvedQty: number; unitCode: string }>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for added items from warehouse
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addedItems, setAddedItems] = useState<
    Array<{
      itemId: string;
      itemName: string;
      itemCode: string;
      qty: number;
      unitCode: string;
    }>
  >([]);

  const token = getAuthSession()?.accessToken ?? "";

  // Initialize approved quantities from detail
  useEffect(() => {
    if (detail.requestedItems) {
      const initial: Record<string, { approvedQty: number; unitCode: string }> =
        {};
      detail.requestedItems.forEach((item) => {
        initial[item.reliefRequestItemId] = {
          approvedQty: item.defaultApprovedQty ?? item.requestedQty,
          unitCode: item.unitCode,
        };
      });
      setApprovedItems(initial);
      setAddedItems([]);
    }
  }, [detail]);

  const handleApprove = async () => {
    // Build items from requestedItems - dùng supportTypeCode (itemCode)
    const existingItems = detail.requestedItems
      .map((item) => ({
        supportTypeCode: item.supportTypeCode, // Là itemCode như "AO-PHAO", "MI-GOI"
        approvedQty:
          approvedItems[item.reliefRequestItemId]?.approvedQty ??
          item.requestedQty ??
          1,
        unitCode:
          approvedItems[item.reliefRequestItemId]?.unitCode ?? item.unitCode,
      }))
      .filter((item) => item.approvedQty > 0);

    // Build items from added items (new items from warehouse)
    const newItems = addedItems
      .filter((item) => item.qty > 0)
      .map((item) => ({
        supportTypeCode: item.itemCode, // Dùng itemCode
        approvedQty: item.qty,
        unitCode: item.unitCode,
      }));

    const allItems = [...existingItems, ...newItems];

    if (allItems.length === 0) {
      setError(
        "Vui lòng nhập số lượng phê duyệt lớn hơn 0 cho ít nhất 1 vật phẩm",
      );
      return;
    }

    const payload: ApproveReliefRequestPayload = {
      note: approvalNote,
      items: allItems,
    };

    console.log("Approval payload:", JSON.stringify(payload, null, 2));

    try {
      setIsSubmitting(true);
      setError(null);
      await approveReliefRequest(detail.reliefRequestId, payload, token);
      setShowApproveForm(false);
      onApproveSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canApprove =
    detail.status?.code === "PENDING" || detail.status?.code === "NEW";
  const isApproved = detail.status?.code === "APPROVED";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-start justify-between flex-shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900">
                  {detail.requestCode}
                </h2>
                <span
                  className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold ${
                    isApproved
                      ? "bg-green-100 text-green-700"
                      : canApprove
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <CheckCircle size={10} />
                  {REQUEST_STATUS[detail.status?.code || ""]?.label ||
                    (canApprove ? "Chờ duyệt" : detail.status?.code)}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Nguồn: {detail.sourceTypeCode}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-5">
              {/* Người yêu cầu */}
              <section>
                <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3 flex items-center gap-1.5">
                  <User size={12} /> Người yêu cầu
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Họ tên</span>
                    <span className="text-sm font-bold">
                      {detail.requester.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">SĐT</span>
                    <span className="text-sm font-bold text-blue-600">
                      {detail.requester.phone}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Số hộ</span>
                    <span className="text-sm font-bold">
                      {detail.householdCount}
                    </span>
                  </div>
                </div>
              </section>

              {/* Địa chỉ */}
              <section>
                <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3 flex items-center gap-1.5">
                  <MapPin size={12} /> Địa chỉ
                </h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-semibold">{detail.addressText}</p>
                </div>
              </section>

              {/* Chiến dịch */}
              {detail.campaign && (
                <section>
                  <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3 flex items-center gap-1.5">
                    <FileText size={12} /> Chiến dịch
                  </h3>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm font-bold text-blue-700">
                      {detail.campaign.name}
                    </p>
                    <p className="text-xs text-blue-500 font-mono">
                      {detail.campaign.code}
                    </p>
                  </div>
                </section>
              )}

              {/* Vật phẩm */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 flex items-center gap-1.5">
                    <Package size={12} />{" "}
                    {showApproveForm ? "Số lượng duyệt" : "Vật phẩm được duyệt"}
                  </h3>
                  {showApproveForm && canApprove && (
                    <button
                      onClick={() => setShowAddItemModal(true)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                      <Plus size={14} />
                      Thêm vật phẩm
                    </button>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left font-bold text-gray-500">
                          Vật phẩm
                        </th>
                        <th className="px-3 py-2 text-center font-bold text-gray-500">
                          SL duyệt
                        </th>
                        <th className="px-3 py-2 text-center font-bold text-gray-500">
                          ĐV
                        </th>
                        {showApproveForm && (
                          <th className="px-3 py-2 w-10"></th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.requestedItems.map((item) => (
                        <tr
                          key={item.reliefRequestItemId}
                          className="border-t border-gray-100"
                        >
                          <td className="px-4 py-2.5 font-semibold">
                            {item.supportTypeName}
                          </td>
                          {showApproveForm ? (
                            <>
                              <td className="px-3 py-2.5 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  value={
                                    approvedItems[item.reliefRequestItemId]
                                      ?.approvedQty ?? 0
                                  }
                                  onChange={(e) =>
                                    setApprovedItems((prev) => ({
                                      ...prev,
                                      [item.reliefRequestItemId]: {
                                        ...prev[item.reliefRequestItemId],
                                        approvedQty:
                                          parseInt(e.target.value) || 0,
                                      },
                                    }))
                                  }
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:border-blue-400"
                                />
                              </td>
                              <td className="px-3 py-2.5 text-center text-gray-500">
                                {item.unitCode}
                              </td>
                              <td className="px-3 py-2.5"></td>
                            </>
                          ) : (
                            <>
                              <td className="px-3 py-2.5 text-center text-green-700 font-bold">
                                {approvedItems[item.reliefRequestItemId]
                                  ?.approvedQty ??
                                  item.requestedQty ??
                                  0}
                              </td>
                              <td className="px-3 py-2.5 text-center text-gray-500">
                                {item.unitCode}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                      {/* Added items from warehouse */}
                      {addedItems.map((item, idx) => (
                        <tr
                          key={`added-${idx}`}
                          className="border-t border-blue-200 bg-blue-50"
                        >
                          <td className="px-4 py-2.5 font-semibold text-blue-700">
                            {item.itemName}
                            <span className="ml-2 text-[10px] font-normal text-blue-500">
                              ({item.itemCode})
                            </span>
                          </td>
                          {showApproveForm ? (
                            <>
                              <td className="px-3 py-2.5 text-center">
                                <input
                                  type="number"
                                  min={1}
                                  value={item.qty}
                                  onChange={(e) => {
                                    const newItems = [...addedItems];
                                    newItems[idx].qty =
                                      parseInt(e.target.value) || 0;
                                    setAddedItems(newItems);
                                  }}
                                  className="w-16 px-2 py-1 border border-blue-300 rounded text-center text-sm focus:outline-none focus:border-blue-400"
                                />
                              </td>
                              <td className="px-3 py-2.5 text-center text-gray-500">
                                {item.unitCode}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <button
                                  onClick={() => {
                                    const newItems = [...addedItems];
                                    newItems.splice(idx, 1);
                                    setAddedItems(newItems);
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Xóa"
                                >
                                  <X size={14} />
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-3 py-2.5 text-center text-blue-700 font-bold">
                                {item.qty}
                              </td>
                              <td className="px-3 py-2.5 text-center text-gray-500">
                                {item.unitCode}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {addedItems.length === 0 &&
                    detail.requestedItems.length === 0 && (
                      <div className="py-8 text-center text-gray-400 text-sm">
                        Chưa có vật phẩm nào
                      </div>
                    )}
                </div>
              </section>

              {/* Approval Form */}
              {showApproveForm && (
                <section>
                  <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3 flex items-center gap-1.5">
                    <FileText size={12} /> Ghi chú phê duyệt
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Ghi chú
                      </label>
                      <textarea
                        value={approvalNote}
                        onChange={(e) => setApprovalNote(e.target.value)}
                        rows={3}
                        placeholder="Nhập ghi chú phê duyệt (không bắt buộc)"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={16} className="text-red-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800">Lỗi</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex-shrink-0 flex gap-3">
            {showApproveForm ? (
              <>
                <button
                  onClick={() => setShowApproveForm(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-sm text-gray-600 hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 font-semibold text-sm text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Đang xử lý..." : "Xác nhận duyệt"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-sm text-gray-600 hover:bg-gray-100"
                >
                  Đóng
                </button>
                {canApprove && (
                  <button
                    onClick={() => setShowApproveForm(true)}
                    className="flex-1 py-2.5 rounded-xl bg-green-600 font-semibold text-sm text-white hover:bg-green-700"
                  >
                    Phê duyệt
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <AddItemModal
          onClose={() => setShowAddItemModal(false)}
          onAddItem={(item) => {
            // Check if item already exists in added items
            const exists = addedItems.some((i) => i.itemId === item.itemId);
            if (!exists) {
              setAddedItems([...addedItems, item]);
            }
            setShowAddItemModal(false);
          }}
          existingItemIds={[
            ...detail.requestedItems.map((i) => i.supportTypeCode),
            ...addedItems.map((i) => i.itemId),
          ]}
        />
      )}
    </>
  );
}

// Add Item Modal Component
interface AddItemModalProps {
  onClose: () => void;
  onAddItem: (item: {
    itemId: string;
    itemName: string;
    itemCode: string;
    qty: number;
    unitCode: string;
  }) => void;
  existingItemIds: string[];
}

// Item for modal display (normalized from API)
interface ItemDisplay {
  id: string;
  itemCode: string;
  itemName: string;
  unitCode: string;
  categoryName: string;
}

function AddItemModal({
  onClose,
  onAddItem,
  existingItemIds,
}: AddItemModalProps) {
  const [items, setItems] = useState<ItemDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<ItemDisplay | null>(null);
  const [qty, setQty] = useState(1);
  const token = getAuthSession()?.accessToken ?? "";

  useEffect(() => {
    const loadItems = async () => {
      try {
        const data = await getAllItems(token);
        console.log("Items loaded:", data);
        // Normalize data to display format
        const displayItems: ItemDisplay[] = data
          .filter((item) => item.isActive)
          .map((item) => ({
            id: item.id,
            itemCode: item.itemCode,
            itemName: item.itemName,
            unitCode: item.unitCode,
            categoryName: item.itemCategory?.name ?? "",
          }));
        console.log("Display items before filter:", displayItems);
        console.log("Existing item codes:", existingItemIds);
        // Filter out items that already exist in the request
        const filtered = displayItems.filter(
          (item) => !existingItemIds.includes(item.itemCode),
        );
        console.log("Filtered items:", filtered);
        setItems(filtered);
      } catch (err) {
        console.error("Error loading items:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    void loadItems();
  }, [token, existingItemIds]);

  const filteredItems = items.filter(
    (item) =>
      item.itemName.toLowerCase().includes(search.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = () => {
    if (selectedItem && qty > 0) {
      onAddItem({
        itemId: selectedItem.id,
        itemName: selectedItem.itemName,
        itemCode: selectedItem.itemCode,
        qty: qty,
        unitCode: selectedItem.unitCode,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900">Thêm vật phẩm</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Tìm kiếm vật phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Items List */}
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-800 rounded-full animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                Không có vật phẩm nào
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${
                    selectedItem?.id === item.id
                      ? "bg-blue-50 border-l-4 border-l-blue-800"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {item.itemName}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {item.itemCode} • {item.categoryName}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {item.unitCode}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quantity Input */}
          {selectedItem && (
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-gray-600">
                Số lượng:
              </label>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              />
              <span className="text-sm text-gray-500">
                {selectedItem.unitCode}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedItem || qty <= 0}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Thêm vật phẩm
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Cancelled Distribution Modal - allows changing team and resetting to PENDING
interface EditCancelledDistModalProps {
  distId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function EditCancelledDistModal({
  distId,
  onClose,
  onSuccess,
}: EditCancelledDistModalProps) {
  const [dist, setDist] = useState<Distribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [teams, setTeams] = useState<ManagerTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const data = await getDistribution(
          distId,
          getAuthSession()?.accessToken ?? "",
        );
        setDist(data);
        if (data.recipient?.id) {
          setSelectedTeamId(data.recipient.id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không thể tải phiếu");
      } finally {
        setLoading(false);
      }
    })();
  }, [distId]);

  // Load available teams
  useEffect(() => {
    void (async () => {
      try {
        const teamItems = await getManagerTeams(
          getAuthSession()?.accessToken ?? "",
          {
            statusCode: "AVAILABLE",
          },
        );
        setTeams(teamItems);
      } catch (e) {
        console.error("Error loading teams:", e);
      } finally {
        setLoadingTeams(false);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!selectedTeamId) {
      setError("Vui lòng chọn đội cứu trợ");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // Call update API to change team - backend will reset status to PENDING for cancelled distributions
      await updateDistribution(
        distId,
        {
          teamId: selectedTeamId,
        },
        getAuthSession()?.accessToken ?? "",
      );
      toast.success(
        "Đã cập nhật phiếu phân phối và chuyển sang trạng thái Chờ nhận!",
      );
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi cập nhật");
    } finally {
      setSubmitting(false);
    }
  };

  // Map teams to display format
  const teamOptions = teams.map((t) => ({
    id: t.id,
    name: t.teamName ?? t.name ?? "Đội cứu trợ",
    code: t.teamCode ?? "",
  }));

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-orange-600">
              Sửa phiếu đã hủy
            </h2>
            <p className="text-xs text-gray-400 font-mono">
              {dist?.code || "..."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {loading && (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-800 rounded-full animate-spin mx-auto" />
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {!loading && (
            <>
              {/* Current info */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Trạng thái hiện tại:</span>
                  <span className="font-semibold text-red-600">
                    {dist?.status?.code || "CANCELLED"}
                  </span>
                </div>
              </div>

              {/* Team selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chọn đội cứu trợ <span className="text-red-500">*</span>
                </label>
                {loadingTeams ? (
                  <div className="flex items-center justify-center py-3">
                    <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-800 rounded-full animate-spin" />
                    <span className="ml-2 text-sm text-gray-500">
                      Đang tải đội cứu trợ...
                    </span>
                  </div>
                ) : teamOptions.length === 0 ? (
                  <div className="text-sm text-orange-600 py-2">
                    Không có đội cứu trợ nào đang rảnh. Vui lòng tạo hoặc giải
                    phóng đội cứu trợ.
                  </div>
                ) : (
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                  >
                    <option value="">-- Chọn đội cứu trợ --</option>
                    {teamOptions.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Info text */}
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                Sau khi lưu, phiếu sẽ được chuyển sang trạng thái{" "}
                <strong>Chờ nhận (PENDING)</strong> để đội cứu trợ có thể xác
                nhận.
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-sm text-gray-600 hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedTeamId}
            className="flex-1 py-2.5 rounded-xl bg-orange-600 font-semibold text-sm text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
