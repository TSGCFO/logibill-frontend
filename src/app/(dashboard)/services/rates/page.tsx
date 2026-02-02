"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, Edit, Trash2, Copy, ArrowLeft } from "lucide-react";
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

interface RateTemplate {
  id: string;
  name: string;
  description: string;
  service_count: number;
  customer_count: number;
  created_at: string;
  is_default: boolean;
}

interface ServiceRate {
  id: string;
  service_code: string;
  service_name: string;
  rate: number;
  unit: string;
  effective_date: string;
}

const mockTemplates: RateTemplate[] = [
  {
    id: "1",
    name: "Standard Rates",
    description: "Default rates for new customers",
    service_count: 12,
    customer_count: 5,
    created_at: "2023-06-01T00:00:00Z",
    is_default: true,
  },
  {
    id: "2",
    name: "High Volume",
    description: "Discounted rates for high volume customers",
    service_count: 12,
    customer_count: 2,
    created_at: "2023-09-15T00:00:00Z",
    is_default: false,
  },
  {
    id: "3",
    name: "Premium Service",
    description: "Premium rates with additional services",
    service_count: 15,
    customer_count: 1,
    created_at: "2024-01-01T00:00:00Z",
    is_default: false,
  },
];

const mockRates: ServiceRate[] = [
  {
    id: "1",
    service_code: "PICK",
    service_name: "Item Picking",
    rate: 0.35,
    unit: "per item",
    effective_date: "2024-01-01",
  },
  {
    id: "2",
    service_code: "PACK",
    service_name: "Package Handling",
    rate: 1.50,
    unit: "per package",
    effective_date: "2024-01-01",
  },
  {
    id: "3",
    service_code: "SHIP",
    service_name: "Shipping Handling",
    rate: 0.50,
    unit: "per shipment",
    effective_date: "2024-01-01",
  },
  {
    id: "4",
    service_code: "RECV",
    service_name: "Receiving",
    rate: 15.00,
    unit: "per pallet",
    effective_date: "2024-01-01",
  },
];

const templateColumns: ColumnDef<RateTemplate>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Template Name" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.original.name}</span>
        {row.original.is_default && <Badge>Default</Badge>}
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.description}</span>
    ),
  },
  {
    accessorKey: "service_count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Services" />
    ),
  },
  {
    accessorKey: "customer_count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customers" />
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
    cell: ({ row }) => (
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

const rateColumns: ColumnDef<ServiceRate>[] = [
  {
    accessorKey: "service_code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code" />
    ),
    cell: ({ row }) => (
      <span className="font-mono">{row.original.service_code}</span>
    ),
  },
  {
    accessorKey: "service_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Service" />
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
    cell: ({ row }) => formatDate(row.original.effective_date),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button variant="ghost" size="sm">
        <Edit className="h-4 w-4" />
      </Button>
    ),
  },
];

export default function ServiceRatesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
                    <SelectItem value="standard">Copy from Standard</SelectItem>
                    <SelectItem value="high-volume">Copy from High Volume</SelectItem>
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
          <DataTable
            columns={templateColumns}
            data={mockTemplates}
            searchKey="name"
            searchPlaceholder="Search templates..."
          />
        </CardContent>
      </Card>

      {/* Default Rates Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Default Template Rates</CardTitle>
          <CardDescription>
            Service rates in the default template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={rateColumns}
            data={mockRates}
            searchKey="service_name"
            searchPlaceholder="Search services..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
