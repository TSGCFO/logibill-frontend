"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Download,
  ChevronDown,
  ChevronRight,
  Shield,
  Loader2,
  Search,
} from "lucide-react";
import { ColumnDef, Row } from "@tanstack/react-table";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DataTable } from "@/components/tables/data-table";
import { DateRangeFilter, type DateRange } from "@/components/shared/date-range-filter";
import { useAuditTrail, type AuditTrailParams } from "@/hooks/use-audit-trail";
import { formatDateTime } from "@/lib/format";
import type { AuditEntry } from "@/types";

// ============================================================================
// Action Badge Component
// ============================================================================

function TypeBadge({ type }: { type: string }) {
  // Map backend activity types to colors
  if (type.includes("new_order") || type.includes("created")) {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100">
        {type.replace(/_/g, " ")}
      </Badge>
    );
  }
  if (type.includes("updated") || type.includes("customer_updated")) {
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100">
        {type.replace(/_/g, " ")}
      </Badge>
    );
  }
  if (type.includes("deleted") || type.includes("voided")) {
    return (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100">
        {type.replace(/_/g, " ")}
      </Badge>
    );
  }
  if (type.includes("paid") || type.includes("invoice_paid")) {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100">
        {type.replace(/_/g, " ")}
      </Badge>
    );
  }
  if (type.includes("accrual")) {
    return (
      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-100">
        {type.replace(/_/g, " ")}
      </Badge>
    );
  }
  return <Badge variant="outline">{type.replace(/_/g, " ")}</Badge>;
}

// ============================================================================
// Expandable Row Detail
// ============================================================================

function RowDetail({ entry }: { entry: AuditEntry }) {
  if (!entry.details || Object.keys(entry.details).length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No additional details available.
      </p>
    );
  }

  return (
    <div className="rounded-md border bg-muted/50 p-4">
      <h4 className="text-sm font-medium mb-2">Full Details</h4>
      <pre className="text-xs font-mono bg-background rounded-md p-3 overflow-auto max-h-[300px] whitespace-pre-wrap break-all">
        {JSON.stringify(entry.details, null, 2)}
      </pre>
    </div>
  );
}

// ============================================================================
// Expandable Row Wrapper
// ============================================================================

function ExpandableRow({ row }: { row: Row<AuditEntry> }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle details</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <RowDetail entry={row.original} />
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================================================
// CSV Export
// ============================================================================

function exportAuditTrailCSV(entries: AuditEntry[]) {
  const headers = [
    "Timestamp",
    "User",
    "Type",
    "Message",
    "Resource Type",
    "Resource ID",
    "Details",
  ];

  const rows = entries.map((entry) => [
    entry.timestamp,
    entry.user_name ?? "",
    entry.type,
    entry.message,
    entry.resource_type ?? "",
    entry.resource_id ?? "",
    entry.details ? JSON.stringify(entry.details) : "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const str = String(cell);
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Resource Type Options
// ============================================================================

const RESOURCE_TYPES = [
  { value: "customer", label: "Customer" },
  { value: "order", label: "Order" },
  { value: "invoice", label: "Invoice" },
  { value: "billing_period", label: "Billing Period" },
  { value: "billing_rule", label: "Billing Rule" },
  { value: "service_type", label: "Service Type" },
  { value: "service_rate", label: "Service Rate" },
  { value: "product", label: "Product" },
  { value: "shipping_charge", label: "Shipping Charge" },
  { value: "user", label: "User" },
  { value: "config", label: "Configuration" },
];

const ACTIVITY_TYPES: { value: string; label: string }[] = [
  { value: "new_order", label: "New Order" },
  { value: "invoice_created", label: "Invoice Created" },
  { value: "invoice_sent", label: "Invoice Sent" },
  { value: "invoice_paid", label: "Invoice Paid" },
  { value: "accrual_complete", label: "Accrual Complete" },
  { value: "customer_updated", label: "Customer Updated" },
];

// ============================================================================
// Page Component
// ============================================================================

export default function AuditTrailPage() {
  // Filter state
  const [page, setPage] = useState(1);
  const [userFilter, setUserFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Build query params
  const queryParams: AuditTrailParams = useMemo(
    () => ({
      page,
      per_page: 20,
      user_name: userFilter !== "all" ? userFilter : undefined,
      type: typeFilter !== "all" ? typeFilter : undefined,
      resource_type: resourceTypeFilter !== "all" ? resourceTypeFilter : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      sort_by: "timestamp",
      sort_order: "desc" as const,
    }),
    [page, userFilter, typeFilter, resourceTypeFilter, dateFrom, dateTo]
  );

  // Data fetching
  const { data: auditData, isLoading, isError } = useAuditTrail(queryParams);
  const entries = auditData?.data ?? [];
  const meta = auditData?.meta;

  // Extract unique users from current data for the user filter
  const uniqueUsers = useMemo(() => {
    const users = new Set<string>();
    entries.forEach((entry) => {
      if (entry.user_name) users.add(entry.user_name);
    });
    return Array.from(users).sort();
  }, [entries]);

  // Handlers
  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateFrom(range.dateFrom);
    setDateTo(range.dateTo);
    setPage(1);
  }, []);

  const handleClearFilters = () => {
    setUserFilter("all");
    setTypeFilter("all");
    setResourceTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const handleExport = () => {
    if (entries.length > 0) {
      exportAuditTrailCSV(entries);
    }
  };

  // Table columns
  const columns: ColumnDef<AuditEntry>[] = useMemo(
    () => [
      {
        id: "expand",
        header: "",
        cell: ({ row }) => <ExpandableRow row={row} />,
        size: 40,
      },
      {
        accessorKey: "timestamp",
        header: "Timestamp",
        cell: ({ row }) =>
          row.original.timestamp ? (
            <span className="text-sm whitespace-nowrap">
              {formatDateTime(row.original.timestamp)}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: "user_name",
        header: "User",
        cell: ({ row }) => (
          <span className="text-sm truncate max-w-[180px] block">
            {row.original.user_name || "-"}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <TypeBadge type={row.original.type} />,
      },
      {
        accessorKey: "resource_type",
        header: "Resource Type",
        cell: ({ row }) => (
          <span className="text-sm capitalize">
            {row.original.resource_type?.replace(/_/g, " ") || "-"}
          </span>
        ),
      },
      {
        accessorKey: "resource_id",
        header: "Resource ID",
        cell: ({ row }) => (
          <span className="text-sm font-mono">
            {row.original.resource_id || "-"}
          </span>
        ),
      },
      {
        id: "details_summary",
        header: "Details",
        cell: ({ row }) => {
          const details = row.original.details;
          if (!details) return <span className="text-muted-foreground">-</span>;
          const keys = Object.keys(details);
          if (keys.length === 0)
            return <span className="text-muted-foreground">-</span>;
          const summary = keys.slice(0, 3).join(", ");
          return (
            <span
              className="text-sm text-muted-foreground truncate max-w-[200px] block"
              title={JSON.stringify(details)}
            >
              {summary}
              {keys.length > 3 ? ` +${keys.length - 3} more` : ""}
            </span>
          );
        },
      },
      {
        accessorKey: "message",
        header: "Message",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground truncate max-w-[250px] block">
            {row.original.message || "-"}
          </span>
        ),
      },
    ],
    []
  );

  const hasActiveFilters =
    userFilter !== "all" ||
    typeFilter !== "all" ||
    resourceTypeFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Audit Trail
          </h1>
          <p className="text-muted-foreground">
            Track all changes made across the system for compliance and
            accountability
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={entries.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Narrow down audit entries by user, action, resource type, or date
            range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              {/* User filter */}
              <Select
                value={userFilter}
                onValueChange={(value) => {
                  setUserFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsers.map((user) => (
                    <SelectItem key={user} value={user}>
                      {user}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Type filter */}
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Resource type filter */}
              <Select
                value={resourceTypeFilter}
                onValueChange={(value) => {
                  setResourceTypeFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Resource Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resource Types</SelectItem>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear filters */}
              {hasActiveFilters && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Date range filter */}
            <DateRangeFilter
              inline
              value={{ dateFrom, dateTo }}
              onChange={handleDateRangeChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Audit Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Entries</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading..."
              : meta
              ? `${meta.total} entr${meta.total !== 1 ? "ies" : "y"} found`
              : `${entries.length} entries`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-medium mb-2">
                Error Loading Audit Trail
              </h3>
              <p className="text-muted-foreground">
                Failed to load audit entries. Please try again.
              </p>
            </div>
          ) : !isLoading && entries.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No audit entries</h3>
              <p className="text-muted-foreground">
                No audit trail entries match your current filters
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={entries}
              isLoading={isLoading}
              manualPagination
              pageCount={meta?.total_pages ?? 1}
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
