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
  type CreateBillingRuleData,
  type UpdateBillingRuleData,
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

interface Condition {
  field: string;
  operator: string;
  value: string;
}

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

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rule_type: "order_type" as string,
    conditions: [] as Condition[],
    actions: {} as Record<string, unknown>,
    priority: 1,
    is_active: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      rule_type: "order_type",
      conditions: [],
      actions: {},
      priority: (rules?.length ?? 0) + 1,
      is_active: true,
    });
  };

  const handleCreateRule = async () => {
    if (!formData.name.trim()) {
      toast.error("Rule name is required");
      return;
    }

    setIsSaving(true);
    try {
      const conditionsObj = formData.conditions.reduce((acc, cond) => {
        acc[`${cond.field}_${cond.operator}`] = cond.value;
        return acc;
      }, {} as Record<string, unknown>);

      await createRule.mutateAsync({
        customer_id: Number(customerId),
        rule_type: formData.rule_type as CreateBillingRuleData["rule_type"],
        name: formData.name,
        description: formData.description || null,
        conditions: conditionsObj,
        actions: formData.actions,
        priority: formData.priority,
        is_active: formData.is_active,
      });

      toast.success("Rule created successfully");
      setCreateDialogOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to create rule");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRule = async () => {
    if (!selectedRule || !formData.name.trim()) {
      toast.error("Rule name is required");
      return;
    }

    setIsSaving(true);
    try {
      const conditionsObj = formData.conditions.reduce((acc, cond) => {
        acc[`${cond.field}_${cond.operator}`] = cond.value;
        return acc;
      }, {} as Record<string, unknown>);

      await updateRule.mutateAsync({
        customerId,
        ruleId: selectedRule.id,
        data: {
          rule_type: formData.rule_type as UpdateBillingRuleData["rule_type"],
          name: formData.name,
          description: formData.description || null,
          conditions: conditionsObj,
          actions: formData.actions,
          priority: formData.priority,
          is_active: formData.is_active,
        },
      });

      toast.success("Rule updated successfully");
      setEditDialogOpen(false);
      setSelectedRule(null);
      resetForm();
    } catch {
      toast.error("Failed to update rule");
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
      name: rule.name,
      description: rule.description || "",
      rule_type: rule.rule_type,
      conditions: [], // Parse from rule.conditions if needed
      actions: rule.actions || {},
      priority: rule.priority || 1,
      is_active: rule.is_active,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (rule: BillingRuleWithDetails) => {
    setSelectedRule(rule);
    setDeleteDialogOpen(true);
  };

  const addCondition = () => {
    setFormData((prev) => ({
      ...prev,
      conditions: [...prev.conditions, { field: "order_type", operator: "eq", value: "" }],
    }));
  };

  const removeCondition = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const updateCondition = (index: number, field: keyof Condition, value: string) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.map((cond, i) =>
        i === index ? { ...cond, [field]: value } : cond
      ),
    }));
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
            addCondition={addCondition}
            removeCondition={removeCondition}
            updateCondition={updateCondition}
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
              {isSaving ? "Creating..." : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Rule Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Billing Rule</DialogTitle>
            <DialogDescription>
              Update the billing rule configuration
            </DialogDescription>
          </DialogHeader>

          <RuleForm
            formData={formData}
            setFormData={setFormData}
            addCondition={addCondition}
            removeCondition={removeCondition}
            updateCondition={updateCondition}
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
              Are you sure you want to delete &quot;{selectedRule?.name}&quot;? This action
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
  const ruleTypeLabel =
    RULE_TYPES.find((t) => t.value === rule.rule_type)?.label || rule.rule_type;

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
            {rule.name}
          </span>
          <Badge variant="outline">{ruleTypeLabel}</Badge>
          {!rule.is_active && (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
        {rule.description && (
          <p className="text-sm text-muted-foreground">{rule.description}</p>
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

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface FormData {
  name: string;
  description: string;
  rule_type: string;
  conditions: Condition[];
  actions: Record<string, unknown>;
  priority: number;
  is_active: boolean;
}

function RuleForm({
  formData,
  setFormData,
  addCondition,
  removeCondition,
  updateCondition,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  addCondition: () => void;
  removeCondition: (index: number) => void;
  updateCondition: (index: number, field: keyof Condition, value: string) => void;
}) {
  const isConditional = formData.rule_type === "conditional";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rule-name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="rule-name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Rule name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rule-type">Rule Type</Label>
          <Select
            value={formData.rule_type}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, rule_type: value }))}
          >
            <SelectTrigger id="rule-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RULE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rule-description">Description</Label>
        <Textarea
          id="rule-description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Describe what this rule does..."
          rows={2}
        />
      </div>

      {isConditional && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Conditions</Label>
            <Button type="button" variant="outline" size="sm" onClick={addCondition}>
              <Plus className="mr-2 h-4 w-4" />
              Add Condition
            </Button>
          </div>

          {formData.conditions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
              No conditions added. Click &quot;Add Condition&quot; to define rule criteria.
            </p>
          ) : (
            <div className="space-y-2">
              {formData.conditions.map((condition, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 border rounded-lg"
                  data-testid="condition-row"
                >
                  {index > 0 && (
                    <Badge variant="secondary" className="mr-2">
                      AND
                    </Badge>
                  )}
                  <Select
                    value={condition.field}
                    onValueChange={(value) => updateCondition(index, "field", value)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_FIELDS.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(index, "operator", value)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={condition.value}
                    onChange={(e) => updateCondition(index, "value", e.target.value)}
                    placeholder="Value"
                    className="flex-1"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCondition(index)}
                    aria-label="Remove condition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
