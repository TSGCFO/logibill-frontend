"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  Download,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  useDashboardMetrics,
  useRevenueReport,
  useAgingReport,
  useProfitabilityReport,
  useExportReport,
  type RevenueReportParams,
} from "@/hooks/use-reports";
import { RevenueChart, AgingChart, ProfitabilityChart } from "@/components/charts";
import { formatCurrency, formatNumber } from "@/lib/format";

/**
 * Reports Page
 *
 * Analytics and reporting dashboard with real chart visualizations.
 * Connected to API via report hooks.
 *
 * Track: frontend-prod_20260202
 * Task: 2.2, 2.4, 2.6
 */
export default function ReportsPage() {
  const [period, setPeriod] = useState("30d");
  const [revenueGroupBy, setRevenueGroupBy] = useState<"day" | "week" | "month">("week");

  // Calculate date range based on period
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case "7d":
        start.setDate(end.getDate() - 7);
        break;
      case "30d":
        start.setDate(end.getDate() - 30);
        break;
      case "90d":
        start.setDate(end.getDate() - 90);
        break;
      case "ytd":
        start.setMonth(0, 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }

    return {
      start_date: start.toISOString().split("T")[0],
      end_date: end.toISOString().split("T")[0],
    };
  };

  const dateRange = getDateRange();

  // Fetch report data
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: revenueData, isLoading: revenueLoading } = useRevenueReport({
    ...dateRange,
    group_by: revenueGroupBy,
  });
  const { data: agingData, isLoading: agingLoading } = useAgingReport();
  const { data: profitabilityData, isLoading: profitabilityLoading } =
    useProfitabilityReport(dateRange);

  // Export mutation
  const exportMutation = useExportReport();

  const handleExport = async (reportType: "revenue" | "aging" | "profitability" | "dashboard") => {
    try {
      const result = await exportMutation.mutateAsync({
        report_type: reportType,
        format: "xlsx",
        ...dateRange,
      });

      // Open download URL
      window.open(result.download_url, "_blank");
      toast.success("Export ready", {
        description: `${result.filename} is downloading`,
      });
    } catch {
      toast.error("Export failed", {
        description: "Unable to generate report export",
      });
    }
  };

  // Transform revenue data for chart (array format)
  const revenueChartData = revenueData ? [revenueData] : undefined;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Analytics and insights for your billing data
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => handleExport("dashboard")}
            disabled={exportMutation.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            {exportMutation.isPending ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics?.revenue_mtd ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className={metrics?.revenue_change_pct && metrics.revenue_change_pct >= 0 ? "text-green-600" : "text-red-600"}>
                    {metrics?.revenue_change_pct ? `${metrics.revenue_change_pct >= 0 ? "+" : ""}${metrics.revenue_change_pct.toFixed(1)}%` : "0%"}
                  </span>{" "}
                  from last period
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics?.orders_today ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className={metrics?.orders_avg_diff && metrics.orders_avg_diff >= 0 ? "text-green-600" : "text-red-600"}>
                    {metrics?.orders_avg_diff ? `${metrics.orders_avg_diff >= 0 ? "+" : ""}${metrics.orders_avg_diff}` : "0"}
                  </span>{" "}
                  vs daily average
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics?.pending_invoices ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  awaiting payment
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(metrics?.overdue_amount ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(metrics?.overdue_invoices ?? 0)} invoices overdue
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="aging">Aging</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>
                  Revenue breakdown by period and category
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={revenueGroupBy} onValueChange={(v) => setRevenueGroupBy(v as "day" | "week" | "month")}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("revenue")}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <RevenueChart
                data={revenueChartData}
                isLoading={revenueLoading}
                chartType="bar"
                groupBy={revenueGroupBy}
                showByChargeType
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Invoice Aging Report</CardTitle>
                <CardDescription>
                  Outstanding invoices by age bucket
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("aging")}
              >
                <Download className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <AgingChart
                data={agingData}
                isLoading={agingLoading}
                chartType="pie"
                onBucketClick={(bucket) => {
                  toast.info(`Filtering by ${bucket}`, {
                    description: "Navigate to invoices filtered by age",
                  });
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Customer Profitability</CardTitle>
                <CardDescription>
                  Revenue and profitability by customer
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("profitability")}
              >
                <Download className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <ProfitabilityChart
                data={profitabilityData}
                isLoading={profitabilityLoading}
                sortBy="revenue"
                showStacked
                maxCustomers={10}
                onCustomerClick={(customerId) => {
                  toast.info("Opening customer details", {
                    description: `Navigating to customer ${customerId}`,
                  });
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Service Breakdown</CardTitle>
              <CardDescription>
                Revenue by service type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Service breakdown uses charge type data from revenue report */}
              {revenueLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : revenueData?.by_charge_type && revenueData.by_charge_type.length > 0 ? (
                <div className="space-y-4">
                  {revenueData.by_charge_type.map((item) => (
                    <div key={item.charge_type} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium capitalize">{item.charge_type.replace("_", " ")}</p>
                        <p className="text-sm text-muted-foreground">
                          {((item.amount / revenueData.total) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(item.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No service data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
