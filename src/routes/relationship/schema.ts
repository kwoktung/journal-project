import { z } from "@hono/zod-openapi";

export const createInviteSchema = z.object({
  relationshipStartDate: z.string().datetime().optional().openapi({
    description: "Relationship start date (ISO 8601)",
    example: "2024-01-01T00:00:00Z",
  }),
});

export const createInviteResponseSchema = z.object({
  inviteCode: z.string().openapi({
    description: "8-character invite code",
    example: "AB12CD34",
  }),
  inviteUrl: z.string().openapi({
    description: "Full invite URL",
    example: "https://app.example.com/pair?code=AB12CD34",
  }),
  expiresAt: z.string().openapi({
    description: "Expiration date (ISO 8601)",
    example: "2024-01-08T00:00:00Z",
  }),
});

export const acceptInviteSchema = z.object({
  inviteCode: z.string().length(8).openapi({
    description: "8-character invite code",
    example: "AB12CD34",
  }),
});

export const userInfoSchema = z.object({
  id: z.number(),
  username: z.string(),
  displayName: z.string().nullable(),
  avatar: z.string().nullable(),
});

export const relationshipInfoSchema = z.object({
  id: z.number(),
  partner: userInfoSchema,
  relationshipStartDate: z.string().nullable(),
  status: z.string(),
  createdAt: z.string(),
  permanentDeletionAt: z.string().nullable(),
  resumeRequest: z
    .object({
      requestedBy: z.number(),
      requestedAt: z.string(),
    })
    .nullable(),
});

export const acceptInviteResponseSchema = z.object({
  relationship: relationshipInfoSchema,
});

export const getRelationshipResponseSchema = z.object({
  relationship: relationshipInfoSchema.nullable(),
});

export const endRelationshipResponseSchema = z.object({
  message: z.string(),
  permanentDeletionAt: z.string(),
});

export const resumeRelationshipResponseSchema = z.object({
  message: z.string(),
  status: z.string(),
  requestedBy: z.number().optional(),
});

export const cancelResumeRequestResponseSchema = z.object({
  message: z.string(),
});

export const validateInviteSchema = z.object({
  inviteCode: z.string().length(8).openapi({
    description: "8-character invite code",
    example: "AB12CD34",
  }),
});

export const validateInviteResponseSchema = z.object({
  valid: z.boolean(),
  inviter: userInfoSchema.nullable(),
  expiresAt: z.string().nullable(),
});

export const getPendingInviteResponseSchema = z.object({
  invitation: z
    .object({
      inviteCode: z.string(),
      inviteUrl: z.string(),
      expiresAt: z.string(),
    })
    .nullable(),
});
