"use client";

import Link from "next/link";
import {
  DollarSign,
  Clock,
  AlertCircle,
  TrendingUp,
  Calculator,
  FileText,
  Settings,
  Play,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillingPeriods, useUnbilledCharges, useAccrualStats } from "@/hooks/use-billing";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
  isLoading,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  isLoading?: boolean;
}) {
  const content = (
    <Card className={href ? "hover:shadow-card-hover transition-shadow cursor-pointer" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-3 w-32" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export default function BillingDashboardPage() {
  const { data: periodsData, isLoading: periodsLoading } = useBillingPeriods({
    per_page: 5,
    status: "open",
  });
  const { data: unbilledData, isLoading: unbilledLoading } = useUnbilledCharges();
  const { data: accrualStats, isLoading: accrualLoading } = useAccrualStats();

  const openPeriods = periodsData?.data?.data ?? [];
  const unbilledCharges = unbilledData ?? [];
  const totalUnbilled = unbilledCharges.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of billing operations and unbilled charges
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/billing/config">
              <Settings className="mr-2 h-4 w-4" />
              Configuration
            </Link>
          </Button>
          <Button asChild>
            <Link href="/billing/accrual">
              <Play className="mr-2 h-4 w-4" />
              Run Accrual
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Unbilled"
          value={formatCurrency(totalUnbilled)}
          description={`${unbilledCharges.length} charges pending`}
          icon={DollarSign}
          href="/billing/unbilled"
          isLoading={unbilledLoading}
        />
        <StatCard
          title="Open Periods"
          value={openPeriods.length}
          description="Ready for invoicing"
          icon={Clock}
          href="/billing/periods"
          isLoading={periodsLoading}
        />
        <StatCard
          title="Last Accrual"
          value={
            accrualStats?.last_run_at
              ? formatDate(accrualStats.last_run_at)
              : "Never"
          }
          description={`${formatNumber(accrualStats?.total_orders_processed ?? 0)} orders processed`}
          icon={Calculator}
          href="/billing/accrual"
          isLoading={accrualLoading}
        />
        <StatCard
          title="Success Rate"
          value={
            accrualStats
              ? `${Math.round(
                  (accrualStats.successful_runs / (accrualStats.total_runs || 1)) * 100
                )}%`
              : "-"
          }
          description={`${accrualStats?.total_runs ?? 0} total runs`}
          icon={TrendingUp}
          href="/billing/accrual"
          isLoading={accrualLoading}
        />
      </div>

      {/* Open Periods */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Open Billing Periods</CardTitle>
              <CardDescription>
                Periods ready for review and invoicing
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/billing/periods">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {periodsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-12 w-48" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : openPeriods.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No open billing periods
            </p>
          ) : (
            <div className="space-y-4">
              {openPeriods.map((period) => (
                <div
                  key={period.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <Link
                      href={`/billing/periods/${period.id}`}
                      className="font-medium hover:underline"
                    >
                      {period.customer?.name || `Customer #${period.customer_id}`}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(period.start_date)} - {formatDate(period.end_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(period.total_charges)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {period.total_orders} orders
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-card-hover transition-shadow">
          <Link href="/billing/periods">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Billing Periods
              </CardTitle>
              <CardDescription>
                Manage billing periods and close periods for invoicing
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-card-hover transition-shadow">
          <Link href="/billing/materials">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Materials Pricing
              </CardTitle>
              <CardDescription>
                Configure global and customer-specific materials pricing
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-card-hover transition-shadow">
          <Link href="/billing/sandbox">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Billing Sandbox
              </CardTitle>
              <CardDescription>
                Test billing rules without affecting production data
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  );
}
