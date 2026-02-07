"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, FileText, Check, Calendar } from "lucide-react";
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
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import { useBillingPeriods } from "@/hooks/use-billing";
import { useCustomers } from "@/hooks/use-customers";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";

interface UnbilledSummary {
  customer_id: string;
  customer_name: string;
  customer_code: string;
  total_charges: number;
  order_count: number;
}

export default function BulkCreateInvoicesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  const { data: periodsData } = useBillingPeriods({ per_page: 50 });
  const periods = periodsData?.data ?? [];
  const openPeriods = periods.filter((p) => p.status === "open" || p.status === "closed");

  const { data: unbilledData, isLoading: unbilledLoading } = useQuery({
    queryKey: ["unbilled-summary", selectedPeriod],
    queryFn: async () => {
      if (!selectedPeriod) return [];
      const response = await api.get<{ summary: UnbilledSummary[] }>(
        endpoints.billing.unbilled,
        { billing_period_id: selectedPeriod }
      );
      return response.data?.summary ?? [];
    },
    enabled: !!selectedPeriod,
  });

  const createInvoices = useMutation({
    mutationFn: async (params: { billing_period_id: string; customer_ids: string[] }): Promise<{ created_count: number }> => {
      const response = await api.post<{ created_count: number }>(endpoints.invoices.bulkCreate, params);
      return response.data ?? { created_count: 0 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["unbilled-summary"] });
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

  const handleCreate = () => {
    if (!selectedPeriod) {
      toast.error("Please select a billing period");
      return;
    }
    if (selectedCustomers.length === 0) {
      toast.error("Please select at least one customer");
      return;
    }
    createInvoices.mutate({
      billing_period_id: selectedPeriod,
      customer_ids: selectedCustomers,
    });
  };

  const selectedTotal =
    unbilledData
      ?.filter((c) => selectedCustomers.includes(c.customer_id))
      .reduce((sum, c) => sum + c.total_charges, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Create Invoices</h1>
          <p className="text-muted-foreground">
            Generate invoices for multiple customers at once
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Select Customers</CardTitle>
            <CardDescription>
              Choose a billing period and select customers to invoice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Billing Period</label>
              <Select
                value={selectedPeriod}
                onValueChange={(v) => {
                  setSelectedPeriod(v);
                  setSelectedCustomers([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a billing period" />
                </SelectTrigger>
                <SelectContent>
                  {openPeriods.map((period) => (
                    <SelectItem key={period.id} value={String(period.id)}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {period.period_name}
                        <Badge
                          variant={period.status === "open" ? "default" : "secondary"}
                          className="ml-2"
                        >
                          {period.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPeriod && (
              <>
                {unbilledLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : unbilledData && unbilledData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={
                              unbilledData.length > 0 &&
                              selectedCustomers.length === unbilledData.length
                            }
                            onCheckedChange={toggleAll}
                          />
                        </TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unbilledData.map((item) => (
                        <TableRow
                          key={item.customer_id}
                          className={
                            selectedCustomers.includes(item.customer_id)
                              ? "bg-primary/5"
                              : ""
                          }
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedCustomers.includes(item.customer_id)}
                              onCheckedChange={() => toggleCustomer(item.customer_id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.customer_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.customer_code}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.order_count}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.total_charges)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No unbilled charges for this period
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Selected Customers</span>
              <span className="font-medium">{selectedCustomers.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Orders</span>
              <span className="font-medium">
                {unbilledData
                  ?.filter((c) => selectedCustomers.includes(c.customer_id))
                  .reduce((sum, c) => sum + c.order_count, 0) ?? 0}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between font-medium">
                <span>Total Amount</span>
                <span className="text-lg">{formatCurrency(selectedTotal)}</span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={
                selectedCustomers.length === 0 ||
                !selectedPeriod ||
                createInvoices.isPending
              }
            >
              {createInvoices.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Create {selectedCustomers.length} Invoice
              {selectedCustomers.length !== 1 ? "s" : ""}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
