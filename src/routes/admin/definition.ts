import { createRoute } from "@hono/zod-openapi";
import {
  cleanupOrphanedAttachmentsResponseSchema,
  cleanupDeletedCouplesResponseSchema,
  createAdminAttachmentRequestSchema,
  createAdminAttachmentResponseSchema,
  createAdminPostRequestSchema,
  createAdminPostResponseSchema,
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

export const createAdminAttachment = createRoute({
  method: "post",
  tags: ["admin"],
  path: "/attachments",
  security: [
    {
      bearerAuth: [],
    },
  ],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: createAdminAttachmentRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Attachment created successfully on behalf of user",
      content: {
        "application/json": {
          schema: createAdminAttachmentResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request - Invalid file or missing userId",
    },
    401: {
      description: "Unauthorized - Invalid or missing bearer token",
    },
    404: {
      description: "Not found - User not found",
    },
    500: {
      description: "Internal server error - Failed to create attachment",
    },
  },
});

export const createAdminPost = createRoute({
  method: "post",
  tags: ["admin"],
  path: "/posts",
  security: [
    {
      bearerAuth: [],
    },
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createAdminPostRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Post created successfully on behalf of user",
      content: {
        "application/json": {
          schema: createAdminPostResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request - Invalid input",
    },
    401: {
      description: "Unauthorized - Invalid or missing bearer token",
    },
    403: {
      description: "Forbidden - User has no active relationship",
    },
    404: {
      description: "Not found - User or attachment IDs not found",
    },
    500: {
      description: "Internal server error - Failed to create post",
    },
  },
});
