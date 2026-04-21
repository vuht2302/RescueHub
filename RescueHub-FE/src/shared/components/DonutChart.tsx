"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DonutChartProps {
  className?: string;
  data: Array<Record<string, string | number>>;
  category: string;
  value: string;
  valueFormatter?: (value: number) => string;
  variant?: "pie" | "donut";
  colors?: string[];
}

const defaultColors = [
  "#1E3A8A",
  "#2563EB",
  "#60A5FA",
  "#93C5FD",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
];

export const DonutChart: React.FC<DonutChartProps> = ({
  className = "h-64",
  data,
  category,
  value,
  valueFormatter = (number: number) => number.toString(),
  variant = "donut",
  colors = defaultColors,
}) => {
  const innerRadius = variant === "donut" ? 60 : 0;
  const outerRadius = variant === "donut" ? 80 : 100;

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={value}
            nameKey={category}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              fontSize: "12px",
            }}
            formatter={(value: any, name: any) => [
              valueFormatter(value as number),
              name,
            ]}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingTop: 20 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DonutChart;
