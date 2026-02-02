"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const conditionSchema = z.object({
  field: z.string().min(1, "Please select a field"),
  operator: z.enum(
    ["equals", "not_equals", "greater_than", "less_than", "greater_or_equal", "less_or_equal", "contains", "starts_with", "ends_with"],
    { required_error: "Please select an operator" }
  ),
  value: z.string().min(1, "Value is required"),
});

const conditionalRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  description: z.string().optional(),
  conditions: z.array(conditionSchema).min(1, "At least one condition is required"),
  conditionLogic: z.enum(["and", "or"]).default("and"),
  rateType: z.enum(["percentage", "flat", "per_unit"], {
    required_error: "Please select a rate type",
  }),
  rate: z.coerce.number().min(0, "Rate must be a positive number"),
  rateAction: z.enum(["add", "subtract", "multiply", "set"], {
    required_error: "Please select a rate action",
  }),
});

type ConditionalRuleFormValues = z.infer<typeof conditionalRuleSchema>;
type ConditionValue = z.infer<typeof conditionSchema>;

export interface ConditionalRule {
  id?: number;
  name: string;
  description?: string;
  conditions: ConditionValue[];
  conditionLogic: "and" | "or";
  rateType: "percentage" | "flat" | "per_unit";
  rate: number;
  rateAction: "add" | "subtract" | "multiply" | "set";
}

interface ConditionalRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: ConditionalRule;
  onSave: (rule: ConditionalRuleFormValues) => Promise<void>;
}

const CONDITION_FIELDS = [
  { value: "order_total", label: "Order Total" },
  { value: "item_count", label: "Item Count" },
  { value: "package_count", label: "Package Count" },
  { value: "weight", label: "Total Weight" },
  { value: "monthly_orders", label: "Monthly Orders" },
  { value: "carrier", label: "Carrier" },
  { value: "service_type", label: "Service Type" },
  { value: "sku", label: "SKU" },
  { value: "product_category", label: "Product Category" },
  { value: "shipping_zone", label: "Shipping Zone" },
  { value: "day_of_week", label: "Day of Week" },
];

const OPERATORS = [
  { value: "equals", label: "Equals (=)" },
  { value: "not_equals", label: "Not Equals (!=)" },
  { value: "greater_than", label: "Greater Than (>)" },
  { value: "less_than", label: "Less Than (<)" },
  { value: "greater_or_equal", label: "Greater or Equal (>=)" },
  { value: "less_or_equal", label: "Less or Equal (<=)" },
  { value: "contains", label: "Contains" },
  { value: "starts_with", label: "Starts With" },
  { value: "ends_with", label: "Ends With" },
];

const RATE_TYPES = [
  { value: "percentage", label: "Percentage" },
  { value: "flat", label: "Flat Amount" },
  { value: "per_unit", label: "Per Unit" },
];

const RATE_ACTIONS = [
  { value: "add", label: "Add to Total" },
  { value: "subtract", label: "Subtract from Total (Discount)" },
  { value: "multiply", label: "Multiply Total" },
  { value: "set", label: "Set Fixed Amount" },
];

export function ConditionalRuleDialog({
  open,
  onOpenChange,
  rule,
  onSave,
}: ConditionalRuleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!rule?.id;

  const form = useForm<ConditionalRuleFormValues>({
    resolver: zodResolver(conditionalRuleSchema),
    defaultValues: {
      name: "",
      description: "",
      conditions: [{ field: "", operator: "equals", value: "" }],
      conditionLogic: "and",
      rateType: "flat",
      rate: 0,
      rateAction: "add",
    },
  });

  useEffect(() => {
    if (rule) {
      form.reset({
        name: rule.name,
        description: rule.description || "",
        conditions: rule.conditions.length > 0
          ? rule.conditions
          : [{ field: "", operator: "equals", value: "" }],
        conditionLogic: rule.conditionLogic,
        rateType: rule.rateType,
        rate: rule.rate,
        rateAction: rule.rateAction,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        conditions: [{ field: "", operator: "equals", value: "" }],
        conditionLogic: "and",
        rateType: "flat",
        rate: 0,
        rateAction: "add",
      });
    }
  }, [rule, form]);

  async function onSubmit(data: ConditionalRuleFormValues) {
    setIsLoading(true);
    try {
      await onSave(data);
      form.reset();
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }

  const conditions = form.watch("conditions");
  const rateType = form.watch("rateType");

  const addCondition = () => {
    const currentConditions = form.getValues("conditions");
    form.setValue("conditions", [
      ...currentConditions,
      { field: "", operator: "equals" as const, value: "" },
    ]);
  };

  const removeCondition = (index: number) => {
    const currentConditions = form.getValues("conditions");
    if (currentConditions.length > 1) {
      form.setValue(
        "conditions",
        currentConditions.filter((_, i) => i !== index)
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Conditional Rule" : "Create Conditional Rule"}
          </DialogTitle>
          <DialogDescription>
            Create advanced billing rules with multiple conditions. The rule
            will be applied when all (AND) or any (OR) conditions are met.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., High Volume Discount"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditions Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Conditions</FormLabel>
                <FormField
                  control={form.control}
                  name="conditionLogic"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="and">Match ALL</SelectItem>
                        <SelectItem value="or">Match ANY</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2 border rounded-lg p-3">
                {conditions.map((_, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="grid grid-cols-3 gap-2 flex-1">
                      <FormField
                        control={form.control}
                        name={`conditions.${index}.field`}
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Field" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CONDITION_FIELDS.map((f) => (
                                  <SelectItem key={f.value} value={f.value}>
                                    {f.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`conditions.${index}.operator`}
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Operator" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {OPERATORS.map((op) => (
                                  <SelectItem key={op.value} value={op.value}>
                                    {op.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`conditions.${index}.value`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Value" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCondition(index)}
                      disabled={conditions.length <= 1}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCondition}
                  className="w-full mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Condition
                </Button>
              </div>
            </div>

            {/* Rate Configuration */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="rateAction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RATE_ACTIONS.map((action) => (
                          <SelectItem key={action.value} value={action.value}>
                            {action.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rateType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RATE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate Value</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm">
                          {rateType === "percentage" ? "%" : "$"}
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="rounded-l-none"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this rule does and when it should apply..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add notes to help understand this rule later
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Rule"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
