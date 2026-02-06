"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Download,
  CheckCircle2,
  Trash2,
  DollarSign,
  FileText,
  AlertCircle,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";
import { useCustomers } from "@/hooks/use-customers";
import {
  useBillingAudit,
  useApproveBillingCharge,
  useDeleteBillingCharge,
} from "@/hooks/use-billing";
import type { BillingAuditParams } from "@/hooks/use-billing";
import { formatCurrency, formatDate } from "@/lib/format";

export default function BillingAuditPage() {
  // Filter state
  const [page, setPage] = useState(1);
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Build query params
  const queryParams: BillingAuditParams = useMemo(
    () => ({
      page,
      per_page: 20,
      customer_id: customerFilter !== "all" ? customerFilter : undefined,
      service_type: serviceTypeFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    }),
    [page, customerFilter, serviceTypeFilter, dateFrom, dateTo, sortBy, sortOrder]
  );

  // Data fetching
  const { data: customersData } = useCustomers();
  const customers = customersData?.data ?? [];

  const { data: auditData, isLoading, isError } = useBillingAudit(queryParams);
  const charges = auditData?.data ?? [];
  const meta = auditData?.meta;

  // Mutations
  const approveMutation = useApproveBillingCharge();
  const deleteMutation = useDeleteBillingCharge();

  // Summary stats
  const totalCharges = meta?.total ?? 0;
  const totalAmount = useMemo(
    () => charges.reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0),
    [charges]
  );
  const pendingCount = useMemo(
    () => charges.filter((c) => c.status === "accrued").length,
    [charges]
  );

  // Handlers
  const handleApprove = async (id: number) => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success("Charge Approved", {
        description: "The charge has been approved for invoicing.",
      });
    } catch {
      toast.error("Failed to approve charge. Please try again.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Charge Voided", {
        description: "The charge has been voided successfully.",
      });
    } catch {
      toast.error("Failed to void charge. Please try again.");
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleFilterChange = () => {
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accrued":
        return <Badge variant="outline">Accrued</Badge>;
      case "period_assigned":
        return <Badge variant="default">Approved</Badge>;
      case "period_locked":
        return <Badge variant="secondary">Locked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSortIndicator = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? " \u2191" : " \u2193";
  };

  const totalPages = meta?.total_pages ?? 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Audit</h1>
          <p className="text-muted-foreground">
            Review and approve generated charges before invoicing
          </p>
        </div>
        <Button variant="outline" disabled>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Charges</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCharges}</div>
            <p className="text-xs text-muted-foreground">
              Uninvoiced charges pending review
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Sum of charges on current page
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Charges awaiting approval on this page
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <Select
              value={customerFilter}
              onValueChange={(value) => {
                setCustomerFilter(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={String(customer.id)}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Service type..."
                className="pl-8"
                value={serviceTypeFilter}
                onChange={(e) => {
                  setServiceTypeFilter(e.target.value);
                  handleFilterChange();
                }}
              />
            </div>
            <Input
              type="date"
              placeholder="From date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                handleFilterChange();
              }}
            />
            <Input
              type="date"
              placeholder="To date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                handleFilterChange();
              }}
            />
            <Button
              variant="outline"
              onClick={() => {
                setCustomerFilter("all");
                setServiceTypeFilter("");
                setDateFrom("");
                setDateTo("");
                setSortBy("created_at");
                setSortOrder("desc");
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charges Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Charges</CardTitle>
          <CardDescription>
            {totalCharges} total charge{totalCharges !== 1 ? "s" : ""} found
            {meta && totalPages > 1
              ? ` - Page ${meta.page} of ${totalPages}`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
              <p className="text-muted-foreground">
                Failed to load audit charges. Please try again.
              </p>
            </div>
          ) : charges.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("customer_name")}
                    >
                      Customer{getSortIndicator("customer_name")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("service_type_name")}
                    >
                      Service Type{getSortIndicator("service_type_name")}
                    </TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead
                      className="text-right cursor-pointer"
                      onClick={() => handleSort("quantity")}
                    >
                      Qty{getSortIndicator("quantity")}
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer"
                      onClick={() => handleSort("rate")}
                    >
                      Rate{getSortIndicator("rate")}
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer"
                      onClick={() => handleSort("amount")}
                    >
                      Amount{getSortIndicator("amount")}
                    </TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("service_date")}
                    >
                      Date{getSortIndicator("service_date")}
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {charges.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell className="font-medium">
                        {charge.customer_name || "-"}
                      </TableCell>
                      <TableCell>{charge.service_type_name || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {charge.description || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {parseFloat(charge.quantity || "0").toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(parseFloat(charge.rate || "0"))}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(parseFloat(charge.amount || "0"))}
                      </TableCell>
                      <TableCell>
                        {charge.order_id ? (
                          <span className="text-sm text-muted-foreground">
                            #{charge.order_id}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {charge.service_date
                          ? formatDate(charge.service_date)
                          : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(charge.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {charge.status === "accrued" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(charge.id)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="sr-only">Approve</span>
                            </Button>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={
                                  charge.status === "period_locked" ||
                                  deleteMutation.isPending
                                }
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Void This Charge?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will void charge #{charge.id} for{" "}
                                  {formatCurrency(
                                    parseFloat(charge.amount || "0")
                                  )}
                                  . The charge will be marked as voided and will
                                  not be included in any future invoices. This
                                  action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(charge.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Void Charge
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {meta && totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(meta.page - 1) * meta.per_page + 1} to{" "}
                    {Math.min(meta.page * meta.per_page, meta.total)} of{" "}
                    {meta.total} charges
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {meta.page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No charges to audit</h3>
              <p className="text-muted-foreground">
                There are no uninvoiced charges matching your filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
