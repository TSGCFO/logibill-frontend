import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";

// ============================================================================
// Types
// ============================================================================

export interface SyncStatus {
  wms: {
    last_sync_at: string | null;
    status: "idle" | "running" | "completed" | "failed";
    records_synced: number;
    errors: string[] | null;
  };
  techship: {
    last_sync_at: string | null;
    status: "idle" | "running" | "completed" | "failed";
    records_synced: number;
    errors: string[] | null;
  };
}

export interface SyncTriggerResponse {
  message: string;
  job_id: string;
  estimated_duration_seconds: number;
}

export interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "customer" | "accountant" | "viewer";
  customer_id: number | null;
  company_id: number;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
  name: string | null;
}

export interface CreateUserData {
  email: string;
  password: string;
  role: "admin" | "customer" | "accountant" | "viewer";
  customer_id?: number | null;
  name?: string;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  role?: "admin" | "customer" | "accountant" | "viewer";
  customer_id?: number | null;
  name?: string;
  is_active?: boolean;
}

export interface ConfigVersion {
  id: number;
  customer_id: number;
  version: number;
  config_data: Record<string, unknown>;
  created_by: string;
  created_at: string;
  change_summary: string | null;
  is_active: boolean;
}

// ============================================================================
// Query Keys Factory
// ============================================================================

export const adminKeys = {
  all: ["admin"] as const,
  syncStatus: () => [...adminKeys.all, "sync-status"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  user: (id: string) => [...adminKeys.all, "user", id] as const,
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
    queryFn: async (): Promise<SyncStatus> => {
      const response = await api.get<SyncStatus>(endpoints.admin.syncStatus);
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
      const response = await api.get<AdminUser[]>(endpoints.admin.users);
      return response.data ?? [];
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Fetch a single admin user by ID
 * GET /api/v1/admin/users/{id}
 */
export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminKeys.user(id),
    queryFn: async (): Promise<AdminUser> => {
      const response = await api.get<AdminUser>(endpoints.admin.userDetail(id));
      if (!response.data) {
        throw new Error("User not found");
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

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
    onSuccess: (newUser) => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });

      // Set the new user in cache
      queryClient.setQueryData(adminKeys.user(newUser.id), newUser);
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
    onSuccess: (updatedUser, { id }) => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });

      // Update the specific user in cache
      queryClient.setQueryData(adminKeys.user(id), updatedUser);
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
    onSuccess: (_, deletedId) => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });

      // Remove the deleted user from cache
      queryClient.removeQueries({ queryKey: adminKeys.user(deletedId) });
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
      const response = await api.get<ConfigVersion[]>(
        endpoints.admin.configVersions(customerId)
      );
      return response.data ?? [];
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
    invalidateUser: (id: string) =>
      queryClient.invalidateQueries({ queryKey: adminKeys.user(id) }),
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
        const response = await api.get<AdminUser[]>(endpoints.admin.users);
        return response.data ?? [];
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
        const response = await api.get<ConfigVersion[]>(
          endpoints.admin.configVersions(customerId)
        );
        return response.data ?? [];
      },
      staleTime: 60000,
    });
  };
}
