"use client";

import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Loader2,
  AlertCircle,
  GripVertical,
  X,
  Workflow,
} from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  useWorkflowTemplates,
  useCreateWorkflowTemplate,
  useUpdateWorkflowTemplate,
  useDeleteWorkflowTemplate,
  useApplyWorkflowTemplate,
  type WorkflowTemplate,
  type WorkflowTemplateType,
} from "@/hooks/use-workflows";
import { useCustomers } from "@/hooks/use-customers";

// ============================================================================
// Constants
// ============================================================================

const TEMPLATE_TYPES: { value: WorkflowTemplateType; label: string }[] = [
  { value: "billing_generation", label: "Billing Generation" },
  { value: "invoice_creation", label: "Invoice Creation" },
  { value: "invoice_sending", label: "Invoice Sending" },
  { value: "custom", label: "Custom" },
];

const STEP_TYPES = [
  { value: "billing_rule", label: "Billing Rule" },
  { value: "service_rate", label: "Service Rate" },
  { value: "config", label: "Configuration" },
] as const;

const templateTypeLabels: Record<WorkflowTemplateType, string> = {
  billing_generation: "Billing Generation",
  invoice_creation: "Invoice Creation",
  invoice_sending: "Invoice Sending",
  custom: "Custom",
};

const templateTypeBadgeVariant: Record<
  WorkflowTemplateType,
  "default" | "secondary" | "outline" | "destructive"
> = {
  billing_generation: "default",
  invoice_creation: "secondary",
  invoice_sending: "outline",
  custom: "secondary",
};

// ============================================================================
// Schemas
// ============================================================================

const stepSchema = z.object({
  title: z.string().min(1, "Step title is required"),
  description: z.string().optional(),
  type: z.enum(["billing_rule", "service_rate", "config"]),
  config: z.string().optional(), // JSON string for the form, parsed on submit
});

const templateFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  template_type: z.enum([
    "billing_generation",
    "invoice_creation",
    "invoice_sending",
    "custom",
  ]),
  steps: z.array(stepSchema),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

// ============================================================================
// Actions Cell Component
// ============================================================================

function TemplateActionsCell({
  template,
  onEdit,
  onDelete,
  onApply,
}: {
  template: WorkflowTemplate;
  onEdit: (template: WorkflowTemplate) => void;
  onDelete: (template: WorkflowTemplate) => void;
  onApply: (template: WorkflowTemplate) => void;
}) {
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
        <DropdownMenuItem onClick={() => onEdit(template)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onApply(template)}>
          <Play className="mr-2 h-4 w-4" />
          Apply to Customer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => onDelete(template)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Steps Builder Component
// ============================================================================

function StepsBuilder({
  fields,
  append,
  remove,
  form,
}: {
  fields: { id: string }[];
  append: (value: { title: string; description: string; type: "billing_rule" | "service_rate" | "config"; config: string }) => void;
  remove: (index: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FormLabel>Steps</FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              title: "",
              description: "",
              type: "config",
              config: "{}",
            })
          }
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Step
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
          No steps added yet. Click &quot;Add Step&quot; to begin building the
          workflow.
        </p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="border rounded-lg p-3 space-y-3 relative"
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-medium text-muted-foreground">
              Step {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto h-6 w-6 p-0"
              onClick={() => remove(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name={`steps.${index}.title`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel className="text-xs">Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Step title" {...f} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`steps.${index}.type`}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel className="text-xs">Type</FormLabel>
                  <Select onValueChange={f.onChange} value={f.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STEP_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name={`steps.${index}.description`}
            render={({ field: f }) => (
              <FormItem>
                <FormLabel className="text-xs">
                  Description (Optional)
                </FormLabel>
                <FormControl>
                  <Input placeholder="Step description" {...f} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`steps.${index}.config`}
            render={({ field: f }) => (
              <FormItem>
                <FormLabel className="text-xs">Config (JSON)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="{}"
                    className="font-mono text-xs"
                    rows={2}
                    {...f}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  JSON configuration for this step
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function WorkflowTemplatesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<WorkflowTemplate | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // Data fetching
  const {
    data: templatesData,
    isLoading,
    isError,
    error,
  } = useWorkflowTemplates();
  const templates = templatesData?.data ?? [];

  const { data: customersData } = useCustomers({ per_page: 200 });
  const customers = customersData?.data ?? [];

  // Mutations
  const createMutation = useCreateWorkflowTemplate();
  const updateMutation = useUpdateWorkflowTemplate();
  const deleteMutation = useDeleteWorkflowTemplate();
  const applyMutation = useApplyWorkflowTemplate();

  // Create form
  const createForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      template_type: "billing_generation",
      steps: [],
    },
  });

  const createStepsField = useFieldArray({
    control: createForm.control,
    name: "steps",
  });

  // Edit form
  const editForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
  });

  const editStepsField = useFieldArray({
    control: editForm.control,
    name: "steps",
  });

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleCreate = async (data: TemplateFormData) => {
    try {
      const steps = data.steps.map((step) => ({
        title: step.title,
        description: step.description || "",
        type: step.type,
        config: step.config ? JSON.parse(step.config) : {},
      }));

      await createMutation.mutateAsync({
        name: data.name,
        description: data.description || null,
        template_type: data.template_type,
        parameters: { steps },
      });

      toast.success("Template created", {
        description: "The workflow template has been created successfully",
      });
      setIsCreateDialogOpen(false);
      createForm.reset({
        name: "",
        description: "",
        template_type: "billing_generation",
        steps: [],
      });
    } catch (err) {
      toast.error("Failed to create template", {
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
      });
    }
  };

  const handleEdit = async (data: TemplateFormData) => {
    if (!selectedTemplate) return;

    try {
      const steps = data.steps.map((step) => ({
        title: step.title,
        description: step.description || "",
        type: step.type,
        config: step.config ? JSON.parse(step.config) : {},
      }));

      await updateMutation.mutateAsync({
        id: selectedTemplate.id,
        data: {
          name: data.name,
          description: data.description || null,
          template_type: data.template_type,
          parameters: { ...selectedTemplate.parameters, steps },
        },
      });

      toast.success("Template updated", {
        description: "The workflow template has been updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
    } catch (err) {
      toast.error("Failed to update template", {
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;

    try {
      await deleteMutation.mutateAsync(selectedTemplate.id);
      toast.success("Template deleted", {
        description: "The workflow template has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedTemplate(null);
    } catch (err) {
      toast.error("Failed to delete template", {
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
      });
    }
  };

  const handleApply = async () => {
    if (!selectedTemplate || !selectedCustomerId) return;

    try {
      const result = await applyMutation.mutateAsync({
        templateId: selectedTemplate.id,
        customerId: parseInt(selectedCustomerId),
      });
      toast.success("Template applied", {
        description: `Applied "${selectedTemplate.name}" to ${result.customer_name}. ${result.steps_applied} steps processed.`,
      });
      setIsApplyDialogOpen(false);
      setSelectedTemplate(null);
      setSelectedCustomerId("");
    } catch (err) {
      toast.error("Failed to apply template", {
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
      });
    }
  };

  const openEditDialog = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    const steps = (template.parameters?.steps ?? []).map((step) => ({
      title: step.title || "",
      description: step.description || "",
      type: step.type || "config",
      config: step.config ? JSON.stringify(step.config, null, 2) : "{}",
    }));
    editForm.reset({
      name: template.name,
      description: template.description || "",
      template_type: template.template_type,
      steps,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  const openApplyDialog = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setSelectedCustomerId("");
    setIsApplyDialogOpen(true);
  };

  // ============================================================================
  // Table Columns
  // ============================================================================

  const columns: ColumnDef<WorkflowTemplate>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          {row.original.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {row.original.description}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "template_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => {
        const type = row.original.template_type;
        return (
          <Badge variant={templateTypeBadgeVariant[type]}>
            {templateTypeLabels[type]}
          </Badge>
        );
      },
    },
    {
      id: "steps_count",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Steps" />
      ),
      cell: ({ row }) => {
        const steps = row.original.parameters?.steps ?? [];
        return (
          <span className="text-muted-foreground">
            {steps.length} {steps.length === 1 ? "step" : "steps"}
          </span>
        );
      },
    },
    {
      accessorKey: "use_count",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Used" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.use_count} {row.original.use_count === 1 ? "time" : "times"}
        </span>
      ),
    },
    {
      accessorKey: "updated_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Modified" />
      ),
      cell: ({ row }) => formatDateTime(row.original.updated_at),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <TemplateActionsCell
          template={row.original}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
          onApply={openApplyDialog}
        />
      ),
    },
  ];

  // ============================================================================
  // Stats
  // ============================================================================

  const stats = useMemo(() => {
    return {
      total: templates.length,
      billing: templates.filter((t) => t.template_type === "billing_generation")
        .length,
      invoice: templates.filter(
        (t) =>
          t.template_type === "invoice_creation" ||
          t.template_type === "invoice_sending"
      ).length,
      custom: templates.filter((t) => t.template_type === "custom").length,
    };
  }, [templates]);

  // ============================================================================
  // Render
  // ============================================================================

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Workflow Templates
          </h1>
          <p className="text-muted-foreground">
            Manage reusable workflow templates for billing operations
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading templates</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Failed to load workflow templates. Please try again."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Workflow Templates
          </h1>
          <p className="text-muted-foreground">
            Manage reusable workflow templates for billing operations
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Workflow Template</DialogTitle>
              <DialogDescription>
                Create a new reusable workflow template with configurable steps.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(handleCreate)}
                className="space-y-4"
              >
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Monthly Billing Run"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what this template does..."
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="template_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TEMPLATE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <StepsBuilder
                  fields={createStepsField.fields}
                  append={createStepsField.append}
                  remove={createStepsField.remove}
                  form={createForm}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Template
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Billing Generation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{stats.billing}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Invoice Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{stats.invoice}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Custom</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{stats.custom}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            All Templates
          </CardTitle>
          <CardDescription>
            Reusable workflow templates for recurring billing operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={templates}
              searchKey="name"
              searchPlaceholder="Search templates..."
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Workflow Template</DialogTitle>
            <DialogDescription>
              Update the workflow template details and steps.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEdit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Monthly Billing Run"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this template does..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="template_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TEMPLATE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <StepsBuilder
                fields={editStepsField.fields}
                append={editStepsField.append}
                remove={editStepsField.remove}
                form={editForm}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the workflow template{" "}
              <span className="font-medium">
                &quot;{selectedTemplate?.name}&quot;
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Apply to Customer Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Template to Customer</DialogTitle>
            <DialogDescription>
              Apply &quot;{selectedTemplate?.name}&quot; to a customer. This will
              configure billing rules and rates based on the template steps.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Customer</label>
              <Select
                value={selectedCustomerId}
                onValueChange={setSelectedCustomerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem
                      key={customer.id}
                      value={customer.id.toString()}
                    >
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTemplate?.parameters?.steps &&
              selectedTemplate.parameters.steps.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Steps to Apply ({selectedTemplate.parameters.steps.length})
                  </label>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {selectedTemplate.parameters.steps.map((step, index) => (
                      <div
                        key={index}
                        className="text-sm flex items-center gap-2 py-1"
                      >
                        <Badge variant="outline" className="text-xs">
                          {index + 1}
                        </Badge>
                        <span>{step.title}</span>
                        <Badge variant="secondary" className="text-xs ml-auto">
                          {step.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApplyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={!selectedCustomerId || applyMutation.isPending}
            >
              {applyMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
