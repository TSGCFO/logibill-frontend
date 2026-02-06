import { AlertTriangle } from "lucide-react";

export default function ConfigErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-6">
            <AlertTriangle className="h-12 w-12 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Configuration Required
          </h1>
          <p className="text-muted-foreground">
            The application is not fully configured. Please contact your
            administrator to set up the required environment variables.
          </p>
        </div>
      </div>
    </div>
  );
}
