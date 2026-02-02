"use client";

import { useState } from "react";
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

interface FileRecord {
  id: string;
  name: string;
  type: "invoice" | "report" | "import" | "export";
  mime_type: string;
  size: number;
  uploaded_by: string;
  uploaded_at: string;
  customer_code?: string;
}

const mockFiles: FileRecord[] = [
  {
    id: "1",
    name: "Invoice_VAS_2024-01.pdf",
    type: "invoice",
    mime_type: "application/pdf",
    size: 245000,
    uploaded_by: "admin@logibill.com",
    uploaded_at: "2024-01-15T10:30:00Z",
    customer_code: "VAS",
  },
  {
    id: "2",
    name: "Revenue_Report_Q4_2023.xlsx",
    type: "report",
    mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 892000,
    uploaded_by: "admin@logibill.com",
    uploaded_at: "2024-01-10T14:15:00Z",
  },
  {
    id: "3",
    name: "product_import_batch_001.csv",
    type: "import",
    mime_type: "text/csv",
    size: 45000,
    uploaded_by: "admin@logibill.com",
    uploaded_at: "2024-01-08T09:00:00Z",
  },
  {
    id: "4",
    name: "orders_export_2024-01.csv",
    type: "export",
    mime_type: "text/csv",
    size: 1250000,
    uploaded_by: "accounting@logibill.com",
    uploaded_at: "2024-01-05T16:45:00Z",
  },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType === "application/pdf") {
    return <FileText className="h-4 w-4 text-red-500" />;
  }
  if (mimeType.includes("spreadsheet") || mimeType === "text/csv") {
    return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
  }
  return <FileText className="h-4 w-4 text-blue-500" />;
}

const columns: ColumnDef<FileRecord>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="File Name" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {getFileIcon(row.original.mime_type)}
        <span className="font-medium">{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.type}</Badge>
    ),
  },
  {
    accessorKey: "customer_code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) =>
      row.original.customer_code ? (
        <Link
          href={`/customers/${row.original.customer_code}`}
          className="hover:underline"
        >
          {row.original.customer_code}
        </Link>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    accessorKey: "size",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Size" />
    ),
    cell: ({ row }) => formatFileSize(row.original.size),
  },
  {
    accessorKey: "uploaded_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Uploaded" />
    ),
    cell: ({ row }) => (
      <div>
        <p>{formatDateTime(row.original.uploaded_at)}</p>
        <p className="text-xs text-muted-foreground">
          {row.original.uploaded_by}
        </p>
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
          <DropdownMenuItem>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export default function FilesPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredFiles =
    typeFilter === "all"
      ? mockFiles
      : mockFiles.filter((file) => file.type === typeFilter);

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
            <div className="text-2xl font-bold">{mockFiles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <FileText className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockFiles.filter((f) => f.type === "invoice").length}
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
              {mockFiles.filter((f) => f.type === "report").length}
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
              {formatFileSize(mockFiles.reduce((sum, f) => sum + f.size, 0))}
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

          <DataTable
            columns={columns}
            data={filteredFiles}
            searchKey="name"
            searchPlaceholder="Search files..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
