"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomer } from "@/hooks/use-customers";
import { toast } from "sonner";

export default function BillingConfigPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = use(params);
  const { data: customer, isLoading } = useCustomer(customerId);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Billing configuration saved");
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <BillingConfigSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/customers/${customerId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Billing Configuration
            </h1>
            <p className="text-muted-foreground">
              Configure billing rules for {customer?.name}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="rules">Custom Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic billing configuration for this customer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Billing Cycle</Label>
                  <Select defaultValue="monthly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Select defaultValue="net30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="net15">Net 15</SelectItem>
                      <SelectItem value="net30">Net 30</SelectItem>
                      <SelectItem value="net45">Net 45</SelectItem>
                      <SelectItem value="net60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-generate Invoices</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically generate invoices at period close
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-send Invoices</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically email invoices when generated
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fulfillment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fulfillment Billing</CardTitle>
              <CardDescription>
                Pick, pack, and order processing charges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Pick Rate</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue="0.35"
                      className="rounded-l-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Per item picked</p>
                </div>
                <div className="space-y-2">
                  <Label>Pack Rate</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue="1.50"
                      className="rounded-l-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Per package</p>
                </div>
                <div className="space-y-2">
                  <Label>Order Minimum</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue="5.00"
                      className="rounded-l-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum per order</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Use Tiered Pricing</Label>
                  <p className="text-sm text-muted-foreground">
                    Apply volume-based discounts
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Configuration</CardTitle>
              <CardDescription>
                Postage markup and carrier settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Postage Markup Type</Label>
                  <Select defaultValue="percentage">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="flat">Flat Rate</SelectItem>
                      <SelectItem value="tiered">Tiered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Markup Value</Label>
                  <div className="flex">
                    <Input type="number" step="0.01" defaultValue="15" />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-input bg-muted text-sm">
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Pass Through Shipping</Label>
                  <p className="text-sm text-muted-foreground">
                    Bill exact carrier costs without markup
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Materials & Supplies</CardTitle>
              <CardDescription>
                Packaging materials pricing overrides
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Use Customer-Specific Pricing</Label>
                  <p className="text-sm text-muted-foreground">
                    Override global materials pricing
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="border rounded-lg">
                <div className="p-4 border-b bg-muted/50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Materials Overrides</span>
                    <Button size="sm" variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Override
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No custom materials overrides configured</p>
                    <p className="text-sm">
                      Global pricing will be applied for all materials
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Billing Rules</CardTitle>
              <CardDescription>
                Define conditional rules for billing calculations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rule
                </Button>
              </div>

              <div className="border rounded-lg divide-y">
                <RuleItem
                  name="B2B Order Discount"
                  type="Order Type"
                  condition="order_type = 'B2B'"
                  action="10% discount on pick fee"
                />
                <RuleItem
                  name="High Volume Bonus"
                  type="Conditional"
                  condition="monthly_orders > 1000"
                  action="5% discount on all charges"
                />
                <RuleItem
                  name="FedEx Priority"
                  type="Carrier"
                  condition="carrier = 'FedEx'"
                  action="$0.50 handling fee"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RuleItem({
  name,
  type,
  condition,
  action,
}: {
  name: string;
  type: string;
  condition: string;
  action: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4">
      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{name}</span>
          <Badge variant="outline">{type}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          If <code className="bg-muted px-1 rounded">{condition}</code> then{" "}
          <span className="text-foreground">{action}</span>
        </p>
      </div>
      <Button variant="ghost" size="icon" className="text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function BillingConfigSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-1" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  );
}
