"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type TrendType = "up" | "down" | "neutral";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: TrendType;
  changeLabel?: string;
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
  loading?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
}

const trendConfig: Record<
  TrendType,
  { icon: LucideIcon; color: string; bgColor: string }
> = {
  up: {
    icon: TrendingUp,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  down: {
    icon: TrendingDown,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  neutral: {
    icon: Minus,
    color: "text-gray-500 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
};

function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  changeLabel,
  icon: Icon,
  iconColor,
  className,
  loading = false,
  valuePrefix = "",
  valueSuffix = "",
}: StatCardProps) {
  if (loading) {
    return <StatCardSkeleton />;
  }

  const trendSettings = trendConfig[changeType];
  const TrendIcon = trendSettings.icon;
  const showChange = change !== undefined;

  // Auto-determine trend type if not provided but change is given
  const effectiveChangeType =
    change !== undefined && changeType === "neutral"
      ? change > 0
        ? "up"
        : change < 0
          ? "down"
          : "neutral"
      : changeType;

  const effectiveTrendSettings = trendConfig[effectiveChangeType];
  const EffectiveTrendIcon = effectiveTrendSettings.icon;

  return (
    <Card data-slot="stat-card" className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">
              {valuePrefix}
              {typeof value === "number" ? value.toLocaleString() : value}
              {valueSuffix}
            </p>
            {showChange && (
              <div className="flex items-center gap-1.5 pt-1">
                <div
                  className={cn(
                    "flex items-center gap-0.5 rounded-full px-1.5 py-0.5",
                    effectiveTrendSettings.bgColor
                  )}
                >
                  <EffectiveTrendIcon
                    className={cn("h-3 w-3", effectiveTrendSettings.color)}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium",
                      effectiveTrendSettings.color
                    )}
                  >
                    {formatChange(change)}
                  </span>
                </div>
                {changeLabel && (
                  <span className="text-xs text-muted-foreground">
                    {changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          {Icon && (
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                iconColor
                  ? iconColor
                  : "bg-primary/10 text-primary"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { StatCard, StatCardSkeleton };
