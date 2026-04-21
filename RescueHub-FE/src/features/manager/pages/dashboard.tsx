import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Bell,
  ChevronDown,
  LifeBuoy,
  MoreVertical,
  Phone,
  Search,
  ShieldCheck,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { useManager } from "../../../shared/context/ManagerContext";
import { RescueEventSection } from "../components/RescueEventSection";
import { InventorySection } from "../components/InventorySection";
import { ImportExportSection } from "../components/ImportExportSection";
import { VehicleManagementSection } from "../components/VehicleManagementSection";
import { PendingVerificationSection } from "../components/PendingVerificationSection";
import { ReliefHotspotMap } from "../../rescue-coordinator/components/ReliefHotspotMap";
import { ReliefRequestsPage } from "../../rescue-coordinator/pages/ReliefRequestsPage";
import { ReliefDistributionPage } from "../pages/ReliefDistributionPage";
import { getAuthSession } from "../../../features/auth/services/authStorage";
import { BarChart } from "../../../shared/components/BarChart";

type KPI = {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
};

type ScheduleItem = {
  date: string;
  time: string;
  title: string;
  subtitle: string;
};

type OrderItem = {
  id: string;
  customer: string;
  email: string;
  product: string;
  dealValue: string;
  closeDate: string;
  status: "Hoàn tất" | "Đang xử lý" | "Cần xác minh";
  initials: string;
};

type IncidentHotspot = {
  id: string;
  location: string;
  latitude: number;
  longitude: number;
  incidents: number;
  severity: "low" | "medium" | "high" | "critical";
  lastIncident: string;
};

const kpis: KPI[] = [
  {
    title: "Vụ việc đang xử lý",
    value: "128",
    change: "+12%",
    positive: true,
    icon: <LifeBuoy className="h-12 w-12 text-orange-500" />,
  },
  {
    title: "Tổng yêu cầu tháng",
    value: "2,410",
    change: "+8.4%",
    positive: true,
    icon: <Phone className="h-12 w-12 text-blue-500" />,
  },
  {
    title: "Đã hoàn tất",
    value: "874",
    change: "-4.5%",
    positive: false,
    icon: <ShieldCheck className="h-12 w-12 text-emerald-500" />,
  },
];

const schedule: ScheduleItem[] = [
  {
    date: "Thứ 4, 11/01",
    time: "09:20",
    title: "Họp điều phối cứu nạn khu vực Đông",
    subtitle: "Phân công lực lượng, phương án dự phòng +6 mục",
  },
  {
    date: "Thứ 6, 15/02",
    time: "10:35",
    title: "Đánh giá ca trực tuần",
    subtitle: "Rà soát KPI phản ứng nhanh +2 mục",
  },
  {
    date: "Thứ 5, 18/03",
    time: "01:15",
    title: "Rút kinh nghiệm vụ cháy kho",
    subtitle: "Tổng hợp báo cáo hiện trường +8 mục",
  },
];

const orders: OrderItem[] = [
  {
    id: "RH24321",
    customer: "Nguyễn Văn An",
    email: "an.nguyen@rescuehub.vn",
    product: "Hỗ trợ y tế khẩn cấp",
    dealValue: "₫18,500,000",
    closeDate: "2026-04-15",
    status: "Hoàn tất",
    initials: "AN",
  },
  {
    id: "RH24322",
    customer: "Trần Thu Hà",
    email: "ha.tran@rescuehub.vn",
    product: "Cứu hộ giao thông",
    dealValue: "₫12,990,000",
    closeDate: "2026-04-18",
    status: "Đang xử lý",
    initials: "TH",
  },
  {
    id: "RH24323",
    customer: "Lê Minh Khôi",
    email: "khoi.le@rescuehub.vn",
    product: "Hỗ trợ sơ tán",
    dealValue: "₫21,400,000",
    closeDate: "2026-04-21",
    status: "Cần xác minh",
    initials: "LK",
  },
];

const monthlyPrimary = [
  180, 190, 150, 165, 178, 168, 172, 210, 232, 214, 240, 236,
];
const monthlySecondary = [40, 30, 52, 40, 55, 42, 70, 102, 112, 123, 152, 142];
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function changeBadge(change: string, positive: boolean) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
        positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
      }`}
      style={{ fontFamily: "var(--font-primary)" }}
    >
      {change}
    </span>
  );
}

function statusBadge(status: "Hoàn tất" | "Đang xử lý" | "Cần xác minh") {
  const statusStyles = {
    "Hoàn tất": "bg-emerald-50 text-emerald-600",
    "Đang xử lý": "bg-blue-50 text-blue-600",
    "Cần xác minh": "bg-orange-50 text-orange-600",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${statusStyles[status]}`}
      style={{ fontFamily: "var(--font-primary)" }}
    >
      {status}
    </span>
  );
}

function MapLibreHCMMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Khởi tạo map với OpenStreetMap
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [106.6553, 10.8019], // HCM City coordinates
      zoom: 11,
      pitch: 0,
      bearing: 0,
    });

    // Thêm marker cho Hub chính
    const marker1 = new maplibregl.Marker({ color: "#3b82f6" })
      .setLngLat([106.6619, 10.7769]) // District 1
      .setPopup(
        new maplibregl.Popup().setHTML(
          `<div class="p-2">
            <h3 class="font-bold text-sm">Primary Hub</h3>
            <p class="text-xs text-slate-600">District 1 - HCM</p>
          </div>`,
        ),
      )
      .addTo(map.current);

    // Thêm marker cho các Service Centers
    const centers = [
      {
        name: "Service Center - Binh Thanh",
        coords: [106.7432, 10.8141],
      },
      { name: "Service Center - Go Vap", coords: [106.6279, 10.8286] },
      {
        name: "Service Center - Phu Nhuan",
        coords: [106.6842, 10.7987],
      },
      { name: "Service Center - District 12", coords: [106.5997, 10.8614] },
    ];

    centers.forEach((center) => {
      new maplibregl.Marker({ color: "#60a5fa" })
        .setLngLat(center.coords as [number, number])
        .setPopup(
          new maplibregl.Popup().setHTML(
            `<div class="p-2">
              <h3 class="font-bold text-sm">${center.name}</h3>
              <p class="text-xs text-slate-600">Service Coverage Area</p>
            </div>`,
          ),
        )
        .addTo(map.current);
    });

    // Add click to zoom
    map.current.on("click", (e) => {
      if (map.current) {
        map.current.flyTo({
          center: e.lngLat,
          zoom: map.current.getZoom() + 1,
          duration: 2000,
        });
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  return <div ref={mapContainer} className="h-96 w-full rounded-lg" />;
}

// Sample incident hotspot data
const incidentHotspots: IncidentHotspot[] = [
  {
    id: "HS001",
    location: "Ngã tư Võ Văn Kiệt & Lê Lợi",
    latitude: 10.7631,
    longitude: 106.6977,
    incidents: 24,
    severity: "critical",
    lastIncident: "2026-02-20 14:32",
  },
  {
    id: "HS002",
    location: "Cầu Sài Gòn - Khu công nghiệp",
    latitude: 10.7469,
    longitude: 106.5819,
    incidents: 18,
    severity: "high",
    lastIncident: "2026-02-21 09:15",
  },
  {
    id: "HS003",
    location: "Đường Trần Hưng Đạo - Quận 1",
    latitude: 10.7734,
    longitude: 106.6879,
    incidents: 15,
    severity: "high",
    lastIncident: "2026-02-19 16:45",
  },
  {
    id: "HS004",
    location: "Bến xe Miền Đông - Q. Bình Thạnh",
    latitude: 10.8281,
    longitude: 106.9084,
    incidents: 12,
    severity: "medium",
    lastIncident: "2026-02-18 11:20",
  },
  {
    id: "HS005",
    location: "Khu dân cư Phúc Tân - Q. Gò Vấp",
    latitude: 10.8256,
    longitude: 106.6439,
    incidents: 9,
    severity: "medium",
    lastIncident: "2026-02-20 13:00",
  },
  {
    id: "HS006",
    location: "Chợ Bến Thành - Quận 1",
    latitude: 10.7716,
    longitude: 106.6987,
    incidents: 7,
    severity: "low",
    lastIncident: "2026-02-17 10:30",
  },
];

function IncidentHotspotsMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Khởi tạo map với OpenStreetMap
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [106.6553, 10.8019], // HCM City coordinates
      zoom: 11,
      pitch: 0,
      bearing: 0,
    });

    // Thêm markers cho các điểm sự cố
    incidentHotspots.forEach((hotspot) => {
      // Xác định màu dựa trên mức độ nghiêm trọng
      let markerColor = "#3b82f6"; // blue - low
      let markerSize = "35px";

      if (hotspot.severity === "critical") {
        markerColor = "#dc2626"; // red
        markerSize = "40px";
      } else if (hotspot.severity === "high") {
        markerColor = "#f97316"; // orange
        markerSize = "38px";
      } else if (hotspot.severity === "medium") {
        markerColor = "#eab308"; // yellow
        markerSize = "36px";
      }

      const el = document.createElement("div");
      el.style.width = markerSize;
      el.style.height = markerSize;
      el.style.backgroundColor = markerColor;
      el.style.borderRadius = "50%";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.fontSize = "12px";
      el.style.fontWeight = "bold";
      el.style.color = "white";
      el.style.cursor = "pointer";

      el.innerHTML = hotspot.incidents.toString();

      new maplibregl.Marker({ element: el })
        .setLngLat([hotspot.longitude, hotspot.latitude])
        .setPopup(
          new maplibregl.Popup().setHTML(
            `<div class="p-3 text-sm" style="font-family: var(--font-primary)">
              <h4 class="font-bold text-slate-900">${hotspot.location}</h4>
              <div class="mt-2 space-y-1 text-slate-600">
                <p><span class="font-semibold">Sự cố:</span> ${hotspot.incidents} vụ</p>
                <p><span class="font-semibold">Mức độ:</span> ${
                  hotspot.severity === "critical"
                    ? "🔴 Rất nghiêm trọng"
                    : hotspot.severity === "high"
                      ? "🟠 Nghiêm trọng"
                      : hotspot.severity === "medium"
                        ? "🟡 Trung bình"
                        : "🟢 Thấp"
                }</p>
                <p><span class="font-semibold">Lần cuối:</span> ${hotspot.lastIncident}</p>
              </div>
            </div>`,
          ),
        )
        .addTo(map.current!);
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  return <div ref={mapContainer} className="h-96 w-full rounded-lg" />;
}

function HCMMap() {
  return (
    <svg viewBox="0 0 600 400" className="w-full">
      {/* Background */}
      <rect width="600" height="400" fill="#f3f4f6" />

      {/* Vietnam outline - simplified */}
      <g fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1">
        {/* Northern region */}
        <path d="M 250 80 L 280 85 L 290 100 L 270 120 L 250 110 Z" />
        {/* Central region */}
        <path d="M 240 130 L 280 125 L 290 140 L 300 160 L 280 180 L 260 170 Z" />
        {/* HCM region - highlight in light blue */}
        <ellipse
          cx="260"
          cy="280"
          rx="80"
          ry="85"
          fill="#dbeafe"
          stroke="#60a5fa"
          strokeWidth="2"
        />
      </g>

      {/* HCM text */}
      <text
        x="260"
        y="285"
        textAnchor="middle"
        className="text-white font-bold"
        fontSize="24"
        fontFamily="var(--font-primary)"
        fill="#1e40af"
      >
        HCM
      </text>

      {/* Data points (districts) */}
      <circle cx="240" cy="260" r="8" fill="#3b82f6" />
      <circle cx="280" cy="290" r="6" fill="#60a5fa" />
      <circle cx="250" cy="310" r="6" fill="#60a5fa" />

      {/* Labels for locations */}
      <text
        x="240"
        y="245"
        fontSize="12"
        fill="#475569"
        fontFamily="var(--font-primary)"
      >
        District 1
      </text>

      {/* Title and info */}
      <text
        x="300"
        y="30"
        fontSize="18"
        fontWeight="bold"
        fill="#1e293b"
        fontFamily="var(--font-primary)"
      >
        Khu vực hoạt động
      </text>

      {/* Legend */}
      <g>
        <rect x="20" y="340" width="12" height="12" fill="#3b82f6" />
        <text
          x="40"
          y="350"
          fontSize="12"
          fill="#475569"
          fontFamily="var(--font-primary)"
        >
          Primary Hub
        </text>

        <rect x="200" y="340" width="12" height="12" fill="#60a5fa" />
        <text
          x="220"
          y="350"
          fontSize="12"
          fill="#475569"
          fontFamily="var(--font-primary)"
        >
          Service Centers
        </text>
      </g>

      {/* Coverage percentage */}
      <text
        x="20"
        y="375"
        fontSize="13"
        fontWeight="bold"
        fill="#1e293b"
        fontFamily="var(--font-primary)"
      >
        Coverage: 85%
      </text>
    </svg>
  );
}

const chartdata = [
  {
    date: "Jan 23",
    "Cứu hộ": 2890,
    "Cứu trợ": 2338,
  },
  {
    date: "Feb 23",
    "Cứu hộ": 2756,
    "Cứu trợ": 2103,
  },
  {
    date: "Mar 23",
    "Cứu hộ": 3322,
    "Cứu trợ": 2194,
  },
  {
    date: "Apr 23",
    "Cứu hộ": 3470,
    "Cứu trợ": 2108,
  },
  {
    date: "May 23",
    "Cứu hộ": 3475,
    "Cứu trợ": 1812,
  },
  {
    date: "Jun 23",
    "Cứu hộ": 3129,
    "Cứu trợ": 1726,
  },
  {
    date: "Jul 23",
    "Cứu hộ": 3490,
    "Cứu trợ": 1982,
  },
  {
    date: "Aug 23",
    "Cứu hộ": 2903,
    "Cứu trợ": 2012,
  },
  {
    date: "Sep 23",
    "Cứu hộ": 2643,
    "Cứu trợ": 2342,
  },
  {
    date: "Oct 23",
    "Cứu hộ": 2837,
    "Cứu trợ": 2473,
  },
  {
    date: "Nov 23",
    "Cứu hộ": 2954,
    "Cứu trợ": 3848,
  },
  {
    date: "Dec 23",
    "Cứu hộ": 3239,
    "Cứu trợ": 3736,
  },
];

function StatisticsChart() {
  return (
    <div className="h-80 w-full mt-4">
      <BarChart
        className="h-64"
        data={chartdata}
        index="date"
        categories={["Cứu hộ", "Cứu trợ"]}
        valueFormatter={(number: number) =>
          `${Intl.NumberFormat("us").format(number).toString()}`
        }
        onValueChange={(v) => console.log(v)}
      />
    </div>
  );
}

export default function ManagerDashboard() {
  const { activeMenu } = useManager();

  return (
    <div className="p-6 md:p-8 bg-gradient-to-b from-slate-50 to-white min-h-screen">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Overview Section */}
        {activeMenu === "overview" && (
          <>
            <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-[280px] flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    placeholder="Tìm kiếm lệnh, mã vụ việc..."
                    style={{ fontFamily: "var(--font-sans)" }}
                  />
                  <kbd className="rounded border border-slate-200 bg-slate-100 px-2 py-1 text-xs text-slate-500">
                    ⌘ K
                  </kbd>
                </div>

                <div className="flex items-center gap-3">
                  <button className="relative rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100">
                    <Bell className="h-4 w-4" />
                    <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-orange-400" />
                  </button>
                  <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 transition hover:bg-slate-50">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      MG
                    </span>
                    <span
                      className="hidden text-sm font-semibold text-slate-700 md:block"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Manager
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              </div>
            </header>

            {/* KPI Cards */}
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {kpis.map((item) => (
                <article
                  key={item.title}
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {item.title}
                      </p>
                      <h3
                        className="mt-2 text-3xl font-bold text-slate-900"
                        style={{ fontFamily: "var(--font-primary)" }}
                      >
                        {item.value}
                      </h3>
                    </div>
                    <div className="text-slate-300">{item.icon}</div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {changeBadge(item.change, item.positive)}
                    <span className="text-xs text-slate-500">tháng này</span>
                  </div>
                </article>
              ))}
            </section>

            {/* Statistics - Full Width */}
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3
                    className="text-xl font-bold text-slate-900"
                    style={{ fontFamily: "var(--font-primary)" }}
                  >
                    Thống kê vận hành
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Chỉ tiêu theo dõi hiệu quả vận hành theo tháng
                  </p>
                </div>

                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
                  {["Monthly", "Quarterly", "Annually"].map((tab, idx) => (
                    <button
                      key={tab}
                      className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                        idx === 0
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4">
                  <p className="text-xs font-medium text-slate-600 uppercase">
                    Số lượng vụ cứu hộ cứu trợ
                  </p>
                  <div className="mt-2 flex items-end gap-3">
                    <p className="text-2xl font-bold text-slate-900">100</p>
                    {changeBadge("+15.8%", true)}
                  </div>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100 p-4">
                  <p className="text-xs font-medium text-slate-600 uppercase">
                    Số lượng vụ cứu hộ cứu trợ
                  </p>
                  <div className="mt-2 flex items-end gap-3">
                    <p className="text-2xl font-bold text-slate-900">329</p>
                    {changeBadge("-8.2%", false)}
                  </div>
                </div>
              </div>

              <StatisticsChart />
            </section>

            {/* HCM Map & Analytics */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3
                      className="text-xl font-bold text-slate-900"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Khu vực hoạt động
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Các khu vực tại TP.HCM có hoạt động cứu hộ diễn ra
                    </p>
                  </div>
                  <button className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-6">
                  <MapLibreHCMMap />
                </div>
              </article>

              <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3
                      className="text-xl font-bold text-slate-900"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Top khu vực có nhiều sự cố nhất
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Thống kê số yêu cầu theo khu vực
                    </p>
                  </div>
                  <button className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-6">
                  <svg viewBox="0 0 400 250" className="w-full">
                    {/* Bar Chart */}
                    <rect
                      x="50"
                      y="20"
                      width="30"
                      height="180"
                      fill="#3b82f6"
                      rx="4"
                    />
                    <text
                      x="65"
                      y="220"
                      textAnchor="middle"
                      className="text-xs fill-slate-600"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Q1
                    </text>
                    <text
                      x="65"
                      y="10"
                      textAnchor="middle"
                      className="text-sm fill-slate-900 font-bold"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      245
                    </text>

                    <rect
                      x="110"
                      y="40"
                      width="30"
                      height="160"
                      fill="#0ea5e9"
                      rx="4"
                    />
                    <text
                      x="125"
                      y="220"
                      textAnchor="middle"
                      className="text-xs fill-slate-600"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Q2
                    </text>
                    <text
                      x="125"
                      y="30"
                      textAnchor="middle"
                      className="text-sm fill-slate-900 font-bold"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      198
                    </text>

                    <rect
                      x="170"
                      y="10"
                      width="30"
                      height="190"
                      fill="#06b6d4"
                      rx="4"
                    />
                    <text
                      x="185"
                      y="220"
                      textAnchor="middle"
                      className="text-xs fill-slate-600"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Q3
                    </text>
                    <text
                      x="185"
                      y="0"
                      textAnchor="middle"
                      className="text-sm fill-slate-900 font-bold"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      312
                    </text>

                    <rect
                      x="230"
                      y="80"
                      width="30"
                      height="120"
                      fill="#14b8a6"
                      rx="4"
                    />
                    <text
                      x="245"
                      y="220"
                      textAnchor="middle"
                      className="text-xs fill-slate-600"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Q4
                    </text>
                    <text
                      x="245"
                      y="70"
                      textAnchor="middle"
                      className="text-sm fill-slate-900 font-bold"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      142
                    </text>

                    {/* Axis */}
                    <line
                      x1="40"
                      y1="200"
                      x2="280"
                      y2="200"
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                    <line
                      x1="40"
                      y1="20"
                      x2="40"
                      y2="200"
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                  </svg>
                </div>

                <div className="mt-6 space-y-3 border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Q3 - Khu vực Q3
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      312 requests
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Q1 - Khu vực Q1
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      245 requests
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Q2 - Khu vực Q2
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      198 requests
                    </span>
                  </div>
                </div>
              </article>

              <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3
                      className="text-xl font-bold text-slate-900"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Khu vực có thời gian xử lý chậm nhất
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Đánh giá tốc độ phản ứng theo khu vực
                    </p>
                  </div>
                  <button className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-6">
                  <svg viewBox="0 0 400 250" className="w-full">
                    {/* Horizontal Bar Chart */}
                    <text
                      x="10"
                      y="35"
                      className="text-xs fill-slate-600"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Quận 1
                    </text>
                    <rect
                      x="80"
                      y="20"
                      width="240"
                      height="25"
                      fill="#ef4444"
                      rx="4"
                    />
                    <text
                      x="330"
                      y="37"
                      className="text-sm fill-slate-900 font-bold"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      45m
                    </text>

                    <text
                      x="10"
                      y="95"
                      className="text-xs fill-slate-600"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Quận 2
                    </text>
                    <rect
                      x="80"
                      y="80"
                      width="200"
                      height="25"
                      fill="#f97316"
                      rx="4"
                    />
                    <text
                      x="290"
                      y="97"
                      className="text-sm fill-slate-900 font-bold"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      38m
                    </text>

                    <text
                      x="10"
                      y="155"
                      className="text-xs fill-slate-600"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Quận 3
                    </text>
                    <rect
                      x="80"
                      y="140"
                      width="160"
                      height="25"
                      fill="#eab308"
                      rx="4"
                    />
                    <text
                      x="250"
                      y="157"
                      className="text-sm fill-slate-900 font-bold"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      28m
                    </text>

                    <text
                      x="10"
                      y="215"
                      className="text-xs fill-slate-600"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Quận 4
                    </text>
                    <rect
                      x="80"
                      y="200"
                      width="100"
                      height="25"
                      fill="#22c55e"
                      rx="4"
                    />
                    <text
                      x="190"
                      y="217"
                      className="text-sm fill-slate-900 font-bold"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      18m
                    </text>
                  </svg>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-4">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">Quận 1</span>{" "}
                    cần cải thiện tốc độ xử lý
                  </p>
                </div>
              </article>

              <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3
                      className="text-xl font-bold text-slate-900"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Khu vực thiếu team
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Ít đội nhưng nhiều request
                    </p>
                  </div>
                  <button className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-6">
                  <svg viewBox="0 0 400 250" className="w-full">
                    {/* Bubble/Scatter Chart - Requests vs Teams */}
                    {/* X: Teams, Y: Requests */}

                    {/* Axis labels */}
                    <text
                      x="350"
                      y="245"
                      textAnchor="middle"
                      className="text-xs fill-slate-600"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Teams
                    </text>
                    <text
                      x="15"
                      y="120"
                      textAnchor="middle"
                      transform="rotate(-90 15 120)"
                      className="text-xs fill-slate-600"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Requests
                    </text>

                    {/* Axis lines */}
                    <line
                      x1="50"
                      y1="220"
                      x2="370"
                      y2="220"
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                    <line
                      x1="50"
                      y1="20"
                      x2="50"
                      y2="220"
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />

                    {/* Grid lines */}
                    <line
                      x1="50"
                      y1="140"
                      x2="370"
                      y2="140"
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                    <line
                      x1="150"
                      y1="20"
                      x2="150"
                      y2="220"
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                    <line
                      x1="250"
                      y1="20"
                      x2="250"
                      y2="220"
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />

                    {/* Bubbles - Critical (Few teams, many requests) */}
                    <circle
                      cx="80"
                      cy="80"
                      r="20"
                      fill="#ef4444"
                      opacity="0.7"
                    />
                    <text
                      x="80"
                      y="85"
                      textAnchor="middle"
                      className="text-xs fill-white font-bold"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Q1
                    </text>

                    <circle
                      cx="120"
                      cy="100"
                      r="18"
                      fill="#f97316"
                      opacity="0.7"
                    />
                    <text
                      x="120"
                      y="105"
                      textAnchor="middle"
                      className="text-xs fill-white font-bold"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Q2
                    </text>

                    {/* Bubbles - Good (Normal) */}
                    <circle
                      cx="250"
                      cy="160"
                      r="15"
                      fill="#22c55e"
                      opacity="0.7"
                    />
                    <text
                      x="250"
                      y="165"
                      textAnchor="middle"
                      className="text-xs fill-white font-bold"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Q4
                    </text>

                    <circle
                      cx="310"
                      cy="170"
                      r="14"
                      fill="#3b82f6"
                      opacity="0.7"
                    />
                    <text
                      x="310"
                      y="175"
                      textAnchor="middle"
                      className="text-xs fill-white font-bold"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      Q5
                    </text>
                  </svg>
                </div>

                <div className="mt-6 space-y-3 border-t border-slate-200 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-sm text-slate-600">
                      <span className="font-semibold">Quận 1</span>: 3 teams,
                      240 requests
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-orange-500" />
                    <span className="text-sm text-slate-600">
                      <span className="font-semibold">Quận 2</span>: 4 teams,
                      198 requests
                    </span>
                  </div>
                </div>
              </article>
            </section>

            {/* Incident Hotspots Map */}
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    className="text-xl font-bold text-slate-900"
                    style={{ fontFamily: "var(--font-primary)" }}
                  >
                    Bản đồ điểm sự cố
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Những nơi hay gặp sự cố cần tập trung quản lý
                  </p>
                </div>
                <button className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Map */}
                <div className="lg:col-span-2">
                  <IncidentHotspotsMap />
                </div>

                {/* Legend & Statistics */}
                <div className="space-y-4">
                  <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 w-4 rounded-full bg-red-600" />
                      <span className="font-semibold text-red-900">
                        Rất nghiêm trọng
                      </span>
                    </div>
                    <p className="text-xs text-red-700">24+ sự cố</p>
                  </div>

                  <div className="rounded-lg bg-orange-50 p-4 border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 w-4 rounded-full bg-orange-500" />
                      <span className="font-semibold text-orange-900">
                        Nghiêm trọng
                      </span>
                    </div>
                    <p className="text-xs text-orange-700">15-23 sự cố</p>
                  </div>

                  <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 w-4 rounded-full bg-yellow-500" />
                      <span className="font-semibold text-yellow-900">
                        Trung bình
                      </span>
                    </div>
                    <p className="text-xs text-yellow-700">8-14 sự cố</p>
                  </div>

                  <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 w-4 rounded-full bg-blue-500" />
                      <span className="font-semibold text-blue-900">Thấp</span>
                    </div>
                    <p className="text-xs text-blue-700">&lt; 8 sự cố</p>
                  </div>

                  {/* Top Hotspots */}
                  <div className="border-t pt-4">
                    <p className="font-semibold text-slate-900 text-sm mb-3">
                      Điểm sự cố hàng đầu
                    </p>
                    <div className="space-y-2">
                      {incidentHotspots.slice(0, 3).map((hotspot) => (
                        <div
                          key={hotspot.id}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition"
                        >
                          <p className="text-xs font-medium text-slate-900 truncate">
                            {hotspot.location}
                          </p>
                          <p className="text-xs text-slate-600">
                            {hotspot.incidents} vụ
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Pending Verification Section */}
            {(() => {
              const session = getAuthSession();
              return session?.accessToken ? (
                <PendingVerificationSection accessToken={session.accessToken} />
              ) : null;
            })()}

            {/* Recent Orders */}
            <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center">
                <div>
                  <h3
                    className="text-xl font-bold text-slate-900"
                    style={{ fontFamily: "var(--font-primary)" }}
                  >
                    Recent Orders
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Danh sách yêu cầu gần đây
                  </p>
                </div>
                <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50">
                  Xem tất cả
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <th className="px-4 py-3">
                        <input type="checkbox" className="rounded" />
                      </th>
                      <th className="px-4 py-3">Mã vụ việc</th>
                      <th className="px-4 py-3">Người yêu cầu</th>
                      <th className="px-4 py-3">Dịch vụ</th>
                      <th className="px-4 py-3">Giá trị</th>
                      <th className="px-4 py-3">Hạn xử lý</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <input type="checkbox" className="rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {order.id}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                              {order.initials}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {order.customer}
                              </p>
                              <p className="text-xs text-slate-500">
                                {order.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {order.product}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                          {order.dealValue}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {order.closeDate}
                        </td>
                        <td className="px-4 py-3">
                          {statusBadge(order.status)}
                        </td>
                        <td className="px-4 py-3">
                          <button className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* Inventory Management Section */}
        {activeMenu === "inventory" && <InventorySection />}

        {/* Event Management Section */}
        {activeMenu === "event" && <RescueEventSection />}

        {/* Import/Export Section */}
        {activeMenu === "import-export" && <ImportExportSection />}

        {/* Vehicle Management Section */}
        {activeMenu === "vehicle" && <VehicleManagementSection />}

        {/* Relief Distribution Section */}
        {activeMenu === "relief-distribution" && (
          <ReliefDistributionPage className="h-[calc(100vh-120px)]" />
        )}

        {/* Relief Hotspot Section */}
        {activeMenu === "relief-hotspot" && (
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            <ReliefHotspotMap className="h-[calc(100vh-140px)]" />
          </div>
        )}

        {/* Relief List Section */}
        {activeMenu === "relief-list" && (
          <ReliefRequestsPage className="h-[calc(100vh-120px)]" />
        )}

        {/* Reports Section - Placeholder */}
        {activeMenu === "reports" && (
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3
              className="text-xl font-bold text-slate-900"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Báo cáo & thống kê
            </h3>
            <p className="mt-2 text-slate-600">
              Phần báo cáo đang được phát triển. Sẽ hiển thị các biểu đồ thống
              kê, phân tích tồn kho, và xu hướng tiêu thụ.
            </p>
          </article>
        )}

        {/* Settings Section - Placeholder */}
        {activeMenu === "settings" && (
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3
              className="text-xl font-bold text-slate-900"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Cài đặt
            </h3>
            <p className="mt-2 text-slate-600">
              Phần cài đặt đang được phát triển. Sẽ có các tùy chọn cấu hình
              kho, ngưỡng cảnh báo, và quản lý quyền.
            </p>
          </article>
        )}
      </div>
    </div>
  );
}
