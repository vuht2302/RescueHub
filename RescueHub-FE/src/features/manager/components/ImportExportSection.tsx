import React, { useState } from "react";
import { Search, Eye } from "lucide-react";
import { Transaction } from "./types";
import {
  CreateImportRequestModal,
  ImportRequestData,
} from "./CreateImportRequestModal";

export function ImportExportSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions] = useState<Transaction[]>([
    {
      id: "TRX001",
      date: "2026-01-25",
      type: "import",
      supplier: "Công ty TNHH An Toàn Plus",
      items: 15,
      quantity: 120,
      status: "Hoàn tất",
    },
    {
      id: "TRX002",
      date: "2026-01-23",
      type: "import",
      supplier: "Công ty Cứu Hộ Việt",
      items: 8,
      quantity: 85,
      status: "Đang xử lý",
    },
    {
      id: "TRX003",
      date: "2026-01-20",
      type: "export",
      supplier: "Chi nhánh Quận 1",
      items: 12,
      quantity: 95,
      status: "Hoàn tất",
    },
    {
      id: "TRX004",
      date: "2026-01-18",
      type: "import",
      supplier: "Công ty Thiết bị Cứu hộ Toàn Cầu",
      items: 20,
      quantity: 150,
      status: "Chờ xác nhận",
    },
  ]);

  const handleCreateImportRequest = async (data: ImportRequestData) => {
    // Mock API call - in real app, this would call an API endpoint
    console.log("Creating import request:", data);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Success notification (in real app, could show toast)
    alert("Yêu cầu nhập kho đã được tạo thành công!");
  };

  return (
    <section className="space-y-6">
      <CreateImportRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateImportRequest}
      />

      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-[280px] flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="Tìm kiếm mã vụ, nhà cung cấp..."
              style={{ fontFamily: "var(--font-sans)" }}
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition"
            style={{ backgroundColor: "var(--color-blue-950)" }}
          >
            + Yêu cầu mới
          </button>
        </div>
      </header>

      <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h3
            className="text-xl font-bold text-slate-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Lịch sử giao dịch
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Nhập/xuất kho - {transactions.length} giao dịch gần đây
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <th className="px-4 py-3">Mã giao dịch</th>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Đối tác</th>
                <th className="px-4 py-3">Số mục</th>
                <th className="px-4 py-3">Số lượng</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr
                  key={txn.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{txn.id}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {txn.date}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        txn.type === "import"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {txn.type === "import" ? "Nhập kho" : "Xuất kho"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {txn.supplier}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {txn.items}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                    {txn.quantity}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        txn.status === "Hoàn tất"
                          ? "bg-emerald-50 text-emerald-600"
                          : txn.status === "Đang xử lý"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-orange-50 text-orange-600"
                      }`}
                    >
                      {txn.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100">
                      <Eye className="h-4 w-4" />
                    </button>
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
