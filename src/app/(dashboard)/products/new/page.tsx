"use client";

import Link from "next/link";
import { ArrowLeft, Upload, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function NewProductPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">New Product</h1>
          <p className="text-muted-foreground">Add a new product to the catalog</p>
        </div>
      </div>

      <Alert>
        <Package className="h-4 w-4" />
        <AlertTitle>Individual product creation is not available</AlertTitle>
        <AlertDescription>
          Products can only be added via bulk upload or WMS sync. Individual
          product creation is not supported by the current API.
        </AlertDescription>
      </Alert>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Add Products via Bulk Upload</CardTitle>
          <CardDescription>
            Use the bulk upload feature to import products from a CSV file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Prepare a CSV file with your product data and upload it to create
              products in bulk.
            </p>
            <Button asChild>
              <Link href="/products/bulk-upload">
                <Upload className="mr-2 h-4 w-4" />
                Go to Bulk Upload
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
