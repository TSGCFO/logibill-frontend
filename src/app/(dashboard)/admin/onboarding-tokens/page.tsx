"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Key,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  MoreHorizontal,
  Trash2,
  Mail,
  RefreshCw,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OnboardingToken {
  id: string;
  token: string;
  company_name?: string;
  email?: string;
  created_at: string;
  expires_at: string;
  used: boolean;
  used_at?: string;
  created_by: string;
}

interface TokenStats {
  total: number;
  active: number;
  used: number;
  expired: number;
}

export default function OnboardingTokensPage() {
  const queryClient = useQueryClient();
  const [deleteTokenId, setDeleteTokenId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["onboarding-token-stats"],
    queryFn: async () => {
      const response = await api.get<{ data: TokenStats }>(
        "/api/v1/admin/onboarding-tokens/stats"
      );
      return response.data.data;
    },
  });

  const { data: tokensData, isLoading: tokensLoading } = useQuery({
    queryKey: ["onboarding-tokens", pagination],
    queryFn: async () => {
      const response = await api.get<{
        data: OnboardingToken[];
        meta: { total: number; total_pages: number };
      }>("/api/v1/admin/onboarding-tokens", {
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
      });
      return response.data;
    },
  });

  const deleteToken = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/v1/admin/onboarding-tokens/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tokens"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-token-stats"] });
      toast.success("Token deleted");
      setDeleteTokenId(null);
    },
    onError: () => {
      toast.error("Failed to delete token");
    },
  });

  const resendToken = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/api/v1/admin/onboarding-tokens/${id}/resend`);
    },
    onSuccess: () => {
      toast.success("Token resent successfully");
    },
    onError: () => {
      toast.error("Failed to resend token");
    },
  });

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("Token copied to clipboard");
  };

  const getTokenStatus = (token: OnboardingToken) => {
    if (token.used) return "used";
    if (new Date(token.expires_at) < new Date()) return "expired";
    return "active";
  };

  const columns: ColumnDef<OnboardingToken>[] = [
    {
      accessorKey: "token",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Token" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <code className="rounded bg-muted px-2 py-1 text-xs">
            {row.original.token.slice(0, 8)}...
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => copyToken(row.original.token)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      accessorKey: "company_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Company" />
      ),
      cell: ({ row }) => row.original.company_name || "-",
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => row.original.email || "-",
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => formatDateTime(row.original.created_at),
    },
    {
      accessorKey: "expires_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Expires" />
      ),
      cell: ({ row }) => formatDateTime(row.original.expires_at),
    },
    {
      id: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = getTokenStatus(row.original);
        return (
          <Badge
            variant={
              status === "active"
                ? "default"
                : status === "used"
                ? "secondary"
                : "destructive"
            }
          >
            {status === "active" && <Clock className="mr-1 h-3 w-3" />}
            {status === "used" && <CheckCircle className="mr-1 h-3 w-3" />}
            {status === "expired" && <XCircle className="mr-1 h-3 w-3" />}
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const status = getTokenStatus(row.original);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => copyToken(row.original.token)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Token
              </DropdownMenuItem>
              {status === "active" && row.original.email && (
                <DropdownMenuItem
                  onClick={() => resendToken.mutate(row.original.id)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Email
                </DropdownMenuItem>
              )}
              {status !== "used" && (
                <DropdownMenuItem
                  onClick={() => setDeleteTokenId(row.original.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Onboarding Tokens</h1>
          <p className="text-muted-foreground">
            Generate and manage customer onboarding tokens
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/onboarding-tokens/new">
            <Plus className="mr-2 h-4 w-4" />
            Generate Token
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats?.active ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.used ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">
                {stats?.expired ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tokens Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tokens</CardTitle>
          <CardDescription>
            View and manage onboarding tokens for new customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={tokensData?.data ?? []}
            isLoading={tokensLoading}
            pageCount={tokensData?.meta?.total_pages ?? 0}
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            onPaginationChange={setPagination}
            manualPagination
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTokenId}
        onOpenChange={() => setDeleteTokenId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Token?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this onboarding token. The customer will
              no longer be able to use it to register.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTokenId && deleteToken.mutate(deleteTokenId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
