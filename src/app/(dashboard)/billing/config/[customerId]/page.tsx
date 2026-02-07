"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Edit2,
  MoreHorizontal,
  Power,
  PowerOff,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useCustomer } from "@/hooks/use-customers";
import {
  useBillingRules,
  useCreateBillingRule,
  useUpdateBillingRule,
  useDeleteBillingRule,
  useToggleBillingRule,
  type BillingRuleWithDetails,
  type CreateCustomerBillingRuleData,
  type UpdateCustomerBillingRuleData,
} from "@/hooks/use-billing-rules";
import { toast } from "sonner";

// Rule type options
const RULE_TYPES = [
  { value: "order_type", label: "Order Type" },
  { value: "carrier", label: "Carrier" },
  { value: "conditional", label: "Conditional" },
  { value: "volume", label: "Volume-Based" },
  { value: "tiered", label: "Tiered" },
] as const;

// Condition fields
const CONDITION_FIELDS = [
  { value: "order_type", label: "Order Type" },
  { value: "carrier", label: "Carrier" },
  { value: "service_level", label: "Service Level" },
  { value: "items_count", label: "Items Count" },
  { value: "packages_count", label: "Packages Count" },
  { value: "total_weight", label: "Total Weight" },
  { value: "total_picks", label: "Total Picks" },
  { value: "monthly_orders", label: "Monthly Orders" },
] as const;

// Operators
const OPERATORS = [
  { value: "eq", label: "Equals" },
  { value: "ne", label: "Not Equals" },
  { value: "gt", label: "Greater Than" },
  { value: "gte", label: "Greater or Equal" },
  { value: "lt", label: "Less Than" },
  { value: "lte", label: "Less or Equal" },
  { value: "contains", label: "Contains" },
] as const;

export default function BillingConfigPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = use(params);
  const { data: customer, isLoading: customerLoading } = useCustomer(customerId);
  const { data: rules, isLoading: rulesLoading } = useBillingRules(customerId);

  // Mutation hooks
  const createRule = useCreateBillingRule();
  const updateRule = useUpdateBillingRule();
  const deleteRule = useDeleteBillingRule();
  const toggleRule = useToggleBillingRule();

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<BillingRuleWithDetails | null>(null);

  // Form state for creating/editing rule conditions
  const [formData, setFormData] = useState({
    service_type_id: 0,
    condition_type: "always" as string,
    condition_value: {} as Record<string, unknown>,
    applies_per: "order" as string,
    max_per_order: null as number | null,
    priority: 1,
    is_active: true,
    notes: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setFormData({
      service_type_id: 0,
      condition_type: "always",
      condition_value: {},
      applies_per: "order",
      max_per_order: null,
      priority: (rules?.length ?? 0) + 1,
      is_active: true,
      notes: "",
    });
  };

  const handleCreateRule = async () => {
    if (!formData.service_type_id) {
      toast.error("Service type is required");
      return;
    }

    setIsSaving(true);
    try {
      await createRule.mutateAsync({
        customer_id: Number(customerId),
        service_type_id: formData.service_type_id,
        condition_type: formData.condition_type,
        condition_value: formData.condition_value,
        applies_per: formData.applies_per,
        max_per_order: formData.max_per_order,
        priority: formData.priority,
        is_active: formData.is_active,
        notes: formData.notes || null,
      });

      toast.success("Rule condition created successfully");
      setCreateDialogOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to create rule condition");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRule = async () => {
    if (!selectedRule) return;

    setIsSaving(true);
    try {
      await updateRule.mutateAsync({
        customerId,
        ruleId: selectedRule.id,
        data: {
          condition_type: formData.condition_type,
          condition_value: formData.condition_value,
          applies_per: formData.applies_per,
          max_per_order: formData.max_per_order,
          priority: formData.priority,
          is_active: formData.is_active,
          notes: formData.notes || null,
        },
      });

      toast.success("Rule condition updated successfully");
      setEditDialogOpen(false);
      setSelectedRule(null);
      resetForm();
    } catch {
      toast.error("Failed to update rule condition");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = async () => {
    if (!selectedRule) return;

    try {
      await deleteRule.mutateAsync({
        customerId,
        ruleId: selectedRule.id,
      });

      toast.success("Rule deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedRule(null);
    } catch {
      toast.error("Failed to delete rule");
    }
  };

  const handleToggleRule = async (rule: BillingRuleWithDetails) => {
    try {
      await toggleRule.mutateAsync({
        customerId,
        ruleId: rule.id,
        isActive: !rule.is_active,
      });

      toast.success(rule.is_active ? "Rule deactivated" : "Rule activated");
    } catch {
      toast.error("Failed to toggle rule");
    }
  };

  const openEditDialog = (rule: BillingRuleWithDetails) => {
    setSelectedRule(rule);
    setFormData({
      service_type_id: rule.service_type_id,
      condition_type: rule.condition_type,
      condition_value: rule.condition_value ?? {},
      applies_per: rule.applies_per,
      max_per_order: rule.max_per_order,
      priority: rule.priority || 1,
      is_active: rule.is_active,
      notes: rule.notes || "",
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (rule: BillingRuleWithDetails) => {
    setSelectedRule(rule);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // API call would go here for general settings
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Billing configuration saved");
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  if (customerLoading) {
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
                <Button
                  onClick={() => {
                    resetForm();
                    setCreateDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rule
                </Button>
              </div>

              {rulesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : rules && rules.length > 0 ? (
                <div className="border rounded-lg divide-y">
                  {rules.map((rule) => (
                    <RuleItem
                      key={rule.id}
                      rule={rule}
                      onEdit={() => openEditDialog(rule)}
                      onDelete={() => openDeleteDialog(rule)}
                      onToggle={() => handleToggleRule(rule)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  <p>No custom rules configured</p>
                  <p className="text-sm">Add rules to customize billing for this customer</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Rule Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Billing Rule</DialogTitle>
            <DialogDescription>
              Add a new billing rule for {customer?.name}
            </DialogDescription>
          </DialogHeader>

          <RuleForm
            formData={formData}
            setFormData={setFormData}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateRule} disabled={isSaving}>
              {isSaving ? "Creating..." : "Create Rule Condition"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Rule Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Rule Condition</DialogTitle>
            <DialogDescription>
              Update the rule condition configuration
            </DialogDescription>
          </DialogHeader>

          <RuleForm
            formData={formData}
            setFormData={setFormData}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateRule} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Billing Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rule condition (#{selectedRule?.id})? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRule}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RuleItem({
  rule,
  onEdit,
  onDelete,
  onToggle,
}: {
  rule: BillingRuleWithDetails;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      className="flex items-center gap-4 p-4"
      data-testid="billing-rule"
    >
      <GripVertical
        className="h-4 w-4 text-muted-foreground cursor-grab"
        data-testid="drag-handle"
      />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${!rule.is_active ? "text-muted-foreground" : ""}`}>
            {rule.service_type_name ?? `Service #${rule.service_type_id}`}
          </span>
          <Badge variant="outline">{rule.condition_type}</Badge>
          <Badge variant="secondary">{rule.applies_per}</Badge>
          {!rule.is_active && (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
        {rule.notes && (
          <p className="text-sm text-muted-foreground">{rule.notes}</p>
        )}
      </div>
      <Switch
        checked={rule.is_active}
        onCheckedChange={onToggle}
        aria-label={rule.is_active ? "Deactivate rule" : "Activate rule"}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggle}>
            {rule.is_active ? (
              <>
                <PowerOff className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface ConditionFormData {
  service_type_id: number;
  condition_type: string;
  condition_value: Record<string, unknown>;
  applies_per: string;
  max_per_order: number | null;
  priority: number;
  is_active: boolean;
  notes: string;
}

// Condition type options
const CONDITION_TYPES = [
  { value: "always", label: "Always Apply" },
  { value: "order_type_matches", label: "Order Type Matches" },
  { value: "sku_matches", label: "SKU Matches" },
  { value: "qty_threshold", label: "Quantity Threshold" },
  { value: "package_count_threshold", label: "Package Count Threshold" },
  { value: "sku_category_count", label: "SKU Category Count" },
] as const;

const APPLIES_PER_OPTIONS = [
  { value: "order", label: "Per Order" },
  { value: "item", label: "Per Item" },
  { value: "package", label: "Per Package" },
  { value: "unit", label: "Per Unit" },
] as const;

function RuleForm({
  formData,
  setFormData,
}: {
  formData: ConditionFormData;
  setFormData: React.Dispatch<React.SetStateAction<ConditionFormData>>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="service-type-id">
            Service Type ID <span className="text-destructive">*</span>
          </Label>
          <Input
            id="service-type-id"
            type="number"
            value={formData.service_type_id || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, service_type_id: Number(e.target.value) }))}
            placeholder="Service type ID"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="condition-type">Condition Type</Label>
          <Select
            value={formData.condition_type}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, condition_type: value }))}
          >
            <SelectTrigger id="condition-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="applies-per">Applies Per</Label>
          <Select
            value={formData.applies_per}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, applies_per: value }))}
          >
            <SelectTrigger id="applies-per">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPLIES_PER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-per-order">Max Per Order</Label>
          <Input
            id="max-per-order"
            type="number"
            value={formData.max_per_order ?? ""}
            onChange={(e) => setFormData((prev) => ({
              ...prev,
              max_per_order: e.target.value ? Number(e.target.value) : null,
            }))}
            placeholder="No limit"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rule-notes">Notes</Label>
        <Textarea
          id="rule-notes"
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Optional notes about this rule condition..."
          rows={2}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="rule-active"
          checked={formData.is_active}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({ ...prev, is_active: checked }))
          }
        />
        <Label htmlFor="rule-active">Rule is active</Label>
      </div>
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
