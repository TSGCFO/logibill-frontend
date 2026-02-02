"use client";

import { Edit2, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

export type BillingRuleType =
  | "flat"
  | "per_unit"
  | "tiered"
  | "volume"
  | "percentage";

export interface BillingRuleCondition {
  field: string;
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "contains";
  value: string | number;
}

export interface BillingRule {
  id: string;
  name: string;
  type: BillingRuleType;
  description?: string;
  conditions: BillingRuleCondition[];
  rate: number;
  minimumCharge?: number;
  maximumCharge?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BillingRulesListProps {
  rules: BillingRule[];
  onEdit?: (rule: BillingRule) => void;
  onDelete?: (rule: BillingRule) => void;
  className?: string;
}

const ruleTypeConfig: Record<
  BillingRuleType,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  flat: { label: "Flat Rate", variant: "default" },
  per_unit: { label: "Per Unit", variant: "secondary" },
  tiered: { label: "Tiered", variant: "outline" },
  volume: { label: "Volume", variant: "secondary" },
  percentage: { label: "Percentage", variant: "outline" },
};

const operatorLabels: Record<BillingRuleCondition["operator"], string> = {
  eq: "equals",
  ne: "not equals",
  gt: "greater than",
  gte: "greater than or equal",
  lt: "less than",
  lte: "less than or equal",
  contains: "contains",
};

function formatCondition(condition: BillingRuleCondition): string {
  return `${condition.field} ${operatorLabels[condition.operator]} ${condition.value}`;
}

function formatRate(rule: BillingRule): string {
  if (rule.type === "percentage") {
    return `${rule.rate}%`;
  }
  return formatCurrency(rule.rate);
}

interface BillingRuleCardProps {
  rule: BillingRule;
  onEdit?: (rule: BillingRule) => void;
  onDelete?: (rule: BillingRule) => void;
}

function BillingRuleCard({ rule, onEdit, onDelete }: BillingRuleCardProps) {
  const typeConfig = ruleTypeConfig[rule.type];

  return (
    <Card className={cn(!rule.isActive && "opacity-60")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{rule.name}</CardTitle>
              <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
              {!rule.isActive && (
                <Badge variant="outline" className="text-muted-foreground">
                  Inactive
                </Badge>
              )}
            </div>
            {rule.description && (
              <CardDescription>{rule.description}</CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(rule)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(rule)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Conditions */}
        {rule.conditions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Conditions
            </p>
            <div className="flex flex-wrap gap-1">
              {rule.conditions.map((condition, index) => (
                <Badge key={index} variant="outline" className="font-mono text-xs">
                  {formatCondition(condition)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Rate Information */}
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Rate: </span>
            <span className="font-medium">{formatRate(rule)}</span>
            {rule.type === "per_unit" && (
              <span className="text-muted-foreground"> / unit</span>
            )}
          </div>
          {rule.minimumCharge !== undefined && (
            <div>
              <span className="text-muted-foreground">Min: </span>
              <span className="font-medium">
                {formatCurrency(rule.minimumCharge)}
              </span>
            </div>
          )}
          {rule.maximumCharge !== undefined && (
            <div>
              <span className="text-muted-foreground">Max: </span>
              <span className="font-medium">
                {formatCurrency(rule.maximumCharge)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function BillingRulesList({
  rules,
  onEdit,
  onDelete,
  className,
}: BillingRulesListProps) {
  if (rules.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No billing rules configured</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {rules.map((rule) => (
        <BillingRuleCard
          key={rule.id}
          rule={rule}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
