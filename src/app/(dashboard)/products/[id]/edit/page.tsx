"use client";

import { useParams } from "next/navigation";
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

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;

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
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground">Product ID: {productId}</p>
        </div>
      </div>

      <Alert>
        <Package className="h-4 w-4" />
        <AlertTitle>Product editing is not available</AlertTitle>
        <AlertDescription>
          Individual product edit endpoints are not available. Products are
          managed through WMS sync and bulk upload. Use the bulk upload feature
          to update existing products by SKU.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Update Products via Bulk Upload</CardTitle>
          <CardDescription>
            Upload a CSV with updated product data to modify existing products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/products/bulk-upload">Go to Bulk Upload</Link>
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
