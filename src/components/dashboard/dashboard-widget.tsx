"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Package,
  FileText,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Clock,
  Users,
  Calculator,
  CheckCircle2,
  RefreshCw,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import type { WidgetType, WidgetSize } from "@/stores/dashboard";
import type { DashboardMetrics } from "@/types";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

// ============================================================================
// Props
// ============================================================================

interface DashboardWidgetProps {
  type: WidgetType;
  size: WidgetSize;
  metrics?: DashboardMetrics;
  isLoading?: boolean;
  error?: Error | null;
}

// ============================================================================
// Size utilities
// ============================================================================

/**
 * Returns Tailwind grid column span classes based on widget size.
 */
export function getWidgetGridClass(size: WidgetSize): string {
  switch (size) {
    case "small":
      return "col-span-1";
    case "medium":
      return "col-span-1 md:col-span-2 lg:col-span-2";
    case "large":
      return "col-span-1 md:col-span-2 lg:col-span-4";
  }
}

// ============================================================================
// Main Widget Renderer
// ============================================================================

export function DashboardWidget({
  type,
  size,
  metrics,
  isLoading,
  error,
}: DashboardWidgetProps) {
  switch (type) {
    case "revenue_mtd":
      return <RevenueMtdWidget metrics={metrics} isLoading={isLoading} error={error} />;
    case "orders_today":
      return <OrdersTodayWidget metrics={metrics} isLoading={isLoading} error={error} />;
    case "pending_invoices":
      return (
        <PendingInvoicesWidget metrics={metrics} isLoading={isLoading} error={error} />
      );
    case "overdue_invoices":
      return (
        <OverdueInvoicesWidget metrics={metrics} isLoading={isLoading} error={error} />
      );
    case "revenue_chart":
      return <RevenueChartWidget />;
    case "quick_actions":
      return <QuickActionsWidget />;
    case "recent_activity":
      return <RecentActivityWidget />;
    case "unbilled_charges":
      return <UnbilledChargesWidget metrics={metrics} isLoading={isLoading} />;
    case "sync_status":
      return <SyncStatusWidget />;
    default:
      return null;
  }
}

// ============================================================================
// Metric Card (shared)
// ============================================================================

function MetricCardWidget({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  trend,
  href,
  isLoading,
  error,
}: {
  title: string;
  value: string;
  change?: string;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
  href: string;
  isLoading?: boolean;
  error?: Error | null;
}) {
  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Unable to load data</p>
          <p className="text-xs text-muted-foreground mt-1">Check your connection or try refreshing</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-card-hover transition-shadow">
      <Link href={href}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {change && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {trend === "up" && (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              )}
              {trend === "down" && (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span
                className={
                  trend === "up"
                    ? "text-green-500"
                    : trend === "down"
                    ? "text-red-500"
                    : ""
                }
              >
                {change}
              </span>
              {changeLabel && <span>{changeLabel}</span>}
            </p>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}

// ============================================================================
// Individual Widgets
// ============================================================================

function RevenueMtdWidget({
  metrics,
  isLoading,
  error,
}: {
  metrics?: DashboardMetrics;
  isLoading?: boolean;
  error?: Error | null;
}) {
  return (
    <MetricCardWidget
      title="Revenue MTD"
      value={formatCurrency(parseFloat(metrics?.revenue_mtd ?? "0"))}
      change={
        metrics?.revenue_change_pct
          ? `${parseFloat(metrics.revenue_change_pct).toFixed(1)}%`
          : undefined
      }
      changeLabel="vs last month"
      icon={DollarSign}
      trend={
        parseFloat(metrics?.revenue_change_pct ?? "0") >= 0 ? "up" : "down"
      }
      href="/reports"
      isLoading={isLoading}
      error={error}
    />
  );
}

function OrdersTodayWidget({
  metrics,
  isLoading,
  error,
}: {
  metrics?: DashboardMetrics;
  isLoading?: boolean;
  error?: Error | null;
}) {
  return (
    <MetricCardWidget
      title="Orders Today"
      value={formatNumber(metrics?.orders_today ?? 0)}
      change={`${formatNumber(metrics?.orders_mtd ?? 0)} this month`}
      icon={Package}
      trend={
        parseFloat(metrics?.orders_change_pct ?? "0") >= 0 ? "up" : "down"
      }
      href="/orders"
      isLoading={isLoading}
      error={error}
    />
  );
}

function PendingInvoicesWidget({
  metrics,
  isLoading,
  error,
}: {
  metrics?: DashboardMetrics;
  isLoading?: boolean;
  error?: Error | null;
}) {
  return (
    <MetricCardWidget
      title="Pending Invoices"
      value={formatNumber(metrics?.pending_invoices_count ?? 0)}
      change={formatCurrency(
        parseFloat(metrics?.pending_invoices_amount ?? "0")
      )}
      changeLabel="total amount"
      icon={FileText}
      href="/invoices?status=pending"
      isLoading={isLoading}
      error={error}
    />
  );
}

function OverdueInvoicesWidget({
  metrics,
  isLoading,
  error,
}: {
  metrics?: DashboardMetrics;
  isLoading?: boolean;
  error?: Error | null;
}) {
  return (
    <MetricCardWidget
      title="Overdue"
      value={formatNumber(metrics?.overdue_invoices_count ?? 0)}
      change={formatCurrency(
        parseFloat(metrics?.overdue_invoices_amount ?? "0")
      )}
      icon={AlertCircle}
      trend="neutral"
      href="/invoices?status=overdue"
      isLoading={isLoading}
      error={error}
    />
  );
}

function RevenueChartWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Revenue Trend
        </CardTitle>
        <CardDescription>
          Monthly revenue over the past 12 months
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Revenue chart will be displayed here
        </p>
      </CardContent>
    </Card>
  );
}

function QuickActionsWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks you can perform</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <Button asChild variant="outline" className="justify-start">
          <Link href="/billing/accrual">
            <Calculator className="mr-2 h-4 w-4" />
            Run Accrual
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link href="/billing/periods">
            <Clock className="mr-2 h-4 w-4" />
            Close Billing Period
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link href="/invoices/new">
            <FileText className="mr-2 h-4 w-4" />
            Create Invoice
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link href="/customers/new">
            <Users className="mr-2 h-4 w-4" />
            Add Customer
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function RecentActivityWidget() {
  // Placeholder for real-time activity feed
  const activities = [
    { id: 1, text: "Vasanti: 15 orders synced", time: "2 minutes ago" },
    {
      id: 2,
      text: "Invoice #1234 sent to Clean Kiss",
      time: "5 minutes ago",
    },
    {
      id: 3,
      text: "Accrual completed: 47 orders processed",
      time: "1 hour ago",
    },
    {
      id: 4,
      text: "Payment received: $2,450 from Vasanti",
      time: "3 hours ago",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates from the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{activity.text}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function UnbilledChargesWidget({
  metrics,
  isLoading,
}: {
  metrics?: DashboardMetrics;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Derive unbilled data from the metrics we have available.
  // The pending invoices amount is a reasonable proxy; in production this
  // would come from a dedicated unbilled-charges endpoint.
  const pendingCount = metrics?.pending_invoices_count ?? 0;
  const pendingAmount = parseFloat(metrics?.pending_invoices_amount ?? "0");
  const overdueCount = metrics?.overdue_invoices_count ?? 0;
  const overdueAmount = parseFloat(metrics?.overdue_invoices_amount ?? "0");
  const totalUnbilled = pendingAmount + overdueAmount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Unbilled Charges
        </CardTitle>
        <CardDescription>
          Charges awaiting invoicing or payment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total unbilled</span>
            <span className="text-lg font-semibold">
              {formatCurrency(totalUnbilled)}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                Pending ({pendingCount})
              </span>
              <span>{formatCurrency(pendingAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                Overdue ({overdueCount})
              </span>
              <span className="text-red-600 font-medium">
                {formatCurrency(overdueAmount)}
              </span>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/billing/audit">View All Charges</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SyncStatusWidget() {
  // Placeholder data -- in production this would come from a sync-status API
  const syncItems = [
    {
      id: "orders",
      label: "Orders",
      status: "synced" as const,
      lastSync: "2 min ago",
    },
    {
      id: "customers",
      label: "Customers",
      status: "synced" as const,
      lastSync: "5 min ago",
    },
    {
      id: "products",
      label: "Products",
      status: "syncing" as const,
      lastSync: "In progress",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <RefreshCw className="h-4 w-4" />
          Sync Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {syncItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2">
                {item.status === "synced" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 text-blue-500 animate-spin" />
                )}
                {item.label}
              </span>
              <Badge
                variant={item.status === "synced" ? "secondary" : "outline"}
                className="text-xs font-normal"
              >
                {item.lastSync}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
