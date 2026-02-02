"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const voidInvoiceSchema = z.object({
  reason: z
    .string()
    .min(10, "Please provide a reason with at least 10 characters")
    .max(500, "Reason must be less than 500 characters"),
});

type VoidInvoiceFormValues = z.infer<typeof voidInvoiceSchema>;

interface VoidInvoiceDialogProps {
  invoiceId: string | number;
  invoiceNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVoid: (reason: string) => Promise<void>;
}

export function VoidInvoiceDialog({
  invoiceId,
  invoiceNumber,
  open,
  onOpenChange,
  onVoid,
}: VoidInvoiceDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<VoidInvoiceFormValues>({
    resolver: zodResolver(voidInvoiceSchema),
    defaultValues: {
      reason: "",
    },
  });

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      form.reset({
        reason: "",
      });
    }
  }, [open, form]);

  async function onSubmit(data: VoidInvoiceFormValues) {
    setIsLoading(true);
    try {
      await onVoid(data.reason);
      onOpenChange(false);
    } catch (error) {
      // Error handling is expected to be done by the parent component
      console.error("Failed to void invoice:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Void Invoice
          </DialogTitle>
          <DialogDescription>
            You are about to void invoice {invoiceNumber}. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Voiding an invoice will permanently mark it as void. The invoice
            will remain in the system for record-keeping but cannot be used for
            payment collection. Any associated payments should be handled
            separately.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Reason for Voiding <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the reason for voiding this invoice..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Please provide a clear reason for voiding this invoice. This
                    will be recorded in the audit log.
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
              <Button type="submit" variant="destructive" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Voiding...
                  </>
                ) : (
                  "Void Invoice"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
