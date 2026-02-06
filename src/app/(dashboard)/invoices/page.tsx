"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Send,
  Download,
  Filter,
  FileStack,
  Mail,
  CheckCircle,
  Ban,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DataTable, type BulkAction } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import {
  useInvoices,
  useInvoicePdf,
  useSendInvoice,
  useBulkSendInvoices,
  useUpdateInvoice,
  useInvalidateInvoices,
} from "@/hooks/use-invoices";
import { useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import { formatDate, formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import type { Invoice } from "@/types";

function InvoiceActions({ invoice }: { invoice: Invoice }) {
  const { url: pdfUrl } = useInvoicePdf(invoice.id);
  const sendInvoice = useSendInvoice(invoice.id);

  const handleSend = async () => {
    try {
      await sendInvoice.mutateAsync();
      toast.success("Invoice sent", {
        description: `Invoice ${invoice.invoice_number} has been sent`,
      });
    } catch {
      toast.error("Failed to send invoice");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/invoices/${invoice.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/invoices/${invoice.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </a>
        </DropdownMenuItem>
        {invoice.status !== "sent" && invoice.status !== "paid" && (
          <DropdownMenuItem onClick={handleSend}>
            <Send className="mr-2 h-4 w-4" />
            Send Invoice
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const columns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "invoice_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Invoice #" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/invoices/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.invoice_number}
      </Link>
    ),
  },
  {
    accessorKey: "customer",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/customers/${row.original.customer_id}`}
        className="hover:underline"
      >
        {row.original.customer?.name || `Customer #${row.original.customer_id}`}
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        draft: "secondary",
        pending: "outline",
        sent: "default",
        paid: "default",
        overdue: "destructive",
        void: "secondary",
      };
      return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
    },
  },
  {
    accessorKey: "issue_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Issue Date" />
    ),
    cell: ({ row }) => formatDate(row.original.issue_date),
  },
  {
    accessorKey: "due_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => formatDate(row.original.due_date),
  },
  {
    accessorKey: "subtotal",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subtotal" />
    ),
    cell: ({ row }) => formatCurrency(row.original.subtotal),
  },
  {
    accessorKey: "tax",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tax" />
    ),
    cell: ({ row }) => formatCurrency(row.original.tax),
  },
  {
    accessorKey: "total",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{formatCurrency(row.original.total)}</span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <InvoiceActions invoice={row.original} />,
  },
];

export default function InvoicesPage() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [filters, setFilters] = useState<{
    status?: string;
  }>({});

  const { data, isLoading } = useInvoices({
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    ...filters,
  });

  const bulkSend = useBulkSendInvoices();
  const queryClient = useQueryClient();
  const { invalidateLists } = useInvalidateInvoices();

  const handleBulkSend = useCallback(
    async (invoices: Invoice[]) => {
      const sendable = invoices.filter(
        (inv) => inv.status !== "sent" && inv.status !== "paid" && inv.status !== "void"
      );
      if (sendable.length === 0) {
        toast.error("No eligible invoices to send", {
          description: "Selected invoices are already sent, paid, or void.",
        });
        return;
      }
      toast.info(`Sending ${sendable.length} invoice(s)...`);
      try {
        const result = await bulkSend.mutateAsync({
          invoice_ids: sendable.map((inv) => inv.id),
        });
        toast.success(`${result.sent} invoice(s) sent successfully`, {
          description: result.errors.length > 0
            ? `${result.errors.length} error(s) occurred`
            : undefined,
        });
      } catch {
        toast.error("Failed to send invoices");
      }
    },
    [bulkSend]
  );

  const handleBulkMarkPaid = useCallback(
    async (invoices: Invoice[]) => {
      const eligible = invoices.filter(
        (inv) => inv.status === "sent" || inv.status === "overdue"
      );
      if (eligible.length === 0) {
        toast.error("No eligible invoices", {
          description: "Only sent or overdue invoices can be marked as paid.",
        });
        return;
      }
      toast.info(`Marking ${eligible.length} invoice(s) as paid...`);
      let successCount = 0;
      let errorCount = 0;
      for (const inv of eligible) {
        try {
          await api.put(endpoints.invoices.detail(inv.id), { status: "paid" });
          successCount++;
        } catch {
          errorCount++;
        }
      }
      invalidateLists();
      toast.success(`${successCount} invoice(s) marked as paid`, {
        description: errorCount > 0 ? `${errorCount} failed` : undefined,
      });
    },
    [invalidateLists]
  );

  const handleBulkVoid = useCallback(
    async (invoices: Invoice[]) => {
      const eligible = invoices.filter(
        (inv) => inv.status !== "void" && inv.status !== "paid"
      );
      if (eligible.length === 0) {
        toast.error("No eligible invoices", {
          description: "Paid or already voided invoices cannot be voided.",
        });
        return;
      }
      toast.info(`Voiding ${eligible.length} invoice(s)...`);
      let successCount = 0;
      let errorCount = 0;
      for (const inv of eligible) {
        try {
          await api.post(`${endpoints.invoices.detail(inv.id)}/void`, {
            reason: "Bulk void action",
          });
          successCount++;
        } catch {
          errorCount++;
        }
      }
      invalidateLists();
      toast.success(`${successCount} invoice(s) voided`, {
        description: errorCount > 0 ? `${errorCount} failed` : undefined,
      });
    },
    [invalidateLists]
  );

  const bulkActions: BulkAction<Invoice>[] = useMemo(
    () => [
      {
        label: "Send Selected",
        icon: Send,
        onClick: handleBulkSend,
      },
      {
        label: "Mark as Paid",
        icon: CheckCircle,
        onClick: handleBulkMarkPaid,
      },
      {
        label: "Void Selected",
        icon: Ban,
        onClick: handleBulkVoid,
        variant: "destructive" as const,
      },
    ],
    [handleBulkSend, handleBulkMarkPaid, handleBulkVoid]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Create and manage customer invoices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={filters.status || "all"}
                    onValueChange={(value) =>
                      setFilters((f) => ({
                        ...f,
                        status: value === "all" ? undefined : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="void">Void</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setFilters({})}
                >
                  Clear Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" asChild>
            <Link href="/invoices/bulk-create">
              <FileStack className="mr-2 h-4 w-4" />
              Bulk Create
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/invoices/bulk-send">
              <Mail className="mr-2 h-4 w-4" />
              Bulk Send
            </Link>
          </Button>
          <Button asChild>
            <Link href="/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        searchKey="invoice_number"
        searchPlaceholder="Search invoices..."
        isLoading={isLoading}
        pageCount={data?.meta?.total_pages ?? 0}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={setPagination}
        manualPagination
        enableRowSelection
        bulkActions={bulkActions}
        exportFilename="invoices-export"
        exportColumns={[
          { key: "invoice_number", label: "Invoice #" },
          { key: "customer.name", label: "Customer" },
          { key: "status", label: "Status" },
          { key: "issue_date", label: "Issue Date" },
          { key: "due_date", label: "Due Date" },
          { key: "subtotal", label: "Subtotal" },
          { key: "tax", label: "Tax" },
          { key: "total", label: "Total" },
        ]}
      />
    </div>
  );
}
