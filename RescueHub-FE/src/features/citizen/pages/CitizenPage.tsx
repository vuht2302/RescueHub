import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";
import {
  CalendarClock,
  History,
  LifeBuoy,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Phone,
  Search,
} from "lucide-react";
import {
  getPublicMapData,
  getPublicTrackingMyReliefRequests,
  getPublicTrackingMyRescues,
  type PublicTrackingMyHistoryItem,
} from "../../../shared/services/publicApi";
import { getAuthSession } from "../../auth/services/authStorage";
import { ReliefRequestModal } from "../../home/components/ReliefRequestModal";
import { RescueRequestModal } from "../../home/components/RescueRequestModal";

const TRACKING_TOKEN_STORAGE_KEY = "rescuehub.public.trackingToken";
const TRACKING_PHONE_STORAGE_KEY = "rescuehub.public.trackingPhone";

type CitizenHistoryItem = {
  id: string;
  trackingCode: string;
  title: string;
  description: string;
  location: string;
  createdAt: string;
  status: "pending" | "verified" | "completed";
  kind: "rescue" | "relief";
};

type Coordinate = {
  lat: number;
  lng: number;
};

type ReliefPoint = {
  id: string;
  title: string;
  addressText: string;
  lat: number;
  lng: number;
  statusName: string;
  markerType: string;
};

const DEFAULT_CENTER: Coordinate = {
  lat: 10.7769,
  lng: 106.7009,
};

const getDistanceKm = (from: Coordinate, to: Coordinate) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) *
      Math.cos(toRad(to.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

export const CitizenPage: React.FC = () => {
  const locationRouter = useLocation();
  const navigate = useNavigate();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<vietmapgl.Map | null>(null);
  const userMarkerRef = useRef<vietmapgl.Marker | null>(null);
  const reliefMarkersRef = useRef<vietmapgl.Marker[]>([]);

  const [isMapReady, setIsMapReady] = useState(false);
  const [mapPoints, setMapPoints] = useState<ReliefPoint[]>([]);
  const [isMapDataLoading, setIsMapDataLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<
    "locating" | "granted" | "denied" | "unsupported"
  >("locating");
  const [locationAccuracyMeters, setLocationAccuracyMeters] = useState<
    number | null
  >(null);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isReliefModalOpen, setIsReliefModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinate>(DEFAULT_CENTER);
  const [historyItems, setHistoryItems] = useState<CitizenHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");

  const vietmapApiKey = (import.meta.env.VITE_VIETMAP_API_KEY ?? "").trim();
  const canUseVietmap = vietmapApiKey.length > 0;

  const normalizeHistoryItem = (
    item: PublicTrackingMyHistoryItem,
    kind: "rescue" | "relief",
  ): CitizenHistoryItem => {
    const rawStatus = String(
      item.statusCode ?? item.statusName ?? "pending",
    ).toLowerCase();

    const status: CitizenHistoryItem["status"] =
      rawStatus.includes("complete") || rawStatus.includes("done")
        ? "completed"
        : rawStatus.includes("verify") || rawStatus.includes("approved")
          ? "verified"
          : "pending";

    const code = String(item.code ?? "").trim();
    const title = String(item.title ?? "").trim();
    const description = String(item.description ?? "").trim();
    const location = String(item.addressText ?? "").trim();
    const createdAt = String(item.createdAt ?? item.updatedAt ?? "").trim();
    const trackingCode = String(
      item.code ??
        (item as any).trackingCode ??
        (item as any).incidentCode ??
        (item as any).requestCode ??
        "",
    ).trim();

    return {
      id: String(item.id ?? code ?? `${kind}-${Math.random()}`),
      trackingCode,
      title:
        title || (kind === "rescue" ? "Yêu cầu cứu hộ" : "Yêu cầu cứu trợ"),
      description: description || "Không có mô tả.",
      location: location || "Chưa có địa chỉ",
      createdAt: createdAt || new Date().toISOString(),
      status,
      kind,
    };
  };

  useEffect(() => {
    const params = new URLSearchParams(locationRouter.search);
    setIsRequestModalOpen(params.get("request") === "1");
    setIsReliefModalOpen(params.get("relief") === "1");
  }, [locationRouter.search]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      setLocationAccuracyMeters(null);
      return;
    }

    setLocationStatus("locating");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationAccuracyMeters(
          Number.isFinite(position.coords.accuracy)
            ? Math.max(0, position.coords.accuracy)
            : null,
        );
        setLocationStatus("granted");
      },
      () => {
        setLocationAccuracyMeters(null);
        setLocationStatus("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 10000,
      },
    );
  }, []);

  useEffect(() => {
    if (!canUseVietmap || !mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new vietmapgl.Map({
      container: mapContainerRef.current,
      style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${vietmapApiKey}`,
      center: [userLocation.lng, userLocation.lat],
      zoom: 13,
      attributionControl: false,
    });

    mapRef.current = map;

    const onLoad = () => {
      setIsMapReady(true);
    };

    map.on("load", onLoad);

    return () => {
      map.off("load", onLoad);
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      reliefMarkersRef.current.forEach((marker) => marker.remove());
      reliefMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
      setIsMapReady(false);
    };
  }, [canUseVietmap, userLocation.lat, userLocation.lng, vietmapApiKey]);

  useEffect(() => {
    if (!canUseVietmap || !mapRef.current || !isMapReady) {
      return;
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    const marker = new vietmapgl.Marker({ color: "#2563eb" })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(
        new vietmapgl.Popup({ offset: 10 }).setText("Vị trí hiện tại của bạn"),
      )
      .addTo(mapRef.current);

    userMarkerRef.current = marker;

    mapRef.current.easeTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
      duration: 350,
      essential: true,
    });
  }, [canUseVietmap, isMapReady, userLocation.lat, userLocation.lng]);

  useEffect(() => {
    if (!canUseVietmap) {
      return;
    }

    const loadMapData = async () => {
      try {
        setIsMapDataLoading(true);
        const mapData = await getPublicMapData(
          userLocation.lat,
          userLocation.lng,
          50,
        );
        const markers = Array.isArray(mapData.markers) ? mapData.markers : [];

        const reliefPoints = markers
          .filter((marker) => {
            const markerType = String(marker.markerType ?? "").toUpperCase();
            return markerType.includes("RELIEF");
          })
          .map((marker) => ({
            id: String(marker.id ?? ""),
            title: String(marker.title ?? "Điểm cứu trợ"),
            addressText: String(
              marker.position?.addressText ??
                (marker as any).addressText ??
                "Chưa có địa chỉ",
            ),
            lat: Number(
              marker.position?.lat ??
                (marker as any).lat ??
                (marker as any).position?.latitude,
            ),
            lng: Number(
              marker.position?.lng ??
                (marker as any).lng ??
                (marker as any).position?.longitude,
            ),
            statusName: String(marker.status?.name ?? "Đang mở"),
            markerType: String(marker.markerType ?? "RELIEF_POINT"),
          }))
          .filter(
            (point) => Number.isFinite(point.lat) && Number.isFinite(point.lng),
          );

        setMapPoints(reliefPoints);
      } catch {
        setMapPoints([]);
      } finally {
        setIsMapDataLoading(false);
      }
    };

    void loadMapData();
  }, [canUseVietmap, userLocation.lat, userLocation.lng]);

  useEffect(() => {
    if (!canUseVietmap || !mapRef.current || !isMapReady) {
      return;
    }

    reliefMarkersRef.current.forEach((marker) => marker.remove());
    reliefMarkersRef.current = [];

    mapPoints.forEach((point) => {
      const distanceKm = getDistanceKm(userLocation, {
        lat: point.lat,
        lng: point.lng,
      });

      const marker = new vietmapgl.Marker({ color: "#f97316" })
        .setLngLat([point.lng, point.lat])
        .setPopup(
          new vietmapgl.Popup({ offset: 10 }).setHTML(
            `<strong>${point.title}</strong><br/>${point.addressText}<br/>Cách vị trí của bạn: ${distanceKm.toFixed(2)} km`,
          ),
        )
        .addTo(mapRef.current!);

      reliefMarkersRef.current.push(marker);
    });
  }, [canUseVietmap, isMapReady, mapPoints, userLocation]);

  useEffect(() => {
    const authSession = getAuthSession();
    const phone =
      authSession?.user.phone?.trim() ||
      (typeof window !== "undefined"
        ? localStorage.getItem(TRACKING_PHONE_STORAGE_KEY)?.trim()
        : "") ||
      "";
    const trackingToken =
      (typeof window !== "undefined"
        ? localStorage.getItem(TRACKING_TOKEN_STORAGE_KEY)?.trim()
        : "") || "";

    if (!phone) {
      setHistoryItems([]);
      return;
    }

    const loadHistory = async () => {
      try {
        setIsHistoryLoading(true);
        const [rescues, reliefs] = await Promise.all([
          getPublicTrackingMyRescues({
            phone,
            page: 1,
            pageSize: 20,
            trackingToken,
          }),
          getPublicTrackingMyReliefRequests({
            phone,
            page: 1,
            pageSize: 20,
            trackingToken,
          }),
        ]);

        const rescueItems = Array.isArray(rescues.items)
          ? rescues.items.map((item) => normalizeHistoryItem(item, "rescue"))
          : [];

        const reliefItems = Array.isArray(reliefs.items)
          ? reliefs.items.map((item) => normalizeHistoryItem(item, "relief"))
          : [];

        setHistoryItems(
          [...rescueItems, ...reliefItems].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );
      } catch {
        setHistoryItems([]);
      } finally {
        setIsHistoryLoading(false);
      }
    };

    void loadHistory();
  }, []);

  const formatDateTime = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [],
  );

  const closeRequestModal = () => {
    setIsRequestModalOpen(false);
    navigate("/citizen", { replace: true });
  };

  const closeReliefModal = () => {
    setIsReliefModalOpen(false);
    navigate("/citizen", { replace: true });
  };

  const handleLookupByCode = (rawCode: string) => {
    const normalizedCode = rawCode.trim();
    if (!normalizedCode) {
      return;
    }

    navigate(`/track?code=${encodeURIComponent(normalizedCode)}`);
  };

  const handleTrackingSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleLookupByCode(trackingInput);
  };

  const statusClassMap: Record<CitizenHistoryItem["status"], string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    verified: "bg-cyan-50 text-cyan-700 border-cyan-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const statusLabelMap: Record<CitizenHistoryItem["status"], string> = {
    pending: "Chờ xử lý",
    verified: "Đã xác minh",
    completed: "Hoàn tất",
  };

  const rescueHistoryItems = historyItems.filter(
    (item) => item.kind === "rescue",
  );

  const reliefHistoryItems = historyItems.filter(
    (item) => item.kind === "relief",
  );

  const nearestReliefPoint = useMemo(() => {
    if (mapPoints.length === 0) {
      return null;
    }

    return mapPoints
      .map((point) => ({
        point,
        distanceKm: getDistanceKm(userLocation, {
          lat: point.lat,
          lng: point.lng,
        }),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0];
  }, [mapPoints, userLocation]);

  return (
    <>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-[72vh] min-h-[520px] w-full bg-slate-100">
            {canUseVietmap ? (
              <div ref={mapContainerRef} className="h-full w-full" />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-600">
                Thiếu VITE_VIETMAP_API_KEY, chưa thể hiển thị bản đồ.
              </div>
            )}

            <div className="absolute right-4 top-4 z-10 w-[280px] max-w-[calc(100%-2rem)] space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
                <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-700">
                  <LocateFixed size={12} />
                  Vị trí hiện tại
                </p>
                <p className="mt-1 text-[22px] font-extrabold text-slate-900 leading-tight">
                  {userLocation.lat.toFixed(5)}°, {userLocation.lng.toFixed(5)}°
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {locationStatus === "granted" && "Đã định vị thiết bị"}
                  {locationStatus === "locating" &&
                    "Đang lấy vị trí của bạn..."}
                  {locationStatus === "denied" &&
                    "Bạn từ chối GPS, đang dùng vị trí mặc định"}
                  {locationStatus === "unsupported" &&
                    "Trình duyệt không hỗ trợ GPS"}
                </p>
                {locationStatus === "granted" &&
                  locationAccuracyMeters !== null && (
                    <p className="mt-0.5 text-xs text-slate-600">
                      Độ chính xác: ~
                      {locationAccuracyMeters < 1000
                        ? `${Math.round(locationAccuracyMeters)} m`
                        : `${(locationAccuracyMeters / 1000).toFixed(1)} km`}
                    </p>
                  )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-red-500">
                  <MapPin size={14} />
                  Điểm cứu trợ gần nhất
                </p>
                {nearestReliefPoint ? (
                  <>
                    <p className="mt-1 text-2xl font-extrabold text-slate-900">
                      {nearestReliefPoint.point.title}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {nearestReliefPoint.point.addressText}
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-700">
                      Cách bạn khoảng {nearestReliefPoint.distanceKm.toFixed(2)}{" "}
                      km
                    </p>
                    <span className="mt-3 inline-block rounded-xl bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                      {nearestReliefPoint.point.statusName}
                    </span>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">
                    {isMapDataLoading
                      ? "Đang tải điểm cứu trợ..."
                      : "Chưa có dữ liệu điểm cứu trợ"}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/citizen?request=1")}
              className="absolute bottom-8 left-1/2 z-10 h-24 w-24 -translate-x-1/2 rounded-full bg-red-600 text-3xl font-black text-white shadow-[0_16px_28px_rgba(220,38,38,0.4)] transition hover:scale-[1.03] active:scale-95"
            >
              SOS
            </button>

            <div className="absolute bottom-8 right-4 z-10 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => navigate("/track")}
                className="h-14 w-14 rounded-full bg-blue-950 text-white shadow-lg transition hover:bg-blue-900"
                title="Theo dõi"
              >
                <LifeBuoy size={22} className="mx-auto" />
              </button>
              <a
                href="tel:1900xxxx"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-blue-950 shadow-lg transition hover:bg-slate-100"
                title="Gọi hotline"
              >
                <Phone size={22} />
              </a>
            </div>

            <div className="absolute bottom-4 left-4 z-10 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-600 shadow-sm backdrop-blur">
              {isMapDataLoading
                ? "Đang tải marker cứu trợ..."
                : `Hiển thị ${mapPoints.length} điểm cứu trợ`}
              <p className="mt-1">Chỉ marker cứu trợ và vị trí hiện tại</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <form
            onSubmit={handleTrackingSubmit}
            className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]"
          >
            <label className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3">
              <Search size={18} className="text-slate-500" />
              <input
                value={trackingInput}
                onChange={(event) => setTrackingInput(event.target.value)}
                placeholder="Nhập mã theo dõi, ví dụ SC-20260416-001"
                className="w-full bg-transparent text-slate-800 outline-none"
              />
            </label>
            <button
              type="submit"
              className="h-12 rounded-xl bg-blue-950 px-6 text-base font-bold text-white transition hover:bg-blue-900"
            >
              Tra cứu
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <History size={18} className="text-blue-700" />
              Lịch sử hỗ trợ của bạn
            </h2>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
              <CalendarClock size={14} />
              Đồng bộ theo tài khoản đăng nhập
            </span>
          </div>

          {isHistoryLoading ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <LoaderCircle size={16} className="animate-spin" />
              Đang tải lịch sử...
            </div>
          ) : historyItems.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              Bạn chưa có lịch sử yêu cầu nào gần đây.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <article
                id="history-rescue"
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <h3 className="text-base font-bold text-slate-900">
                  Lịch sử cứu hộ
                </h3>
                <div className="mt-3 space-y-3">
                  {rescueHistoryItems.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-600">
                      Chưa có lịch sử cứu hộ.
                    </p>
                  ) : (
                    rescueHistoryItems.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-slate-900">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClassMap[item.status]}`}
                            >
                              {statusLabelMap[item.status]}
                            </span>
                            {item.trackingCode ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleLookupByCode(item.trackingCode)
                                }
                                className="rounded-md bg-blue-950 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-900"
                              >
                                Tra cứu
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {item.description}
                        </p>
                        {item.trackingCode ? (
                          <p className="mt-1 text-xs text-slate-500">
                            Mã theo dõi: {item.trackingCode}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} />
                            {item.location}
                          </span>
                          <span>
                            {formatDateTime.format(new Date(item.createdAt))}
                          </span>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </article>

              <article
                id="history-relief"
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <h3 className="text-base font-bold text-slate-900">
                  Lịch sử cứu trợ
                </h3>
                <div className="mt-3 space-y-3">
                  {reliefHistoryItems.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-600">
                      Chưa có lịch sử cứu trợ.
                    </p>
                  ) : (
                    reliefHistoryItems.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-slate-900">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClassMap[item.status]}`}
                            >
                              {statusLabelMap[item.status]}
                            </span>
                            {item.trackingCode ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleLookupByCode(item.trackingCode)
                                }
                                className="rounded-md bg-blue-950 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-900"
                              >
                                Tra cứu
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {item.description}
                        </p>
                        {item.trackingCode ? (
                          <p className="mt-1 text-xs text-slate-500">
                            Mã theo dõi: {item.trackingCode}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} />
                            {item.location}
                          </span>
                          <span>
                            {formatDateTime.format(new Date(item.createdAt))}
                          </span>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </article>
            </div>
          )}
        </section>
      </div>

      <RescueRequestModal
        isOpen={isRequestModalOpen}
        onClose={closeRequestModal}
        defaultLocation={userLocation}
      />

      <ReliefRequestModal
        isOpen={isReliefModalOpen}
        onClose={closeReliefModal}
      />
    </>
  );
};
