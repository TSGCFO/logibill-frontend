"use client";

import { useMemo } from "react";
import { AlertCircle, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/format";
import { ChargeDisplay, ChargeDisplayCompact, type Charge } from "./charge-display";

export interface UnbilledCharge extends Charge {
  serviceType: string;
  createdAt: string;
}

interface UnbilledPreviewProps {
  charges: UnbilledCharge[];
  customerId: string;
  showBreakdown?: boolean;
  compactMode?: boolean;
  className?: string;
}

interface ServiceTypeBreakdown {
  serviceType: string;
  charges: UnbilledCharge[];
  total: number;
  count: number;
}

export function UnbilledPreview({
  charges,
  customerId,
  showBreakdown = true,
  compactMode = false,
  className,
}: UnbilledPreviewProps) {
  const { total, breakdown, chargeCount } = useMemo(() => {
    const breakdownMap = new Map<string, ServiceTypeBreakdown>();

    charges.forEach((charge) => {
      const existing = breakdownMap.get(charge.serviceType);
      if (existing) {
        existing.charges.push(charge);
        existing.total += charge.amount;
        existing.count += 1;
      } else {
        breakdownMap.set(charge.serviceType, {
          serviceType: charge.serviceType,
          charges: [charge],
          total: charge.amount,
          count: 1,
        });
      }
    });

    const breakdownArray = Array.from(breakdownMap.values()).sort(
      (a, b) => b.total - a.total
    );

    return {
      total: charges.reduce((sum, charge) => sum + charge.amount, 0),
      breakdown: breakdownArray,
      chargeCount: charges.length,
    };
  }, [charges]);

  if (charges.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No unbilled charges</p>
          <p className="text-sm text-muted-foreground/70">
            All charges have been invoiced
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Unbilled Charges
              <Badge variant="secondary">{formatNumber(chargeCount)}</Badge>
            </CardTitle>
            <CardDescription>
              Preview of charges pending invoicing for customer {customerId}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Pending</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showBreakdown && breakdown.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Breakdown by Service Type
            </p>
            <div className="space-y-2">
              {breakdown.map((item) => (
                <div
                  key={item.serviceType}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.serviceType}</span>
                    <Badge variant="outline" className="text-xs">
                      {formatNumber(item.count)} charge
                      {item.count !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!compactMode && charges.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Charge Details
              </p>
              <div className="divide-y">
                {charges.map((charge) => (
                  <ChargeDisplay
                    key={charge.id}
                    charge={charge}
                    showDetails={false}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {compactMode && charges.length > 0 && (
          <>
            <Separator />
            <div className="space-y-0.5">
              {charges.slice(0, 5).map((charge) => (
                <ChargeDisplayCompact key={charge.id} charge={charge} />
              ))}
              {charges.length > 5 && (
                <p className="text-xs text-muted-foreground pt-1">
                  +{formatNumber(charges.length - 5)} more charges
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="border-t bg-muted/50">
        <div className="flex w-full items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Total Unbilled
          </span>
          <span className="text-xl font-bold tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
