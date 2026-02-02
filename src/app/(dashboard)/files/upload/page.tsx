"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  File,
  FileText,
  FileSpreadsheet,
  X,
  Loader2,
  Check,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useCustomers } from "@/hooks/use-customers";
import { toast } from "sonner";

interface FileToUpload {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}

const fileCategories = [
  { value: "invoice", label: "Invoice" },
  { value: "contract", label: "Contract" },
  { value: "rate_card", label: "Rate Card" },
  { value: "report", label: "Report" },
  { value: "other", label: "Other" },
];

export default function FileUploadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: customersData } = useCustomers();
  const customers = customersData?.data ?? [];

  const [files, setFiles] = useState<FileToUpload[]>([]);
  const [category, setCategory] = useState<string>("other");
  const [customerId, setCustomerId] = useState<string>("");
  const [description, setDescription] = useState("");

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    const filesToAdd = newFiles.map((file) => ({
      file,
      progress: 0,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...filesToAdd]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const results = [];

      for (let i = 0; i < files.length; i++) {
        const fileItem = files[i];
        if (fileItem.status !== "pending") continue;

        // Update status to uploading
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "uploading" as const } : f
          )
        );

        try {
          const formData = new FormData();
          formData.append("file", fileItem.file);
          formData.append("category", category);
          if (customerId) formData.append("customer_id", customerId);
          if (description) formData.append("description", description);

          // Simulate upload progress
          for (let p = 0; p <= 100; p += 20) {
            await new Promise((r) => setTimeout(r, 100));
            setFiles((prev) =>
              prev.map((f, idx) => (idx === i ? { ...f, progress: p } : f))
            );
          }

          await api.post("/api/v1/files", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          // Update status to complete
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: "complete" as const, progress: 100 } : f
            )
          );
          results.push({ success: true, file: fileItem.file.name });
        } catch (error) {
          // Update status to error
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? { ...f, status: "error" as const, error: "Upload failed" }
                : f
            )
          );
          results.push({ success: false, file: fileItem.file.name });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      queryClient.invalidateQueries({ queryKey: ["files"] });

      if (successCount > 0) {
        toast.success(`Uploaded ${successCount} file(s) successfully`);
      }
      if (failCount > 0) {
        toast.error(`Failed to upload ${failCount} file(s)`);
      }
    },
  });

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["csv", "xlsx", "xls"].includes(ext || "")) {
      return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    }
    if (["pdf", "doc", "docx", "txt"].includes(ext || "")) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const pendingFiles = files.filter((f) => f.status === "pending");
  const canUpload = pendingFiles.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/files">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Files</h1>
          <p className="text-muted-foreground">
            Upload documents to the file repository
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Select Files</CardTitle>
            <CardDescription>
              Drag and drop files or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Drop Zone */}
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium">Drop files here or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports PDF, CSV, Excel, and document files
              </p>
              <input
                id="file-input"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">Files to Upload</h3>
                {files.map((fileItem, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 border rounded-lg"
                  >
                    {getFileIcon(fileItem.file.name)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{fileItem.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(fileItem.file.size / 1024).toFixed(1)} KB
                      </p>
                      {fileItem.status === "uploading" && (
                        <Progress value={fileItem.progress} className="mt-2" />
                      )}
                      {fileItem.status === "error" && (
                        <p className="text-sm text-destructive mt-1">
                          {fileItem.error}
                        </p>
                      )}
                    </div>
                    {fileItem.status === "complete" ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : fileItem.status === "uploading" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Options */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fileCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Customer (Optional)</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No customer</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={String(customer.id)}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description for these files..."
                rows={3}
              />
            </div>

            <Button
              className="w-full"
              onClick={() => uploadMutation.mutate()}
              disabled={!canUpload || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {pendingFiles.length} File
                  {pendingFiles.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
