"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { formatCurrency, formatDate } from "@/lib/format";
import type { MaterialsPricingGlobal } from "@/types";

interface MaterialsGlobalTableProps {
  materials: MaterialsPricingGlobal[];
  onEdit?: (material: MaterialsPricingGlobal) => void;
  onDelete?: (material: MaterialsPricingGlobal) => void;
  isLoading?: boolean;
}

export function MaterialsGlobalTable({
  materials,
  onEdit,
  onDelete,
  isLoading = false,
}: MaterialsGlobalTableProps) {
  const columns: ColumnDef<MaterialsPricingGlobal>[] = [
    {
      accessorKey: "material_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Material Type" />
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
      accessorKey: "cost_per_unit",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(parseFloat(row.original.cost_per_unit) || 0)}
        </span>
      ),
    },
    {
      accessorKey: "effective_from",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Effective Date" />
      ),
      cell: ({ row }) => formatDate(row.original.effective_from),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const material = row.original;

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
              <DropdownMenuItem onClick={() => onEdit?.(material)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(material)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={materials}
      searchKey="material_type"
      searchPlaceholder="Search materials..."
      isLoading={isLoading}
    />
  );
}
