"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, Edit, Trash2, Copy, ArrowLeft, Loader2 } from "lucide-react";
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
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  useServiceRateTemplates,
  useCreateServiceRateTemplate,
  useDuplicateServiceRateTemplate,
  useDeleteServiceRateTemplate,
  type ServiceRateTemplate,
} from "@/hooks/use-services";
import { toast } from "sonner";

const templateColumns: ColumnDef<ServiceRateTemplate>[] = [
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
    id: "rates_count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rates" />
    ),
    cell: ({ row }) => row.original.rates?.length ?? 0,
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

export default function ServiceRatesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");

  const { data: templates, isLoading } = useServiceRateTemplates();
  const createTemplate = useCreateServiceRateTemplate();

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error("Template name is required");
      return;
    }
    createTemplate.mutate(
      {
        name: newTemplateName.trim(),
        description: newTemplateDesc.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Template created successfully");
          setIsDialogOpen(false);
          setNewTemplateName("");
          setNewTemplateDesc("");
        },
        onError: () => {
          toast.error("Failed to create template");
        },
      }
    );
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
                <Input
                  id="name"
                  placeholder="e.g., Standard Rates"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of this template"
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTemplate}
                disabled={createTemplate.isPending}
              >
                {createTemplate.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Template
              </Button>
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
            data={templates ?? []}
            searchKey="name"
            searchPlaceholder="Search templates..."
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
