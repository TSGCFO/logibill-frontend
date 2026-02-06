"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
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
import { useCustomers } from "@/hooks/use-customers";
import {
  useDualRunComparisons,
  useStartDualRun,
  type DualRunComparison,
} from "@/hooks/use-billing";
import { formatDateTime, formatCurrency, formatNumber } from "@/lib/format";
import { toast } from "sonner";

export default function DualRunComparisonPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const { data: customersData } = useCustomers();
  const customers = customersData?.data ?? [];

  const { data: comparisonsData, isLoading: comparisonsLoading } =
    useDualRunComparisons({
      page: pagination.pageIndex + 1,
      per_page: pagination.pageSize,
      customer_id:
        selectedCustomerId !== "all" ? selectedCustomerId : undefined,
    });

  const startDualRun = useStartDualRun();

  const handleStartDualRun = () => {
    if (selectedCustomerId === "all") {
      toast.error("Please select a customer to compare");
      return;
    }

    startDualRun.mutate(
      { customer_id: Number(selectedCustomerId) },
      {
        onSuccess: (result) => {
          toast.success("Dual-run comparison completed", {
            description: `${result.orders_compared} orders compared - ${result.match_status.replace("_", " ")}`,
          });
        },
        onError: () => {
          toast.error("Failed to start dual-run comparison");
        },
      }
    );
  };

  // Compute summary stats from current page data
  const comparisons = comparisonsData?.data ?? [];
  const totalComparisons = comparisonsData?.meta?.total ?? 0;
  const perfectMatches = comparisons.filter(
    (c) => c.match_status === "perfect_match"
  ).length;
  const majorVariances = comparisons.filter(
    (c) => c.match_status === "major_variance"
  ).length;

  const columns: ColumnDef<DualRunComparison>[] = [
    {
      accessorKey: "run_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) =>
        row.original.run_at ? formatDateTime(row.original.run_at) : "-",
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
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: "orders_compared",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Orders" />
      ),
      cell: ({ row }) => formatNumber(row.original.orders_compared),
    },
    {
      accessorKey: "old_system_total",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Old Total" />
      ),
      cell: ({ row }) => (
        <span className="font-mono">
          {formatCurrency(Number(row.original.old_system_total))}
        </span>
      ),
    },
    {
      accessorKey: "new_system_total",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="New Total" />
      ),
      cell: ({ row }) => (
        <span className="font-mono">
          {formatCurrency(Number(row.original.new_system_total))}
        </span>
      ),
    },
    {
      accessorKey: "variance_amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Delta" />
      ),
      cell: ({ row }) => {
        const delta = Number(row.original.variance_amount);
        const deltaPercent = Number(row.original.variance_percentage);
        return (
          <div className="text-right">
            <span
              className={
                delta > 0
                  ? "text-red-600 dark:text-red-400"
                  : delta < 0
                    ? "text-green-600 dark:text-green-400"
                    : ""
              }
            >
              {delta > 0 ? "+" : ""}
              {formatCurrency(delta)}
            </span>
            {deltaPercent > 0 && (
              <p className="text-xs text-muted-foreground">
                {deltaPercent.toFixed(2)}%
              </p>
            )}
          </div>
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
              status === "perfect_match"
                ? "default"
                : status === "minor_variance"
                  ? "secondary"
                  : "destructive"
            }
          >
            {status === "perfect_match" && (
              <CheckCircle className="mr-1 h-3 w-3" />
            )}
            {status === "minor_variance" && (
              <AlertTriangle className="mr-1 h-3 w-3" />
            )}
            {status === "major_variance" && (
              <XCircle className="mr-1 h-3 w-3" />
            )}
            {status.replace("_", " ")}
          </Badge>
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
          <h1 className="text-3xl font-bold tracking-tight">
            Dual-Run Comparison
          </h1>
          <p className="text-muted-foreground">
            Compare old vs new billing rules side-by-side
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedCustomerId}
            onValueChange={setSelectedCustomerId}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Customer" />
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
              <Button
                disabled={
                  startDualRun.isPending || selectedCustomerId === "all"
                }
              >
                {startDualRun.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Start Comparison
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Start Dual-Run Comparison?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will run the billing engine twice for the selected
                  customer -- once with the current configuration and once with
                  the proposed rules -- and compare the results.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleStartDualRun}>
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
            <CardTitle className="text-sm font-medium">
              Total Comparisons
            </CardTitle>
            <GitCompare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {comparisonsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(totalComparisons)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Perfect Matches
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {comparisonsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatNumber(perfectMatches)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">on this page</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Major Variances
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {comparisonsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatNumber(majorVariances)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">on this page</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Page Size
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {comparisonsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(comparisons.length)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              of {formatNumber(totalComparisons)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Comparisons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Comparison History</CardTitle>
          <CardDescription>
            View all dual-run comparisons and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={comparisons}
            isLoading={comparisonsLoading}
            pageCount={comparisonsData?.meta?.total_pages ?? 0}
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
