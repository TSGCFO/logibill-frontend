import { useQuery } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import { useDebounce } from "./use-debounce";
import type { SearchResult, SearchResponse } from "@/types";

// ============================================================================
// Query Keys Factory
// ============================================================================

export const searchKeys = {
  all: ["search"] as const,
  query: (q: string, types?: string[]) =>
    [...searchKeys.all, { q, types }] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface GlobalSearchOptions {
  types?: string[];
  limit?: number;
  enabled?: boolean;
}

// Re-export SearchResponse for backward compatibility
export type { SearchResponse };

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Global search across customers, orders, invoices, and products
 * Backend returns: { results: [...], counts: {...}, query, total }
 */
export function useGlobalSearch(
  query: string,
  options: GlobalSearchOptions = {}
) {
  const { types, limit = 10, enabled = true } = options;

  return useQuery({
    queryKey: searchKeys.query(query, types),
    queryFn: async (): Promise<SearchResult[]> => {
      const response = await api.get<SearchResponse | SearchResult[]>(endpoints.search, {
        q: query,
        types: types?.join(","),
        limit,
      });
      const raw = response.data;
      // Backend returns wrapped: { results: [...], counts, query, total }
      if (raw && "results" in raw && Array.isArray(raw.results)) {
        return raw.results;
      }
      // Fallback if response is a plain array
      return (raw as SearchResult[]) ?? [];
    },
    enabled: enabled && query.length >= 2,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}

/**
 * Debounced search hook - useful for search inputs
 * Automatically debounces the query to prevent excessive API calls
 */
export function useDebouncedSearch(
  query: string,
  debounceMs: number = 300,
  options: GlobalSearchOptions = {}
) {
  const debouncedQuery = useDebounce(query, debounceMs);

  const searchResult = useGlobalSearch(debouncedQuery, {
    ...options,
    enabled: options.enabled !== false && debouncedQuery.length >= 2,
  });

  return {
    ...searchResult,
    // Include the debounced query for UI feedback
    debouncedQuery,
    // Indicate if we're waiting for debounce
    isDebouncing: query !== debouncedQuery && query.length >= 2,
  };
}

/**
 * Simple search hook (backwards compatible with existing code)
 * @deprecated Use useGlobalSearch or useDebouncedSearch instead
 */
export function useSearch(query: string, enabled = true) {
  return useGlobalSearch(query, { enabled });
}
