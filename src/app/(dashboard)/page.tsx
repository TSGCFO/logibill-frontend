"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "lucide-react";
import Link from "next/link";
import { useDashboardMetrics } from "@/hooks/use-billing";
import { useRevenueReport } from "@/hooks/use-reports";
import { useActivityFeed } from "@/hooks/use-activity";
import { RevenueChart } from "@/components/charts";
import { formatCurrency, formatNumber, formatRelativeTime } from "@/lib/format";

function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  trend,
  href,
  isLoading,
}: {
  title: string;
  value: string;
  change?: string;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
  href: string;
  isLoading?: boolean;
}) {
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

function QuickActionsCard() {
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

function RecentActivityCard() {
  const { data: activities, isLoading } = useActivityFeed({ limit: 5, refetchInterval: 30000 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates from the system</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-2 w-2 rounded-full mt-2" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: metrics, isLoading } = useDashboardMetrics();

  // Fetch revenue data for the last 12 months
  const end = new Date();
  const start = new Date();
  start.setMonth(end.getMonth() - 12);

  const { data: revenueData, isLoading: revenueLoading } = useRevenueReport({
    start_date: start.toISOString().split("T")[0],
    end_date: end.toISOString().split("T")[0],
    group_by: "month",
  });

  // Transform revenue data for chart
  const chartData = revenueData ? [revenueData] : undefined;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your billing operations
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Revenue MTD"
          value={formatCurrency(metrics?.revenue_mtd ?? 0)}
          change={`${metrics?.revenue_change_pct ?? 0}%`}
          changeLabel="vs last month"
          icon={DollarSign}
          trend={(metrics?.revenue_change_pct ?? 0) >= 0 ? "up" : "down"}
          href="/reports"
          isLoading={isLoading}
        />
        <MetricCard
          title="Orders Today"
          value={formatNumber(metrics?.orders_today ?? 0)}
          change={`${metrics?.orders_avg_diff ?? 0}`}
          changeLabel="vs daily avg"
          icon={Package}
          trend={(metrics?.orders_avg_diff ?? 0) >= 0 ? "up" : "down"}
          href="/orders"
          isLoading={isLoading}
        />
        <MetricCard
          title="Pending Invoices"
          value={formatNumber(metrics?.pending_invoices ?? 0)}
          icon={FileText}
          href="/invoices?status=pending"
          isLoading={isLoading}
        />
        <MetricCard
          title="Overdue"
          value={formatNumber(metrics?.overdue_invoices ?? 0)}
          change={formatCurrency(metrics?.overdue_amount ?? 0)}
          icon={AlertCircle}
          trend="neutral"
          href="/invoices?status=overdue"
          isLoading={isLoading}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trend
            </CardTitle>
            <CardDescription>Monthly revenue over the past 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart
              data={chartData}
              isLoading={revenueLoading}
              chartType="area"
              groupBy="month"
            />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="col-span-3 space-y-4">
          <QuickActionsCard />
          <RecentActivityCard />
        </div>
      </div>
    </div>
  );
}
