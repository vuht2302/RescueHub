import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";
import { LifeBuoy, LocateFixed, MapPin, Phone, Siren } from "lucide-react";
import { ConfirmationModal } from "../../../shared/components/ConfirmationModal";
import { getPublicBootstrap } from "../../../shared/services/publicApi";
import { RescueRequestModal } from "../components/RescueRequestModal";

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

const DEFAULT_CENTER: Coordinate = {
  lat: 10.7769,
  lng: 106.7009,
};

const DEFAULT_HOTLINE = "1900xxxx";

const isWithinVietnamBounds = (lat: number, lng: number) =>
  lat >= 8.0 && lat <= 24.5 && lng >= 102.0 && lng <= 110.0;

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

export const HomeView: React.FC = () => {
  const locationRouter = useLocation();
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<vietmapgl.Map | null>(null);
  const mapMarkersRef = useRef<vietmapgl.Marker[]>([]);

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [hotline, setHotline] = useState(DEFAULT_HOTLINE);
  const [sosStatus, setSosStatus] = useState<
    "idle" | "sending" | "done" | "error"
  >("idle");
  const [locationStatus, setLocationStatus] = useState<
    "locating" | "granted" | "denied" | "unsupported"
  >("locating");
  const [location, setLocation] = useState<Coordinate>(DEFAULT_CENTER);
  const [reliefPoints, setReliefPoints] = useState<ReliefPoint[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const vietmapApiKey = (import.meta.env.VITE_VIETMAP_API_KEY ?? "").trim();
  const hasVietmapKey = vietmapApiKey.length > 0;
  const canUseVietmap =
    hasVietmapKey && isWithinVietnamBounds(location.lat, location.lng);

  const nearestReliefPoint = useMemo(() => {
    if (reliefPoints.length === 0) {
      return null;
    }

    return reliefPoints
      .map((point) => ({
        point,
        distanceKm: getDistanceKm(location, { lat: point.lat, lng: point.lng }),
      }))
      .sort((left, right) => left.distanceKm - right.distanceKm)[0];
  }, [location, reliefPoints]);

  useEffect(() => {
    const params = new URLSearchParams(locationRouter.search);
    if (params.get("request") === "1") {
      setIsRequestModalOpen(true);
    }
  }, [locationRouter.search]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus("granted");
      },
      () => {
        setLocationStatus("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
      },
    );
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
    const controller = new AbortController();

    const loadNearbyReliefPoints = async () => {
      try {
        const query = new URLSearchParams({
          lat: location.lat.toString(),
          lng: location.lng.toString(),
          radiusKm: "5",
        });

        const response = await fetch(
          `/api/v1/public/map-data?${query.toString()}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          data?: { markers?: unknown[] };
          Data?: { markers?: unknown[] };
        };
        const mapData = payload.data ?? payload.Data;
        const markers = Array.isArray(mapData?.markers) ? mapData.markers : [];

        const parsedMarkers: ReliefPoint[] = markers
          .filter((marker: any) => marker?.markerType === "RELIEF_POINT")
          .map((marker: any) => ({
            id: String(marker.id ?? Math.random()),
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
            (marker: ReliefPoint) =>
              !Number.isNaN(marker.lat) && !Number.isNaN(marker.lng),
          );

        setReliefPoints(parsedMarkers);
      } catch {
        setReliefPoints([]);
      }
    };

    void loadNearbyReliefPoints();

    return () => {
      controller.abort();
    };
  }, [location.lat, location.lng]);

  const handleFocusCurrentLocation = () => {
    if (!canUseVietmap || !mapRef.current) return;

    mapRef.current.flyTo({
      center: [location.lng, location.lat],
      zoom: 15,
      essential: true,
      duration: 900,
    });
  };
  useEffect(() => {
    if (!canUseVietmap || !mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new vietmapgl.Map({
      container: mapContainerRef.current,
      style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${vietmapApiKey}`,
      center: [location.lng, location.lat],
      zoom: 14,
    });

    map.addControl(new vietmapgl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      mapMarkersRef.current.forEach((marker) => marker.remove());
      mapMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [canUseVietmap, location.lat, location.lng, vietmapApiKey]);

  useEffect(() => {
    if (!canUseVietmap || !mapRef.current) {
      return;
    }

    const map = mapRef.current;

    mapMarkersRef.current.forEach((marker) => marker.remove());
    mapMarkersRef.current = [];

    const userMarker = new vietmapgl.Marker({ color: "#2563eb" })
      .setLngLat([location.lng, location.lat])
      .setPopup(
        new vietmapgl.Popup({ offset: 10 }).setText("Vị trí hiện tại của bạn"),
      )
      .addTo(map);

    mapMarkersRef.current.push(userMarker);

    reliefPoints.forEach((point) => {
      const reliefMarker = new vietmapgl.Marker({ color: "#ef4444" })
        .setLngLat([point.lng, point.lat])
        .setPopup(
          new vietmapgl.Popup({ offset: 10 }).setHTML(
            `<strong>${point.title}</strong><br/>${point.addressText}`,
          ),
        )
        .addTo(map);

      mapMarkersRef.current.push(reliefMarker);
    });

    map.flyTo({
      center: [location.lng, location.lat],
      zoom: 14,
      duration: 900,
      essential: true,
    });
  }, [canUseVietmap, location.lat, location.lng, reliefPoints]);

  const mapFallbackSrc = useMemo(() => {
    const bbox = `${location.lng - 0.02}%2C${location.lat - 0.02}%2C${location.lng + 0.02}%2C${location.lat + 0.02}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${location.lat}%2C${location.lng}`;
  }, [location.lat, location.lng]);

  const handleConfirmSubmit = () => {
    void (async () => {
      setSosStatus("sending");

      try {
        const response = await fetch("/api/v1/public/incidents/sos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("SOS request failed");
        }

        setSosStatus("done");
      } catch {
        setSosStatus("error");
      }
    })();
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

        {canUseVietmap ? (
          <div ref={mapContainerRef} className="h-full w-full" />
        ) : (
          <iframe
            title="Bản đồ khẩn cấp"
            src={mapFallbackSrc}
            className="h-full w-full"
            loading="lazy"
          />
        )}

        <div className="absolute top-5 left-5 z-20 bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl px-4 py-3 border border-outline-variant/30 shadow-lg max-w-xs">
          <p className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant font-bold">
            Trang chủ khẩn cấp
          </p>
          <h1 className="text-2xl font-headline font-black text-on-surface mt-1 leading-tight">
            Bản đồ cứu nạn thời gian thực
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Mở ngay khi truy cập, ưu tiên xác định vị trí và gọi hỗ trợ nhanh.
          </p>
        </div>

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
          </div>

          <div className="bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl p-4 border border-outline-variant/30 shadow-lg">
            <div className="flex items-center gap-2 text-error mb-1">
              <MapPin size={16} />
              <span className="text-[11px] font-bold uppercase tracking-[0.15em]">
                Điểm cứu trợ gần nhất
              </span>
            </div>
            {nearestReliefPoint ? (
              <>
                <p className="text-sm font-bold text-on-surface">
                  {nearestReliefPoint.point.title}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {nearestReliefPoint.point.addressText}
                </p>
                <p className="text-xs mt-2 font-semibold text-on-surface">
                  Cách bạn khoảng {nearestReliefPoint.distanceKm.toFixed(2)} km
                </p>
                <span
                  className="inline-flex mt-2 px-2 py-1 rounded-lg text-[11px] font-bold"
                  style={{
                    color: nearestReliefPoint.point.statusColor,
                    backgroundColor: `${nearestReliefPoint.point.statusColor}20`,
                  }}
                >
                  {nearestReliefPoint.point.statusName}
                </span>
              </>
            ) : (
              <p className="text-xs text-on-surface-variant">
                Chưa nhận được dữ liệu điểm cứu trợ gần bạn.
              </p>
            )}
          </div>
        </div>

        <div className="absolute bottom-5 right-5 z-30 flex flex-col items-end gap-3">
          <button
            onClick={handleSosClick}
            className="w-16 h-16 cursor-pointer rounded-full bg-gradient-to-br from-error to-red-700 text-white shadow-2xl flex items-center justify-center hover:opacity-95 active:scale-95 transition-all sos-shake"
            aria-label="Gửi SOS khẩn cấp"
            title="SOS khẩn cấp"
          >
            <span className="absolute inset-0 rounded-full bg-red-500/35 animate-ping" />
            <span className="absolute inset-0 rounded-full border-2 border-white/70 sos-ring" />
            <span className="relative z-10 font-black text-sm">SOS</span>
          </button>

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
            className={`absolute bottom-24 left-1/2 -translate-x-1/2 z-20 rounded-xl px-4 py-3 text-sm font-semibold border shadow-lg max-w-[420px] text-center ${
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
        onSubmitted={() => navigate("/confirmed")}
      />
    </div>
  );
};
