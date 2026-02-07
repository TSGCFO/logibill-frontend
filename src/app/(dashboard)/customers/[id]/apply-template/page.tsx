"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomer } from "@/hooks/use-customers";

// NOTE: POST /customers/{id}/apply-rate-template endpoint does not exist in backend.
// This page is a placeholder until the rate template feature is implemented.

export default function ApplyRateTemplatePage({
  params,
}: {
    params: Promise<{ id: string }>;
}) {
  const { id: customerId } = use(params);

  const { data: customer, isLoading } = useCustomer(customerId);

  if (isLoading) {
    return <ApplyTemplateSkeleton />;
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
          <h1 className="text-3xl font-bold tracking-tight">Apply Rate Template</h1>
          <p className="text-muted-foreground">
            Apply a rate template to {customer?.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rate Templates Coming Soon</CardTitle>
          <CardDescription>
            The rate template feature is under development. In the meantime, you can configure service rates directly from the billing configuration page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link href={`/customers/${customerId}`}>
                Back to Customer
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/billing/config/${customerId}`}>
                Configure Billing
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ApplyTemplateSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-1" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
