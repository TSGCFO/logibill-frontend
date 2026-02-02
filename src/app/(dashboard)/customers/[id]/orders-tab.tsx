"use client";

import { useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { useCustomerOrders } from "@/hooks/use-customers";
import { formatDate } from "@/lib/format";
import type { Order } from "@/types";

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "wms_order_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order ID" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/orders/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.wms_order_id}
      </Link>
    ),
  },
  {
    accessorKey: "order_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.order_type}</Badge>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          variant={
            status === "shipped" ? "default" : status === "pending" ? "secondary" : "outline"
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "items_count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Items" />
    ),
  },
  {
    accessorKey: "packages_count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Packages" />
    ),
  },
  {
    accessorKey: "total_picks",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Picks" />
    ),
  },
  {
    accessorKey: "ship_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ship Date" />
    ),
    cell: ({ row }) =>
      row.original.ship_date ? formatDate(row.original.ship_date) : "-",
  },
];

export function CustomerOrdersTab({ customerId }: { customerId: string }) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isLoading } = useCustomerOrders(customerId, {
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
  });

  return (
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      isLoading={isLoading}
      pageCount={data?.meta?.total_pages ?? 0}
      pageIndex={pagination.pageIndex}
      pageSize={pagination.pageSize}
      onPaginationChange={setPagination}
      manualPagination
    />
  );
}
