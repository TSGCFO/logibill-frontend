"use client";

import { useState } from "react";
import {
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Code,
  FileJson,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCustomers } from "@/hooks/use-customers";
import {
  useBillingSandbox,
  type SandboxTestData,
  type SandboxTestResult,
} from "@/hooks/use-billing-rules";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

/**
 * Billing Sandbox Page
 *
 * Test billing rules with sample orders before applying to production.
 * Connected to real API via useBillingSandbox hook.
 *
 * Track: frontend-prod_20260202
 * Task: 4.6
 */
export default function BillingSandboxPage() {
  const { data: customersData } = useCustomers();
  const customers = customersData?.data ?? [];
  const [customerId, setCustomerId] = useState<string>("");
  const [orderJson, setOrderJson] = useState(sampleOrder);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [results, setResults] = useState<SandboxTestResult | null>(null);

  // Use the real sandbox mutation hook
  const sandboxMutation = useBillingSandbox();

  const validateJson = (json: string): boolean => {
    try {
      JSON.parse(json);
      setJsonError(null);
      return true;
    } catch {
      setJsonError("Invalid JSON format. Please check your order data.");
      return false;
    }
  };

  const handleRunSandbox = async () => {
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }

    if (!validateJson(orderJson)) {
      toast.error("Invalid JSON", {
        description: "Please fix the JSON format before running the sandbox.",
      });
      return;
    }

    try {
      const orderData = JSON.parse(orderJson);

      const sandboxData: SandboxTestData = {
        customer_id: Number(customerId),
        order_data: orderData,
      };

      const result = await sandboxMutation.mutateAsync(sandboxData);
      setResults(result);
      toast.success("Sandbox evaluation complete", {
        description: `Total: ${formatCurrency(result.total)} (${result.execution_time_ms ?? 0}ms)`,
      });
    } catch (error) {
      toast.error("Failed to run sandbox", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleJsonChange = (value: string) => {
    setOrderJson(value);
    if (jsonError) {
      validateJson(value);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Sandbox</h1>
          <p className="text-muted-foreground">
            Test billing rules with sample orders before applying to production
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>
              Select a customer and provide order data to test
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={String(customer.id)}>
                      {customer.name} ({customer.external_id ?? customer.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Order Data (JSON)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOrderJson(sampleOrder);
                    setJsonError(null);
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset to Sample
                </Button>
              </div>
              <Textarea
                value={orderJson}
                onChange={(e) => handleJsonChange(e.target.value)}
                rows={15}
                className={`font-mono text-sm ${jsonError ? "border-destructive" : ""}`}
                placeholder="Paste order JSON here..."
              />
              {jsonError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Invalid JSON</AlertTitle>
                  <AlertDescription>{jsonError}</AlertDescription>
                </Alert>
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleRunSandbox}
              disabled={sandboxMutation.isPending || !customerId}
            >
              {sandboxMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Running Evaluation...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Sandbox
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Billing calculation breakdown and trace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results ? (
              <Tabs defaultValue="charges" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="charges">Charges</TabsTrigger>
                  <TabsTrigger value="trace">Evaluation Trace</TabsTrigger>
                </TabsList>

                <TabsContent value="charges" className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="font-medium">Order Total</span>
                    <span className="text-2xl font-bold">
                      {formatCurrency(results.total)}
                    </span>
                  </div>

                  {results.execution_time_ms && (
                    <p className="text-sm text-muted-foreground text-right">
                      Evaluated in {results.execution_time_ms}ms
                    </p>
                  )}

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.charges.map((charge, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Badge variant="outline">{charge.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>{charge.description}</p>
                              {charge.rule_applied && (
                                <p className="text-xs text-muted-foreground">
                                  Rule: {charge.rule_applied}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {charge.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(charge.unit_price)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(charge.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="trace">
                  <div className="space-y-2">
                    {results.rules_evaluated.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No rules were evaluated for this order.
                      </p>
                    ) : (
                      results.rules_evaluated.map((rule, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-3 rounded-lg border"
                        >
                          {rule.matched ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{rule.name}</span>
                              <Badge
                                variant={rule.matched ? "default" : "secondary"}
                              >
                                {rule.matched ? "Matched" : "No Match"}
                              </Badge>
                            </div>
                            {rule.reason && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {rule.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileJson className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No results yet</p>
                <p className="text-sm">
                  Configure an order and run the sandbox to see billing results
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison Section */}
      <Card>
        <CardHeader>
          <CardTitle>Comparison</CardTitle>
          <CardDescription>
            Compare sandbox results with actual billing data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Code className="h-8 w-8 mx-auto mb-4 opacity-50" />
            <p>Run the sandbox first to compare results</p>
            <p className="text-sm">
              After running, you can compare sandbox estimates with actual historical charges
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const sampleOrder = `{
  "order_id": "ORD-12345",
  "order_type": "B2C",
  "carrier": "FedEx",
  "service_level": "Ground",
  "items": [
    {
      "sku": "SKU-001",
      "quantity": 5,
      "weight": 0.5
    },
    {
      "sku": "SKU-002",
      "quantity": 10,
      "weight": 0.25
    }
  ],
  "packages": [
    {
      "box_size": "medium",
      "weight": 4.5
    },
    {
      "box_size": "medium",
      "weight": 3.2
    }
  ],
  "shipping_cost": 12.50
}`;
