"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Key,
  Mail,
  Building2,
  Calendar,
  Copy,
  CheckCircle,
  Loader2,
  Send,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

interface GenerateTokenRequest {
  company_name?: string;
  email?: string;
  expires_in_days: number;
  send_email: boolean;
}

interface GeneratedToken {
  id: string;
  token: string;
  expires_at: string;
  onboarding_url: string;
}

export default function GenerateOnboardingTokenPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<GenerateTokenRequest>({
    company_name: "",
    email: "",
    expires_in_days: 7,
    send_email: true,
  });

  const [generatedToken, setGeneratedToken] = useState<GeneratedToken | null>(null);

  const generateToken = useMutation({
    mutationFn: async (data: GenerateTokenRequest) => {
      const response = await api.post<GeneratedToken>(
        "/api/v1/admin/onboarding-tokens",
        data
      );
      return response.data!;
    },
    onSuccess: (data) => {
      setGeneratedToken(data);
      queryClient.invalidateQueries({ queryKey: ["onboarding-tokens"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-token-stats"] });
      if (formData.send_email && formData.email) {
        toast.success("Token generated and email sent!", {
          description: `Onboarding email sent to ${formData.email}`,
        });
      } else {
        toast.success("Token generated successfully");
      }
    },
    onError: () => {
      toast.error("Failed to generate token");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.send_email && !formData.email) {
      toast.error("Email is required to send invitation");
      return;
    }
    generateToken.mutate(formData);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (generatedToken) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/onboarding-tokens">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Token Generated</h1>
            <p className="text-muted-foreground">
              Share this token with your new customer
            </p>
          </div>
        </div>

        <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-200">
            Token Created Successfully
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            {formData.send_email && formData.email
              ? `An invitation email has been sent to ${formData.email}.`
              : "Share the token or link below with the customer."}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Onboarding Token
            </CardTitle>
            <CardDescription>
              This token can be used once and expires soon
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Token</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedToken.token}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(generatedToken.token, "Token")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Onboarding URL</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedToken.onboarding_url}
                  readOnly
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(generatedToken.onboarding_url, "URL")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with the customer to start their onboarding
              </p>
            </div>

            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>
                  Expires: {new Date(generatedToken.expires_at).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/onboarding-tokens">View All Tokens</Link>
            </Button>
            <Button
              onClick={() => {
                setGeneratedToken(null);
                setFormData({
                  company_name: "",
                  email: "",
                  expires_in_days: 7,
                  send_email: true,
                });
              }}
            >
              Generate Another
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/onboarding-tokens">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate Token</h1>
          <p className="text-muted-foreground">
            Create an onboarding token for a new customer
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Customer Details
            </CardTitle>
            <CardDescription>
              Pre-fill customer information (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
                placeholder="Acme Inc."
              />
              <p className="text-xs text-muted-foreground">
                This will be pre-filled in the onboarding form
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Customer Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="contact@company.com"
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Token Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expires_in">Expiration</Label>
              <Select
                value={String(formData.expires_in_days)}
                onValueChange={(value) =>
                  setFormData({ ...formData, expires_in_days: Number(value) })
                }
              >
                <SelectTrigger id="expires_in">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="send_email" className="cursor-pointer">
                  Send Invitation Email
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically send the onboarding link to the customer
                </p>
              </div>
              <Switch
                id="send_email"
                checked={formData.send_email}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, send_email: checked })
                }
              />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={generateToken.isPending}
            >
              {generateToken.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : formData.send_email ? (
                <Send className="mr-2 h-4 w-4" />
              ) : (
                <Key className="mr-2 h-4 w-4" />
              )}
              {formData.send_email ? "Generate & Send Invitation" : "Generate Token"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
