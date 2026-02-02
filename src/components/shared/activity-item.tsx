"use client";

import * as React from "react";
import {
  Package,
  FileText,
  CreditCard,
  RefreshCw,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type ActivityType =
  | "order_sync"
  | "invoice_sent"
  | "payment_received"
  | "accrual_run"
  | "config_change";

export interface ActivityUser {
  id?: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  user?: ActivityUser;
  metadata?: Record<string, unknown>;
}

export interface ActivityItemProps {
  activity: Activity;
  className?: string;
}

const activityIcons: Record<ActivityType, LucideIcon> = {
  order_sync: Package,
  invoice_sent: FileText,
  payment_received: CreditCard,
  accrual_run: RefreshCw,
  config_change: Settings,
};

const activityColors: Record<ActivityType, string> = {
  order_sync: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  invoice_sent: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  payment_received: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  accrual_run: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  config_change: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  return date.toLocaleDateString();
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ActivityItem({ activity, className }: ActivityItemProps) {
  const Icon = activityIcons[activity.type];
  const colorClasses = activityColors[activity.type];
  const relativeTime = formatRelativeTime(activity.timestamp);

  return (
    <div
      data-slot="activity-item"
      className={cn(
        "flex items-start gap-3 py-3 first:pt-0 last:pb-0",
        className
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          colorClasses
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">
          {activity.description}
        </p>
        <div className="mt-1 flex items-center gap-2">
          {activity.user && (
            <>
              <Avatar size="sm">
                <AvatarFallback className="text-[10px]">
                  {getInitials(activity.user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">
                {activity.user.name}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
            </>
          )}
          <time
            dateTime={activity.timestamp}
            className="text-xs text-muted-foreground whitespace-nowrap"
            title={new Date(activity.timestamp).toLocaleString()}
          >
            {relativeTime}
          </time>
        </div>
      </div>
    </div>
  );
}

export { ActivityItem };
