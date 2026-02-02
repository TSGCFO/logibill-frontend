"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Users,
  DollarSign,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Download,
  Upload,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { formatCurrency, formatDateTime } from "@/lib/format";

interface BillingPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: "open" | "closed";
}

interface CustomerCharges {
  customer_id: number;
  customer_name: string;
  total_charges: number;
  charge_count: number;
  has_invoice: boolean;
  invoice_id?: number;
}

interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  total_amount: number;
  errors: { customer_id: number; customer_name: string; error: string }[];
}

type OperationType = "create-invoices" | "close-period" | "export-charges";

export default function BillingBulkPage() {
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [operationType, setOperationType] = useState<OperationType>("create-invoices");
  const [operationResult, setOperationResult] = useState<BulkOperationResult | null>(null);
  const [progress, setProgress] = useState(0);

  // Fetch billing periods
  const { data: periods, isLoading: periodsLoading } = useQuery({
    queryKey: ["billing-periods-for-bulk"],
    queryFn: async () => {
      const response = await api.get<{ data: BillingPeriod[] }>(
        "/api/v1/billing/periods"
      );
      return response.data.data;
    },
  });

  // Fetch customer charges for selected period
  const { data: customerCharges, isLoading: chargesLoading } = useQuery({
    queryKey: ["customer-charges", selectedPeriod],
    queryFn: async () => {
      const response = await api.get<{ data: CustomerCharges[] }>(
        `/api/v1/billing/periods/${selectedPeriod}/customers`
      );
      return response.data.data;
    },
    enabled: !!selectedPeriod,
  });

  // Bulk create invoices mutation
  const bulkCreateInvoices = useMutation({
    mutationFn: async () => {
      const response = await api.post<{ data: BulkOperationResult }>(
        "/api/v1/invoices/bulk-create",
        {
          period_id: Number(selectedPeriod),
          customer_ids: selectedCustomers,
        }
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      setOperationResult(data);
      queryClient.invalidateQueries({ queryKey: ["customer-charges"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (data.errors.length === 0) {
        toast.success("Invoices created successfully", {
          description: `${data.processed} invoices created`,
        });
      } else {
        toast.warning("Some invoices failed", {
          description: `${data.failed} of ${data.processed + data.failed} failed`,
        });
      }
    },
    onError: () => {
      toast.error("Failed to create invoices");
    },
  });

  // Close period mutation
  const closePeriod = useMutation({
    mutationFn: async () => {
      const response = await api.post<{ data: BulkOperationResult }>(
        `/api/v1/billing/periods/${selectedPeriod}/close`
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      setOperationResult(data);
      queryClient.invalidateQueries({ queryKey: ["billing-periods"] });
      toast.success("Period closed successfully");
    },
    onError: () => {
      toast.error("Failed to close period");
    },
  });

  // Export charges mutation
  const exportCharges = useMutation({
    mutationFn: async () => {
      const response = await api.get(
        `/api/v1/billing/periods/${selectedPeriod}/export`,
        {
          customer_ids: selectedCustomers.join(","),
          format: "csv",
        },
        { responseType: "blob" }
      );
      return response;
    },
    onSuccess: (response) => {
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `charges-period-${selectedPeriod}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export downloaded successfully");
    },
    onError: () => {
      toast.error("Failed to export charges");
    },
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked && customerCharges) {
      setSelectedCustomers(
        customerCharges.filter((c) => !c.has_invoice).map((c) => c.customer_id)
      );
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleCustomerToggle = (customerId: number, checked: boolean) => {
    if (checked) {
      setSelectedCustomers([...selectedCustomers, customerId]);
    } else {
      setSelectedCustomers(selectedCustomers.filter((id) => id !== customerId));
      setSelectAll(false);
    }
  };

  const handleExecute = () => {
    switch (operationType) {
      case "create-invoices":
        bulkCreateInvoices.mutate();
        break;
      case "close-period":
        closePeriod.mutate();
        break;
      case "export-charges":
        exportCharges.mutate();
        break;
    }
  };

  const handleReset = () => {
    setOperationResult(null);
    setSelectedCustomers([]);
    setSelectAll(false);
    setProgress(0);
  };

  const selectedPeriodData = periods?.find((p) => String(p.id) === selectedPeriod);
  const isPending =
    bulkCreateInvoices.isPending || closePeriod.isPending || exportCharges.isPending;

  const eligibleCustomers = customerCharges?.filter((c) => !c.has_invoice) || [];
  const totalSelectedCharges = customerCharges
    ?.filter((c) => selectedCustomers.includes(c.customer_id))
    .reduce((sum, c) => sum + c.total_charges, 0) || 0;

  if (operationResult) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/billing">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Operation Complete</h1>
            <p className="text-muted-foreground">
              Bulk operation has finished
            </p>
          </div>
        </div>

        <Alert
          className={
            operationResult.errors.length === 0
              ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
              : "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950"
          }
        >
          {operationResult.errors.length === 0 ? (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          )}
          <AlertTitle>
            {operationResult.errors.length === 0 ? "Success" : "Completed with Errors"}
          </AlertTitle>
          <AlertDescription>
            {operationResult.processed} items processed
            {operationResult.failed > 0 && `, ${operationResult.failed} failed`}
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Processed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {operationResult.processed}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {operationResult.failed}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(operationResult.total_amount)}
              </div>
            </CardContent>
          </Card>
        </div>

        {operationResult.errors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {operationResult.errors.map((error) => (
                  <div
                    key={error.customer_id}
                    className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                  >
                    <span className="font-medium">{error.customer_name}</span>
                    <span className="text-sm text-muted-foreground">
                      {error.error}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/billing">Back to Billing</Link>
          </Button>
          <Button onClick={handleReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Run Another Operation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/billing">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Operations</h1>
          <p className="text-muted-foreground">
            Perform batch operations on billing data
          </p>
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Select Billing Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          {periodsLoading ? (
            <Skeleton className="h-10 w-full max-w-md" />
          ) : (
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Select a billing period" />
              </SelectTrigger>
              <SelectContent>
                {periods?.map((period) => (
                  <SelectItem key={period.id} value={String(period.id)}>
                    <div className="flex items-center gap-2">
                      {period.name}
                      <Badge variant={period.status === "open" ? "default" : "secondary"}>
                        {period.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedPeriod && (
        <>
          {/* Operation Type Tabs */}
          <Tabs
            value={operationType}
            onValueChange={(v) => setOperationType(v as OperationType)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create-invoices">
                <FileText className="mr-2 h-4 w-4" />
                Create Invoices
              </TabsTrigger>
              <TabsTrigger value="close-period">
                <CheckCircle className="mr-2 h-4 w-4" />
                Close Period
              </TabsTrigger>
              <TabsTrigger value="export-charges">
                <Download className="mr-2 h-4 w-4" />
                Export Charges
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create-invoices" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Select Customers</CardTitle>
                      <CardDescription>
                        Choose customers to create invoices for
                      </CardDescription>
                    </div>
                    {eligibleCustomers.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="select-all"
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                        />
                        <Label htmlFor="select-all" className="cursor-pointer">
                          Select All ({eligibleCustomers.length})
                        </Label>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {chargesLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : customerCharges && customerCharges.length > 0 ? (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-2">
                        {customerCharges.map((customer) => (
                          <div
                            key={customer.customer_id}
                            className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                              customer.has_invoice
                                ? "bg-muted/30 opacity-60"
                                : selectedCustomers.includes(customer.customer_id)
                                ? "border-primary bg-primary/5"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedCustomers.includes(customer.customer_id)}
                                disabled={customer.has_invoice}
                                onCheckedChange={(checked) =>
                                  handleCustomerToggle(
                                    customer.customer_id,
                                    checked as boolean
                                  )
                                }
                              />
                              <div>
                                <p className="font-medium">{customer.customer_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {customer.charge_count} charges
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {formatCurrency(customer.total_charges)}
                              </p>
                              {customer.has_invoice && (
                                <Badge variant="secondary" className="mt-1">
                                  Invoice #{customer.invoice_id}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-2 text-muted-foreground">
                        No charges for this period
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {selectedCustomers.length} customers selected
                    </p>
                    <p className="text-lg font-bold">
                      {formatCurrency(totalSelectedCharges)}
                    </p>
                  </div>
                  <Button
                    disabled={selectedCustomers.length === 0 || isPending}
                    onClick={handleExecute}
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    Create {selectedCustomers.length} Invoice
                    {selectedCustomers.length !== 1 ? "s" : ""}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="close-period" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Close Billing Period</CardTitle>
                  <CardDescription>
                    Close this period to prevent further changes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedPeriodData && (
                    <div className="rounded-lg border p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Period</span>
                        <span className="font-medium">{selectedPeriodData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date Range</span>
                        <span className="font-medium">
                          {selectedPeriodData.start_date} - {selectedPeriodData.end_date}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge
                          variant={
                            selectedPeriodData.status === "open" ? "default" : "secondary"
                          }
                        >
                          {selectedPeriodData.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Customers</span>
                        <span className="font-medium">
                          {customerCharges?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Charges</span>
                        <span className="font-medium">
                          {formatCurrency(
                            customerCharges?.reduce((sum, c) => sum + c.total_charges, 0) ||
                              0
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                      Closing a period will prevent any further charges from being added.
                      Make sure all billing has been generated before closing.
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button
                    variant="destructive"
                    disabled={selectedPeriodData?.status !== "open" || isPending}
                    onClick={handleExecute}
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Close Period
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="export-charges" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Export Charges</CardTitle>
                  <CardDescription>
                    Download charges for this period as CSV
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Export All Charges</p>
                      <p className="text-sm text-muted-foreground">
                        Includes all customers and charges for this period
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleExecute} disabled={isPending}>
                      {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Download CSV
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Or select specific customers to export:
                    </p>
                    {chargesLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : (
                      <ScrollArea className="h-[200px] border rounded-lg p-2">
                        <div className="space-y-1">
                          {customerCharges?.map((customer) => (
                            <div
                              key={customer.customer_id}
                              className="flex items-center gap-2 py-1"
                            >
                              <Checkbox
                                checked={selectedCustomers.includes(customer.customer_id)}
                                onCheckedChange={(checked) =>
                                  handleCustomerToggle(
                                    customer.customer_id,
                                    checked as boolean
                                  )
                                }
                              />
                              <span className="text-sm">{customer.customer_name}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </CardContent>
                {selectedCustomers.length > 0 && (
                  <CardFooter className="border-t pt-4">
                    <Button onClick={handleExecute} disabled={isPending}>
                      {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Export Selected ({selectedCustomers.length})
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
