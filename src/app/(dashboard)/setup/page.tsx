"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  Building2,
  Settings,
  DollarSign,
  Package,
  Users,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CompanySettings {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website: string;
}

interface BillingSettings {
  default_payment_terms: number;
  default_billing_cadence: string;
  invoice_prefix: string;
  invoice_notes: string;
}

const steps: SetupStep[] = [
  {
    id: "company",
    title: "Company Info",
    description: "Basic company information",
    icon: Building2,
  },
  {
    id: "billing",
    title: "Billing Defaults",
    description: "Default billing settings",
    icon: DollarSign,
  },
  {
    id: "services",
    title: "Services",
    description: "Configure service types",
    icon: Package,
  },
  {
    id: "users",
    title: "Users",
    description: "Invite team members",
    icon: Users,
  },
  {
    id: "complete",
    title: "Complete",
    description: "Finish setup",
    icon: Check,
  },
];

export default function SetupWizardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
    website: "",
  });

  const [billingSettings, setBillingSettings] = useState<BillingSettings>({
    default_payment_terms: 30,
    default_billing_cadence: "monthly",
    invoice_prefix: "INV-",
    invoice_notes: "",
  });

  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ["setup-settings"],
    queryFn: async () => {
      const response = await api.get<{ data: { company: CompanySettings; billing: BillingSettings } }>(
        "/api/v1/admin/settings"
      );
      return response.data?.data;
    },
  });

  const saveSettings = useMutation({
    mutationFn: async () => {
      await api.post("/api/v1/admin/setup/complete", {
        company: companySettings,
        billing: billingSettings,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setup-settings"] });
      toast.success("Setup complete!", {
        description: "Your system is now configured",
      });
      router.push("/");
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  const progressPercent = Math.round((currentStep / (steps.length - 1)) * 100);

  const canProceed = () => {
    if (currentStep === 0) {
      return companySettings.name && companySettings.email;
    }
    if (currentStep === 1) {
      return billingSettings.default_payment_terms > 0;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    saveSettings.mutate();
  };

  if (isLoading) {
    return <SetupSkeleton />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Setup</h1>
        <p className="text-muted-foreground">
          Configure your LogiBill system in a few simple steps
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{progressPercent}% complete</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = index === currentStep;
          const isComplete = index < currentStep;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isComplete && "border-primary bg-primary text-primary-foreground",
                    isActive && "border-primary bg-background",
                    !isActive && !isComplete && "border-muted bg-muted"
                  )}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="company-name">Company Name *</Label>
                <Input
                  id="company-name"
                  value={companySettings.name}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, name: e.target.value })
                  }
                  placeholder="Your Company Name"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={companySettings.address}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, address: e.target.value })
                  }
                  placeholder="123 Main St"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={companySettings.city}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, city: e.target.value })
                  }
                  placeholder="City"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={companySettings.state}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, state: e.target.value })
                    }
                    placeholder="CA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP</Label>
                  <Input
                    id="zip"
                    value={companySettings.zip}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, zip: e.target.value })
                    }
                    placeholder="12345"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={companySettings.email}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, email: e.target.value })
                  }
                  placeholder="billing@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={companySettings.phone}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, phone: e.target.value })
                  }
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payment-terms">Default Payment Terms (days)</Label>
                <Input
                  id="payment-terms"
                  type="number"
                  value={billingSettings.default_payment_terms}
                  onChange={(e) =>
                    setBillingSettings({
                      ...billingSettings,
                      default_payment_terms: Number(e.target.value),
                    })
                  }
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-cadence">Default Billing Cadence</Label>
                <Select
                  value={billingSettings.default_billing_cadence}
                  onValueChange={(value) =>
                    setBillingSettings({
                      ...billingSettings,
                      default_billing_cadence: value,
                    })
                  }
                >
                  <SelectTrigger id="billing-cadence">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice-prefix">Invoice Number Prefix</Label>
                <Input
                  id="invoice-prefix"
                  value={billingSettings.invoice_prefix}
                  onChange={(e) =>
                    setBillingSettings({
                      ...billingSettings,
                      invoice_prefix: e.target.value,
                    })
                  }
                  placeholder="INV-"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="invoice-notes">Default Invoice Notes</Label>
                <Textarea
                  id="invoice-notes"
                  value={billingSettings.invoice_notes}
                  onChange={(e) =>
                    setBillingSettings({
                      ...billingSettings,
                      invoice_notes: e.target.value,
                    })
                  }
                  placeholder="Thank you for your business!"
                  rows={3}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Configure your service types and rates. You can also do this later.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Service Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Define the types of services you offer
                    </p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href="/services">Configure Services</Link>
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Rate Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Create rate templates for quick customer setup
                    </p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href="/services/rates">Manage Rates</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Invite team members to help manage billing. You can also do this later.
              </p>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Add users and assign roles
                  </p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/admin/users">Manage Users</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4 text-center py-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold">You're all set!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your LogiBill system is configured and ready to use. You can always
                adjust settings later from the Admin section.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={saveSettings.isPending}>
              {saveSettings.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Complete Setup
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

function SetupSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <Skeleton className="h-2 w-full" />
      <div className="flex justify-between">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-3 w-16 mt-2" />
          </div>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
