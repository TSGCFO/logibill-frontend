"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  MoreHorizontal,
  Search,
} from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/tables/data-table";
import {
  useShippingCharges,
  useMarkChargeAsBilled,
  type ShippingChargesParams,
} from "@/hooks/use-shipping";
import type { ShippingCharge } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { DateRangeFilter, type DateRange } from "@/components/shared/date-range-filter";

export default function ShippingChargesPage() {
  const [params, setParams] = useState<ShippingChargesParams>({
    page: 1,
    per_page: 20,
  });
  const [searchInput, setSearchInput] = useState("");

  const { data: chargesData, isLoading } = useShippingCharges(params);
  const markAsBilled = useMarkChargeAsBilled();

  const charges = chargesData?.data ?? [];
  const meta = chargesData?.meta;

  const handleStatusFilter = (value: string) => {
    setParams((prev) => ({
      ...prev,
      status: value === "all" ? undefined : (value as ShippingChargesParams["status"]),
      page: 1,
    }));
  };

  const handleSearch = () => {
    setParams((prev) => ({
      ...prev,
      search: searchInput || undefined,
      page: 1,
    }));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleMarkAsBilled = (chargeId: number) => {
    markAsBilled.mutate(chargeId, {
      onSuccess: () => {
        toast.success("Charge marked as billed");
      },
      onError: () => {
        toast.error("Failed to mark charge as billed");
      },
    });
  };

  const columns: ColumnDef<ShippingCharge>[] = useMemo(
    () => [
      {
        accessorKey: "order_id",
        header: "Order ID",
        cell: ({ row }) => (
          <span className="font-medium">#{row.original.order_id}</span>
        ),
      },
      {
        accessorKey: "customer_name",
        header: "Customer",
        cell: ({ row }) => (
          <span className="truncate max-w-[150px] block">
            {row.original.customer_name}
          </span>
        ),
      },
      {
        accessorKey: "carrier_code",
        header: "Carrier",
        cell: ({ row }) => row.original.carrier_code,
      },
      {
        accessorKey: "transaction_number",
        header: "Transaction #",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.transaction_number || "-"}
          </span>
        ),
      },
      {
        accessorKey: "processed_date",
        header: "Date",
        cell: ({ row }) =>
          row.original.processed_date ? formatDate(row.original.processed_date) : "-",
      },
      {
        accessorKey: "shipping_cost_total",
        header: "Shipping ($)",
        cell: ({ row }) => formatCurrency(parseFloat(row.original.shipping_cost_total) || 0),
      },
      {
        accessorKey: "customer_billing",
        header: "Billed ($)",
        cell: ({ row }) => formatCurrency(parseFloat(row.original.customer_billing ?? "0") || 0),
      },
      {
        accessorKey: "final_total",
        header: "Total ($)",
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(parseFloat(row.original.final_total ?? "0") || 0)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              variant={
                status === "billed"
                  ? "default"
                  : status === "pending"
                  ? "secondary"
                  : "destructive"
              }
            >
              {status}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const charge = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {charge.status === "pending" && (
                  <DropdownMenuItem
                    onClick={() => handleMarkAsBilled(charge.id)}
                    disabled={markAsBilled.isPending}
                  >
                    {markAsBilled.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Mark as Billed
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [markAsBilled]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/shipping/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Shipping Charges
            </h1>
            <p className="text-muted-foreground">
              View and manage shipping charges across all carriers
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order, customer, or tracking..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9"
            />
          </div>
          <Select
            value={params.status ?? "all"}
            onValueChange={handleStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="billed">Billed</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleSearch}>
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
        <DateRangeFilter
          inline
          value={{
            dateFrom: params.date_from ?? "",
            dateTo: params.date_to ?? "",
          }}
          onChange={(range: DateRange) => {
            setParams((prev) => ({
              ...prev,
              date_from: range.dateFrom || undefined,
              date_to: range.dateTo || undefined,
              page: 1,
            }));
          }}
        />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={charges}
        isLoading={isLoading}
        manualPagination
        pageCount={meta?.total_pages ?? 1}
        pageIndex={(meta?.page ?? 1) - 1}
        pageSize={meta?.per_page ?? 20}
        onPaginationChange={({ pageIndex, pageSize }) => {
          setParams((prev) => ({
            ...prev,
            page: pageIndex + 1,
            per_page: pageSize,
          }));
        }}
        exportFilename="shipping-charges-export"
        exportColumns={[
          { key: "order_id", label: "Order ID" },
          { key: "customer_name", label: "Customer" },
          { key: "carrier_name", label: "Carrier" },
          { key: "tracking_number", label: "Tracking #" },
          { key: "ship_date", label: "Ship Date" },
          { key: "charge_amount", label: "Charge ($)" },
          { key: "markup_amount", label: "Markup ($)" },
          { key: "total_amount", label: "Total ($)" },
          { key: "status", label: "Status" },
        ]}
      />
    </div>
  );
}
