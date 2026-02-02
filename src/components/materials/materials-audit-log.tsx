"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Clock, User, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { formatDateTime, formatCurrency } from "@/lib/format";

export interface MaterialsAuditEntry {
  id: string;
  timestamp: string;
  user_email: string;
  user_name?: string;
  action: "create" | "update" | "delete";
  resource_type: string;
  resource_id: string;
  material_type?: string;
  customer_name?: string;
  old_value?: {
    unit_cost?: number;
    box_size?: string;
    effective_date?: string;
    [key: string]: unknown;
  };
  new_value?: {
    unit_cost?: number;
    box_size?: string;
    effective_date?: string;
    [key: string]: unknown;
  };
}

interface MaterialsAuditLogProps {
  entries: MaterialsAuditEntry[];
  isLoading?: boolean;
}

function getActionBadgeVariant(
  action: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (action) {
    case "create":
      return "default";
    case "update":
      return "secondary";
    case "delete":
      return "destructive";
    default:
      return "outline";
  }
}

function formatChangeValue(value: unknown): string {
  if (typeof value === "number") {
    return formatCurrency(value);
  }
  if (value === null || value === undefined) {
    return "-";
  }
  return String(value);
}

function ChangesCell({ entry }: { entry: MaterialsAuditEntry }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!entry.old_value && !entry.new_value) {
    return <span className="text-muted-foreground">-</span>;
  }

  const allKeys = new Set([
    ...Object.keys(entry.old_value || {}),
    ...Object.keys(entry.new_value || {}),
  ]);

  const changes = Array.from(allKeys).filter((key) => {
    const oldVal = entry.old_value?.[key];
    const newVal = entry.new_value?.[key];
    return oldVal !== newVal;
  });

  if (changes.length === 0) {
    return <span className="text-muted-foreground">No changes</span>;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8">
          <FileText className="mr-2 h-4 w-4" />
          {changes.length} change{changes.length !== 1 ? "s" : ""}
          {isOpen ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : (
            <ChevronDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-1">
        {changes.map((key) => (
          <div
            key={key}
            className="text-sm rounded bg-muted px-2 py-1 font-mono"
          >
            <span className="text-muted-foreground">{key}:</span>{" "}
            {entry.action !== "create" && (
              <>
                <span className="text-destructive line-through">
                  {formatChangeValue(entry.old_value?.[key])}
                </span>
                <span className="mx-1">→</span>
              </>
            )}
            {entry.action !== "delete" && (
              <span className="text-primary">
                {formatChangeValue(entry.new_value?.[key])}
              </span>
            )}
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function MaterialsAuditLog({
  entries,
  isLoading = false,
}: MaterialsAuditLogProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const entryDate = new Date(entry.timestamp);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (entryDate < start) return false;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (entryDate > end) return false;
      }

      return true;
    });
  }, [entries, startDate, endDate]);

  const columns: ColumnDef<MaterialsAuditEntry>[] = [
    {
      accessorKey: "timestamp",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Timestamp" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{formatDateTime(row.original.timestamp)}</span>
        </div>
      ),
    },
    {
      accessorKey: "user_email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            {row.original.user_name && (
              <span className="font-medium">{row.original.user_name}</span>
            )}
            <span
              className={
                row.original.user_name
                  ? "text-muted-foreground text-sm block"
                  : ""
              }
            >
              {row.original.user_email}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "action",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Action" />
      ),
      cell: ({ row }) => (
        <Badge variant={getActionBadgeVariant(row.original.action)}>
          {row.original.action}
        </Badge>
      ),
    },
    {
      accessorKey: "resource_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Resource" />
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.resource_type}</p>
          {row.original.material_type && (
            <p className="text-sm text-muted-foreground">
              {row.original.material_type}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "changes",
      header: "Old / New Values",
      cell: ({ row }) => <ChangesCell entry={row.original} />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Date Range Filter */}
      <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg border bg-muted/50">
        <div className="space-y-2">
          <Label htmlFor="start-date">Start Date</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[180px]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-date">End Date</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[180px]"
          />
        </div>
        {(startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
          >
            Clear Filters
          </Button>
        )}
        <div className="ml-auto text-sm text-muted-foreground">
          {filteredEntries.length} of {entries.length} entries
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredEntries}
        searchKey="user_email"
        searchPlaceholder="Search by user..."
        isLoading={isLoading}
      />
    </div>
  );
}
