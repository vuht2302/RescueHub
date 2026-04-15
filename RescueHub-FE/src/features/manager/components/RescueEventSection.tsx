import React, { useState } from "react";
import { MoreVertical } from "lucide-react";
import { RescueEvent } from "./types";

export function RescueEventSection() {
  const [events] = useState<RescueEvent[]>([
    {
      id: "EV001",
      name: "Cứu hộ lũ lụt khu vực Tây Nam",
      description: "Cứu hộ công dân bị nước lũ cô lập ở các xã biên",
      date: "2026-04-18",
      startTime: "06:00",
      endTime: "18:00",
      location: "Xã An Phú, Huyện An Phu, An Giang",
      latitude: 10.3031,
      longitude: 104.7795,
      type: "evacuation",
      priority: "critical",
      status: "ongoing",
      team: "Đội cứu hộ miền Tây",
      requiredResources: ["Thuyền cứu hộ", "Áo phao", "Dây cứu", "Y tế"],
      budget: "₫450,000,000",
      createdAt: "2026-04-17 14:30",
      createdBy: "Manager",
    },
    {
      id: "EV002",
      name: "Triển khai cứu trợ vùng sạt lở đất",
      description: "Cứu trợ nhân đạo và tái định cư sau thảm họa sạt lở",
      date: "2026-04-20",
      startTime: "08:00",
      endTime: "17:00",
      location: "Huyện Bắc Trà My, Quảng Nam",
      latitude: 15.4333,
      longitude: 108.5667,
      type: "relief",
      priority: "high",
      status: "planning",
      team: "Đội cứu trợ miền Trung",
      requiredResources: ["Lương thực", "Nước sạch", "Y tế", "Nơi trú ẩn tạm"],
      budget: "₫230,000,000",
      createdAt: "2026-04-16 10:15",
      createdBy: "Manager",
    },
    {
      id: "EV003",
      name: "Hỗ trợ y tế khẩn cấp sau tai nạn giao thông",
      description: "Quản lý và hỗ trợ y tế cho nạn nhân tai nạn xe",
      date: "2026-04-19",
      startTime: "14:00",
      endTime: "20:00",
      location: "Đại lộ Thăng Long, Hà Nội",
      latitude: 21.0285,
      longitude: 105.8581,
      type: "medical",
      priority: "high",
      status: "completed",
      team: "Đội y tế khẩn cấp",
      requiredResources: ["Xe cứu thương", "Thuốc", "Dụng cụ y tế"],
      budget: "₫85,000,000",
      createdAt: "2026-04-18 13:45",
      createdBy: "Manager",
    },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    startTime: "08:00",
    endTime: "17:00",
    location: "",
    type: "relief",
    priority: "medium",
    team: "",
    budget: "",
  });

  const getEventTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      relief: "Cứu trợ",
      rescue: "Cứu hộ",
      evacuation: "Sơ tán",
      medical: "Y tế",
      other: "Khác",
    };
    return labels[type] || type;
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "relief":
        return "bg-green-50 text-green-600 border-green-200";
      case "rescue":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "evacuation":
        return "bg-orange-50 text-orange-600 border-orange-200";
      case "medical":
        return "bg-red-50 text-red-600 border-red-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: { [key: string]: string } = {
      low: "Thấp",
      medium: "Trung bình",
      high: "Cao",
      critical: "Rất cao",
    };
    return labels[priority] || priority;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-blue-50 text-blue-600";
      case "medium":
        return "bg-yellow-50 text-yellow-600";
      case "high":
        return "bg-orange-50 text-orange-600";
      case "critical":
        return "bg-red-50 text-red-600";
      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      planning: "Lên kế hoạch",
      ongoing: "Đang triển khai",
      completed: "Hoàn tất",
      cancelled: "Hủy bỏ",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-slate-50 text-slate-600";
      case "ongoing":
        return "bg-blue-50 text-blue-600";
      case "completed":
        return "bg-emerald-50 text-emerald-600";
      case "cancelled":
        return "bg-red-50 text-red-600";
      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateEvent = () => {
    if (
      !formData.name ||
      !formData.date ||
      !formData.location ||
      !formData.team
    ) {
      alert("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }
    setFormData({
      name: "",
      description: "",
      date: "",
      startTime: "08:00",
      endTime: "17:00",
      location: "",
      type: "relief",
      priority: "medium",
      team: "",
      budget: "",
    });
    setShowForm(false);
    alert("Sự kiện đã được tạo thành công!");
  };

  return (
    <section className="space-y-6">
      {/* Relief Requests Statistics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3
                className="text-xl font-bold text-slate-900"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                Yêu cầu cứu trợ từ công dân
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Các yêu cầu cứu trợ được tạo bởi công dân
              </p>
            </div>
            <button className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 space-y-3">
            <div className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    Lũ lụt khu vực Tây Nam - Cần Thơ
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Yêu cầu từ: Nguyễn Văn A
                  </p>
                </div>
                <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-red-50 text-red-600">
                  Nguy hiểm
                </span>
              </div>
              <p className="text-xs text-slate-500">Ngày: 2026-04-15 14:30</p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    Sạt lở đất Huyện Bắc Trà My
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Yêu cầu từ: Trần Thị B
                  </p>
                </div>
                <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-orange-50 text-orange-600">
                  Cao
                </span>
              </div>
              <p className="text-xs text-slate-500">Ngày: 2026-04-14 09:45</p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    Hỗ trợ nhân đạo sau bão - Hải Phòng
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Yêu cầu từ: Lê Văn C
                  </p>
                </div>
                <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-yellow-50 text-yellow-600">
                  Trung bình
                </span>
              </div>
              <p className="text-xs text-slate-500">Ngày: 2026-04-13 16:20</p>
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
                Khu vực có nhiều yêu cầu nhất
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Thống kê số lượng yêu cầu cứu trợ theo khu vực
              </p>
            </div>
            <button className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6">
            <svg viewBox="0 0 400 280" className="w-full">
              <rect
                x="30"
                y="40"
                width="40"
                height="160"
                fill="#ef4444"
                rx="4"
              />
              <text
                x="50"
                y="220"
                textAnchor="middle"
                className="text-sm fill-slate-600"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                Cần Thơ
              </text>
              <text
                x="50"
                y="30"
                textAnchor="middle"
                className="text-sm fill-slate-900 font-bold"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                78
              </text>

              <rect
                x="95"
                y="60"
                width="40"
                height="140"
                fill="#f97316"
                rx="4"
              />
              <text
                x="115"
                y="220"
                textAnchor="middle"
                className="text-sm fill-slate-600"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                Quảng Nam
              </text>
              <text
                x="115"
                y="50"
                textAnchor="middle"
                className="text-sm fill-slate-900 font-bold"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                64
              </text>

              <rect
                x="160"
                y="80"
                width="40"
                height="120"
                fill="#eab308"
                rx="4"
              />
              <text
                x="180"
                y="220"
                textAnchor="middle"
                className="text-sm fill-slate-600"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                Hải Phòng
              </text>
              <text
                x="180"
                y="70"
                textAnchor="middle"
                className="text-sm fill-slate-900 font-bold"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                52
              </text>

              <rect
                x="225"
                y="100"
                width="40"
                height="100"
                fill="#14b8a6"
                rx="4"
              />
              <text
                x="245"
                y="220"
                textAnchor="middle"
                className="text-sm fill-slate-600"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                Hà Nội
              </text>
              <text
                x="245"
                y="90"
                textAnchor="middle"
                className="text-sm fill-slate-900 font-bold"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                38
              </text>

              <rect
                x="290"
                y="120"
                width="40"
                height="80"
                fill="#06b6d4"
                rx="4"
              />
              <text
                x="310"
                y="220"
                textAnchor="middle"
                className="text-sm fill-slate-600"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                Đà Nẵng
              </text>
              <text
                x="310"
                y="110"
                textAnchor="middle"
                className="text-sm fill-slate-900 font-bold"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                28
              </text>

              <line
                x1="20"
                y1="200"
                x2="350"
                y2="200"
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <line
                x1="20"
                y1="20"
                x2="20"
                y2="200"
                stroke="#e2e8f0"
                strokeWidth="1"
              />

              <line
                x1="20"
                y1="120"
                x2="350"
                y2="120"
                stroke="#f1f5f9"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            </svg>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-red-500" />
                  <span className="text-sm text-slate-600">Cần Thơ</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  78 yêu cầu
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-orange-500" />
                  <span className="text-sm text-slate-600">Quảng Nam</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  64 yêu cầu
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-yellow-500" />
                  <span className="text-sm text-slate-600">Hải Phòng</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  52 yêu cầu
                </span>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Create Event Button */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg px-6 py-3 text-sm font-medium text-white transition"
          style={{ backgroundColor: "var(--color-blue-950)" }}
        >
          + Tạo sự kiện cứu trợ mới
        </button>
      ) : (
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3
              className="text-xl font-bold text-slate-900"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Tạo sự kiện cứu trợ
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 transition hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Tên sự kiện *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ví dụ: Cứu hộ lũ lụt khu vực..."
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Mô tả chi tiết
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Mô tả về sự kiện, mục đích, và kế hoạch"
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Ngày tổ chức *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Giờ bắt đầu
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Giờ kết thúc
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Địa điểm *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Địa chỉ chi tiết khu vực triển khai"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Loại sự kiện
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="relief">Cứu trợ</option>
                <option value="rescue">Cứu hộ</option>
                <option value="evacuation">Sơ tán</option>
                <option value="medical">Y tế</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Độ ưu tiên
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="critical">Rất cao</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Đội phụ trách *
              </label>
              <input
                type="text"
                name="team"
                value={formData.team}
                onChange={handleInputChange}
                placeholder="Ví dụ: Đội cứu hộ miền Tây"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Ngân sách dự kiến
              </label>
              <input
                type="text"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                placeholder="Ví dụ: ₫450,000,000"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleCreateEvent}
              className="rounded-lg px-6 py-2 text-sm font-medium text-white transition"
              style={{ backgroundColor: "var(--color-blue-950)" }}
            >
              Tạo sự kiện
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 bg-white px-6 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
            >
              Hủy
            </button>
          </div>
        </article>
      )}

      {/* Events List */}
      <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h3
            className="text-xl font-bold text-slate-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Danh sách sự kiện cứu trợ
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Tổng {events.length} sự kiện đang quản lý
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {events.map((event) => (
            <div key={event.id} className="p-6 hover:bg-slate-50 transition">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-slate-900">{event.name}</h4>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold border ${getEventTypeColor(
                        event.type,
                      )}`}
                    >
                      {getEventTypeLabel(event.type)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">
                    {event.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 md:grid-cols-4">
                    <div>
                      <span className="font-semibold">Ngày:</span> {event.date}
                    </div>
                    <div>
                      <span className="font-semibold">Giờ:</span>{" "}
                      {event.startTime} - {event.endTime}
                    </div>
                    <div>
                      <span className="font-semibold">Địa điểm:</span>{" "}
                      {event.location}
                    </div>
                    <div>
                      <span className="font-semibold">Đội:</span> {event.team}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <div className="flex gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityColor(
                        event.priority,
                      )}`}
                    >
                      {getPriorityLabel(event.priority)}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                        event.status,
                      )}`}
                    >
                      {getStatusLabel(event.status)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {event.budget}
                  </p>
                  <div className="flex gap-2">
                    <button className="rounded-lg px-3 py-1.5 text-xs border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">
                      Chi tiết
                    </button>
                    <button className="rounded-lg px-3 py-1.5 text-xs border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">
                      Sửa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
