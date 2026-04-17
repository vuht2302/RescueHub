import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";
import { LifeBuoy, LocateFixed, MapPin, Phone, Siren } from "lucide-react";
import { ConfirmationModal } from "../../../shared/components/ConfirmationModal";
import {
  createPublicSos,
  getPublicBootstrap,
  getPublicMapData,
  getPublicAlerts,
  type PublicAlertItem,
} from "../../../shared/services/publicApi";
import { RescueRequestModal } from "../components/RescueRequestModal";
import { ReliefRequestModal } from "../components/ReliefRequestModal";
import { SyncModal } from "../components/SyncModal";
import {
  getUnsyncedRequests,
  syncRequests,
  type UnsyncedRequest,
} from "../services/syncService";
import { getAuthSession } from "../../../features/auth/services/authStorage";

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
  statusColor: string;
};

type MapPoint = ReliefPoint & {
  markerType: string;
};

const DEFAULT_CENTER: Coordinate = {
  lat: 10.7769,
  lng: 106.7009,
};

const DEFAULT_HOTLINE = "1900xxxx";

// Tính khoảng cách giữa 2 tọa độ theo đường chim bay, trả về kết quả bằng km
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

const getEventTypeLabel = (eventType: string): string => {
  const eventTypeMap: { [key: string]: string } = {
    INCIDENT: "Sự cố",
    ALERT: "Cảnh báo",
    WARNING: "Cảnh báo",
    EMERGENCY: "Khẩn cấp",
    SOS: "SOS",
    FLOOD: "Lũ lụt",
    WEATHER: "Thời tiết",
    RESCUE: "Cứu hộ",
  };
  return eventTypeMap[eventType] || eventType;
};

const getMarkerTypeLabel = (markerType: string): string => {
  const markerTypeMap: Record<string, string> = {
    RELIEF_POINT: "Điểm cứu trợ",
    INCIDENT_HOTSPOT: "Điểm sự cố",
    SHELTER: "Nơi trú ẩn",
  };

  return markerTypeMap[markerType] ?? markerType;
};

const getMarkerColor = (markerType: string): string => {
  const markerColorMap: Record<string, string> = {
    RELIEF_POINT: "#f97316", // Điểm cứu trợ
    INCIDENT_HOTSPOT: "#ef4444", // Điểm sự cố - cứu hộ
  };

  return markerColorMap[markerType] ?? "#64748b"; // Màu mặc định cho loại marker không xác định
};

const isActiveStatusName = (statusName: string): boolean =>
  /dang mo|đang mở/i.test(statusName.trim());

const getDisplayStatusName = (statusName: string): string =>
  isActiveStatusName(statusName) ? "Đang mở" : statusName;

export const HomeView: React.FC = () => {
  const locationRouter = useLocation();
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<vietmapgl.Map | null>(null);
  const userMarkerRef = useRef<vietmapgl.Marker | null>(null);
  const reliefMarkersRef = useRef<vietmapgl.Marker[]>([]);

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [hotline, setHotline] = useState(DEFAULT_HOTLINE);
  const [sosStatus, setSosStatus] = useState<
    "idle" | "sending" | "done" | "error"
  >("idle");
  const [locationStatus, setLocationStatus] = useState<
    "locating" | "granted" | "denied" | "unsupported"
  >("locating");
  const [locationAccuracyMeters, setLocationAccuracyMeters] = useState<
    number | null
  >(null);
  const [isLocationRefining, setIsLocationRefining] = useState(false);
  const [location, setLocation] = useState<Coordinate>(DEFAULT_CENTER);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isReliefModalOpen, setIsReliefModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [unsyncedRequests, setUnsyncedRequests] = useState<UnsyncedRequest[]>(
    [],
  );
  const [alerts, setAlerts] = useState<PublicAlertItem[]>([]);
  const [isAlertsLoading, setIsAlertsLoading] = useState(false);

  const [isMapReady, setIsMapReady] = useState(false);
  const [isMarkersLoading, setIsMarkersLoading] = useState(false);
  const [hasLoadedMarkers, setHasLoadedMarkers] = useState(false);
  const markerRequestIdRef = useRef(0);
  const lastMarkerFetchLocationRef = useRef<Coordinate | null>(null);

  const vietmapApiKey = (import.meta.env.VITE_VIETMAP_API_KEY ?? "").trim();
  const hasVietmapKey = vietmapApiKey.length > 0;
  const canUseVietmap = hasVietmapKey;

  // Kiểm tra nếu có yêu cầu cứu hộ nào được tạo ở chế độ offline chưa được đồng bộ thì hiển thị modal nhắc người dùng đồng bộ khi mở app
  useEffect(() => {
    const checkForUnsyncedRequests = async () => {
      try {
        const authSession = getAuthSession();
        if (!authSession?.user?.phone || !authSession?.accessToken) {
          return;
        }

        const unsynced = await getUnsyncedRequests(
          authSession.user.phone,
          authSession.accessToken,
        );

        if (unsynced.length > 0) {
          setUnsyncedRequests(unsynced);
          setIsSyncModalOpen(true);
        }
      } catch (error) {
        console.error("Error checking for unsynced requests:", error);
      }
    };

    // Run on mount
    void checkForUnsyncedRequests();

    // Also listen for auth changes
    const handleAuthChanged = () => {
      void checkForUnsyncedRequests();
    };

    window.addEventListener("auth-changed", handleAuthChanged);
    return () => {
      window.removeEventListener("auth-changed", handleAuthChanged);
    };
  }, []);

  // Fetch alerts
  useEffect(() => {
    const controller = new AbortController();

    const loadAlerts = async () => {
      try {
        setIsAlertsLoading(true);
        const data = await getPublicAlerts();
        if (controller.signal.aborted) return;
        const items = Array.isArray(data.items) ? data.items : [];
        setAlerts(items);
      } catch {
        if (controller.signal.aborted) return;
        console.error("Error loading alerts");
      } finally {
        if (!controller.signal.aborted) {
          setIsAlertsLoading(false);
        }
      }
    };

    void loadAlerts();

    return () => {
      controller.abort();
    };
  }, []);
  // Tính toán điểm cứu trợ gần nhất dựa trên location hiện tại và danh sách mapPoints, kết quả được memo hóa để tối ưu hiệu năng
  const nearestReliefPoint = useMemo(() => {
    const reliefPoints = mapPoints.filter(
      (point) => point.markerType === "RELIEF_POINT",
    );

    if (reliefPoints.length === 0) {
      return null;
    }

    return reliefPoints
      .map((point) => ({
        point,
        distanceKm: getDistanceKm(location, { lat: point.lat, lng: point.lng }),
      }))
      .sort((left, right) => left.distanceKm - right.distanceKm)[0];
  }, [location, mapPoints]);

  useEffect(() => {
    const params = new URLSearchParams(locationRouter.search);
    if (params.get("request") === "1") {
      setIsRequestModalOpen(true);
    }

    if (params.get("relief") === "1") {
      setIsReliefModalOpen(true);
    }
  }, [locationRouter.search]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      setLocationAccuracyMeters(null);
      setIsLocationRefining(false);
      return;
    }

    let isActive = true;
    let hasAnySuccess = false;
    let coarseDone = false;
    let preciseDone = false;

    setLocationStatus("locating");
    setLocationAccuracyMeters(null);
    setIsLocationRefining(true);

    const finalizeFailureIfNeeded = () => {
      if (!isActive) return;
      if (!hasAnySuccess && coarseDone && preciseDone) {
        setLocationStatus("denied");
      }
    };

    const applyPosition = (
      position: GeolocationPosition,
      requireReasonableAccuracy: boolean,
    ) => {
      if (!isActive) return false;

      const accuracy = position.coords.accuracy;
      if (
        requireReasonableAccuracy &&
        Number.isFinite(accuracy) &&
        accuracy > 2000
      ) {
        return false;
      }

      hasAnySuccess = true;
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setLocationAccuracyMeters(
        Number.isFinite(accuracy) ? Math.max(0, accuracy) : null,
      );
      setLocationStatus("granted");
      return true;
    };

    // Phase 1: fast approximate location for quick first paint.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isActive) return;
        coarseDone = true;
        applyPosition(position, true);
      },
      () => {
        if (!isActive) return;
        coarseDone = true;
        finalizeFailureIfNeeded();
      },
      {
        enableHighAccuracy: false,
        timeout: 3500,
        maximumAge: 15000,
      },
    );

    // Phase 2: refine with high-accuracy GPS and overwrite coarse result.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isActive) return;
        preciseDone = true;
        applyPosition(position, false);
        setIsLocationRefining(false);
      },
      () => {
        if (!isActive) return;
        preciseDone = true;
        setIsLocationRefining(false);
        finalizeFailureIfNeeded();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadBootstrap = async () => {
      try {
        if (controller.signal.aborted) return;

        const bootstrapData = await getPublicBootstrap();

        if (typeof bootstrapData?.hotline === "string") {
          setHotline(bootstrapData.hotline);
        }

        if (
          typeof bootstrapData?.defaultMapCenter?.lat === "number" &&
          typeof bootstrapData?.defaultMapCenter?.lng === "number" &&
          locationStatus !== "granted"
        ) {
          setLocation({
            lat: bootstrapData.defaultMapCenter.lat,
            lng: bootstrapData.defaultMapCenter.lng,
          });
        }
      } catch {
        // Keep default values when API is unavailable.
      }
    };

    void loadBootstrap();

    return () => {
      controller.abort();
    };
  }, [locationStatus]);

  useEffect(() => {
    let isActive = true;

    const lastFetchedLocation = lastMarkerFetchLocationRef.current;
    if (
      lastFetchedLocation &&
      getDistanceKm(lastFetchedLocation, location) < 1.5
    ) {
      setHasLoadedMarkers(true);
      return () => {
        isActive = false;
      };
    }

    const requestId = ++markerRequestIdRef.current;

    const loadNearbyMarkers = async () => {
      setIsMarkersLoading(true);

      try {
        const mapData = await getPublicMapData(location.lat, location.lng, 50);
        if (!isActive || requestId !== markerRequestIdRef.current) return;

        const markers = Array.isArray(mapData?.markers) ? mapData.markers : [];
        const parsedMarkers: MapPoint[] = markers
          .map((marker) => ({
            id: String(marker.id),
            markerType: String(marker.markerType ?? "UNKNOWN"),
            title: String(marker.title ?? "Điểm cứu trợ"),
            addressText: String(
              marker.position?.addressText ?? "Chưa có địa chỉ",
            ),
            lat: Number(marker.position?.lat ?? 0),
            lng: Number(marker.position?.lng ?? 0),
            statusName: String(marker.status?.name ?? "Đang hoạt động"),
            statusColor: String(marker.status?.color ?? "#22C55E"),
          }))
          .filter(
            (marker: MapPoint) =>
              !Number.isNaN(marker.lat) && !Number.isNaN(marker.lng),
          );

        setMapPoints((prevPoints) => {
          if (parsedMarkers.length > 0) {
            return parsedMarkers;
          }

          return prevPoints;
        });

        lastMarkerFetchLocationRef.current = {
          lat: location.lat,
          lng: location.lng,
        };
      } catch {
        if (!isActive || requestId !== markerRequestIdRef.current) return;
        // Keep current markers if refreshing fails.
      } finally {
        if (!isActive || requestId !== markerRequestIdRef.current) return;
        setIsMarkersLoading(false);
        setHasLoadedMarkers(true);
      }
    };

    void loadNearbyMarkers();

    return () => {
      isActive = false;
    };
  }, [location.lat, location.lng]);

  const handleFocusCurrentLocation = () => {
    if (!canUseVietmap || !mapRef.current || !isMapReady) return;

    mapRef.current.flyTo({
      center: [location.lng, location.lat],
      zoom: 15,
      essential: true,
      duration: 900,
    });
  };

  const handleFocusNearestReliefPoint = () => {
    if (
      !canUseVietmap ||
      !mapRef.current ||
      !isMapReady ||
      !nearestReliefPoint
    ) {
      return;
    }

    mapRef.current.flyTo({
      center: [nearestReliefPoint.point.lng, nearestReliefPoint.point.lat],
      zoom: 15,
      essential: true,
      duration: 900,
    });
  };
  // Khởi tạo bản đồ Vietmap khi component mount và có key, đồng thời dọn dẹp khi unmount
  useEffect(() => {
    if (!canUseVietmap || !mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new vietmapgl.Map({
      container: mapContainerRef.current,
      style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${vietmapApiKey}`,
      center: [location.lng, location.lat],
      zoom: 12,
      fadeDuration: 0,
    });

    map.addControl(new vietmapgl.NavigationControl(), "top-right");
    mapRef.current = map;

    if (map.loaded()) {
      setIsMapReady(true);
    } else {
      map.once("load", () => setIsMapReady(true));
    }

    return () => {
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
  }, [canUseVietmap, vietmapApiKey]);

  useEffect(() => {
    if (!canUseVietmap || !mapRef.current || !isMapReady) {
      return;
    }

    const map = mapRef.current;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    const userMarker = new vietmapgl.Marker({ color: "#2563eb" })
      .setLngLat([location.lng, location.lat])
      .setPopup(
        new vietmapgl.Popup({
          offset: 10,
        }).setText("Vị trí hiện tại của bạn"),
      )
      .addTo(map);

    userMarkerRef.current = userMarker;

    map.easeTo({
      center: [location.lng, location.lat],
      zoom: 14,
      duration: 350,
      essential: true,
    });
  }, [canUseVietmap, isMapReady, location.lat, location.lng]);

  useEffect(() => {
    if (!canUseVietmap || !mapRef.current || !isMapReady) {
      return;
    }

    const map = mapRef.current;

    reliefMarkersRef.current.forEach((marker) => marker.remove());
    reliefMarkersRef.current = [];

    mapPoints.forEach((point) => {
      const rawStatusName = point.statusName?.trim()
        ? point.statusName
        : "Chưa có trạng thái";
      const statusName = getDisplayStatusName(rawStatusName);
      const statusHtml = isActiveStatusName(rawStatusName)
        ? `<span style="color:#16A34A;font-weight:700;">${statusName}</span>`
        : statusName;
      const markerLabel = getMarkerTypeLabel(point.markerType);

      const distanceKm = getDistanceKm(location, {
        lat: point.lat,
        lng: point.lng,
      });

      const reliefMarker = new vietmapgl.Marker({
        color: getMarkerColor(point.markerType),
      })
        .setLngLat([point.lng, point.lat])
        .setPopup(
          new vietmapgl.Popup({ offset: 10 }).setHTML(
            `<strong>${point.title}</strong><br/>${point.addressText}<br/>${markerLabel} • ${statusHtml}<br/>Cách vị trí của bạn: ${distanceKm.toFixed(2)} km`,
          ),
        )
        .addTo(map);

      reliefMarkersRef.current.push(reliefMarker);
    });
  }, [canUseVietmap, isMapReady, mapPoints]);

  // Hàm xử lý khi người dùng xác nhận gửi tín hiệu SOS, sẽ gọi API tạo SOS công khai và cập nhật trạng thái gửi SOS
  const handleConfirmSubmit = () => {
    void (async () => {
      setSosStatus("sending");

      try {
        const authSession = getAuthSession();

        await createPublicSos({
          incidentTypeCode: "FLOOD",
          reporterName: authSession?.user?.displayName?.trim() || "Nguoi dan",
          reporterPhone: authSession?.user?.phone?.trim() || "0900000000",
          victimCountEstimate: 1,
          hasInjured: false,
          hasVulnerablePeople: false,
          description: "SOS tu man hinh trang chu",
          location: {
            lat: location.lat,
            lng: location.lng,
            addressText: "",
            landmark: "",
          },
          fileIds: [],
        });

        setSosStatus("done");
      } catch {
        setSosStatus("error");
      }
    })();
  };

  const handleSyncRequests = async () => {
    try {
      const authSession = getAuthSession();
      if (!authSession?.user?.phone || !authSession?.accessToken) {
        throw new Error("Auth session not available");
      }

      const requestIds = unsyncedRequests.map((req) => req.id);
      await syncRequests(
        authSession.user.phone,
        authSession.accessToken,
        requestIds,
      );

      setIsSyncModalOpen(false);
      setUnsyncedRequests([]);
    } catch (error) {
      console.error("Error syncing requests:", error);
      throw error;
    }
  };

  const handleSosClick = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([120, 60, 120, 60, 220]);
    }

    setSosStatus("idle");
    setIsConfirmationOpen(true);
  };

  return (
    <div className="w-full h-full">
      <section className="relative h-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-container-low/60 to-surface-container-lowest/20 z-10 pointer-events-none" />

        {canUseVietmap && (
          <div ref={mapContainerRef} className="h-full w-full" />
        )}

        {alerts.length > 0 ? (
          <div className="absolute top-5 left-5 z-20 bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl p-4 border border-outline-variant/30 shadow-lg max-w-xs">
            <div className="flex items-center gap-2 text-error mb-3">
              <Siren size={16} />
              <span className="text-[11px] font-bold uppercase tracking-[0.15em]">
                Cảnh báo mới
              </span>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {alerts.slice(0, 2).map((alert) => (
                <div
                  key={alert.id}
                  className="border-t border-outline-variant/20 pt-2 first:border-t-0 first:pt-0"
                >
                  <p className="text-xs font-bold text-on-surface line-clamp-1">
                    {alert.title}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">
                    {alert.message}
                  </p>
                  <div className="text-[10px] text-on-surface-variant mt-1 flex gap-1">
                    <span className="font-semibold">
                      {getEventTypeLabel(alert.eventType)}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(alert.sentAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {alerts.length > 2 && (
              <p className="text-[10px] text-on-surface-variant mt-2 pt-2 border-t border-outline-variant/20">
                +{alerts.length - 2} cảnh báo khác
              </p>
            )}
          </div>
        ) : null}

        <div className="absolute top-5 right-5 z-20 space-y-3 w-[280px] max-w-[calc(100%-2.5rem)]">
          <div className="bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl p-4 border border-outline-variant/30 shadow-lg">
            <div className="flex items-center gap-2 text-primary mb-1">
              <button
                type="button"
                onClick={handleFocusCurrentLocation}
                className="flex items-center gap-2 text-primary mb-1 cursor-pointer hover:opacity-80"
              >
                <LocateFixed size={16} />
                <span className="text-[11px] font-bold uppercase tracking-[0.15em]">
                  Vị trí hiện tại
                </span>
              </button>
            </div>
            <p className="text-sm font-bold text-on-surface">
              {location.lat.toFixed(5)}°, {location.lng.toFixed(5)}°
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              {locationStatus === "granted" && "Đã định vị thiết bị"}
              {locationStatus === "locating" && "Đang lấy vị trí của bạn..."}
              {locationStatus === "denied" &&
                "Bạn đã từ chối GPS, đang dùng vị trí mặc định"}
              {locationStatus === "unsupported" &&
                "Trình duyệt không hỗ trợ GPS"}
            </p>
            {locationStatus === "granted" &&
              locationAccuracyMeters !== null && (
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Độ chính xác: ~
                  {locationAccuracyMeters < 1000
                    ? `${Math.round(locationAccuracyMeters)} m`
                    : `${(locationAccuracyMeters / 1000).toFixed(1)} km`}
                </p>
              )}
            {locationStatus === "granted" && isLocationRefining && (
              <p className="text-[11px] text-primary mt-1">
                Đang tinh chỉnh vị trí GPS...
              </p>
            )}
          </div>

          <div className="bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl p-4 border border-outline-variant/30 shadow-lg">
            <div className="flex items-center gap-2 text-error mb-1">
              <button
                type="button"
                onClick={handleFocusNearestReliefPoint}
                disabled={!nearestReliefPoint}
                className="flex items-center gap-2 text-error cursor-pointer hover:opacity-80 disabled:cursor-default disabled:opacity-70"
              >
                <MapPin size={16} />
                <span className="text-[11px] font-bold uppercase tracking-[0.15em]">
                  Điểm cứu trợ gần nhất
                </span>
              </button>
            </div>
            {nearestReliefPoint ? (
              <>
                {(() => {
                  const rawStatusName =
                    nearestReliefPoint.point.statusName?.trim() ||
                    "Đang hoạt động";
                  const isOpenStatus = isActiveStatusName(rawStatusName);
                  const displayStatusName = getDisplayStatusName(rawStatusName);

                  return (
                    <>
                      <p className="text-sm font-bold text-on-surface">
                        {nearestReliefPoint.point.title}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        {nearestReliefPoint.point.addressText}
                      </p>
                      <p className="text-xs mt-2 font-semibold text-on-surface">
                        Cách bạn khoảng{" "}
                        {nearestReliefPoint.distanceKm.toFixed(2)} km
                      </p>
                      <span
                        className="inline-flex mt-2 px-2 py-1 rounded-lg text-[11px] font-bold"
                        style={
                          isOpenStatus
                            ? {
                                color: "#16A34A",
                                backgroundColor: "#DCFCE7",
                              }
                            : {
                                color: nearestReliefPoint.point.statusColor,
                                backgroundColor: `${nearestReliefPoint.point.statusColor}20`,
                              }
                        }
                      >
                        {displayStatusName}
                      </span>
                    </>
                  );
                })()}
              </>
            ) : (
              <p className="text-xs text-on-surface-variant">
                Chưa nhận được dữ liệu điểm cứu trợ gần bạn.
              </p>
            )}
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={handleSosClick}
            className="w-24 h-24 md:w-28 md:h-28 cursor-pointer rounded-full bg-gradient-to-br from-error to-red-700 text-white shadow-2xl flex items-center justify-center hover:opacity-95 active:scale-95 transition-all sos-shake"
            aria-label="Gửi SOS khẩn cấp"
            title="SOS khẩn cấp"
          >
            <span className="absolute inset-0 rounded-full bg-red-500/35 animate-ping" />
            <span className="absolute inset-0 rounded-full border-[3px] border-white/70 sos-ring" />
            <span className="relative z-10 font-black text-xl md:text-2xl">
              SOS
            </span>
          </button>
        </div>

        <div className="absolute bottom-5 right-5 z-30 flex flex-col items-end gap-3">
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="w-14 h-14 rounded-full cursor-pointer bg-primary text-on-primary shadow-2xl flex items-center justify-center hover:opacity-90 active:scale-95 transition-all "
            aria-label="Gửi cứu hộ"
            title="Gửi cứu hộ"
          >
            <LifeBuoy size={20} />
          </button>

          <a
            href={`tel:${hotline.replace(/\s+/g, "")}`}
            className="w-14 h-14 rounded-full cursor-pointer bg-surface-container-lowest border border-outline-variant/40 text-primary shadow-2xl flex items-center justify-center hover:bg-surface-container-low transition-colors"
            aria-label={`Hotline ${hotline}`}
            title={`Hotline: ${hotline}`}
          >
            <Phone size={20} />
          </a>
        </div>

        {!hasVietmapKey && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 bg-amber-100 text-amber-900 px-3 py-2 rounded-lg text-xs font-bold border border-amber-300">
            Chưa cấu hình VITE_VIETMAP_API_KEY, đang hiển thị bản đồ dự phòng.
          </div>
        )}

        {hasVietmapKey && !canUseVietmap && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 bg-amber-100 text-amber-900 px-3 py-2 rounded-lg text-xs font-bold border border-amber-300 max-w-[320px] text-center">
            Vị trí hiện tại đang ngoài vùng phủ dữ liệu Vietmap, chuyển sang bản
            đồ dự phòng.
          </div>
        )}

        {(sosStatus === "done" || sosStatus === "error") && (
          <div
            className={`absolute bottom-36 left-1/2 -translate-x-1/2 z-20 rounded-xl px-4 py-3 text-sm font-semibold border shadow-lg max-w-[420px] text-center ${
              sosStatus === "done"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {sosStatus === "done"
              ? "Đã gửi tín hiệu SOS thành công, trung tâm đang tiếp nhận."
              : "Gửi SOS chưa thành công. Vui lòng thử lại hoặc gọi hotline ngay."}
          </div>
        )}
      </section>

      <ConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Xác nhận gửi tín hiệu SOS"
        message="Bạn chuẩn bị gửi SOS khẩn cấp đến trung tâm điều phối. Tiếp tục?"
        confirmText={sosStatus === "sending" ? "Đang gửi..." : "Có, gửi SOS"}
        cancelText="Quay lại"
      />

      <RescueRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false);
          if (locationRouter.search) {
            navigate("/home", { replace: true });
          }
        }}
        defaultLocation={location}
        onSubmitted={(trackingCode) => {
          const code = trackingCode?.trim();
          if (!code) {
            navigate("/track");
            return;
          }

          navigate(`/track?code=${encodeURIComponent(code)}`);
        }}
      />

      <ReliefRequestModal
        isOpen={isReliefModalOpen}
        onClose={() => {
          setIsReliefModalOpen(false);
          if (locationRouter.search) {
            navigate("/home", { replace: true });
          }
        }}
      />

      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        unsyncedRequests={unsyncedRequests}
        onConfirmSync={handleSyncRequests}
        onSkip={() => setIsSyncModalOpen(false)}
      />
    </div>
  );
};
