"use client";

import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMetricValue } from "@/components/pages/metrics/metrics-utils";

interface MetricAreaChartProps {
  data: Array<{
    timestamp: string;
    time: string;
    value: number;
  }>;
  selectedMetric: string;
}

export default function MetricAreaChart({
  data,
  selectedMetric,
}: MetricAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="time" tick={{ fontSize: 12 }} minTickGap={20} />
        <YAxis
          tick={{ fontSize: 12 }}
          width={100}
          tickFormatter={(value) =>
            formatMetricValue(Number(value), selectedMetric)
          }
        />
        <Tooltip
          formatter={(value) =>
            formatMetricValue(Number(value), selectedMetric)
          }
          labelFormatter={(label, payload) => {
            const point = payload?.[0]?.payload;
            return point?.timestamp || label;
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--primary)"
          fill="var(--primary)"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Brush dataKey="time" height={22} travellerWidth={8} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
