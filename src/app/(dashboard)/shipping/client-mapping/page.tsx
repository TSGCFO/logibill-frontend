"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  MoreHorizontal,
  Link as LinkIcon,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useShippingClientMappings,
  useCreateClientMapping,
  useUpdateClientMapping,
  useDeleteClientMapping,
} from "@/hooks/use-shipping";
import type { ShippingClientMapping } from "@/types";
import { toast } from "sonner";

const mappingFormSchema = z.object({
  carrier_code: z.string().min(1, "Carrier code is required"),
  carrier_name: z.string().min(1, "Carrier name is required"),
  default_markup_percentage: z.string().optional(),
  is_customer_owned: z.boolean(),
  is_active: z.boolean(),
});

type MappingFormValues = z.infer<typeof mappingFormSchema>;

export default function ClientMappingPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] =
    useState<ShippingClientMapping | null>(null);
  const [deletingMapping, setDeletingMapping] =
    useState<ShippingClientMapping | null>(null);

  const { data: mappings = [], isLoading } = useShippingClientMappings();

  const createMapping = useCreateClientMapping();
  const updateMapping = useUpdateClientMapping();
  const deleteMapping = useDeleteClientMapping();

  const form = useForm<MappingFormValues>({
    resolver: zodResolver(mappingFormSchema),
    defaultValues: {
      carrier_code: "",
      carrier_name: "",
      default_markup_percentage: "",
      is_customer_owned: false,
      is_active: true,
    },
  });

  const onSubmit = (data: MappingFormValues) => {
    const payload = {
      carrier_code: data.carrier_code,
      carrier_name: data.carrier_name,
      default_markup_percentage: data.default_markup_percentage || undefined,
      is_customer_owned: data.is_customer_owned,
      is_active: data.is_active,
    };

    if (editingMapping) {
      updateMapping.mutate(
        { id: editingMapping.id, data: payload },
        {
          onSuccess: () => {
            toast.success("Carrier account updated");
            setIsDialogOpen(false);
            setEditingMapping(null);
            form.reset();
          },
          onError: () => {
            toast.error("Failed to update carrier account");
          },
        }
      );
    } else {
      createMapping.mutate(payload, {
        onSuccess: () => {
          toast.success("Carrier account created");
          setIsDialogOpen(false);
          form.reset();
        },
        onError: () => {
          toast.error("Failed to create carrier account");
        },
      });
    }
  };

  const handleEdit = (mapping: ShippingClientMapping) => {
    setEditingMapping(mapping);
    form.reset({
      carrier_code: mapping.account_code,
      carrier_name: mapping.account_name ?? "",
      default_markup_percentage: mapping.default_markup_percentage ?? "",
      is_customer_owned: mapping.is_customer_owned ?? false,
      is_active: mapping.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMapping(null);
    form.reset();
  };

  const handleDelete = () => {
    if (!deletingMapping) return;
    deleteMapping.mutate(deletingMapping.id, {
      onSuccess: () => {
        toast.success("Carrier account deleted");
        setDeletingMapping(null);
      },
      onError: () => {
        toast.error("Failed to delete carrier account");
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Carrier Accounts</h1>
          <p className="text-muted-foreground">
            Manage carrier accounts for automated shipping charge matching
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleCloseDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Carrier Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMapping ? "Edit" : "Add"} Carrier Account
              </DialogTitle>
              <DialogDescription>
                Configure a carrier account for shipping charge reconciliation
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="carrier_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carrier Code *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., FEDEX, UPS"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for this carrier account
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="carrier_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carrier Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., FedEx Ground"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Display name for this carrier account
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="default_markup_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Markup %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 15.00"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Default markup percentage applied to shipping charges
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_customer_owned"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Customer Owned</FormLabel>
                        <FormDescription>
                          Whether this account is owned by the customer
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

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Enable or disable this carrier account
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
                    onClick={handleCloseDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createMapping.isPending || updateMapping.isPending
                    }
                  >
                    {(createMapping.isPending || updateMapping.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingMapping ? "Save Changes" : "Add Account"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mappings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Carrier Accounts</CardTitle>
          <CardDescription>
            Carrier accounts used for automated shipping charge reconciliation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : mappings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Markup %</TableHead>
                  <TableHead>Customer Owned</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell>
                      <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                        {mapping.account_code}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">
                      {mapping.account_name || "-"}
                    </TableCell>
                    <TableCell>
                      {mapping.techship_carrier_name || mapping.techship_carrier_code || "-"}
                    </TableCell>
                    <TableCell>
                      {mapping.default_markup_percentage
                        ? `${mapping.default_markup_percentage}%`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={mapping.is_customer_owned ? "default" : "secondary"}>
                        {mapping.is_customer_owned ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={mapping.is_active ? "default" : "secondary"}
                      >
                        {mapping.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEdit(mapping)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeletingMapping(mapping)}
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
          ) : (
            <div className="text-center py-8">
              <LinkIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No carrier accounts configured
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Add a carrier account to enable automated shipping charge reconciliation
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingMapping}
        onOpenChange={(open) => !open && setDeletingMapping(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Carrier Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the carrier account{" "}
              <strong>{deletingMapping?.account_name || deletingMapping?.account_code}</strong>? This action
              cannot be undone. Shipping charges will no longer be automatically
              matched for this carrier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMapping.isPending && (
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
