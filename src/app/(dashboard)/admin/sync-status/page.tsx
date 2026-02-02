"use client";

import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Truck,
  AlertTriangle,
  Play,
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDateTime, formatNumber } from "@/lib/format";
import { toast } from "sonner";
import {
  useSyncStatus,
  useTriggerWmsSync,
  useTriggerTechShipSync,
  type SyncStatus,
} from "@/hooks/use-admin";

/**
 * Sync Status Page
 *
 * Displays real-time sync status for WMS and TechShip integrations.
 * Connected to API via useSyncStatus hook.
 *
 * Track: frontend-prod_20260202
 * Task: 1.2
 */
export default function SyncStatusPage() {
  // Fetch sync status from API
  const {
    data: syncStatus,
    isLoading,
    isError,
    error,
    refetch,
  } = useSyncStatus();

  // Sync trigger mutations
  const wmsSyncMutation = useTriggerWmsSync();
  const techshipSyncMutation = useTriggerTechShipSync();

  const handleWmsSync = async () => {
    try {
      const result = await wmsSyncMutation.mutateAsync();
      toast.success("WMS sync started", {
        description: result.message || "Sync job has been queued",
      });
    } catch (err) {
      toast.error("WMS sync failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleTechshipSync = async () => {
    try {
      const result = await techshipSyncMutation.mutateAsync();
      toast.success("TechShip sync started", {
        description: result.message || "Sync job has been queued",
      });
    } catch (err) {
      toast.error("TechShip sync failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="sync-status-loading">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sync Status</h1>
            <p className="text-muted-foreground">
              Monitor and manage data synchronization from external systems
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sync Status</h1>
            <p className="text-muted-foreground">
              Monitor and manage data synchronization from external systems
            </p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading sync status</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load sync status"}
          </AlertDescription>
        </Alert>

        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const wmsStatus = syncStatus?.wms;
  const techshipStatus = syncStatus?.techship;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sync Status</h1>
          <p className="text-muted-foreground">
            Monitor and manage data synchronization from external systems
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Sync Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* WMS Sync Card */}
        <Card data-testid="wms-sync-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                <CardTitle>WMS (Extensiv)</CardTitle>
              </div>
              <Badge
                variant={wmsStatus?.status === "completed" ? "default" : "secondary"}
                className="gap-1"
              >
                {wmsStatus?.status === "completed" && <CheckCircle className="h-3 w-3" />}
                {wmsStatus?.status === "running" && <RefreshCw className="h-3 w-3 animate-spin" />}
                {wmsStatus?.status === "failed" && <XCircle className="h-3 w-3" />}
                {wmsStatus?.last_sync_at ? "Connected" : "Not Synced"}
              </Badge>
            </div>
            <CardDescription>
              Warehouse Management System order data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Last Sync</p>
                <p className="font-medium">
                  {wmsStatus?.last_sync_at
                    ? formatDateTime(wmsStatus.last_sync_at)
                    : "Never"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Records</p>
                <p className="font-medium">
                  {wmsStatus?.records_synced
                    ? formatNumber(wmsStatus.records_synced)
                    : "0"}
                </p>
              </div>
            </div>

            {/* Show errors if any */}
            {wmsStatus?.errors && wmsStatus.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Sync Errors</AlertTitle>
                <AlertDescription>
                  {wmsStatus.errors.join(", ")}
                </AlertDescription>
              </Alert>
            )}

            {/* Show progress if running */}
            {(wmsStatus?.status === "running" || wmsSyncMutation.isPending) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Syncing...</span>
                </div>
                <Progress value={undefined} className="animate-pulse" />
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleWmsSync}
              disabled={wmsSyncMutation.isPending || wmsStatus?.status === "running"}
            >
              {wmsSyncMutation.isPending || wmsStatus?.status === "running" ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Sync Now
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* TechShip Sync Card */}
        <Card data-testid="techship-sync-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-green-500" />
                <CardTitle>TechShip</CardTitle>
              </div>
              <Badge
                variant={techshipStatus?.status === "completed" ? "default" : "secondary"}
                className="gap-1"
              >
                {techshipStatus?.status === "completed" && <CheckCircle className="h-3 w-3" />}
                {techshipStatus?.status === "running" && <RefreshCw className="h-3 w-3 animate-spin" />}
                {techshipStatus?.status === "failed" && <XCircle className="h-3 w-3" />}
                {techshipStatus?.last_sync_at ? "Connected" : "Not Synced"}
              </Badge>
            </div>
            <CardDescription>Shipping costs and tracking data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Last Sync</p>
                <p className="font-medium">
                  {techshipStatus?.last_sync_at
                    ? formatDateTime(techshipStatus.last_sync_at)
                    : "Never"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Records</p>
                <p className="font-medium">
                  {techshipStatus?.records_synced
                    ? formatNumber(techshipStatus.records_synced)
                    : "0"}
                </p>
              </div>
            </div>

            {/* Show errors if any */}
            {techshipStatus?.errors && techshipStatus.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Sync Errors</AlertTitle>
                <AlertDescription>
                  {techshipStatus.errors.join(", ")}
                </AlertDescription>
              </Alert>
            )}

            {/* Show progress if running */}
            {(techshipStatus?.status === "running" || techshipSyncMutation.isPending) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Syncing...</span>
                </div>
                <Progress value={undefined} className="animate-pulse" />
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleTechshipSync}
              disabled={techshipSyncMutation.isPending || techshipStatus?.status === "running"}
            >
              {techshipSyncMutation.isPending || techshipStatus?.status === "running" ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Sync Now
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sync Schedule Info */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Schedule</CardTitle>
          <CardDescription>
            Automatic synchronization schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">WMS Sync</p>
                  <p className="text-sm text-muted-foreground">
                    Every hour at :00
                  </p>
                </div>
              </div>
              <Badge variant="outline">
                <Clock className="mr-1 h-3 w-3" />
                Automatic
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">TechShip Sync</p>
                  <p className="text-sm text-muted-foreground">
                    Daily at 6:00 AM
                  </p>
                </div>
              </div>
              <Badge variant="outline">
                <Clock className="mr-1 h-3 w-3" />
                Automatic
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
