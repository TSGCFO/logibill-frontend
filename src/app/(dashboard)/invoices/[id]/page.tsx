"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Download,
  Send,
  Mail,
  Printer,
  MoreHorizontal,
  Plus,
  Trash2,
  FileText,
  DollarSign,
  Ban,
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useInvoice,
  useInvoiceLineItems,
  useInvoicePdf,
  useSendInvoice,
  useDeleteLineItem,
  useVoidInvoice,
  useRecordPayment,
} from "@/hooks/use-invoices";
import {
  EmailPreviewDialog,
  VoidInvoiceDialog,
  RecordPaymentDialog,
  type PaymentData,
} from "@/components/invoices";
import { formatDate, formatCurrency } from "@/lib/format";
import { toast } from "sonner";

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  pending: "outline",
  sent: "default",
  paid: "default",
  overdue: "destructive",
  void: "secondary",
};

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Dialog state
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Query hooks
  const { data: invoice, isLoading, error } = useInvoice(id);
  const { data: lineItems, isLoading: lineItemsLoading } = useInvoiceLineItems(id);
  const { url: pdfUrl } = useInvoicePdf(id);

  // Mutation hooks
  const sendInvoice = useSendInvoice(id);
  const deleteLineItem = useDeleteLineItem(id);
  const voidInvoice = useVoidInvoice(id);
  const recordPayment = useRecordPayment(id);

  if (error) {
    notFound();
  }

  if (isLoading) {
    return <InvoiceDetailSkeleton />;
  }

  if (!invoice) {
    notFound();
  }

  // Calculate amount due (total - paid amount)
  const amountPaid = invoice.amount_paid ?? 0;
  const amountDue = invoice.total - amountPaid;

  const handleSendEmail = async (email: string, cc?: string) => {
    try {
      await sendInvoice.mutateAsync();
      toast.success("Invoice sent", {
        description: `Invoice ${invoice.invoice_number} has been sent to ${email}`,
      });
    } catch {
      toast.error("Failed to send invoice");
      throw new Error("Failed to send invoice");
    }
  };

  const handleVoid = async (reason: string) => {
    try {
      await voidInvoice.mutateAsync(reason);
      toast.success("Invoice voided", {
        description: `Invoice ${invoice.invoice_number} has been voided`,
      });
    } catch {
      toast.error("Failed to void invoice");
      throw new Error("Failed to void invoice");
    }
  };

  const handleRecordPayment = async (data: PaymentData) => {
    try {
      await recordPayment.mutateAsync(data);
      toast.success("Payment recorded", {
        description: `Payment of ${formatCurrency(data.amount)} has been recorded`,
      });
    } catch {
      toast.error("Failed to record payment");
      throw new Error("Failed to record payment");
    }
  };

  const handleDeleteLineItem = async (lineItemId: number) => {
    try {
      await deleteLineItem.mutateAsync(lineItemId);
      toast.success("Line item deleted");
    } catch {
      toast.error("Failed to delete line item");
    }
  };

  // Determine which actions are available based on status
  const canSend = invoice.status === "draft" || invoice.status === "pending";
  const canVoid = invoice.status !== "void" && invoice.status !== "paid";
  const canRecordPayment =
    invoice.status !== "void" &&
    invoice.status !== "paid" &&
    amountDue > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Invoice {invoice.invoice_number}
              </h1>
              <Badge variant={statusVariants[invoice.status] || "outline"}>
                {invoice.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              <Link
                href={`/customers/${invoice.customer_id}`}
                className="hover:underline"
              >
                {invoice.customer?.name || `Customer #${invoice.customer_id}`}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </a>
          </Button>
          {invoice.status === "draft" && (
            <Button variant="outline" asChild>
              <Link href={`/invoices/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          {canRecordPayment && (
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(true)}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )}
          {canSend && (
            <Button onClick={() => setEmailPreviewOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              Send Invoice
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canSend && (
                <DropdownMenuItem onClick={() => setEmailPreviewOpen(true)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Preview Email
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => window.print()}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </DropdownMenuItem>
              {canRecordPayment && (
                <DropdownMenuItem onClick={() => setPaymentDialogOpen(true)}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Record Payment
                </DropdownMenuItem>
              )}
              {canVoid && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setVoidDialogOpen(true)}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Void Invoice
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice Details */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>
                Items and charges on this invoice
              </CardDescription>
            </div>
            {invoice.status === "draft" && (
              <Button size="sm" asChild>
                <Link href={`/invoices/${id}/line-items/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  {invoice.status === "draft" && (
                    <TableHead className="w-[50px]"></TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItemsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : lineItems && lineItems.length > 0 ? (
                  lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.description}</p>
                          {item.reference_id && (
                            <p className="text-xs text-muted-foreground">
                              Ref: {item.reference_id}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.charge_type}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unit_price)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.amount)}
                      </TableCell>
                      {invoice.status === "draft" && (
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete line item?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove &quot;{item.description}&quot; from
                                  the invoice.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteLineItem(item.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={invoice.status === "draft" ? 6 : 5}
                      className="text-center py-8"
                    >
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No line items</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={invoice.status === "draft" ? 4 : 4}>
                    Subtotal
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(invoice.subtotal)}
                  </TableCell>
                  {invoice.status === "draft" && <TableCell></TableCell>}
                </TableRow>
                <TableRow>
                  <TableCell colSpan={invoice.status === "draft" ? 4 : 4}>
                    Tax
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(invoice.tax)}
                  </TableCell>
                  {invoice.status === "draft" && <TableCell></TableCell>}
                </TableRow>
                <TableRow>
                  <TableCell
                    colSpan={invoice.status === "draft" ? 4 : 4}
                    className="font-bold"
                  >
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {formatCurrency(invoice.total)}
                  </TableCell>
                  {invoice.status === "draft" && <TableCell></TableCell>}
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        {/* Invoice Info Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Number</span>
                <span className="font-medium">{invoice.invoice_number}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issue Date</span>
                <span>{formatDate(invoice.issue_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date</span>
                <span>{formatDate(invoice.due_date)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={statusVariants[invoice.status] || "outline"}>
                  {invoice.status}
                </Badge>
              </div>
              {invoice.sent_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sent</span>
                  <span>{formatDate(invoice.sent_at)}</span>
                </div>
              )}
              {invoice.paid_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span>{formatDate(invoice.paid_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/customers/${invoice.customer_id}`}
                className="font-medium hover:underline"
              >
                {invoice.customer?.name || `Customer #${invoice.customer_id}`}
              </Link>
              {invoice.customer?.email && (
                <p className="text-sm text-muted-foreground">
                  {invoice.customer.email}
                </p>
              )}
              {invoice.customer?.billing_email && (
                <p className="text-sm text-muted-foreground">
                  Billing: {invoice.customer.billing_email}
                </p>
              )}
            </CardContent>
          </Card>

          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Payment History Card - show if there are payments */}
          {amountPaid > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(amountPaid)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Due</span>
                  <span className={`font-medium ${amountDue > 0 ? "text-destructive" : "text-green-600"}`}>
                    {formatCurrency(amountDue)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Email Preview Dialog */}
      <EmailPreviewDialog
        invoiceId={id}
        customerEmail={invoice.customer?.billing_email || invoice.customer?.email || ""}
        customerName={invoice.customer?.name || `Customer #${invoice.customer_id}`}
        invoiceNumber={invoice.invoice_number}
        totalAmount={invoice.total}
        open={emailPreviewOpen}
        onOpenChange={setEmailPreviewOpen}
        onSend={handleSendEmail}
      />

      {/* Void Invoice Dialog */}
      <VoidInvoiceDialog
        invoiceId={id}
        invoiceNumber={invoice.invoice_number}
        open={voidDialogOpen}
        onOpenChange={setVoidDialogOpen}
        onVoid={handleVoid}
      />

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        invoiceId={id}
        invoiceNumber={invoice.invoice_number}
        totalAmount={invoice.total}
        amountDue={amountDue}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onRecord={handleRecordPayment}
      />
    </div>
  );
}

function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
