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
import { Progress } from "@/components/ui/progress";
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

interface AccrualRun {
  id: string;
  started_at: string;
  completed_at?: string;
  status: "running" | "completed" | "failed";
  customer_id?: number;
  customer_name?: string;
  orders_processed: number;
  charges_created: number;
  total_amount: number;
  errors?: string[];
}

interface AccrualStats {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  total_orders_processed: number;
  total_charges_created: number;
  total_amount_billed: number;
  last_run_at?: string;
}

export default function AdminAccrualPage() {
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const { data: customersData } = useCustomers();
  const customers = customersData?.data?.data ?? [];

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-accrual-stats"],
    queryFn: async () => {
      const response = await api.get<{ data: AccrualStats }>(
        "/api/v1/accrual/stats"
      );
      return response.data.data;
    },
  });

  const { data: runsData, isLoading: runsLoading } = useQuery({
    queryKey: ["admin-accrual-runs", pagination, selectedCustomerId],
    queryFn: async () => {
      const params: Record<string, unknown> = {
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

  const successRate = stats
    ? Math.round((stats.successful_runs / (stats.total_runs || 1)) * 100)
    : 0;

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
      accessorKey: "total_amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.total_amount)}
        </span>
      ),
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
      accessorKey: "errors",
      header: "Errors",
      cell: ({ row }) => {
        const errors = row.original.errors;
        if (!errors || errors.length === 0) {
          return <span className="text-muted-foreground">None</span>;
        }
        return (
          <Badge variant="destructive">{errors.length} error(s)</Badge>
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
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{successRate}%</div>
                <Progress value={successRate} className="mt-2" />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Processed</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(stats?.total_orders_processed ?? 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.total_amount_billed ?? 0)}
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
