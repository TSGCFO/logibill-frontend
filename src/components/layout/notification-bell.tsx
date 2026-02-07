"use client";

import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  FileText,
  Package,
  Receipt,
  Settings,
  User,
  Boxes,
  Truck,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";
import { useState } from "react";

// ============================================================================
// Constants
// ============================================================================

const MAX_DROPDOWN_ITEMS = 10;

// ============================================================================
// Helpers
// ============================================================================

/** Get an icon component based on the notification resource type / type */
function getNotificationIcon(notification: Notification) {
  const { resource_type, type } = notification;

  switch (resource_type) {
    case "invoice":
      return <Receipt className="h-4 w-4 text-blue-500" />;
    case "customer":
      return <User className="h-4 w-4 text-green-500" />;
    case "order":
      return <Package className="h-4 w-4 text-orange-500" />;
    case "billing_period":
      return <FileText className="h-4 w-4 text-purple-500" />;
    case "product":
      return <Boxes className="h-4 w-4 text-cyan-500" />;
    case "shipping":
    case "shipping_charge":
      return <Truck className="h-4 w-4 text-amber-500" />;
    case "user":
      return <User className="h-4 w-4 text-indigo-500" />;
    case "billing_rule":
    case "service_type":
    case "config":
      return <Settings className="h-4 w-4 text-gray-500" />;
    default:
      // Fallback: use type-based icons
      if (type?.includes("delete") || type?.includes("voided")) {
        return <Activity className="h-4 w-4 text-red-500" />;
      }
      return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
}

/** Format a timestamp to a relative string like "2m ago" */
function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  return new Date(timestamp).toLocaleDateString();
}

// ============================================================================
// Sub-components
// ============================================================================

interface NotificationItemProps {
  notification: Notification;
  onClickNotification: (notification: Notification) => void;
}

function NotificationItem({
  notification,
  onClickNotification,
}: NotificationItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent",
        !notification.read && "bg-accent/50"
      )}
      onClick={() => onClickNotification(notification)}
    >
      {/* Icon */}
      <div className="mt-0.5 flex-shrink-0">
        {getNotificationIcon(notification)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm leading-tight",
            !notification.read ? "font-medium" : "text-muted-foreground"
          )}
        >
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          {formatRelativeTime(notification.timestamp)}
        </p>
      </div>

      {/* Unread indicator */}
      {!notification.read && (
        <div className="mt-1.5 flex-shrink-0">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
        </div>
      )}
    </button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead,
    isLoading,
  } = useNotifications();

  const displayedNotifications = notifications.slice(0, MAX_DROPDOWN_ITEMS);

  const handleClickNotification = (notification: Notification) => {
    // Mark as read
    markAsRead(String(notification.id));

    // Navigate if URL is available
    if (notification.resource_url) {
      setOpen(false);
      router.push(notification.resource_url);
    }
  };

  const handleMarkAllRead = () => {
    markAllRead();
  };

  const handleViewAll = () => {
    setOpen(false);
    router.push("/admin/audit-trail");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8"
              aria-label={
                unreadCount > 0
                  ? `Notifications, ${unreadCount} unread`
                  : "Notifications"
              }
            >
              <Bell className="h-4 w-4" />

              {/* Unread badge */}
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>

      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading...</div>
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Bell className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No new notifications
              </p>
            </div>
          ) : (
            <div className="py-1">
              {displayedNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    onClickNotification={handleClickNotification}
                  />
                  {index < displayedNotifications.length - 1 && (
                    <Separator className="mx-3" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto w-full justify-center px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleViewAll}
          >
            View all activity
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
