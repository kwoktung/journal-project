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
