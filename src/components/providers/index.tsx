"use client";

import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { errorReporter, setErrorUser, clearErrorUser, captureError } from "@/lib/monitoring/error-reporter";

/**
 * Global error handler for auth errors (401)
 * Redirects to login and clears auth state
 */
function useAuthErrorHandler() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  return useCallback(
    async (error: unknown) => {
      if (error instanceof ApiError && error.isAuthError()) {
        // Clear Supabase session
        const supabase = createClient();
        await supabase.auth.signOut();

        // Clear local auth state
        logout();

        // Show toast notification
        toast.error("Session expired", {
          description: "Please log in again to continue.",
        });

        // Redirect to login with current path as redirect target
        const currentPath = window.location.pathname;
        router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
      }
    },
    [logout, router]
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const handleAuthError = useAuthErrorHandler();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on auth errors
              if (error instanceof ApiError && error.isAuthError()) {
                return false;
              }
              // Retry up to 3 times for other errors
              return failureCount < 3;
            },
          },
          mutations: {
            retry: false,
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            handleAuthError(error);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            handleAuthError(error);
          },
        }),
      })
  );

  // Initialize error reporter
  useEffect(() => {
    errorReporter.init();
  }, []);

  // Initialize auth state from Supabase on mount
  useEffect(() => {
    const initAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        useAuthStore.getState().setLoading(false);
        clearErrorUser();
        return;
      }

      // Fetch user data from our API
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v1/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            useAuthStore.getState().setUser(data.data);
            // Set user context for error reporting
            setErrorUser({
              id: data.data.id,
              email: data.data.email,
              role: data.data.role,
            });
          }
        } else {
          useAuthStore.getState().setLoading(false);
          clearErrorUser();
        }
      } catch (error) {
        useAuthStore.getState().setLoading(false);
        clearErrorUser();
        captureError(error instanceof Error ? error : new Error(String(error)), {
          tags: { source: "auth-init" },
        });
      }
    };

    initAuth();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
