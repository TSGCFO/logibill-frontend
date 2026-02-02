"use client";

import * as React from "react";
import {
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calculator,
  FileCode,
  Layers,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface RuleMatch {
  ruleId: string | number;
  ruleName: string;
  ruleType: string;
  matched: boolean;
  conditions: {
    field: string;
    operator: string;
    value: string | number | boolean;
    actual: string | number | boolean;
    passed: boolean;
  }[];
}

export interface CalculationDetail {
  label: string;
  formula?: string;
  value: number;
  unit?: string;
  breakdown?: {
    item: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
}

export interface EvaluationStep {
  stepNumber: number;
  name: string;
  description?: string;
  status: "success" | "failed" | "warning" | "skipped";
  duration?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  rules?: RuleMatch[];
  calculations?: CalculationDetail[];
}

export interface EvaluationTrace {
  id: string;
  entityType: string;
  entityId: string | number;
  startedAt: string;
  completedAt?: string;
  status: "success" | "failed" | "partial";
  steps: EvaluationStep[];
  totalAmount?: number;
  summary?: string;
}

export interface EvaluationTraceProps {
  trace: EvaluationTrace;
  className?: string;
  defaultExpanded?: boolean;
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    label: "Success",
  },
  failed: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    label: "Failed",
  },
  warning: {
    icon: AlertCircle,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    label: "Warning",
  },
  skipped: {
    icon: AlertCircle,
    color: "text-gray-500 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    label: "Skipped",
  },
  partial: {
    icon: AlertCircle,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    label: "Partial",
  },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

interface RuleMatchDisplayProps {
  rule: RuleMatch;
}

function RuleMatchDisplay({ rule }: RuleMatchDisplayProps) {
  return (
    <div
      data-slot="rule-match"
      className={cn(
        "rounded-md border p-3",
        rule.matched
          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
          : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{rule.ruleName}</span>
          <Badge variant="outline" className="text-xs">
            {rule.ruleType}
          </Badge>
        </div>
        {rule.matched ? (
          <Badge className="bg-green-600 hover:bg-green-600">Matched</Badge>
        ) : (
          <Badge variant="secondary">Not Matched</Badge>
        )}
      </div>

      {rule.conditions.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Conditions
          </p>
          <div className="space-y-1">
            {rule.conditions.map((condition, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs font-mono"
              >
                {condition.passed ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-600 shrink-0" />
                )}
                <span className="text-muted-foreground">{condition.field}</span>
                <span className="text-foreground">{condition.operator}</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {String(condition.value)}
                </span>
                <span className="text-muted-foreground">
                  (actual: {String(condition.actual)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface CalculationDisplayProps {
  calculation: CalculationDetail;
}

function CalculationDisplay({ calculation }: CalculationDisplayProps) {
  return (
    <div data-slot="calculation" className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{calculation.label}</span>
        </div>
        <span className="text-sm font-semibold">
          {formatCurrency(calculation.value)}
          {calculation.unit && (
            <span className="text-xs text-muted-foreground ml-1">
              {calculation.unit}
            </span>
          )}
        </span>
      </div>

      {calculation.formula && (
        <p className="mt-2 text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
          {calculation.formula}
        </p>
      )}

      {calculation.breakdown && calculation.breakdown.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Breakdown
          </p>
          <div className="space-y-1">
            {calculation.breakdown.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-muted-foreground">{item.item}</span>
                <span className="font-mono">
                  {item.quantity} x {formatCurrency(item.rate)} ={" "}
                  <span className="font-medium">
                    {formatCurrency(item.amount)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface StepDisplayProps {
  step: EvaluationStep;
  isLast: boolean;
}

function StepDisplay({ step, isLast }: StepDisplayProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const config = statusConfig[step.status];
  const StatusIcon = config.icon;
  const hasDetails =
    (step.rules && step.rules.length > 0) ||
    (step.calculations && step.calculations.length > 0) ||
    step.input ||
    step.output;

  return (
    <div data-slot="evaluation-step" className="relative">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-4 top-10 bottom-0 w-px bg-border" />
      )}

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger
          className={cn(
            "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
            hasDetails && "hover:bg-accent cursor-pointer",
            !hasDetails && "cursor-default"
          )}
          disabled={!hasDetails}
        >
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              config.bgColor
            )}
          >
            <StatusIcon className={cn("h-4 w-4", config.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Step {step.stepNumber}
              </span>
              {step.duration !== undefined && (
                <span className="text-xs text-muted-foreground">
                  ({formatDuration(step.duration)})
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-foreground">{step.name}</p>
            {step.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {step.description}
              </p>
            )}
          </div>

          {hasDetails && (
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                isOpen && "rotate-180"
              )}
            />
          )}
        </CollapsibleTrigger>

        {hasDetails && (
          <CollapsibleContent>
            <div className="ml-11 pb-3 space-y-3">
              {/* Rules section */}
              {step.rules && step.rules.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Rule Evaluation ({step.rules.filter((r) => r.matched).length}/
                      {step.rules.length} matched)
                    </p>
                  </div>
                  <div className="space-y-2">
                    {step.rules.map((rule, index) => (
                      <RuleMatchDisplay key={index} rule={rule} />
                    ))}
                  </div>
                </div>
              )}

              {/* Calculations section */}
              {step.calculations && step.calculations.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Calculations
                    </p>
                  </div>
                  <div className="space-y-2">
                    {step.calculations.map((calc, index) => (
                      <CalculationDisplay key={index} calculation={calc} />
                    ))}
                  </div>
                </div>
              )}

              {/* Input/Output JSON */}
              {(step.input || step.output) && (
                <div className="grid gap-2 md:grid-cols-2">
                  {step.input && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Input
                      </p>
                      <pre className="text-xs font-mono bg-muted p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(step.input, null, 2)}
                      </pre>
                    </div>
                  )}
                  {step.output && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Output
                      </p>
                      <pre className="text-xs font-mono bg-muted p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(step.output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

function EvaluationTraceComponent({
  trace,
  className,
  defaultExpanded = true,
}: EvaluationTraceProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const config = statusConfig[trace.status];
  const StatusIcon = config.icon;

  const duration =
    trace.completedAt && trace.startedAt
      ? new Date(trace.completedAt).getTime() -
        new Date(trace.startedAt).getTime()
      : undefined;

  return (
    <div
      data-slot="evaluation-trace"
      className={cn("border rounded-lg bg-card", className)}
    >
      {/* Header */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                config.bgColor
              )}
            >
              <StatusIcon className={cn("h-5 w-5", config.color)} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {trace.entityType} #{trace.entityId}
                </span>
                <Badge
                  variant={trace.status === "success" ? "default" : "secondary"}
                  className={cn(
                    trace.status === "success" && "bg-green-600 hover:bg-green-600",
                    trace.status === "failed" && "bg-red-600 hover:bg-red-600"
                  )}
                >
                  {config.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {trace.steps.length} steps
                {duration !== undefined && ` · ${formatDuration(duration)}`}
                {trace.totalAmount !== undefined &&
                  ` · Total: ${formatCurrency(trace.totalAmount)}`}
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <Separator />

          {/* Summary */}
          {trace.summary && (
            <div className="px-4 py-3 bg-muted/50">
              <p className="text-sm text-muted-foreground">{trace.summary}</p>
            </div>
          )}

          {/* Steps */}
          <div className="p-4 space-y-1">
            {trace.steps.map((step, index) => (
              <StepDisplay
                key={step.stepNumber}
                step={step}
                isLast={index === trace.steps.length - 1}
              />
            ))}
          </div>

          {/* Footer with total */}
          {trace.totalAmount !== undefined && (
            <>
              <Separator />
              <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                <span className="text-sm font-medium">Total Calculated Amount</span>
                <span className="text-lg font-semibold">
                  {formatCurrency(trace.totalAmount)}
                </span>
              </div>
            </>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export { EvaluationTraceComponent as EvaluationTrace };
