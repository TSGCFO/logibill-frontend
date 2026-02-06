"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Settings,
  Pencil,
  Trash2,
  Loader2,
  MoreHorizontal,
  Package,
  Truck,
  Warehouse,
  Hand,
  Boxes,
  Wrench,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { ServiceType } from "@/types";
import {
  useServiceTypes,
  useCreateServiceType,
  useUpdateServiceType,
  useDeleteServiceType,
} from "@/hooks/use-services";

// =============================================================================
// Constants
// =============================================================================

const CATEGORIES = [
  { value: "pick_pack", label: "Pick & Pack", icon: Package },
  { value: "shipping", label: "Shipping", icon: Truck },
  { value: "storage", label: "Storage", icon: Warehouse },
  { value: "receiving", label: "Receiving", icon: Hand },
  { value: "special_projects", label: "Special Projects", icon: Wrench },
  { value: "materials", label: "Materials", icon: Boxes },
] as const;

const UNITS = [
  { value: "per_unit", label: "Per Unit" },
  { value: "per_sku", label: "Per SKU" },
  { value: "per_case", label: "Per Case" },
  { value: "per_pallet", label: "Per Pallet" },
  { value: "per_box", label: "Per Box" },
  { value: "per_cubic_foot", label: "Per Cubic Foot" },
  { value: "per_pound", label: "Per Pound" },
  { value: "flat", label: "Flat Rate" },
] as const;

const AUTO_GENERATE_SOURCES = [
  { value: "order_items", label: "Order Items" },
  { value: "packages", label: "Packages" },
  { value: "inventory", label: "Inventory" },
  { value: "orders", label: "Orders" },
] as const;

// =============================================================================
// Schema
// =============================================================================

const serviceTypeFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  category: z.enum([
    "pick_pack",
    "shipping",
    "storage",
    "receiving",
    "special_projects",
    "materials",
  ]),
  subcategory: z.string().max(50).optional().or(z.literal("")),
  unit: z.enum([
    "per_unit",
    "per_sku",
    "per_case",
    "per_pallet",
    "per_box",
    "per_cubic_foot",
    "per_pound",
    "flat",
  ]),
  base_rate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || !isNaN(Number(val)),
      "Must be a valid number"
    )
    .refine(
      (val) => !val || Number(val) >= 0,
      "Must be 0 or greater"
    ),
  minimum_charge: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || !isNaN(Number(val)),
      "Must be a valid number"
    )
    .refine(
      (val) => !val || Number(val) >= 0,
      "Must be 0 or greater"
    ),
  auto_generate: z.boolean(),
  auto_generate_source: z.string().optional().or(z.literal("")),
  is_active: z.boolean(),
  display_order: z.number().int().min(0),
});

type ServiceTypeFormValues = z.infer<typeof serviceTypeFormSchema>;

// =============================================================================
// Helpers
// =============================================================================

function getUnitLabel(unit: string): string {
  return UNITS.find((u) => u.value === unit)?.label ?? unit;
}

function formatRate(rate: string | null): string {
  if (!rate) return "-";
  const num = parseFloat(rate);
  return isNaN(num) ? "-" : `$${num.toFixed(4)}`;
}

function formatMinCharge(charge: string | null): string {
  if (!charge) return "-";
  const num = parseFloat(charge);
  return isNaN(num) ? "-" : `$${num.toFixed(2)}`;
}

// =============================================================================
// Component
// =============================================================================

export default function ServicesConfigPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<ServiceType | null>(null);
  const [deletingType, setDeletingType] = useState<ServiceType | null>(null);

  // ---- Data ----
  const { data: serviceTypes, isLoading } = useServiceTypes();
  const createMutation = useCreateServiceType();
  const updateMutation = useUpdateServiceType();
  const deleteMutation = useDeleteServiceType();

  // ---- Form ----
  const form = useForm<ServiceTypeFormValues>({
    resolver: zodResolver(serviceTypeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "pick_pack",
      subcategory: "",
      unit: "per_unit",
      base_rate: "",
      minimum_charge: "",
      auto_generate: false,
      auto_generate_source: "",
      is_active: true,
      display_order: 0,
    },
  });

  // ---- Grouped data ----
  const groupedByCategory = useMemo(() => {
    if (!serviceTypes) return {};
    return serviceTypes.reduce(
      (acc, st) => {
        const cat = st.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(st);
        return acc;
      },
      {} as Record<string, ServiceType[]>
    );
  }, [serviceTypes]);

  // Categories that have at least one service type, plus all categories for tabs
  const activeCategoryTabs = CATEGORIES.filter(
    (cat) =>
      groupedByCategory[cat.value] && groupedByCategory[cat.value].length > 0
  );

  // Show all categories in tabs so user can add to empty ones
  const allCategoryTabs = CATEGORIES;

  // ---- Handlers ----
  const handleOpenCreate = (category?: string) => {
    setEditingType(null);
    form.reset({
      name: "",
      description: "",
      category: (category as ServiceTypeFormValues["category"]) ?? "pick_pack",
      subcategory: "",
      unit: "per_unit",
      base_rate: "",
      minimum_charge: "",
      auto_generate: false,
      auto_generate_source: "",
      is_active: true,
      display_order: 0,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (serviceType: ServiceType) => {
    setEditingType(serviceType);
    form.reset({
      name: serviceType.name,
      description: serviceType.description ?? "",
      category: serviceType.category as ServiceTypeFormValues["category"],
      subcategory: serviceType.subcategory ?? "",
      unit: serviceType.unit as ServiceTypeFormValues["unit"],
      base_rate: serviceType.base_rate ?? "",
      minimum_charge: serviceType.minimum_charge ?? "",
      auto_generate: serviceType.auto_generate,
      auto_generate_source: serviceType.auto_generate_source ?? "",
      is_active: serviceType.is_active,
      display_order: serviceType.display_order,
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingType(null);
    form.reset();
  };

  const onSubmit = (values: ServiceTypeFormValues) => {
    const payload = {
      name: values.name,
      description: values.description || null,
      category: values.category,
      subcategory: values.subcategory || null,
      unit: values.unit,
      base_rate: values.base_rate || null,
      minimum_charge: values.minimum_charge || null,
      auto_generate: values.auto_generate,
      auto_generate_source: values.auto_generate_source || null,
      is_active: values.is_active,
      display_order: values.display_order,
    };

    if (editingType) {
      updateMutation.mutate(
        { id: editingType.id, data: payload },
        {
          onSuccess: () => {
            toast.success("Service type updated successfully");
            handleCloseForm();
          },
          onError: (error) => {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to update service type"
            );
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Service type created successfully");
          handleCloseForm();
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to create service type"
          );
        },
      });
    }
  };

  const handleDelete = () => {
    if (!deletingType) return;
    deleteMutation.mutate(deletingType.id, {
      onSuccess: () => {
        toast.success(`Service type "${deletingType.name}" deleted`);
        setDeletingType(null);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to delete service type"
        );
        setDeletingType(null);
      },
    });
  };

  const handleToggleActive = (serviceType: ServiceType) => {
    updateMutation.mutate(
      {
        id: serviceType.id,
        data: { is_active: !serviceType.is_active },
      },
      {
        onSuccess: () => {
          toast.success(
            `${serviceType.name} ${serviceType.is_active ? "deactivated" : "activated"}`
          );
        },
        onError: () => {
          toast.error("Failed to update status");
        },
      }
    );
  };

  const handleToggleAutoGenerate = (serviceType: ServiceType) => {
    updateMutation.mutate(
      {
        id: serviceType.id,
        data: { auto_generate: !serviceType.auto_generate },
      },
      {
        onSuccess: () => {
          toast.success(
            `Auto-generate ${serviceType.auto_generate ? "disabled" : "enabled"} for ${serviceType.name}`
          );
        },
        onError: () => {
          toast.error("Failed to update auto-generate");
        },
      }
    );
  };

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  // ---- Render ----
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Service Types
          </h1>
          <p className="text-muted-foreground">
            Manage billable service categories, units, and default rates
          </p>
        </div>
        <Button onClick={() => handleOpenCreate()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service Type
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !serviceTypes || serviceTypes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                No service types configured
              </h3>
              <p className="text-muted-foreground mb-4">
                Add service types to define billable categories and default
                rates for your customers
              </p>
              <Button onClick={() => handleOpenCreate()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Service Type
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={allCategoryTabs[0]?.value ?? "pick_pack"}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            {allCategoryTabs.map((cat) => {
              const Icon = cat.icon;
              const count = groupedByCategory[cat.value]?.length ?? 0;
              return (
                <TabsTrigger
                  key={cat.value}
                  value={cat.value}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {cat.label}
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {allCategoryTabs.map((cat) => {
            const types = groupedByCategory[cat.value] ?? [];
            const Icon = cat.icon;
            return (
              <TabsContent key={cat.value} value={cat.value}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {cat.label}
                      </CardTitle>
                      <CardDescription>
                        {types.length} service type
                        {types.length !== 1 ? "s" : ""} in this category
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleOpenCreate(cat.value)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {types.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No service types in this category yet.</p>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => handleOpenCreate(cat.value)}
                        >
                          Add one now
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead className="hidden md:table-cell">
                                Description
                              </TableHead>
                              <TableHead>Unit</TableHead>
                              <TableHead className="text-right">
                                Base Rate
                              </TableHead>
                              <TableHead className="text-right hidden sm:table-cell">
                                Min Charge
                              </TableHead>
                              <TableHead className="text-center">
                                Auto-Generate
                              </TableHead>
                              <TableHead className="text-center">
                                Active
                              </TableHead>
                              <TableHead className="w-[50px]" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {types.map((st) => (
                              <TableRow key={st.id}>
                                <TableCell className="font-medium">
                                  {st.name}
                                  {st.subcategory && (
                                    <span className="block text-xs text-muted-foreground">
                                      {st.subcategory}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="hidden md:table-cell max-w-[200px] truncate text-muted-foreground">
                                  {st.description || "-"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {getUnitLabel(st.unit)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatRate(st.base_rate)}
                                </TableCell>
                                <TableCell className="text-right font-mono hidden sm:table-cell">
                                  {formatMinCharge(st.minimum_charge)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Switch
                                    checked={st.auto_generate}
                                    onCheckedChange={() =>
                                      handleToggleAutoGenerate(st)
                                    }
                                    disabled={isMutating}
                                    aria-label={`Toggle auto-generate for ${st.name}`}
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Switch
                                    checked={st.is_active}
                                    onCheckedChange={() =>
                                      handleToggleActive(st)
                                    }
                                    disabled={isMutating}
                                    aria-label={`Toggle active status for ${st.name}`}
                                  />
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">
                                          Actions for {st.name}
                                        </span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => handleOpenEdit(st)}
                                      >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => setDeletingType(st)}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingType ? "Edit Service Type" : "Add Service Type"}
            </DialogTitle>
            <DialogDescription>
              {editingType
                ? "Update the details for this service type."
                : "Define a new billable service type with its default rate."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Pick per Unit" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this service type covers..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category & Unit row */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Unit *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {UNITS.map((u) => (
                            <SelectItem key={u.value} value={u.value}>
                              {u.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Subcategory */}
              <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., pick_per_unit"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional subcategory identifier
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Base Rate & Min Charge row */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="base_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Rate ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.0000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minimum_charge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Charge ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Display Order */}
              <FormField
                control={form.control}
                name="display_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Lower numbers appear first in lists
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Auto-Generate */}
              <FormField
                control={form.control}
                name="auto_generate"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Auto-Generate</FormLabel>
                      <FormDescription>
                        Automatically calculate charges from WMS data
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Auto-Generate Source (conditional) */}
              {form.watch("auto_generate") && (
                <FormField
                  control={form.control}
                  name="auto_generate_source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auto-Generate Source</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select data source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AUTO_GENERATE_SOURCES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        WMS data source for auto-calculation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Active */}
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Only active service types are available for billing
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseForm}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingType ? "Save Changes" : "Create Service Type"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingType}
        onOpenChange={(open) => {
          if (!open) setDeletingType(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deletingType?.name}</span>?
              This action cannot be undone. If there are service rates
              referencing this type, the deletion will fail. Consider
              deactivating it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
