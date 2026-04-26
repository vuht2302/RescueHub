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
} from "lucide-react";
import { getAuthSession } from "../../../features/auth/services/authStorage";
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
  type DistributionListItem,
  type Distribution,
  type PagedResponse,
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

  // Format recipient name helper
  const getRecipientName = (dist: DistributionListItem) =>
    dist.recipient?.name || "—";

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
            {/* Search */}
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

            {/* List */}
            <div className="flex-1 overflow-y-auto">
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
                filteredRequests.map((req) => (
                  <div
                    key={req.reliefRequestId}
                    onClick={() => void handleSelectRequest(req)}
                    className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition-all hover:bg-blue-50 ${selectedRequestId === req.reliefRequestId ? "bg-blue-50 border-l-4 border-l-blue-800" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold truncate">
                          {req.requestCode}
                        </h3>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1">
                          <User size={10} />
                          {req.requester.name}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${REQUEST_STATUS[req.status.code]?.cls || "bg-gray-100 text-gray-600"}`}
                      >
                        {REQUEST_STATUS[req.status.code]?.label ||
                          req.status.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      <span>
                        <Phone size={10} className="inline mr-1" />
                        {req.requester.phone}
                      </span>
                      <span>
                        <Home size={10} className="inline mr-1" />
                        {req.householdCount} hộ
                      </span>
                    </div>
                  </div>
                ))
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

            {/* List */}
            <div className="flex-1 overflow-y-auto">
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
                  {distributions.map((dist) => (
                    <div
                      key={dist.id}
                      onClick={() => setViewDistId(dist.id)}
                      className="px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold font-mono text-blue-700">
                            {dist.code}
                          </h3>
                          <p className="text-[11px] text-gray-400">
                            {getRecipientName(dist)}
                          </p>
                        </div>
                        <StatusBadge
                          code={dist.status?.code ?? ""}
                          statusMap={DIST_STATUS}
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                        <span>
                          <MapPin size={10} className="inline" />{" "}
                          {dist.adminArea?.name || "—"}
                        </span>
                        <span>•</span>
                        <span>{dist.lineCount} dòng</span>
                      </div>
                    </div>
                  ))}
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
    // Build items from requestedItems
    const existingItems = detail.requestedItems
      .map((item) => ({
        reliefRequestItemId: item.reliefRequestItemId,
        supportTypeCode: item.supportTypeCode ?? "",
        approvedQty: approvedItems[item.reliefRequestItemId]?.approvedQty ?? 0,
        unitCode:
          approvedItems[item.reliefRequestItemId]?.unitCode ?? item.unitCode,
      }))
      .filter((item) => item.approvedQty > 0);

    // Build items from added items (new items from warehouse)
    const newItems = addedItems
      .filter((item) => item.qty > 0)
      .map((item) => ({
        reliefRequestItemId: "",
        itemId: item.itemId,
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
      decisionCode: "APPROVE",
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
                          SL yêu cầu
                        </th>
                        {showApproveForm && (
                          <th className="px-3 py-2 text-center font-bold text-gray-500">
                            SL duyệt
                          </th>
                        )}
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
                          <td className="px-3 py-2.5 text-center text-gray-600">
                            {item.requestedQty}
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
                                {item.defaultApprovedQty || item.requestedQty}
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
                          <td className="px-3 py-2.5 text-center text-gray-400">
                            —
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

function AddItemModal({
  onClose,
  onAddItem,
  existingItemIds,
}: AddItemModalProps) {
  const [items, setItems] = useState<ItemListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<ItemListItem | null>(null);
  const [qty, setQty] = useState(1);
  const token = getAuthSession()?.accessToken ?? "";

  useEffect(() => {
    const loadItems = async () => {
      try {
        const data = await getAllItems(token);
        // Filter out items already in the request
        const availableItems = data.filter(
          (item) => !existingItemIds.includes(item.itemCode) && item.isActive,
        );
        setItems(availableItems);
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
                        {item.itemCode} • {item.itemCategory.name}
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
