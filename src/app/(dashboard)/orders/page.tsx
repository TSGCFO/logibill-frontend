"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Eye, X } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { useOrders } from "@/hooks/use-orders";
import { useCustomers } from "@/hooks/use-customers";
import { formatDate, formatNumber } from "@/lib/format";
import type { Order } from "@/types";

const getBillingStatusBadge = (
  status: Order["billing_status"]
): { variant: "default" | "secondary" | "outline"; label: string } => {
  switch (status) {
    case "billed":
      return { variant: "default", label: "Billed" };
    case "partial":
      return { variant: "secondary", label: "Partial" };
    case "unbilled":
    default:
      return { variant: "outline", label: "Unbilled" };
  }
};

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "reference_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reference" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/orders/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.reference_id || row.original.wms_order_id}
      </Link>
    ),
  },
  {
    accessorKey: "wms_order_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="WMS ID" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.wms_order_id}
      </span>
    ),
  },
  {
    accessorKey: "customer",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/customers/${row.original.customer_id}`}
        className="hover:underline"
      >
        {row.original.customer?.name || `Customer #${row.original.customer_id}`}
      </Link>
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
            status === "shipped"
              ? "default"
              : status === "pending"
              ? "secondary"
              : "outline"
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "order_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.order_type}</Badge>
    ),
  },
  {
    accessorKey: "total_quantity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Qty" />
    ),
    cell: ({ row }) =>
      row.original.total_quantity != null
        ? formatNumber(row.original.total_quantity)
        : row.original.items_count,
  },
  {
    accessorKey: "total_weight",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Weight" />
    ),
    cell: ({ row }) =>
      row.original.total_weight != null
        ? `${row.original.total_weight.toFixed(2)} lbs`
        : "-",
  },
  {
    accessorKey: "process_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Process Date" />
    ),
    cell: ({ row }) =>
      row.original.process_date
        ? formatDate(row.original.process_date)
        : row.original.ship_date
        ? formatDate(row.original.ship_date)
        : "-",
  },
  {
    accessorKey: "billing_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Billing" />
    ),
    cell: ({ row }) => {
      const { variant, label } = getBillingStatusBadge(
        row.original.billing_status
      );
      return <Badge variant={variant}>{label}</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original;

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
              <Link href={`/orders/${order.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function OrdersPage() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });
  const [filters, setFilters] = useState<{
    customer_id?: string;
    order_type?: string;
    billing_status?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
  }>({});
  const [search, setSearch] = useState("");

  const { data, isLoading } = useOrders({
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    search: search || undefined,
    customer_id: filters.customer_id,
    order_type: filters.order_type,
    billing_status: filters.billing_status,
    status: filters.status,
    date_from: filters.date_from,
    date_to: filters.date_to,
  });

  const { data: customersData } = useCustomers({ per_page: 100 });

  const clearFilters = () => {
    setFilters({});
    setSearch("");
  };

  const hasFilters =
    search ||
    filters.customer_id ||
    filters.order_type ||
    filters.billing_status ||
    filters.status ||
    filters.date_from ||
    filters.date_to;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            View and manage customer orders synced from WMS
            {data?.meta?.total != null && (
              <span className="ml-2">
                ({formatNumber(data.meta.total)} total)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            placeholder="Press / to search, Enter to submit"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={filters.customer_id || "all"}
          onValueChange={(value) =>
            setFilters((f) => ({
              ...f,
              customer_id: value === "all" ? undefined : value,
            }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            {customersData?.data?.map((customer) => (
              <SelectItem key={customer.id} value={String(customer.id)}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.order_type || "all"}
          onValueChange={(value) =>
            setFilters((f) => ({
              ...f,
              order_type: value === "all" ? undefined : value,
            }))
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Order Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="B2B">B2B</SelectItem>
            <SelectItem value="Consumer">Consumer</SelectItem>
            <SelectItem value="Retail">Retail</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.billing_status || "all"}
          onValueChange={(value) =>
            setFilters((f) => ({
              ...f,
              billing_status: value === "all" ? undefined : value,
            }))
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Billing Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="billed">Billed</SelectItem>
            <SelectItem value="unbilled">Unbilled</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            placeholder="Start Date"
            className="w-[140px]"
            value={filters.date_from || ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                date_from: e.target.value || undefined,
              }))
            }
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            placeholder="End Date"
            className="w-[140px]"
            value={filters.date_to || ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                date_to: e.target.value || undefined,
              }))
            }
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="wms_order_id"
        searchPlaceholder="Search orders..."
        isLoading={isLoading}
        pageCount={data?.meta?.total_pages ?? 0}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={setPagination}
        manualPagination
        showSearch={false}
      />
    </div>
  );
}
