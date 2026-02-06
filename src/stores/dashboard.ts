import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================================
// Types
// ============================================================================

export type WidgetType =
  | "revenue_mtd"
  | "orders_today"
  | "pending_invoices"
  | "overdue_invoices"
  | "recent_activity"
  | "revenue_chart"
  | "quick_actions"
  | "unbilled_charges"
  | "sync_status";

export type WidgetSize = "small" | "medium" | "large";

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  position: number;
  visible: boolean;
  size: WidgetSize;
}

export interface WidgetMetadata {
  type: WidgetType;
  label: string;
  description: string;
  defaultSize: WidgetSize;
}

/**
 * Registry of all available widget types with display metadata.
 * Used by the configuration dialog and the widget renderer.
 */
export const WIDGET_REGISTRY: WidgetMetadata[] = [
  {
    type: "revenue_mtd",
    label: "Revenue MTD",
    description: "Month-to-date revenue with trend comparison",
    defaultSize: "small",
  },
  {
    type: "orders_today",
    label: "Orders Today",
    description: "Today's order count with monthly total",
    defaultSize: "small",
  },
  {
    type: "pending_invoices",
    label: "Pending Invoices",
    description: "Count and total amount of pending invoices",
    defaultSize: "small",
  },
  {
    type: "overdue_invoices",
    label: "Overdue Invoices",
    description: "Count and total amount of overdue invoices",
    defaultSize: "small",
  },
  {
    type: "revenue_chart",
    label: "Revenue Trend",
    description: "Monthly revenue chart over the past 12 months",
    defaultSize: "large",
  },
  {
    type: "quick_actions",
    label: "Quick Actions",
    description: "Shortcuts to common billing tasks",
    defaultSize: "medium",
  },
  {
    type: "recent_activity",
    label: "Recent Activity",
    description: "Latest updates and events from the system",
    defaultSize: "medium",
  },
  {
    type: "unbilled_charges",
    label: "Unbilled Charges",
    description: "Summary of charges not yet invoiced",
    defaultSize: "medium",
  },
  {
    type: "sync_status",
    label: "Sync Status",
    description: "Data synchronization health and last sync times",
    defaultSize: "small",
  },
];

// ============================================================================
// Default Widget Layout
// ============================================================================

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "w-revenue-mtd", type: "revenue_mtd", position: 0, visible: true, size: "small" },
  { id: "w-orders-today", type: "orders_today", position: 1, visible: true, size: "small" },
  { id: "w-pending-invoices", type: "pending_invoices", position: 2, visible: true, size: "small" },
  { id: "w-overdue-invoices", type: "overdue_invoices", position: 3, visible: true, size: "small" },
  { id: "w-revenue-chart", type: "revenue_chart", position: 4, visible: true, size: "large" },
  { id: "w-quick-actions", type: "quick_actions", position: 5, visible: true, size: "medium" },
  { id: "w-recent-activity", type: "recent_activity", position: 6, visible: true, size: "medium" },
  { id: "w-unbilled-charges", type: "unbilled_charges", position: 7, visible: true, size: "medium" },
  { id: "w-sync-status", type: "sync_status", position: 8, visible: false, size: "small" },
];

// ============================================================================
// Store
// ============================================================================

interface DashboardState {
  widgetConfig: WidgetConfig[];
  toggleWidget: (id: string) => void;
  reorderWidgets: (orderedIds: string[]) => void;
  resetToDefault: () => void;
  moveWidget: (id: string, direction: "up" | "down") => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      widgetConfig: DEFAULT_WIDGETS,

      toggleWidget: (id: string) =>
        set((state) => ({
          widgetConfig: state.widgetConfig.map((w) =>
            w.id === id ? { ...w, visible: !w.visible } : w
          ),
        })),

      reorderWidgets: (orderedIds: string[]) =>
        set((state) => ({
          widgetConfig: state.widgetConfig
            .map((w) => {
              const newPosition = orderedIds.indexOf(w.id);
              return newPosition !== -1 ? { ...w, position: newPosition } : w;
            })
            .sort((a, b) => a.position - b.position),
        })),

      moveWidget: (id: string, direction: "up" | "down") =>
        set((state) => {
          const widgets = [...state.widgetConfig].sort(
            (a, b) => a.position - b.position
          );
          const currentIndex = widgets.findIndex((w) => w.id === id);
          if (currentIndex === -1) return state;

          const targetIndex =
            direction === "up" ? currentIndex - 1 : currentIndex + 1;
          if (targetIndex < 0 || targetIndex >= widgets.length) return state;

          // Swap positions
          const currentPos = widgets[currentIndex].position;
          const targetPos = widgets[targetIndex].position;

          return {
            widgetConfig: widgets.map((w) => {
              if (w.id === id) return { ...w, position: targetPos };
              if (w.id === widgets[targetIndex].id)
                return { ...w, position: currentPos };
              return w;
            }),
          };
        }),

      resetToDefault: () =>
        set({ widgetConfig: DEFAULT_WIDGETS }),
    }),
    {
      name: "dashboard-widget-config",
      version: 1,
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Returns only the visible widgets sorted by position.
 */
export function selectVisibleWidgets(state: DashboardState): WidgetConfig[] {
  return [...state.widgetConfig]
    .filter((w) => w.visible)
    .sort((a, b) => a.position - b.position);
}

/**
 * Returns all widgets sorted by position (for the config dialog).
 */
export function selectAllWidgetsSorted(state: DashboardState): WidgetConfig[] {
  return [...state.widgetConfig].sort((a, b) => a.position - b.position);
}

/**
 * Finds the metadata for a given widget type.
 */
export function getWidgetMeta(type: WidgetType): WidgetMetadata | undefined {
  return WIDGET_REGISTRY.find((m) => m.type === type);
}
