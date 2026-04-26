import React, { useEffect, useState } from "react";
import {
  Package,
  Phone,
  MapPin,
  User,
  Clock,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Home,
  RefreshCw,
  FileText,
  Send,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import {
  getReliefRequests,
  getReliefRequestDetail,
  standardizeReliefRequest,
  rejectReliefRequest,
  type ReliefRequestItem,
  type ReliefRequestDetail,
} from "../services/incidentServices";
import { toastSuccess, toastError } from "../../../shared/utils/toast";

interface ReliefRequestsPageProps {
  className?: string;
}

const ReliefRequestsPage: React.FC<ReliefRequestsPageProps> = ({ className = "" }) => {
  const [requests, setRequests] = useState<ReliefRequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ReliefRequestItem | null>(null);
  const [detail, setDetail] = useState<ReliefRequestDetail | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [standardizeNote, setStandardizeNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvedQuantities, setApprovedQuantities] = useState<Record<string, number>>({});
  const [editHouseholdCount, setEditHouseholdCount] = useState(1);
  const [editAddressText, setEditAddressText] = useState("");

  const fetchRequests = React.useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const authSession = getAuthSession();
      if (!authSession?.accessToken) throw new Error("Không có token xác thực.");
      const data = await getReliefRequests(authSession.accessToken);
      setRequests(data.items);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Lỗi khi tải danh sách");
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    const loadDetail = async () => {
      if (!selectedRequest) {
        setDetail(null);
        setDetailError(null);
        setApprovedQuantities({});
        setStandardizeNote("");
        setEditHouseholdCount(1);
        setEditAddressText("");
        return;
      }
      setIsLoadingDetail(true);
      setDetailError(null);
      try {
        const authSession = getAuthSession();
        if (!authSession?.accessToken) throw new Error("Không có token xác thực.");
        const data = await getReliefRequestDetail(selectedRequest.reliefRequestId, authSession.accessToken);
        setDetail(data);
        // Initialize editable fields
        setEditHouseholdCount(data.householdCount);
        setEditAddressText(data.addressText === "UNKNOWN" ? "" : data.addressText);
        // Initialize approved quantities from defaultApprovedQty
        const initQtys: Record<string, number> = {};
        data.requestedItems.forEach((item) => {
          initQtys[item.reliefRequestItemId] = item.defaultApprovedQty ?? item.requestedQty;
        });
        setApprovedQuantities(initQtys);
      } catch (err) {
        setDetailError(err instanceof Error ? err.message : "Lỗi khi tải chi tiết");
      } finally {
        setIsLoadingDetail(false);
      }
    };
    void loadDetail();
  }, [selectedRequest]);

  const filteredRequests = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    return requests.filter((r) => {
      const matchesSearch =
        r.requestCode.toLowerCase().includes(q) ||
        r.requester.name.toLowerCase().includes(q) ||
        r.requester.phone.includes(q) ||
        r.addressText.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || r.status.code === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  const getStatusConfig = (code: string) => {
    switch (code) {
      case "NEW":
        return { label: "Mới", color: "bg-blue-100 text-blue-700", icon: AlertCircle };
      case "PENDING":
        return { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-700", icon: Clock };
      case "APPROVED":
        return { label: "Đã duyệt", color: "bg-green-100 text-green-700", icon: CheckCircle };
      case "REJECTED":
        return { label: "Từ chối", color: "bg-red-100 text-red-700", icon: XCircle };
      case "FULFILLED":
        return { label: "Đã cứu trợ", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle };
      default:
        return { label: code, color: "bg-gray-100 text-gray-600", icon: AlertCircle };
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "--";
    }
  };

  const handleStandardize = async () => {
    if (!detail) return;
    if (!detail.requestedItems || detail.requestedItems.length === 0) {
      toastError("Yêu cầu cứu trợ này không có vật phẩm nào để chuẩn hoá.");
      return;
    }
    // Validate: at least one item must have approvedQty > 0
    const hasApprovedItem = detail.requestedItems.some(
      (item) => (approvedQuantities[item.reliefRequestItemId] ?? item.defaultApprovedQty) > 0
    );
    if (!hasApprovedItem) {
      toastError("Phải có ít nhất 1 vật phẩm được duyệt số lượng > 0.");
      return;
    }
    setIsSubmitting(true);
    try {
      const authSession = getAuthSession();
      if (!authSession?.accessToken) throw new Error("Không có token xác thực.");
      const requestedItems = detail.requestedItems.map((item) => ({
        reliefRequestItemId: item.reliefRequestItemId,
        supportTypeCode: item.supportTypeCode,
        requestedQty: item.requestedQty,
        approvedQty: approvedQuantities[item.reliefRequestItemId] ?? item.defaultApprovedQty,
      }));
      await standardizeReliefRequest(detail.reliefRequestId, {
        decisionCode: "APPROVE",
        householdCount: editHouseholdCount,
        addressText: editAddressText || detail.addressText,
        requestedItems,
        note: standardizeNote,
      }, authSession.accessToken);
      toastSuccess(`Đã chuẩn hoá yêu cầu ${detail.requestCode}`);
      void fetchRequests();
      setSelectedRequest(null);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Chuẩn hoá thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!detail) return;
    if (!rejectReason.trim()) {
      toastError("Vui lòng nhập lý do từ chối.");
      return;
    }
    setIsSubmitting(true);
    try {
      const authSession = getAuthSession();
      if (!authSession?.accessToken) throw new Error("Không có token xác thực.");
      await rejectReliefRequest(detail.reliefRequestId, { reason: rejectReason }, authSession.accessToken);
      toastSuccess(`Đã từ chối yêu cầu ${detail.requestCode}`);
      setShowRejectModal(false);
      void fetchRequests();
      setSelectedRequest(null);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Từ chối thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex h-full gap-5 ${className}`}>
      {/* LEFT: Request List */}
      <div className="flex flex-col w-full max-w-[440px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* List Header */}
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-black text-gray-900">Danh sách yêu cầu cứu trợ</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {filteredRequests.length} / {requests.length} yêu cầu
              </p>
            </div>
            <button
              onClick={() => void fetchRequests()}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-blue-950 transition-colors"
              title="Làm mới"
            >
              <RefreshCw size={14} className={isLoadingList ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-2.5">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm mã, tên, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:border-blue-400 placeholder-gray-300"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-400 bg-white"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="NEW">Mới</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
            <option value="FULFILLED">Đã cứu trợ</option>
          </select>
        </div>

        {/* List Items */}
        <div className="flex-1 overflow-y-auto">
          {listError && (
            <div className="mx-4 mt-4 rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">{listError}</p>
            </div>
          )}

          {isLoadingList && requests.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-800 rounded-full animate-spin" />
            </div>
          )}

          {!isLoadingList && !listError && requests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <Package size={32} className="text-gray-300 mb-2" />
              <p className="text-sm text-gray-500 font-medium">Chưa có yêu cầu cứu trợ nào</p>
            </div>
          )}

          {filteredRequests.map((req) => {
            const statusConfig = getStatusConfig(req.status.code);
            const StatusIcon = statusConfig.icon;
            const isSelected = selectedRequest?.reliefRequestId === req.reliefRequestId;
            return (
              <div
                key={req.reliefRequestId}
                onClick={() => setSelectedRequest(req)}
                className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition-all hover:bg-blue-50 ${
                  isSelected ? "bg-blue-50 border-l-3 border-l-blue-800" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{req.requestCode}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <User size={10} />{req.requester.name}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${statusConfig.color}`}>
                    <StatusIcon size={9} />
                    {statusConfig.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Phone size={10} />{req.requester.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Home size={10} />{req.householdCount} hộ
                  </span>
                </div>

                {req.addressText && req.addressText !== "UNKNOWN" && (
                  <p className="text-[10px] text-gray-400 mt-1 flex items-start gap-1 truncate">
                    <MapPin size={9} className="mt-0.5 flex-shrink-0" />
                    {req.addressText}
                  </p>
                )}

                {req.campaign && (
                  <p className="text-[10px] text-blue-600 font-semibold mt-1.5 bg-blue-50 px-2 py-0.5 rounded-md inline-block truncate max-w-full">
                    {req.campaign.name}
                  </p>
                )}

                <p className="text-[10px] text-gray-300 mt-1.5">
                  <Clock size={9} className="inline mr-1" />
                  {formatDate(req.requestedAt)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Detail Panel */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {!selectedRequest ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FileText size={28} className="text-gray-300" />
            </div>
            <p className="text-base font-bold text-gray-400">Chưa chọn yêu cầu cứu trợ</p>
            <p className="text-xs text-gray-300 mt-1">Chọn một yêu cầu từ danh sách bên trái để xem chi tiết</p>
          </div>
        ) : (
          <>
            {/* Detail Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-gray-900">{selectedRequest.requestCode}</h2>
                    {(() => {
                      const sc = getStatusConfig(selectedRequest.status.code);
                      return (
                        <span className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold ${sc.color}`}>
                          <sc.icon size={10} />
                          {sc.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Nguồn: {selectedRequest.sourceTypeCode}</p>
                </div>
                <button
                  onClick={() => void fetchRequests()}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Làm mới"
                >
                  <RefreshCw size={14} className={isLoadingDetail ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-2 mb-4">
                  <AlertCircle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{detailError}</p>
                </div>
              )}

              {isLoadingDetail && !detail && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-800 rounded-full animate-spin" />
                </div>
              )}

              {detail && (
                <div className="space-y-5">
                  {/* Requester Info */}
                  <section>
                    <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3 flex items-center gap-1.5">
                      <User size={12} /> Thông tin người yêu cầu
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Họ tên</span>
                        <span className="text-sm font-bold text-gray-900">{detail.requester.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Số điện thoại</span>
                        <a href={`tel:${detail.requester.phone}`} className="text-sm font-bold text-blue-600 hover:underline">
                          {detail.requester.phone}
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Số hộ gia đình</span>
                        <input
                          type="number"
                          min={1}
                          max={999}
                          value={editHouseholdCount}
                          onChange={(e) => setEditHouseholdCount(Number(e.target.value))}
                          className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-900 focus:outline-none focus:border-blue-400 bg-white"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Address & Note */}
                  <section>
                    <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3 flex items-center gap-1.5">
                      <MapPin size={12} /> Địa chỉ & Ghi chú
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Địa chỉ</span>
                        <input
                          type="text"
                          value={editAddressText}
                          onChange={(e) => setEditAddressText(e.target.value)}
                          placeholder="Nhập địa chỉ..."
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-blue-400 bg-white placeholder-gray-300"
                        />
                      </div>
                      {detail.note && (
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">Ghi chú</span>
                          <p className="text-sm font-semibold text-gray-900 bg-yellow-50 rounded-lg px-3 py-2 border border-yellow-100">
                            {detail.note}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Incident & Campaign */}
                  {(detail.incident || detail.campaign) && (
                    <section>
                      <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3 flex items-center gap-1.5">
                        <FileText size={12} /> Sự cố & Chiến dịch
                      </h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        {detail.incident && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Sự cố</span>
                              <span className="text-xs font-bold text-gray-900 bg-gray-200 px-2 py-0.5 rounded-md font-mono">
                                {detail.incident.code}
                              </span>
                            </div>
                            {detail.incident.description && (
                              <div>
                                <span className="text-xs text-gray-500 block mb-1">Mô tả sự cố</span>
                                <p className="text-xs text-gray-700 bg-white rounded-lg px-3 py-2 border border-gray-100 leading-relaxed">
                                  {detail.incident.description}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                        {detail.campaign && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Chiến dịch</span>
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                              {detail.campaign.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Requested Items */}
                  <section>
                    <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3 flex items-center gap-1.5">
                      <Package size={12} /> Vật phẩm yêu cầu
                    </h3>
                    {detail.requestedItems.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Không có vật phẩm nào được yêu cầu</p>
                    ) : (
                      <div className="bg-gray-50 rounded-xl overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="text-left px-4 py-2 font-bold text-gray-500">Vật phẩm</th>
                              <th className="text-center px-3 py-2 font-bold text-gray-500">SL yêu cầu</th>
                              <th className="text-center px-3 py-2 font-bold text-gray-500">SL duyệt</th>
                              <th className="text-center px-3 py-2 font-bold text-gray-500">Đơn vị</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.requestedItems.map((item) => (
                              <tr key={item.reliefRequestItemId} className="border-t border-gray-100">
                                <td className="px-4 py-2.5 font-semibold text-gray-800">{item.supportTypeName}</td>
                                <td className="text-center px-3 py-2.5 text-gray-600">{item.requestedQty}</td>
                                <td className="text-center px-3 py-2.5">
                                  <input
                                    type="number"
                                    min={0}
                                    max={item.requestedQty * 10}
                                    value={approvedQuantities[item.reliefRequestItemId] ?? item.defaultApprovedQty}
                                    onChange={(e) =>
                                      setApprovedQuantities((prev) => ({
                                        ...prev,
                                        [item.reliefRequestItemId]: Number(e.target.value),
                                      }))
                                    }
                                    className="w-14 text-center border border-gray-200 rounded-lg px-1 py-1 text-xs font-bold text-green-700 focus:outline-none focus:border-green-400 bg-white"
                                  />
                                </td>
                                <td className="text-center px-3 py-2.5 text-gray-500">{item.unitCode}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Timeline */}
                  <section>
                    <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3 flex items-center gap-1.5">
                      <Clock size={12} /> Timeline
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Thời gian yêu cầu</span>
                        <span className="text-xs font-bold text-gray-900">{formatDate(detail.requestedAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Cập nhật cuối</span>
                        <span className="text-xs font-bold text-gray-900">{formatDate(detail.updatedAt)}</span>
                      </div>
                    </div>
                  </section>

                  {/* Standardize Action */}
                  {detail.decisionOptions.length > 0 && (
                    <section>
                      <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3 flex items-center gap-1.5">
                        <Send size={12} /> Hành động
                      </h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                        {/* Standardize Note */}
                        <div>
                          <label className="text-xs text-gray-500 font-semibold block mb-2">
                            <MessageSquare size={10} className="inline mr-1" />
                            Ghi chú chuẩn hoá
                          </label>
                          <textarea
                            value={standardizeNote}
                            onChange={(e) => setStandardizeNote(e.target.value)}
                            placeholder="Nhập ghi chú chuẩn hoá (không bắt buộc)..."
                            rows={2}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-blue-400 bg-white resize-none placeholder-gray-300"
                          />
                        </div>

                        <div className="flex gap-3">
                          {detail.decisionOptions.some((o) => o.code === "APPROVE") && (
                            <button
                              onClick={() => void handleStandardize()}
                              disabled={isSubmitting || !detail.requestedItems?.length}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-green-600 text-white hover:bg-green-700 shadow-sm transition-all disabled:opacity-60"
                              title={!detail.requestedItems?.length ? "Không có vật phẩm nào để chuẩn hoá" : undefined}
                            >
                              {isSubmitting ? (
                                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                              ) : (
                                <CheckCircle size={15} />
                              )}
                              Chuẩn hoá
                            </button>
                          )}
                          {detail.decisionOptions.some((o) => o.code === "REJECT") && (
                            <button
                              onClick={() => setShowRejectModal(true)}
                              disabled={isSubmitting}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-60"
                            >
                              <XCircle size={15} />
                              Từ chối
                            </button>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Reject Modal */}
                  {showRejectModal && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center gap-2">
                          <AlertTriangle size={18} className="text-red-600" />
                          <h3 className="text-base font-black text-red-700">Từ chối yêu cầu cứu trợ</h3>
                        </div>
                        <div className="p-6">
                          <label className="text-xs text-gray-500 font-semibold block mb-2">
                            Lý do từ chối <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Nhập lý do từ chối yêu cầu..."
                            rows={3}
                            autoFocus
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-red-400 bg-white resize-none placeholder-gray-300"
                          />
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                          <button
                            onClick={() => {
                              setShowRejectModal(false);
                              setRejectReason("");
                            }}
                            disabled={isSubmitting}
                            className="px-5 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-60"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => void handleReject()}
                            disabled={isSubmitting}
                            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-60"
                          >
                            {isSubmitting ? (
                              <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            ) : (
                              <XCircle size={14} />
                            )}
                            Xác nhận từ chối
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export { ReliefRequestsPage };
