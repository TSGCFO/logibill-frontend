"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Truck,
  Hash,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrder } from "@/hooks/use-orders";
import { formatDate, formatCurrency } from "@/lib/format";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: order, isLoading, error } = useOrder(id);
  // Items and packages are embedded in the order detail response
  const items = order?.items;
  const packages = order?.packages;

  if (error) {
    notFound();
  }

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Order {order.wms_order_id}
              </h1>
              <Badge
                variant={
                  order.status === "shipped"
                    ? "default"
                    : order.status === "pending"
                    ? "secondary"
                    : "outline"
                }
              >
                {order.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              <Link
                href={`/customers/${order.customer_id}`}
                className="hover:underline"
              >
                {order.customer?.name || `Customer #${order.customer_id}`}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Type</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-lg">
              {order.order_type}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{order.total_items ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Packages</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{order.total_packages ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billed</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{order.is_billed ? "Yes" : "No"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Order Info */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">WMS Order ID</span>
              <span className="font-mono">{order.wms_order_id}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Date</span>
              <span>{order.order_date ? formatDate(order.order_date) : "-"}</span>
            </div>
            {order.ship_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ship Date</span>
                <span>{formatDate(order.ship_date)}</span>
              </div>
            )}
            {order.updated_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formatDate(order.updated_at)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <Link
                  href={`/customers/${order.customer_id}`}
                  className="text-lg font-medium hover:underline"
                >
                  {order.customer?.name || `Customer #${order.customer_id}`}
                </Link>
                {order.customer?.external_id && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.customer.external_id}
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/customers/${order.customer_id}`}>
                  View Customer
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items and Packages Tabs */}
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">
            <Boxes className="mr-2 h-4 w-4" />
            Items ({order.total_items ?? 0})
          </TabsTrigger>
          <TabsTrigger value="packages">
            <Truck className="mr-2 h-4 w-4" />
            Packages ({order.total_packages ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                Products included in this order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Shipped</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items && items.length > 0 ? (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono font-medium">
                          {item.sku}
                        </TableCell>
                        <TableCell>{item.product_name || "-"}</TableCell>
                        <TableCell className="text-right">
                          {item.quantity_ordered}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity_shipped}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.unit_price
                            ? formatCurrency(item.unit_price)
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Boxes className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">No items found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages">
          <Card>
            <CardHeader>
              <CardTitle>Packages</CardTitle>
              <CardDescription>
                Shipping packages for this order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking Number</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead>Dimensions</TableHead>
                    <TableHead className="text-right">Billable Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages && packages.length > 0 ? (
                    packages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-mono">
                          {pkg.tracking_number || "-"}
                        </TableCell>
                        <TableCell>{pkg.carrier || "-"}</TableCell>
                        <TableCell>{pkg.service_type || "-"}</TableCell>
                        <TableCell className="text-right">
                          {pkg.weight ? `${pkg.weight} lbs` : "-"}
                        </TableCell>
                        <TableCell>
                          {[pkg.length, pkg.width, pkg.height].filter(Boolean).join(" x ") || "-"}
                          {pkg.length ? " in" : ""}
                        </TableCell>
                        <TableCell className="text-right">
                          {pkg.billable_weight_lb
                            ? `${pkg.billable_weight_lb} lbs`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Truck className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">No packages found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
