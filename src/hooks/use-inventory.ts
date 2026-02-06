import { useQuery } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import type {
  InventoryItem,
  InventorySummary,
  InventoryTransaction,
  PaginatedResponse,
} from "@/types";

// ============================================================================
// Query Keys Factory
// ============================================================================

export const inventoryKeys = {
  all: ["inventory"] as const,
  lists: () => [...inventoryKeys.all, "list"] as const,
  list: (filters: InventoryParams) =>
    [...inventoryKeys.lists(), filters] as const,
  summary: (customerId?: number | string) =>
    [...inventoryKeys.all, "summary", { customerId }] as const,
  transactions: () => [...inventoryKeys.all, "transactions"] as const,
  transactionList: (filters: InventoryTransactionParams) =>
    [...inventoryKeys.transactions(), filters] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface InventoryParams {
  page?: number;
  per_page?: number;
  customer_id?: number | string;
  location?: string;
  search?: string;
  low_stock?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface InventoryTransactionParams {
  page?: number;
  per_page?: number;
  customer_id?: number | string;
  product_id?: number | string;
  transaction_type?: string;
  date_from?: string;
  date_to?: string;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch paginated inventory levels with optional filters
 */
export function useInventory(params: InventoryParams = {}) {
  return useQuery({
    queryKey: inventoryKeys.list(params),
    queryFn: async (): Promise<PaginatedResponse<InventoryItem>> => {
      const response = await api.get<InventoryItem[]>(
        endpoints.inventory.list,
        {
          page: params.page,
          per_page: params.per_page,
          customer_id: params.customer_id,
          location: params.location,
          search: params.search,
          low_stock: params.low_stock,
          sort_by: params.sort_by,
          sort_order: params.sort_order,
        }
      );

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
 * Fetch inventory summary statistics
 */
export function useInventorySummary(customerId?: number | string) {
  return useQuery({
    queryKey: inventoryKeys.summary(customerId),
    queryFn: async (): Promise<InventorySummary> => {
      const response = await api.get<InventorySummary>(
        endpoints.inventory.summary,
        customerId ? { customer_id: customerId } : undefined
      );

      return (
        response.data ?? {
          total_skus: 0,
          total_quantity: 0,
          total_locations: 0,
          low_stock_count: 0,
        }
      );
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Fetch paginated inventory transactions with optional filters
 */
export function useInventoryTransactions(
  params: InventoryTransactionParams = {}
) {
  return useQuery({
    queryKey: inventoryKeys.transactionList(params),
    queryFn: async (): Promise<PaginatedResponse<InventoryTransaction>> => {
      const response = await api.get<InventoryTransaction[]>(
        endpoints.inventory.transactions,
        {
          page: params.page,
          per_page: params.per_page,
          customer_id: params.customer_id,
          product_id: params.product_id,
          transaction_type: params.transaction_type,
          date_from: params.date_from,
          date_to: params.date_to,
        }
      );

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
