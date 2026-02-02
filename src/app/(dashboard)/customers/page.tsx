"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Settings,
  Package,
  Zap,
  Filter,
  X,
} from "lucide-react";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { useCustomers } from "@/hooks/use-customers";
import { formatCurrency } from "@/lib/format";
import type { Customer } from "@/types";

const getStatusBadgeVariant = (
  status: Customer["status"]
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "active":
      return "default";
    case "inactive":
      return "secondary";
    case "suspended":
      return "destructive";
    case "on_hold":
      return "outline";
    default:
      return "secondary";
  }
};

const getBillingConfigBadge = (
  status?: Customer["billing_config_status"]
): { variant: "default" | "secondary" | "destructive"; label: string } => {
  switch (status) {
    case "configured":
      return { variant: "default", label: "Configured" };
    case "incomplete":
      return { variant: "secondary", label: "Incomplete" };
    case "needs_setup":
    default:
      return { variant: "destructive", label: "Needs Setup" };
  }
};

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Legal Name / DBA" />
    ),
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <div>
          <Link
            href={`/customers/${customer.id}`}
            className="font-medium hover:underline"
          >
            {customer.legal_name || customer.name}
          </Link>
          {customer.dba && customer.dba !== customer.name && (
            <p className="text-sm text-muted-foreground">DBA: {customer.dba}</p>
          )}
          <p className="text-xs text-muted-foreground">{customer.code}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={getStatusBadgeVariant(status)}>
          {status.replace("_", " ")}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "business_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Business Type" />
    ),
    cell: ({ row }) => row.original.business_type || "-",
  },
  {
    id: "location",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Location" />
    ),
    cell: ({ row }) => {
      const { city, province } = row.original;
      if (!city && !province) return "-";
      return [city, province].filter(Boolean).join(", ");
    },
  },
  {
    accessorKey: "credit_limit",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Credit Limit" />
    ),
    cell: ({ row }) =>
      row.original.credit_limit != null
        ? formatCurrency(row.original.credit_limit)
        : "-",
  },
  {
    id: "billing",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Billing" />
    ),
    cell: ({ row }) => {
      const { billing_cadence, payment_terms } = row.original;
      if (!billing_cadence) return `Net ${payment_terms}`;
      const cadenceLabel =
        billing_cadence === "monthly"
          ? "Monthly"
          : billing_cadence === "biweekly"
          ? "Bi-weekly"
          : "Weekly";
      return `${cadenceLabel} Net ${payment_terms}`;
    },
  },
  {
    accessorKey: "billing_config_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Billing Config" />
    ),
    cell: ({ row }) => {
      const { variant, label } = getBillingConfigBadge(
        row.original.billing_config_status
      );
      return (
        <Link
          href={`/billing/config/${row.original.id}`}
          className="hover:underline"
        >
          <Badge variant={variant}>{label}</Badge>
        </Link>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const customer = row.original;

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
              <Link href={`/billing/config/${customer.id}`}>
                <Settings className="mr-2 h-4 w-4" />
                Configure Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/customers/${customer.id}/products`}>
                <Package className="mr-2 h-4 w-4" />
                View Products
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/customers/${customer.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/customers/${customer.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function CustomersPage() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading } = useCustomers({
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  const hasFilters = search || statusFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customers and their billing configurations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/customers/new?quick=true">
              <Zap className="mr-2 h-4 w-4" />
              Quick Setup
            </Link>
          </Button>
          <Button asChild>
            <Link href="/customers/new">
              <Plus className="mr-2 h-4 w-4" />
              New Customer
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="name"
        searchPlaceholder="Search customers..."
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
