import React from "react";
import { MoreVertical, AlertTriangle } from "lucide-react";

export function VehicleManagementSection() {
  return (
    <section className="space-y-6">
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
    </section>
  );
}
