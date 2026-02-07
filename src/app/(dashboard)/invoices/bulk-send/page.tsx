"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Send,
  Mail,
  Check,
  AlertCircle,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";
import type { Invoice } from "@/types";

export default function BulkSendInvoicesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sendProgress, setSendProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ["invoices", "pending-send"],
    queryFn: async () => {
      const response = await api.get<Invoice[]>(endpoints.invoices.list, {
        status: "pending_approval",
        per_page: 100,
      });
      return response.data ?? [];
    },
  });

  const pendingInvoices = invoicesData?.filter(
    (inv) =>
      !inv.sent_at &&
      (searchQuery === "" ||
        inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sendInvoices = useMutation({
    mutationFn: async (invoiceIds: string[]) => {
      setIsSending(true);
      setSendProgress(0);

      // Simulate sending with progress
      for (let i = 0; i < invoiceIds.length; i++) {
        await api.post(endpoints.invoices.send(invoiceIds[i]));
        setSendProgress(Math.round(((i + 1) / invoiceIds.length) * 100));
      }

      return { sent_count: invoiceIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(`Sent ${data.sent_count} invoices successfully`);
      setSelectedInvoices([]);
      setSendProgress(0);
      setIsSending(false);
    },
    onError: () => {
      toast.error("Failed to send some invoices");
      setSendProgress(0);
      setIsSending(false);
    },
  });

  const toggleInvoice = (invoiceId: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const toggleAll = () => {
    if (selectedInvoices.length === pendingInvoices?.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(pendingInvoices?.map((inv) => String(inv.id)) ?? []);
    }
  };

  const handleSend = () => {
    if (selectedInvoices.length === 0) {
      toast.error("Please select at least one invoice");
      return;
    }
    sendInvoices.mutate(selectedInvoices);
  };

  const selectedTotal =
    pendingInvoices
      ?.filter((inv) => selectedInvoices.includes(String(inv.id)))
      .reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Send Invoices</h1>
          <p className="text-muted-foreground">
            Send multiple invoices via email at once
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Select Invoices</CardTitle>
            <CardDescription>
              Choose invoices to send. Only unsent invoices are shown.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search by invoice number or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : pendingInvoices && pendingInvoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          pendingInvoices.length > 0 &&
                          selectedInvoices.length === pendingInvoices.length
                        }
                        onCheckedChange={toggleAll}
                        disabled={isSending}
                      />
                    </TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className={
                        selectedInvoices.includes(String(invoice.id)) ? "bg-primary/5" : ""
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedInvoices.includes(String(invoice.id))}
                          onCheckedChange={() => toggleInvoice(String(invoice.id))}
                          disabled={isSending}
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="font-medium hover:underline"
                        >
                          {invoice.invoice_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.customer?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {invoice.customer?.external_id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(invoice.customer as Record<string, unknown>)?.email ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {String((invoice.customer as Record<string, unknown>)?.email)}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            No email
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.total_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Pending Approval</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No pending invoices to send</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary & Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Send Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Selected Invoices</span>
              <span className="font-medium">{selectedInvoices.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Recipients</span>
              <span className="font-medium">
                {
                  pendingInvoices?.filter(
                    (inv) =>
                      selectedInvoices.includes(String(inv.id)) && (inv.customer as Record<string, unknown>)?.email
                  ).length ?? 0
                }
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between font-medium">
                <span>Total Amount</span>
                <span className="text-lg">{formatCurrency(selectedTotal)}</span>
              </div>
            </div>

            {isSending && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sending...</span>
                  <span>{sendProgress}%</span>
                </div>
                <Progress value={sendProgress} />
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleSend}
              disabled={selectedInvoices.length === 0 || isSending}
            >
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send {selectedInvoices.length} Invoice
              {selectedInvoices.length !== 1 ? "s" : ""}
            </Button>

            {pendingInvoices?.some(
              (inv) => selectedInvoices.includes(String(inv.id)) && !(inv.customer as Record<string, unknown>)?.email
            ) && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Some selected customers have no email address
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
