"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { formatDateTime, formatNumber } from "@/lib/format";
import { useInventoryTransactions } from "@/hooks/use-inventory";
import { useCustomers } from "@/hooks/use-customers";
import type { InventoryTransaction } from "@/types";

function getTypeIcon(type: string) {
  switch (type) {
    case "receipt":
      return <ArrowDownRight className="h-4 w-4 text-green-500" />;
    case "shipment":
      return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
    case "adjustment":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "transfer":
      return <RefreshCw className="h-4 w-4 text-purple-500" />;
    default:
      return null;
  }
}

function getTypeBadgeVariant(
  type: string
): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "receipt":
      return "default";
    case "shipment":
      return "secondary";
    case "adjustment":
      return "outline";
    case "transfer":
      return "default";
    default:
      return "outline";
  }
}

const columns: ColumnDef<InventoryTransaction>[] = [
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) =>
      row.original.created_at ? (
        <span className="text-sm">
          {formatDateTime(row.original.created_at)}
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    accessorKey: "product_sku",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Product / SKU" />
    ),
    cell: ({ row }) => (
      <div>
        <p className="font-medium truncate max-w-[180px]">
          {row.original.product_name || "-"}
        </p>
        <p className="text-sm text-muted-foreground font-mono">
          {row.original.product_sku}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "customer_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => row.original.customer_name || "-",
  },
  {
    accessorKey: "transaction_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {getTypeIcon(row.original.transaction_type)}
        <Badge variant={getTypeBadgeVariant(row.original.transaction_type)}>
          {row.original.transaction_type}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "quantity_change",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Qty Change" />
    ),
    cell: ({ row }) => {
      const qty = row.original.quantity_change;
      const isPositive = qty > 0;
      const isNegative = qty < 0;
      return (
        <span
          className={
            isPositive
              ? "text-green-600 font-medium"
              : isNegative
              ? "text-red-600 font-medium"
              : ""
          }
        >
          {isPositive ? "+" : ""}
          {formatNumber(qty)}
        </span>
      );
    },
  },
  {
    accessorKey: "reference_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reference" />
    ),
    cell: ({ row }) =>
      row.original.reference_number ? (
        <span className="text-sm font-mono">
          {row.original.reference_number}
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    id: "locations",
    header: "From / To Location",
    cell: ({ row }) => {
      const from = row.original.location_from;
      const to = row.original.location_to;
      if (!from && !to)
        return <span className="text-muted-foreground">-</span>;
      return (
        <div className="text-sm">
          {from && (
            <span>
              <span className="text-muted-foreground">From:</span> {from}
            </span>
          )}
          {from && to && <span className="mx-1 text-muted-foreground">/</span>}
          {to && (
            <span>
              <span className="text-muted-foreground">To:</span> {to}
            </span>
          )}
        </div>
      );
    },
  },
];

export default function InventoryTransactionsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: customersData } = useCustomers();
  const customers = customersData?.data ?? [];

  const transactionParams = useMemo(
    () => ({
      page,
      per_page: 20,
      customer_id: customerFilter !== "all" ? customerFilter : undefined,
      transaction_type: typeFilter !== "all" ? typeFilter : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [page, customerFilter, typeFilter, dateFrom, dateTo]
  );

  const { data: transactionsData, isLoading } =
    useInventoryTransactions(transactionParams);

  const transactions = transactionsData?.data ?? [];
  const meta = transactionsData?.meta;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Inventory Transactions
          </h1>
          <p className="text-muted-foreground">
            View all inventory movements and adjustments
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Select
              value={customerFilter}
              onValueChange={(value) => {
                setCustomerFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Customer" />
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
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="receipt">Receipt</SelectItem>
                <SelectItem value="shipment">Shipment</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="From date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
            <Input
              type="date"
              placeholder="To date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {meta
              ? `${meta.total} transaction${meta.total !== 1 ? "s" : ""} found`
              : "Loading..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isLoading && transactions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No transactions</h3>
              <p className="text-muted-foreground">
                No inventory transactions match your filters
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={transactions}
              isLoading={isLoading}
              manualPagination={true}
              pageCount={meta?.total_pages ?? 0}
              pageIndex={page - 1}
              pageSize={20}
              onPaginationChange={({ pageIndex }) => setPage(pageIndex + 1)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
