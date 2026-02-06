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
  date_from?: string;
  date_to?: string;
  customer_id?: number | string;
  /** Grouping period: daily, weekly, monthly, quarterly */
  period?: "daily" | "weekly" | "monthly" | "quarterly";
  /** Include breakdown: customer, service_type, none */
  group_by?: "customer" | "service_type" | "none";
}

export interface AgingReportParams {
  as_of_date?: string;
  customer_id?: number | string;
}

export interface ProfitabilityReportParams {
  date_from?: string;
  date_to?: string;
  customer_id?: number | string;
}

export interface ExportReportParams {
  type: "revenue" | "aging" | "profitability" | "dashboard";
  format: "csv" | "excel" | "pdf";
  date_from?: string;
  date_to?: string;
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
 * Fetch revenue report with optional filtering.
 *
 * Backend query params: period, date_from, date_to, customer_id, group_by
 */
export function useRevenueReport(params?: RevenueReportParams) {
  return useQuery({
    queryKey: reportsKeys.revenue(params),
    queryFn: async (): Promise<RevenueReport> => {
      const response = await api.get<RevenueReport>(endpoints.reports.revenue, {
        date_from: params?.date_from,
        date_to: params?.date_to,
        customer_id: params?.customer_id,
        period: params?.period,
        group_by: params?.group_by,
      });
      if (!response.data) {
        throw new Error("Failed to fetch revenue report");
      }
      return response.data;
    },
    enabled: !!(params?.date_from && params?.date_to),
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
 * Fetch profitability report by customer
 *
 * Backend query params: date_from, date_to, customer_id, min_revenue
 */
export function useProfitabilityReport(params?: ProfitabilityReportParams) {
  return useQuery({
    queryKey: reportsKeys.profitability(params),
    queryFn: async (): Promise<ProfitabilityReport> => {
      const response = await api.get<ProfitabilityReport>(
        endpoints.reports.profitability,
        {
          date_from: params?.date_from,
          date_to: params?.date_to,
          customer_id: params?.customer_id,
        }
      );
      if (!response.data) {
        throw new Error("Failed to fetch profitability report");
      }
      return response.data;
    },
    enabled: !!(params?.date_from && params?.date_to),
    staleTime: 120000, // 2 minutes
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Export a report via GET /api/v1/reports/export with query params.
 *
 * The backend returns either a file download (CSV/Excel) or a JSON response
 * with file_url (PDF). For CSV/Excel the browser handles the download directly.
 */
export function useExportReport() {
  return useMutation({
    mutationFn: async (
      params: ExportReportParams
    ): Promise<ExportReportResponse> => {
      const response = await api.get<ExportReportResponse>(
        endpoints.reports.export,
        {
          format: params.format,
          type: params.type,
          date_from: params.date_from,
          date_to: params.date_to,
          customer_id: params.customer_id,
        }
      );
      if (!response.data) {
        throw new Error("Failed to export report");
      }
      return response.data;
    },
  });
}
