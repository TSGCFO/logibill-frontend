"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Key,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

interface OnboardingToken {
  token: string;
  company_name?: string;
  email?: string;
  expires_at: string;
  used: boolean;
}

interface OnboardingFormData {
  token: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  billing_email?: string;
  notes?: string;
  preferred_billing_cadence: string;
  payment_terms: number;
}

export default function CustomerOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [token, setToken] = useState(tokenFromUrl);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [formData, setFormData] = useState<OnboardingFormData>({
    token: tokenFromUrl,
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    billing_email: "",
    notes: "",
    preferred_billing_cadence: "monthly",
    payment_terms: 30,
  });

  const { data: tokenInfo, isLoading: tokenLoading, error: tokenError, refetch: verifyToken } = useQuery({
    queryKey: ["onboarding-token", token],
    queryFn: async () => {
      const response = await api.get<{ data: OnboardingToken }>(
        `/api/v1/onboarding/verify/${token}`
      );
      return response.data.data;
    },
    enabled: false,
  });

  const handleVerifyToken = async () => {
    if (!token.trim()) {
      toast.error("Please enter a token");
      return;
    }
    const result = await verifyToken();
    if (result.data) {
      setTokenVerified(true);
      setFormData((prev) => ({
        ...prev,
        token,
        company_name: result.data.company_name ?? prev.company_name,
        email: result.data.email ?? prev.email,
      }));
      toast.success("Token verified successfully");
    }
  };

  const submitOnboarding = useMutation({
    mutationFn: async (data: OnboardingFormData) => {
      return api.post("/api/v1/onboarding/complete", data);
    },
    onSuccess: () => {
      toast.success("Onboarding complete!", {
        description: "Your account has been created successfully",
      });
      router.push("/onboarding/success");
    },
    onError: () => {
      toast.error("Failed to complete onboarding");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name || !formData.email || !formData.contact_name) {
      toast.error("Please fill in all required fields");
      return;
    }
    submitOnboarding.mutate(formData);
  };

  const updateField = (field: keyof OnboardingFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!tokenVerified) {
    return (
      <div className="mx-auto max-w-md space-y-6 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Customer Onboarding</h1>
          <p className="text-muted-foreground mt-2">
            Enter your onboarding token to get started
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Verify Token
            </CardTitle>
            <CardDescription>
              Enter the onboarding token you received from LogiBill
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Onboarding Token</Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your token"
                className="font-mono"
              />
            </div>
            {tokenError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invalid Token</AlertTitle>
                <AlertDescription>
                  This token is invalid, expired, or has already been used.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handleVerifyToken}
              disabled={tokenLoading || !token.trim()}
            >
              {tokenLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Token
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Complete Your Registration</h1>
        <p className="text-muted-foreground">
          Fill out the form below to complete your LogiBill onboarding
        </p>
      </div>

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Token Verified</AlertTitle>
        <AlertDescription>
          Your onboarding token has been verified. Please complete the form below.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => updateField("company_name", e.target.value)}
                  placeholder="Your Company Name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_name">Primary Contact Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => updateField("contact_name", e.target.value)}
                    placeholder="John Doe"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="contact@company.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing_email">Billing Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="billing_email"
                    type="email"
                    value={formData.billing_email}
                    onChange={(e) => updateField("billing_email", e.target.value)}
                    placeholder="billing@company.com"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="123 Main St"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="City"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    placeholder="CA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => updateField("zip", e.target.value)}
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Billing Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="billing_cadence">Preferred Billing Cadence</Label>
                <Select
                  value={formData.preferred_billing_cadence}
                  onValueChange={(value) => updateField("preferred_billing_cadence", value)}
                >
                  <SelectTrigger id="billing_cadence">
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
                <Label htmlFor="payment_terms">Payment Terms (days)</Label>
                <Input
                  id="payment_terms"
                  type="number"
                  value={formData.payment_terms}
                  onChange={(e) => updateField("payment_terms", Number(e.target.value))}
                  min={1}
                  max={90}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Any special requirements or notes..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={submitOnboarding.isPending}
            >
              {submitOnboarding.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Complete Registration
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
