"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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

const orderTypeRuleSchema = z.object({
  orderType: z.string().min(1, "Please select an order type"),
  rate: z.preprocess(
    (val) => (val === '' || val === undefined ? 0 : Number(val)),
    z.number().min(0, "Rate must be a positive number")
  ),
  minimumCharge: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(0, "Minimum charge must be a positive number").optional()
  ),
  name: z.string().min(1, "Rule name is required"),
  description: z.string().optional(),
  rateUnit: z.enum(["per_order", "per_item", "per_package", "percentage"], {
    message: "Please select a rate unit",
  }),
});

type OrderTypeRuleFormValues = z.infer<typeof orderTypeRuleSchema>;

export interface OrderTypeRule {
  id?: number;
  orderType: string;
  rate: number;
  minimumCharge?: number;
  name: string;
  description?: string;
  rateUnit: "per_order" | "per_item" | "per_package" | "percentage";
}

interface OrderTypeRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: OrderTypeRule;
  onSave: (rule: OrderTypeRuleFormValues) => Promise<void>;
}

const ORDER_TYPES = [
  { value: "b2b", label: "B2B (Business to Business)" },
  { value: "b2c", label: "B2C (Business to Consumer)" },
  { value: "wholesale", label: "Wholesale" },
  { value: "retail", label: "Retail" },
  { value: "dropship", label: "Dropship" },
  { value: "subscription", label: "Subscription" },
  { value: "return", label: "Return" },
  { value: "exchange", label: "Exchange" },
  { value: "sample", label: "Sample" },
  { value: "other", label: "Other" },
];

const RATE_UNITS = [
  { value: "per_order", label: "Per Order" },
  { value: "per_item", label: "Per Item" },
  { value: "per_package", label: "Per Package" },
  { value: "percentage", label: "Percentage Discount" },
];

export function OrderTypeRuleDialog({
  open,
  onOpenChange,
  rule,
  onSave,
}: OrderTypeRuleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!rule?.id;

  const form = useForm<OrderTypeRuleFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(orderTypeRuleSchema) as any,
    defaultValues: {
      orderType: "",
      rate: 0,
      minimumCharge: 0,
      name: "",
      description: "",
      rateUnit: "per_order",
    },
  });

  useEffect(() => {
    if (rule) {
      form.reset({
        orderType: rule.orderType,
        rate: rule.rate,
        minimumCharge: rule.minimumCharge || 0,
        name: rule.name,
        description: rule.description || "",
        rateUnit: rule.rateUnit,
      });
    } else {
      form.reset({
        orderType: "",
        rate: 0,
        minimumCharge: 0,
        name: "",
        description: "",
        rateUnit: "per_order",
      });
    }
  }, [rule, form]);

  async function onSubmit(data: OrderTypeRuleFormValues) {
    setIsLoading(true);
    try {
      await onSave(data);
      form.reset();
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }

  const rateUnit = form.watch("rateUnit");
  const isPercentage = rateUnit === "percentage";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Order Type Rule" : "Create Order Type Rule"}
          </DialogTitle>
          <DialogDescription>
            Configure billing rules based on order type. Different order types
            can have different rates and minimum charges.
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
                    <Input placeholder="e.g., B2B Discount Rate" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="orderType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an order type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ORDER_TYPES.map((type) => (
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
              name="rateUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate Unit</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select rate unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RATE_UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How the rate should be applied to orders
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm">
                          {isPercentage ? "%" : "$"}
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
                    <FormDescription>
                      {isPercentage
                        ? "Percentage discount to apply"
                        : "Rate charged per unit"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minimumCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Charge</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="rounded-l-none"
                          placeholder="0.00"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Minimum charge per order (optional)
                    </FormDescription>
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
                      placeholder="Describe what this rule does..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
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
