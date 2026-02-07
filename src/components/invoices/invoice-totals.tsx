"use client";

import * as React from "react";

import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface InvoiceTotalsProps {
  subtotal: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  currency?: string;
  className?: string;
}

export function InvoiceTotals({
  subtotal,
  tax_amount,
  total_amount,
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
        <span>{formatCurrency(tax_amount, formatOptions)}</span>
      </div>
      <Separator className="my-2" />
      <div className="flex items-center justify-between font-medium">
        <span>Total</span>
        <span className="text-lg">{formatCurrency(total_amount, formatOptions)}</span>
      </div>
    </div>
  );
}
