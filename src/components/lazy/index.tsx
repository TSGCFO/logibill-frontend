"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Loading fallbacks for lazy components
const ChartSkeleton = () => (
  <div className="w-full h-[300px] flex items-center justify-center">
    <Skeleton className="w-full h-full rounded-lg" />
  </div>
);

const DialogSkeleton = () => (
  <div className="fixed inset-0 bg-background/80 flex items-center justify-center">
    <Skeleton className="w-[425px] h-[300px] rounded-lg" />
  </div>
);

const TableSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-10 w-full" />
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
);

// Lazy loaded chart components (heavy due to recharts)
export const LazyAreaChart = dynamic(
  () => import("recharts").then((mod) => mod.AreaChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export const LazyBarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export const LazyLineChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export const LazyPieChart = dynamic(
  () => import("recharts").then((mod) => mod.PieChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);

// Lazy loaded dialog components (not needed until user interaction)
export const LazyCarrierRuleDialog = dynamic(
  () =>
    import("@/components/billing/dialogs/carrier-rule-dialog").then(
      (mod) => mod.CarrierRuleDialog
    ),
  { loading: () => <DialogSkeleton /> }
);

export const LazyOrderTypeRuleDialog = dynamic(
  () =>
    import("@/components/billing/dialogs/order-type-rule-dialog").then(
      (mod) => mod.OrderTypeRuleDialog
    ),
  { loading: () => <DialogSkeleton /> }
);

export const LazyConditionalRuleDialog = dynamic(
  () =>
    import("@/components/billing/dialogs/conditional-rule-dialog").then(
      (mod) => mod.ConditionalRuleDialog
    ),
  { loading: () => <DialogSkeleton /> }
);

export const LazyInvoiceEmailPreviewDialog = dynamic(
  () =>
    import("@/components/invoices/invoice-email-preview-dialog").then(
      (mod) => mod.InvoiceEmailPreviewDialog
    ),
  { loading: () => <DialogSkeleton /> }
);

// Lazy loaded heavy table components
export const LazyMaterialsGlobalTable = dynamic(
  () =>
    import("@/components/materials/materials-global-table").then(
      (mod) => mod.MaterialsGlobalTable
    ),
  { loading: () => <TableSkeleton /> }
);

export const LazyMaterialsOverridesTable = dynamic(
  () =>
    import("@/components/materials/materials-overrides-table").then(
      (mod) => mod.MaterialsOverridesTable
    ),
  { loading: () => <TableSkeleton /> }
);

export const LazyPackagingRateCatalog = dynamic(
  () =>
    import("@/components/materials/packaging-rate-catalog").then(
      (mod) => mod.PackagingRateCatalog
    ),
  { loading: () => <TableSkeleton /> }
);

export const LazyMaterialsAuditLog = dynamic(
  () =>
    import("@/components/materials/materials-audit-log").then(
      (mod) => mod.MaterialsAuditLog
    ),
  { loading: () => <TableSkeleton /> }
);

// Lazy loaded command palette (only needed on keyboard shortcut)
export const LazyCommandPalette = dynamic(
  () =>
    import("@/components/layout/command-palette").then(
      (mod) => mod.CommandPalette
    ),
  { ssr: false }
);
