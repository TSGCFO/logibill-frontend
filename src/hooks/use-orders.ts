import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import type {
  Order,
  OrderItem,
  OrderPackage,
  PaginatedResponse,
} from "@/types";

// ============================================================================
// Query Keys Factory
// ============================================================================

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: OrdersParams) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: number | string) => [...orderKeys.details(), id] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface OrdersParams {
  page?: number;
  per_page?: number;
  customer_id?: number | string;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  order_type?: string;
}

export interface OrderWithDetails extends Order {
  items?: OrderItem[];
  packages?: OrderPackage[];
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch paginated list of orders with optional filters
 */
export function useOrders(params: OrdersParams = {}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: async (): Promise<PaginatedResponse<Order>> => {
      const response = await api.get<Order[]>(endpoints.orders.list, {
        page: params.page,
        per_page: params.per_page,
        customer_id: params.customer_id,
        status: params.status,
        date_from: params.date_from,
        date_to: params.date_to,
        search: params.search,
        order_type: params.order_type,
      });

      return {
        data: response.data ?? [],
        meta: response.meta ?? {
          page: params.page ?? 1,
          per_page: params.per_page ?? 20,
          total: 0,
          total_pages: 0,
        },
      };
    },
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch a single order by ID with items and packages
 * The API returns the order with nested items and packages included
 */
export function useOrder(id: number | string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async (): Promise<OrderWithDetails> => {
      const response = await api.get<OrderWithDetails>(
        endpoints.orders.detail(id)
      );
      if (!response.data) {
        throw new Error("Order not found");
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

// NOTE: useOrderItems and useOrderPackages removed - items/packages are
// embedded in the order detail response (order.items, order.packages).
// Use useOrder() and access order.items / order.packages directly.

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Prefetch orders for faster navigation
 */
export function usePrefetchOrders() {
  const queryClient = useQueryClient();

  return (params: OrdersParams = {}) => {
    queryClient.prefetchQuery({
      queryKey: orderKeys.list(params),
      queryFn: async (): Promise<PaginatedResponse<Order>> => {
        const response = await api.get<Order[]>(endpoints.orders.list, {
          page: params.page,
          per_page: params.per_page,
          customer_id: params.customer_id,
          status: params.status,
          date_from: params.date_from,
          date_to: params.date_to,
          search: params.search,
          order_type: params.order_type,
        });

        return {
          data: response.data ?? [],
          meta: response.meta ?? {
            page: params.page ?? 1,
            per_page: params.per_page ?? 20,
            total: 0,
            total_pages: 0,
          },
        };
      },
      staleTime: 30000,
    });
  };
}

/**
 * Prefetch a single order for faster navigation
 */
export function usePrefetchOrder() {
  const queryClient = useQueryClient();

  return (id: number | string) => {
    queryClient.prefetchQuery({
      queryKey: orderKeys.detail(id),
      queryFn: async (): Promise<OrderWithDetails> => {
        const response = await api.get<OrderWithDetails>(
          endpoints.orders.detail(id)
        );
        if (!response.data) {
          throw new Error("Order not found");
        }
        return response.data;
      },
      staleTime: 60000,
    });
  };
}

/**
 * Invalidate order-related queries (useful after mutations elsewhere)
 */
export function useInvalidateOrders() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: orderKeys.all }),
    invalidateLists: () =>
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() }),
    invalidateOrder: (id: number | string) =>
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) }),
  };
}
