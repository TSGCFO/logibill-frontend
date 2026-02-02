"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Filter,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatDateTime, formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface DualRunDetail {
  id: string;
  started_at: string;
  completed_at?: string;
  status: "running" | "completed" | "failed";
  customer_id?: number;
  customer_name?: string;
  orders_compared: number;
  matches: number;
  mismatches: number;
  old_total: number;
  new_total: number;
  variance: number;
  variance_percent: number;
}

interface ChargeComparison {
  order_id: string;
  order_number: string;
  service_code: string;
  service_name: string;
  old_amount: number;
  new_amount: number;
  variance: number;
  variance_percent: number;
  match_status: "match" | "mismatch" | "new" | "removed";
  notes?: string;
}

export default function DualRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [filter, setFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });

  const { data: run, isLoading: runLoading } = useQuery({
    queryKey: ["dual-run", id],
    queryFn: async () => {
      const response = await api.get<{ data: DualRunDetail }>(
        `/api/v1/billing/dual-run/runs/${id}`
      );
      return response.data.data;
    },
  });

  const { data: comparisons, isLoading: comparisonsLoading } = useQuery({
    queryKey: ["dual-run-comparisons", id, filter, pagination],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
      };
      if (filter !== "all") {
        params.status = filter;
      }
      const response = await api.get<{
        data: ChargeComparison[];
        meta: { total: number; total_pages: number };
      }>(`/api/v1/billing/dual-run/runs/${id}/comparisons`, params);
      return response.data;
    },
  });

  const columns: ColumnDef<ChargeComparison>[] = [
    {
      accessorKey: "order_number",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/orders/${row.original.order_id}`}
          className="font-mono text-sm hover:underline"
        >
          {row.original.order_number}
        </Link>
      ),
    },
    {
      accessorKey: "service_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Service" />
      ),
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.service_name}</span>
          <p className="text-xs text-muted-foreground font-mono">
            {row.original.service_code}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "old_amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Old Amount" />
      ),
      cell: ({ row }) => (
        <span className="font-mono">
          {formatCurrency(row.original.old_amount)}
        </span>
      ),
    },
    {
      accessorKey: "new_amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="New Amount" />
      ),
      cell: ({ row }) => (
        <span className="font-mono">
          {formatCurrency(row.original.new_amount)}
        </span>
      ),
    },
    {
      accessorKey: "variance",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Variance" />
      ),
      cell: ({ row }) => {
        const variance = row.original.variance;
        const isPositive = variance > 0;
        const isNegative = variance < 0;
        return (
          <div className="flex items-center gap-1">
            {isPositive && <ArrowUpRight className="h-4 w-4 text-green-600" />}
            {isNegative && <ArrowDownRight className="h-4 w-4 text-red-600" />}
            {variance === 0 && <Minus className="h-4 w-4 text-muted-foreground" />}
            <span
              className={cn(
                "font-mono",
                isPositive && "text-green-600 dark:text-green-400",
                isNegative && "text-red-600 dark:text-red-400"
              )}
            >
              {isPositive ? "+" : ""}
              {formatCurrency(variance)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "variance_percent",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="%" />
      ),
      cell: ({ row }) => {
        const percent = row.original.variance_percent;
        const isPositive = percent > 0;
        const isNegative = percent < 0;
        return (
          <span
            className={cn(
              "font-mono text-sm",
              isPositive && "text-green-600 dark:text-green-400",
              isNegative && "text-red-600 dark:text-red-400"
            )}
          >
            {isPositive ? "+" : ""}
            {percent.toFixed(2)}%
          </span>
        );
      },
    },
    {
      accessorKey: "match_status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.original.match_status;
        return (
          <Badge
            variant={
              status === "match"
                ? "default"
                : status === "mismatch"
                ? "destructive"
                : "secondary"
            }
          >
            {status === "match" && <CheckCircle className="mr-1 h-3 w-3" />}
            {status === "mismatch" && <XCircle className="mr-1 h-3 w-3" />}
            {status === "new" && <ArrowUpRight className="mr-1 h-3 w-3" />}
            {status === "removed" && <ArrowDownRight className="mr-1 h-3 w-3" />}
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) =>
        row.original.notes ? (
          <span className="text-sm text-muted-foreground max-w-xs truncate">
            {row.original.notes}
          </span>
        ) : (
          "-"
        ),
    },
  ];

  if (runLoading) {
    return <DualRunDetailSkeleton />;
  }

  const matchPercent = run
    ? Math.round((run.matches / (run.orders_compared || 1)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/billing/dual-run">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Dual Run Details</h1>
            <Badge
              variant={
                run?.status === "completed"
                  ? "default"
                  : run?.status === "running"
                  ? "secondary"
                  : "destructive"
              }
            >
              {run?.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {run?.customer_name
              ? `Comparison for ${run.customer_name}`
              : "All customers comparison"}{" "}
            • Started {run?.started_at && formatDateTime(run.started_at)}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Orders Compared</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(run?.orders_compared ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatNumber(run?.matches ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">{matchPercent}% match rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mismatches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatNumber(run?.mismatches ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Old Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(run?.old_total ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(run?.new_total ?? 0)}
            </div>
            {run?.variance !== undefined && run.variance !== 0 && (
              <p
                className={cn(
                  "text-xs",
                  run.variance > 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {run.variance > 0 ? "+" : ""}
                {formatCurrency(run.variance)} ({run.variance_percent?.toFixed(2)}%)
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Variance Alert */}
      {run?.mismatches && run.mismatches > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
            <div>
              <p className="font-medium text-orange-800 dark:text-orange-200">
                Billing Discrepancies Detected
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                {run.mismatches} charge{run.mismatches > 1 ? "s" : ""} differ between
                the old and new billing engines. Review the comparison below to identify
                the source of discrepancies.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Charge Comparison</CardTitle>
              <CardDescription>
                Side-by-side comparison of charges from old and new engines
              </CardDescription>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Charges</SelectItem>
                <SelectItem value="match">Matches Only</SelectItem>
                <SelectItem value="mismatch">Mismatches Only</SelectItem>
                <SelectItem value="new">New Charges</SelectItem>
                <SelectItem value="removed">Removed Charges</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={comparisons?.data ?? []}
            isLoading={comparisonsLoading}
            pageCount={comparisons?.meta?.total_pages ?? 0}
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            onPaginationChange={setPagination}
            manualPagination
          />
        </CardContent>
      </Card>
    </div>
  );
}

function DualRunDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-1" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
