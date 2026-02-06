"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import type { RevenueReport } from "@/types";

export type ChartType = "bar" | "area" | "line";
export type GroupBy = "daily" | "weekly" | "monthly" | "quarterly";

interface RevenueChartProps {
  data?: RevenueReport;
  isLoading?: boolean;
  chartType?: ChartType;
  groupBy?: GroupBy;
  className?: string;
}

// Chart colors using CSS variables
const CHART_COLORS = {
  primary: "hsl(var(--chart-1))",
  secondary: "hsl(var(--chart-2))",
  tertiary: "hsl(var(--chart-3))",
  quaternary: "hsl(var(--chart-4))",
  quinary: "hsl(var(--chart-5))",
};

// Custom tooltip component
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-foreground">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Y-axis tick formatter
function formatYAxisTick(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
}

// Loading skeleton
function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-end gap-2 h-[300px] p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${Math.random() * 60 + 20}%` }}
          />
        ))}
      </div>
      <div className="flex justify-center gap-4 mt-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

// Empty state
function EmptyState({ className }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center h-[300px] text-muted-foreground ${className}`}
    >
      <svg
        className="w-12 h-12 mb-4 opacity-50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <p className="text-sm">No revenue data available</p>
    </div>
  );
}

/**
 * Transform backend data_points into chart-ready format.
 * Backend returns amounts as strings (Decimal serialization), so we parse them.
 */
function transformDataPoints(data: RevenueReport) {
  return data.data_points.map((dp) => ({
    period: dp.period_label || dp.date,
    amount: parseFloat(dp.amount),
    count: dp.count,
  }));
}

export function RevenueChart({
  data,
  isLoading = false,
  chartType = "bar",
  className,
}: RevenueChartProps) {
  if (isLoading) {
    return <ChartSkeleton className={className} />;
  }

  if (!data || data.data_points.length === 0) {
    return <EmptyState className={className} />;
  }

  const chartData = transformDataPoints(data);

  const commonProps = {
    data: chartData,
    margin: { top: 10, right: 30, left: 10, bottom: 0 },
  };

  const renderChart = () => {
    if (chartType === "line") {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="period"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxisTick}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value) => (
              <span className="text-sm text-foreground capitalize">{value}</span>
            )}
          />
          <Line
            type="monotone"
            dataKey="amount"
            name="Revenue"
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            dot={{ r: 4, fill: CHART_COLORS.primary }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      );
    }

    if (chartType === "area") {
      return (
        <AreaChart {...commonProps}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8} />
              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="period"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxisTick}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value) => (
              <span className="text-sm text-foreground capitalize">{value}</span>
            )}
          />
          <Area
            type="monotone"
            dataKey="amount"
            name="Revenue"
            stroke={CHART_COLORS.primary}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      );
    }

    // Bar chart (default)
    return (
      <BarChart {...commonProps}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          vertical={false}
        />
        <XAxis
          dataKey="period"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "hsl(var(--border))" }}
        />
        <YAxis
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatYAxisTick}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: 20 }}
          formatter={(value) => (
            <span className="text-sm text-foreground capitalize">{value}</span>
          )}
        />
        <Bar
          dataKey="amount"
          name="Revenue"
          fill={CHART_COLORS.primary}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    );
  };

  return (
    <div className={className}>
      {/* Summary row */}
      <div className="flex flex-wrap gap-6 mb-4 text-sm">
        <div>
          <span className="text-muted-foreground">Total: </span>
          <span className="font-medium text-foreground">
            {formatCurrency(parseFloat(data.totals.total_amount))}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Invoices: </span>
          <span className="font-medium text-foreground">
            {data.totals.total_count}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Average: </span>
          <span className="font-medium text-foreground">
            {formatCurrency(parseFloat(data.totals.average))}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
