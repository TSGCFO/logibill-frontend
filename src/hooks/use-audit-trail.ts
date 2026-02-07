import { useQuery } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import type { AuditEntry } from "@/types";

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
  user_name?: string;
  type?: string;
  resource_type?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

interface AuditTrailResponse {
  items: AuditEntry[];
  total: number;
  has_more: boolean;
  oldest_timestamp?: string;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch paginated audit trail entries
 * Backend returns: { items: [...], total, has_more, oldest_timestamp }
 */
export function useAuditTrail(params: AuditTrailParams = {}) {
  return useQuery({
    queryKey: auditTrailKeys.list(params),
    queryFn: async () => {
      const response = await api.get<AuditTrailResponse>(endpoints.activity, {
        ...params,
      });
      const raw = response.data;
      const items = raw?.items ?? [];
      const total = raw?.total ?? items.length;
      const perPage = params.per_page ?? 20;
      return {
        data: items,
        meta: {
          page: params.page ?? 1,
          per_page: perPage,
          total,
          total_pages: Math.ceil(total / perPage),
          has_next: raw?.has_more ?? false,
        },
      };
    },
    staleTime: 30000,
  });
}
