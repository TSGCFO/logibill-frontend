"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Loader2, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import type { BillingPeriod, Customer } from "@/types";

interface UnbilledCharge {
  customer_id: string;
  customer_name: string;
  customer_code: string;
  total_charges: number;
  order_count: number;
  pick_charges: number;
  pack_charges: number;
  materials_charges: number;
  shipping_charges: number;
}

export default function InvoiceFromPeriodPage() {
  const router = useRouter();
  const params = useParams();
  const periodId = params.periodId as string;
  const queryClient = useQueryClient();
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  const { data: periodData, isLoading: periodLoading } = useQuery({
    queryKey: ["billing-period", periodId],
    queryFn: async () => {
      const response = await api.get<BillingPeriod>(
        endpoints.billing.periodDetail(periodId)
      );
      return response.data;
    },
  });

  const { data: unbilledData, isLoading: unbilledLoading } = useQuery({
    queryKey: ["unbilled-charges", periodId],
    queryFn: async () => {
      const response = await api.get<{ summary: UnbilledCharge[] }>(
        endpoints.billing.unbilled,
        { billing_period_id: periodId }
      );
      return response.data?.summary ?? [];
    },
  });

  const createInvoices = useMutation({
    mutationFn: async (customerIds: string[]): Promise<{ created_count: number }> => {
      const response = await api.post<{ created_count: number }>(endpoints.invoices.bulkCreate, {
        billing_period_id: periodId,
        customer_ids: customerIds,
      });
      return response.data ?? { created_count: 0 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["unbilled-charges", periodId] });
      toast.success(`Created ${data.created_count} invoices successfully`);
      router.push("/invoices");
    },
    onError: () => {
      toast.error("Failed to create invoices");
    },
  });

  const toggleCustomer = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleAll = () => {
    if (selectedCustomers.length === unbilledData?.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(unbilledData?.map((c) => c.customer_id) ?? []);
    }
  };

  const handleCreateInvoices = () => {
    if (selectedCustomers.length === 0) {
      toast.error("Please select at least one customer");
      return;
    }
    createInvoices.mutate(selectedCustomers);
  };

  const selectedTotal = unbilledData
    ?.filter((c) => selectedCustomers.includes(c.customer_id))
    .reduce((sum, c) => sum + c.total_charges, 0) ?? 0;

  if (periodLoading || unbilledLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/billing/periods/${periodId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Create Invoices from Period
          </h1>
          <p className="text-muted-foreground">
            {periodData?.period_name} - Select customers to generate invoices
          </p>
        </div>
        <Badge variant={periodData?.status === "open" ? "default" : "secondary"}>
          {periodData?.status}
        </Badge>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Summary</CardTitle>
          <CardDescription>
            Review unbilled charges and select customers for invoice generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Customers</p>
              <p className="text-2xl font-bold">{unbilledData?.length ?? 0}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Selected</p>
              <p className="text-2xl font-bold">{selectedCustomers.length}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Unbilled</p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  unbilledData?.reduce((sum, c) => sum + c.total_charges, 0) ?? 0
                )}
              </p>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Selected Total</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(selectedTotal)}
              </p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      unbilledData &&
                      unbilledData.length > 0 &&
                      selectedCustomers.length === unbilledData.length
                    }
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Pick</TableHead>
                <TableHead className="text-right">Pack</TableHead>
                <TableHead className="text-right">Materials</TableHead>
                <TableHead className="text-right">Shipping</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unbilledData?.map((charge) => (
                <TableRow
                  key={charge.customer_id}
                  className={
                    selectedCustomers.includes(charge.customer_id)
                      ? "bg-primary/5"
                      : ""
                  }
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedCustomers.includes(charge.customer_id)}
                      onCheckedChange={() => toggleCustomer(charge.customer_id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{charge.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {charge.customer_code}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {charge.order_count}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(charge.pick_charges)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(charge.pack_charges)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(charge.materials_charges)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(charge.shipping_charges)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(charge.total_charges)}
                  </TableCell>
                </TableRow>
              ))}
              {(!unbilledData || unbilledData.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No unbilled charges for this period
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleCreateInvoices}
          disabled={selectedCustomers.length === 0 || createInvoices.isPending}
        >
          {createInvoices.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Create {selectedCustomers.length} Invoice
          {selectedCustomers.length !== 1 ? "s" : ""}
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/billing/periods/${periodId}`}>Cancel</Link>
        </Button>
      </div>
    </div>
  );
}
