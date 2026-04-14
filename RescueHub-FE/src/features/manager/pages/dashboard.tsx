import React, { useState, useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Bell,
  ChevronDown,
  Clock,
  DollarSign,
  FileText,
  Filter,
  HardDrive,
  Home,
  Landmark,
  LifeBuoy,
  List,
  MoreVertical,
  Phone,
  Search,
  ShieldCheck,
  TrendingUp,
  Trash2,
  Users,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

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
        HCM Service Coverage
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

interface ChartTooltip {
  visible: boolean;
  x: number;
  y: number;
  month: string;
  sales: number;
  revenue: number;
}

function StatisticsChart() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [monthsToShow, setMonthsToShow] = useState(12);
  const [startIndex, setStartIndex] = useState(0);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<ChartTooltip>({
    visible: false,
    x: 0,
    y: 0,
    month: "",
    sales: 0,
    revenue: 0,
  });

  // Lọc dữ liệu hiển thị
  const visibleMonths = months.slice(startIndex, startIndex + monthsToShow);
  const visiblePrimary = monthlyPrimary.slice(
    startIndex,
    startIndex + monthsToShow,
  );
  const visibleSecondary = monthlySecondary.slice(
    startIndex,
    startIndex + monthsToShow,
  );

  // Tính toán khoảng cách điểm dữ liệu dựa trên số tháng hiển thị
  const pointSpacing = 900 / (monthsToShow - 1 || 1);

  const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
    const svg = e.currentTarget.parentElement as unknown as SVGElement;
    const rect = svg.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const svgX = (x / rect.width) * 1000;

    // Tính toán index dựa trên vị trí mouse
    const index = Math.round((svgX - 50) / pointSpacing);

    if (index >= 0 && index < visibleMonths.length) {
      setHoveredIndex(index);
      setTooltip({
        visible: true,
        x: svgX,
        y: 50,
        month: visibleMonths[index],
        sales: visiblePrimary[index],
        revenue: visibleSecondary[index],
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltip({ ...tooltip, visible: false });
  };

  const handleZoom = (direction: "in" | "out") => {
    if (direction === "in") {
      // Zoom in: 12 → 6 → 3
      if (monthsToShow === 12) {
        setMonthsToShow(6);
        setStartIndex(0);
      } else if (monthsToShow === 6) {
        setMonthsToShow(3);
        setStartIndex(0);
      }
    } else {
      // Zoom out: 3 → 6 → 12
      if (monthsToShow === 3) {
        setMonthsToShow(6);
        setStartIndex(0);
      } else if (monthsToShow === 6) {
        setMonthsToShow(12);
        setStartIndex(0);
      }
    }
    setHoveredIndex(null);
  };

  const handleResetZoom = () => {
    setMonthsToShow(12);
    setStartIndex(0);
    setHoveredIndex(null);
  };

  // Xử lý scroll/pan
  const handleScroll = (direction: "left" | "right") => {
    if (monthsToShow >= 12) return; // chỉ pan khi đã zoom

    if (direction === "left") {
      setStartIndex(Math.max(0, startIndex - 1));
    } else {
      setStartIndex(Math.min(months.length - monthsToShow, startIndex + 1));
    }
  };

  // Xử lý wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // deltaY < 0 = lằn lên = zoom in
    // deltaY > 0 = lằn xuống = zoom out
    if (e.deltaY < 0) {
      handleZoom("in");
    } else {
      handleZoom("out");
    }
  };

  // Setup wheel event listener với passive: false để prevent default scroll
  useEffect(() => {
    const handleWheelEvent = (e: WheelEvent) => {
      if (
        chartContainerRef.current &&
        chartContainerRef.current.contains(e.target as Node)
      ) {
        e.preventDefault();
        e.stopPropagation();

        if (e.deltaY < 0) {
          // Zoom in: 12 → 6 → 3
          setMonthsToShow((prev) => {
            if (prev === 12) {
              setStartIndex(0);
              return 6;
            } else if (prev === 6) {
              setStartIndex(0);
              return 3;
            }
            return prev;
          });
        } else {
          // Zoom out: 3 → 6 → 12
          setMonthsToShow((prev) => {
            if (prev === 3) {
              setStartIndex(0);
              return 6;
            } else if (prev === 6) {
              setStartIndex(0);
              return 12;
            }
            return prev;
          });
        }
        setHoveredIndex(null);
      }
    };

    const container = chartContainerRef.current;
    if (container) {
      // Sử dụng passive: false để có thể gọi preventDefault
      container.addEventListener("wheel", handleWheelEvent, { passive: false });
      return () => {
        container.removeEventListener("wheel", handleWheelEvent);
      };
    }
  }, []);

  return (
    <div className="relative">
      {/* Zoom Controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => handleZoom("in")}
            disabled={monthsToShow === 3}
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom in - Hiển thị ít tháng hơn"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleZoom("out")}
            disabled={monthsToShow === 12}
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom out - Xem toàn bộ"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleResetZoom}
            disabled={monthsToShow === 12 && startIndex === 0}
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reset về 12 tháng"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Pan Controls - chỉ hiển thị khi zoom */}
        {monthsToShow < 12 && (
          <div className="flex gap-2">
            <button
              onClick={() => handleScroll("left")}
              disabled={startIndex === 0}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Trước
            </button>
            <button
              onClick={() => handleScroll("right")}
              disabled={startIndex + monthsToShow >= months.length}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau →
            </button>
          </div>
        )}

        {/* Zoom level indicator */}
        <span className="text-xs font-medium text-slate-500">
          {monthsToShow} tháng
        </span>
      </div>

      <div
        ref={chartContainerRef}
        className="overflow-y-hidden overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4"
        style={{ touchAction: "none" }}
      >
        <svg viewBox="0 0 1000 280" className="min-w-[900px]">
          <defs>
            <linearGradient id="fillPrimary" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {Array.from({ length: 5 }).map((_, i) => {
            const y = 50 + i * 40;
            return (
              <line
                key={y}
                x1={50}
                x2={950}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            );
          })}

          {/* Month labels */}
          {visibleMonths.map((m, i) => (
            <text
              key={`${m}-${startIndex}`}
              x={50 + i * pointSpacing}
              y={270}
              fill="#64748b"
              fontSize="13"
              fontFamily="var(--font-primary)"
              textAnchor="middle"
            >
              {m}
            </text>
          ))}

          {/* Primary area fill */}
          <polyline
            fill="url(#fillPrimary)"
            stroke="none"
            points={
              visiblePrimary
                .map((v, i) => `${50 + i * pointSpacing},${220 - v / 1.5}`)
                .join(" ") + ` 950,220 50,220`
            }
          />

          {/* Primary line */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            points={visiblePrimary
              .map((v, i) => `${50 + i * pointSpacing},${220 - v / 1.5}`)
              .join(" ")}
          />

          {/* Secondary line */}
          <polyline
            fill="none"
            stroke="#93c5fd"
            strokeWidth="2"
            strokeDasharray="5,5"
            points={visibleSecondary
              .map((v, i) => `${50 + i * pointSpacing},${220 - v / 1.5}`)
              .join(" ")}
          />

          {/* Data points on hover */}
          {hoveredIndex !== null && (
            <>
              {/* Vertical line */}
              <line
                x1={50 + hoveredIndex * pointSpacing}
                x2={50 + hoveredIndex * pointSpacing}
                y1={40}
                y2={220}
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="4,4"
                opacity="0.6"
              />
              {/* Primary point */}
              <circle
                cx={50 + hoveredIndex * pointSpacing}
                cy={220 - visiblePrimary[hoveredIndex] / 1.5}
                r="5"
                fill="#3b82f6"
                stroke="#fff"
                strokeWidth="2"
              />
              {/* Secondary point */}
              <circle
                cx={50 + hoveredIndex * pointSpacing}
                cy={220 - visibleSecondary[hoveredIndex] / 1.5}
                r="5"
                fill="#93c5fd"
                stroke="#fff"
                strokeWidth="2"
              />
            </>
          )}

          {/* Invisible overlay for mouse tracking */}
          <rect
            x="50"
            y="40"
            width="900"
            height="180"
            fill="transparent"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: "crosshair" }}
          />
        </svg>
      </div>

      {/* Scroll wheel hint */}
      <p className="mt-2 text-xs text-slate-400">
        💡 Tip: Lăn chuột để zoom in/out (lên = zoom chi tiết, xuống = xem toàn
        bộ)
      </p>

      {/* Tooltip */}
      {tooltip.visible && hoveredIndex !== null && (
        <div
          className="absolute left-0 top-0 z-20 rounded-lg border border-slate-300 bg-white p-4 shadow-lg"
          style={{
            left: `${Math.min(tooltip.x * 0.9, 400)}px`,
            top: "20px",
          }}
        >
          <p className="font-semibold text-slate-900">{tooltip.month}</p>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-slate-600">Sales:</span>
              <span className="font-semibold text-slate-900">
                {visiblePrimary[hoveredIndex]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-300" />
              <span className="text-slate-600">Revenue:</span>
              <span className="font-semibold text-slate-900">
                {visibleSecondary[hoveredIndex]}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ManagerDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6 md:p-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Header */}
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
                Statistics
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
                Avg. chi phí điều phối / tháng
              </p>
              <div className="mt-2 flex items-end gap-3">
                <p className="text-2xl font-bold text-slate-900">₫212.1M</p>
                {changeBadge("+23.2%", true)}
              </div>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100 p-4">
              <p className="text-xs font-medium text-slate-600 uppercase">
                Avg. chi phí phát sinh
              </p>
              <div className="mt-2 flex items-end gap-3">
                <p className="text-2xl font-bold text-slate-900">₫30.3M</p>
                {changeBadge("-12.3%", false)}
              </div>
            </div>
          </div>

          <StatisticsChart />
        </section>

        {/* HCM Map & June Goals */}
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3
                  className="text-xl font-bold text-slate-900"
                  style={{ fontFamily: "var(--font-primary)" }}
                >
                  Service Coverage
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  HCM city distribution with MapLibre GL
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
                  June Goals
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Mục tiêu ngân sách
                </p>
              </div>
              <button className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8">
              <svg viewBox="0 0 360 180" className="w-full">
                <path
                  d="M 30 150 A 120 120 0 0 1 330 150"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M 30 150 A 120 120 0 0 1 290 120"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <text
                  x="180"
                  y="85"
                  textAnchor="middle"
                  className="fill-slate-600 text-sm"
                  style={{ fontFamily: "var(--font-primary)" }}
                >
                  June Goals
                </text>
                <text
                  x="180"
                  y="125"
                  textAnchor="middle"
                  className="fill-slate-900 text-4xl font-bold"
                  style={{ fontFamily: "var(--font-primary)" }}
                >
                  $90K
                </text>
              </svg>
            </div>

            <div className="mt-8 space-y-4 border-t border-slate-200 pt-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">
                    Marketing
                  </p>
                  <p className="text-sm font-semibold text-slate-900">85%</p>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 w-[85%] rounded-full bg-blue-500" />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">
                    Operations
                  </p>
                  <p className="text-sm font-semibold text-slate-900">55%</p>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 w-[55%] rounded-full bg-blue-500" />
                </div>
              </div>
            </div>
          </article>
        </section>

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
                      <p className="font-semibold text-slate-900">{order.id}</p>
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
                    <td className="px-4 py-3">{statusBadge(order.status)}</td>
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
      </div>
    </div>
  );
}
