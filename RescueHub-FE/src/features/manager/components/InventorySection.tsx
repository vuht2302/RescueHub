import React, { useState } from "react";
import { Search, MoreVertical, AlertTriangle } from "lucide-react";
import { InventoryItem } from "./types";

export function InventorySection() {
  const [inventoryItems] = useState<InventoryItem[]>([
    {
      id: "SKU001",
      name: "Dây an toàn cứu hộ",
      quantity: 45,
      location: "A-1-3",
      status: "In Stock",
      lastRestocked: "2026-01-15",
    },
    {
      id: "SKU002",
      name: "Mũ bảo hiểm chuyên dụng",
      quantity: 12,
      location: "B-2-1",
      status: "Low Stock",
      lastRestocked: "2026-01-20",
    },
    {
      id: "SKU003",
      name: "Áo phao cứu sinh",
      quantity: 0,
      location: "C-1-2",
      status: "Out of Stock",
      lastRestocked: "2025-12-10",
    },
    {
      id: "SKU004",
      name: "Bộ cứu hộ di động",
      quantity: 28,
      location: "A-3-4",
      status: "In Stock",
      lastRestocked: "2026-01-18",
    },
    {
      id: "SKU005",
      name: "Dụng cụ cắt cứu hộ",
      quantity: 8,
      location: "B-1-5",
      status: "Low Stock",
      lastRestocked: "2026-01-22",
    },
    {
      id: "SKU006",
      name: "Đèn chiếu sáng chuyên dụng",
      quantity: 35,
      location: "D-2-3",
      status: "In Stock",
      lastRestocked: "2026-01-19",
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-emerald-50 text-emerald-600";
      case "Low Stock":
        return "bg-orange-50 text-orange-600";
      case "Out of Stock":
        return "bg-red-50 text-red-600";
      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "In Stock":
        return <div className="h-2 w-2 rounded-full bg-emerald-600" />;
      case "Low Stock":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "Out of Stock":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <section className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-[280px] flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="Tìm kiếm sản phẩm, mã SKU..."
              style={{ fontFamily: "var(--font-sans)" }}
            />
          </div>
          <button
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition"
            style={{ backgroundColor: "var(--color-blue-950)" }}
          >
            + Thêm sản phẩm
          </button>
        </div>
      </header>

      <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h3
            className="text-xl font-bold text-slate-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Danh sách hàng hóa
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý kho hàng hóa cứu hộ - tổng {inventoryItems.length} sản phẩm
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <th className="px-4 py-3">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-4 py-3">Mã SKU</th>
                <th className="px-4 py-3">Tên sản phẩm</th>
                <th className="px-4 py-3">Số lượng</th>
                <th className="px-4 py-3">Vị trí kho</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Cập nhật gần đây</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{item.id}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {item.name}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.quantity} {item.quantity === 1 ? "cái" : "cái"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {item.location}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                        item.status,
                      )}`}
                    >
                      {getStatusIcon(item.status)}
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {item.lastRestocked}
                  </td>
                  <td className="px-4 py-3">
                    <button className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {/* Vehicle Management Section */}
      <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h3
            className="text-xl font-bold text-slate-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Quản lý phương tiện cứu hộ
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Theo dõi tình trạng sử dụng và bảo dưỡng phương tiện
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <th className="px-4 py-3">Biển số xe</th>
                <th className="px-4 py-3">Loại phương tiện</th>
                <th className="px-4 py-3">Đội sử dụng</th>
                <th className="px-4 py-3">Tình trạng</th>
                <th className="px-4 py-3">Nhiên liệu (%)</th>
                <th className="px-4 py-3">Km hiện tại</th>
                <th className="px-4 py-3">Bảo dưỡng lần cuối</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 transition hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">59A-123456</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-900">
                  Xe thang nâng
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  Đội PCCC Q1
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-600">
                    <div className="h-2 w-2 rounded-full bg-emerald-600" />
                    Sẵn sàng
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-12 rounded-full bg-slate-200">
                      <div className="h-1.5 w-9 rounded-full bg-blue-500" />
                    </div>
                    <span className="text-sm text-slate-600">75%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">12,450 km</td>
                <td className="px-4 py-3 text-sm text-slate-600">2026-03-20</td>
                <td className="px-4 py-3">
                  <button className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
              <tr className="border-b border-slate-100 transition hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">51B-987654</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-900">
                  Xe cứu thương
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  Đội Y tế Q2
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-600">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                    Đang sử dụng
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-12 rounded-full bg-slate-200">
                      <div className="h-1.5 w-6 rounded-full bg-orange-500" />
                    </div>
                    <span className="text-sm text-slate-600">50%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">8,920 km</td>
                <td className="px-4 py-3 text-sm text-slate-600">2026-02-10</td>
                <td className="px-4 py-3">
                  <button className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
              <tr className="border-b border-slate-100 transition hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">29C-555666</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-900">
                  Xe chuyên dụng
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  Đội Cứu hộ Q3
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-orange-50 text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    Cần bảo dưỡng
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-12 rounded-full bg-slate-200">
                      <div className="h-1.5 w-4 rounded-full bg-red-500" />
                    </div>
                    <span className="text-sm text-slate-600">25%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">15,780 km</td>
                <td className="px-4 py-3 text-sm text-slate-600">2025-12-05</td>
                <td className="px-4 py-3">
                  <button className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      {/* Relief Distribution Tracking Section */}
      <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h3
            className="text-xl font-bold text-slate-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Theo dõi và ghi nhận phân phối hàng cứu trợ
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý phân phối và ghi nhận hàng cứu trợ tới các khu vực
          </p>
        </div>

        <div className="border-b border-slate-200 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Chọn khu vực phân phối
              </label>
              <select className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                <option>Cần Thơ</option>
                <option>Quảng Nam</option>
                <option>Hải Phòng</option>
                <option>Hà Nội</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Sản phẩm
              </label>
              <select className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                <option>Dây an toàn cứu hộ</option>
                <option>Mũ bảo hiểm</option>
                <option>Áo phao cứu sinh</option>
                <option>Bộ cứu hộ di động</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Số lượng phân phối
              </label>
              <input
                type="number"
                placeholder="Nhập số lượng"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            className="mt-4 rounded-lg px-6 py-2 text-sm font-medium text-white transition"
            style={{ backgroundColor: "var(--color-blue-950)" }}
          >
            Ghi nhận phân phối
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <th className="px-4 py-3">Mã phân phối</th>
                <th className="px-4 py-3">Khu vực</th>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Số lượng</th>
                <th className="px-4 py-3">Người ghi nhận</th>
                <th className="px-4 py-3">Ngày phân phối</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 transition hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">DP-001</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-900">Cần Thơ</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  Áo phao cứu sinh
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                  50 cái
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  Nguyễn Văn A
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">2026-04-15</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-600">
                    Hoàn tất
                  </span>
                </td>
              </tr>
              <tr className="border-b border-slate-100 transition hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">DP-002</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-900">Quảng Nam</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  Dây an toàn cứu hộ
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                  30 cái
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">Trần Thị B</td>
                <td className="px-4 py-3 text-sm text-slate-600">2026-04-14</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-600">
                    Hoàn tất
                  </span>
                </td>
              </tr>
              <tr className="border-b border-slate-100 transition hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">DP-003</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-900">Hải Phòng</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  Mũ bảo hiểm chuyên dụng
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                  25 cái
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">Lê Văn C</td>
                <td className="px-4 py-3 text-sm text-slate-600">2026-04-13</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-600">
                    Đang xử lý
                  </span>
                </td>
              </tr>
              <tr className="border-b border-slate-100 transition hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">DP-004</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-900">Hà Nội</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  Bộ cứu hộ di động
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                  15 cái
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  Phạm Minh D
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">2026-04-12</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-600">
                    Hoàn tất
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
