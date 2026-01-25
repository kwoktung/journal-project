import { createRoute } from "@hono/zod-openapi";
import {
  getAttachmentParamsSchema,
  createAttachmentRequestSchema,
  createAttachmentResponseSchema,
  updateAttachmentThumbHashParamsSchema,
  updateAttachmentThumbHashRequestSchema,
  updateAttachmentThumbHashResponseSchema,
} from "./schema";

export const getAttachment = createRoute({
  method: "get",
  tags: ["attachment"],
  path: "/{filename}",
  hide: true, // Exclude this route from OpenAPI documentation
  request: {
    params: getAttachmentParamsSchema,
  },
  responses: {
    200: {
      description: "Attachment retrieved successfully",
    },
    401: {
      description: "Unauthorized - Authentication required",
    },
    404: {
      description: "Not found - Attachment not found",
    },
    500: {
      description: "Internal server error - Failed to retrieve attachment",
    },
  },
});

export const createAttachment = createRoute({
  method: "post",
  tags: ["attachment"],
  path: "/",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: createAttachmentRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Attachment created successfully",
      content: {
        "application/json": {
          schema: createAttachmentResponseSchema,
        },
      },
    },
    400: {
      description:
        "Bad request - Invalid file, missing file, or file size exceeds 50MB",
    },
    401: {
      description: "Unauthorized - Authentication required",
    },
    500: {
      description: "Internal server error - Failed to create attachment",
    },
  },
});

export const updateAttachmentThumbHash = createRoute({
  method: "patch",
  tags: ["attachment"],
  path: "/{filename}/thumbhash",
  request: {
    params: updateAttachmentThumbHashParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: updateAttachmentThumbHashRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "ThumbHash updated successfully",
      content: {
        "application/json": {
          schema: updateAttachmentThumbHashResponseSchema,
        },
      },
    },
    401: { description: "Unauthorized - Authentication required" },
    404: { description: "Attachment not found or access denied" },
    500: { description: "Internal server error" },
  },
});
