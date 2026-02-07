import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import type {
  SyncStatusItem,
  SyncTriggerResponse,
  AdminUser,
  ConfigVersion,
  PaginatedResponse,
} from "@/types";

// ============================================================================
// Re-export types for backward compatibility
// ============================================================================

export type { SyncStatusItem, SyncTriggerResponse, AdminUser, ConfigVersion };

export interface CreateUserData {
  email: string;
  display_name?: string;
  supabase_user_id: string;
  role: "admin" | "customer" | "accountant" | "viewer";
  customer_id?: number | null;
}

export interface UpdateUserData {
  email?: string;
  display_name?: string;
  role?: "admin" | "customer" | "accountant" | "viewer";
  customer_id?: number | null;
  is_active?: boolean;
}

// ============================================================================
// Query Keys Factory
// ============================================================================

export const adminKeys = {
  all: ["admin"] as const,
  syncStatus: () => [...adminKeys.all, "sync-status"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  configVersions: (customerId: number | string) =>
    [...adminKeys.all, "config-versions", customerId] as const,
};

// ============================================================================
// Sync Status Query Hooks
// ============================================================================

/**
 * Fetch sync status for WMS and TechShip integrations
 * GET /api/v1/admin/sync/status
 */
export function useSyncStatus() {
  return useQuery({
    queryKey: adminKeys.syncStatus(),
    queryFn: async (): Promise<SyncStatusItem[]> => {
      const response = await api.get<SyncStatusItem[]>(endpoints.admin.syncStatus);
      if (!response.data) {
        throw new Error("Failed to fetch sync status");
      }
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute to keep status current
  });
}

// ============================================================================
// Sync Trigger Mutation Hooks
// ============================================================================

/**
 * Trigger WMS sync
 * POST /api/v1/admin/sync/wms
 */
export function useTriggerWmsSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<SyncTriggerResponse> => {
      const response = await api.post<SyncTriggerResponse>(
        endpoints.admin.syncWms
      );
      if (!response.data) {
        throw new Error("Failed to trigger WMS sync");
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate sync status to reflect the running sync
      queryClient.invalidateQueries({ queryKey: adminKeys.syncStatus() });

      // After sync completes, orders and customers may be updated
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

/**
 * Trigger TechShip sync
 * POST /api/v1/admin/sync/techship
 */
export function useTriggerTechShipSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<SyncTriggerResponse> => {
      const response = await api.post<SyncTriggerResponse>(
        endpoints.admin.syncTechship
      );
      if (!response.data) {
        throw new Error("Failed to trigger TechShip sync");
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate sync status to reflect the running sync
      queryClient.invalidateQueries({ queryKey: adminKeys.syncStatus() });

      // After sync completes, shipping data may be updated
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// ============================================================================
// Granular WMS Sync Mutation Hooks
// ============================================================================

/**
 * Trigger full WMS sync (all entities)
 * POST /api/v1/admin/sync/wms/all
 */
export function useTriggerWmsSyncAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<SyncTriggerResponse> => {
      const response = await api.post<SyncTriggerResponse>(
        endpoints.wmsSync.all
      );
      if (!response.data) {
        throw new Error("Failed to trigger full WMS sync");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.syncStatus() });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

/**
 * Trigger WMS customer sync
 * POST /api/v1/admin/sync/wms/customers
 */
export function useTriggerWmsSyncCustomers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<SyncTriggerResponse> => {
      const response = await api.post<SyncTriggerResponse>(
        endpoints.wmsSync.customers
      );
      if (!response.data) {
        throw new Error("Failed to trigger WMS customer sync");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.syncStatus() });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

/**
 * Trigger WMS order sync for a specific customer
 * POST /api/v1/admin/sync/wms/orders/{customerId}
 */
export function useTriggerWmsSyncOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: number | string): Promise<SyncTriggerResponse> => {
      const response = await api.post<SyncTriggerResponse>(
        endpoints.wmsSync.orders(customerId)
      );
      if (!response.data) {
        throw new Error("Failed to trigger WMS order sync");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.syncStatus() });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

/**
 * Trigger WMS inventory sync for a specific customer
 * POST /api/v1/admin/sync/wms/inventory/{customerId}
 */
export function useTriggerWmsSyncInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: number | string): Promise<SyncTriggerResponse> => {
      const response = await api.post<SyncTriggerResponse>(
        endpoints.wmsSync.inventory(customerId)
      );
      if (!response.data) {
        throw new Error("Failed to trigger WMS inventory sync");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.syncStatus() });
    },
  });
}

/**
 * Trigger WMS product sync for a specific customer
 * POST /api/v1/admin/sync/wms/products/{customerId}
 */
export function useTriggerWmsSyncProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: number | string): Promise<SyncTriggerResponse> => {
      const response = await api.post<SyncTriggerResponse>(
        endpoints.wmsSync.products(customerId)
      );
      if (!response.data) {
        throw new Error("Failed to trigger WMS product sync");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.syncStatus() });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

/**
 * Trigger WMS product sync for all customers
 * POST /api/v1/admin/sync/wms/products/all
 */
export function useTriggerWmsSyncProductsAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<SyncTriggerResponse> => {
      const response = await api.post<SyncTriggerResponse>(
        endpoints.wmsSync.productsAll
      );
      if (!response.data) {
        throw new Error("Failed to trigger WMS product sync for all customers");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.syncStatus() });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// ============================================================================
// Admin Users Query Hooks
// ============================================================================

/**
 * Fetch all admin users
 * GET /api/v1/admin/users
 */
export function useAdminUsers() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: async (): Promise<AdminUser[]> => {
      const response = await api.get<PaginatedResponse<AdminUser> | AdminUser[]>(endpoints.admin.users);
      // Backend returns paginated_response: { data: [...], meta: {...} }
      const raw = response.data;
      if (raw && "data" in raw && Array.isArray(raw.data)) {
        return raw.data;
      }
      // Fallback if response is a plain array
      return (raw as AdminUser[]) ?? [];
    },
    staleTime: 60000, // 1 minute
  });
}

// NOTE: GET /admin/users/{id} does not exist in backend. Use useAdminUsers() list with client-side filter.

// ============================================================================
// Admin Users Mutation Hooks
// ============================================================================

/**
 * Create a new user
 * POST /api/v1/admin/users
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData): Promise<AdminUser> => {
      const response = await api.post<AdminUser>(endpoints.admin.users, data);
      if (!response.data) {
        throw new Error("Failed to create user");
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

/**
 * Update an existing user
 * PUT /api/v1/admin/users/{id}
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateUserData;
    }): Promise<AdminUser> => {
      const response = await api.put<AdminUser>(
        endpoints.admin.userDetail(id),
        data
      );
      if (!response.data) {
        throw new Error("Failed to update user");
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

/**
 * Delete a user
 * DELETE /api/v1/admin/users/{id}
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(endpoints.admin.userDetail(id));
    },
    onSuccess: () => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

// ============================================================================
// Config Versions Query Hooks
// ============================================================================

/**
 * Fetch configuration versions for a customer
 * GET /api/v1/config/versions/{customerId}
 */
export function useConfigVersions(customerId: number | string) {
  return useQuery({
    queryKey: adminKeys.configVersions(customerId),
    queryFn: async (): Promise<ConfigVersion[]> => {
      const response = await api.get<PaginatedResponse<ConfigVersion> | ConfigVersion[]>(
        endpoints.admin.configVersions(customerId)
      );
      // Backend returns paginated_response: { data: [...], meta: {...} }
      const raw = response.data;
      if (raw && "data" in raw && Array.isArray(raw.data)) {
        return raw.data;
      }
      return (raw as ConfigVersion[]) ?? [];
    },
    enabled: !!customerId,
    staleTime: 60000, // 1 minute
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Invalidate admin-related queries
 */
export function useInvalidateAdmin() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.all }),
    invalidateSyncStatus: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.syncStatus() }),
    invalidateUsers: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.users() }),
    invalidateConfigVersions: (customerId: number | string) =>
      queryClient.invalidateQueries({
        queryKey: adminKeys.configVersions(customerId),
      }),
  };
}

/**
 * Prefetch admin users for faster navigation
 */
export function usePrefetchAdminUsers() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: adminKeys.users(),
      queryFn: async (): Promise<AdminUser[]> => {
        const response = await api.get<PaginatedResponse<AdminUser> | AdminUser[]>(endpoints.admin.users);
        const raw = response.data;
        if (raw && "data" in raw && Array.isArray(raw.data)) {
          return raw.data;
        }
        return (raw as AdminUser[]) ?? [];
      },
      staleTime: 60000,
    });
  };
}

/**
 * Prefetch config versions for faster navigation
 */
export function usePrefetchConfigVersions() {
  const queryClient = useQueryClient();

  return (customerId: number | string) => {
    queryClient.prefetchQuery({
      queryKey: adminKeys.configVersions(customerId),
      queryFn: async (): Promise<ConfigVersion[]> => {
        const response = await api.get<PaginatedResponse<ConfigVersion> | ConfigVersion[]>(
          endpoints.admin.configVersions(customerId)
        );
        const raw = response.data;
        if (raw && "data" in raw && Array.isArray(raw.data)) {
          return raw.data;
        }
        return (raw as ConfigVersion[]) ?? [];
      },
      staleTime: 60000,
    });
  };
}
