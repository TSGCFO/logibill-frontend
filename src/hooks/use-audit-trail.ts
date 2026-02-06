import { useQuery } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import type { AuditEntry, PaginatedResponse } from "@/types";

// ============================================================================
// Query Keys Factory
// ============================================================================

export const auditTrailKeys = {
  all: ["audit-trail"] as const,
  list: (params: AuditTrailParams) =>
    [...auditTrailKeys.all, "list", params] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface AuditTrailParams {
  page?: number;
  per_page?: number;
  user_email?: string;
  action?: string;
  resource_type?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch paginated audit trail entries
 */
export function useAuditTrail(params: AuditTrailParams = {}) {
  return useQuery({
    queryKey: auditTrailKeys.list(params),
    queryFn: async () => {
      const response = await api.get<AuditEntry[]>(endpoints.activity, {
        ...params,
      });
      return {
        data: response.data ?? [],
        meta: response.meta,
      } as PaginatedResponse<AuditEntry>;
    },
    staleTime: 30000,
  });
}
