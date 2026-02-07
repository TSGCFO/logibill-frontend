"use client";

import Link from "next/link";
import { Upload, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage product catalog and SKUs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/products/bulk-upload">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Link>
          </Button>
        </div>
      </div>

      <Alert>
        <Package className="h-4 w-4" />
        <AlertTitle>Products are synced from WMS</AlertTitle>
        <AlertDescription>
          Products are automatically synced from the Warehouse Management System
          (WMS). Individual product CRUD operations are not available. To add
          products in bulk, use the bulk upload feature. To view products for a
          specific customer, visit their customer detail page.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bulk Upload</CardTitle>
            <CardDescription>
              Import multiple products at once from a CSV file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV file with product data to create or update products
                in bulk.
              </p>
              <Button asChild>
                <Link href="/products/bulk-upload">
                  Go to Bulk Upload
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Products</CardTitle>
            <CardDescription>
              View products assigned to specific customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Products are associated with customers. Visit a customer&apos;s
                page to view and manage their product catalog.
              </p>
              <Button variant="outline" asChild>
                <Link href="/customers">
                  Browse Customers
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
