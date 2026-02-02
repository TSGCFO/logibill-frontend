"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Package } from "lucide-react";

import { cn } from "@/lib/utils";
import { api } from "@/lib/api/client";
import { formatCurrency } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export interface PackagingOverride {
  id: number;
  customer_id: number;
  package_type: string;
  box_size: string | null;
  override_rate: number;
  effective_date: string;
  created_at: string;
}

export interface PackagingOverrideFormData {
  package_type: string;
  box_size?: string;
  override_rate: number;
}

interface PackagingOverridesProps {
  customerId: number | string;
  overrides?: PackagingOverride[];
  onAdd?: (data: PackagingOverrideFormData) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  className?: string;
}

const PACKAGE_TYPES = [
  { value: "box", label: "Box" },
  { value: "envelope", label: "Envelope" },
  { value: "tube", label: "Tube" },
  { value: "pallet", label: "Pallet" },
  { value: "custom", label: "Custom" },
];

const BOX_SIZES = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "extra_large", label: "Extra Large" },
];

function usePackagingOverrides(customerId: number | string, initialOverrides?: PackagingOverride[]) {
  return useQuery({
    queryKey: ["customers", customerId, "packaging-overrides"],
    queryFn: async () => {
      const response = await api.get<PackagingOverride[]>(
        `/api/v1/customers/${customerId}/packaging-overrides`
      );
      return response.data ?? [];
    },
    enabled: !!customerId && !initialOverrides,
    initialData: initialOverrides,
  });
}

function useAddPackagingOverride(customerId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PackagingOverrideFormData) => {
      const response = await api.post<PackagingOverride>(
        `/api/v1/customers/${customerId}/packaging-overrides`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customers", customerId, "packaging-overrides"],
      });
    },
  });
}

function useDeletePackagingOverride(customerId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (overrideId: number) => {
      await api.delete(`/api/v1/customers/${customerId}/packaging-overrides/${overrideId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customers", customerId, "packaging-overrides"],
      });
    },
  });
}

interface AddOverrideDialogProps {
  onSubmit: (data: PackagingOverrideFormData) => Promise<void>;
  isLoading: boolean;
}

function AddOverrideDialog({ onSubmit, isLoading }: AddOverrideDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [packageType, setPackageType] = React.useState("");
  const [boxSize, setBoxSize] = React.useState("");
  const [overrideRate, setOverrideRate] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageType || !overrideRate) return;

    await onSubmit({
      package_type: packageType,
      box_size: boxSize || undefined,
      override_rate: parseFloat(overrideRate),
    });

    setPackageType("");
    setBoxSize("");
    setOverrideRate("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Override
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Packaging Override</DialogTitle>
          <DialogDescription>
            Create a custom packaging rate for this customer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="package-type">Package Type</Label>
              <Select value={packageType} onValueChange={setPackageType}>
                <SelectTrigger id="package-type">
                  <SelectValue placeholder="Select package type" />
                </SelectTrigger>
                <SelectContent>
                  {PACKAGE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {packageType === "box" && (
              <div className="space-y-2">
                <Label htmlFor="box-size">Box Size</Label>
                <Select value={boxSize} onValueChange={setBoxSize}>
                  <SelectTrigger id="box-size">
                    <SelectValue placeholder="Select box size" />
                  </SelectTrigger>
                  <SelectContent>
                    {BOX_SIZES.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="override-rate">Override Rate ($)</Label>
              <Input
                id="override-rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={overrideRate}
                onChange={(e) => setOverrideRate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !packageType || !overrideRate}>
              {isLoading ? "Adding..." : "Add Override"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteOverrideDialogProps {
  override: PackagingOverride;
  onDelete: () => Promise<void>;
  isLoading: boolean;
}

function DeleteOverrideDialog({ override, onDelete, isLoading }: DeleteOverrideDialogProps) {
  const [open, setOpen] = React.useState(false);

  const handleDelete = async () => {
    await onDelete();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Override</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the packaging override for{" "}
            <strong>{override.package_type}</strong>
            {override.box_size && ` (${override.box_size})`}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function PackagingOverridesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="rounded-full bg-muted p-3 mb-3">
        <Package className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No packaging overrides</p>
      <p className="text-xs text-muted-foreground mt-1">
        This customer uses standard packaging rates
      </p>
    </div>
  );
}

export function PackagingOverrides({
  customerId,
  overrides: initialOverrides,
  onAdd,
  onDelete,
  className,
}: PackagingOverridesProps) {
  const { data: overrides, isLoading, isError } = usePackagingOverrides(customerId, initialOverrides);
  const addMutation = useAddPackagingOverride(customerId);
  const deleteMutation = useDeletePackagingOverride(customerId);

  const handleAdd = async (data: PackagingOverrideFormData) => {
    if (onAdd) {
      await onAdd(data);
    } else {
      await addMutation.mutateAsync(data);
    }
  };

  const handleDelete = async (id: number) => {
    if (onDelete) {
      await onDelete(id);
    } else {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <PackagingOverridesSkeleton />;
  }

  if (isError) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <p className="text-center text-sm text-muted-foreground">
            Failed to load packaging overrides
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasOverrides = overrides && overrides.length > 0;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base">Packaging Rate Overrides</CardTitle>
          <CardDescription>Custom packaging rates for this customer</CardDescription>
        </div>
        <AddOverrideDialog onSubmit={handleAdd} isLoading={addMutation.isPending} />
      </CardHeader>
      <CardContent>
        {hasOverrides ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package Type</TableHead>
                  <TableHead>Box Size</TableHead>
                  <TableHead className="text-right">Override Rate</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overrides.map((override) => (
                  <TableRow key={override.id}>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {override.package_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {override.box_size ? (
                        <span className="capitalize">{override.box_size.replace("_", " ")}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(override.override_rate)}
                    </TableCell>
                    <TableCell>
                      <DeleteOverrideDialog
                        override={override}
                        onDelete={() => handleDelete(override.id)}
                        isLoading={deleteMutation.isPending}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState />
        )}
      </CardContent>
    </Card>
  );
}
