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

const carrierRuleSchema = z.object({
  carrier: z.string().min(1, "Please select a carrier"),
  rateType: z.enum(["percentage", "flat", "per_package"], {
    message: "Please select a rate type",
  }),
  rateValue: z.preprocess(
    (val) => (val === '' || val === undefined ? 0 : Number(val)),
    z.number().min(0, "Rate value must be a positive number")
  ),
  conditions: z.string().optional(),
  name: z.string().min(1, "Rule name is required"),
  description: z.string().optional(),
});

type CarrierRuleFormValues = z.infer<typeof carrierRuleSchema>;

export interface CarrierRule {
  id?: number;
  carrier: string;
  rateType: "percentage" | "flat" | "per_package";
  rateValue: number;
  conditions?: string;
  name: string;
  description?: string;
}

interface CarrierRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: CarrierRule;
  onSave: (rule: CarrierRuleFormValues) => Promise<void>;
}

const CARRIERS = [
  { value: "fedex", label: "FedEx" },
  { value: "ups", label: "UPS" },
  { value: "usps", label: "USPS" },
  { value: "dhl", label: "DHL" },
  { value: "amazon", label: "Amazon Logistics" },
  { value: "ontrac", label: "OnTrac" },
  { value: "other", label: "Other" },
];

const RATE_TYPES = [
  { value: "percentage", label: "Percentage Markup" },
  { value: "flat", label: "Flat Rate" },
  { value: "per_package", label: "Per Package" },
];

export function CarrierRuleDialog({
  open,
  onOpenChange,
  rule,
  onSave,
}: CarrierRuleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!rule?.id;

  const form = useForm<CarrierRuleFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(carrierRuleSchema) as any,
    defaultValues: {
      carrier: "",
      rateType: "percentage",
      rateValue: 0,
      conditions: "",
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (rule) {
      form.reset({
        carrier: rule.carrier,
        rateType: rule.rateType,
        rateValue: rule.rateValue,
        conditions: rule.conditions || "",
        name: rule.name,
        description: rule.description || "",
      });
    } else {
      form.reset({
        carrier: "",
        rateType: "percentage",
        rateValue: 0,
        conditions: "",
        name: "",
        description: "",
      });
    }
  }, [rule, form]);

  async function onSubmit(data: CarrierRuleFormValues) {
    setIsLoading(true);
    try {
      await onSave(data);
      form.reset();
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Carrier Rule" : "Create Carrier Rule"}
          </DialogTitle>
          <DialogDescription>
            Configure billing rules based on shipping carrier. Rules will be
            applied when orders are shipped with the selected carrier.
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
                    <Input placeholder="e.g., FedEx Handling Fee" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="carrier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carrier</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a carrier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CARRIERS.map((carrier) => (
                        <SelectItem key={carrier.value} value={carrier.value}>
                          {carrier.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select rate type" />
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
                name="rateValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate Value</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm">
                          {form.watch("rateType") === "percentage" ? "%" : "$"}
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
              name="conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Conditions (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., weight > 10 lbs, service = 'express'"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional conditions to further filter when this rule applies
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
