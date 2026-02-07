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

// Backend activity types (from ActivityItemSchema)
export type ActivityType =
  | "new_order"
  | "invoice_created"
  | "invoice_sent"
  | "invoice_paid"
  | "accrual_complete"
  | "customer_updated"
  | string; // Allow unknown types to gracefully degrade

export interface ActivityUser {
  id?: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface Activity {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  user_id?: string | null;
  user_name?: string | null;
  customer_id?: number | null;
  customer_name?: string | null;
  resource_type?: string | null;
  resource_id?: number | string | null;
  resource_url?: string | null;
  details?: Record<string, unknown> | null;
}

export interface ActivityItemProps {
  activity: Activity;
  className?: string;
}

const activityIcons: Record<string, LucideIcon> = {
  new_order: Package,
  invoice_created: FileText,
  invoice_sent: FileText,
  invoice_paid: CreditCard,
  accrual_complete: RefreshCw,
  customer_updated: Settings,
};

const activityColors: Record<string, string> = {
  new_order: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  invoice_created: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  invoice_sent: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  invoice_paid: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  accrual_complete: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  customer_updated: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const defaultIcon = Settings;
const defaultColor = "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

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
  const Icon = activityIcons[activity.type] ?? defaultIcon;
  const colorClasses = activityColors[activity.type] ?? defaultColor;
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
          {activity.message}
        </p>
        <div className="mt-1 flex items-center gap-2">
          {activity.user_name && (
            <>
              <Avatar size="sm">
                <AvatarFallback className="text-[10px]">
                  {getInitials(activity.user_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">
                {activity.user_name}
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
