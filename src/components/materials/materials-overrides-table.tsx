"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { formatCurrency, formatDate } from "@/lib/format";

export interface MaterialOverride {
  id: number;
  customer_id: number;
  customer_name: string;
  material_type: string;
  box_size: string | null;
  override_price: number;
  effective_date: string;
  created_at: string;
}

interface MaterialsOverridesTableProps {
  overrides: MaterialOverride[];
  customerId?: number;
  onDelete?: (override: MaterialOverride) => void;
  isLoading?: boolean;
}

export function MaterialsOverridesTable({
  overrides,
  customerId,
  onDelete,
  isLoading = false,
}: MaterialsOverridesTableProps) {
  const columns: ColumnDef<MaterialOverride>[] = [
    ...(customerId === undefined
      ? [
          {
            accessorKey: "customer_name",
            header: ({ column }: { column: any }) => (
              <DataTableColumnHeader column={column} title="Customer" />
            ),
            cell: ({ row }: { row: any }) => (
              <span className="font-medium">{row.original.customer_name}</span>
            ),
          } as ColumnDef<MaterialOverride>,
        ]
      : []),
    {
      accessorKey: "material_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Material" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.material_type}</Badge>
      ),
    },
    {
      accessorKey: "box_size",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Box Size" />
      ),
      cell: ({ row }) => row.original.box_size || "-",
    },
    {
      accessorKey: "override_price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Override Price" />
      ),
      cell: ({ row }) => (
        <span className="font-medium text-primary">
          {formatCurrency(row.original.override_price)}
        </span>
      ),
    },
    {
      accessorKey: "effective_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Effective Date" />
      ),
      cell: ({ row }) => formatDate(row.original.effective_date),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const override = row.original;

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
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(override)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Override
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Filter by customerId if provided
  const filteredOverrides = customerId
    ? overrides.filter((o) => o.customer_id === customerId)
    : overrides;

  return (
    <DataTable
      columns={columns}
      data={filteredOverrides}
      searchKey={customerId ? "material_type" : "customer_name"}
      searchPlaceholder={
        customerId ? "Search materials..." : "Search customers or materials..."
      }
      isLoading={isLoading}
    />
  );
}
