"use client";

import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Clock,
  Link as LinkIcon,
  ArrowRight,
  Truck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useShippingDashboard } from "@/hooks/use-shipping";
import { formatCurrency, formatNumber } from "@/lib/format";

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
    <Card
      className={
        href ? "hover:shadow-card-hover transition-shadow cursor-pointer" : ""
      }
    >
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

export default function ShippingDashboardPage() {
  const { data: metrics, isLoading } = useShippingDashboard();

  const statusEntries = metrics?.charges_by_status
    ? Object.entries(metrics.charges_by_status)
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Shipping Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of shipping charges, markups, and carrier accounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/shipping/client-mapping">
              <LinkIcon className="mr-2 h-4 w-4" />
              Carrier Accounts
            </Link>
          </Button>
          <Button asChild>
            <Link href="/shipping/charges">
              <DollarSign className="mr-2 h-4 w-4" />
              View Charges
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Charges"
          value={formatCurrency(parseFloat(metrics?.total_charges ?? "0"))}
          description="All shipping charges"
          icon={DollarSign}
          href="/shipping/charges"
          isLoading={isLoading}
        />
        <StatCard
          title="Markup Revenue"
          value={formatCurrency(parseFloat(metrics?.total_markup ?? "0"))}
          description="Total markup applied"
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <StatCard
          title="Pending Charges"
          value={formatNumber(metrics?.pending_charges_count ?? 0)}
          description={`${formatCurrency(parseFloat(metrics?.pending_charges_total ?? "0"))} awaiting billing`}
          icon={Clock}
          href="/shipping/charges"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Accounts"
          value={formatNumber(metrics?.active_mappings_count ?? 0)}
          description="Carrier accounts"
          icon={LinkIcon}
          href="/shipping/client-mapping"
          isLoading={isLoading}
        />
      </div>

      {/* Charges by Carrier */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Charges by Carrier</CardTitle>
              <CardDescription>
                Shipping charge breakdown by carrier
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/shipping/charges">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          ) : (metrics?.charges_by_carrier ?? []).length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No carrier charges recorded yet
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carrier</TableHead>
                  <TableHead className="text-right">Charges</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(metrics?.charges_by_carrier ?? []).map((item) => (
                  <TableRow key={item.carrier_code}>
                    <TableCell className="font-medium">
                      {item.carrier_name || item.carrier_code}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(item.charge_count)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(parseFloat(item.total_amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Charges by Status */}
      <Card>
        <CardHeader>
          <CardTitle>Charges by Status</CardTitle>
          <CardDescription>
            Current distribution of shipping charge statuses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : statusEntries.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No charge data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {statusEntries.map(([status, data]) => (
                <div
                  key={status}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        status === "billed"
                          ? "default"
                          : status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(data.count)} charge
                      {data.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(parseFloat(data.total))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-card-hover transition-shadow">
          <Link href="/shipping/charges">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Shipping Charges
              </CardTitle>
              <CardDescription>
                View and manage all shipping charges, mark as billed, and track
                skipped charges
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-card-hover transition-shadow">
          <Link href="/shipping/client-mapping">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Carrier Accounts
              </CardTitle>
              <CardDescription>
                Manage carrier accounts and their mappings for automated charge
                matching
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  );
}
