import { createRoute } from "@hono/zod-openapi";
import {
  cleanupOrphanedAttachmentsResponseSchema,
  cleanupDeletedCouplesResponseSchema,
} from "./schema";

export const cleanupOrphanedAttachments = createRoute({
  method: "post",
  tags: ["admin"],
  path: "/cleanup-orphaned-attachments",
  security: [
    {
      bearerAuth: [],
    },
  ],
  responses: {
    200: {
      description: "Cleanup completed successfully",
      content: {
        "application/json": {
          schema: cleanupOrphanedAttachmentsResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - Invalid or missing bearer token",
    },
    500: {
      description: "Internal server error - Failed to cleanup attachments",
    },
  },
});

export const cleanupDeletedCouples = createRoute({
  method: "post",
  tags: ["admin"],
  path: "/cleanup-deleted-couples",
  security: [
    {
      bearerAuth: [],
    },
  ],
  responses: {
    200: {
      description: "Cleanup completed successfully",
      content: {
        "application/json": {
          schema: cleanupDeletedCouplesResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - Invalid or missing bearer token",
    },
    500: {
      description: "Internal server error - Failed to cleanup deleted couples",
    },
  },
});
