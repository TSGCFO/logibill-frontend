"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Play,
  Loader2,
  MoreHorizontal,
  Eye,
  GitCompare,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useCustomers } from "@/hooks/use-customers";
import { formatDateTime, formatCurrency, formatNumber } from "@/lib/format";
import { toast } from "sonner";

interface DualRun {
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

interface DualRunStats {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  total_orders_compared: number;
  total_matches: number;
  total_mismatches: number;
  match_rate: number;
}

export default function DualRunComparisonPage() {
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const { data: customersData } = useCustomers();
  const customers = customersData?.data ?? [];

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dual-run-stats"],
    queryFn: async () => {
      const response = await api.get<{ data: DualRunStats }>(
        "/api/v1/billing/dual-run/stats"
      );
      return response.data?.data;
    },
  });

  const { data: runsData, isLoading: runsLoading } = useQuery({
    queryKey: ["dual-runs", pagination, selectedCustomerId],
    queryFn: async () => {
      const params: Record<string, string | number | boolean | undefined | null> = {
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
      };
      if (selectedCustomerId !== "all") {
        params.customer_id = selectedCustomerId;
      }
      const response = await api.get<{
        data: DualRun[];
        meta: { total: number; total_pages: number };
      }>("/api/v1/billing/dual-run/runs", params);
      return response.data;
    },
  });

  const startDualRun = useMutation({
    mutationFn: async (customerId?: string) => {
      if (customerId && customerId !== "all") {
        return api.post(`/api/v1/billing/dual-run/customer/${customerId}/start`);
      }
      return api.post("/api/v1/billing/dual-run/start");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dual-run-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dual-runs"] });
      toast.success("Dual run started", {
        description: "The comparison process has been initiated",
      });
    },
    onError: () => {
      toast.error("Failed to start dual run");
    },
  });

  const matchRate = stats?.match_rate ?? 0;

  const columns: ColumnDef<DualRun>[] = [
    {
      accessorKey: "started_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Started" />
      ),
      cell: ({ row }) => formatDateTime(row.original.started_at),
    },
    {
      accessorKey: "customer_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) =>
        row.original.customer_id ? (
          <Link
            href={`/customers/${row.original.customer_id}`}
            className="hover:underline"
          >
            {row.original.customer_name || `#${row.original.customer_id}`}
          </Link>
        ) : (
          <span className="text-muted-foreground">All Customers</span>
        ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={
              status === "completed"
                ? "default"
                : status === "running"
                ? "secondary"
                : "destructive"
            }
          >
            {status === "completed" && <CheckCircle className="mr-1 h-3 w-3" />}
            {status === "running" && (
              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
            )}
            {status === "failed" && <XCircle className="mr-1 h-3 w-3" />}
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "orders_compared",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Orders" />
      ),
      cell: ({ row }) => formatNumber(row.original.orders_compared),
    },
    {
      accessorKey: "matches",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Matches" />
      ),
      cell: ({ row }) => (
        <span className="text-green-600 dark:text-green-400">
          {formatNumber(row.original.matches)}
        </span>
      ),
    },
    {
      accessorKey: "mismatches",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mismatches" />
      ),
      cell: ({ row }) => (
        <span className={row.original.mismatches > 0 ? "text-red-600 dark:text-red-400" : ""}>
          {formatNumber(row.original.mismatches)}
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
        const variancePercent = row.original.variance_percent;
        const isPositive = variance > 0;
        const isNegative = variance < 0;
        return (
          <div className="text-right">
            <span
              className={
                isPositive
                  ? "text-green-600 dark:text-green-400"
                  : isNegative
                  ? "text-red-600 dark:text-red-400"
                  : ""
              }
            >
              {isPositive ? "+" : ""}
              {formatCurrency(variance)}
            </span>
            <p className="text-xs text-muted-foreground">
              {isPositive ? "+" : ""}
              {variancePercent.toFixed(2)}%
            </p>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/billing/dual-run/${row.original.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dual Run Comparison</h1>
          <p className="text-muted-foreground">
            Compare billing calculations between old and new engines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedCustomerId}
            onValueChange={setSelectedCustomerId}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={String(customer.id)}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={startDualRun.isPending}>
                {startDualRun.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Start Dual Run
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Start Dual Run Comparison?</AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedCustomerId === "all"
                    ? "This will compare billing calculations for all customers using both the old and new billing engines."
                    : "This will compare billing calculations for the selected customer using both engines."}
                  {" "}This operation may take several minutes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    startDualRun.mutate(
                      selectedCustomerId !== "all" ? selectedCustomerId : undefined
                    )
                  }
                >
                  Start Comparison
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <GitCompare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(stats?.total_runs ?? 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Match Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {matchRate.toFixed(1)}%
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats?.total_matches ?? 0)} matches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mismatches</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatNumber(stats?.total_mismatches ?? 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Compared</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(stats?.total_orders_compared ?? 0)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Dual Run History</CardTitle>
          <CardDescription>
            View all dual run comparisons and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={runsData?.data ?? []}
            isLoading={runsLoading}
            pageCount={runsData?.meta?.total_pages ?? 0}
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
