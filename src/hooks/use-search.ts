import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { SearchResult } from "@/types";

export function useSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      const response = await api.get<SearchResult[]>("/api/v1/search", {
        q: query,
      });
      return response.data;
    },
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 60, // 1 minute
  });
}
