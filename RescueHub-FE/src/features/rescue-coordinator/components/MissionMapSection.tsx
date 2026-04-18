import React, { useEffect, useState, useRef } from "react";
import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";
import { Loader2, MapPin, Clock } from "lucide-react";
import {
  getCurrentMissions,
  CurrentMission,
} from "../services/currentMissionsService";

interface SelectedMission extends CurrentMission {
  latitude?: number;
  longitude?: number;
}

const DEFAULT_CENTER: [number, number] = [108, 12];

// Hoang Sa (Paracel Islands) coordinates - in [lng, lat] format
const HOANG_SA_COORDS: [number, number][] = [
  [111, 16.5],
  [113, 16.5],
  [113, 15],
  [111, 15],
];

// Truong Sa (Spratly Islands) coordinates - in [lng, lat] format
const TRUONG_SA_COORDS: [number, number][] = [
  [109, 12],
  [115, 12],
  [115, 8],
  [109, 8],
];

const MOCK_MISSIONS: CurrentMission[] = [
  {
    id: "mission-001",
    incidentCode: "INC-2026-001",
    location: "Phường 1, Quận 1, TP.HCM",
    description: "Ngập lụt khu vực dân cư, cần sơ tán cư dân",
    priority: "critical",
    startedAt: new Date(Date.now() - 1800000).toISOString(),
    assignedTeams: [
      {
        id: "team-1",
        name: "Đội PCCC 1",
        status: "on-scene",
        progress: 75,
        etaMinutes: 5,
        lastUpdate: new Date(Date.now() - 300000).toISOString(),
        cancelReason: undefined,
      },
      {
        id: "team-2",
        name: "Đội cứu nạn 1",
        status: "en-route",
        progress: 45,
        etaMinutes: 8,
        lastUpdate: new Date(Date.now() - 600000).toISOString(),
        cancelReason: undefined,
      },
    ],
  },
  {
    id: "mission-002",
    incidentCode: "INC-2026-002",
    location: "Đường Lê Lợi, Quận 1, TP.HCM",
    description: "Tai nạn giao thông, có người bị thương",
    priority: "high",
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    assignedTeams: [
      {
        id: "team-3",
        name: "Cấp cứu 911",
        status: "on-scene",
        progress: 90,
        etaMinutes: 2,
        lastUpdate: new Date(Date.now() - 120000).toISOString(),
        cancelReason: undefined,
      },
    ],
  },
  {
    id: "mission-003",
    incidentCode: "INC-2026-003",
    location: "Phường 2, Quận 2, TP.HCM",
    description: "Cháy kho xưởng, cần sơ tán",
    priority: "critical",
    startedAt: new Date(Date.now() - 900000).toISOString(),
    assignedTeams: [
      {
        id: "team-4",
        name: "Đội PCCC 2",
        status: "en-route",
        progress: 30,
        etaMinutes: 12,
        lastUpdate: new Date(Date.now() - 900000).toISOString(),
        cancelReason: undefined,
      },
      {
        id: "team-5",
        name: "Đội cứu nạn 2",
        status: "en-route",
        progress: 20,
        etaMinutes: 15,
        lastUpdate: new Date(Date.now() - 1200000).toISOString(),
        cancelReason: undefined,
      },
    ],
  },
  {
    id: "mission-004",
    incidentCode: "INC-2026-004",
    location: "Phường 6, Quận 3, TP.HCM",
    description: "Người bị kẹt trong thang máy",
    priority: "medium",
    startedAt: new Date(Date.now() - 1200000).toISOString(),
    assignedTeams: [
      {
        id: "team-6",
        name: "Đội kỹ thuật",
        status: "en-route",
        progress: 50,
        etaMinutes: 10,
        lastUpdate: new Date(Date.now() - 600000).toISOString(),
        cancelReason: undefined,
      },
    ],
  },
];

function getPriorityColor(priority: "critical" | "high" | "medium" | "low") {
  const colors: Record<"critical" | "high" | "medium" | "low", string> = {
    critical: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    low: "#3b82f6",
  };
  return colors[priority];
}

function getPriorityLabel(priority: "critical" | "high" | "medium" | "low") {
  const labels: Record<"critical" | "high" | "medium" | "low", string> = {
    critical: "Rất nghiêm trọng",
    high: "Nghiêm trọng",
    medium: "Trung bình",
    low: "Thấp",
  };
  return labels[priority];
}

function getTeamStatusColor(
  status: "en-route" | "on-scene" | "completed" | "cancelled",
) {
  const colors: Record<
    "en-route" | "on-scene" | "completed" | "cancelled",
    string
  > = {
    "en-route": "bg-blue-100 text-blue-800",
    "on-scene": "bg-orange-100 text-orange-800",
    completed: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return colors[status];
}

function getTeamStatusLabel(
  status: "en-route" | "on-scene" | "completed" | "cancelled",
) {
  const labels: Record<
    "en-route" | "on-scene" | "completed" | "cancelled",
    string
  > = {
    "en-route": "Đang tới",
    "on-scene": "Tại hiện trường",
    completed: "Hoàn tất",
    cancelled: "Đã hủy",
  };
  return labels[status];
}

export function MissionMapSection() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<vietmapgl.Map | null>(null);
  const markersRef = useRef<vietmapgl.Marker[]>([]);

  const [missions, setMissions] = useState<SelectedMission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] =
    useState<SelectedMission | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const vietmapApiKey = (import.meta.env.VITE_VIETMAP_API_KEY ?? "").trim();

  // Fetch missions
  useEffect(() => {
    const fetchMissions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = { missions: MOCK_MISSIONS };

        const missionsWithCoords: SelectedMission[] = response.missions.map(
          (mission, index) => ({
            ...mission,
            latitude: 21.0285 + (index % 3) * 0.02,
            longitude: 105.8542 + Math.floor(index / 3) * 0.02,
          }),
        );
        setMissions(missionsWithCoords);
        if (missionsWithCoords.length > 0) {
          setSelectedMission(missionsWithCoords[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi khi tải nhiệm vụ");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMissions();
  }, []);

  // Initialize Vietmap
  useEffect(() => {
    if (!vietmapApiKey || !mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new vietmapgl.Map({
      container: mapContainerRef.current,
      style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${vietmapApiKey}`,
      center: DEFAULT_CENTER,
      zoom: 6,
      fadeDuration: 0,
    });

    map.addControl(new vietmapgl.NavigationControl(), "top-right");
    mapRef.current = map;

    // Add territory boundaries when map loads
    map.once("load", () => {
      // Add Hoang Sa (Paracel Islands) polygon
      map.addSource("hoang-sa", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [HOANG_SA_COORDS],
          },
          properties: {
            name: "Hoàng Sa",
          },
        },
      });

      map.addLayer({
        id: "hoang-sa-fill",
        type: "fill",
        source: "hoang-sa",
        paint: {
          "fill-color": "#f87171", // Light red
          "fill-opacity": 0.2,
        },
      });

      map.addLayer({
        id: "hoang-sa-line",
        type: "line",
        source: "hoang-sa",
        paint: {
          "line-color": "#dc2626", // Red
          "line-width": 2,
          "line-dasharray": [2, 1],
        },
      });

      // Add Truong Sa (Spratly Islands) polygon
      map.addSource("truong-sa", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [TRUONG_SA_COORDS],
          },
          properties: {
            name: "Trường Sa",
          },
        },
      });

      map.addLayer({
        id: "truong-sa-fill",
        type: "fill",
        source: "truong-sa",
        paint: {
          "fill-color": "#fdba74", // Light orange
          "fill-opacity": 0.2,
        },
      });

      map.addLayer({
        id: "truong-sa-line",
        type: "line",
        source: "truong-sa",
        paint: {
          "line-color": "#ea580c", // Orange
          "line-width": 2,
          "line-dasharray": [2, 1],
        },
      });

      // Add labels for territories
      map.addLayer({
        id: "territory-labels",
        type: "symbol",
        source: "hoang-sa",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Bold"],
          "text-size": 12,
          "text-offset": [0, 0],
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#dc2626",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        },
      });

      map.addLayer({
        id: "truong-sa-labels",
        type: "symbol",
        source: "truong-sa",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Bold"],
          "text-size": 12,
          "text-offset": [0, 0],
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#ea580c",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        },
      });

      setIsMapReady(true);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setIsMapReady(false);
    };
  }, [vietmapApiKey]);

  // Update markers when missions change
  useEffect(() => {
    if (!mapRef.current || !isMapReady) {
      return;
    }

    const map = mapRef.current;

    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    missions.forEach((mission) => {
      if (!mission.latitude || !mission.longitude) return;

      const color = getPriorityColor(mission.priority);
      const size = selectedMission?.id === mission.id ? 40 : 32;

      const el = document.createElement("div");
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.background = "white";
      el.style.border = `2px solid ${color}`;
      el.style.borderRadius = "50%";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
      el.style.cursor = "pointer";

      const innerDiv = document.createElement("div");
      innerDiv.style.width = `${size - 8}px`;
      innerDiv.style.height = `${size - 8}px`;
      innerDiv.style.background = color;
      innerDiv.style.borderRadius = "50%";

      el.appendChild(innerDiv);

      const marker = new vietmapgl.Marker({ element: el })
        .setLngLat([mission.longitude, mission.latitude])
        .setPopup(
          new vietmapgl.Popup({ offset: 10 }).setHTML(
            `<strong style="font-size: 14px;">${mission.incidentCode}</strong>
            <br/>
            <span style="color: #666; font-size: 12px;">${mission.location}</span>
            <br/>
            <span style="color: #666; font-size: 12px; margin-top: 4px; display: block;">${mission.description}</span>`,
          ),
        )
        .addTo(map);

      el.addEventListener("click", () => {
        setSelectedMission(mission);
      });

      markersRef.current.push(marker);
    });
  }, [missions, isMapReady, selectedMission?.id]);

  // Handle map flyTo when selected mission changes
  useEffect(() => {
    if (
      selectedMission?.latitude &&
      selectedMission?.longitude &&
      mapRef.current &&
      isMapReady
    ) {
      mapRef.current.flyTo({
        center: [selectedMission.longitude, selectedMission.latitude],
        zoom: 15,
        essential: true,
        duration: 900,
      });
    }
  }, [selectedMission, isMapReady]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 border border-red-200">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 flex flex-col items-center justify-center h-96">
        <MapPin className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-gray-500">Không có nhiệm vụ nào đang diễn ra</p>
      </div>
    );
  }

  if (!vietmapApiKey) {
    return (
      <div className="rounded-lg bg-red-50 p-4 border border-red-200">
        <p className="text-sm text-red-700">
          Vietmap API key không được cấu hình. Vui lòng thêm
          VITE_VIETMAP_API_KEY vào file .env
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full w-full">
      <div className="lg:col-span-3 h-full">
        <div className="relative w-full h-full rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md border border-gray-200 p-3 z-50">
            <p className="text-xs font-bold text-gray-700 mb-2">
              Mức độ ưu tiên / Vùng lãnh thổ
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="text-xs font-semibold text-gray-600 mb-1.5 pb-1.5 border-b">
                Nhiệm vụ cứu nạn:
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-600">Rất nghiêm trọng</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-gray-600">Nghiêm trọng</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-gray-600">Trung bình</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">Thấp</span>
              </div>
              <div className="text-xs font-semibold text-gray-600 mt-1.5 mb-1.5 pb-1.5 border-b">
                Lãnh thổ Việt Nam:
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-red-600 bg-red-100"></div>
                <span className="text-gray-600">Hoàng Sa</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-orange-600 bg-orange-100"></div>
                <span className="text-gray-600">Trường Sa</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Details Panel */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-y-auto flex flex-col">
          {selectedMission ? (
            <>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-start gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedMission.incidentCode}
                  </h3>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ${
                      selectedMission.priority === "critical"
                        ? "bg-red-100 text-red-800"
                        : selectedMission.priority === "high"
                          ? "bg-orange-100 text-orange-800"
                          : selectedMission.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {getPriorityLabel(selectedMission.priority)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {selectedMission.location}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedMission.description}
                </p>
              </div>

              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold">Bắt đầu lúc</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 ml-6">
                  {new Date(selectedMission.startedAt).toLocaleTimeString(
                    "vi-VN",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </p>
              </div>

              <div className="p-4 flex-1 overflow-y-auto">
                <h4 className="text-xs font-bold text-gray-700 mb-3">
                  ĐỘI ỨC CHỈ ĐỊNH
                </h4>
                <div className="space-y-3">
                  {selectedMission.assignedTeams.map((team) => (
                    <div
                      key={team.id}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {team.name}
                        </p>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded ${getTeamStatusColor(
                            team.status,
                          )}`}
                        >
                          {getTeamStatusLabel(team.status)}
                        </span>
                      </div>

                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Tiến độ</span>
                          <span className="text-xs font-semibold text-gray-900">
                            {team.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full transition-all duration-500"
                            style={{ width: `${team.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">ETA</span>
                        <span className="font-semibold text-gray-900">
                          {team.etaMinutes} phút
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <MapPin className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-center text-sm text-gray-500">
                Chọn một nhiệm vụ trên bản đồ để xem chi tiết
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
