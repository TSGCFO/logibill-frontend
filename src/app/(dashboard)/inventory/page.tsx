"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  Filter,
  Download,
  ArrowUpDown,
  Building,
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
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { formatNumber } from "@/lib/format";

interface InventoryItem {
  id: string;
  sku: string;
  product_name: string;
  customer_name: string;
  customer_code: string;
  quantity_on_hand: number;
  quantity_available: number;
  quantity_reserved: number;
  location: string;
  last_movement: string;
}

const mockInventory: InventoryItem[] = [
  {
    id: "1",
    sku: "VAS-SERUM-001",
    product_name: "Vitamin C Serum 30ml",
    customer_name: "Vasanti Cosmetics",
    customer_code: "VAS",
    quantity_on_hand: 1250,
    quantity_available: 1100,
    quantity_reserved: 150,
    location: "A-12-3",
    last_movement: "2024-01-15T14:30:00Z",
  },
  {
    id: "2",
    sku: "VAS-CREAM-002",
    product_name: "Hydrating Face Cream 50ml",
    customer_name: "Vasanti Cosmetics",
    customer_code: "VAS",
    quantity_on_hand: 850,
    quantity_available: 850,
    quantity_reserved: 0,
    location: "A-12-4",
    last_movement: "2024-01-14T09:15:00Z",
  },
  {
    id: "3",
    sku: "CK-LIP-001",
    product_name: "Organic Lip Balm",
    customer_name: "Clean Kiss",
    customer_code: "CK",
    quantity_on_hand: 3200,
    quantity_available: 2800,
    quantity_reserved: 400,
    location: "B-05-1",
    last_movement: "2024-01-15T11:00:00Z",
  },
  {
    id: "4",
    sku: "CK-SOAP-002",
    product_name: "Natural Hand Soap 250ml",
    customer_name: "Clean Kiss",
    customer_code: "CK",
    quantity_on_hand: 500,
    quantity_available: 500,
    quantity_reserved: 0,
    location: "B-05-2",
    last_movement: "2024-01-13T16:45:00Z",
  },
];

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
    accessorKey: "product_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Product" />
    ),
  },
  {
    accessorKey: "customer_code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/customers/${row.original.customer_code}`}
        className="flex items-center gap-1 hover:underline"
      >
        <Building className="h-3 w-3" />
        {row.original.customer_code}
      </Link>
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
    accessorKey: "quantity_reserved",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reserved" />
    ),
    cell: ({ row }) =>
      row.original.quantity_reserved > 0 ? (
        <Badge variant="secondary">
          {formatNumber(row.original.quantity_reserved)}
        </Badge>
      ) : (
        <span className="text-muted-foreground">0</span>
      ),
  },
  {
    accessorKey: "location",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Location" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.location}</Badge>
    ),
  },
];

export default function InventoryPage() {
  const [customerFilter, setCustomerFilter] = useState<string>("all");

  const filteredInventory =
    customerFilter === "all"
      ? mockInventory
      : mockInventory.filter((item) => item.customer_code === customerFilter);

  const totalOnHand = filteredInventory.reduce(
    (sum, item) => sum + item.quantity_on_hand,
    0
  );
  const totalAvailable = filteredInventory.reduce(
    (sum, item) => sum + item.quantity_available,
    0
  );
  const totalReserved = filteredInventory.reduce(
    (sum, item) => sum + item.quantity_reserved,
    0
  );

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
            <div className="text-2xl font-bold">{filteredInventory.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total On Hand</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalOnHand)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totalAvailable)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserved</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totalReserved)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Levels</CardTitle>
          <CardDescription>
            Current stock levels by SKU and location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search SKU or product..." className="pl-9" />
              </div>
            </div>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="VAS">Vasanti Cosmetics</SelectItem>
                <SelectItem value="CK">Clean Kiss</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={filteredInventory}
            searchKey="sku"
            searchPlaceholder="Search inventory..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
