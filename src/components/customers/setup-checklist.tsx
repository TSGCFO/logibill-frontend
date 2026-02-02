"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Circle, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { api } from "@/lib/api/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export type SetupStepStatus = "completed" | "pending" | "in_progress";

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  status: SetupStepStatus;
  href: string;
}

interface SetupChecklistProps {
  customerId: number | string;
  steps?: SetupStep[];
  className?: string;
}

interface CustomerSetupResponse {
  steps: SetupStep[];
  completed_count: number;
  total_count: number;
}

function useCustomerSetupSteps(customerId: number | string, initialSteps?: SetupStep[]) {
  return useQuery({
    queryKey: ["customers", customerId, "setup-steps"],
    queryFn: async () => {
      const response = await api.get<CustomerSetupResponse>(
        `/api/v1/customers/${customerId}/setup-steps`
      );
      return response.data;
    },
    enabled: !!customerId && !initialSteps,
    initialData: initialSteps
      ? {
          steps: initialSteps,
          completed_count: initialSteps.filter((s) => s.status === "completed").length,
          total_count: initialSteps.length,
        }
      : undefined,
  });
}

function getStatusIcon(status: SetupStepStatus) {
  switch (status) {
    case "completed":
      return <Check className="h-4 w-4 text-green-600" />;
    case "in_progress":
      return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
    case "pending":
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

function SetupStepItem({ step, customerId }: { step: SetupStep; customerId: number | string }) {
  const isCompleted = step.status === "completed";
  const href = step.href.replace(":customerId", String(customerId));

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-colors",
        isCompleted
          ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
          : "bg-background border-border hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full",
            isCompleted
              ? "bg-green-100 dark:bg-green-900/40"
              : "bg-muted"
          )}
        >
          {getStatusIcon(step.status)}
        </div>
        <div>
          <p
            className={cn(
              "font-medium text-sm",
              isCompleted && "text-green-700 dark:text-green-400"
            )}
          >
            {step.title}
          </p>
          <p className="text-xs text-muted-foreground">{step.description}</p>
        </div>
      </div>
      {!isCompleted && (
        <Button variant="ghost" size="sm" asChild>
          <Link href={href}>
            Complete
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      )}
    </div>
  );
}

function SetupChecklistSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-2 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SetupChecklist({ customerId, steps: initialSteps, className }: SetupChecklistProps) {
  const { data, isLoading, isError } = useCustomerSetupSteps(customerId, initialSteps);

  if (isLoading) {
    return <SetupChecklistSkeleton />;
  }

  if (isError || !data) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <p className="text-center text-sm text-muted-foreground">
            Failed to load setup checklist
          </p>
        </CardContent>
      </Card>
    );
  }

  const { steps, completed_count, total_count } = data;
  const progressPercent = total_count > 0 ? (completed_count / total_count) * 100 : 0;
  const isComplete = completed_count === total_count;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Setup Checklist</CardTitle>
        <CardDescription>
          {isComplete
            ? "All setup steps completed"
            : `${completed_count} of ${total_count} steps completed`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Progress value={progressPercent} />
          <p className="text-xs text-muted-foreground text-right">
            {Math.round(progressPercent)}% complete
          </p>
        </div>
        <div className="space-y-2">
          {steps.map((step) => (
            <SetupStepItem key={step.id} step={step} customerId={customerId} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
