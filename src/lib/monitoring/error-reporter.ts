/**
 * Error Reporting Module
 *
 * This module provides centralized error reporting functionality.
 * It can be easily extended to integrate with external services like Sentry.
 *
 * To integrate with Sentry:
 * 1. Install: npm install @sentry/nextjs
 * 2. Run: npx @sentry/wizard -i nextjs
 * 3. Replace the implementation below with Sentry calls
 */

interface ErrorContext {
  // User information
  userId?: string;
  userEmail?: string;
  userRole?: string;

  // Request information
  url?: string;
  method?: string;
  route?: string;

  // Additional context
  componentStack?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

interface ErrorReport {
  error: Error;
  context?: ErrorContext;
  level?: "error" | "warning" | "info";
}

class ErrorReporter {
  private static instance: ErrorReporter;
  private isInitialized = false;
  private dsn: string | null = null;

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  /**
   * Initialize the error reporter with optional external service DSN
   */
  init(dsn?: string): void {
    if (this.isInitialized) return;

    this.dsn = dsn || null;
    this.isInitialized = true;

    // Set up global error handlers
    if (typeof window !== "undefined") {
      window.addEventListener("error", (event) => {
        this.captureError(event.error, {
          tags: { handler: "window.onerror" },
        });
      });

      window.addEventListener("unhandledrejection", (event) => {
        const error =
          event.reason instanceof Error
            ? event.reason
            : new Error(String(event.reason));
        this.captureError(error, {
          tags: { handler: "unhandledrejection" },
        });
      });
    }

    console.log("[ErrorReporter] Initialized", dsn ? "with external service" : "in local mode");
  }

  /**
   * Capture and report an error
   */
  captureError(error: Error, context?: ErrorContext): void {
    const report: ErrorReport = {
      error,
      context,
      level: "error",
    };

    this.processReport(report);
  }

  /**
   * Capture a warning-level message
   */
  captureWarning(message: string, context?: ErrorContext): void {
    const error = new Error(message);
    const report: ErrorReport = {
      error,
      context,
      level: "warning",
    };

    this.processReport(report);
  }

  /**
   * Capture an info-level message
   */
  captureMessage(message: string, context?: ErrorContext): void {
    const error = new Error(message);
    const report: ErrorReport = {
      error,
      context,
      level: "info",
    };

    this.processReport(report);
  }

  /**
   * Set user context for all future reports
   */
  setUser(user: { id: string; email?: string; role?: string }): void {
    // Store user context for future reports
    if (typeof window !== "undefined") {
      (window as unknown as Record<string, unknown>).__errorReporterUser = user;
    }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (typeof window !== "undefined") {
      delete (window as unknown as Record<string, unknown>).__errorReporterUser;
    }
  }

  private processReport(report: ErrorReport): void {
    const { error, context, level } = report;

    // Get stored user context
    const userContext =
      typeof window !== "undefined"
        ? ((window as unknown as Record<string, unknown>).__errorReporterUser as ErrorContext | undefined)
        : undefined;

    const fullContext = { ...userContext, ...context };

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      const logMethod =
        level === "error"
          ? console.error
          : level === "warning"
            ? console.warn
            : console.info;

      logMethod(`[${level?.toUpperCase()}]`, error.message, {
        stack: error.stack,
        context: fullContext,
      });
    }

    // In production, send to external service if configured
    if (process.env.NODE_ENV === "production" && this.dsn) {
      this.sendToExternalService(report, fullContext);
    }

    // Store in local storage for debugging (last 10 errors)
    this.storeLocally(report, fullContext);
  }

  private sendToExternalService(report: ErrorReport, context: ErrorContext): void {
    // Placeholder for external service integration
    // Replace with Sentry.captureException(report.error, { extra: context })
    // or other error tracking service

    // Example beacon API for custom endpoint
    if (navigator.sendBeacon) {
      const payload = JSON.stringify({
        message: report.error.message,
        stack: report.error.stack,
        level: report.level,
        context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });

      // Uncomment to send to custom endpoint:
      // navigator.sendBeacon('/api/errors', payload);
    }
  }

  private storeLocally(report: ErrorReport, context: ErrorContext): void {
    if (typeof window === "undefined") return;

    try {
      const key = "__errorReports";
      const stored = localStorage.getItem(key);
      const reports = stored ? JSON.parse(stored) : [];

      reports.unshift({
        message: report.error.message,
        stack: report.error.stack,
        level: report.level,
        context,
        timestamp: new Date().toISOString(),
      });

      // Keep only last 10 errors
      localStorage.setItem(key, JSON.stringify(reports.slice(0, 10)));
    } catch {
      // localStorage might be unavailable
    }
  }

  /**
   * Get locally stored error reports (for debugging)
   */
  getStoredReports(): unknown[] {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem("__errorReports");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear locally stored error reports
   */
  clearStoredReports(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("__errorReports");
  }
}

// Export singleton instance
export const errorReporter = ErrorReporter.getInstance();

// Convenience functions
export const captureError = (error: Error, context?: ErrorContext) =>
  errorReporter.captureError(error, context);

export const captureWarning = (message: string, context?: ErrorContext) =>
  errorReporter.captureWarning(message, context);

export const captureMessage = (message: string, context?: ErrorContext) =>
  errorReporter.captureMessage(message, context);

export const setErrorUser = (user: { id: string; email?: string; role?: string }) =>
  errorReporter.setUser(user);

export const clearErrorUser = () => errorReporter.clearUser();
