"use client";

import React, { useEffect, useState } from "react";
import {
  getReportOverview,
  getIncidentByStatus,
  getMissionByStatus,
  getReliefByStatus,
  getHotspots,
  type HotspotItem,
} from "@/src/shared/services/report.service";
import { DonutChart } from "@/src/shared/components/DonutChart";
import { IncidentHotspotMap } from "./IncidentHotspotMap";
import { AlertTriangle, MapPin, TrendingUp, Flame } from "lucide-react";

const ReportDashboard = () => {
  const [overview, setOverview] = useState<any>(null);
  const [incident, setIncident] = useState<any>(null);
  const [mission, setMission] = useState<any>(null);
  const [relief, setRelief] = useState<any>(null);
  const [hotspots, setHotspots] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [overviewRes, incidentRes, missionRes, reliefRes, hotspotRes] =
        await Promise.all([
          getReportOverview(),
          getIncidentByStatus(),
          getMissionByStatus(),
          getReliefByStatus(),
          getHotspots(),
        ]);

      setOverview(overviewRes);
      setIncident(incidentRes);
      setMission(missionRes);
      setRelief(reliefRes);
      setHotspots(hotspotRes);
    } catch (err) {
      console.error(err);
      alert("Load report thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading || !overview) return <div>Loading...</div>;

  // ===== FORMAT DATA FOR DONUT CHARTS =====
  // Format incident data from overview API response
  const incidentChartData = [
    { name: "SOS", amount: overview.incidents.sos, color: "#DC2626" },
    { name: "Đang xử lý", amount: overview.incidents.open, color: "#F59E0B" },
  ].filter((item) => item.amount > 0);

  // Format mission data from overview API response
  const missionChartData = [
    {
      name: "Đang làm",
      amount: overview.missions.inProgress,
      color: "#2563EB",
    },
    {
      name: "Hoàn thành",
      amount: overview.missions.completed,
      color: "#16A34A",
    },
  ].filter((item) => item.amount > 0);

  // Format relief data from overview API response
  const reliefChartData = [
    { name: "Chờ duyệt", amount: overview.relief.pending, color: "#F97316" },
    { name: "Đã duyệt", amount: overview.relief.approved, color: "#0891B2" },
  ].filter((item) => item.amount > 0);

  // ===== CUSTOM LEGEND COMPONENT =====
  const ChartLegend = ({ data, total }: { data: any[]; total: number }) => (
    <div className="flex flex-col justify-center space-y-3 min-w-[140px]">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">
              {item.name}
            </span>
            <span className="text-lg font-bold text-gray-900">
              {Intl.NumberFormat("vi-VN").format(item.amount)}
            </span>
            <span className="text-xs text-gray-500">
              {((item.amount / total) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      ))}
      <div className="pt-2 mt-2 border-t border-gray-200">
        <span className="text-xs text-gray-500">Tổng cộng</span>
        <span className="block text-xl font-black text-blue-950">
          {Intl.NumberFormat("vi-VN").format(total)}
        </span>
      </div>
    </div>
  );

  // ===== COMPONENT =====
  const Card = ({ title, value }: any) => (
    <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-3xl font-black text-blue-950">{value}</p>
    </div>
  );

  // Calculate totals for legends
  const incidentTotal = incidentChartData.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const missionTotal = missionChartData.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const reliefTotal = reliefChartData.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  // Get max incident count for progress bar calculation
  const maxIncidentCount =
    hotspots?.items?.length > 0
      ? Math.max(...hotspots.items.map((h: any) => h.incidentCount))
      : 0;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-black">Dashboard báo cáo</h1>
        <p className="text-gray-600 text-sm">Tổng quan hệ thống cứu hộ</p>
      </div>

      {/* CHARTS - Using DonutChart with side legends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* INCIDENT DONUT CHART */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Tình trạng sự cố
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <DonutChart
                data={incidentChartData}
                className="h-48"
                variant="donut"
                category="name"
                value="amount"
                valueFormatter={(number: number) =>
                  `${Intl.NumberFormat("vi-VN").format(number)}`
                }
              />
            </div>
            <ChartLegend data={incidentChartData} total={incidentTotal} />
          </div>
        </div>

        {/* MISSION DONUT CHART */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Tình trạng nhiệm vụ
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <DonutChart
                data={missionChartData}
                className="h-48"
                variant="donut"
                category="name"
                value="amount"
                valueFormatter={(number: number) =>
                  `${Intl.NumberFormat("vi-VN").format(number)}`
                }
              />
            </div>
            <ChartLegend data={missionChartData} total={missionTotal} />
          </div>
        </div>

        {/* RELIEF DONUT CHART */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-600" />
            Tình trạng cứu trợ
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <DonutChart
                data={reliefChartData}
                className="h-48"
                variant="donut"
                category="name"
                value="amount"
                valueFormatter={(number: number) =>
                  `${Intl.NumberFormat("vi-VN").format(number)}`
                }
              />
            </div>
            <ChartLegend data={reliefChartData} total={reliefTotal} />
          </div>
        </div>
      </div>

      {/* HOTSPOTS MAP - Visualize incident hotspots on map */}
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex items-center gap-2 mb-5">
          <Flame className="w-6 h-6 text-red-600" />
          <h2 className="text-xl font-bold">
            Hotspots - Khu vực sự cố nhiều nhất
          </h2>
        </div>

        <IncidentHotspotMap
          hotspots={hotspots?.items || []}
          isLoading={loading}
          onRefresh={fetchData}
          className="h-[600px]"
        />
      </div>
    </div>
  );
};

export default ReportDashboard;
