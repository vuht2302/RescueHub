import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  HandHeart,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Warehouse,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getManagerDashboard,
  ManagerDashboardData,
  RecentDistribution,
} from "../services/dashboardService";
import { formatDate } from "../constants/statusConfig";

interface ManagerOverviewPanelProps {
  accessToken: string;
}

interface KpiCard {
  key: string;
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}

const PIE_COLORS = ["#0f172a", "#334155", "#64748b", "#94a3b8"];

const formatNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value || 0);

const getStatusBadgeClass = (statusCode: string) => {
  const code = statusCode.toUpperCase();

  if (code === "COMPLETED") return "bg-emerald-50 text-emerald-700";
  if (code === "PENDING") return "bg-amber-50 text-amber-700";
  if (code === "CANCELLED") return "bg-rose-50 text-rose-700";

  return "bg-slate-100 text-slate-600";
};

export function ManagerOverviewPanel({
  accessToken,
}: ManagerOverviewPanelProps) {
  const [dashboard, setDashboard] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getManagerDashboard(accessToken);
      setDashboard(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Khong the tai dashboard manager";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [accessToken]);

  const kpiCards = useMemo<KpiCard[]>(() => {
    if (!dashboard) return [];

    return [
      {
        key: "warehouseActiveCount",
        label: "Kho dang hoat dong",
        value: dashboard.warehouseActiveCount,
        icon: Warehouse,
      },
      {
        key: "campaignActiveCount",
        label: "Chien dich dang dien ra",
        value: dashboard.campaignActiveCount,
        icon: HandHeart,
      },
      {
        key: "reliefPointOpenCount",
        label: "Diem cuu tro dang mo",
        value: dashboard.reliefPointOpenCount,
        icon: MapPin,
      },
      {
        key: "totalOnHandQty",
        label: "Tong ton kho hien tai",
        value: dashboard.totalOnHandQty,
        icon: Archive,
      },
    ];
  }, [dashboard]);

  const flowBarData = useMemo(() => {
    if (!dashboard) return [];

    return [
      {
        name: "Chờ phân phối",
        value: dashboard.distributionPendingCount,
      },
      {
        name: "Hoàn thành hôm nay",
        value: dashboard.distributionCompletedTodayCount,
      },
      {
        name: "Yêu cầu cho xử lý",
        value: dashboard.reliefRequestPendingCount,
      },
      {
        name: "Cảnh báo tồn kho",
        value: dashboard.unresolvedStockAlertCount,
      },
    ];
  }, [dashboard]);

  const pieData = useMemo(() => {
    if (!dashboard) return [];

    return [
      {
        name: "Chờ phân phối",
        value: dashboard.distributionPendingCount,
      },
      {
        name: "Đã hoàn thành",
        value: dashboard.distributionCompletedTodayCount,
      },
    ];
  }, [dashboard]);

  const recentDistributions = dashboard?.recentDistributions ?? [];

  if (loading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Đang tải dữ liệu .....</span>
        </div>
      </section>
    );
  }

  if (error || !dashboard) {
    return (
      <section className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-rose-700">
              Không tải được dữ liệu dashboard
            </p>
            <p className="mt-1 text-sm text-rose-600">
              {error ?? "Co loi xay ra"}
            </p>
          </div>
          <button
            onClick={loadDashboard}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            Thu lai
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.key}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
                  {card.label}
                </p>
                <span className="rounded-lg bg-slate-100 p-2 text-slate-600">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold text-slate-900">
                {formatNumber(card.value)}
              </p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
          <header className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">
              Hạng mục cần xử lý ngay
            </h3>
            <span className="text-xs text-slate-500">
              Cập nhật thời gian thực
            </span>
          </header>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={flowBarData}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 10,
                    background: "#ffffff",
                  }}
                  formatter={(value) => [
                    formatNumber(Number(value)),
                    "So luong",
                  ]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#334155" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <header className="mb-4">
            <h3 className="text-sm font-semibold text-slate-800">
              Tỷ trọng trong phân phối
            </h3>
          </header>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={3}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 10,
                    background: "#ffffff",
                  }}
                  formatter={(value) => [
                    formatNumber(Number(value)),
                    "So luong",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 space-y-2">
            {pieData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2 text-slate-600">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                    }}
                  />
                  <span>{item.name}</span>
                </div>
                <span className="font-semibold text-slate-900">
                  {formatNumber(item.value)}
                </span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-800">
            Phân phối gần đây
          </h3>
        </header>

        {recentDistributions.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-500">
            Chưa có đợt phân phối nào gần đây.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mã phân phối</th>
                  <th className="px-4 py-3 font-semibold">Chiến dịch</th>
                  <th className="px-4 py-3 font-semibold">Khu vực</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Tạo lúc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recentDistributions.map((distribution: RecentDistribution) => (
                  <tr
                    key={distribution.distributionId}
                    className="hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {distribution.distributionCode}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {distribution.campaign?.name ?? "--"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {distribution.adminArea?.name ?? "--"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(
                          distribution.status.code,
                        )}`}
                      >
                        {distribution.status.code === "PENDING" ? (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        {distribution.status.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(distribution.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
            Cảnh báo tồn kho
          </p>
          <p className="mt-3 flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <Package className="h-5 w-5 text-slate-500" />
            {formatNumber(dashboard.unresolvedStockAlertCount)}
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
            Yêu cầu trợ giúp cho xử lý
          </p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {formatNumber(dashboard.reliefRequestPendingCount)}
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.08em] text-slate-500">
            Hoàn thành hôm nay
          </p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {formatNumber(dashboard.distributionCompletedTodayCount)}
          </p>
        </article>
      </div>
    </section>
  );
}
