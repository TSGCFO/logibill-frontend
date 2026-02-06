"use client";

import { useState, useMemo } from "react";
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
} from "@/hooks/use-reports";
import { RevenueChart, AgingChart, ProfitabilityChart } from "@/components/charts";
import { formatCurrency, formatNumber } from "@/lib/format";

/**
 * Reports Page
 *
 * Analytics and reporting dashboard with real chart visualizations.
 * Connected to backend API via report hooks.
 *
 * Track: frontend-prod_20260202
 * Task: 2.2, 2.4, 2.6
 */
export default function ReportsPage() {
  const [period, setPeriod] = useState("30d");
  const [revenuePeriod, setRevenuePeriod] = useState<
    "daily" | "weekly" | "monthly" | "quarterly"
  >("weekly");

  // Calculate date range based on period selection
  const dateRange = useMemo(() => {
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
      date_from: start.toISOString().split("T")[0],
      date_to: end.toISOString().split("T")[0],
    };
  }, [period]);

  // Fetch report data
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: revenueData, isLoading: revenueLoading } = useRevenueReport({
    ...dateRange,
    period: revenuePeriod,
  });
  const { data: agingData, isLoading: agingLoading } = useAgingReport();
  const { data: profitabilityData, isLoading: profitabilityLoading } =
    useProfitabilityReport(dateRange);

  // Export mutation
  const exportMutation = useExportReport();

  const handleExport = async (
    reportType: "revenue" | "aging" | "profitability" | "dashboard"
  ) => {
    try {
      const result = await exportMutation.mutateAsync({
        type: reportType,
        format: "excel",
        ...dateRange,
      });

      // Open download URL
      if (result.file_url) {
        window.open(result.file_url, "_blank");
      }
      toast.success("Export ready", {
        description: `${result.filename} is downloading`,
      });
    } catch {
      toast.error("Export failed", {
        description: "Unable to generate report export",
      });
    }
  };

  // Parse dashboard string amounts to numbers for display
  const revenueMtd = metrics ? parseFloat(metrics.revenue_mtd) : 0;
  const revenueChangePct = metrics?.revenue_change_pct
    ? parseFloat(metrics.revenue_change_pct)
    : 0;
  const overdueAmount = metrics
    ? parseFloat(metrics.overdue_invoices_amount)
    : 0;

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
                  {formatCurrency(revenueMtd)}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span
                    className={
                      revenueChangePct >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {revenueChangePct >= 0 ? "+" : ""}
                    {revenueChangePct.toFixed(1)}%
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
                  {formatNumber(metrics?.orders_mtd ?? 0)} this month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Invoices
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics?.pending_invoices_count ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(
                    parseFloat(metrics?.pending_invoices_amount ?? "0")
                  )}{" "}
                  awaiting payment
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overdue Amount
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(overdueAmount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(metrics?.overdue_invoices_count ?? 0)} invoices
                  overdue
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
                <Select
                  value={revenuePeriod}
                  onValueChange={(v) =>
                    setRevenuePeriod(
                      v as "daily" | "weekly" | "monthly" | "quarterly"
                    )
                  }
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
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
                data={revenueData}
                isLoading={revenueLoading}
                chartType="bar"
                groupBy={revenuePeriod}
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
              <CardDescription>Revenue by service type</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Service breakdown uses by_service_type from revenue report */}
              {revenueLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : revenueData?.by_service_type &&
                revenueData.by_service_type.length > 0 ? (
                <div className="space-y-4">
                  {revenueData.by_service_type.map((item) => {
                    const amount = parseFloat(item.amount);
                    const percentage = parseFloat(item.percentage);
                    return (
                      <div
                        key={item.service_type}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {item.service_type_name || item.service_type}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {percentage.toFixed(1)}% of total ({item.count}{" "}
                            charges)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(amount)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No service data available</p>
                    <p className="text-sm mt-1">
                      Request service type breakdown by changing the revenue
                      report group_by parameter
                    </p>
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
