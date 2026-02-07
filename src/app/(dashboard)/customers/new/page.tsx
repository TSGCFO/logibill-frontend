"use client";

import { useState } from "react";
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
// Textarea and Select removed - not needed for create form
import { useCreateCustomer } from "@/hooks/use-customers";
import { toast } from "sonner";

const customerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  wms_customer_id: z.number().int().positive("WMS Customer ID is required"),
  external_id: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address_line1: z.string().optional(),
  city: z.string().optional(),
  state_province: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  invoice_email: z.string().email("Invalid email address").optional().or(z.literal("")),
  payment_terms: z.number().min(0).max(120),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

export default function NewCustomerPage() {
  const router = useRouter();
  const createCustomer = useCreateCustomer();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      wms_customer_id: undefined as unknown as number,
      external_id: "",
      email: "",
      phone: "",
      address_line1: "",
      city: "",
      state_province: "",
      postal_code: "",
      country: "",
      invoice_email: "",
      payment_terms: 30,
    },
  });

  const onSubmit = async (data: CustomerFormValues) => {
    try {
      const customer = await createCustomer.mutateAsync({
        ...data,
        email: data.email || null,
        external_id: data.external_id || null,
        invoice_email: data.invoice_email || null,
        address_line1: data.address_line1 || null,
        city: data.city || null,
        state_province: data.state_province || null,
        postal_code: data.postal_code || null,
        country: data.country || null,
      });
      toast.success("Customer created", {
        description: `${data.name} has been created successfully`,
      });
      router.push(`/customers/${customer?.id || ""}`);
    } catch (error) {
      toast.error("Failed to create customer", {
        description: "Please check your input and try again",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Customer</h1>
          <p className="text-muted-foreground">
            Create a new customer account
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Customer name, WMS ID, and external identifier
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corporation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wms_customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WMS Customer ID *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="12345"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Customer ID from the WMS system
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="external_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>External ID</FormLabel>
                      <FormControl>
                        <Input placeholder="ACME" {...field} />
                      </FormControl>
                      <FormDescription>
                        Short unique identifier (e.g., ACME, VAS, CK)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Email, phone, and address details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contact@acme.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoice_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="billing@acme.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Invoices will be sent to this address
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address_line1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state_province"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Province</FormLabel>
                        <FormControl>
                          <Input placeholder="NY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="10001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="US" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Billing Settings */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Billing Settings</CardTitle>
                <CardDescription>
                  Payment terms and billing preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="payment_terms"
                  render={({ field }) => (
                    <FormItem className="max-w-xs">
                      <FormLabel>Payment Terms (Days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={120}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of days until payment is due (e.g., 30 for Net 30)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={createCustomer.isPending}
            >
              {createCustomer.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Customer
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/customers">Cancel</Link>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
