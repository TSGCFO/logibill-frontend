"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  DollarSign,
  Package,
  Loader2,
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

interface BillingPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: "open" | "closed";
}

interface Customer {
  id: number;
  name: string;
  unbilled_orders: number;
  unbilled_amount: number;
  last_billed_at?: string;
}

interface GenerationPreview {
  customers: {
    id: number;
    name: string;
    order_count: number;
    estimated_charges: number;
  }[];
  total_orders: number;
  total_estimated: number;
}

interface GenerationResult {
  success: boolean;
  customers_processed: number;
  charges_created: number;
  total_amount: number;
  errors: { customer_id: number; customer_name: string; error: string }[];
}

export default function BillingGeneratePage() {
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [includeZeroBalance, setIncludeZeroBalance] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  // Fetch billing periods
  const { data: periods, isLoading: periodsLoading } = useQuery({
    queryKey: ["billing-periods-open"],
    queryFn: async () => {
      const response = await api.get<{ data: BillingPeriod[] }>(
        "/api/v1/billing/periods",
        { status: "open" }
      );
      return response.data?.data;
    },
  });

  // Fetch customers with unbilled orders
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["customers-unbilled", selectedPeriod, includeZeroBalance],
    queryFn: async () => {
      const response = await api.get<{ data: Customer[] }>(
        "/api/v1/billing/unbilled-customers",
        {
          period_id: selectedPeriod || undefined,
          include_zero: includeZeroBalance,
        }
      );
      return response.data?.data;
    },
    enabled: true,
  });

  // Preview generation
  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ["billing-preview", selectedPeriod, selectedCustomers],
    queryFn: async () => {
      const response = await api.post<{ data: GenerationPreview }>(
        "/api/v1/billing/generate/preview",
        {
          period_id: selectedPeriod ? Number(selectedPeriod) : null,
          customer_ids: selectedCustomers,
        }
      );
      return response.data?.data;
    },
    enabled: selectedCustomers.length > 0,
  });

  // Generate billing mutation
  const generateBilling = useMutation({
    mutationFn: async () => {
      const response = await api.post<{ data: GenerationResult }>(
        "/api/v1/billing/generate",
        {
          period_id: selectedPeriod ? Number(selectedPeriod) : null,
          customer_ids: selectedCustomers,
        }
      );
      return response.data?.data;
    },
    onSuccess: (data) => {
      if (!data) return;
      setGenerationResult(data);
      queryClient.invalidateQueries({ queryKey: ["customers-unbilled"] });
      queryClient.invalidateQueries({ queryKey: ["billing-periods"] });
      if (data.errors.length === 0) {
        toast.success("Billing generated successfully", {
          description: `${data.charges_created} charges created for ${data.customers_processed} customers`,
        });
      } else {
        toast.warning("Billing completed with errors", {
          description: `${data.errors.length} customers had errors`,
        });
      }
    },
    onError: () => {
      toast.error("Failed to generate billing");
    },
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked && customers) {
      setSelectedCustomers(customers.map((c) => c.id));
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

  const handleReset = () => {
    setGenerationResult(null);
    setSelectedCustomers([]);
    setSelectAll(false);
  };

  if (generationResult) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/billing">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Generation Complete</h1>
            <p className="text-muted-foreground">
              Billing charges have been generated
            </p>
          </div>
        </div>

        <Alert
          className={
            generationResult.errors.length === 0
              ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
              : "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950"
          }
        >
          {generationResult.errors.length === 0 ? (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          )}
          <AlertTitle>
            {generationResult.errors.length === 0
              ? "All Billing Generated Successfully"
              : "Generation Completed with Errors"}
          </AlertTitle>
          <AlertDescription>
            {generationResult.customers_processed} customers processed,{" "}
            {generationResult.charges_created} charges created
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {generationResult.customers_processed}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Charges Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {generationResult.charges_created}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(generationResult.total_amount)}
              </div>
            </CardContent>
          </Card>
        </div>

        {generationResult.errors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Errors</CardTitle>
              <CardDescription>
                The following customers had errors during generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {generationResult.errors.map((error) => (
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
            Generate More
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/billing">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate Billing</h1>
          <p className="text-muted-foreground">
            Calculate and generate billing charges for customers
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Period Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Billing Period
              </CardTitle>
              <CardDescription>
                Select a billing period or generate for all unbilled orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                {periodsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger id="period">
                      <SelectValue placeholder="All unbilled orders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All unbilled orders</SelectItem>
                      {periods?.map((period) => (
                        <SelectItem key={period.id} value={String(period.id)}>
                          {period.name} ({period.start_date} - {period.end_date})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="include-zero" className="cursor-pointer">
                    Include Zero Balance
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show customers with no unbilled orders
                  </p>
                </div>
                <Switch
                  id="include-zero"
                  checked={includeZeroBalance}
                  onCheckedChange={setIncludeZeroBalance}
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Select Customers
                  </CardTitle>
                  <CardDescription>
                    Choose customers to generate billing for
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm cursor-pointer">
                    Select All
                  </Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {customersLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : customers && customers.length > 0 ? (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                          selectedCustomers.includes(customer.id)
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedCustomers.includes(customer.id)}
                            onCheckedChange={(checked) =>
                              handleCustomerToggle(customer.id, checked as boolean)
                            }
                          />
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Package className="h-3 w-3" />
                              {customer.unbilled_orders} orders
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(customer.unbilled_amount)}
                          </p>
                          {customer.last_billed_at && (
                            <p className="text-xs text-muted-foreground">
                              Last: {new Date(customer.last_billed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No customers with unbilled orders
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview & Generate */}
        <div className="space-y-6">
          {/* Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Generation Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Select customers to see preview
                </p>
              ) : previewLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : preview ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Customers</span>
                      <span className="font-medium">{preview.customers.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Orders</span>
                      <span className="font-medium">{preview.total_orders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estimated Total</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(preview.total_estimated)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      Customer breakdown:
                    </p>
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {preview.customers.map((c) => (
                        <div key={c.id} className="flex justify-between text-xs">
                          <span className="truncate mr-2">{c.name}</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(c.estimated_charges)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                disabled={selectedCustomers.length === 0 || generateBilling.isPending}
                onClick={() => generateBilling.mutate()}
              >
                {generateBilling.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Generate Billing
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Selected Count Badge */}
          {selectedCustomers.length > 0 && (
            <div className="rounded-lg border bg-muted/50 p-4 text-center">
              <Badge variant="secondary" className="text-lg px-4 py-1">
                {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? "s" : ""} selected
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
