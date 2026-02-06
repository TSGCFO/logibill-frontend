"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { ProfitabilityReport } from "@/types";

export type SortBy = "revenue" | "margin" | "margin_pct";

interface ProfitabilityChartProps {
  data?: ProfitabilityReport;
  isLoading?: boolean;
  sortBy?: SortBy;
  showStacked?: boolean;
  maxCustomers?: number;
  onCustomerClick?: (customerId: number) => void;
  className?: string;
}

// Chart colors
const CHART_COLORS = {
  revenue: "hsl(var(--chart-1))",
  cost: "hsl(var(--chart-5))",
  profit: "hsl(var(--chart-2))",
};

// Get color based on margin percentage
function getMarginColor(marginPct: number): string {
  if (marginPct >= 30) return "hsl(142, 76%, 36%)"; // Green - high margin
  if (marginPct >= 15) return "hsl(var(--chart-4))"; // Yellow - medium margin
  if (marginPct >= 0) return "hsl(var(--chart-5))"; // Orange - low margin
  return "hsl(0, 84%, 60%)"; // Red - negative margin
}

/**
 * Transform and sort profitability data.
 * Backend returns string amounts from Decimal serialization.
 */
function transformData(
  data: ProfitabilityReport,
  sortBy: SortBy,
  maxCustomers: number
) {
  const parsed = data.customers.map((customer) => ({
    customer_id: customer.customer_id,
    name: customer.customer_name,
    revenue: parseFloat(customer.revenue),
    costs: parseFloat(customer.costs),
    margin: parseFloat(customer.margin),
    margin_pct: parseFloat(customer.margin_pct),
    order_count: customer.order_count,
    avg_order_value: parseFloat(customer.avg_order_value),
    marginColor: getMarginColor(parseFloat(customer.margin_pct)),
  }));

  const sorted = parsed.sort((a, b) => {
    switch (sortBy) {
      case "margin":
        return b.margin - a.margin;
      case "margin_pct":
        return b.margin_pct - a.margin_pct;
      case "revenue":
      default:
        return b.revenue - a.revenue;
    }
  });

  return sorted.slice(0, maxCustomers);
}

// Custom tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: string;
    payload: {
      revenue: number;
      costs: number;
      margin: number;
      margin_pct: number;
      order_count: number;
      avg_order_value: number;
    };
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const customerData = payload[0]?.payload;

  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg min-w-[200px]">
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Revenue:</span>
          <span className="font-medium text-foreground">
            {formatCurrency(customerData.revenue)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Costs:</span>
          <span className="font-medium text-foreground">
            {formatCurrency(customerData.costs)}
          </span>
        </div>
        <div className="flex justify-between border-t border-border pt-1 mt-1">
          <span className="text-muted-foreground">Margin:</span>
          <span
            className="font-medium"
            style={{ color: getMarginColor(customerData.margin_pct) }}
          >
            {formatCurrency(customerData.margin)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Margin %:</span>
          <span
            className="font-medium"
            style={{ color: getMarginColor(customerData.margin_pct) }}
          >
            {formatPercent(customerData.margin_pct)}
          </span>
        </div>
        <div className="flex justify-between border-t border-border pt-1 mt-1">
          <span className="text-muted-foreground">Orders:</span>
          <span className="font-medium text-foreground">
            {customerData.order_count}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg Order:</span>
          <span className="font-medium text-foreground">
            {formatCurrency(customerData.avg_order_value)}
          </span>
        </div>
      </div>
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
      <div className="h-[350px] p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 mb-3">
            <Skeleton className="w-24 h-4" />
            <Skeleton
              className="h-6 rounded"
              style={{ width: `${Math.random() * 60 + 20}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4 mt-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

// Empty state
function EmptyState({ className }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center h-[350px] text-muted-foreground ${className}`}
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
      <p className="text-sm">No profitability data available</p>
    </div>
  );
}

// Summary stats component
interface SummaryStatsProps {
  data: ProfitabilityReport;
}

function SummaryStats({ data }: SummaryStatsProps) {
  const totalRevenue = parseFloat(data.total_revenue);
  const totalMargin = parseFloat(data.total_margin);
  const overallMarginPct = parseFloat(data.overall_margin_pct);

  return (
    <div className="flex flex-wrap justify-center gap-6 mb-4 text-sm">
      <div>
        <span className="text-muted-foreground">Total Revenue: </span>
        <span className="font-medium text-foreground">
          {formatCurrency(totalRevenue)}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground">Gross Margin: </span>
        <span
          className="font-medium"
          style={{ color: getMarginColor(overallMarginPct) }}
        >
          {formatCurrency(totalMargin)}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground">Margin %: </span>
        <span
          className="font-medium"
          style={{ color: getMarginColor(overallMarginPct) }}
        >
          {formatPercent(overallMarginPct)}
        </span>
      </div>
    </div>
  );
}

export function ProfitabilityChart({
  data,
  isLoading = false,
  sortBy = "revenue",
  showStacked = false,
  maxCustomers = 10,
  onCustomerClick,
  className,
}: ProfitabilityChartProps) {
  if (isLoading) {
    return <ChartSkeleton className={className} />;
  }

  if (!data || data.customers.length === 0) {
    return <EmptyState className={className} />;
  }

  const chartData = useMemo(
    () => transformData(data, sortBy, maxCustomers),
    [data, sortBy, maxCustomers]
  );

  // Calculate dynamic height based on number of items
  const chartHeight = Math.max(300, chartData.length * 40 + 50);

  if (showStacked) {
    // Stacked bar chart showing costs vs margin (= revenue)
    return (
      <div className={className}>
        <SummaryStats data={data} />
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickFormatter={formatYAxisTick}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => (
                <span className="text-sm text-foreground capitalize">{value}</span>
              )}
            />
            <Bar
              dataKey="costs"
              name="Costs"
              stackId="a"
              fill={CHART_COLORS.cost}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="margin"
              name="Margin"
              stackId="a"
              fill={CHART_COLORS.profit}
              radius={[0, 4, 4, 0]}
              onClick={(data) => onCustomerClick?.(data.customer_id)}
              cursor={onCustomerClick ? "pointer" : "default"}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Simple horizontal bar chart showing revenue with margin-based coloring
  return (
    <div className={className}>
      <SummaryStats data={data} />
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickFormatter={formatYAxisTick}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            formatter={(value) => (
              <span className="text-sm text-foreground capitalize">{value}</span>
            )}
          />
          <Bar
            dataKey="revenue"
            name="Revenue"
            radius={[0, 4, 4, 0]}
            onClick={(data) => onCustomerClick?.(data.customer_id)}
            cursor={onCustomerClick ? "pointer" : "default"}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.marginColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(142, 76%, 36%)" }} />
          <span>High margin (30%+)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(var(--chart-4))" }} />
          <span>Medium (15-30%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(var(--chart-5))" }} />
          <span>Low (0-15%)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(0, 84%, 60%)" }} />
          <span>Negative</span>
        </div>
      </div>
    </div>
  );
}
