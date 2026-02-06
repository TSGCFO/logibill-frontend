"use client";

import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  useDashboardStore,
  selectAllWidgetsSorted,
  getWidgetMeta,
} from "@/stores/dashboard";
import { ChevronUp, ChevronDown, RotateCcw } from "lucide-react";

interface WidgetConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WidgetConfigDialog({
  open,
  onOpenChange,
}: WidgetConfigDialogProps) {
  const widgets = useDashboardStore(selectAllWidgetsSorted);
  const toggleWidget = useDashboardStore((s) => s.toggleWidget);
  const moveWidget = useDashboardStore((s) => s.moveWidget);
  const resetToDefault = useDashboardStore((s) => s.resetToDefault);

  const handleReset = useCallback(() => {
    resetToDefault();
  }, [resetToDefault]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
          <DialogDescription>
            Toggle widgets on or off and reorder them to personalize your
            dashboard layout.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto -mx-6 px-6">
          <div className="space-y-1">
            {widgets.map((widget, index) => {
              const meta = getWidgetMeta(widget.type);
              if (!meta) return null;

              return (
                <div
                  key={widget.id}
                  className="flex items-center gap-3 rounded-md border p-3"
                >
                  {/* Reorder arrows */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      disabled={index === 0}
                      onClick={() => moveWidget(widget.id, "up")}
                      aria-label={`Move ${meta.label} up`}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      disabled={index === widgets.length - 1}
                      onClick={() => moveWidget(widget.id, "down")}
                      aria-label={`Move ${meta.label} down`}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Widget info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      {meta.label}
                    </p>
                    <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                      {meta.description}
                    </p>
                  </div>

                  {/* Toggle switch */}
                  <Switch
                    checked={widget.visible}
                    onCheckedChange={() => toggleWidget(widget.id)}
                    aria-label={`Toggle ${meta.label} widget`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Default
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
