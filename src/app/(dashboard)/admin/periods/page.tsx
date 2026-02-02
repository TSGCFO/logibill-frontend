"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Calendar,
  Lock,
  Unlock,
  Eye,
  MoreHorizontal,
  CheckCircle,
  Clock,
  Loader2,
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
} from "@/components/ui/alert-dialog";
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatDate, formatCurrency } from "@/lib/format";
import { toast } from "sonner";

interface BillingPeriod {
  id: string;
  customer_id: number;
  customer_name?: string;
  period_start: string;
  period_end: string;
  status: "open" | "closed" | "invoiced";
  total_charges: number;
  orders_count: number;
  created_at: string;
  closed_at?: string;
}

export default function AdminPeriodsPage() {
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<BillingPeriod | null>(null);
  const [actionType, setActionType] = useState<"close" | "reopen" | null>(null);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-periods", pagination],
    queryFn: async () => {
      const response = await api.get<{
        data: BillingPeriod[];
        meta: { total: number; total_pages: number };
      }>("/api/v1/admin/periods", {
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
      });
      return response.data;
    },
  });

  const closePeriod = useMutation({
    mutationFn: async (periodId: string) => {
      await api.post(`/api/v1/billing/periods/${periodId}/close`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-periods"] });
      toast.success("Period closed successfully");
      setSelectedPeriod(null);
      setActionType(null);
    },
    onError: () => {
      toast.error("Failed to close period");
    },
  });

  const reopenPeriod = useMutation({
    mutationFn: async (periodId: string) => {
      await api.post(`/api/v1/billing/periods/${periodId}/reopen`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-periods"] });
      toast.success("Period reopened successfully");
      setSelectedPeriod(null);
      setActionType(null);
    },
    onError: () => {
      toast.error("Failed to reopen period");
    },
  });

  const handleAction = () => {
    if (!selectedPeriod || !actionType) return;

    if (actionType === "close") {
      closePeriod.mutate(selectedPeriod.id);
    } else {
      reopenPeriod.mutate(selectedPeriod.id);
    }
  };

  const columns: ColumnDef<BillingPeriod>[] = [
    {
      accessorKey: "customer_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/customers/${row.original.customer_id}`}
          className="font-medium hover:underline"
        >
          {row.original.customer_name || `Customer #${row.original.customer_id}`}
        </Link>
      ),
    },
    {
      accessorKey: "period_start",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Period" />
      ),
      cell: ({ row }) => (
        <span>
          {formatDate(row.original.period_start)} - {formatDate(row.original.period_end)}
        </span>
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
              status === "open"
                ? "outline"
                : status === "closed"
                ? "secondary"
                : "default"
            }
          >
            {status === "open" && <Clock className="mr-1 h-3 w-3" />}
            {status === "closed" && <Lock className="mr-1 h-3 w-3" />}
            {status === "invoiced" && <CheckCircle className="mr-1 h-3 w-3" />}
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "orders_count",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Orders" />
      ),
    },
    {
      accessorKey: "total_charges",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Charges" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.total_charges)}
        </span>
      ),
    },
    {
      accessorKey: "closed_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Closed" />
      ),
      cell: ({ row }) =>
        row.original.closed_at ? formatDate(row.original.closed_at) : "-",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const period = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/billing/periods/${period.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {period.status === "open" && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedPeriod(period);
                    setActionType("close");
                  }}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Close Period
                </DropdownMenuItem>
              )}
              {period.status === "closed" && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedPeriod(period);
                    setActionType("reopen");
                  }}
                >
                  <Unlock className="mr-2 h-4 w-4" />
                  Reopen Period
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Period Management</h1>
          <p className="text-muted-foreground">
            Manage billing periods across all customers
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Periods</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.data?.filter((p) => p.status === "open").length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Periods</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.data?.filter((p) => p.status === "closed").length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoiced</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.data?.filter((p) => p.status === "invoiced").length ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Periods</CardTitle>
          <CardDescription>
            View and manage billing periods for all customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            pageCount={data?.meta?.total_pages ?? 0}
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            onPaginationChange={setPagination}
            manualPagination
          />
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!selectedPeriod && !!actionType}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPeriod(null);
            setActionType(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "close" ? "Close Period?" : "Reopen Period?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "close"
                ? "This will close the billing period and prevent any new charges from being added. You can reopen it later if needed."
                : "This will reopen the billing period and allow new charges to be added."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={closePeriod.isPending || reopenPeriod.isPending}
            >
              {(closePeriod.isPending || reopenPeriod.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {actionType === "close" ? "Close Period" : "Reopen Period"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
