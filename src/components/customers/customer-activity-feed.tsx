"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  FileText,
  DollarSign,
  Settings,
  RefreshCw,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { api } from "@/lib/api/client";
import { formatRelativeTime, formatCurrency } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export type ActivityType =
  | "order_created"
  | "order_shipped"
  | "invoice_created"
  | "invoice_sent"
  | "invoice_paid"
  | "payment_received"
  | "billing_config_updated"
  | "accrual_processed"
  | "note_added";

export interface CustomerActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    order_id?: number;
    invoice_id?: number;
    invoice_number?: string;
    amount?: number;
    reference?: string;
    [key: string]: unknown;
  };
}

interface CustomerActivityFeedProps {
  customerId: number | string;
  limit?: number;
  className?: string;
}

interface CustomerActivityResponse {
  activities: CustomerActivity[];
  total: number;
}

function useCustomerActivity(customerId: number | string, limit: number) {
  return useQuery({
    queryKey: ["customers", customerId, "activity", { limit }],
    queryFn: async () => {
      const response = await api.get<CustomerActivityResponse>(
        `/api/v1/customers/${customerId}/activity`,
        { limit }
      );
      return response.data;
    },
    enabled: !!customerId,
    refetchInterval: 60000, // Refetch every minute
  });
}

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "order_created":
    case "order_shipped":
      return <Package className="h-4 w-4" />;
    case "invoice_created":
    case "invoice_sent":
      return <FileText className="h-4 w-4" />;
    case "invoice_paid":
    case "payment_received":
      return <DollarSign className="h-4 w-4" />;
    case "billing_config_updated":
      return <Settings className="h-4 w-4" />;
    case "accrual_processed":
      return <RefreshCw className="h-4 w-4" />;
    case "note_added":
    default:
      return <Clock className="h-4 w-4" />;
  }
}

function getActivityIconColor(type: ActivityType) {
  switch (type) {
    case "order_created":
    case "order_shipped":
      return "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400";
    case "invoice_created":
    case "invoice_sent":
      return "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400";
    case "invoice_paid":
    case "payment_received":
      return "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400";
    case "billing_config_updated":
      return "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400";
    case "accrual_processed":
      return "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
}

function getActivityLink(activity: CustomerActivity): string | null {
  const { type, metadata } = activity;

  switch (type) {
    case "order_created":
    case "order_shipped":
      return metadata?.order_id ? `/orders/${metadata.order_id}` : null;
    case "invoice_created":
    case "invoice_sent":
    case "invoice_paid":
      return metadata?.invoice_id ? `/invoices/${metadata.invoice_id}` : null;
    default:
      return null;
  }
}

interface ActivityItemProps {
  activity: CustomerActivity;
  isLast: boolean;
}

export function ActivityItem({ activity, isLast }: ActivityItemProps) {
  const link = getActivityLink(activity);
  const iconColor = getActivityIconColor(activity.type);

  const content = (
    <div className="flex gap-3">
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
            iconColor
          )}
        >
          {getActivityIcon(activity.type)}
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-border mt-2 min-h-[20px]" />
        )}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium leading-tight">{activity.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activity.description}
            </p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(activity.timestamp)}
          </span>
        </div>
        {activity.metadata?.amount !== undefined && (
          <Badge variant="secondary" className="mt-2">
            {formatCurrency(activity.metadata.amount)}
          </Badge>
        )}
        {activity.metadata?.invoice_number && (
          <Badge variant="outline" className="mt-2 ml-1">
            #{activity.metadata.invoice_number}
          </Badge>
        )}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link
        href={link}
        className="block hover:bg-muted/50 rounded-lg transition-colors -mx-2 px-2"
      >
        {content}
      </Link>
    );
  }

  return content;
}

function ActivityFeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyActivityState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="rounded-full bg-muted p-3 mb-3">
        <Clock className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No recent activity</p>
      <p className="text-xs text-muted-foreground mt-1">
        Activity will appear here as events occur
      </p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="rounded-full bg-destructive/10 p-3 mb-3">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <p className="text-sm font-medium">Failed to load activity</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-3">
        <RefreshCw className="h-3 w-3 mr-1" />
        Retry
      </Button>
    </div>
  );
}

export function CustomerActivityFeed({
  customerId,
  limit = 10,
  className,
}: CustomerActivityFeedProps) {
  const { data, isLoading, isError, refetch } = useCustomerActivity(customerId, limit);

  if (isLoading) {
    return <ActivityFeedSkeleton count={Math.min(limit, 5)} />;
  }

  if (isError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  const activities = data?.activities ?? [];
  const hasActivities = activities.length > 0;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>
            {hasActivities
              ? `Showing ${activities.length} recent events`
              : "No recent activity"}
          </CardDescription>
        </div>
        {hasActivities && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => refetch()}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {hasActivities ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-1">
              {activities.map((activity, index) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  isLast={index === activities.length - 1}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <EmptyActivityState />
        )}
      </CardContent>
    </Card>
  );
}
