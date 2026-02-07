"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useCreateServiceType } from "@/hooks/use-services";
import { toast } from "sonner";

const serviceFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  category: z.enum(["pick_pack", "shipping", "storage", "receiving", "special_projects", "materials"]),
  description: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  base_rate: z.string().optional(),
  minimum_charge: z.string().optional(),
  is_active: z.boolean(),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export default function NewServicePage() {
  const router = useRouter();

  const createService = useCreateServiceType();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      category: "pick_pack",
      description: "",
      unit: "",
      base_rate: "",
      minimum_charge: "",
      is_active: true,
    },
  });

  const onSubmit = (data: ServiceFormValues) => {
    createService.mutate(
      {
        name: data.name,
        category: data.category,
        description: data.description || null,
        unit: data.unit,
        base_rate: data.base_rate || null,
        minimum_charge: data.minimum_charge || null,
        is_active: data.is_active,
      },
      {
        onSuccess: () => {
          toast.success("Service type created successfully");
          router.push("/services");
        },
        onError: () => {
          toast.error("Failed to create service type");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/services">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Service Type</h1>
          <p className="text-muted-foreground">
            Create a new billable service type
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
              <CardDescription>
                Define the service type name, category, and pricing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Item Picking" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
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
                          <SelectItem value="pick_pack">Pick & Pack</SelectItem>
                          <SelectItem value="shipping">Shipping</SelectItem>
                          <SelectItem value="storage">Storage</SelectItem>
                          <SelectItem value="receiving">Receiving</SelectItem>
                          <SelectItem value="special_projects">Special Projects</SelectItem>
                          <SelectItem value="materials">Materials</SelectItem>
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
                      <FormLabel>Unit *</FormLabel>
                      <FormControl>
                        <Input placeholder="per item" {...field} />
                      </FormControl>
                      <FormDescription>
                        e.g., per item, per pallet, per hour
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="base_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Rate ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
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
                      <FormLabel>Minimum Charge ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this service includes..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Service is available for billing
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
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={createService.isPending}>
              {createService.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Service
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/services">Cancel</Link>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
