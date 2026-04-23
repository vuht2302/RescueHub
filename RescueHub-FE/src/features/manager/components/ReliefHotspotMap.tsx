import React, { useEffect, useRef, useState } from "react";
import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";
import {
  AlertTriangle,
  MapPin,
  TrendingUp,
  Clock,
  RefreshCw,
  Filter,
  Map,
  Building2,
  Plus,
  X,
  Trash2,
} from "lucide-react";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import { ConfirmationModal } from "../../../shared/components/ConfirmationModal";
import {
  getReliefHotspots,
  type ReliefHotspotItem,
} from "../../rescue-coordinator/services/incidentServices";
import {
  createManagerReliefPoint,
  deleteManagerReliefPoint,
  getReliefPointFormOptions,
  getManagerReliefPoints,
  type CreateReliefPointPayload,
  type ReliefPointAdminAreaOption,
  type ReliefPointCampaignOption,
  type ReliefPointItem,
  type ReliefPointStatusOption,
} from "../services/reliefPointService";
import {
  AddressAutocomplete,
  type AddressSuggestion,
} from "../../../shared/components/AddressAutocomplete";

interface ReliefHotspotMapProps {
  className?: string;
}

const DAYS_OPTIONS = [
  { value: 1, label: "1 ngày" },
  { value: 3, label: "3 ngày" },
  { value: 7, label: "7 ngày" },
  { value: 14, label: "14 ngày" },
  { value: 30, label: "30 ngày" },
];

const TOP_OPTIONS = [
  { value: 5, label: "Top 5" },
  { value: 10, label: "Top 10" },
  { value: 15, label: "Top 15" },
  { value: 20, label: "Top 20" },
];

type ViewMode = "hotspots" | "relief-points" | "both";

interface CreateReliefPointFormState {
  code: string;
  name: string;
  campaignId: string;
  adminAreaId: string;
  addressText: string;
  statusCode: string;
}

const buildInitialCreateForm = (): CreateReliefPointFormState => {
  return {
    code: "",
    name: "",
    campaignId: "",
    adminAreaId: "",
    addressText: "",
    statusCode: "OPEN",
  };
};

const ReliefHotspotMap: React.FC<ReliefHotspotMapProps> = ({
  className = "",
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<vietmapgl.Map | null>(null);
  const hotspotMarkersRef = useRef<vietmapgl.Marker[]>([]);
  const reliefPointMarkersRef = useRef<vietmapgl.Marker[]>([]);

  const [hotspots, setHotspots] = useState<ReliefHotspotItem[]>([]);
  const [reliefPoints, setReliefPoints] = useState<ReliefPointItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [days, setDays] = useState(7);
  const [top, setTop] = useState(10);
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [selectedHotspot, setSelectedHotspot] =
    useState<ReliefHotspotItem | null>(null);
  const [selectedReliefPoint, setSelectedReliefPoint] =
    useState<ReliefPointItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [campaignOptions, setCampaignOptions] = useState<
    ReliefPointCampaignOption[]
  >([]);
  const [adminAreaOptions, setAdminAreaOptions] = useState<
    ReliefPointAdminAreaOption[]
  >([]);
  const [statusOptions, setStatusOptions] = useState<ReliefPointStatusOption[]>(
    [],
  );
  const [selectedAddressSuggestion, setSelectedAddressSuggestion] =
    useState<AddressSuggestion | null>(null);
  const [isLoadingCreateOptions, setIsLoadingCreateOptions] = useState(false);
  const [createForm, setCreateForm] = useState<CreateReliefPointFormState>(() =>
    buildInitialCreateForm(),
  );

  const vietmapApiKey = (import.meta.env.VITE_VIETMAP_API_KEY ?? "").trim();
  const canUseVietmap = vietmapApiKey.length > 0;

  const fetchReliefPoints = React.useCallback(async () => {
    try {
      const authSession = getAuthSession();
      if (!authSession?.accessToken) {
        throw new Error("Không có token xác thực.");
      }

      const points = await getManagerReliefPoints(authSession.accessToken, "OPEN");
      setReliefPoints(points);
    } catch (err) {
      console.error("Lỗi khi tải điểm cứu trợ:", err);
    }
  }, []);

  const loadCreateOptions = React.useCallback(async () => {
    const authSession = getAuthSession();
    if (!authSession?.accessToken) return;

    setIsLoadingCreateOptions(true);
    try {
      const options = await getReliefPointFormOptions(authSession.accessToken);
      setCampaignOptions(options.campaigns);
      setAdminAreaOptions(options.adminAreas);
      setStatusOptions(options.statusCodes);

      setCreateForm((prev) => ({
        ...prev,
        campaignId: prev.campaignId || options.campaigns[0]?.id || "",
        adminAreaId: prev.adminAreaId || options.adminAreas[0]?.id || "",
        statusCode: prev.statusCode || options.statusCodes[0]?.code || "",
      }));
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Không thể tải dữ liệu danh mục cho form.",
      );
    } finally {
      setIsLoadingCreateOptions(false);
    }
  }, []);

  const handleCreateFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === "addressText") {
      setSelectedAddressSuggestion(null);
    }
    setCreateError(null);
  };

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    setCreateForm((prev) => ({
      ...prev,
      addressText: suggestion.address,
    }));
    setSelectedAddressSuggestion(suggestion);
    setCreateError(null);
  };

  const handleCreateReliefPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const authSession = getAuthSession();
    if (!authSession?.accessToken) {
      setCreateError("Không có token xác thực.");
      return;
    }

    const requiredFields = [
      createForm.code,
      createForm.name,
      createForm.campaignId,
      createForm.adminAreaId,
      createForm.addressText,
      createForm.statusCode,
    ];

    if (requiredFields.some((field) => field.trim().length === 0)) {
      setCreateError("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }

    if (!selectedAddressSuggestion) {
      setCreateError("Vui lòng chọn địa chỉ từ danh sách gợi ý.");
      return;
    }

    const payload: CreateReliefPointPayload = {
      code: createForm.code.trim(),
      name: createForm.name.trim(),
      campaignId: createForm.campaignId.trim(),
      adminAreaId: createForm.adminAreaId.trim(),
      addressText: createForm.addressText.trim(),
      location: {
        lat: selectedAddressSuggestion.lat,
        lng: selectedAddressSuggestion.lng,
      },
      managerUserId: authSession.user.id,
      statusCode: createForm.statusCode.trim(),
      opensAt: new Date().toISOString(),
      closesAt: null,
    };

    setIsCreating(true);
    try {
      await createManagerReliefPoint(authSession.accessToken, payload);
      await fetchReliefPoints();
      setViewMode("relief-points");
      setIsCreateModalOpen(false);
      setCreateForm(buildInitialCreateForm());
      setSelectedAddressSuggestion(null);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Không thể tạo điểm cứu trợ.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteReliefPoint = async () => {
    if (!selectedReliefPoint) return;

    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteReliefPoint = async () => {
    if (!selectedReliefPoint) return;

    setDeleteError(null);
    setIsDeleting(true);

    try {
      const authSession = getAuthSession();
      if (!authSession?.accessToken) {
        throw new Error("Không có token xác thực.");
      }

      await deleteManagerReliefPoint(authSession.accessToken, selectedReliefPoint.id);
      setSelectedReliefPoint(null);
      setIsDeleteConfirmOpen(false);
      await fetchReliefPoints();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Không thể xóa điểm cứu trợ.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchHotspots = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const authSession = getAuthSession();
      if (!authSession?.accessToken) {
        throw new Error("Không có token xác thực.");
      }

      const data = await getReliefHotspots(authSession.accessToken, {
        days,
        top,
      });
      setHotspots(data.items);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lỗi khi tải dữ liệu vùng cứu trợ",
      );
    } finally {
      setIsLoading(false);
    }
  }, [days, top]);

  useEffect(() => {
    void fetchHotspots();
    void fetchReliefPoints();
  }, [fetchHotspots, fetchReliefPoints]);

  useEffect(() => {
    if (!isCreateModalOpen) return;
    void loadCreateOptions();
  }, [isCreateModalOpen, loadCreateOptions]);

  useEffect(() => {
    if (viewMode === "hotspots") {
      setSelectedReliefPoint(null);
      return;
    }
    if (viewMode === "relief-points") {
      setSelectedHotspot(null);
    }
  }, [viewMode]);

  // Initialize Map
  useEffect(() => {
    if (!canUseVietmap || !mapContainerRef.current || mapRef.current) return;

    const map = new vietmapgl.Map({
      container: mapContainerRef.current,
      style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${vietmapApiKey}`,
      center: [105.767, 10.03],
      zoom: 11,
    });

    map.addControl(new vietmapgl.NavigationControl(), "top-right");
    mapRef.current = map;

    // Ensure map renders correctly as soon as the container gets its final size.
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      hotspotMarkersRef.current.forEach((m) => m.remove());
      reliefPointMarkersRef.current.forEach((m) => m.remove());
      hotspotMarkersRef.current = [];
      reliefPointMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [canUseVietmap, vietmapApiKey]);

  // Update hotspot markers on map
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    hotspotMarkersRef.current.forEach((m) => m.remove());
    hotspotMarkersRef.current = [];

    if (viewMode === "relief-points") return;

    hotspots.forEach((hotspot) => {
      if (!hotspot.center) return;

      const { lat, lng } = hotspot.center;
      const maxCount = hotspots.reduce(
        (max, h) => Math.max(max, h.requestCount),
        1,
      );
      const intensity = hotspot.requestCount / maxCount;

      const pendingRatio =
        hotspot.pendingCount / Math.max(hotspot.requestCount, 1);
      let markerColor = "#16a34a";
      if (pendingRatio > 0.5) markerColor = "#ea580c";
      if (pendingRatio > 0.8) markerColor = "#dc2626";
      if (hotspot.requestCount >= maxCount * 0.8) markerColor = "#dc2626";

      const baseSize = 28;
      const scaledSize = baseSize + Math.round(intensity * 24);

      const el = document.createElement("div");
      el.style.width = `${scaledSize}px`;
      el.style.height = `${scaledSize}px`;
      el.style.borderRadius = "50%";
      el.style.background = markerColor;
      el.style.border = "3px solid white";
      el.style.boxShadow = `0 2px 8px ${markerColor}80`;
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.cursor = "pointer";
      el.style.transition = "box-shadow 0.2s ease, filter 0.2s ease";
      el.style.zIndex = "2";

      const dot = document.createElement("div");
      dot.style.width = "10px";
      dot.style.height = "10px";
      dot.style.borderRadius = "50%";
      dot.style.background = "white";
      el.appendChild(dot);

      el.addEventListener("mouseenter", () => {
        el.style.filter = "brightness(1.08)";
        el.style.boxShadow = `0 3px 12px ${markerColor}99`;
        el.style.zIndex = "10";
      });
      el.addEventListener("mouseleave", () => {
        el.style.filter = "none";
        el.style.boxShadow = `0 2px 8px ${markerColor}80`;
        el.style.zIndex = "2";
      });

      const marker = new vietmapgl.Marker({ element: el, anchor: "center" })
        .setLngLat([lng, lat])
        .addTo(map);

      const popup = new vietmapgl.Popup({
        offset: 20,
        closeButton: false,
      }).setHTML(
        `<div style="font-family:sans-serif;padding:4px;min-width:160px">
          <strong style="font-size:13px;color:#1f2937">${hotspot.areaName}</strong><br/>
          <span style="font-size:12px;color:#6b7280">Yêu cầu: <b style="color:#dc2626">${hotspot.requestCount}</b></span><br/>
          <span style="font-size:12px;color:#6b7280">Chờ xử lý: <b>${hotspot.pendingCount}</b></span>
        </div>`,
      );
      marker.setPopup(popup);

      el.addEventListener("click", () => {
        setSelectedHotspot(hotspot);
        setSelectedReliefPoint(null);
        map.flyTo({
          center: [lng, lat],
          zoom: 13,
          essential: true,
          duration: 800,
        });
      });

      hotspotMarkersRef.current.push(marker);
    });

    if (viewMode === "hotspots" || viewMode === "both") {
      if (hotspots.length > 0 && hotspots.some((h) => h.center)) {
        const validHotspots = hotspots.filter((h) => h.center);
        if (validHotspots.length > 0) {
          const bounds = new vietmapgl.LngLatBounds();
          validHotspots.forEach((h) => {
            if (h.center) bounds.extend([h.center.lng, h.center.lat]);
          });
          map.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 800 });
        }
      }
    }
  }, [hotspots, viewMode]);

  // Update relief point markers on map
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    reliefPointMarkersRef.current.forEach((m) => m.remove());
    reliefPointMarkersRef.current = [];

    if (viewMode === "hotspots") return;

    reliefPoints.forEach((point) => {
      const { lat, lng } = point.location;

      const el = document.createElement("div");
      el.style.width = "36px";
      el.style.height = "36px";
      el.style.borderRadius = "50%";
      el.style.background = "#007399";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 2px 8px rgba(0,115,153,0.6)";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.cursor = "pointer";
      el.style.transition = "box-shadow 0.2s ease, filter 0.2s ease";
      el.style.zIndex = "1";

      const icon = document.createElement("span");
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
      el.appendChild(icon);

      el.addEventListener("mouseenter", () => {
        el.style.filter = "brightness(1.08)";
        el.style.boxShadow = "0 3px 12px rgba(0,115,153,0.7)";
        el.style.zIndex = "10";
      });
      el.addEventListener("mouseleave", () => {
        el.style.filter = "none";
        el.style.boxShadow = "0 2px 8px rgba(0,115,153,0.6)";
        el.style.zIndex = "1";
      });

      const marker = new vietmapgl.Marker({ element: el, anchor: "center" })
        .setLngLat([lng, lat])
        .addTo(map);

      const popup = new vietmapgl.Popup({
        offset: 20,
        closeButton: false,
      }).setHTML(
        `<div style="font-family:sans-serif;padding:4px;min-width:180px">
          <strong style="font-size:13px;color:#007399">${point.name}</strong><br/>
          <span style="font-size:11px;color:#6b7280">${point.addressText}</span><br/>
          <span style="font-size:11px;color:#6b7280">Chiến dịch: <b>${point.campaign.name}</b></span><br/>
          <span style="font-size:11px;color:#6b7280">Trạng thái: <b>${point.status.name}</b></span>
        </div>`,
      );
      marker.setPopup(popup);

      el.addEventListener("click", () => {
        setSelectedReliefPoint(point);
        setSelectedHotspot(null);
        map.flyTo({
          center: [lng, lat],
          zoom: 14,
          essential: true,
          duration: 800,
        });
      });

      reliefPointMarkersRef.current.push(marker);
    });

    if (viewMode === "relief-points" || viewMode === "both") {
      if (reliefPoints.length > 0) {
        const bounds = new vietmapgl.LngLatBounds();
        reliefPoints.forEach((p) => {
          bounds.extend([p.location.lng, p.location.lat]);
        });
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 800 });
        }
      }
    }
  }, [reliefPoints, viewMode]);

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "--";
    }
  };

  const getUrgencyColor = (hotspot: ReliefHotspotItem) => {
    const ratio = hotspot.pendingCount / Math.max(hotspot.requestCount, 1);
    if (ratio > 0.8 || hotspot.requestCount >= 3)
      return "text-red-600 bg-red-50";
    if (ratio > 0.5) return "text-orange-600 bg-orange-50";
    return "text-green-600 bg-green-50";
  };

  const totalPending = hotspots.reduce((sum, h) => sum + h.pendingCount, 0);
  const totalRequests = hotspots.reduce((sum, h) => sum + h.requestCount, 0);

  return (
    <div
      className={`flex flex-col md:flex-row w-full min-h-[680px] h-[72vh] md:h-[calc(100vh-140px)] ${className}`}
    >
      {/* MAP AREA */}
      <article className="relative rounded-2xl overflow-hidden bg-[#cfd4db] flex-1 min-h-[420px] h-full">
        {canUseVietmap ? (
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            aria-label="Bản đồ vùng cứu trợ"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <div className="rounded-xl bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 border border-slate-200 shadow-sm">
              Không có khóa API Vietmap, không thể tải bản đồ.
            </div>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-xl px-2 py-1.5 shadow-lg border border-white/70 z-10 flex items-center gap-1">
          <button
            onClick={() => setViewMode("hotspots")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === "hotspots"
                ? "bg-red-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <TrendingUp size={12} />
            Vùng nóng
          </button>
          <button
            onClick={() => setViewMode("relief-points")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === "relief-points"
                ? "bg-[#007399] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Building2 size={12} />
            Điểm cứu trợ
          </button>
          <button
            onClick={() => setViewMode("both")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === "both"
                ? "bg-blue-950 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Map size={12} />
            Cả hai
          </button>
        </div>

        {/* Stats Overlay - Top Left */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-white/70 z-10">
          <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-2 flex items-center gap-1.5">
            <MapPin size={12} className="text-blue-950" /> Tổng quan
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-lg font-black text-gray-900">
                {totalRequests}
              </p>
              <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide">
                Tổng yêu cầu
              </p>
            </div>
            <div>
              <p className="text-lg font-black text-red-600">{totalPending}</p>
              <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide">
                Chờ xử lý
              </p>
            </div>
            <div>
              <p className="text-lg font-black text-blue-600">
                {reliefPoints.length}
              </p>
              <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide">
                Điểm cứu trợ
              </p>
            </div>
            <div>
              <p className="text-lg font-black text-orange-600">
                {hotspots.length}
              </p>
              <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide">
                Vùng nóng
              </p>
            </div>
          </div>
        </div>

        {/* Selected Hotspot Info Overlay */}
        {selectedHotspot && selectedHotspot.center && (
          <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-white/70 max-w-xs z-10">
            <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant flex items-center gap-1.5 mb-1">
              <TrendingUp size={12} className="text-red-500" /> Vùng nóng
            </p>
            <p className="text-base font-black text-on-surface truncate">
              {selectedHotspot.areaName}
            </p>
            <p className="text-xs text-[#3f4650] mt-1">
              Mã khu vực:{" "}
              <span className="font-mono font-semibold">
                {selectedHotspot.areaCode}
              </span>
            </p>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="bg-red-50 rounded-lg py-1.5 px-1">
                <p className="text-lg font-black text-red-600">
                  {selectedHotspot.requestCount}
                </p>
                <p className="text-[9px] text-red-500 font-semibold uppercase tracking-wide">
                  Tổng
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg py-1.5 px-1">
                <p className="text-lg font-black text-orange-600">
                  {selectedHotspot.pendingCount}
                </p>
                <p className="text-[9px] text-orange-500 font-semibold uppercase tracking-wide">
                  Chờ
                </p>
              </div>
              <div className="bg-green-50 rounded-lg py-1.5 px-1">
                <p className="text-lg font-black text-green-600">
                  {selectedHotspot.fulfilledCount}
                </p>
                <p className="text-[9px] text-green-500 font-semibold uppercase tracking-wide">
                  Hoàn
                </p>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
              <Clock size={10} />
              Cập nhật: {formatTime(selectedHotspot.latestRequestedAt)}
            </p>
          </div>
        )}

        {/* Selected Relief Point Info Overlay */}
        {selectedReliefPoint && (
          <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-[#007399]/30 max-w-xs z-10">
            <div className="flex items-start justify-between">
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#007399] flex items-center gap-1.5 mb-1">
                <Building2 size={12} /> Điểm cứu trợ
              </p>
              <button
                onClick={handleDeleteReliefPoint}
                disabled={isDeleting}
                className="p-1 hover:bg-red-50 rounded transition-colors group"
                title="Xóa điểm cứu trợ"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                ) : (
                  <Trash2
                    size={14}
                    className="text-red-500 group-hover:text-red-700"
                  />
                )}
              </button>
            </div>
            <p className="text-base font-black text-on-surface truncate">
              {selectedReliefPoint.name}
            </p>
            <p className="text-xs text-[#3f4650] mt-1">
              Mã:{" "}
              <span className="font-mono font-semibold">
                {selectedReliefPoint.code}
              </span>
            </p>
            <p className="text-xs text-[#3f4650] mt-1">
              {selectedReliefPoint.addressText}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-600">
                {selectedReliefPoint.status.name}
              </span>
              <span className="text-[10px] text-gray-500">
                {selectedReliefPoint.campaign.name}
              </span>
            </div>
            {deleteError && (
              <p className="text-[10px] text-red-500 mt-1">{deleteError}</p>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-5 right-5 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2.5 shadow-md border border-white/70 z-10">
          <p className="text-[9px] uppercase tracking-widest font-bold text-gray-500 mb-2">
            Chú thích
          </p>
          <div className="flex flex-col gap-1.5">
            {viewMode !== "relief-points" && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm flex-shrink-0" />
                  <span className="text-xs text-gray-600 font-medium">
                    Vùng khẩn cấp (&gt;80% chờ)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow-sm flex-shrink-0" />
                  <span className="text-xs text-gray-600 font-medium">
                    Vùng trung bình (50-80% chờ)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm flex-shrink-0" />
                  <span className="text-xs text-gray-600 font-medium">
                    Vùng bình thường (&lt;50% chờ)
                  </span>
                </div>
              </>
            )}
            {viewMode !== "hotspots" && (
              <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-200">
                <div className="w-4 h-4 rounded-full bg-[#007399] border-2 border-white shadow-sm flex-shrink-0" />
                <span className="text-xs text-gray-600 font-medium">
                  Điểm cứu trợ
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-white/70 z-10">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-800 rounded-full animate-spin" />
              <span className="text-sm font-semibold text-gray-700">
                Đang tải...
              </span>
            </div>
          </div>
        )}
      </article>

      {/* SIDEBAR */}
      <aside className="h-full min-h-0 rounded-2xl bg-[#d7dce2] border border-[#c8ced6] flex flex-col overflow-hidden w-full md:w-[400px]">
        {/* Header + Stats - Fixed at top */}
        <div className="flex-shrink-0 p-4 border-b border-[#c8ced6]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase tracking-widest font-bold text-on-surface-variant font-primary">
              {viewMode === "hotspots"
                ? "Vùng cần cứu trợ"
                : viewMode === "relief-points"
                  ? "Điểm cứu trợ"
                  : "Vùng & Điểm cứu trợ"}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setCreateForm(buildInitialCreateForm());
                  setSelectedAddressSuggestion(null);
                  setCreateError(null);
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-[#007399] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-[#005f7d] transition-colors"
                title="Tạo điểm cứu trợ"
              >
                <Plus size={12} /> Thêm điểm
              </button>
              <button
                onClick={() => {
                  void fetchHotspots();
                  void fetchReliefPoints();
                }}
                className="p-1.5 rounded-lg hover:bg-white/60 transition-colors text-blue-950"
                title="Làm mới"
              >
                <RefreshCw
                  size={14}
                  className={isLoading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white rounded-xl p-3 shadow-sm border border-white">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">
                Tổng yêu cầu
              </p>
              <p className="text-xl font-black text-gray-900">
                {totalRequests}
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border border-white">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">
                Chờ xử lý
              </p>
              <p className="text-xl font-black text-red-600">{totalPending}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-white space-y-2.5">
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 flex items-center gap-1.5">
              <Filter size={10} /> Bộ lọc vùng nóng
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-gray-500 font-semibold block mb-1">
                  Thời gian
                </label>
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-400 bg-white"
                >
                  {DAYS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-gray-500 font-semibold block mb-1">
                  Hiển thị
                </label>
                <select
                  value={top}
                  onChange={(e) => setTop(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-400 bg-white"
                >
                  {TOP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex-shrink-0 mx-4 my-2 rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
            <AlertTriangle
              size={14}
              className="text-red-600 mt-0.5 flex-shrink-0"
            />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Tabs - Fixed below header, outside scroll */}
        <div className="flex-shrink-0 px-4 py-2 border-b border-[#c8ced6]">
          <div className="flex gap-1 bg-white rounded-lg p-1">
            <button
              onClick={() => setViewMode("hotspots")}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                viewMode === "hotspots"
                  ? "bg-red-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <TrendingUp size={12} />
              Vùng nóng ({hotspots.length})
            </button>
            <button
              onClick={() => setViewMode("relief-points")}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                viewMode === "relief-points"
                  ? "bg-[#007399] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Building2 size={12} />
              Điểm cứu trợ ({reliefPoints.length})
            </button>
          </div>
        </div>

        {/* Scrollable List Area */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3">
          {isLoading && hotspots.length === 0 ? (
            <div className="flex items-center justify-center p-6">
              <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-800 rounded-full animate-spin" />
            </div>
          ) : viewMode === "hotspots" ? (
            <div className="space-y-2.5">
              {hotspots.map((hotspot, idx) => {
                const isSelected =
                  selectedHotspot?.areaCode === hotspot.areaCode;
                const urgencyClass = getUrgencyColor(hotspot);

                return (
                  <div
                    key={`${hotspot.areaCode}-${idx}`}
                    onClick={() => {
                      setSelectedHotspot(hotspot);
                      setSelectedReliefPoint(null);
                      if (mapRef.current && hotspot.center) {
                        mapRef.current.flyTo({
                          center: [hotspot.center.lng, hotspot.center.lat],
                          zoom: 13,
                          essential: true,
                          duration: 800,
                        });
                      }
                    }}
                    className={`rounded-xl p-3 cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-white border-red-400 shadow-sm"
                        : "bg-[#e7ebef] border-[#d4dbe3] hover:border-red-300"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            isSelected
                              ? "bg-red-500 text-white"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          <TrendingUp size={13} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1f2329]">
                            {hotspot.areaName}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            {hotspot.areaCode}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${urgencyClass}`}
                      >
                        {hotspot.pendingCount} chờ
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      <div className="bg-white rounded-md py-1 px-1 text-center shadow-sm">
                        <p className="text-xs font-black text-gray-800">
                          {hotspot.requestCount}
                        </p>
                        <p className="text-[9px] text-gray-400 uppercase">
                          Tổng
                        </p>
                      </div>
                      <div className="bg-white rounded-md py-1 px-1 text-center shadow-sm">
                        <p className="text-xs font-black text-orange-600">
                          {hotspot.pendingCount}
                        </p>
                        <p className="text-[9px] text-gray-400 uppercase">
                          Chờ
                        </p>
                      </div>
                      <div className="bg-white rounded-md py-1 px-1 text-center shadow-sm">
                        <p className="text-xs font-black text-green-600">
                          {hotspot.fulfilledCount}
                        </p>
                        <p className="text-[9px] text-gray-400 uppercase">
                          Hoàn
                        </p>
                      </div>
                      <div className="bg-white rounded-md py-1 px-1 text-center shadow-sm">
                        <p className="text-xs font-black text-gray-500">
                          {hotspot.rejectedCount}
                        </p>
                        <p className="text-[9px] text-gray-400 uppercase">
                          Từ chối
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : viewMode === "relief-points" ? (
            <div className="space-y-2.5">
              {reliefPoints.map((point) => {
                const isSelected = selectedReliefPoint?.id === point.id;

                return (
                  <div
                    key={point.id}
                    onClick={() => {
                      setSelectedReliefPoint(point);
                      setSelectedHotspot(null);
                      if (mapRef.current) {
                        mapRef.current.flyTo({
                          center: [point.location.lng, point.location.lat],
                          zoom: 14,
                          essential: true,
                          duration: 800,
                        });
                      }
                    }}
                    className={`rounded-xl p-3 cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-white border-[#007399] shadow-sm"
                        : "bg-[#e7ebef] border-[#d4dbe3]"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            isSelected
                              ? "bg-[#007399] text-white"
                              : "bg-blue-100 text-[#007399]"
                          }`}
                        >
                          <Building2 size={13} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1f2329]">
                            {point.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            {point.code}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-green-100 text-green-600">
                        {point.status.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {point.addressText}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-red-600 mb-2">
                  Vùng nóng ({hotspots.length})
                </p>
                <div className="space-y-2">
                  {hotspots.map((hotspot, idx) => {
                    const isSelected =
                      selectedHotspot?.areaCode === hotspot.areaCode;

                    return (
                      <div
                        key={`${hotspot.areaCode}-${idx}`}
                        onClick={() => {
                          setSelectedHotspot(hotspot);
                          setSelectedReliefPoint(null);
                          if (mapRef.current && hotspot.center) {
                            mapRef.current.flyTo({
                              center: [hotspot.center.lng, hotspot.center.lat],
                              zoom: 13,
                              essential: true,
                              duration: 800,
                            });
                          }
                        }}
                        className={`rounded-xl p-2 cursor-pointer border ${
                          isSelected
                            ? "bg-white border-red-400 shadow-sm"
                            : "bg-[#e7ebef] border-[#d4dbe3]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                isSelected
                                  ? "bg-red-500 text-white"
                                  : "bg-red-100 text-red-600"
                              }`}
                            >
                              <TrendingUp size={11} />
                            </div>
                            <p className="text-sm font-bold text-[#1f2329]">
                              {hotspot.areaName}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-orange-600">
                            {hotspot.pendingCount} chờ
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-[#007399] mb-2">
                  Điểm cứu trợ ({reliefPoints.length})
                </p>
                <div className="space-y-2">
                  {reliefPoints.map((point) => {
                    const isSelected = selectedReliefPoint?.id === point.id;

                    return (
                      <div
                        key={point.id}
                        onClick={() => {
                          setSelectedReliefPoint(point);
                          setSelectedHotspot(null);
                          if (mapRef.current) {
                            mapRef.current.flyTo({
                              center: [point.location.lng, point.location.lat],
                              zoom: 14,
                              essential: true,
                              duration: 800,
                            });
                          }
                        }}
                        className={`rounded-xl p-2 cursor-pointer border ${
                          isSelected
                            ? "bg-white border-[#007399] shadow-sm"
                            : "bg-[#e7ebef] border-[#d4dbe3]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                isSelected
                                  ? "bg-[#007399] text-white"
                                  : "bg-blue-100 text-[#007399]"
                              }`}
                            >
                              <Building2 size={11} />
                            </div>
                            <p className="text-sm font-bold text-[#1f2329]">
                              {point.name}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-green-600">
                            {point.status.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h4 className="text-base font-black text-slate-900">
                Tạo điểm cứu trợ mới
              </h4>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateError(null);
                }}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                disabled={isCreating}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateReliefPoint} className="px-5 py-4">
              {isLoadingCreateOptions && (
                <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                  Đang tải dữ liệu danh mục...
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  name="code"
                  value={createForm.code}
                  onChange={handleCreateFormChange}
                  placeholder="Mã điểm cứu trợ"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  disabled={isCreating}
                />
                <input
                  name="name"
                  value={createForm.name}
                  onChange={handleCreateFormChange}
                  placeholder="Tên điểm cứu trợ"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  disabled={isCreating}
                />
                <select
                  name="campaignId"
                  value={createForm.campaignId}
                  onChange={handleCreateFormChange}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  disabled={isCreating}
                >
                  <option value="">Chọn campaign</option>
                  {campaignOptions.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.code} - {campaign.name}
                    </option>
                  ))}
                </select>
                <select
                  name="adminAreaId"
                  value={createForm.adminAreaId}
                  onChange={handleCreateFormChange}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  disabled={isCreating}
                >
                  <option value="">Chọn khu vực hành chính</option>
                  {adminAreaOptions.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.code ? `${area.code} - ` : ""}
                      {area.name}
                    </option>
                  ))}
                </select>
                <select
                  name="statusCode"
                  value={createForm.statusCode}
                  onChange={handleCreateFormChange}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  disabled={isCreating}
                >
                  <option value="">Chọn trạng thái</option>
                  {statusOptions.map((status) => (
                    <option key={status.code} value={status.code}>
                      {status.name}
                      {/* ({status.code}) */}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3">
                <AddressAutocomplete
                  value={createForm.addressText}
                  onChange={(address) => {
                    setCreateForm((prev) => ({
                      ...prev,
                      addressText: address,
                    }));
                    setSelectedAddressSuggestion(null);
                  }}
                  onSelect={handleAddressSelect}
                  placeholder="Nhập địa chỉ để tìm kiếm và chọn..."
                  disabled={isCreating}
                />
                {selectedAddressSuggestion && (
                  <p className="mt-1 text-[10px] font-semibold text-green-600">
                    Tọa độ tự động: {selectedAddressSuggestion.lat.toFixed(5)},{" "}
                    {selectedAddressSuggestion.lng.toFixed(5)}
                  </p>
                )}
              </div>

              {createError && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {createError}
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreateError(null);
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  disabled={isCreating}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#007399] px-4 py-2 text-sm font-semibold text-white hover:bg-[#005f7d] disabled:opacity-60"
                  disabled={isCreating}
                >
                  {isCreating ? "Đang tạo..." : "Tạo điểm cứu trợ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {selectedReliefPoint && (
        <ConfirmationModal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={confirmDeleteReliefPoint}
          title="Xóa điểm cứu trợ"
          message={`Bạn có chắc chắn muốn xóa điểm cứu trợ "${selectedReliefPoint.name}" không? Hành động này không thể hoàn tác.`}
          confirmText="Xóa"
          cancelText="Hủy"
        />
      )}
    </div>
  );
};

export { ReliefHotspotMap };
