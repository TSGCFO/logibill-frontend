"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit } from "lucide-react";
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
import { formatCurrency } from "@/lib/format";
import type { PackagingRateCatalog as PackagingRate } from "@/types";

interface PackagingRateCatalogProps {
  rates: PackagingRate[];
  onEdit?: (rate: PackagingRate) => void;
  isLoading?: boolean;
}

export function PackagingRateCatalog({
  rates,
  onEdit,
  isLoading = false,
}: PackagingRateCatalogProps) {
  const columns: ColumnDef<PackagingRate>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "box_size",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Box Size" />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.box_size}</Badge>
      ),
    },
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
      accessorKey: "base_rate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Base Rate" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.base_rate)}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const rate = row.original;

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
              <DropdownMenuItem onClick={() => onEdit?.(rate)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
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
      data={rates}
      searchKey="name"
      searchPlaceholder="Search packaging rates..."
      isLoading={isLoading}
    />
  );
}
