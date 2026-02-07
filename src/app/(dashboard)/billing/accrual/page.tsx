"use client";

import { useState } from "react";
import {
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Package,
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
import { Progress } from "@/components/ui/progress";
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
import { useAccrualStats, useAccrualRuns, useRunAccrual } from "@/hooks/use-accrual";
import { formatDate, formatDateTime, formatNumber, formatCurrency } from "@/lib/format";
import { toast } from "sonner";

export default function AccrualDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useAccrualStats();
  const { data: runs, isLoading: runsLoading } = useAccrualRuns(20);
  const runAccrual = useRunAccrual();

  const handleRunAccrual = async () => {
    try {
      await runAccrual.mutateAsync();
      toast.success("Accrual started", {
        description: "The accrual process has been initiated",
      });
    } catch {
      toast.error("Failed to start accrual");
    }
  };

  // Compute run success rate from the runs list
  const completedRuns = runs?.filter((r) => r.status === "completed").length ?? 0;
  const totalRuns = runs?.length ?? 0;
  const successRate = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accrual Dashboard</h1>
          <p className="text-muted-foreground">
            Run and monitor billing accrual processes
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={runAccrual.isPending}>
              {runAccrual.isPending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Run Accrual
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Run Billing Accrual?</AlertDialogTitle>
              <AlertDialogDescription>
                This will process all unaccrued orders and generate billing
                charges. This operation may take several minutes depending on the
                number of orders.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRunAccrual}>
                Run Accrual
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Charges</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(stats?.total_charges ?? 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.total_amount ?? "0")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Processed</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(stats?.total_orders ?? 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Run Success Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{successRate}%</div>
                <Progress value={successRate} className="mt-2" />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Accrual Runs</CardTitle>
          <CardDescription>
            History of recent accrual processes and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Started</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Charges</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : runs && runs.length > 0 ? (
                runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>{formatDateTime(run.started_at)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          run.status === "completed"
                            ? "default"
                            : run.status === "running"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {run.status === "completed" && (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        )}
                        {run.status === "running" && (
                          <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        {run.status === "failed" && (
                          <XCircle className="mr-1 h-3 w-3" />
                        )}
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(run.orders_processed)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(run.charges_created)}
                    </TableCell>
                    <TableCell>
                      {run.completed_at
                        ? formatDateTime(run.completed_at)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {run.errors_count > 0 ? (
                        <Badge variant="destructive">
                          {run.errors_count} error(s)
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No accrual runs found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
