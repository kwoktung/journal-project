import { OpenAPIHono } from "@hono/zod-openapi";
import { bearerAuth } from "hono/bearer-auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { HttpResponse } from "@/lib/response";
import { getDatabase } from "@/database/client";
import {
  attachmentTable,
  relationshipTable,
  postTable,
  userTable,
} from "@/database/schema";
import { isNull, and, eq, lte, or } from "drizzle-orm";
import { createContext } from "@/lib/context";
import {
  cleanupOrphanedAttachments,
  cleanupDeletedCouples,
} from "./definition";

const adminApp = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return HttpResponse.error(c, {
        message: result.error.message,
        status: 400,
      });
    }
    return result;
  },
});

// Apply bearer auth middleware to all admin routes
adminApp.use("/*", async (c, next) => {
  const context = getCloudflareContext({ async: false });
  const middleware = bearerAuth({ token: context.env.ADMIN_TOKEN });
  return middleware(c, next);
});

adminApp.openapi(cleanupOrphanedAttachments, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const db = getDatabase(context.env);
    const ctx = createContext(context.env);

    // Find all attachments where postId is null
    const orphanedAttachments = await db
      .select()
      .from(attachmentTable)
      .where(
        and(isNull(attachmentTable.postId), isNull(attachmentTable.deletedAt)),
      );

    const deletedFilenames: string[] = [];
    const errors: string[] = [];

    // Delete R2 objects and database records
    for (const attachment of orphanedAttachments) {
      try {
        // Delete from R2
        await ctx.env.R2.delete(attachment.filename);

        // Delete from database
        await db
          .delete(attachmentTable)
          .where(eq(attachmentTable.id, attachment.id));

        deletedFilenames.push(attachment.filename);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`Failed to delete ${attachment.filename}: ${errorMessage}`);
        console.error(
          `Error deleting attachment ${attachment.filename}:`,
          error,
        );
      }
    }

    const responseData: {
      deletedCount: number;
      deletedFilenames: string[];
      errors?: string[];
    } = {
      deletedCount: deletedFilenames.length,
      deletedFilenames,
    };

    if (errors.length > 0) {
      responseData.errors = errors;
    }

    return HttpResponse.success(c, responseData);
  } catch (error) {
    console.error("Cleanup attachments error:", error);
    return HttpResponse.error(c, {
      message:
        error instanceof Error
          ? error.message
          : "Failed to cleanup attachments",
      status: 500,
    });
  }
});

adminApp.openapi(cleanupDeletedCouples, async (c) => {
  try {
    const context = getCloudflareContext({ async: false });
    const db = getDatabase(context.env);
    const now = new Date();

    // Find all relationships in pending_deletion status
    const pendingRelationships = await db
      .select()
      .from(relationshipTable)
      .where(eq(relationshipTable.status, "pending_deletion"))
      .all();

    // Filter relationships where grace period has expired (endedAt + 7 days <= now)
    const relationshipsToDelete = pendingRelationships.filter(
      (relationship) => {
        if (!relationship.endedAt) return false;
        const permanentDeletionAt = new Date(
          relationship.endedAt.getTime() + 7 * 24 * 60 * 60 * 1000,
        );
        return permanentDeletionAt <= now;
      },
    );

    if (relationshipsToDelete.length === 0) {
      return HttpResponse.success(c, {
        message: "No relationships to clean up",
        deletedCount: 0,
        stats: {
          relationships: 0,
          posts: 0,
          attachments: 0,
        },
      });
    }

    let totalPostsDeleted = 0;
    let totalAttachmentsDeleted = 0;

    // Process each relationship
    for (const relationship of relationshipsToDelete) {
      // Soft delete all posts for this relationship
      const posts = await db
        .select({ id: postTable.id })
        .from(postTable)
        .where(eq(postTable.relationshipId, relationship.id))
        .all();

      if (posts.length > 0) {
        const postIds = posts.map((p) => p.id);

        // Soft delete attachments for these posts
        for (const postId of postIds) {
          await db
            .update(attachmentTable)
            .set({ deletedAt: now })
            .where(eq(attachmentTable.postId, postId))
            .run();
        }
        totalAttachmentsDeleted += postIds.length;

        // Soft delete posts
        await db
          .update(postTable)
          .set({ deletedAt: now })
          .where(eq(postTable.relationshipId, relationship.id))
          .run();

        totalPostsDeleted += posts.length;
      }

      // Update relationship status to 'deleted' and clear users' currentRelationshipId
      await db
        .update(relationshipTable)
        .set({
          status: "deleted",
          updatedAt: now,
        })
        .where(eq(relationshipTable.id, relationship.id));

      // Clear both users' currentRelationshipId
      await db
        .update(userTable)
        .set({ currentRelationshipId: null })
        .where(
          or(
            eq(userTable.id, relationship.user1Id),
            eq(userTable.id, relationship.user2Id),
          ),
        );
    }

    console.log(
      `Cleanup completed: ${relationshipsToDelete.length} relationships, ${totalPostsDeleted} posts, ${totalAttachmentsDeleted} attachments`,
    );

    return HttpResponse.success(c, {
      message: "Cleanup completed successfully",
      deletedCount: relationshipsToDelete.length,
      stats: {
        relationships: relationshipsToDelete.length,
        posts: totalPostsDeleted,
        attachments: totalAttachmentsDeleted,
      },
    });
  } catch (error) {
    console.error("Cleanup deleted relationships error:", error);
    return HttpResponse.error(c, {
      message:
        error instanceof Error
          ? error.message
          : "Failed to cleanup deleted relationships",
      status: 500,
    });
  }
});

export default adminApp;
