"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useCustomers } from "@/hooks/use-customers";
import { formatDateTime } from "@/lib/format";
import { Loader2 } from "lucide-react";

interface InventoryTransaction {
  id: string;
  timestamp: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  customer_id?: string;
  customer_name?: string;
  transaction_type: "receipt" | "shipment" | "adjustment" | "return";
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
}

export default function InventoryTransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");

  const { data: customersData } = useCustomers();
  const customers = customersData?.data ?? [];

  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ["inventory-transactions", typeFilter, customerFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (typeFilter !== "all") params.type = typeFilter;
      if (customerFilter !== "all") params.customer_id = customerFilter;

      const response = await api.get<{ data: InventoryTransaction[] }>(
        "/api/v1/inventory/transactions",
        params
      );
      return response.data?.data;
    },
  });

  const filteredTransactions = transactionsData?.filter(
    (tx) =>
      searchQuery === "" ||
      tx.product_sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.reference_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "receipt":
        return <ArrowDownRight className="h-4 w-4 text-green-500" />;
      case "shipment":
        return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
      case "adjustment":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "return":
        return <ArrowDownRight className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "receipt":
        return "default";
      case "shipment":
        return "secondary";
      case "adjustment":
        return "outline";
      case "return":
        return "default";
      default:
        return "outline";
    }
  };

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
            <div className="relative md:col-span-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by SKU, product, or reference..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="receipt">Receipt</SelectItem>
                <SelectItem value="shipment">Shipment</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
                <SelectItem value="return">Return</SelectItem>
              </SelectContent>
            </Select>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
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
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {filteredTransactions?.length ?? 0} transactions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTransactions && filteredTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">Before</TableHead>
                  <TableHead className="text-right">After</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">
                      {formatDateTime(tx.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(tx.transaction_type)}
                        <Badge variant={getTypeBadgeVariant(tx.transaction_type)}>
                          {tx.transaction_type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tx.product_name}</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {tx.product_sku}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{tx.customer_name || "-"}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          tx.quantity_change > 0
                            ? "text-green-600 font-medium"
                            : tx.quantity_change < 0
                            ? "text-red-600 font-medium"
                            : ""
                        }
                      >
                        {tx.quantity_change > 0 ? "+" : ""}
                        {tx.quantity_change}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.quantity_before}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {tx.quantity_after}
                    </TableCell>
                    <TableCell>
                      {tx.reference_type && tx.reference_id ? (
                        <span className="text-sm">
                          {tx.reference_type}: {tx.reference_id}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No transactions</h3>
              <p className="text-muted-foreground">
                No inventory transactions match your filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
