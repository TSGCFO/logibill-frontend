"use client";

import { TrendingDown, TrendingUp, DollarSign, ShoppingCart, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

export interface MetricData {
  value: number;
  previousValue?: number;
  trend?: number;
}

export interface BillingMetricsData {
  revenue: MetricData;
  orders: MetricData;
  charges: MetricData;
  period: {
    label: string;
    startDate: string;
    endDate: string;
  };
}

interface BillingMetricsProps {
  metrics: BillingMetricsData;
  className?: string;
}

interface MetricCardProps {
  title: string;
  description?: string;
  value: string;
  trend?: number;
  icon: React.ReactNode;
}

function MetricCard({ title, description, value, trend, icon }: MetricCardProps) {
  const hasTrend = typeof trend === "number";
  const isPositive = hasTrend && trend >= 0;
  const isNegative = hasTrend && trend < 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hasTrend && (
          <div className="flex items-center gap-1 text-xs">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span
              className={cn(
                "font-medium",
                isPositive && "text-emerald-500",
                isNegative && "text-red-500"
              )}
            >
              {isPositive ? "+" : ""}
              {formatPercent(trend)}
            </span>
            <span className="text-muted-foreground">from previous period</span>
          </div>
        )}
        {description && !hasTrend && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardContent>
    </Card>
  );
}

export function BillingMetrics({ metrics, className }: BillingMetricsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Billing Overview</h2>
        <span className="text-sm text-muted-foreground">
          {metrics.period.label}
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Revenue"
          value={formatCurrency(metrics.revenue.value)}
          trend={metrics.revenue.trend}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard
          title="Orders"
          value={formatNumber(metrics.orders.value)}
          trend={metrics.orders.trend}
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <MetricCard
          title="Charges"
          value={formatNumber(metrics.charges.value)}
          trend={metrics.charges.trend}
          icon={<Zap className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}
