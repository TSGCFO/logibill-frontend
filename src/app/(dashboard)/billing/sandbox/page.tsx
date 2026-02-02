"use client";

import { useState } from "react";
import {
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Code,
  FileJson,
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
import { useCustomers } from "@/hooks/use-customers";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

interface SandboxResult {
  order_id: string;
  charges: {
    type: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    rule_applied?: string;
  }[];
  total: number;
  evaluation_trace: string[];
}

export default function BillingSandboxPage() {
  const { data: customersData } = useCustomers();
  const customers = customersData?.data ?? [];
  const [customerId, setCustomerId] = useState<string>("");
  const [orderJson, setOrderJson] = useState(sampleOrder);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SandboxResult | null>(null);

  const handleRunSandbox = async () => {
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }

    setIsRunning(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock results
      setResults({
        order_id: "ORD-12345",
        charges: [
          {
            type: "Pick",
            description: "Item picking (15 items)",
            quantity: 15,
            rate: 0.35,
            amount: 5.25,
            rule_applied: "Standard pick rate",
          },
          {
            type: "Pack",
            description: "Package handling (2 packages)",
            quantity: 2,
            rate: 1.50,
            amount: 3.00,
            rule_applied: "Standard pack rate",
          },
          {
            type: "Materials",
            description: "Box - Medium (2)",
            quantity: 2,
            rate: 0.85,
            amount: 1.70,
            rule_applied: "Global materials pricing",
          },
          {
            type: "Shipping",
            description: "FedEx Ground + 15% markup",
            quantity: 1,
            rate: 12.50,
            amount: 14.38,
            rule_applied: "Carrier markup rule",
          },
        ],
        total: 24.33,
        evaluation_trace: [
          "Starting billing evaluation for order ORD-12345",
          "Customer: Vasanti Cosmetics (VAS)",
          "Order type: B2C",
          "Checking order type rules... No match",
          "Checking carrier rules... Match: FedEx markup 15%",
          "Applying pick rate: $0.35 × 15 items = $5.25",
          "Applying pack rate: $1.50 × 2 packages = $3.00",
          "Applying materials pricing: Medium box × 2 = $1.70",
          "Applying shipping: $12.50 + 15% = $14.38",
          "Total calculated: $24.33",
        ],
      });

      toast.success("Sandbox evaluation complete");
    } catch {
      toast.error("Failed to run sandbox");
    } finally {
      setIsRunning(false);
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
                      {customer.name} ({customer.code})
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
                  onClick={() => setOrderJson(sampleOrder)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset to Sample
                </Button>
              </div>
              <Textarea
                value={orderJson}
                onChange={(e) => setOrderJson(e.target.value)}
                rows={15}
                className="font-mono text-sm"
                placeholder="Paste order JSON here..."
              />
            </div>

            <Button
              className="w-full"
              onClick={handleRunSandbox}
              disabled={isRunning || !customerId}
            >
              {isRunning ? (
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

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
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
                          <TableCell className="text-right font-medium">
                            {formatCurrency(charge.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="trace">
                  <div className="space-y-2 font-mono text-sm">
                    {results.evaluation_trace.map((line, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-2 rounded hover:bg-muted"
                      >
                        {line.includes("Match") ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        ) : line.includes("No match") ? (
                          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                        ) : (
                          <Code className="h-4 w-4 text-blue-500 mt-0.5" />
                        )}
                        <span>{line}</span>
                      </div>
                    ))}
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
