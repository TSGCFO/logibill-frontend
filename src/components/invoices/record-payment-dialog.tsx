"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, DollarSign, Loader2 } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAYMENT_METHODS = [
  { value: "check", label: "Check" },
  { value: "ach", label: "ACH" },
  { value: "wire", label: "Wire Transfer" },
  { value: "credit_card", label: "Credit Card" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
] as const;

export interface PaymentData {
  amount: number;
  payment_date: string;
  payment_method?: string;
  reference?: string;
  notes?: string;
}

interface RecordPaymentDialogProps {
  invoiceId: string | number;
  invoiceNumber: string;
  totalAmount: number;
  amountDue: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecord: (data: PaymentData) => Promise<void>;
}

export function RecordPaymentDialog({
  invoiceId,
  invoiceNumber,
  totalAmount,
  amountDue,
  open,
  onOpenChange,
  onRecord,
}: RecordPaymentDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const recordPaymentSchema = z.object({
    amount: z.coerce
      .number()
      .min(0.01, "Amount must be greater than 0")
      .max(amountDue, `Amount cannot exceed the amount due (${formatCurrency(amountDue)})`),
    payment_date: z.date({
      required_error: "Please select a payment date",
    }),
    payment_method: z.string().optional(),
    reference: z.string().max(100, "Reference must be less than 100 characters").optional(),
    notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
  });

  type RecordPaymentFormValues = z.infer<typeof recordPaymentSchema>;

  const form = useForm<RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      amount: amountDue,
      payment_date: new Date(),
      payment_method: "",
      reference: "",
      notes: "",
    },
  });

  // Reset form when dialog opens with new data
  React.useEffect(() => {
    if (open) {
      form.reset({
        amount: amountDue,
        payment_date: new Date(),
        payment_method: "",
        reference: "",
        notes: "",
      });
    }
  }, [open, amountDue, form]);

  async function onSubmit(data: RecordPaymentFormValues) {
    setIsLoading(true);
    try {
      const paymentData: PaymentData = {
        amount: data.amount,
        payment_date: format(data.payment_date, "yyyy-MM-dd"),
        payment_method: data.payment_method || undefined,
        reference: data.reference || undefined,
        notes: data.notes || undefined,
      };
      await onRecord(paymentData);
      onOpenChange(false);
    } catch (error) {
      // Error handling is expected to be done by the parent component
      console.error("Failed to record payment:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const watchedAmount = form.watch("amount");
  const remainingAfterPayment = amountDue - (watchedAmount || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Record a payment for invoice {invoiceNumber}.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-muted p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Invoice Total:</span>
            <span className="font-medium">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount Due:</span>
            <span className="font-medium text-destructive">
              {formatCurrency(amountDue)}
            </span>
          </div>
          {watchedAmount > 0 && remainingAfterPayment >= 0 && (
            <div className="flex justify-between text-sm border-t pt-2 mt-2">
              <span className="text-muted-foreground">After Payment:</span>
              <span
                className={cn(
                  "font-medium",
                  remainingAfterPayment === 0
                    ? "text-green-600"
                    : "text-yellow-600"
                )}
              >
                {formatCurrency(remainingAfterPayment)}
              </span>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Payment Amount <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={amountDue}
                          className="pl-7"
                          placeholder="0.00"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Payment Date <span className="text-destructive">*</span>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "MMM d, yyyy")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
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
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Check #1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this payment..."
                      className="resize-none min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Any additional information about this payment.
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
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  "Record Payment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
