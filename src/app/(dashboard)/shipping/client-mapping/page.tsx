"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useShippingClientMappings,
  useCreateClientMapping,
  useUpdateClientMapping,
  useDeleteClientMapping,
} from "@/hooks/use-shipping";
import { useCustomers } from "@/hooks/use-customers";
import type { ShippingClientMapping } from "@/types";
import { toast } from "sonner";

const mappingFormSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  techship_client_id: z.string().min(1, "TechShip Client ID is required"),
  techship_client_name: z.string().min(1, "TechShip Client Name is required"),
  is_active: z.boolean(),
});

type MappingFormValues = z.infer<typeof mappingFormSchema>;

export default function ClientMappingPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] =
    useState<ShippingClientMapping | null>(null);
  const [deletingMapping, setDeletingMapping] =
    useState<ShippingClientMapping | null>(null);

  const { data: customersData } = useCustomers({ per_page: 200 });
  const customers = customersData?.data ?? [];

  const { data: mappingsData, isLoading } = useShippingClientMappings();
  const mappings = mappingsData?.data ?? [];

  const createMapping = useCreateClientMapping();
  const updateMapping = useUpdateClientMapping();
  const deleteMapping = useDeleteClientMapping();

  const form = useForm<MappingFormValues>({
    resolver: zodResolver(mappingFormSchema),
    defaultValues: {
      customer_id: "",
      techship_client_id: "",
      techship_client_name: "",
      is_active: true,
    },
  });

  const onSubmit = (data: MappingFormValues) => {
    const payload = {
      customer_id: Number(data.customer_id),
      techship_client_id: data.techship_client_id,
      techship_client_name: data.techship_client_name,
      is_active: data.is_active,
    };

    if (editingMapping) {
      updateMapping.mutate(
        { id: editingMapping.id, data: payload },
        {
          onSuccess: () => {
            toast.success("Client mapping updated");
            setIsDialogOpen(false);
            setEditingMapping(null);
            form.reset();
          },
          onError: () => {
            toast.error("Failed to update client mapping");
          },
        }
      );
    } else {
      createMapping.mutate(payload, {
        onSuccess: () => {
          toast.success("Client mapping created");
          setIsDialogOpen(false);
          form.reset();
        },
        onError: () => {
          toast.error("Failed to create client mapping");
        },
      });
    }
  };

  const handleEdit = (mapping: ShippingClientMapping) => {
    setEditingMapping(mapping);
    form.reset({
      customer_id: String(mapping.customer_id),
      techship_client_id: mapping.techship_client_id,
      techship_client_name: mapping.techship_client_name,
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
        toast.success("Client mapping deleted");
        setDeletingMapping(null);
      },
      onError: () => {
        toast.error("Failed to delete client mapping");
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Mapping</h1>
          <p className="text-muted-foreground">
            Map customers to TechShip client IDs for automated charge matching
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleCloseDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Mapping
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMapping ? "Edit" : "Add"} Client Mapping
              </DialogTitle>
              <DialogDescription>
                Configure the mapping between a customer and their TechShip
                client account
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem
                              key={customer.id}
                              value={String(customer.id)}
                            >
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The customer to link with TechShip
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="techship_client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TechShip Client ID *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., TS-12345"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The client identifier in TechShip
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="techship_client_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TechShip Client Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Acme Corp Shipping"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Display name of the client in TechShip
                      </FormDescription>
                      <FormMessage />
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
                          Enable or disable this client mapping
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
                    {editingMapping ? "Save Changes" : "Add Mapping"}
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
          <CardTitle>Client Mappings</CardTitle>
          <CardDescription>
            Customer to TechShip client account mappings for automated shipping
            charge reconciliation
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
                  <TableHead>Customer</TableHead>
                  <TableHead>TechShip Client ID</TableHead>
                  <TableHead>TechShip Client Name</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-medium">
                      {mapping.customer_name}
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                        {mapping.techship_client_id}
                      </code>
                    </TableCell>
                    <TableCell>{mapping.techship_client_name}</TableCell>
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
                No client mappings configured
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Add a mapping to link a customer with their TechShip account
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
            <AlertDialogTitle>Delete Client Mapping</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the mapping for{" "}
              <strong>{deletingMapping?.customer_name}</strong>? This action
              cannot be undone. Shipping charges will no longer be automatically
              matched for this customer.
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
