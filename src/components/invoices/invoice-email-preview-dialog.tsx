"use client";

import * as React from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Invoice } from "@/types";

interface InvoiceEmailPreviewDialogProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: () => Promise<void> | void;
}

export function InvoiceEmailPreviewDialog({
  invoice,
  open,
  onOpenChange,
  onSend,
}: InvoiceEmailPreviewDialogProps) {
  const [isSending, setIsSending] = React.useState(false);

  const recipientEmail =
    invoice.customer?.billing_email || invoice.customer?.email || "";
  const recipientName = invoice.customer?.name || "Customer";

  const emailSubject = `Invoice ${invoice.invoice_number} from LogiBill`;

  const emailBody = `Dear ${recipientName},

Please find attached invoice ${invoice.invoice_number} for ${formatCurrency(invoice.total)}.

Invoice Details:
- Invoice Number: ${invoice.invoice_number}
- Issue Date: ${formatDate(invoice.issue_date)}
- Due Date: ${formatDate(invoice.due_date)}
- Amount Due: ${formatCurrency(invoice.total)}

Please remit payment by the due date to avoid any late fees.

If you have any questions regarding this invoice, please don't hesitate to contact us.

Thank you for your business.

Best regards,
LogiBill Team`;

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSend();
      onOpenChange(false);
    } catch (error) {
      // Error handling is expected to be done by the parent component
      console.error("Failed to send invoice:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Invoice Email
          </DialogTitle>
          <DialogDescription>
            Preview and send invoice {invoice.invoice_number} to{" "}
            {recipientName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Input
              id="recipient"
              value={recipientEmail}
              readOnly
              className="bg-muted"
            />
            {!recipientEmail && (
              <p className="text-xs text-destructive">
                No email address found for this customer. Please update the
                customer profile.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={emailSubject}
              readOnly
              className="bg-muted"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="body">Email Body</Label>
            <Textarea
              id="body"
              value={emailBody}
              readOnly
              className="min-h-[200px] bg-muted text-sm"
            />
          </div>

          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <p className="text-muted-foreground">
              A PDF of the invoice will be attached to this email.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !recipientEmail}
          >
            {isSending ? (
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
      </DialogContent>
    </Dialog>
  );
}
