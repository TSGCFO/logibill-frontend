"use client";

import { useState } from "react";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Truck,
  AlertTriangle,
  Play,
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
import { formatDateTime, formatNumber } from "@/lib/format";
import { toast } from "sonner";

interface SyncJob {
  id: string;
  type: "wms" | "techship";
  status: "running" | "completed" | "failed" | "pending";
  started_at: string;
  completed_at?: string;
  records_processed: number;
  records_total: number;
  errors?: string[];
}

const mockSyncJobs: SyncJob[] = [
  {
    id: "1",
    type: "wms",
    status: "completed",
    started_at: "2024-01-15T10:00:00Z",
    completed_at: "2024-01-15T10:05:32Z",
    records_processed: 1250,
    records_total: 1250,
  },
  {
    id: "2",
    type: "techship",
    status: "completed",
    started_at: "2024-01-15T09:00:00Z",
    completed_at: "2024-01-15T09:12:45Z",
    records_processed: 485,
    records_total: 485,
  },
  {
    id: "3",
    type: "wms",
    status: "failed",
    started_at: "2024-01-14T22:00:00Z",
    completed_at: "2024-01-14T22:01:15Z",
    records_processed: 150,
    records_total: 1200,
    errors: ["Connection timeout after 60 seconds", "Retry limit exceeded"],
  },
  {
    id: "4",
    type: "techship",
    status: "completed",
    started_at: "2024-01-14T21:00:00Z",
    completed_at: "2024-01-14T21:08:20Z",
    records_processed: 320,
    records_total: 320,
  },
];

export default function SyncStatusPage() {
  const [isWmsSyncing, setIsWmsSyncing] = useState(false);
  const [isTechshipSyncing, setIsTechshipSyncing] = useState(false);

  const handleWmsSync = async () => {
    setIsWmsSyncing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      toast.success("WMS sync completed", {
        description: "Successfully synced 1,250 orders",
      });
    } catch {
      toast.error("WMS sync failed");
    } finally {
      setIsWmsSyncing(false);
    }
  };

  const handleTechshipSync = async () => {
    setIsTechshipSyncing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      toast.success("TechShip sync completed", {
        description: "Successfully synced 485 shipments",
      });
    } catch {
      toast.error("TechShip sync failed");
    } finally {
      setIsTechshipSyncing(false);
    }
  };

  const lastWmsSync = mockSyncJobs.find((j) => j.type === "wms" && j.status === "completed");
  const lastTechshipSync = mockSyncJobs.find((j) => j.type === "techship" && j.status === "completed");

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
      </div>

      {/* Sync Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* WMS Sync Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                <CardTitle>WMS (Extensiv)</CardTitle>
              </div>
              <Badge
                variant={lastWmsSync ? "default" : "secondary"}
                className="gap-1"
              >
                <CheckCircle className="h-3 w-3" />
                Connected
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
                  {lastWmsSync
                    ? formatDateTime(lastWmsSync.completed_at!)
                    : "Never"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Records</p>
                <p className="font-medium">
                  {lastWmsSync
                    ? formatNumber(lastWmsSync.records_processed)
                    : "0"}
                </p>
              </div>
            </div>

            {isWmsSyncing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Syncing...</span>
                  <span>65%</span>
                </div>
                <Progress value={65} />
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleWmsSync}
              disabled={isWmsSyncing}
            >
              {isWmsSyncing ? (
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-green-500" />
                <CardTitle>TechShip</CardTitle>
              </div>
              <Badge
                variant={lastTechshipSync ? "default" : "secondary"}
                className="gap-1"
              >
                <CheckCircle className="h-3 w-3" />
                Connected
              </Badge>
            </div>
            <CardDescription>Shipping costs and tracking data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Last Sync</p>
                <p className="font-medium">
                  {lastTechshipSync
                    ? formatDateTime(lastTechshipSync.completed_at!)
                    : "Never"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Records</p>
                <p className="font-medium">
                  {lastTechshipSync
                    ? formatNumber(lastTechshipSync.records_processed)
                    : "0"}
                </p>
              </div>
            </div>

            {isTechshipSyncing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Syncing...</span>
                  <span>42%</span>
                </div>
                <Progress value={42} />
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleTechshipSync}
              disabled={isTechshipSyncing}
            >
              {isTechshipSyncing ? (
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

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>Recent synchronization jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead className="text-right">Records</TableHead>
                <TableHead>Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSyncJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {job.type === "wms" ? (
                        <Database className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Truck className="h-4 w-4 text-green-500" />
                      )}
                      <span className="font-medium">
                        {job.type === "wms" ? "WMS" : "TechShip"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        job.status === "completed"
                          ? "default"
                          : job.status === "running"
                          ? "secondary"
                          : job.status === "failed"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {job.status === "completed" && (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      )}
                      {job.status === "running" && (
                        <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                      )}
                      {job.status === "failed" && (
                        <XCircle className="mr-1 h-3 w-3" />
                      )}
                      {job.status === "pending" && (
                        <Clock className="mr-1 h-3 w-3" />
                      )}
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(job.started_at)}</TableCell>
                  <TableCell>
                    {job.completed_at ? formatDateTime(job.completed_at) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(job.records_processed)} /{" "}
                    {formatNumber(job.records_total)}
                  </TableCell>
                  <TableCell>
                    {job.errors && job.errors.length > 0 ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {job.errors.length} error(s)
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Schedule Info */}
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
                Next: 11:00 AM
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
                Next: Tomorrow
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
