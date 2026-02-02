"use client";

import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/format";

export interface Charge {
  id: string;
  service: string;
  description?: string;
  quantity: number;
  unit?: string;
  rate: number;
  amount: number;
  metadata?: Record<string, string | number>;
}

interface ChargeDisplayProps {
  charge: Charge;
  showDetails?: boolean;
  className?: string;
}

export function ChargeDisplay({
  charge,
  showDetails = true,
  className,
}: ChargeDisplayProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 py-3",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{charge.service}</p>
        </div>
        {charge.description && (
          <p className="text-sm text-muted-foreground truncate">
            {charge.description}
          </p>
        )}
        {showDetails && (
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              {formatNumber(charge.quantity)} {charge.unit || "units"}
            </span>
            <span>@</span>
            <span>{formatCurrency(charge.rate)} each</span>
          </div>
        )}
        {showDetails && charge.metadata && Object.keys(charge.metadata).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(charge.metadata).map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs"
              >
                <span className="text-muted-foreground">{key}:</span>
                <span className="ml-1 font-medium">{value}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="font-semibold tabular-nums">
          {formatCurrency(charge.amount)}
        </p>
      </div>
    </div>
  );
}

interface ChargeDisplayCompactProps {
  charge: Charge;
  className?: string;
}

export function ChargeDisplayCompact({
  charge,
  className,
}: ChargeDisplayCompactProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 py-1.5 text-sm",
        className
      )}
    >
      <span className="truncate">{charge.service}</span>
      <span className="font-medium tabular-nums shrink-0">
        {formatCurrency(charge.amount)}
      </span>
    </div>
  );
}
