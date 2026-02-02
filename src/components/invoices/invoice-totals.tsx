"use client";

import * as React from "react";

import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface InvoiceTotalsProps {
  subtotal: number;
  tax: number;
  total: number;
  currency?: string;
  className?: string;
}

export function InvoiceTotals({
  subtotal,
  tax,
  total,
  currency = "USD",
  className,
}: InvoiceTotalsProps) {
  const formatOptions: Intl.NumberFormatOptions = {
    currency,
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span>{formatCurrency(subtotal, formatOptions)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Tax</span>
        <span>{formatCurrency(tax, formatOptions)}</span>
      </div>
      <Separator className="my-2" />
      <div className="flex items-center justify-between font-medium">
        <span>Total</span>
        <span className="text-lg">{formatCurrency(total, formatOptions)}</span>
      </div>
    </div>
  );
}
