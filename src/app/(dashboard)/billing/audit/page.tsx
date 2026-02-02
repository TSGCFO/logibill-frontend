"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Download,
  History,
  User,
  Clock,
  FileText,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useCustomers } from "@/hooks/use-customers";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Loader2 } from "lucide-react";

interface AuditEntry {
  id: string;
  timestamp: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  customer_id?: string;
  customer_name?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address?: string;
}

export default function BillingAuditPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");

  const { data: customersData } = useCustomers();
  const customers = customersData?.data ?? [];

  const { data: auditData, isLoading } = useQuery({
    queryKey: ["billing-audit", actionFilter, resourceFilter, customerFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (actionFilter !== "all") params.action = actionFilter;
      if (resourceFilter !== "all") params.resource_type = resourceFilter;
      if (customerFilter !== "all") params.customer_id = customerFilter;

      const response = await api.get<{ data: AuditEntry[] }>(
        "/api/v1/billing/audit",
        params
      );
      return response.data.data;
    },
  });

  const filteredEntries = auditData?.filter(
    (entry) =>
      searchQuery === "" ||
      entry.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.resource_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "create":
        return "default";
      case "update":
        return "secondary";
      case "delete":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Audit Log</h1>
          <p className="text-muted-foreground">
            Track all billing configuration changes
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, resource, or customer..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="billing_rule">Billing Rules</SelectItem>
                <SelectItem value="service_rate">Service Rates</SelectItem>
                <SelectItem value="materials_pricing">Materials Pricing</SelectItem>
                <SelectItem value="carrier_markup">Carrier Markup</SelectItem>
              </SelectContent>
            </Select>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={String(customer.id)}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Entries</CardTitle>
          <CardDescription>
            {filteredEntries?.length ?? 0} entries found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEntries && filteredEntries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDateTime(entry.timestamp)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{entry.user_email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(entry.action)}>
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{entry.resource_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.resource_id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.customer_name || "-"}
                    </TableCell>
                    <TableCell>
                      {entry.old_value || entry.new_value ? (
                        <Button variant="ghost" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          View Changes
                        </Button>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No audit entries</h3>
              <p className="text-muted-foreground">
                No billing changes have been recorded yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
