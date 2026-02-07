"use client";

import { useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { useCustomerProducts } from "@/hooks/use-customers";
import type { Product } from "@/types";

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "sku",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="SKU" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/products/${row.original.id}`}
        className="font-mono font-medium hover:underline"
      >
        {row.original.sku}
      </Link>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => row.original.description || "-",
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) =>
      row.original.category ? (
        <Badge variant="outline">{row.original.category}</Badge>
      ) : (
        "-"
      ),
  },
  {
    accessorKey: "weight_lb",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Weight" />
    ),
    cell: ({ row }) =>
      row.original.weight_lb ? `${row.original.weight_lb} lbs` : "-",
  },
  {
    id: "dimensions",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Dimensions" />
    ),
    cell: ({ row }) => {
      const p = row.original;
      const dims = [p.length_in, p.width_in, p.height_in].filter(Boolean).join(" x ");
      return dims ? `${dims} in` : "-";
    },
  },
  {
    accessorKey: "wms_is_active",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <Badge variant={row.original.wms_is_active ? "default" : "secondary"}>
        {row.original.wms_is_active ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

export function CustomerProductsTab({ customerId }: { customerId: string }) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isLoading } = useCustomerProducts(customerId, pagination.pageIndex + 1);

  return (
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      searchKey="sku"
      searchPlaceholder="Search SKU..."
      isLoading={isLoading}
      pageCount={data?.meta?.total_pages ?? 0}
      pageIndex={pagination.pageIndex}
      pageSize={pagination.pageSize}
      onPaginationChange={setPagination}
      manualPagination
    />
  );
}
