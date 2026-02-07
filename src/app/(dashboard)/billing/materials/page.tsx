"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, Edit, Trash2, History } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { useQuery } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/format";
import type { MaterialsPricingGlobal, MaterialsPricingCustomer, PackagingRateCatalog } from "@/types";

const globalPricingColumns: ColumnDef<MaterialsPricingGlobal>[] = [
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
      <DataTableColumnHeader column={column} title="Unit Cost" />
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
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

const packagingRateColumns: ColumnDef<PackagingRateCatalog>[] = [
  {
    accessorKey: "size_category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Size Category" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.size_category}</span>
    ),
  },
  {
    accessorKey: "box_size",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Box Size" />
    ),
  },
  {
    accessorKey: "all_in_rate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="All-In Rate" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">
        {formatCurrency(parseFloat(row.original.all_in_rate) || 0)}
      </span>
    ),
  },
  {
    accessorKey: "box_cost",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Box Cost" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatCurrency(parseFloat(row.original.box_cost) || 0)}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
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
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function MaterialsConfigPage() {
  const { data: globalPricing, isLoading: globalLoading } = useQuery({
    queryKey: ["materials-global"],
    queryFn: async () => {
      const response = await api.get<MaterialsPricingGlobal[]>(
        endpoints.materials.global
      );
      return response.data;
    },
  });

  const { data: packagingRates, isLoading: packagingLoading } = useQuery({
    queryKey: ["packaging-rates"],
    queryFn: async () => {
      const response = await api.get<PackagingRateCatalog[]>(
        endpoints.materials.packagingRates
      );
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Materials Pricing</h1>
          <p className="text-muted-foreground">
            Configure global materials pricing and packaging rates
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/billing/materials/audit">
              <History className="mr-2 h-4 w-4" />
              Audit Log
            </Link>
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Pricing
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="global" className="space-y-4">
        <TabsList>
          <TabsTrigger value="global">Global Pricing</TabsTrigger>
          <TabsTrigger value="packaging">Packaging Rates</TabsTrigger>
          <TabsTrigger value="overrides">Customer Overrides</TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <Card>
            <CardHeader>
              <CardTitle>Global Materials Pricing</CardTitle>
              <CardDescription>
                Default pricing for materials used across all customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={globalPricingColumns}
                data={globalPricing ?? []}
                searchKey="material_type"
                searchPlaceholder="Search materials..."
                isLoading={globalLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packaging">
          <Card>
            <CardHeader>
              <CardTitle>Packaging Rate Catalog</CardTitle>
              <CardDescription>
                Standard packaging rates by box size
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={packagingRateColumns}
                data={packagingRates ?? []}
                searchKey="size_category"
                searchPlaceholder="Search packaging..."
                isLoading={packagingLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overrides">
          <Card>
            <CardHeader>
              <CardTitle>Customer Overrides</CardTitle>
              <CardDescription>
                Customer-specific pricing that overrides global rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Select a customer to view and manage their pricing overrides</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/customers">Browse Customers</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
