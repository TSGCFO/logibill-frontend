"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Users,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  Lock,
  Unlock,
  RefreshCw,
  MoreHorizontal,
  Download,
  Eye,
  Loader2,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatDateTime, formatCurrency, formatNumber, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PeriodDetail {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: "open" | "closed" | "locked";
  customer_count: number;
  order_count: number;
  total_charges: number;
  total_invoiced: number;
  created_at: string;
  closed_at?: string;
  closed_by?: string;
}

interface PeriodCustomer {
  customer_id: number;
  customer_name: string;
  order_count: number;
  total_charges: number;
  invoice_id?: number;
  invoice_number?: string;
  invoice_status?: string;
}

interface PeriodCharge {
  id: number;
  order_id: string;
  order_number: string;
  customer_id: number;
  customer_name: string;
  service_code: string;
  service_name: string;
  quantity: number;
  rate: number;
  amount: number;
  created_at: string;
}

export default function AdminPeriodDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [customerPagination, setCustomerPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [chargePagination, setChargePagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });

  const { data: period, isLoading: periodLoading } = useQuery({
    queryKey: ["admin-period", id],
    queryFn: async () => {
      const response = await api.get<{ data: PeriodDetail }>(
        `/api/v1/admin/periods/${id}`
      );
      return response.data.data;
    },
  });

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["admin-period-customers", id, customerPagination],
    queryFn: async () => {
      const response = await api.get<{
        data: PeriodCustomer[];
        meta: { total: number; total_pages: number };
      }>(`/api/v1/admin/periods/${id}/customers`, {
        page: customerPagination.pageIndex + 1,
        per_page: customerPagination.pageSize,
      });
      return response.data;
    },
  });

  const { data: chargesData, isLoading: chargesLoading } = useQuery({
    queryKey: ["admin-period-charges", id, chargePagination],
    queryFn: async () => {
      const response = await api.get<{
        data: PeriodCharge[];
        meta: { total: number; total_pages: number };
      }>(`/api/v1/admin/periods/${id}/charges`, {
        page: chargePagination.pageIndex + 1,
        per_page: chargePagination.pageSize,
      });
      return response.data;
    },
  });

  const closePeriod = useMutation({
    mutationFn: async () => {
      return api.post(`/api/v1/admin/periods/${id}/close`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-period", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-periods"] });
      toast.success("Period closed successfully");
    },
    onError: () => {
      toast.error("Failed to close period");
    },
  });

  const reopenPeriod = useMutation({
    mutationFn: async () => {
      return api.post(`/api/v1/admin/periods/${id}/reopen`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-period", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-periods"] });
      toast.success("Period reopened successfully");
    },
    onError: () => {
      toast.error("Failed to reopen period");
    },
  });

  const lockPeriod = useMutation({
    mutationFn: async () => {
      return api.post(`/api/v1/admin/periods/${id}/lock`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-period", id] });
      toast.success("Period locked successfully");
    },
    onError: () => {
      toast.error("Failed to lock period");
    },
  });

  const customerColumns: ColumnDef<PeriodCustomer>[] = [
    {
      accessorKey: "customer_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/customers/${row.original.customer_id}`}
          className="font-medium hover:underline"
        >
          {row.original.customer_name}
        </Link>
      ),
    },
    {
      accessorKey: "order_count",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Orders" />
      ),
      cell: ({ row }) => formatNumber(row.original.order_count),
    },
    {
      accessorKey: "total_charges",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Charges" />
      ),
      cell: ({ row }) => (
        <span className="font-mono">
          {formatCurrency(row.original.total_charges)}
        </span>
      ),
    },
    {
      accessorKey: "invoice_number",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invoice" />
      ),
      cell: ({ row }) =>
        row.original.invoice_id ? (
          <Link
            href={`/invoices/${row.original.invoice_id}`}
            className="hover:underline"
          >
            <Badge variant="outline">{row.original.invoice_number}</Badge>
          </Link>
        ) : (
          <Badge variant="secondary">Not Invoiced</Badge>
        ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/customers/${row.original.customer_id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Customer
              </Link>
            </DropdownMenuItem>
            {!row.original.invoice_id && (
              <DropdownMenuItem asChild>
                <Link href={`/invoices/from-period/${id}?customer=${row.original.customer_id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Invoice
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const chargeColumns: ColumnDef<PeriodCharge>[] = [
    {
      accessorKey: "order_number",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/orders/${row.original.order_id}`}
          className="font-mono text-sm hover:underline"
        >
          {row.original.order_number}
        </Link>
      ),
    },
    {
      accessorKey: "customer_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) => (
        <Link
          href={`/customers/${row.original.customer_id}`}
          className="hover:underline"
        >
          {row.original.customer_name}
        </Link>
      ),
    },
    {
      accessorKey: "service_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Service" />
      ),
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.service_name}</span>
          <p className="text-xs text-muted-foreground font-mono">
            {row.original.service_code}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Qty" />
      ),
      cell: ({ row }) => formatNumber(row.original.quantity),
    },
    {
      accessorKey: "rate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Rate" />
      ),
      cell: ({ row }) => (
        <span className="font-mono">{formatCurrency(row.original.rate)}</span>
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => (
        <span className="font-mono font-medium">
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
  ];

  if (periodLoading) {
    return <PeriodDetailSkeleton />;
  }

  const invoicedPercent = period
    ? Math.round((period.total_invoiced / (period.total_charges || 1)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/periods">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {period?.name ?? "Period Details"}
            </h1>
            <Badge
              variant={
                period?.status === "open"
                  ? "default"
                  : period?.status === "closed"
                  ? "secondary"
                  : "outline"
              }
            >
              {period?.status === "open" && <Clock className="mr-1 h-3 w-3" />}
              {period?.status === "closed" && <CheckCircle className="mr-1 h-3 w-3" />}
              {period?.status === "locked" && <Lock className="mr-1 h-3 w-3" />}
              {period?.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {period?.start_date && formatDate(period.start_date)} -{" "}
            {period?.end_date && formatDate(period.end_date)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {period?.status === "open" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={closePeriod.isPending}>
                  {closePeriod.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Close Period
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Close Period?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will close the billing period and prevent new charges from
                    being added. You can reopen it later if needed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => closePeriod.mutate()}>
                    Close Period
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {period?.status === "closed" && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={reopenPeriod.isPending}>
                    {reopenPeriod.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Unlock className="mr-2 h-4 w-4" />
                    )}
                    Reopen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reopen Period?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reopen the billing period allowing new charges to
                      be added. This action should be used carefully.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => reopenPeriod.mutate()}>
                      Reopen Period
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={lockPeriod.isPending}>
                    {lockPeriod.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="mr-2 h-4 w-4" />
                    )}
                    Lock Period
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Lock Period?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Locking is permanent. Once locked, this period cannot be
                      modified or reopened. Use this only when you're sure all
                      billing is finalized.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => lockPeriod.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Lock Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(period?.customer_count ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(period?.order_count ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Charges</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(period?.total_charges ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoiced</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(period?.total_invoiced ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {invoicedPercent}% of total charges
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Customers and Charges */}
      <Tabs defaultValue="customers">
        <TabsList>
          <TabsTrigger value="customers">By Customer</TabsTrigger>
          <TabsTrigger value="charges">All Charges</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Customers in Period</CardTitle>
              <CardDescription>
                Breakdown of charges and invoices by customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={customerColumns}
                data={customersData?.data ?? []}
                isLoading={customersLoading}
                pageCount={customersData?.meta?.total_pages ?? 0}
                pageIndex={customerPagination.pageIndex}
                pageSize={customerPagination.pageSize}
                onPaginationChange={setCustomerPagination}
                manualPagination
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charges" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Charges</CardTitle>
              <CardDescription>
                Individual charges across all customers in this period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={chargeColumns}
                data={chargesData?.data ?? []}
                isLoading={chargesLoading}
                pageCount={chargesData?.meta?.total_pages ?? 0}
                pageIndex={chargePagination.pageIndex}
                pageSize={chargePagination.pageSize}
                onPaginationChange={setChargePagination}
                manualPagination
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PeriodDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-1" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
