"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Product Detail
          </h1>
          <p className="text-muted-foreground">Product ID: {id}</p>
        </div>
      </div>

      <Alert>
        <Package className="h-4 w-4" />
        <AlertTitle>Product detail view is not available</AlertTitle>
        <AlertDescription>
          Individual product endpoints are not available. Products are managed
          through customer pages and WMS sync. Visit the customer who owns this
          product to view their product catalog.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>View Customer Products</CardTitle>
          <CardDescription>
            Products are accessible through the customer detail page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/customers">Browse Customers</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/products">Back to Products</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
