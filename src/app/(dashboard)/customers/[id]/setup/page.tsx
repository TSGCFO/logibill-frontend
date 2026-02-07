"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Package,
  DollarSign,
  FileText,
} from "lucide-react";
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

// NOTE: GET /customers/{id}/setup-status endpoint does not exist in backend.
// This page is a placeholder until the setup wizard feature is implemented.

export default function CustomerSetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: customerId } = use(params);

  const { data: customer, isLoading } = useCustomer(customerId);

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
            Setup wizard for {customer?.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setup Wizard Coming Soon</CardTitle>
          <CardDescription>
            The customer setup wizard is under development. In the meantime, use the quick actions below to configure this customer.
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
              <Link href={`/customers/${customerId}/products`}>
                <Package className="mr-2 h-4 w-4" />
                Products
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href={`/customers/${customerId}`}>
                <FileText className="mr-2 h-4 w-4" />
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
