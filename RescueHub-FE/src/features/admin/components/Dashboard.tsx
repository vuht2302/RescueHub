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
import { AlertTriangle, Truck, CheckCircle2, Users } from "lucide-react";

// ===== MOCK DATA =====
const requestTrend = [
  { time: "08h", requests: 5 },
  { time: "10h", requests: 12 },
  { time: "12h", requests: 8 },
  { time: "14h", requests: 18 },
  { time: "16h", requests: 10 },
];

const statusData = [
  { name: "Pending", value: 6 },
  { name: "In Progress", value: 10 },
  { name: "Completed", value: 14 },
];

const teamPerformance = [
  { team: "Team A", missions: 12 },
  { team: "Team B", missions: 8 },
  { team: "Team C", missions: 15 },
];

const COLORS = ["#facc15", "#3b82f6", "#22c55e"];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* ===== KPI CARDS ===== */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow flex items-center gap-4">
          <AlertTriangle className="text-red-500" />
          <div>
            <p className="text-gray-500 text-sm">Khẩn cấp</p>
            <h2 className="text-2xl font-bold">6</h2>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow flex items-center gap-4">
          <Truck className="text-blue-500" />
          <div>
            <p className="text-gray-500 text-sm">Đang xử lý</p>
            <h2 className="text-2xl font-bold">10</h2>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow flex items-center gap-4">
          <Users className="text-purple-500" />
          <div>
            <p className="text-gray-500 text-sm">Đội hoạt động</p>
            <h2 className="text-2xl font-bold">5</h2>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow flex items-center gap-4">
          <CheckCircle2 className="text-green-500" />
          <div>
            <p className="text-gray-500 text-sm">Hoàn thành</p>
            <h2 className="text-2xl font-bold">14</h2>
          </div>
        </div>
      </div>

      {/* ===== MAIN CHARTS ===== */}
      <div className="grid grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="col-span-2 bg-white p-5 rounded-2xl shadow">
          <h3 className="font-bold mb-4">
            Số lượng yêu cầu cứu hộ theo thời gian
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={requestTrend}>
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="requests"
                stroke="#1e3a8a"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h3 className="font-bold mb-4">Trạng thái nhiệm vụ</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} dataKey="value" outerRadius={80}>
                {statusData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== BAR CHART ===== */}
      <div className="bg-white p-5 rounded-2xl shadow">
        <h3 className="font-bold mb-4">Hiệu suất đội cứu hộ</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={teamPerformance}>
            <XAxis dataKey="team" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="missions" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ===== EXTRA SECTION ===== */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h3 className="font-bold mb-4">Yêu cầu gần đây</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span>RG-001 - Tai nạn giao thông</span>
              <span className="text-red-500 font-semibold">Critical</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>RG-002 - Cứu hộ lũ</span>
              <span className="text-yellow-500 font-semibold">High</span>
            </div>
            <div className="flex justify-between">
              <span>RG-003 - Hỗ trợ y tế</span>
              <span className="text-blue-500 font-semibold">Medium</span>
            </div>
          </div>
        </div>

        {/* Team Status */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h3 className="font-bold mb-4">Trạng thái đội</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Team A</span>
              <span className="text-green-600">Sẵn sàng</span>
            </div>
            <div className="flex justify-between">
              <span>Team B</span>
              <span className="text-blue-600">Đang làm nhiệm vụ</span>
            </div>
            <div className="flex justify-between">
              <span>Team C</span>
              <span className="text-gray-500">Đang nghỉ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;