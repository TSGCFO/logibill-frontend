import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useRef } from "react";
import { api, endpoints } from "@/lib/api/client";
import type { Activity } from "@/types";

// ============================================================================
// Query Keys Factory
// ============================================================================

export const activityKeys = {
  all: ["activity"] as const,
  feed: (since?: string) => [...activityKeys.all, "feed", { since }] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface ActivityFeedOptions {
  since?: string;
  limit?: number;
  refetchInterval?: number;
}

export interface ActivityFeedResponse {
  activities: Activity[];
  has_more: boolean;
  next_cursor?: string;
}

export interface RealtimeActivityOptions {
  onActivity?: (activity: Activity) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  enabled?: boolean;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch activity feed with optional polling
 */
export function useActivityFeed(options: ActivityFeedOptions = {}) {
  const { since, limit = 20, refetchInterval } = options;

  return useQuery({
    queryKey: activityKeys.feed(since),
    queryFn: async (): Promise<Activity[]> => {
      // The /activity endpoint returns { items: [], has_more, total }
      const response = await api.get<{ items: Activity[]; has_more: boolean; total: number }>(
        endpoints.activity,
        { since, limit }
      );
      return response.data?.items ?? [];
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: refetchInterval, // Optional polling interval
  });
}

// ============================================================================
// Realtime Hooks
// ============================================================================

/**
 * Subscribe to realtime activity updates via Server-Sent Events (SSE)
 * This hook manages the EventSource connection lifecycle
 */
export function useRealtimeActivity(options: RealtimeActivityOptions = {}) {
  const { onActivity, onError, onOpen, enabled = true } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastActivity, setLastActivity] = useState<Activity | null>(null);
  const [error, setError] = useState<Event | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Store callbacks in refs to avoid reconnection on callback changes
  const onActivityRef = useRef(onActivity);
  const onErrorRef = useRef(onError);
  const onOpenRef = useRef(onOpen);

  useEffect(() => {
    onActivityRef.current = onActivity;
    onErrorRef.current = onError;
    onOpenRef.current = onOpen;
  }, [onActivity, onError, onOpen]);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const sseUrl = `${apiBase}${endpoints.activity}/stream`;

    try {
      const eventSource = new EventSource(sseUrl, {
        withCredentials: true,
      });

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        onOpenRef.current?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const activity: Activity = JSON.parse(event.data);
          setLastActivity(activity);
          onActivityRef.current?.(activity);
        } catch (parseError) {
          console.error("Failed to parse activity event:", parseError);
        }
      };

      eventSource.onerror = (err) => {
        setIsConnected(false);
        setError(err);
        onErrorRef.current?.(err);

        // Auto-reconnect after 5 seconds on error
        setTimeout(() => {
          if (enabled) {
            connect();
          }
        }, 5000);
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error("Failed to create EventSource:", err);
      setIsConnected(false);
    }
  }, [enabled]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Connect on mount/enable, disconnect on unmount/disable
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    lastActivity,
    error,
    connect,
    disconnect,
  };
}
