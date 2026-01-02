import { BaseService } from "./service";
import { postTable, attachmentTable, userTable } from "@/database/schema";
import { eq, inArray, desc, lt, or, and } from "drizzle-orm";
import { USER_BASIC_INFO_SELECT } from "@/lib/constants";
import { HTTPException } from "hono/http-exception";
import { getUserActiveRelationship } from "@/database/relationship-helpers";

export interface PostUser {
  id: number;
  username: string;
  displayName: string | null;
  avatar: string | null;
}

export interface PostAttachment {
  id: number;
  filename: string;
  createdAt: string;
}

export interface PostAttachmentUri {
  uri: string;
}

export interface PostWithDetails {
  id: number;
  text: string;
  createdBy: number;
  user: PostUser | null;
  createdAt: string;
  updatedAt: string | null;
  attachments: PostAttachment[];
}

export interface PostWithUris {
  id: number;
  text: string;
  createdBy: number;
  user: PostUser | null;
  createdAt: string;
  updatedAt: string | null;
  attachments: PostAttachmentUri[];
}

export interface PostsWithCursor {
  posts: PostWithUris[];
  nextCursor: { createdAt: string; id: number } | null;
}

/**
 * Post Service
 * Handles post CRUD operations including attachment management
 */
export class PostService extends BaseService {
  /**
   * Creates a new post with optional attachments
   * Validates user has active relationship and attachments exist
   *
   * @param userId - User ID creating the post
   * @param text - Post text content
   * @param attachmentIds - Array of attachment IDs to link to post
   * @returns Created post with user info and attachments
   * @throws NoActiveRelationshipError if user has no active relationship
   * @throws InvalidAttachmentsError if any attachment IDs are invalid
   */
  async createPost(
    userId: number,
    text: string,
    attachmentIds: number[] = [],
  ): Promise<PostWithDetails> {
    const now = new Date();

    // Check if user has an active relationship
    const activeRelationship = await getUserActiveRelationship(
      this.ctx.db,
      userId,
    );

    if (!activeRelationship) {
      throw new HTTPException(403, {
        message: "You must pair with a partner before performing this action",
      });
    }

    // Validate attachments exist if any provided
    if (attachmentIds.length > 0) {
      const validAttachments = await this.ctx.db
        .select()
        .from(attachmentTable)
        .where(inArray(attachmentTable.id, attachmentIds));

      if (validAttachments.length !== attachmentIds.length) {
        const invalidIds = attachmentIds.filter(
          (id) => !validAttachments.some((att) => att.id === id),
        );
        throw new HTTPException(404, {
          message: `One or more attachment IDs not found or deleted: ${invalidIds.join(", ")}`,
        });
      }
    }

    // Create post
    const [post] = await this.ctx.db
      .insert(postTable)
      .values({
        text,
        createdBy: userId,
        relationshipId: activeRelationship.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Link attachments to post if any
    if (attachmentIds.length > 0) {
      await this.ctx.db
        .update(attachmentTable)
        .set({
          postId: post.id,
        })
        .where(inArray(attachmentTable.id, attachmentIds));
    }

    // Fetch attachments for response
    const postAttachments = await this.ctx.db
      .select()
      .from(attachmentTable)
      .where(eq(attachmentTable.postId, post.id));

    // Fetch post with user information
    const [postWithUser] = await this.ctx.db
      .select({
        post: postTable,
        user: USER_BASIC_INFO_SELECT,
      })
      .from(postTable)
      .leftJoin(userTable, eq(postTable.createdBy, userTable.id))
      .where(eq(postTable.id, post.id))
      .limit(1);

    return {
      id: post.id,
      text: post.text,
      createdBy: post.createdBy,
      user: postWithUser?.user
        ? {
            id: postWithUser.user.id,
            username: postWithUser.user.username,
            displayName: postWithUser.user.displayName,
            avatar: postWithUser.user.avatar,
          }
        : null,
      createdAt: post.createdAt?.toISOString() || now.toISOString(),
      updatedAt: post.updatedAt?.toISOString() || null,
      attachments: postAttachments.map((att) => ({
        id: att.id,
        filename: att.filename,
        createdAt: att.createdAt?.toISOString() || now.toISOString(),
      })),
    };
  }

  /**
   * Retrieves posts for user's active relationship with cursor-based pagination
   * Returns empty array if user has no active relationship
   *
   * @param userId - User ID to query posts for
   * @param options - Optional pagination options (limit and cursor)
   * @returns Paginated posts with user info, attachment URIs, and next cursor
   */
  async getRelationshipPosts(
    userId: number,
    options?: {
      limit?: number;
      cursor?: { createdAt: string; id: number };
    },
  ): Promise<PostsWithCursor> {
    const limit = options?.limit ?? 20;
    const cursor = options?.cursor;

    // Get user's active relationship
    const activeRelationship = await getUserActiveRelationship(
      this.ctx.db,
      userId,
    );

    if (!activeRelationship) {
      // No relationship - return empty posts
      return { posts: [], nextCursor: null };
    }

    // Build cursor-based where clause
    const cursorCondition = cursor
      ? or(
          lt(postTable.createdAt, new Date(cursor.createdAt)),
          and(
            eq(postTable.createdAt, new Date(cursor.createdAt)),
            lt(postTable.id, cursor.id),
          ),
        )
      : undefined;

    // Fetch relationship posts with user information
    // Query limit + 1 to determine if there's a next page
    const postsWithUsers = await this.ctx.db
      .select({
        post: postTable,
        user: USER_BASIC_INFO_SELECT,
      })
      .from(postTable)
      .leftJoin(userTable, eq(postTable.createdBy, userTable.id))
      .where(
        cursorCondition
          ? and(
              eq(postTable.relationshipId, activeRelationship.id),
              cursorCondition,
            )
          : eq(postTable.relationshipId, activeRelationship.id),
      )
      .orderBy(desc(postTable.createdAt), desc(postTable.id))
      .limit(limit + 1);

    // Determine if there's a next page and slice results
    const hasNextPage = postsWithUsers.length > limit;
    const paginatedPosts = hasNextPage
      ? postsWithUsers.slice(0, limit)
      : postsWithUsers;

    // Calculate next cursor from the last post in the current page
    const nextCursor =
      hasNextPage && paginatedPosts.length > 0
        ? {
            createdAt:
              paginatedPosts[
                paginatedPosts.length - 1
              ].post.createdAt?.toISOString() || new Date().toISOString(),
            id: paginatedPosts[paginatedPosts.length - 1].post.id,
          }
        : null;

    // Fetch attachments for all posts in current page
    const postIds = paginatedPosts.map((item) => item.post.id);
    const allAttachments =
      postIds.length > 0
        ? await this.ctx.db
            .select()
            .from(attachmentTable)
            .where(inArray(attachmentTable.postId, postIds))
        : [];

    // Group attachments by postId
    const attachmentsByPostId = allAttachments.reduce(
      (acc, attachment) => {
        if (attachment.postId) {
          if (!acc[attachment.postId]) {
            acc[attachment.postId] = [];
          }
          acc[attachment.postId].push(attachment);
        }
        return acc;
      },
      {} as Record<number, typeof allAttachments>,
    );

    // Build response with posts and their attachments
    const posts = paginatedPosts.map(({ post, user }) => ({
      id: post.id,
      text: post.text,
      createdBy: post.createdBy,
      user: user
        ? {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar,
          }
        : null,
      createdAt: post.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: post.updatedAt?.toISOString() || null,
      attachments: (attachmentsByPostId[post.id] || []).map((att) => ({
        uri: `/attachment/${att.filename}`,
      })),
    }));

    return { posts, nextCursor };
  }

  /**
   * Deletes a post and its attachments
   * Validates user owns the post and it belongs to their current relationship
   *
   * @param userId - User ID requesting deletion
   * @param postId - Post ID to delete
   * @throws PostNotFoundError if post doesn't exist or user doesn't own it
   * @throws WrongRelationshipError if post belongs to different relationship
   */
  async deletePost(userId: number, postId: number): Promise<void> {
    // Get user's active relationship
    const activeRelationship = await getUserActiveRelationship(
      this.ctx.db,
      userId,
    );

    // Check if post exists and belongs to user
    const [post] = await this.ctx.db
      .select()
      .from(postTable)
      .where(eq(postTable.id, postId))
      .limit(1);

    if (!post) {
      throw new HTTPException(404, {
        message: "Post not found or you don't have permission to access it",
      });
    }

    // Only creator can delete
    if (post.createdBy !== userId) {
      throw new HTTPException(404, {
        message: "Post not found or you don't have permission to access it",
      });
    }

    // Verify post belongs to user's current active relationship
    if (activeRelationship && post.relationshipId !== activeRelationship.id) {
      throw new HTTPException(403, {
        message: "Post does not belong to your current relationship",
      });
    }

    // Hard delete associated attachments first
    await this.ctx.db
      .delete(attachmentTable)
      .where(eq(attachmentTable.postId, postId));

    // Hard delete the post
    await this.ctx.db.delete(postTable).where(eq(postTable.id, postId));
  }
}
