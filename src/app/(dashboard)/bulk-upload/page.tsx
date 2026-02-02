"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  ArrowRight,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomers } from "@/hooks/use-customers";
import { toast } from "sonner";

type UploadType = "products" | "orders" | "inventory" | "rates";

interface ValidationResult {
  row: number;
  status: "valid" | "warning" | "error";
  message?: string;
  data: Record<string, string>;
}

const uploadTypes = [
  {
    value: "products",
    label: "Products",
    description: "Import products with SKU, name, weight, dimensions",
    template: "products_template.csv",
  },
  {
    value: "orders",
    label: "Orders",
    description: "Import historical orders for billing",
    template: "orders_template.csv",
  },
  {
    value: "inventory",
    label: "Inventory Adjustments",
    description: "Bulk update inventory quantities",
    template: "inventory_template.csv",
  },
  {
    value: "rates",
    label: "Service Rates",
    description: "Import customer-specific service rates",
    template: "rates_template.csv",
  },
];

export default function BulkUploadPage() {
  const { data: customersData } = useCustomers();
  const customers = customersData?.data ?? [];
  const [uploadType, setUploadType] = useState<UploadType>("products");
  const [customerId, setCustomerId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult[] | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
        setValidationResults(null);
      }
    },
    []
  );

  const handleValidate = async () => {
    if (!file) return;

    setIsValidating(true);
    try {
      // Simulate validation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock validation results
      setValidationResults([
        { row: 1, status: "valid", data: { sku: "SKU-001", name: "Product 1" } },
        { row: 2, status: "valid", data: { sku: "SKU-002", name: "Product 2" } },
        {
          row: 3,
          status: "warning",
          message: "SKU already exists, will update",
          data: { sku: "SKU-003", name: "Product 3" },
        },
        {
          row: 4,
          status: "error",
          message: "Missing required field: name",
          data: { sku: "SKU-004", name: "" },
        },
        { row: 5, status: "valid", data: { sku: "SKU-005", name: "Product 5" } },
      ]);

      toast.success("Validation complete");
    } catch {
      toast.error("Validation failed");
    } finally {
      setIsValidating(false);
    }
  };

  const handleUpload = async () => {
    if (!validationResults) return;

    const hasErrors = validationResults.some((r) => r.status === "error");
    if (hasErrors) {
      toast.error("Please fix errors before uploading");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setUploadProgress(i);
      }

      toast.success("Upload complete", {
        description: `Successfully imported ${validationResults.filter((r) => r.status !== "error").length} records`,
      });

      // Reset state
      setFile(null);
      setValidationResults(null);
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const selectedUploadType = uploadTypes.find((t) => t.value === uploadType);
  const validCount = validationResults?.filter((r) => r.status === "valid").length ?? 0;
  const warningCount = validationResults?.filter((r) => r.status === "warning").length ?? 0;
  const errorCount = validationResults?.filter((r) => r.status === "error").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Upload</h1>
          <p className="text-muted-foreground">
            Import data from CSV files
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upload Configuration</CardTitle>
            <CardDescription>
              Select the type of data and customer for import
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload Type</label>
                <Select
                  value={uploadType}
                  onValueChange={(v) => setUploadType(v as UploadType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {uploadTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {selectedUploadType?.description}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Customer</label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={String(customer.id)}>
                        {customer.name} ({customer.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* File Upload Area */}
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              {file ? (
                <div className="space-y-2">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-green-500" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setValidationResults(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">Drop your CSV file here</p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ position: "relative" }}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={handleValidate}
                disabled={!file || !customerId || isValidating}
              >
                {isValidating ? "Validating..." : "Validate File"}
              </Button>
              {validationResults && (
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || errorCount > 0}
                >
                  {isUploading ? (
                    <>Uploading... {uploadProgress}%</>
                  ) : (
                    <>
                      Upload {validCount + warningCount} Records
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {isUploading && <Progress value={uploadProgress} />}
          </CardContent>
        </Card>

        {/* Template Download */}
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>
              Download CSV templates for each upload type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploadTypes.map((type) => (
              <Button
                key={type.value}
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a href={`/templates/${type.template}`} download>
                  <Download className="mr-2 h-4 w-4" />
                  {type.label} Template
                </a>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Validation Results */}
      {validationResults && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Validation Results</CardTitle>
                <CardDescription>
                  Review the data before uploading
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {validCount} Valid
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {warningCount} Warnings
                </Badge>
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  {errorCount} Errors
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Row</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationResults.map((result) => (
                  <TableRow key={result.row}>
                    <TableCell>{result.row}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          result.status === "valid"
                            ? "default"
                            : result.status === "warning"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {result.status === "valid" && (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        )}
                        {result.status === "warning" && (
                          <AlertCircle className="mr-1 h-3 w-3" />
                        )}
                        {result.status === "error" && (
                          <XCircle className="mr-1 h-3 w-3" />
                        )}
                        {result.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {Object.entries(result.data)
                        .map(([k, v]) => `${k}: ${v || "(empty)"}`)
                        .join(", ")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {result.message || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
