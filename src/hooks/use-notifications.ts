import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { api, endpoints } from "@/lib/api/client";
import type { Notification, Activity } from "@/types";

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = "logibill_notifications_read";
const POLL_INTERVAL = 30_000; // 30 seconds
const MAX_NOTIFICATIONS = 50;

// ============================================================================
// Query Keys
// ============================================================================

export const notificationKeys = {
  all: ["notifications"] as const,
  feed: () => [...notificationKeys.all, "feed"] as const,
};

// ============================================================================
// Helpers
// ============================================================================

/** Read the set of read notification IDs from localStorage */
function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: string[] = JSON.parse(raw);
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

/** Persist the set of read notification IDs to localStorage */
function persistReadIds(ids: Set<string>): void {
  try {
    // Keep only the most recent 200 IDs to prevent unbounded growth
    const arr = Array.from(ids).slice(-200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // localStorage might be full or unavailable - fail silently
  }
}

/** Map a resource_type + resource_id to a navigation URL */
function buildNotificationUrl(
  resourceType: string,
  resourceId: number | string
): string | undefined {
  switch (resourceType) {
    case "invoice":
      return `/invoices/${resourceId}`;
    case "customer":
      return `/customers/${resourceId}`;
    case "order":
      return `/orders/${resourceId}`;
    case "billing_period":
      return `/billing/periods/${resourceId}`;
    case "product":
      return `/products/${resourceId}`;
    case "service_type":
      return `/services`;
    case "billing_rule":
      return `/billing/config`;
    case "user":
      return `/admin/users`;
    default:
      return undefined;
  }
}

/** Build a human-readable title from activity type */
function buildTitle(type: string, resourceType: string): string {
  // type is a backend activity type like "new_order", "invoice_created", etc.
  const readable = type.replace(/_/g, " ");
  return readable.charAt(0).toUpperCase() + readable.slice(1);
}

/** Convert an Activity from the API into our Notification shape */
function activityToNotification(
  activity: Activity,
  readIds: Set<string>
): Notification {
  const resourceType = activity.resource_type ?? "activity";
  const resourceId = activity.resource_id ?? activity.id;

  // Build URL from resource_url if available, else construct from type
  const url = activity.resource_url ?? buildNotificationUrl(resourceType, resourceId) ?? undefined;

  return {
    id: activity.id,
    type: activity.type,
    message: activity.message || buildTitle(activity.type, resourceType),
    timestamp: activity.timestamp,
    customer_id: activity.customer_id ?? null,
    customer_name: activity.customer_name ?? null,
    resource_type: resourceType,
    resource_id: resourceId,
    resource_url: url ?? null,
    read: readIds.has(String(activity.id)),
  };
}

// ============================================================================
// Hook
// ============================================================================

export interface UseNotificationsReturn {
  /** All fetched notifications (newest first), capped to MAX_NOTIFICATIONS */
  notifications: Notification[];
  /** Count of unread notifications */
  unreadCount: number;
  /** Mark a single notification as read */
  markAsRead: (id: string) => void;
  /** Mark all current notifications as read */
  markAllRead: () => void;
  /** Whether the initial fetch is still loading */
  isLoading: boolean;
  /** Whether any fetch error occurred */
  isError: boolean;
}

export function useNotifications(): UseNotificationsReturn {

  // Read IDs are kept in state so React re-renders on change
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadIds());

  // Fetch recent activity from the backend every POLL_INTERVAL.
  // We always fetch the latest batch (no "since" filtering) because the
  // backend returns the most recent items, and we handle read/unread
  // entirely on the client side via localStorage.
  const { data: rawActivities, isLoading, isError } = useQuery({
    queryKey: notificationKeys.feed(),
    queryFn: async (): Promise<Activity[]> => {
      const params: Record<string, string | number> = {
        limit: MAX_NOTIFICATIONS,
      };

      try {
        // Try the stream endpoint first (GET-based polling)
        const response = await api.get<Activity[]>(
          `${endpoints.activity}/stream`,
          params
        );
        return response.data ?? [];
      } catch {
        // Fallback to the base activity endpoint
        // The /activity endpoint returns { items: [], has_more, total }
        const response = await api.get<{ items: Activity[]; has_more: boolean; total: number }>(
          endpoints.activity,
          params
        );
        return response.data?.items ?? [];
      }
    },
    staleTime: 15_000,
    refetchInterval: POLL_INTERVAL,
    refetchIntervalInBackground: false,
  });

  // Convert activities to notifications
  const notifications: Notification[] = (rawActivities ?? [])
    .map((a) => activityToNotification(a, readIds))
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, MAX_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        persistReadIds(next);
        return next;
      });
    },
    []
  );

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(String(n.id)));
      persistReadIds(next);
      return next;
    });
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead,
    isLoading,
    isError,
  };
}
