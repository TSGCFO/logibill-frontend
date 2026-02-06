"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useDashboardMetrics } from "@/hooks/use-billing";
import {
  DashboardWidget,
  getWidgetGridClass,
  WidgetConfigDialog,
} from "@/components/dashboard";
import {
  useDashboardStore,
  selectVisibleWidgets,
  type WidgetSize,
} from "@/stores/dashboard";
import { cn } from "@/lib/utils";

// ============================================================================
// Layout helpers
// ============================================================================

/**
 * Groups widgets into layout rows for the dashboard grid.
 *
 * Small widgets (1-col) are batched into rows of up to 4.
 * Medium widgets (2-col) share a row in pairs, or combine with small widgets.
 * Large widgets (4-col / full-width) always occupy an entire row.
 *
 * Returns a flat array of { widget, gridClass } entries that can be rendered
 * sequentially inside a `grid-cols-4` container.
 */
function buildWidgetLayout(
  widgets: { id: string; type: string; size: WidgetSize }[]
) {
  return widgets.map((w) => ({
    widget: w,
    gridClass: getWidgetGridClass(w.size),
  }));
}

// ============================================================================
// Page Component
// ============================================================================

export default function DashboardPage() {
  const { data: metrics, isLoading } = useDashboardMetrics();
  const visibleWidgets = useDashboardStore(useShallow(selectVisibleWidgets));
  const [configOpen, setConfigOpen] = useState(false);

  const layout = buildWidgetLayout(visibleWidgets);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your billing operations
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfigOpen(true)}
          className="gap-1.5"
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Customize</span>
        </Button>
      </div>

      {/* Dynamic Widget Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {layout.map(({ widget, gridClass }) => (
          <div key={widget.id} className={cn(gridClass)}>
            <DashboardWidget
              type={widget.type as Parameters<typeof DashboardWidget>[0]["type"]}
              size={widget.size}
              metrics={metrics}
              isLoading={isLoading}
            />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {visibleWidgets.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Settings2 className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No widgets visible</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Enable widgets to see your billing overview at a glance.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfigOpen(true)}
          >
            Customize Dashboard
          </Button>
        </div>
      )}

      {/* Configuration Dialog */}
      <WidgetConfigDialog open={configOpen} onOpenChange={setConfigOpen} />
    </div>
  );
}
