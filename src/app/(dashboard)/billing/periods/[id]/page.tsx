"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Lock,
  Unlock,
  Download,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
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
import { useBillingPeriod, useClosePeriod } from "@/hooks/use-billing";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { toast } from "sonner";

interface PeriodCharge {
  id: string;
  customer_name: string;
  customer_code: string;
  order_count: number;
  total_charges: number;
  invoice_status: "pending" | "invoiced" | "paid";
}

const chargesColumns: ColumnDef<PeriodCharge>[] = [
  {
    accessorKey: "customer_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/customers/${row.original.customer_code}`}
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
      <span className="font-medium">
        {formatCurrency(row.original.total_charges)}
      </span>
    ),
  },
  {
    accessorKey: "invoice_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Invoice" />
    ),
    cell: ({ row }) => {
      const status = row.original.invoice_status;
      return (
        <Badge
          variant={
            status === "paid"
              ? "default"
              : status === "invoiced"
              ? "secondary"
              : "outline"
          }
        >
          {status === "paid" && <CheckCircle className="mr-1 h-3 w-3" />}
          {status === "invoiced" && <FileText className="mr-1 h-3 w-3" />}
          {status === "pending" && <Clock className="mr-1 h-3 w-3" />}
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button variant="outline" size="sm" asChild>
        <Link href={`/invoices/new?customer_id=${row.original.customer_code}`}>
          Create Invoice
        </Link>
      </Button>
    ),
  },
];

const mockCharges: PeriodCharge[] = [
  {
    id: "1",
    customer_name: "Vasanti Cosmetics",
    customer_code: "VAS",
    order_count: 245,
    total_charges: 8750.0,
    invoice_status: "invoiced",
  },
  {
    id: "2",
    customer_name: "Clean Kiss",
    customer_code: "CK",
    order_count: 180,
    total_charges: 6200.0,
    invoice_status: "pending",
  },
  {
    id: "3",
    customer_name: "Sample Company",
    customer_code: "SAMP",
    order_count: 45,
    total_charges: 1850.0,
    invoice_status: "paid",
  },
];

export default function BillingPeriodDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: period, isLoading, error } = useBillingPeriod(id);
  const closePeriod = useClosePeriod(id);

  const handleClosePeriod = async () => {
    try {
      await closePeriod.mutateAsync();
      toast.success("Period closed successfully");
    } catch {
      toast.error("Failed to close period");
    }
  };

  if (error) {
    notFound();
  }

  if (isLoading) {
    return <PeriodDetailSkeleton />;
  }

  if (!period) {
    notFound();
  }

  const totalCharges = mockCharges.reduce(
    (sum, c) => sum + c.total_charges,
    0
  );
  const totalOrders = mockCharges.reduce((sum, c) => sum + c.order_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/billing/periods">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {period.name}
              </h1>
              <Badge
                variant={period.status === "closed" ? "secondary" : "default"}
              >
                {period.status === "closed" ? (
                  <Lock className="mr-1 h-3 w-3" />
                ) : (
                  <Unlock className="mr-1 h-3 w-3" />
                )}
                {period.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {formatDate(period.start_date)} - {formatDate(period.end_date)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {period.status === "open" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default">
                  <Lock className="mr-2 h-4 w-4" />
                  Close Period
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Close Billing Period?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Once closed, no new charges can be added to this period. You
                    can still create invoices from the charges.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClosePeriod}>
                    Close Period
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Charges</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCharges)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalOrders)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockCharges.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoiced</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockCharges.filter((c) => c.invoice_status !== "pending").length}{" "}
              / {mockCharges.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="charges" className="space-y-4">
        <TabsList>
          <TabsTrigger value="charges">Charges by Customer</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="charges">
          <Card>
            <CardHeader>
              <CardTitle>Customer Charges</CardTitle>
              <CardDescription>
                Billing charges grouped by customer for this period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={chargesColumns}
                data={mockCharges}
                searchKey="customer_name"
                searchPlaceholder="Search customers..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>
                Invoices created from this billing period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No invoices created yet</p>
                <p className="text-sm">
                  Create invoices from the customer charges above
                </p>
              </div>
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
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
