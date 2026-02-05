"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Download,
  FileSpreadsheet,
  Loader2,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  Eye,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  useDownloadBulkTemplate,
  useBulkUploadProducts,
} from "@/hooks/use-products";
import type { BulkUploadValidationError } from "@/hooks/use-products";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

type UploadStep = "select" | "preview" | "uploading" | "results";

interface ParsedRow {
  rowNumber: number;
  data: Record<string, string>;
}

// Required and optional headers matching the Product type
const TEMPLATE_HEADERS = [
  "sku",
  "name",
  "description",
  "category",
  "customer_id",
  "weight",
  "dimensions",
  "is_active",
] as const;

const REQUIRED_HEADERS = ["sku", "name"] as const;

// ============================================================================
// CSV Parsing Utilities
// ============================================================================

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }

  fields.push(current.trim());
  return fields;
}

function parseCSV(content: string): {
  headers: string[];
  rows: ParsedRow[];
} {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCSVLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/\s+/g, "_")
  );

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    const data: Record<string, string> = {};
    headers.forEach((header, idx) => {
      data[header] = fields[idx] ?? "";
    });
    rows.push({ rowNumber: i + 1, data });
  }

  return { headers, rows };
}

// ============================================================================
// Client-Side Validation
// ============================================================================

interface ClientValidationResult {
  errors: BulkUploadValidationError[];
  warnings: BulkUploadValidationError[];
}

function validateParsedData(
  headers: string[],
  rows: ParsedRow[]
): ClientValidationResult {
  const errors: BulkUploadValidationError[] = [];
  const warnings: BulkUploadValidationError[] = [];

  // Check for required headers
  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required)) {
      errors.push({
        row: 0,
        field: required,
        message: `Missing required column: "${required}"`,
      });
    }
  }

  // Check for unrecognized headers
  for (const header of headers) {
    if (!TEMPLATE_HEADERS.includes(header as (typeof TEMPLATE_HEADERS)[number])) {
      warnings.push({
        row: 0,
        field: header,
        message: `Unrecognized column "${header}" will be ignored`,
      });
    }
  }

  if (errors.length > 0) {
    return { errors, warnings };
  }

  // Validate each row
  const skuSet = new Set<string>();
  for (const row of rows) {
    const { rowNumber, data } = row;

    // Required field checks
    if (!data.sku || data.sku.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: "sku",
        message: "SKU is required",
        value: data.sku,
      });
    } else if (data.sku.trim().length < 2) {
      errors.push({
        row: rowNumber,
        field: "sku",
        message: "SKU must be at least 2 characters",
        value: data.sku,
      });
    } else {
      // Check for duplicate SKUs in the file
      const normalizedSku = data.sku.trim().toLowerCase();
      if (skuSet.has(normalizedSku)) {
        warnings.push({
          row: rowNumber,
          field: "sku",
          message: `Duplicate SKU "${data.sku.trim()}" found in this file`,
          value: data.sku,
        });
      }
      skuSet.add(normalizedSku);
    }

    if (!data.name || data.name.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: "name",
        message: "Name is required",
        value: data.name,
      });
    }

    // Numeric field checks
    if (data.weight && data.weight.trim().length > 0) {
      const weight = Number(data.weight);
      if (isNaN(weight)) {
        errors.push({
          row: rowNumber,
          field: "weight",
          message: "Weight must be a number",
          value: data.weight,
        });
      } else if (weight < 0) {
        errors.push({
          row: rowNumber,
          field: "weight",
          message: "Weight cannot be negative",
          value: data.weight,
        });
      }
    }

    if (data.customer_id && data.customer_id.trim().length > 0) {
      const customerId = Number(data.customer_id);
      if (isNaN(customerId) || !Number.isInteger(customerId) || customerId <= 0) {
        errors.push({
          row: rowNumber,
          field: "customer_id",
          message: "Customer ID must be a positive integer",
          value: data.customer_id,
        });
      }
    }

    // Boolean field checks
    if (data.is_active && data.is_active.trim().length > 0) {
      const val = data.is_active.trim().toLowerCase();
      if (!["true", "false", "1", "0", "yes", "no"].includes(val)) {
        warnings.push({
          row: rowNumber,
          field: "is_active",
          message: `Unrecognized value "${data.is_active}" for is_active; expected true/false/1/0/yes/no`,
          value: data.is_active,
        });
      }
    }
  }

  return { errors, warnings };
}

// ============================================================================
// Sub-Components
// ============================================================================

function DropZone({
  onFileDrop,
  isDragActive,
  onDragEnter,
  onDragLeave,
}: {
  onFileDrop: (files: File[]) => void;
  isDragActive: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
}) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      onDragLeave();
      const droppedFiles = Array.from(e.dataTransfer.files);
      onFileDrop(droppedFiles);
    },
    [onFileDrop, onDragLeave]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    onFileDrop(selectedFiles);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        onDragEnter();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        onDragEnter();
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        onDragLeave();
      }}
      onDrop={handleDrop}
      onClick={() => document.getElementById("bulk-file-input")?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          document.getElementById("bulk-file-input")?.click();
        }
      }}
      aria-label="Drop zone for bulk upload file"
    >
      <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
      <p className="text-lg font-medium">
        {isDragActive ? "Drop your file here" : "Drag and drop your file here"}
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Supports CSV and XLSX files. Maximum 10,000 rows.
      </p>
      <Button variant="outline" className="mt-4" type="button">
        <Upload className="mr-2 h-4 w-4" />
        Browse Files
      </Button>
      <input
        id="bulk-file-input"
        type="file"
        className="hidden"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileSelect}
      />
    </div>
  );
}

function PreviewTable({
  headers,
  rows,
  maxRows = 10,
}: {
  headers: string[];
  rows: ParsedRow[];
  maxRows?: number;
}) {
  const displayRows = rows.slice(0, maxRows);
  const hiddenCount = rows.length - displayRows.length;

  return (
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">Row</TableHead>
            {headers.map((header) => (
              <TableHead key={header} className="min-w-[120px]">
                <span className="font-mono text-xs">{header}</span>
                {REQUIRED_HEADERS.includes(
                  header as (typeof REQUIRED_HEADERS)[number]
                ) && (
                  <Badge variant="outline" className="ml-1 text-[10px] py-0">
                    Required
                  </Badge>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayRows.map((row) => (
            <TableRow key={row.rowNumber}>
              <TableCell className="text-center text-muted-foreground font-mono text-xs">
                {row.rowNumber}
              </TableCell>
              {headers.map((header) => (
                <TableCell key={header} className="font-mono text-xs">
                  {row.data[header] || (
                    <span className="text-muted-foreground italic">empty</span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {hiddenCount > 0 && (
            <TableRow>
              <TableCell
                colSpan={headers.length + 1}
                className="text-center text-muted-foreground text-sm py-4"
              >
                ... and {hiddenCount} more row{hiddenCount !== 1 ? "s" : ""}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ValidationMessages({
  errors,
  warnings,
}: {
  errors: BulkUploadValidationError[];
  warnings: BulkUploadValidationError[];
}) {
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {errors.length} Error{errors.length !== 1 ? "s" : ""} Found
          </AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              The following issues must be fixed before uploading:
            </p>
            <div className="max-h-48 overflow-auto space-y-1">
              {errors.map((error, i) => (
                <div key={i} className="text-sm flex items-start gap-2">
                  <span className="font-mono text-xs bg-destructive/10 px-1 rounded shrink-0">
                    {error.row === 0 ? "Header" : `Row ${error.row}`}
                  </span>
                  <span>
                    {error.field && (
                      <span className="font-medium">{error.field}: </span>
                    )}
                    {error.message}
                    {error.value && (
                      <span className="text-muted-foreground">
                        {" "}
                        (got: &quot;{error.value}&quot;)
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {warnings.length} Warning{warnings.length !== 1 ? "s" : ""}
          </AlertTitle>
          <AlertDescription>
            <div className="max-h-32 overflow-auto space-y-1">
              {warnings.map((warning, i) => (
                <div key={i} className="text-sm flex items-start gap-2">
                  <span className="font-mono text-xs bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded shrink-0">
                    {warning.row === 0 ? "Header" : `Row ${warning.row}`}
                  </span>
                  <span>
                    {warning.field && (
                      <span className="font-medium">{warning.field}: </span>
                    )}
                    {warning.message}
                  </span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function ResultsSummary({
  result,
  onReset,
}: {
  result: {
    success: boolean;
    total_rows: number;
    created: number;
    updated: number;
    failed: number;
    errors: BulkUploadValidationError[];
  };
  onReset: () => void;
}) {
  return (
    <div className="space-y-6">
      <Alert variant={result.failed === 0 ? "default" : "destructive"}>
        {result.failed === 0 ? (
          <Check className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <AlertTitle>
          {result.failed === 0
            ? "Import Completed Successfully"
            : "Import Completed with Errors"}
        </AlertTitle>
        <AlertDescription>
          Processed {result.total_rows} row
          {result.total_rows !== 1 ? "s" : ""} from the uploaded file.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{result.total_rows}</div>
            <p className="text-xs text-muted-foreground">Total Rows</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {result.created}
            </div>
            <p className="text-xs text-muted-foreground">Created</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {result.updated}
            </div>
            <p className="text-xs text-muted-foreground">Updated</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {result.failed}
            </div>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
      </div>

      {result.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Server Validation Errors</CardTitle>
            <CardDescription>
              The following rows could not be processed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Row</TableHead>
                    <TableHead className="w-32">Field</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.errors.map((error, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">
                        {error.row}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {error.field}
                      </TableCell>
                      <TableCell className="text-sm">{error.message}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {error.value || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button asChild>
          <Link href="/products">View Products</Link>
        </Button>
        <Button variant="outline" onClick={onReset}>
          Upload Another File
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ProductBulkUploadPage() {
  const [step, setStep] = useState<UploadStep>("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [clientErrors, setClientErrors] = useState<BulkUploadValidationError[]>(
    []
  );
  const [clientWarnings, setClientWarnings] = useState<
    BulkUploadValidationError[]
  >([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const downloadTemplate = useDownloadBulkTemplate();
  const bulkUpload = useBulkUploadProducts();

  // ---- File Selection & Parsing ----

  const handleFileDrop = useCallback((files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (!ext || !["csv", "xlsx", "xls"].includes(ext)) {
      toast.error("Invalid file type. Please upload a CSV or Excel file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 10 MB.");
      return;
    }

    setSelectedFile(file);

    // Parse CSV files client-side for preview
    if (ext === "csv") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const { headers, rows } = parseCSV(content);

        if (headers.length === 0) {
          toast.error(
            "The file appears to be empty. Please check the file contents."
          );
          setSelectedFile(null);
          return;
        }

        if (rows.length === 0) {
          toast.error(
            "No data rows found. The file only contains a header row."
          );
          setSelectedFile(null);
          return;
        }

        if (rows.length > 10000) {
          toast.error(
            "File contains too many rows. Maximum allowed is 10,000 rows."
          );
          setSelectedFile(null);
          return;
        }

        setParsedHeaders(headers);
        setParsedRows(rows);

        // Validate
        const { errors, warnings } = validateParsedData(headers, rows);
        setClientErrors(errors);
        setClientWarnings(warnings);
        setStep("preview");
      };
      reader.onerror = () => {
        toast.error("Failed to read the file. Please try again.");
        setSelectedFile(null);
      };
      reader.readAsText(file);
    } else {
      // For Excel files, we cannot parse client-side without a library,
      // so skip preview and go straight to upload
      setParsedHeaders([]);
      setParsedRows([]);
      setClientErrors([]);
      setClientWarnings([]);
      setStep("preview");
    }
  }, []);

  // ---- Upload Handling ----

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setStep("uploading");
    setUploadProgress(0);

    // Simulate progress since fetch does not support progress tracking natively
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      await bulkUpload.mutateAsync(selectedFile);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setStep("results");
      toast.success("Bulk upload completed");
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setStep("preview");
      toast.error(
        error instanceof Error ? error.message : "Upload failed. Please try again."
      );
    }
  }, [selectedFile, bulkUpload]);

  // ---- Reset State ----

  const handleReset = useCallback(() => {
    setStep("select");
    setSelectedFile(null);
    setParsedHeaders([]);
    setParsedRows([]);
    setClientErrors([]);
    setClientWarnings([]);
    setUploadProgress(0);
  }, []);

  // ---- Template Download ----

  const handleDownloadTemplate = useCallback(() => {
    downloadTemplate.mutate(undefined, {
      onSuccess: () => {
        toast.success("Template downloaded successfully");
      },
      onError: () => {
        // Fallback: generate a CSV template client-side
        const headers = TEMPLATE_HEADERS.join(",");
        const exampleRow = [
          "SKU-001",
          "Example Product",
          "Product description",
          "Category A",
          "",
          "1.5",
          "10 x 8 x 6 in",
          "true",
        ].join(",");
        const csvContent = `${headers}\n${exampleRow}\n`;
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "products_bulk_upload_template.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Template downloaded (generated locally)");
      },
    });
  }, [downloadTemplate]);

  // ---- Derived State ----

  const hasBlockingErrors = clientErrors.length > 0;

  const fileInfo = useMemo(() => {
    if (!selectedFile) return null;
    return {
      name: selectedFile.name,
      size: (selectedFile.size / 1024).toFixed(1),
      ext: selectedFile.name.split(".").pop()?.toUpperCase() || "FILE",
    };
  }, [selectedFile]);

  // ============================================================================
  // Render
  // ============================================================================

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
          <h1 className="text-3xl font-bold tracking-tight">
            Bulk Upload Products
          </h1>
          <p className="text-muted-foreground">
            Import multiple products at once from a CSV or Excel file
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <StepIndicator
          stepNumber={1}
          label="Select File"
          isActive={step === "select"}
          isComplete={step !== "select"}
        />
        <Separator className="flex-1 max-w-8" />
        <StepIndicator
          stepNumber={2}
          label="Preview & Validate"
          isActive={step === "preview"}
          isComplete={step === "uploading" || step === "results"}
        />
        <Separator className="flex-1 max-w-8" />
        <StepIndicator
          stepNumber={3}
          label="Upload"
          isActive={step === "uploading"}
          isComplete={step === "results"}
        />
        <Separator className="flex-1 max-w-8" />
        <StepIndicator
          stepNumber={4}
          label="Results"
          isActive={step === "results"}
          isComplete={false}
        />
      </div>

      {/* Step: Select File */}
      {step === "select" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Upload a CSV or Excel file containing product data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DropZone
                onFileDrop={handleFileDrop}
                isDragActive={isDragActive}
                onDragEnter={() => setIsDragActive(true)}
                onDragLeave={() => setIsDragActive(false)}
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Download Template</CardTitle>
                <CardDescription>
                  Start with our pre-formatted template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Download a CSV template with the correct column headers and an
                  example row to help you format your data.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownloadTemplate}
                  disabled={downloadTemplate.isPending}
                >
                  {downloadTemplate.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download CSV Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Column Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Badge variant="destructive" className="text-[10px] mt-0.5">
                      Required
                    </Badge>
                    <div>
                      <span className="font-mono font-medium">sku</span>
                      <span className="text-muted-foreground">
                        {" "}
                        - Unique product identifier
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="destructive" className="text-[10px] mt-0.5">
                      Required
                    </Badge>
                    <div>
                      <span className="font-mono font-medium">name</span>
                      <span className="text-muted-foreground">
                        {" "}
                        - Product name
                      </span>
                    </div>
                  </div>
                  <Separator className="my-2" />
                  {[
                    ["description", "Product description"],
                    ["category", "Product category"],
                    ["customer_id", "Assigned customer ID"],
                    ["weight", "Weight in lbs (number)"],
                    ["dimensions", "L x W x H format"],
                    ["is_active", "true/false (default: true)"],
                  ].map(([field, desc]) => (
                    <div key={field} className="flex items-start gap-2">
                      <Badge variant="secondary" className="text-[10px] mt-0.5">
                        Optional
                      </Badge>
                      <div>
                        <span className="font-mono font-medium">{field}</span>
                        <span className="text-muted-foreground"> - {desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step: Preview & Validate */}
      {step === "preview" && selectedFile && (
        <div className="space-y-6">
          {/* Selected File Info */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <FileSpreadsheet className="h-10 w-10 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{fileInfo?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {fileInfo?.ext} file - {fileInfo?.size} KB
                    {parsedRows.length > 0 && (
                      <>
                        {" "}
                        - {parsedRows.length} data row
                        {parsedRows.length !== 1 ? "s" : ""}
                      </>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  aria-label="Remove file"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Validation Results */}
          <ValidationMessages errors={clientErrors} warnings={clientWarnings} />

          {/* Data Preview (CSV only) */}
          {parsedHeaders.length > 0 && parsedRows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Data Preview
                </CardTitle>
                <CardDescription>
                  Showing the first {Math.min(10, parsedRows.length)} of{" "}
                  {parsedRows.length} rows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PreviewTable
                  headers={parsedHeaders}
                  rows={parsedRows}
                  maxRows={10}
                />
              </CardContent>
            </Card>
          )}

          {/* Excel file notice */}
          {parsedHeaders.length === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Excel File Selected</AlertTitle>
              <AlertDescription>
                Client-side preview is not available for Excel files. The file
                will be validated by the server during upload.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleUpload}
              disabled={hasBlockingErrors}
              size="lg"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload {parsedRows.length > 0 ? `${parsedRows.length} Products` : "File"}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Cancel
            </Button>
            {hasBlockingErrors && (
              <p className="text-sm text-destructive">
                Fix the errors above before uploading.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step: Uploading */}
      {step === "uploading" && (
        <Card>
          <CardContent className="py-12">
            <div className="max-w-md mx-auto space-y-6 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div>
                <h3 className="text-lg font-medium">Uploading Products</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Please do not close this page while the upload is in progress.
                </p>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {uploadProgress < 90
                  ? "Uploading and validating data..."
                  : "Processing products..."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Results */}
      {step === "results" && bulkUpload.data && (
        <ResultsSummary result={bulkUpload.data} onReset={handleReset} />
      )}

      {/* Fallback results when the upload succeeded but data shape is unexpected */}
      {step === "results" && !bulkUpload.data && (
        <div className="space-y-4">
          <Alert>
            <Check className="h-4 w-4" />
            <AlertTitle>Upload Completed</AlertTitle>
            <AlertDescription>
              The file was uploaded successfully. Check the Products list to see
              the imported data.
            </AlertDescription>
          </Alert>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/products">View Products</Link>
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Upload Another File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Step Indicator Component
// ============================================================================

function StepIndicator({
  stepNumber,
  label,
  isActive,
  isComplete,
}: {
  stepNumber: number;
  label: string;
  isActive: boolean;
  isComplete: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium transition-colors ${
          isComplete
            ? "bg-primary text-primary-foreground"
            : isActive
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isComplete ? <Check className="h-3.5 w-3.5" /> : stepNumber}
      </div>
      <span
        className={`hidden sm:inline ${
          isActive ? "font-medium" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
