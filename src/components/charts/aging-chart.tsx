"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { AgingReport } from "@/types";

export type AgingChartType = "pie" | "bar";

interface AgingChartProps {
  data?: AgingReport;
  isLoading?: boolean;
  chartType?: AgingChartType;
  onBucketClick?: (bucket: string) => void;
  className?: string;
}

// Aging bucket configuration with colors
// Colors progress from green (current) to red (overdue)
const AGING_BUCKETS = [
  {
    key: "current" as const,
    label: "Current",
    color: "hsl(142, 76%, 36%)", // Green
  },
  {
    key: "period_31_60" as const,
    label: "31-60 Days",
    color: "hsl(var(--chart-2))", // Teal
  },
  {
    key: "period_61_90" as const,
    label: "61-90 Days",
    color: "hsl(var(--chart-4))", // Yellow
  },
  {
    key: "period_over_90" as const,
    label: "90+ Days",
    color: "hsl(0, 84%, 60%)", // Red
  },
];

/**
 * Transform aging data for charts.
 * Backend returns nested bucket objects with string amounts.
 */
function transformAgingData(data: AgingReport) {
  const totalAmount = parseFloat(data.total.amount);

  return AGING_BUCKETS.map((bucket) => {
    const bucketData = data[bucket.key];
    const amount = parseFloat(bucketData.amount);
    return {
      name: bucket.label,
      key: bucket.key,
      value: amount,
      count: bucketData.count,
      color: bucket.color,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
    };
  });
}

// Custom tooltip for pie chart
interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      name: string;
      value: number;
      count: number;
      color: string;
      percentage: number;
    };
  }>;
}

function PieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <span className="font-medium text-foreground">{data.name}</span>
      </div>
      <div className="text-sm text-muted-foreground space-y-0.5">
        <p>Amount: {formatCurrency(data.value)}</p>
        <p>Invoices: {data.count}</p>
        <p>Percentage: {formatPercent(data.percentage)}</p>
      </div>
    </div>
  );
}

// Custom tooltip for bar chart
interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      name: string;
      value: number;
      count: number;
      color: string;
      percentage: number;
    };
  }>;
  label?: string;
}

function BarTooltip({ active, payload, label }: BarTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
      <p className="font-medium text-foreground mb-1">{label}</p>
      <div className="text-sm text-muted-foreground space-y-0.5">
        <p>Amount: {formatCurrency(data.value)}</p>
        <p>Invoices: {data.count}</p>
        <p>Percentage: {formatPercent(data.percentage)}</p>
      </div>
    </div>
  );
}

// Custom label for pie chart
interface PieLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
}

function renderPieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: PieLabelProps) {
  if (percent < 0.05) return null; // Don't show label for small segments

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// Loading skeleton for pie chart
function PieChartSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-[300px]">
      <Skeleton className="w-[200px] h-[200px] rounded-full" />
      <div className="flex gap-4 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="w-16 h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Loading skeleton for bar chart
function BarChartSkeleton() {
  return (
    <div className="h-[300px] p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 mb-4">
          <Skeleton className="w-20 h-4" />
          <Skeleton
            className="h-8 rounded"
            style={{ width: `${Math.random() * 60 + 20}%` }}
          />
        </div>
      ))}
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
          d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
        />
      </svg>
      <p className="text-sm">No aging data available</p>
    </div>
  );
}

// Custom legend with amounts
interface CustomLegendProps {
  chartData: ReturnType<typeof transformAgingData>;
  onBucketClick?: (bucket: string) => void;
}

function CustomLegend({ chartData, onBucketClick }: CustomLegendProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {chartData.map((entry) => (
        <button
          key={entry.key}
          onClick={() => onBucketClick?.(entry.key)}
          className={`flex items-center gap-2 text-sm ${
            onBucketClick ? "cursor-pointer hover:opacity-80" : "cursor-default"
          }`}
          type="button"
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="font-medium text-foreground">
            {formatCurrency(entry.value)}
          </span>
        </button>
      ))}
    </div>
  );
}

export function AgingChart({
  data,
  isLoading = false,
  chartType = "pie",
  onBucketClick,
  className,
}: AgingChartProps) {
  if (isLoading) {
    return chartType === "pie" ? (
      <PieChartSkeleton />
    ) : (
      <BarChartSkeleton />
    );
  }

  if (!data || parseFloat(data.total.amount) === 0) {
    return <EmptyState className={className} />;
  }

  const chartData = transformAgingData(data);

  // Filter out zero values for cleaner chart
  const nonZeroData = chartData.filter((d) => d.value > 0);

  if (nonZeroData.length === 0) {
    return <EmptyState className={className} />;
  }

  if (chartType === "bar") {
    return (
      <div className={className}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
          >
            <XAxis
              type="number"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={70}
            />
            <Tooltip content={<BarTooltip />} />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              onClick={(data) => onBucketClick?.(data.key)}
              cursor={onBucketClick ? "pointer" : "default"}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="text-center mt-2">
          <span className="text-sm text-muted-foreground">Total Outstanding: </span>
          <span className="font-medium text-foreground">
            {formatCurrency(parseFloat(data.total.amount))}
          </span>
          <span className="text-sm text-muted-foreground ml-2">
            ({data.total.count} invoices)
          </span>
        </div>
      </div>
    );
  }

  // Pie chart (default)
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={nonZeroData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderPieLabel}
            outerRadius={100}
            innerRadius={50}
            fill="#8884d8"
            dataKey="value"
            onClick={(data) => onBucketClick?.(data.key)}
            cursor={onBucketClick ? "pointer" : "default"}
          >
            {nonZeroData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <CustomLegend chartData={chartData} onBucketClick={onBucketClick} />
      <div className="text-center mt-4">
        <span className="text-sm text-muted-foreground">Total Outstanding: </span>
        <span className="font-semibold text-foreground">
          {formatCurrency(parseFloat(data.total.amount))}
        </span>
        <span className="text-sm text-muted-foreground ml-2">
          ({data.total.count} invoices)
        </span>
      </div>
    </div>
  );
}
