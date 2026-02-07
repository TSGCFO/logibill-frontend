"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Search, Package, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Customer, Product } from "@/types";
import { Loader2 } from "lucide-react";

export default function CustomerProductsPage() {
  const params = useParams();
  const customerId = params.id as string;
  const [searchQuery, setSearchQuery] = useState("");

  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      const response = await api.get<{ data: Customer }>(
        `/api/v1/customers/${customerId}`
      );
      return response.data?.data;
    },
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["customer-products", customerId],
    queryFn: async () => {
      const response = await api.get<{ data: Product[] }>(
        `/api/v1/customers/${customerId}/products`
      );
      return response.data?.data;
    },
  });

  const filteredProducts = productsData?.filter(
    (product) =>
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (customerLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
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
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {customerData?.name} - Products
          </h1>
          <p className="text-muted-foreground">
            Manage products assigned to this customer
          </p>
        </div>
        <Button asChild>
          <Link href={`/products/new?customer_id=${customerId}`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                {filteredProducts?.length ?? 0} products assigned
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono">{product.sku}</TableCell>
                    <TableCell className="font-medium">{product.description || "-"}</TableCell>
                    <TableCell>{product.category || "-"}</TableCell>
                    <TableCell>
                      {product.weight_lb ? `${product.weight_lb} lbs` : "-"}
                    </TableCell>
                    <TableCell>
                      {[product.length_in, product.width_in, product.height_in].filter(Boolean).join(" x ") || "-"}
                      {product.length_in ? " in" : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.wms_is_active ? "default" : "secondary"}>
                        {product.wms_is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/products/${product.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/products/${product.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Add products to this customer"}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href={`/products/new?customer_id=${customerId}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
