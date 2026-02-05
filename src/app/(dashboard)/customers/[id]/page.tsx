"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Package,
  FileText,
  Boxes,
  Settings,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCustomer, useCustomerBillingConfig } from "@/hooks/use-customers";
import { useCustomerContext } from "@/hooks/use-customer-context";
import { formatDate, formatCurrency } from "@/lib/format";
import { CustomerOrdersTab } from "./orders-tab";
import { CustomerInvoicesTab } from "./invoices-tab";
import { CustomerProductsTab } from "./products-tab";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: customer, isLoading, error } = useCustomer(id);
  const { data: billingConfig, isLoading: billingLoading } = useCustomerBillingConfig(id);
  const { customerId: contextCustomerId, setContext, isActive } = useCustomerContext();

  // Auto-set customer context when viewing a customer detail page
  useEffect(() => {
    if (customer) {
      setContext(customer.id, customer.name);
    }
  }, [customer, setContext]);

  if (error) {
    notFound();
  }

  if (isLoading) {
    return <CustomerDetailSkeleton />;
  }

  if (!customer) {
    notFound();
  }

  const isCurrentContext = isActive && contextCustomerId === customer.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
              <Badge
                variant={
                  customer.status === "active"
                    ? "default"
                    : customer.status === "inactive"
                    ? "secondary"
                    : "destructive"
                }
              >
                {customer.status}
              </Badge>
              {isCurrentContext && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                      <UserCheck className="mr-1 h-3 w-3" />
                      Working Customer
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    This customer is set as your current working context
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <p className="text-muted-foreground">Customer Code: {customer.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/billing/config/${customer.id}`}>
              <Settings className="mr-2 h-4 w-4" />
              Billing Config
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/customers/${customer.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contact</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {customer.email && (
                <p className="text-sm">
                  <a href={`mailto:${customer.email}`} className="hover:underline">
                    {customer.email}
                  </a>
                </p>
              )}
              {customer.phone && (
                <p className="text-sm flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {customer.phone}
                </p>
              )}
              {!customer.email && !customer.phone && (
                <p className="text-sm text-muted-foreground">No contact info</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Address</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {customer.address || <span className="text-muted-foreground">No address</span>}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Terms</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Net {customer.payment_terms}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatDate(customer.created_at)}</p>
            {customer.updated_at && (
              <p className="text-xs text-muted-foreground">
                Updated: {formatDate(customer.updated_at)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Billing Configuration Summary */}
      {billingConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Billing Configuration</CardTitle>
            <CardDescription>Current billing settings for this customer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm font-medium">Billing Cadence</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {billingConfig.billing_cadence}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Billing Day</p>
                <p className="text-sm text-muted-foreground">
                  Day {billingConfig.billing_day}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Auto Invoice</p>
                <Badge variant={billingConfig.auto_invoice ? "default" : "secondary"}>
                  {billingConfig.auto_invoice ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Included Charges</p>
                <div className="flex gap-1 flex-wrap mt-1">
                  {billingConfig.include_wms_charges && <Badge variant="outline">WMS</Badge>}
                  {billingConfig.include_shipping_charges && <Badge variant="outline">Shipping</Badge>}
                  {billingConfig.include_materials_charges && <Badge variant="outline">Materials</Badge>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for related data */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">
            <Package className="mr-2 h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <FileText className="mr-2 h-4 w-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="products">
            <Boxes className="mr-2 h-4 w-4" />
            Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <CustomerOrdersTab customerId={id} />
        </TabsContent>

        <TabsContent value="invoices">
          <CustomerInvoicesTab customerId={id} />
        </TabsContent>

        <TabsContent value="products">
          <CustomerProductsTab customerId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CustomerDetailSkeleton() {
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
              <Skeleton className="h-6 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
