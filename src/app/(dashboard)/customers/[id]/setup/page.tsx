"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Settings,
  Package,
  DollarSign,
  FileText,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useCustomer } from "@/hooks/use-customers";
import { cn } from "@/lib/utils";

interface SetupStatus {
  billing_config_complete: boolean;
  products_added: boolean;
  rate_template_applied: boolean;
  first_order_synced: boolean;
  first_invoice_created: boolean;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  isComplete: boolean;
  isOptional?: boolean;
}

export default function CustomerSetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: customerId } = use(params);

  const { data: customer, isLoading: customerLoading } = useCustomer(customerId);

  const { data: setupStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["customer-setup-status", customerId],
    queryFn: async () => {
      const response = await api.get<{ data: SetupStatus }>(
        `/api/v1/customers/${customerId}/setup-status`
      );
      return response.data?.data;
    },
  });

  const isLoading = customerLoading || statusLoading;

  const steps: SetupStep[] = [
    {
      id: "billing_config",
      title: "Configure Billing",
      description: "Set up billing rules, cadence, and payment terms",
      icon: Settings,
      href: `/billing/config/${customerId}`,
      isComplete: setupStatus?.billing_config_complete ?? false,
    },
    {
      id: "products",
      title: "Add Products",
      description: "Import or create product catalog for this customer",
      icon: Package,
      href: `/customers/${customerId}/products`,
      isComplete: setupStatus?.products_added ?? false,
    },
    {
      id: "rate_template",
      title: "Apply Rate Template",
      description: "Set service rates using a template or custom rates",
      icon: DollarSign,
      href: `/customers/${customerId}/apply-template`,
      isComplete: setupStatus?.rate_template_applied ?? false,
    },
    {
      id: "first_order",
      title: "First Order Sync",
      description: "Verify orders are syncing from WMS",
      icon: FileText,
      href: `/customers/${customerId}?tab=orders`,
      isComplete: setupStatus?.first_order_synced ?? false,
      isOptional: true,
    },
    {
      id: "first_invoice",
      title: "Create First Invoice",
      description: "Generate and send the first invoice",
      icon: Users,
      href: `/customers/${customerId}?tab=invoices`,
      isComplete: setupStatus?.first_invoice_created ?? false,
      isOptional: true,
    },
  ];

  const completedSteps = steps.filter((s) => s.isComplete).length;
  const requiredSteps = steps.filter((s) => !s.isOptional);
  const completedRequired = requiredSteps.filter((s) => s.isComplete).length;
  const progressPercent = Math.round((completedRequired / requiredSteps.length) * 100);

  const nextIncompleteStep = steps.find((s) => !s.isComplete && !s.isOptional);

  if (isLoading) {
    return <SetupSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/customers/${customerId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Setup</h1>
          <p className="text-muted-foreground">
            Complete the setup checklist for {customer?.name}
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Setup Progress</h3>
              <p className="text-sm text-muted-foreground">
                {completedRequired} of {requiredSteps.length} required steps completed
              </p>
            </div>
            <Badge
              variant={progressPercent === 100 ? "default" : "secondary"}
              className="text-lg px-3 py-1"
            >
              {progressPercent}%
            </Badge>
          </div>
          <Progress value={progressPercent} className="h-3" />
          {progressPercent === 100 && (
            <div className="mt-4 flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">All required steps complete!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isNext = step.id === nextIncompleteStep?.id;

          return (
            <Card
              key={step.id}
              className={cn(
                "transition-all",
                step.isComplete && "bg-muted/30",
                isNext && "border-primary shadow-md"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Step Number/Check */}
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      step.isComplete
                        ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                        : isNext
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {step.isComplete ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="font-semibold">{index + 1}</span>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{step.title}</h3>
                      {step.isOptional && (
                        <Badge variant="outline" className="text-xs">
                          Optional
                        </Badge>
                      )}
                      {step.isComplete && (
                        <Badge variant="default" className="bg-green-600">
                          Complete
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>

                  {/* Step Icon */}
                  <StepIcon className="h-5 w-5 text-muted-foreground shrink-0" />

                  {/* Action Button */}
                  <Button
                    variant={isNext ? "default" : step.isComplete ? "outline" : "secondary"}
                    size="sm"
                    asChild
                  >
                    <Link href={step.href}>
                      {step.isComplete ? "Review" : isNext ? "Start" : "Configure"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks while setting up this customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start" asChild>
              <Link href={`/customers/${customerId}/edit`}>
                <Settings className="mr-2 h-4 w-4" />
                Edit Customer Info
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href={`/billing/config/${customerId}`}>
                <DollarSign className="mr-2 h-4 w-4" />
                Billing Rules
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/admin/sync-status">
                <FileText className="mr-2 h-4 w-4" />
                Check Sync Status
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href={`/customers/${customerId}`}>
                <Users className="mr-2 h-4 w-4" />
                View Customer
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SetupSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-1" />
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-4" />
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64 mt-2" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
