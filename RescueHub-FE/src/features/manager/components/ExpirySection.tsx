import React, { useState } from "react";
import { Search } from "lucide-react";
import { ExpiryItem } from "./types";

export function ExpirySection() {
  const [expiryItems] = useState<ExpiryItem[]>([
    {
      id: "EXP001",
      product: "Dây an toàn cứu hộ - Batch A2024",
      batchNumber: "SKU001",
      quantity: 12,
      expiryDate: "2026-03-15",
      location: "A-1-3",
      status: "Safe",
      daysRemaining: 50,
    },
    {
      id: "EXP002",
      product: "Mũ bảo hiểm chuyên dụng - Batch B2024",
      batchNumber: "SKU002",
      quantity: 8,
      expiryDate: "2026-02-10",
      location: "B-2-1",
      status: "Warning",
      daysRemaining: 16,
    },
    {
      id: "EXP003",
      product: "Bộ cứu hộ di động - Batch C2023",
      batchNumber: "SKU004",
      quantity: 5,
      expiryDate: "2026-01-30",
      location: "A-3-4",
      status: "Expired",
      daysRemaining: -5,
    },
  ]);

  const getExpiryBadge = (status: string) => {
    switch (status) {
      case "Expired":
        return "bg-red-100 text-red-700 border border-red-200";
      case "Warning":
        return "bg-orange-100 text-orange-700 border border-orange-200";
      case "Safe":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Expired":
        return "bg-red-50 text-red-600";
      case "Warning":
        return "bg-orange-50 text-orange-600";
      case "Safe":
        return "bg-yellow-50 text-yellow-600";
      default:
        return "bg-slate-50 text-slate-600";
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
              placeholder="Tìm kiếm sản phẩm, batch..."
              style={{ fontFamily: "var(--font-sans)" }}
            />
          </div>
          <button
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition"
            style={{ backgroundColor: "var(--color-blue-950)" }}
          >
            Xuất báo cáo
          </button>
        </div>
      </header>

      <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h3
            className="text-xl font-bold text-slate-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Sản phẩm sắp/đã hết hạn
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Giám sát ngày hết hạn sử dụng - {expiryItems.length} mục
          </p>
        </div>

        <div className="space-y-3 p-6">
          {expiryItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg border p-4 ${getExpiryBadge(item.status)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold">{item.product}</h4>
                  <p className="mt-1 text-sm opacity-75">
                    {item.batchNumber} • {item.quantity} cái • Vị trí:{" "}
                    {item.location}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{item.expiryDate}</p>
                  <p className="mt-1 text-sm font-medium">
                    {item.daysRemaining > 0
                      ? `Còn ${item.daysRemaining} ngày`
                      : `Đã hết ${Math.abs(item.daysRemaining)} ngày`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* Expiry Summary Table */}
      <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h3
            className="text-xl font-bold text-slate-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Tóm tắt theo trạng thái
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Phân loại sản phẩm theo mức độ hết hạn
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Số lượng</th>
                <th className="px-4 py-3">Ngày hết hạn</th>
                <th className="px-4 py-3">Còn lại</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Vị trí</th>
              </tr>
            </thead>
            <tbody>
              {expiryItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {item.product.split(" - ")[0]}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {item.batchNumber}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {item.expiryDate}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                    {item.daysRemaining > 0
                      ? `${item.daysRemaining} ngày`
                      : `Hết ${Math.abs(item.daysRemaining)} ngày`}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                        item.status,
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {item.location}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
