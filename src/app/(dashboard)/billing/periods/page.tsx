"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Eye, Lock, Unlock, FileText } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import {
  useBillingPeriods,
  useClosePeriod,
  useReopenPeriod,
} from "@/hooks/use-billing";
import { formatDate, formatCurrency, formatNumber } from "@/lib/format";
import { toast } from "sonner";
import type { BillingPeriod } from "@/types";

function PeriodActions({ period }: { period: BillingPeriod }) {
  const closePeriod = useClosePeriod(period.id);
  const reopenPeriod = useReopenPeriod(period.id);

  const handleClose = async () => {
    try {
      await closePeriod.mutateAsync();
      toast.success("Period closed", {
        description: "The billing period has been closed",
      });
    } catch {
      toast.error("Failed to close period");
    }
  };

  const handleReopen = async () => {
    try {
      await reopenPeriod.mutateAsync();
      toast.success("Period reopened", {
        description: "The billing period has been reopened",
      });
    } catch {
      toast.error("Failed to reopen period");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/billing/periods/${period.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {period.status === "open" && (
          <DropdownMenuItem onClick={handleClose}>
            <Lock className="mr-2 h-4 w-4" />
            Close Period
          </DropdownMenuItem>
        )}
        {period.status === "closed" && (
          <>
            <DropdownMenuItem asChild>
              <Link href={`/invoices/from-period/${period.id}`}>
                <FileText className="mr-2 h-4 w-4" />
                Create Invoice
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleReopen}>
              <Unlock className="mr-2 h-4 w-4" />
              Reopen Period
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const columns: ColumnDef<BillingPeriod>[] = [
  {
    accessorKey: "customer",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/customers/${row.original.customer_id}`}
        className="font-medium hover:underline"
      >
        {row.original.customer?.name || `Customer #${row.original.customer_id}`}
      </Link>
    ),
  },
  {
    accessorKey: "start_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Period" />
    ),
    cell: ({ row }) => (
      <span>
        {formatDate(row.original.start_date)} - {formatDate(row.original.end_date)}
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
      const variants: Record<string, "default" | "secondary" | "outline"> = {
        open: "secondary",
        closed: "default",
        invoiced: "outline",
      };
      return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
    },
  },
  {
    accessorKey: "total_orders",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Orders" />
    ),
    cell: ({ row }) => formatNumber(row.original.total_orders),
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
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => formatDate(row.original.created_at),
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
    cell: ({ row }) => <PeriodActions period={row.original} />,
  },
];

export default function BillingPeriodsPage() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading } = useBillingPeriods({
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    status: statusFilter,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Periods</h1>
          <p className="text-muted-foreground">
            View and manage billing periods for all customers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) =>
              setStatusFilter(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="invoiced">Invoiced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.data?.data ?? []}
        isLoading={isLoading}
        pageCount={data?.data?.meta?.total_pages ?? 0}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={setPagination}
        manualPagination
      />
    </div>
  );
}
