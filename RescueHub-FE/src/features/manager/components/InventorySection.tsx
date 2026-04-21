import React, { useState } from "react";
import {
  Warehouse,
  Package,
  Box,
  ArrowRightLeft,
  Truck,
  Home,
  PackagePlus,
  Database,
} from "lucide-react";
import { WarehouseTab } from "./WarehouseTab";
import { StockTab } from "./StockTab";
import { ItemTab } from "./ItemTab";
import { LotTab } from "./LotTab";
import { TransactionTab } from "./TransactionTab";
import { ReliefIssueTab } from "./ReliefIssueTab";
import { DistributionTab } from "./DistributionTab";

type TabId =
  | "warehouse"
  | "stock"
  | "item"
  | "lot"
  | "transaction"
  | "relief-issue"
  | "household"
  | "distribution";

interface Tab {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
}

const TABS: Tab[] = [
  {
    id: "warehouse",
    label: "Kho hàng",
    shortLabel: "Kho",
    icon: Warehouse,
    description: "MAN-01 — Quản lý danh mục kho",
  },
  {
    id: "stock",
    label: "Tồn kho",
    shortLabel: "Tồn kho",
    icon: Database,
    description: "MAN-02 — Xem tình trạng tồn kho theo thời gian thực",
  },
  {
    id: "item",
    label: "Hàng hóa",
    shortLabel: "Hàng",
    icon: Package,
    description: "MAN-03 — Danh mục hàng hóa cứu trợ",
  },
  {
    id: "transaction",
    label: "Giao dịch kho",
    shortLabel: "Giao dịch",
    icon: ArrowRightLeft,
    description: "MAN-05 — Nhập/xuất/điều chuyển kho",
  },
  {
    id: "relief-issue",
    label: "Cấp phát",
    shortLabel: "Cấp phát",
    icon: Truck,
    description: "MAN-06 — Phiếu cấp phát từ kho đến điểm cứu trợ",
  },
  {
    id: "distribution",
    label: "Phân phối",
    shortLabel: "Phân phối",
    icon: PackagePlus,
    description: "MAN-08 — Phiếu phân phối đến hộ dân & xác nhận OTP",
  },
];

export const InventorySection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("warehouse");

  const current = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2
          className="text-2xl font-black text-gray-900"
          style={{ fontFamily: "var(--font-primary)" }}
        >
          Quản lý kho
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">{current.description}</p>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap
                  transition-all flex-shrink-0 border-b-2
                  ${
                    isActive
                      ? "border-blue-700 text-blue-800 bg-blue-50/60"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }
                `}
                style={isActive ? { color: "var(--color-blue-950)" } : {}}
              >
                <Icon
                  size={15}
                  className={isActive ? "text-blue-700" : "text-gray-400"}
                  style={isActive ? { color: "var(--color-blue-950)" } : {}}
                />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "warehouse" && <WarehouseTab />}
        {activeTab === "stock" && <StockTab />}
        {activeTab === "item" && <ItemTab />}
        {activeTab === "lot" && <LotTab />}
        {activeTab === "transaction" && <TransactionTab />}
        {activeTab === "relief-issue" && <ReliefIssueTab />}
        {activeTab === "distribution" && <DistributionTab />}
      </div>
    </div>
  );
};
