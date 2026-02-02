"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, Send } from "lucide-react";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";

const emailFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  cc: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface EmailPreviewDialogProps {
  invoiceId: string | number;
  customerEmail: string;
  customerName: string;
  invoiceNumber: string;
  totalAmount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (email: string, cc?: string) => Promise<void>;
}

export function EmailPreviewDialog({
  invoiceId,
  customerEmail,
  customerName,
  invoiceNumber,
  totalAmount,
  open,
  onOpenChange,
  onSend,
}: EmailPreviewDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: customerEmail,
      cc: "",
    },
  });

  // Reset form when dialog opens with new data
  React.useEffect(() => {
    if (open) {
      form.reset({
        email: customerEmail,
        cc: "",
      });
    }
  }, [open, customerEmail, form]);

  const emailSubject = `Invoice ${invoiceNumber} from LogiBill`;

  const emailBodyPreview = `Dear ${customerName},

Please find attached invoice ${invoiceNumber} for ${formatCurrency(totalAmount)}.

A PDF of the invoice will be attached to this email.

If you have any questions regarding this invoice, please don't hesitate to contact us.

Thank you for your business.

Best regards,
LogiBill Team`;

  async function onSubmit(data: EmailFormValues) {
    setIsLoading(true);
    try {
      await onSend(data.email, data.cc || undefined);
      onOpenChange(false);
    } catch (error) {
      // Error handling is expected to be done by the parent component
      console.error("Failed to send invoice email:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Invoice Email
          </DialogTitle>
          <DialogDescription>
            Preview and send invoice {invoiceNumber} to {customerName}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="customer@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CC (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="cc@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Subject</FormLabel>
              <Input value={emailSubject} readOnly className="bg-muted" />
            </div>

            <Separator />

            <div className="space-y-2">
              <FormLabel>Email Preview</FormLabel>
              <Textarea
                value={emailBodyPreview}
                readOnly
                className="min-h-[200px] bg-muted text-sm font-mono"
              />
            </div>

            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <p className="text-muted-foreground">
                A PDF of invoice {invoiceNumber} will be attached to this email.
              </p>
            </div>

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
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Invoice
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
