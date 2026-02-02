"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth";

/**
 * Access Denied / Unauthorized Page
 *
 * Shown when a user attempts to access a page they don't have permission for.
 *
 * Track: frontend-prod_20260202
 * Task: 5.2
 */
export default function UnauthorizedPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don&apos;t have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p>
              Your current role (<span className="font-medium">{user?.role || "unknown"}</span>)
              does not have the required permissions for this resource.
            </p>
            <p className="mt-2">
              If you believe this is an error, please contact your administrator.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button
              className="flex-1"
              onClick={() => router.push("/")}
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
