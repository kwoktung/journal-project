import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  error: Error;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <h1 className="mb-6 text-2xl font-bold">Relationship</h1>
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <AlertCircle className="mb-4 size-16 text-destructive" />
            <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              {error.message || "Failed to load relationship data"}
            </p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
