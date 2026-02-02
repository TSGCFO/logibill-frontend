"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, Edit, Trash2, Copy, ArrowLeft } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { useServiceRates, useServiceRateTemplates, type ServiceRateWithType, type ServiceRateTemplate } from "@/hooks/use-services";

// Display interface for templates
interface DisplayTemplate {
  id: number;
  name: string;
  description: string | null;
  rates_count: number;
  created_at: string;
}

// Display interface for rates
interface DisplayRate {
  id: number;
  service_name: string;
  rate: number;
  unit: string;
  effective_date?: string;
}

const templateColumns: ColumnDef<DisplayTemplate>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Template Name" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.description || "-"}</span>
    ),
  },
  {
    accessorKey: "rates_count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rates" />
    ),
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => formatDate(row.original.created_at),
  },
  {
    id: "actions",
    cell: () => (
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
          <DropdownMenuItem>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

const rateColumns: ColumnDef<DisplayRate>[] = [
  {
    accessorKey: "service_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Service" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.service_name}</span>
    ),
  },
  {
    accessorKey: "rate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rate" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{formatCurrency(row.original.rate)}</span>
    ),
  },
  {
    accessorKey: "unit",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Unit" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.unit}</Badge>
    ),
  },
  {
    accessorKey: "effective_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Effective" />
    ),
    cell: ({ row }) => row.original.effective_date ? formatDate(row.original.effective_date) : "-",
  },
  {
    id: "actions",
    cell: () => (
      <Button variant="ghost" size="sm">
        <Edit className="h-4 w-4" />
      </Button>
    ),
  },
];

export default function ServiceRatesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch templates and rates from API
  const { data: templates, isLoading: templatesLoading } = useServiceRateTemplates();
  const { data: rates, isLoading: ratesLoading } = useServiceRates();

  // Transform templates for display
  const displayTemplates: DisplayTemplate[] = (templates || []).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    rates_count: t.rates?.length || 0,
    created_at: t.created_at,
  }));

  // Transform rates for display
  const displayRates: DisplayRate[] = (rates || []).map((r) => ({
    id: r.id,
    service_name: r.service_type?.name || `Service ${r.service_type_id}`,
    rate: r.rate,
    unit: r.unit,
    effective_date: r.effective_date,
  }));

  const handleCreateTemplate = () => {
    toast.success("Template created successfully");
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/services">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rate Templates</h1>
            <p className="text-muted-foreground">
              Manage service rate templates for customers
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Rate Template</DialogTitle>
              <DialogDescription>
                Create a new rate template to apply to customers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input id="name" placeholder="e.g., Standard Rates" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of this template"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base">Base Template</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Start from scratch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Start from scratch</SelectItem>
                    {displayTemplates.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        Copy from {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate}>Create Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Templates</CardTitle>
          <CardDescription>
            Pre-configured rate sets that can be applied to customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templatesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : displayTemplates.length > 0 ? (
            <DataTable
              columns={templateColumns}
              data={displayTemplates}
              searchKey="name"
              searchPlaceholder="Search templates..."
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No rate templates found</p>
              <p className="text-sm">Create a template to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Service Rates</CardTitle>
          <CardDescription>
            All configured service rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ratesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : displayRates.length > 0 ? (
            <DataTable
              columns={rateColumns}
              data={displayRates}
              searchKey="service_name"
              searchPlaceholder="Search services..."
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No service rates configured</p>
              <p className="text-sm">Add rates to templates or create individual rates</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
