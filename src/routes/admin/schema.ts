import { z } from "zod";
import { createSuccessResponse } from "@/lib/response";

export const cleanupOrphanedAttachmentsDataSchema = z.object({
  deletedCount: z.number(),
  deletedFilenames: z.array(z.string()),
  errors: z.array(z.string()).optional(),
});

export const cleanupOrphanedAttachmentsResponseSchema = createSuccessResponse(
  cleanupOrphanedAttachmentsDataSchema,
);

export const cleanupDeletedCouplesDataSchema = z.object({
  message: z.string(),
  deletedCount: z.number(),
  stats: z.object({
    couples: z.number(),
    posts: z.number(),
    attachments: z.number(),
  }),
});

export const cleanupDeletedCouplesResponseSchema = createSuccessResponse(
  cleanupDeletedCouplesDataSchema,
);

// Admin Attachment Upload Schemas
export const createAdminAttachmentRequestSchema = z.object({
  file: z.instanceof(File).openapi({
    description: "The file to upload as an attachment",
    type: "object",
  }),
  userId: z.coerce.number().int().positive().openapi({
    description: "User ID to create the attachment as",
    example: 1,
  }),
});

export const createAdminAttachmentDataSchema = z.object({
  id: z.number(),
  filename: z.string(),
});

export const createAdminAttachmentResponseSchema = createSuccessResponse(
  createAdminAttachmentDataSchema,
);

// Admin Post Creation Schemas
export const createAdminPostRequestSchema = z.object({
  userId: z.number().int().positive().openapi({
    description: "User ID to create the post as",
    example: 1,
  }),
  text: z.string().min(1).openapi({
    description: "Post text content",
    example: "This is a post created by admin",
  }),
  attachmentIds: z
    .array(z.number().int().positive())
    .optional()
    .default([])
    .openapi({
      description: "Array of attachment IDs to link to the post",
      example: [1, 2, 3],
    }),
  createdAt: z.string().datetime().optional().openapi({
    description:
      "Optional custom creation timestamp (ISO 8601 format). If not provided, uses current time.",
    example: "2024-01-15T10:30:00.000Z",
  }),
});

export const createAdminPostDataSchema = z.object({
  id: z.number(),
  text: z.string(),
  createdBy: z.number(),
  user: z
    .object({
      id: z.number(),
      username: z.string(),
      displayName: z.string().nullable(),
      avatar: z.string().nullable(),
    })
    .nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  attachments: z.array(
    z.object({
      id: z.number(),
      filename: z.string(),
      createdAt: z.string(),
    }),
  ),
});

export const createAdminPostResponseSchema = createSuccessResponse(
  createAdminPostDataSchema,
);
