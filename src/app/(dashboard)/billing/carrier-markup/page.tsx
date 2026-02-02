"use client";

import { useState } from "react";
import {
  Plus,
  Truck,
  Pencil,
  Trash2,
  Loader2,
  MoreHorizontal,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useCustomers } from "@/hooks/use-customers";
import { toast } from "sonner";

interface CarrierMarkup {
  id: string;
  customer_id?: string;
  customer_name?: string;
  carrier: string;
  service_level?: string;
  markup_type: "percentage" | "flat";
  markup_value: number;
  is_active: boolean;
}

const markupFormSchema = z.object({
  customer_id: z.string().optional(),
  carrier: z.string().min(1, "Carrier is required"),
  service_level: z.string().optional(),
  markup_type: z.enum(["percentage", "flat"]),
  markup_value: z.number().min(0, "Markup must be positive"),
});

type MarkupFormValues = z.infer<typeof markupFormSchema>;

const carriers = ["FedEx", "UPS", "USPS", "DHL", "OnTrac", "Other"];
const serviceLevels = [
  "Ground",
  "Express",
  "2-Day",
  "Overnight",
  "Priority",
  "Economy",
];

export default function CarrierMarkupPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMarkup, setEditingMarkup] = useState<CarrierMarkup | null>(null);

  const { data: customersData } = useCustomers();
  const customers = customersData?.data ?? [];

  const { data: markupsData, isLoading } = useQuery({
    queryKey: ["carrier-markups"],
    queryFn: async () => {
      const response = await api.get<{ data: CarrierMarkup[] }>(
        "/api/v1/billing/carrier-markups"
      );
      return response.data.data;
    },
  });

  const form = useForm<MarkupFormValues>({
    resolver: zodResolver(markupFormSchema),
    defaultValues: {
      customer_id: "",
      carrier: "",
      service_level: "",
      markup_type: "percentage",
      markup_value: 0,
    },
  });

  const createMarkup = useMutation({
    mutationFn: async (data: MarkupFormValues) => {
      const response = await api.post("/api/v1/billing/carrier-markups", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carrier-markups"] });
      toast.success("Carrier markup created");
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast.error("Failed to create carrier markup");
    },
  });

  const updateMarkup = useMutation({
    mutationFn: async (data: MarkupFormValues & { id: string }) => {
      const { id, ...payload } = data;
      const response = await api.put(
        `/api/v1/billing/carrier-markups/${id}`,
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carrier-markups"] });
      toast.success("Carrier markup updated");
      setIsDialogOpen(false);
      setEditingMarkup(null);
      form.reset();
    },
    onError: () => {
      toast.error("Failed to update carrier markup");
    },
  });

  const deleteMarkup = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/billing/carrier-markups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carrier-markups"] });
      toast.success("Carrier markup deleted");
    },
    onError: () => {
      toast.error("Failed to delete carrier markup");
    },
  });

  const onSubmit = (data: MarkupFormValues) => {
    if (editingMarkup) {
      updateMarkup.mutate({ ...data, id: editingMarkup.id });
    } else {
      createMarkup.mutate(data);
    }
  };

  const handleEdit = (markup: CarrierMarkup) => {
    setEditingMarkup(markup);
    form.reset({
      customer_id: markup.customer_id || "",
      carrier: markup.carrier,
      service_level: markup.service_level || "",
      markup_type: markup.markup_type,
      markup_value: markup.markup_value,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMarkup(null);
    form.reset();
  };

  // Group markups by global vs customer-specific
  const globalMarkups = markupsData?.filter((m) => !m.customer_id) ?? [];
  const customerMarkups = markupsData?.filter((m) => m.customer_id) ?? [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Carrier Markup</h1>
          <p className="text-muted-foreground">
            Configure shipping cost markups by carrier and service level
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleCloseDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Markup
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMarkup ? "Edit" : "Add"} Carrier Markup
              </DialogTitle>
              <DialogDescription>
                Configure markup rules for shipping costs
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Global (all customers)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Global (all customers)</SelectItem>
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
                        Leave empty to apply globally
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="carrier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carrier *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select carrier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {carriers.map((carrier) => (
                            <SelectItem key={carrier} value={carrier}>
                              {carrier}
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
                  name="service_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All service levels" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All service levels</SelectItem>
                          {serviceLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 grid-cols-2">
                  <FormField
                    control={form.control}
                    name="markup_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Markup Type *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="flat">Flat Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="markup_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Markup Value *{" "}
                          {form.watch("markup_type") === "percentage"
                            ? "(%)"
                            : "($)"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                    disabled={createMarkup.isPending || updateMarkup.isPending}
                  >
                    {(createMarkup.isPending || updateMarkup.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingMarkup ? "Save Changes" : "Add Markup"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Global Markups */}
      <Card>
        <CardHeader>
          <CardTitle>Global Markups</CardTitle>
          <CardDescription>
            Default markups applied to all customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : globalMarkups.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Service Level</TableHead>
                  <TableHead>Markup Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {globalMarkups.map((markup) => (
                  <TableRow key={markup.id}>
                    <TableCell className="font-medium">{markup.carrier}</TableCell>
                    <TableCell>{markup.service_level || "All"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{markup.markup_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {markup.markup_type === "percentage"
                        ? `${markup.markup_value}%`
                        : `$${markup.markup_value.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={markup.is_active ? "default" : "secondary"}>
                        {markup.is_active ? "Active" : "Inactive"}
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
                          <DropdownMenuItem onClick={() => handleEdit(markup)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMarkup.mutate(markup.id)}
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
              <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No global markups configured</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer-Specific Markups */}
      <Card>
        <CardHeader>
          <CardTitle>Customer-Specific Markups</CardTitle>
          <CardDescription>
            Custom markups that override global settings for specific customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customerMarkups.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Service Level</TableHead>
                  <TableHead>Markup Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerMarkups.map((markup) => (
                  <TableRow key={markup.id}>
                    <TableCell className="font-medium">
                      {markup.customer_name}
                    </TableCell>
                    <TableCell>{markup.carrier}</TableCell>
                    <TableCell>{markup.service_level || "All"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{markup.markup_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {markup.markup_type === "percentage"
                        ? `${markup.markup_value}%`
                        : `$${markup.markup_value.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={markup.is_active ? "default" : "secondary"}>
                        {markup.is_active ? "Active" : "Inactive"}
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
                          <DropdownMenuItem onClick={() => handleEdit(markup)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMarkup.mutate(markup.id)}
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
              <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No customer-specific markups configured
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
