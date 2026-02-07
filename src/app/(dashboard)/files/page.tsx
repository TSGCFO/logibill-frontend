"use client";

import { useState, useMemo } from "react";
import { useFiles, useDeleteFile, useDownloadFile } from "@/hooks/use-files";
import type { FileRecord } from "@/types";
import Link from "next/link";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  Download,
  Trash2,
  MoreHorizontal,
  Search,
  Filter,
  FolderOpen,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/tables/data-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { formatDateTime } from "@/lib/format";

function formatFileSize(bytes: number | null): string {
  if (bytes == null || bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string | null) {
  if (mimeType === "application/pdf") {
    return <FileText className="h-4 w-4 text-red-500" />;
  }
  if (mimeType && (mimeType.includes("spreadsheet") || mimeType === "text/csv")) {
    return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
  }
  return <FileText className="h-4 w-4 text-blue-500" />;
}

function getColumns(
  onDownload: (id: number | string) => void,
  onDelete: (id: number | string) => void
): ColumnDef<FileRecord>[] {
  return [
    {
      accessorKey: "original_filename",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="File Name" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getFileIcon(row.original.mime_type)}
          <span className="font-medium">{row.original.original_filename}</span>
        </div>
      ),
    },
    {
      accessorKey: "entity_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.entity_type || row.original.file_type || "-"}</Badge>
      ),
    },
    {
      accessorKey: "file_size",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Size" />
      ),
      cell: ({ row }) => formatFileSize(row.original.file_size),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Uploaded" />
      ),
      cell: ({ row }) => (
        <div>
          <p>{formatDateTime(row.original.created_at)}</p>
          {row.original.uploaded_by && (
            <p className="text-xs text-muted-foreground">
              {row.original.uploaded_by}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onDownload(row.original.id)}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(row.original.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

export default function FilesPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Fetch files with type filter (pass undefined for "all" so the API returns everything)
  const filesParams = {
    ...(typeFilter !== "all" ? { type: typeFilter } : {}),
  };
  const { data: filesData, isLoading, isError, error } = useFiles(filesParams);

  const files = filesData?.data ?? [];

  // Mutations
  const deleteFile = useDeleteFile();
  const downloadFile = useDownloadFile();

  const handleDownload = (id: number | string) => {
    downloadFile.mutate(id);
  };

  const handleDelete = (id: number | string) => {
    deleteFile.mutate(id);
  };

  // Memoize columns so TanStack Table doesn't re-render needlessly
  const columns = useMemo(
    () => getColumns(handleDownload, handleDelete),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Compute stat card values from real data
  const totalFiles = files.length;
  const invoiceCount = files.filter((f) => f.entity_type === "invoice").length;
  const reportCount = files.filter((f) => f.entity_type === "report").length;
  const totalSize = files.reduce((sum, f) => sum + (f.file_size ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Files</h1>
          <p className="text-muted-foreground">
            Manage uploaded files, invoices, and reports
          </p>
        </div>
        <Button asChild>
          <Link href="/files/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : totalFiles}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <FileText className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : invoiceCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : reportCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatFileSize(totalSize)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Files</CardTitle>
          <CardDescription>
            View and manage all uploaded files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search files..." className="pl-9" />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="invoice">Invoices</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
                <SelectItem value="import">Imports</SelectItem>
                <SelectItem value="export">Exports</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading files...</span>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="flex items-center justify-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 py-8 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to load files{error instanceof Error ? `: ${error.message}` : "."}</span>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && files.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FolderOpen className="mb-4 h-12 w-12" />
              <p className="text-lg font-medium">No files found</p>
              <p className="text-sm">
                {typeFilter !== "all"
                  ? "Try changing the type filter or upload a new file."
                  : "Upload your first file to get started."}
              </p>
            </div>
          )}

          {/* Data table - only render when we have data */}
          {!isLoading && !isError && files.length > 0 && (
            <DataTable
              columns={columns}
              data={files}
              searchKey="original_filename"
              searchPlaceholder="Search files..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
