"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  FileText,
  Loader2,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useCustomer } from "@/hooks/use-customers";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

interface RateTemplate {
  id: string;
  name: string;
  description: string;
  service_count: number;
  is_default: boolean;
}

interface TemplateRate {
  service_code: string;
  service_name: string;
  rate: number;
  unit: string;
}

export default function ApplyRateTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: customerId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: customer, isLoading: customerLoading } = useCustomer(customerId);

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["rate-templates"],
    queryFn: async () => {
      const response = await api.get<{ data: RateTemplate[] }>(
        "/api/v1/services/rates/templates"
      );
      return response.data.data;
    },
  });

  const { data: templateRates, isLoading: ratesLoading } = useQuery({
    queryKey: ["template-rates", selectedTemplateId],
    queryFn: async () => {
      const response = await api.get<{ data: TemplateRate[] }>(
        `/api/v1/services/rates/templates/${selectedTemplateId}/rates`
      );
      return response.data.data;
    },
    enabled: !!selectedTemplateId,
  });

  const applyTemplate = useMutation({
    mutationFn: async () => {
      await api.post(`/api/v1/customers/${customerId}/apply-rate-template`, {
        template_id: selectedTemplateId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customer-rates", customerId] });
      toast.success("Rate template applied", {
        description: "Customer rates have been updated successfully",
      });
      router.push(`/customers/${customerId}`);
    },
    onError: () => {
      toast.error("Failed to apply template");
    },
  });

  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  if (customerLoading || templatesLoading) {
    return <ApplyTemplateSkeleton />;
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apply Rate Template</h1>
          <p className="text-muted-foreground">
            Apply a rate template to {customer?.name}
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
            1
          </span>
          Select Template
        </span>
        <ChevronRight className="h-4 w-4" />
        <span className="flex items-center gap-1">
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
            selectedTemplateId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            2
          </span>
          Review Rates
        </span>
        <ChevronRight className="h-4 w-4" />
        <span className="flex items-center gap-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">
            3
          </span>
          Apply
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Available Templates</CardTitle>
            <CardDescription>
              Select a rate template to apply to this customer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
              className="space-y-3"
            >
              {templates?.map((template) => (
                <div key={template.id} className="flex items-start space-x-3">
                  <RadioGroupItem value={template.id} id={template.id} className="mt-1" />
                  <Label
                    htmlFor={template.id}
                    className="flex-1 cursor-pointer space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{template.name}</span>
                      {template.is_default && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {template.service_count} service rates
                    </p>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {(!templates || templates.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No rate templates available</p>
                <p className="text-sm">
                  Create templates in Services &gt; Rates
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rate Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Preview</CardTitle>
            <CardDescription>
              {selectedTemplate
                ? `Rates from "${selectedTemplate.name}" template`
                : "Select a template to preview rates"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedTemplateId ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a template to preview rates</p>
              </div>
            ) : ratesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : templateRates && templateRates.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templateRates.map((rate) => (
                    <TableRow key={rate.service_code}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{rate.service_name}</span>
                          <p className="text-xs text-muted-foreground font-mono">
                            {rate.service_code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(rate.rate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rate.unit}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No rates in this template</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" asChild>
              <Link href={`/customers/${customerId}`}>Cancel</Link>
            </Button>
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={!selectedTemplateId || applyTemplate.isPending}
            >
              {applyTemplate.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Apply Template
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Warning Notice */}
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
          <div>
            <p className="font-medium text-orange-800 dark:text-orange-200">
              Important Notice
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Applying a rate template will replace all existing service rates for this
              customer. Any custom rates will be overwritten. This action can be reversed
              by applying a different template or manually adjusting rates.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Rate Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will apply the "{selectedTemplate?.name}" rate template to{" "}
              {customer?.name}. All existing service rates for this customer will be
              replaced with the rates from this template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmDialog(false);
                applyTemplate.mutate();
              }}
            >
              Apply Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ApplyTemplateSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-1" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
