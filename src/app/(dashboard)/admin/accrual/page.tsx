"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  Loader2,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Progress removed - no longer used in stats
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useCustomers } from "@/hooks/use-customers";
import { formatDateTime, formatNumber, formatCurrency } from "@/lib/format";
import { toast } from "sonner";

// Use types from @/types (already corrected to match backend)
import type { AccrualRun as AccrualRunType, AccrualStats } from "@/types";

// AccrualRun with optional customer fields returned in the list endpoint
interface AccrualRun extends AccrualRunType {
  customer_id?: number;
  customer_name?: string;
}

export default function AdminAccrualPage() {
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const { data: customersData } = useCustomers();
  const customers = customersData?.data ?? [];

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-accrual-stats"],
    queryFn: async () => {
      const response = await api.get<AccrualStats>(
        "/api/v1/accrual/stats"
      );
      return response.data;
    },
  });

  const { data: runsData, isLoading: runsLoading } = useQuery({
    queryKey: ["admin-accrual-runs", pagination, selectedCustomerId],
    queryFn: async () => {
      const params: Record<string, string | number | boolean | undefined | null> = {
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
      };
      if (selectedCustomerId !== "all") {
        params.customer_id = selectedCustomerId;
      }
      const response = await api.get<{
        data: AccrualRun[];
        meta: { total: number; total_pages: number };
      }>("/api/v1/accrual/runs", params);
      return response.data;
    },
  });

  const runAccrual = useMutation({
    mutationFn: async (customerId?: string) => {
      if (customerId && customerId !== "all") {
        return api.post(`/api/v1/accrual/customer/${customerId}/run`);
      }
      return api.post("/api/v1/accrual/run");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accrual-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-accrual-runs"] });
      toast.success("Accrual started", {
        description: "The accrual process has been initiated",
      });
    },
    onError: () => {
      toast.error("Failed to start accrual");
    },
  });

  // AccrualStats from backend has total_charges, total_amount, total_orders, by_status
  // Derive run counts from by_status array if available
  const statusCounts = stats?.by_status ?? [];
  const totalCharges = stats?.total_charges ?? 0;
  const totalAmount = stats?.total_amount ?? "0";
  const totalOrders = stats?.total_orders ?? 0;

  const columns: ColumnDef<AccrualRun>[] = [
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
                  : status === "partial"
                    ? "outline"
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
      accessorKey: "orders_processed",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Orders" />
      ),
      cell: ({ row }) => formatNumber(row.original.orders_processed),
    },
    {
      accessorKey: "charges_created",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Charges" />
      ),
      cell: ({ row }) => formatNumber(row.original.charges_created),
    },
    {
      accessorKey: "charges_skipped",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Skipped" />
      ),
      cell: ({ row }) => formatNumber(row.original.charges_skipped),
    },
    {
      accessorKey: "completed_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Completed" />
      ),
      cell: ({ row }) =>
        row.original.completed_at
          ? formatDateTime(row.original.completed_at)
          : "-",
    },
    {
      accessorKey: "errors_count",
      header: "Errors",
      cell: ({ row }) => {
        const count = row.original.errors_count;
        if (!count || count === 0) {
          return <span className="text-muted-foreground">None</span>;
        }
        return (
          <Badge variant="destructive">{count} error(s)</Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accrual Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and run billing accrual processes
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
              <Button disabled={runAccrual.isPending}>
                {runAccrual.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Run Accrual
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Run Billing Accrual?</AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedCustomerId === "all"
                    ? "This will process all unaccrued orders for all customers and generate billing charges."
                    : "This will process all unaccrued orders for the selected customer and generate billing charges."}
                  {" "}This operation may take several minutes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    runAccrual.mutate(
                      selectedCustomerId !== "all" ? selectedCustomerId : undefined
                    )
                  }
                >
                  Run Accrual
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
            <CardTitle className="text-sm font-medium">Total Charges</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(totalCharges)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(totalOrders)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(stats?.by_customer?.length ?? 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(parseFloat(totalAmount) || 0)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Accrual Run History</CardTitle>
          <CardDescription>
            View all accrual runs and their status
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
