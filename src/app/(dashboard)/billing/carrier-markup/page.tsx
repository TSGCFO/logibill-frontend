"use client";

import Link from "next/link";
import { Truck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CarrierMarkupPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Carrier Markup</h1>
          <p className="text-muted-foreground">
            Configure shipping cost markups by carrier and service level
          </p>
        </div>
      </div>

      <Alert>
        <Truck className="h-4 w-4" />
        <AlertTitle>Coming Soon</AlertTitle>
        <AlertDescription>
          Carrier markup configuration is not yet available. Shipping cost
          markups are currently managed through the shipping client mapping
          configuration.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Shipping Configuration</CardTitle>
          <CardDescription>
            In the meantime, you can manage shipping-related settings through the
            shipping client mapping page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Carrier markup endpoints are under development. Use the shipping
              client mapping to configure carrier-specific settings.
            </p>
            <Button asChild>
              <Link href="/shipping">
                Go to Shipping Configuration
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
