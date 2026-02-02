import { useQuery, useMutation } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import type {
  DashboardMetrics,
  RevenueReport,
  AgingReport,
  ProfitabilityReport,
  ExportReportResponse,
} from "@/types";

// ============================================================================
// Query Keys Factory
// ============================================================================

export const reportsKeys = {
  all: ["reports"] as const,
  dashboard: () => [...reportsKeys.all, "dashboard"] as const,
  revenue: (params?: RevenueReportParams) =>
    [...reportsKeys.all, "revenue", params] as const,
  aging: (params?: AgingReportParams) =>
    [...reportsKeys.all, "aging", params] as const,
  profitability: (params?: ProfitabilityReportParams) =>
    [...reportsKeys.all, "profitability", params] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface RevenueReportParams {
  start_date?: string;
  end_date?: string;
  customer_id?: number | string;
  group_by?: "day" | "week" | "month";
}

export interface AgingReportParams {
  as_of_date?: string;
  customer_id?: number | string;
}

export interface ProfitabilityReportParams {
  start_date?: string;
  end_date?: string;
  customer_id?: number | string;
}

export interface ExportReportParams {
  report_type: "revenue" | "aging" | "profitability" | "dashboard";
  format: "csv" | "xlsx" | "pdf";
  start_date?: string;
  end_date?: string;
  customer_id?: number | string;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch dashboard metrics for the overview page
 */
export function useDashboardMetrics() {
  return useQuery({
    queryKey: reportsKeys.dashboard(),
    queryFn: async (): Promise<DashboardMetrics> => {
      const response = await api.get<DashboardMetrics>(
        endpoints.reports.dashboard
      );
      if (!response.data) {
        throw new Error("Failed to fetch dashboard metrics");
      }
      return response.data;
    },
    staleTime: 60000, // 1 minute - dashboard data should be relatively fresh
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

/**
 * Fetch revenue report with optional filtering
 */
export function useRevenueReport(params?: RevenueReportParams) {
  return useQuery({
    queryKey: reportsKeys.revenue(params),
    queryFn: async (): Promise<RevenueReport> => {
      const response = await api.get<RevenueReport>(endpoints.reports.revenue, {
        start_date: params?.start_date,
        end_date: params?.end_date,
        customer_id: params?.customer_id,
        group_by: params?.group_by,
      });
      if (!response.data) {
        throw new Error("Failed to fetch revenue report");
      }
      return response.data;
    },
    staleTime: 120000, // 2 minutes
  });
}

/**
 * Fetch aging report (accounts receivable aging)
 */
export function useAgingReport(params?: AgingReportParams) {
  return useQuery({
    queryKey: reportsKeys.aging(params),
    queryFn: async (): Promise<AgingReport> => {
      const response = await api.get<AgingReport>(endpoints.reports.aging, {
        as_of_date: params?.as_of_date,
        customer_id: params?.customer_id,
      });
      if (!response.data) {
        throw new Error("Failed to fetch aging report");
      }
      return response.data;
    },
    staleTime: 120000, // 2 minutes
  });
}

/**
 * Fetch profitability report by customer and service
 */
export function useProfitabilityReport(params?: ProfitabilityReportParams) {
  return useQuery({
    queryKey: reportsKeys.profitability(params),
    queryFn: async (): Promise<ProfitabilityReport> => {
      const response = await api.get<ProfitabilityReport>(
        endpoints.reports.profitability,
        {
          start_date: params?.start_date,
          end_date: params?.end_date,
          customer_id: params?.customer_id,
        }
      );
      if (!response.data) {
        throw new Error("Failed to fetch profitability report");
      }
      return response.data;
    },
    staleTime: 120000, // 2 minutes
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Export a report and get download URL
 */
export function useExportReport() {
  return useMutation({
    mutationFn: async (
      params: ExportReportParams
    ): Promise<ExportReportResponse> => {
      const response = await api.post<ExportReportResponse>(
        endpoints.reports.export,
        params
      );
      if (!response.data) {
        throw new Error("Failed to export report");
      }
      return response.data;
    },
  });
}
