import { ApiError } from "@/lib/api-client";

export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    // Try to extract error message from the response body
    if (error.body?.error) {
      return typeof error.body.error === "string"
        ? error.body.error
        : JSON.stringify(error.body.error);
    }
    if (error.body?.message) {
      return error.body.message;
    }
    // Fallback to status text
    return error.statusText || "An error occurred";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}
