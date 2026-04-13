import React, { useEffect, useMemo, useRef, useState } from "react";
import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";
import {
  Bell,
  BookText,
  ClipboardCheck,
  Crosshair,
  FolderKanban,
  LayoutGrid,
  LifeBuoy,
  Map,
  MapPin,
  Phone,
  Rocket,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

type MissionPriority = "Khẩn cấp" | "Cao" | "Trung bình";
type MissionStatus =
  | "Chờ nhận"
  | "Đang di chuyển"
  | "Đang xử lý"
  | "Đã hoàn tất"
  | "Tạm dừng";

type Mission = {
  id: string;
  code: string;
  type: "Cứu hộ" | "Cứu trợ";
  title: string;
  requester: string;
  phone: string;
  address: string;
  priority: MissionPriority;
  summary: string;
  assignedTeam: string;
  coord: {
    lat: number;
    lng: number;
  };
};

type MissionLog = {
  id: string;
  missionId: string;
  time: string;
  content: string;
};

const missions: Mission[] = [
  {
    id: "rg-4492-d",
    code: "RG-4492-D",
    type: "Cứu hộ",
    title: "Cứu hộ khe nứt băng hà",
    requester: "Arthur Miller",
    phone: "(+84) 909 228 721",
    address: "North-West Ridge, Delta 7",
    priority: "Khẩn cấp",
    summary:
      "Nạn nhân bị ngã vào khe nứt nông, có dấu hiệu hạ thân nhiệt. Tín hiệu định vị còn hoạt động.",
    assignedTeam: "Đội phản ứng nhanh Alpha-2",
    coord: { lat: 10.7769, lng: 106.7009 },
  },
  {
    id: "rg-4510-b",
    code: "RG-4510-B",
    type: "Cứu hộ",
    title: "Sơ tán nhóm leo núi mắc kẹt",
    requester: "Lê Khánh Hà",
    phone: "(+84) 901 712 198",
    address: "Sườn Đông Glacier Pass, Delta 5",
    priority: "Cao",
    summary:
      "Nhóm 3 người mắc kẹt do gió lớn, không thể tự di chuyển xuống trạm an toàn.",
    assignedTeam: "Đội cứu nạn Bravo-1",
    coord: { lat: 16.0471, lng: 108.2068 },
  },
  {
    id: "rg-4522-a",
    code: "RG-4522-A",
    type: "Cứu trợ",
    title: "Tiếp tế y tế khẩn cấp",
    requester: "Trạm y tế Delta",
    phone: "(+84) 283 811 2299",
    address: "Khu nhà tạm tuyến 3, Delta 2",
    priority: "Trung bình",
    summary:
      "Yêu cầu cấp phát thuốc chống lạnh và oxy cho nhóm cư dân đang trú ẩn.",
    assignedTeam: "Đội hậu cần Charlie",
    coord: { lat: 21.0285, lng: 105.8542 },
  },
];

const leftMenu = [
  { icon: LayoutGrid, label: "Trung tâm điều hành", id: "dashboard" },
  { icon: Map, label: "Bản đồ nhiệm vụ", id: "map" },
  { icon: FolderKanban, label: "Nhiệm vụ hiện tại", id: "missions" },
  { icon: UserRound, label: "Trạng thái đội ngũ", id: "team" },
  { icon: BookText, label: "Báo cáo", id: "reports" },
];

const statusStyles: Record<MissionStatus, string> = {
  "Chờ nhận": "bg-surface-container-high text-on-surface-variant",
  "Đang di chuyển": "bg-blue-950/10 text-blue-950",
  "Đang xử lý": "bg-amber-100 text-amber-800",
  "Đã hoàn tất": "bg-emerald-100 text-emerald-700",
  "Tạm dừng": "bg-error-container text-error",
};

const priorityStyles: Record<MissionPriority, string> = {
  "Khẩn cấp": "bg-error-container text-error",
  Cao: "bg-amber-100 text-amber-800",
  "Trung bình": "bg-blue-100 text-blue-800",
};

export const RescueTeamMission: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState("map");
  const [selectedMissionId, setSelectedMissionId] = useState(missions[0].id);
  const [statusMap, setStatusMap] = useState<Record<string, MissionStatus>>({
    "rg-4492-d": "Chờ nhận",
    "rg-4510-b": "Đang di chuyển",
    "rg-4522-a": "Chờ nhận",
  });
  const [logs, setLogs] = useState<MissionLog[]>([
    {
      id: "log-1",
      missionId: "rg-4510-b",
      time: "10:22",
      content: "Đội Bravo-1 đã rời trạm và đang di chuyển đến điểm tập kết.",
    },
  ]);
  const [reportStatus, setReportStatus] = useState<MissionStatus>("Đang xử lý");
  const [reportText, setReportText] = useState("");
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<vietmapgl.Map | null>(null);
  const markersRef = useRef<vietmapgl.Marker[]>([]);

  const vietmapApiKey = (import.meta.env.VITE_VIETMAP_API_KEY ?? "").trim();
  const hasVietmapKey = vietmapApiKey.length > 0;

  const isWithinVietnamBounds = (lat: number, lng: number) =>
    lat >= 8.0 && lat <= 24.5 && lng >= 102.0 && lng <= 110.0;

  const selectedMission =
    missions.find((mission) => mission.id === selectedMissionId) ?? missions[0];

  const canUseVietmap =
    hasVietmapKey &&
    isWithinVietnamBounds(selectedMission.coord.lat, selectedMission.coord.lng);

  const mapSrc = useMemo(() => {
    const { lat, lng } = selectedMission.coord;
    const bbox = `${lng - 0.02}%2C${lat - 0.02}%2C${lng + 0.02}%2C${lat + 0.02}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  }, [selectedMission]);

  useEffect(() => {
    if (!canUseVietmap || !mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new vietmapgl.Map({
      container: mapContainerRef.current,
      style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${vietmapApiKey}`,
      center: [selectedMission.coord.lng, selectedMission.coord.lat],
      zoom: 13,
    });

    map.addControl(new vietmapgl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [
    canUseVietmap,
    selectedMission.coord.lat,
    selectedMission.coord.lng,
    vietmapApiKey,
  ]);

  useEffect(() => {
    if (!canUseVietmap || !mapRef.current) {
      return;
    }

    const map = mapRef.current;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = missions.map((mission) => {
      const isSelected = mission.id === selectedMission.id;
      const marker = new vietmapgl.Marker({
        color: isSelected ? "#ba1a1a" : "#001f3f",
      })
        .setLngLat([mission.coord.lng, mission.coord.lat])
        .setPopup(
          new vietmapgl.Popup({ offset: 12 }).setHTML(
            `<strong>${mission.code}</strong><br/>${mission.title}`,
          ),
        )
        .addTo(map);

      marker.getElement().addEventListener("click", () => {
        setSelectedMissionId(mission.id);
        setReportStatus(statusMap[mission.id] ?? "Đang di chuyển");
      });

      return marker;
    });

    map.flyTo({
      center: [selectedMission.coord.lng, selectedMission.coord.lat],
      zoom: 14,
      essential: true,
      duration: 900,
    });
  }, [canUseVietmap, selectedMission, statusMap]);

  const currentLogs = logs
    .filter((item) => item.missionId === selectedMission.id)
    .slice()
    .reverse();

  const handleAcceptMission = (missionId: string) => {
    setStatusMap((prev) => ({ ...prev, [missionId]: "Đang di chuyển" }));
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}`,
        missionId,
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        content: "Đội cứu hộ đã tiếp nhận nhiệm vụ và bắt đầu di chuyển.",
      },
    ]);
  };

  const handleSubmitReport = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reportText.trim()) {
      return;
    }

    setStatusMap((prev) => ({ ...prev, [selectedMission.id]: reportStatus }));
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}`,
        missionId: selectedMission.id,
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        content: `Cập nhật ${reportStatus}: ${reportText}`,
      },
    ]);
    setReportText("");
  };

  return (
    <div className="h-screen bg-[#dfe3e8] overflow-hidden font-sans text-on-surface">
      <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] h-full">
        <aside className="hidden lg:flex flex-col bg-[#edf0f3] border-r border-[#d1d7df] font-primary">
          <div className="px-6 py-5 border-b border-[#d1d7df]">
            <h2 className="text-3xl tracking-tight font-black text-blue-950">
              RescueHub
            </h2>
          </div>

          <nav className="px-4 py-5 space-y-1">
            {leftMenu.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl transition-colors ${
                  activeMenu === item.id
                    ? "bg-blue-950/10 text-blue-950"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <item.icon size={18} />
                <span className="font-semibold text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto px-4 pb-6">
            <button
              type="button"
              className="w-full rounded-2xl bg-blue-950 text-white px-4 py-3.5 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-950/25"
            >
              <Rocket size={16} />
              Triển khai đơn vị
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex flex-col">
          <header className="h-16 bg-[#f0f2f5] border-b border-[#d1d7df] px-4 md:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-6 h-6 rounded-md bg-blue-950 lg:hidden" />
              <div className="hidden md:flex items-center bg-white border border-[#d4dbe3] rounded-lg px-3 py-2 min-w-[260px]">
                <Crosshair size={14} className="text-on-surface-variant" />
                <input
                  className="ml-2 text-sm bg-transparent outline-none w-full"
                  placeholder="Tìm kiếm mã nhiệm vụ..."
                />
              </div>
            </div>

            <div className="flex items-center gap-4 text-on-surface-variant">
              <Bell size={18} />
              <Settings size={18} />
              <div className="w-8 h-8 rounded-full bg-blue-950 text-white grid place-items-center text-xs font-bold">
                AG
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_430px] gap-4 p-4 md:p-6 h-[calc(100vh-4rem)]">
            {/* MAP VIEW */}
            {activeMenu === "map" && (
              <>
                <article className="relative rounded-2xl overflow-hidden bg-[#cfd4db] min-h-[520px] h-full">
                  {canUseVietmap ? (
                    <div
                      ref={mapContainerRef}
                      className="w-full h-full"
                      aria-label="Bản đồ nhiệm vụ cứu hộ"
                    />
                  ) : (
                    <iframe
                      title="Bản đồ nhiệm vụ cứu hộ"
                      src={mapSrc}
                      className="w-full h-full"
                      loading="lazy"
                    />
                  )}

                  {!hasVietmapKey && (
                    <div className="absolute top-5 right-5 bg-amber-100 text-amber-900 px-3 py-2 rounded-lg text-xs font-bold border border-amber-300">
                      Chưa có VITE_VIETMAP_API_KEY, đang hiển thị bản đồ dự
                      phòng.
                    </div>
                  )}

                  {hasVietmapKey && !canUseVietmap && (
                    <div className="absolute top-5 right-5 bg-amber-100 text-amber-900 px-3 py-2 rounded-lg text-xs font-bold border border-amber-300 max-w-[280px]">
                      Tọa độ nhiệm vụ đang ngoài vùng phủ dữ liệu Việt Nam của
                      Vietmap, đang hiển thị bản đồ dự phòng.
                    </div>
                  )}

                  <div className="absolute top-5 left-5 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-md border border-white/70">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">
                      Tọa độ trực tiếp
                    </p>
                    <p className="text-sm font-black font-primary text-on-surface mt-1">
                      {selectedMission.coord.lat.toFixed(4)}° N,{" "}
                      {selectedMission.coord.lng.toFixed(4)}° E
                    </p>
                  </div>

                  <div className="absolute bottom-5 left-5 bg-blue-950 text-white px-4 py-2 rounded-xl font-primary font-bold text-sm shadow-lg">
                    {selectedMission.address}
                  </div>
                </article>

                <aside className="rounded-2xl bg-[#d7dce2] border border-[#c8ced6] p-5 md:p-6 overflow-auto">
                  <h3 className="text-sm uppercase tracking-[0.18em] font-bold text-on-surface-variant font-primary">
                    Nhiệm vụ hiện tại
                  </h3>

                  <div className="mt-3 overflow-hidden rounded-xl border border-[#c7ced7] bg-[#e9edf1]">
                    <table className="w-full table-fixed text-sm">
                      <thead className="bg-[#dde3e8] text-on-surface-variant">
                        <tr className="text-left">
                          <th className="px-3 py-2 font-primary font-bold">
                            Mã
                          </th>
                          <th className="px-3 py-2 font-primary font-bold">
                            Loại
                          </th>
                          <th className="px-3 py-2 font-primary font-bold">
                            Nhiệm vụ
                          </th>
                          <th className="px-3 py-2 font-primary font-bold">
                            Trạng thái
                          </th>
                          <th className="px-3 py-2 font-primary font-bold">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const mission = selectedMission;
                          const missionStatus =
                            statusMap[mission.id] ?? "Chờ nhận";

                          return (
                            <tr className="border-t border-[#c7ced7] bg-blue-950/5">
                              <td className="px-3 py-2 font-primary font-black text-blue-950">
                                {mission.code}
                              </td>
                              <td className="px-3 py-2">
                                <span className="inline-flex px-2 py-1 rounded-md bg-blue-950/10 text-blue-950 text-xs font-semibold">
                                  {mission.type}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <p className="font-semibold text-on-surface">
                                  {mission.title}
                                </p>
                                <p className="text-xs text-on-surface-variant truncate">
                                  {mission.address}
                                </p>
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`text-[11px] px-2 py-1 rounded-md font-semibold ${statusStyles[missionStatus]}`}
                                >
                                  {missionStatus}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                {missionStatus === "Chờ nhận" ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAcceptMission(mission.id)
                                    }
                                    className="text-xs bg-blue-950 text-white px-3 py-1.5 rounded-lg font-bold font-primary"
                                  >
                                    Nhận
                                  </button>
                                ) : (
                                  <span className="text-xs text-on-surface-variant">
                                    Đang theo dõi
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-5 rounded-2xl bg-[#e7ebef] border border-[#d4dbe3] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-black text-[#1f2329] font-primary">
                        Chi tiết yêu cầu
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase ${priorityStyles[selectedMission.priority]}`}
                      >
                        {selectedMission.priority}
                      </span>
                    </div>

                    <h4 className="text-2xl font-black text-[#1f2329] mt-2 font-primary">
                      {selectedMission.title}
                    </h4>

                    <div className="space-y-2 mt-3 text-sm text-[#3f4650]">
                      <p className="flex items-start gap-2">
                        <MapPin size={15} className="text-blue-950 mt-0.5" />
                        {selectedMission.address}
                      </p>
                      <p className="flex items-start gap-2">
                        <UserRound size={15} className="text-blue-950 mt-0.5" />
                        Người báo tin: {selectedMission.requester}
                      </p>
                      <p className="flex items-start gap-2">
                        <Phone size={15} className="text-blue-950 mt-0.5" />
                        Số liên hệ: {selectedMission.phone}
                      </p>
                      <p className="flex items-start gap-2">
                        <Users size={15} className="text-blue-950 mt-0.5" />
                        Đơn vị tiếp nhận: {selectedMission.assignedTeam}
                      </p>
                    </div>

                    <p className="mt-3 text-sm text-[#3f4650] leading-relaxed">
                      {selectedMission.summary}
                    </p>
                  </div>

                  <form
                    className="mt-5 space-y-3"
                    onSubmit={handleSubmitReport}
                  >
                    <h3 className="text-sm uppercase tracking-[0.16em] font-bold text-on-surface-variant font-primary">
                      Cập nhật trạng thái và báo cáo kết quả
                    </h3>

                    <label className="block text-xs font-semibold text-on-surface-variant">
                      Trạng thái thực hiện
                      <select
                        value={reportStatus}
                        onChange={(event) =>
                          setReportStatus(event.target.value as MissionStatus)
                        }
                        className="w-full mt-1 rounded-lg border border-[#c7ced7] bg-[#eef2f5] px-3 py-2 text-sm"
                      >
                        <option>Đang di chuyển</option>
                        <option>Đang xử lý</option>
                        <option>Đã hoàn tất</option>
                        <option>Tạm dừng</option>
                      </select>
                    </label>

                    <label className="block text-xs font-semibold text-on-surface-variant">
                      Báo cáo hiện trường
                      <textarea
                        value={reportText}
                        onChange={(event) => setReportText(event.target.value)}
                        rows={3}
                        placeholder="Nhập diễn biến, kết quả xử lý, nhu cầu hỗ trợ bổ sung..."
                        className="w-full mt-1 rounded-lg border border-[#c7ced7] bg-[#eef2f5] px-3 py-2 text-sm resize-none"
                      />
                    </label>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-[#007399] hover:bg-[#006483] text-white py-3 font-black font-primary text-lg shadow-md"
                    >
                      Gửi cập nhật cứu hộ
                    </button>
                  </form>
                </aside>
              </>
            )}

            {/* MISSIONS TABLE VIEW */}
            {activeMenu === "missions" && (
              <div className="col-span-1 xl:col-span-2 rounded-2xl bg-white border border-[#c8ced6] p-6 overflow-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-blue-950 font-primary">
                    Danh sách nhiệm vụ hiện tại
                  </h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Quản lý và theo dõi các nhiệm vụ cứu hộ / cứu trợ
                  </p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#c7ced7]">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f0f2f5] text-on-surface-variant">
                      <tr className="text-left border-b border-[#c7ced7]">
                        <th className="px-4 py-3 font-primary font-bold">Mã</th>
                        <th className="px-4 py-3 font-primary font-bold">
                          Loại
                        </th>
                        <th className="px-4 py-3 font-primary font-bold">
                          Nhiệm vụ
                        </th>
                        <th className="px-4 py-3 font-primary font-bold">
                          Địa chỉ
                        </th>
                        <th className="px-4 py-3 font-primary font-bold">
                          Yêu cầu
                        </th>
                        <th className="px-4 py-3 font-primary font-bold">
                          Ưu tiên
                        </th>
                        <th className="px-4 py-3 font-primary font-bold">
                          Trạng thái
                        </th>
                        <th className="px-4 py-3 font-primary font-bold">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {missions.map((mission) => {
                        const missionStatus =
                          statusMap[mission.id] ?? "Chờ nhận";

                        return (
                          <tr
                            key={mission.id}
                            className="border-t border-[#c7ced7] hover:bg-[#f9fafb]"
                          >
                            <td className="px-4 py-3 font-primary font-black text-blue-950">
                              {mission.code}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                  mission.type === "Cứu hộ"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {mission.type}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-on-surface">
                                {mission.title}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-sm text-on-surface-variant">
                              {mission.address}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {mission.requester}
                              <br />
                              <span className="text-xs text-on-surface-variant">
                                {mission.phone}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs px-2 py-1 rounded-md font-bold uppercase ${priorityStyles[mission.priority]}`}
                              >
                                {mission.priority}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs px-2 py-1 rounded-md font-semibold ${statusStyles[missionStatus]}`}
                              >
                                {missionStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {missionStatus === "Chờ nhận" ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleAcceptMission(mission.id);
                                    setSelectedMissionId(mission.id);
                                    setReportStatus("Đang di chuyển");
                                    setActiveMenu("map");
                                  }}
                                  className="text-xs bg-blue-950 text-white px-3 py-1.5 rounded-lg font-bold font-primary hover:bg-blue-900"
                                >
                                  Nhận và xem
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedMissionId(mission.id);
                                    setReportStatus(missionStatus);
                                    setActiveMenu("map");
                                  }}
                                  className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold"
                                >
                                  Xem chi tiết
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                    <p className="text-sm font-semibold text-blue-900">
                      Tổng nhiệm vụ
                    </p>
                    <p className="text-3xl font-black text-blue-950 mt-1">
                      {missions.length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                    <p className="text-sm font-semibold text-amber-900">
                      Chờ nhận
                    </p>
                    <p className="text-3xl font-black text-amber-700 mt-1">
                      {
                        missions.filter(
                          (m) => (statusMap[m.id] ?? "Chờ nhận") === "Chờ nhận",
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PLACEHOLDER FOR OTHER VIEWS */}
            {activeMenu !== "map" && activeMenu !== "missions" && (
              <div className="col-span-1 xl:col-span-2 rounded-2xl bg-white border border-[#c8ced6] p-6 flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-lg font-black text-blue-950 font-primary">
                    {leftMenu.find((m) => m.id === activeMenu)?.label}
                  </p>
                  <p className="text-sm text-on-surface-variant mt-2">
                    Chức năng này đang được phát triển
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
