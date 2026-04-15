import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Clock, CheckCircle2, Users } from "lucide-react";

// ===== MOCK DATA =====
const missionTrend = [
  { day: "T2", missions: 12 },
  { day: "T3", missions: 18 },
  { day: "T4", missions: 10 },
  { day: "T5", missions: 22 },
  { day: "T6", missions: 15 },
];

const teamStats = [
  { team: "Team A", completed: 25 },
  { team: "Team B", completed: 18 },
  { team: "Team C", completed: 30 },
];

const missionType = [
  { name: "Y tế", value: 20 },
  { name: "Thiên tai", value: 15 },
  { name: "Tai nạn", value: 10 },
];

const COLORS = ["#3b82f6", "#f59e0b", "#ef4444"];

const ReportDashboard = () => {
  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">
          Báo cáo & Thống kê
        </h1>
        <p className="text-gray-600 text-sm">
          Phân tích hoạt động cứu hộ hệ thống
        </p>
      </div>

      {/* ===== KPI ===== */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow flex gap-3">
          <TrendingUp className="text-blue-500" />
          <div>
            <p className="text-sm text-gray-500">Tổng nhiệm vụ</p>
            <h2 className="text-xl font-bold">77</h2>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow flex gap-3">
          <CheckCircle2 className="text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Hoàn thành</p>
            <h2 className="text-xl font-bold">65</h2>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow flex gap-3">
          <Clock className="text-yellow-500" />
          <div>
            <p className="text-sm text-gray-500">Thời gian TB</p>
            <h2 className="text-xl font-bold">2.5h</h2>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow flex gap-3">
          <Users className="text-purple-500" />
          <div>
            <p className="text-sm text-gray-500">Người được cứu</p>
            <h2 className="text-xl font-bold">120</h2>
          </div>
        </div>
      </div>

      {/* ===== CHARTS ===== */}
      <div className="grid grid-cols-3 gap-6">
        {/* Line */}
        <div className="col-span-2 bg-white p-5 rounded-2xl shadow">
          <h3 className="font-bold mb-4">
            Số lượng nhiệm vụ theo ngày
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={missionTrend}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line
                dataKey="missions"
                stroke="#1e3a8a"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h3 className="font-bold mb-4">Phân loại nhiệm vụ</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={missionType} dataKey="value" outerRadius={80}>
                {missionType.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== BAR ===== */}
      <div className="bg-white p-5 rounded-2xl shadow">
        <h3 className="font-bold mb-4">Hiệu suất đội cứu hộ</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={teamStats}>
            <XAxis dataKey="team" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="completed" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ===== TABLE ===== */}
      <div className="bg-white p-5 rounded-2xl shadow">
        <h3 className="font-bold mb-4">Top đội cứu hộ</h3>

        <table className="w-full text-sm">
          <thead className="text-gray-600 border-b">
            <tr>
              <th className="text-left py-2">Đội</th>
              <th className="text-left py-2">Nhiệm vụ hoàn thành</th>
              <th className="text-left py-2">Đánh giá</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-t">
              <td>Team C</td>
              <td>30</td>
              <td className="text-green-600 font-semibold">Xuất sắc</td>
            </tr>
            <tr className="border-t">
              <td>Team A</td>
              <td>25</td>
              <td className="text-blue-600 font-semibold">Tốt</td>
            </tr>
            <tr className="border-t">
              <td>Team B</td>
              <td>18</td>
              <td className="text-yellow-600 font-semibold">Trung bình</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportDashboard;