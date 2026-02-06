"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDualRunDetail,
  type DualRunCharge,
  type DualRunDifference,
} from "@/hooks/use-billing";
import { formatDateTime, formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function DualRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: detail, isLoading } = useDualRunDetail(id);

  if (isLoading) {
    return <DualRunDetailSkeleton />;
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Comparison not found</p>
        <Button variant="ghost" asChild className="mt-4">
          <Link href="/billing/dual-run">Back to Comparisons</Link>
        </Button>
      </div>
    );
  }

  const totalOld = Number(detail.total_old);
  const totalNew = Number(detail.total_new);
  const delta = Number(detail.delta);
  const deltaPercent = Number(detail.delta_percentage);
  const isIncrease = delta > 0;
  const isDecrease = delta < 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/billing/dual-run">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Comparison #{detail.id}
            </h1>
            <Badge
              variant={
                detail.match_status === "perfect_match"
                  ? "default"
                  : detail.match_status === "minor_variance"
                    ? "secondary"
                    : "destructive"
              }
            >
              {detail.match_status === "perfect_match" && (
                <CheckCircle className="mr-1 h-3 w-3" />
              )}
              {detail.match_status === "minor_variance" && (
                <AlertTriangle className="mr-1 h-3 w-3" />
              )}
              {detail.match_status === "major_variance" && (
                <XCircle className="mr-1 h-3 w-3" />
              )}
              {detail.match_status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {detail.customer_name
              ? `Customer: ${detail.customer_name}`
              : `Customer #${detail.customer_id}`}{" "}
            &bull; {detail.run_at && formatDateTime(detail.run_at)}
            {detail.run_by && ` by ${detail.run_by}`}
          </p>
        </div>
      </div>

      {/* Summary Delta Card */}
      <Card
        className={cn(
          "border-2",
          detail.match_status === "perfect_match" &&
            "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950",
          detail.match_status === "minor_variance" &&
            "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950",
          detail.match_status === "major_variance" &&
            "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
        )}
      >
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Old System Total
              </p>
              <p className="text-2xl font-bold font-mono mt-1">
                {formatCurrency(totalOld)}
              </p>
              <p className="text-xs text-muted-foreground">
                {detail.old_charges.length} charges
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                New System Total
              </p>
              <p className="text-2xl font-bold font-mono mt-1">
                {formatCurrency(totalNew)}
              </p>
              <p className="text-xs text-muted-foreground">
                {detail.new_charges.length} charges
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Delta
              </p>
              <p
                className={cn(
                  "text-2xl font-bold font-mono mt-1",
                  isIncrease && "text-red-600 dark:text-red-400",
                  isDecrease && "text-green-600 dark:text-green-400"
                )}
              >
                {isIncrease ? "+" : ""}
                {formatCurrency(delta)}
              </p>
              <p className="text-xs text-muted-foreground">
                {deltaPercent > 0
                  ? `${isIncrease ? "+" : ""}${deltaPercent.toFixed(2)}%`
                  : "no variance"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Orders Compared
              </p>
              <p className="text-2xl font-bold mt-1">
                {formatNumber(detail.orders_compared)}
              </p>
              {detail.period_start && detail.period_end && (
                <p className="text-xs text-muted-foreground">
                  {detail.period_start} to {detail.period_end}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Differences Table */}
      {detail.differences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Discrepancies ({detail.differences.length})
            </CardTitle>
            <CardDescription>
              Charges that differ between the old and new billing engines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Subcategory</TableHead>
                  <TableHead className="text-right">Old Amount</TableHead>
                  <TableHead className="text-right">New Amount</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.differences.map(
                  (diff: DualRunDifference, index: number) => {
                    const diffAmount = diff.difference;
                    const isDiffPositive = diffAmount > 0;
                    const isDiffNegative = diffAmount < 0;
                    return (
                      <TableRow
                        key={`${diff.order_id}-${diff.subcategory}-${index}`}
                        className={cn(
                          isDiffPositive &&
                            "bg-red-50 dark:bg-red-950/30",
                          isDiffNegative &&
                            "bg-green-50 dark:bg-green-950/30"
                        )}
                      >
                        <TableCell className="font-mono">
                          {diff.order_id}
                        </TableCell>
                        <TableCell>{diff.subcategory}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(diff.old_amount)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(diff.new_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isDiffPositive && (
                              <ArrowUpRight className="h-4 w-4 text-red-600" />
                            )}
                            {isDiffNegative && (
                              <ArrowDownRight className="h-4 w-4 text-green-600" />
                            )}
                            {diffAmount === 0 && (
                              <Minus className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span
                              className={cn(
                                "font-mono",
                                isDiffPositive &&
                                  "text-red-600 dark:text-red-400",
                                isDiffNegative &&
                                  "text-green-600 dark:text-green-400"
                              )}
                            >
                              {isDiffPositive ? "+" : ""}
                              {formatCurrency(diffAmount)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Side-by-Side Charges */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Old Charges */}
        <Card>
          <CardHeader>
            <CardTitle>Old System Charges</CardTitle>
            <CardDescription>
              {detail.old_charges.length} charges totaling{" "}
              {formatCurrency(totalOld)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detail.old_charges.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No charges in old system
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.old_charges.map(
                    (charge: DualRunCharge, index: number) => (
                      <TableRow key={`old-${charge.order_id}-${index}`}>
                        <TableCell className="font-mono text-sm">
                          {charge.order_id}
                        </TableCell>
                        <TableCell className="text-sm">
                          {charge.subcategory || charge.service_type}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {charge.quantity}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(charge.rate)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          {formatCurrency(charge.amount)}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* New Charges */}
        <Card>
          <CardHeader>
            <CardTitle>New System Charges</CardTitle>
            <CardDescription>
              {detail.new_charges.length} charges totaling{" "}
              {formatCurrency(totalNew)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detail.new_charges.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No charges in new system
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.new_charges.map(
                    (charge: DualRunCharge, index: number) => {
                      // Check if this charge differs from old system
                      const hasDiff = detail.differences.some(
                        (d: DualRunDifference) =>
                          d.order_id === charge.order_id &&
                          d.subcategory === charge.subcategory
                      );
                      return (
                        <TableRow
                          key={`new-${charge.order_id}-${index}`}
                          className={cn(
                            hasDiff &&
                              "bg-yellow-50 dark:bg-yellow-950/30"
                          )}
                        >
                          <TableCell className="font-mono text-sm">
                            {charge.order_id}
                          </TableCell>
                          <TableCell className="text-sm">
                            {charge.subcategory || charge.service_type}
                            {hasDiff && (
                              <AlertTriangle className="inline ml-1 h-3 w-3 text-yellow-600" />
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {charge.quantity}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatCurrency(charge.rate)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium">
                            {formatCurrency(charge.amount)}
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Perfect Match Confirmation */}
      {detail.match_status === "perfect_match" && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardContent className="flex items-start gap-3 pt-6">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                Perfect Match
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Both billing engines produced identical results for all{" "}
                {detail.orders_compared} orders. The new system is validated
                for this customer.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DualRunDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-1" />
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-4 w-24 mx-auto" />
                <Skeleton className="h-8 w-20 mx-auto mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
