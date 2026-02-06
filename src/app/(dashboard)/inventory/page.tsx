"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  Filter,
  Download,
  Building,
  MapPin,
  AlertTriangle,
  Loader2,
  ArrowRightLeft,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { formatNumber, formatDateTime } from "@/lib/format";
import { useInventory, useInventorySummary } from "@/hooks/use-inventory";
import { useCustomers } from "@/hooks/use-customers";
import type { InventoryItem } from "@/types";

const columns: ColumnDef<InventoryItem>[] = [
  {
    accessorKey: "sku",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="SKU" />
    ),
    cell: ({ row }) => (
      <span className="font-mono font-medium">{row.original.sku}</span>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Product" />
    ),
    cell: ({ row }) => (
      <span className="max-w-[200px] truncate">
        {row.original.description || "-"}
      </span>
    ),
  },
  {
    accessorKey: "customer_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Building className="h-3 w-3 text-muted-foreground" />
        <span>{row.original.customer_name || "-"}</span>
      </div>
    ),
  },
  {
    accessorKey: "location",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Location" />
    ),
    cell: ({ row }) =>
      row.original.location ? (
        <Badge variant="outline">{row.original.location}</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    accessorKey: "quantity_on_hand",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="On Hand" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">
        {formatNumber(row.original.quantity_on_hand)}
      </span>
    ),
  },
  {
    accessorKey: "quantity_available",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Available" />
    ),
    cell: ({ row }) => formatNumber(row.original.quantity_available),
  },
  {
    accessorKey: "quantity_allocated",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Allocated" />
    ),
    cell: ({ row }) =>
      row.original.quantity_allocated > 0 ? (
        <Badge variant="secondary">
          {formatNumber(row.original.quantity_allocated)}
        </Badge>
      ) : (
        <span className="text-muted-foreground">0</span>
      ),
  },
  {
    accessorKey: "last_updated",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Updated" />
    ),
    cell: ({ row }) =>
      row.original.last_updated ? (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(row.original.last_updated)}
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
];

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Debounce search input
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Simple debounce using timeout
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  };

  const inventoryParams = useMemo(
    () => ({
      page,
      per_page: 20,
      customer_id: customerFilter !== "all" ? customerFilter : undefined,
      search: debouncedSearch || undefined,
      low_stock: lowStockOnly || undefined,
    }),
    [page, customerFilter, debouncedSearch, lowStockOnly]
  );

  const { data: inventoryData, isLoading } = useInventory(inventoryParams);
  const { data: summaryData, isLoading: summaryLoading } =
    useInventorySummary(
      customerFilter !== "all" ? customerFilter : undefined
    );
  const { data: customersData } = useCustomers();

  const inventory = inventoryData?.data ?? [];
  const meta = inventoryData?.meta;
  const customers = customersData?.data ?? [];

  const summary = summaryData ?? {
    total_skus: 0,
    total_quantity: 0,
    total_locations: 0,
    low_stock_count: 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            View current inventory levels across all customers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/inventory/transactions">
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Transactions
            </Link>
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(summary.total_skus)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Quantity
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(summary.total_quantity)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(summary.total_locations)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">
                {summary.low_stock_count > 0 ? (
                  <span className="text-destructive">
                    {formatNumber(summary.low_stock_count)}
                  </span>
                ) : (
                  formatNumber(summary.low_stock_count)
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Levels</CardTitle>
          <CardDescription>
            Current stock levels by SKU and location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search SKU or product..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>
            <Select
              value={customerFilter}
              onValueChange={(value) => {
                setCustomerFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All customers" />
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
            <div className="flex items-center gap-2">
              <Switch
                id="low-stock"
                checked={lowStockOnly}
                onCheckedChange={(checked) => {
                  setLowStockOnly(checked);
                  setPage(1);
                }}
              />
              <Label htmlFor="low-stock" className="text-sm cursor-pointer">
                Low Stock Only
              </Label>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={inventory}
            isLoading={isLoading}
            manualPagination={true}
            pageCount={meta?.total_pages ?? 0}
            pageIndex={page - 1}
            pageSize={20}
            onPaginationChange={({ pageIndex }) => setPage(pageIndex + 1)}
            exportFilename="inventory-export"
            exportColumns={[
              { key: "sku", label: "SKU" },
              { key: "description", label: "Product" },
              { key: "customer_name", label: "Customer" },
              { key: "location", label: "Location" },
              { key: "quantity_on_hand", label: "On Hand" },
              { key: "quantity_available", label: "Available" },
              { key: "quantity_allocated", label: "Allocated" },
              { key: "last_updated", label: "Last Updated" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
