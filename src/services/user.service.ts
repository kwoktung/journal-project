import { BaseService } from "./service";
import { userTable, attachmentTable } from "@/database/schema";
import { eq, and, isNull } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

export interface UserInfo {
  id: number;
  email: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
}

/**
 * User Service
 * Handles user CRUD operations
 */
export class UserService extends BaseService {
  /**
   * Gets user information by user ID
   *
   * @param userId - User ID to retrieve
   * @returns User information or null if not found
   */
  async getUserById(userId: number): Promise<UserInfo | null> {
    const [user] = await this.ctx.db
      .select({
        id: userTable.id,
        email: userTable.email,
        username: userTable.username,
        displayName: userTable.displayName,
        avatar: userTable.avatar,
      })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
    };
  }

  /**
   * Updates user avatar
   * Links an orphaned attachment to the user and deletes the old avatar
   *
   * @param userId - User ID to update
   * @param avatarFilename - New avatar filename (can be null to remove avatar)
   * @returns Updated user information
   * @throws NotFoundError if user not found
   * @throws BadRequestError if avatar file doesn't exist in R2 or attachment table
   * @throws BadRequestError if attachment is already linked to another resource
   */
  async updateAvatar(
    userId: number,
    avatarFilename: string | null,
  ): Promise<UserInfo> {
    // Get current user to check for old avatar
    const [currentUser] = await this.ctx.db
      .select({
        id: userTable.id,
        email: userTable.email,
        username: userTable.username,
        displayName: userTable.displayName,
        avatar: userTable.avatar,
      })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (!currentUser) {
      throw new HTTPException(404, { message: "User not found" });
    }

    const oldAvatar = currentUser.avatar;

    // Validate and link the new avatar if filename is provided
    if (avatarFilename !== null) {
      // Check if file exists in R2 storage
      const fileExists = await this.ctx.env.R2.get(avatarFilename);
      if (!fileExists) {
        throw new HTTPException(400, {
          message: "Avatar file not found in storage",
        });
      }

      // Check if attachment exists in the attachment table
      const [attachment] = await this.ctx.db
        .select()
        .from(attachmentTable)
        .where(eq(attachmentTable.filename, avatarFilename))
        .limit(1);

      if (!attachment) {
        throw new HTTPException(400, {
          message: "Attachment record not found",
        });
      }

      // Verify that referenceType and referenceId are null (orphaned attachment)
      if (
        attachment.referenceType !== null ||
        attachment.referenceId !== null
      ) {
        throw new HTTPException(400, {
          message: "Attachment is already linked to another resource",
        });
      }

      // Update attachment to link it to the user (referenceType: "avatar", referenceId: userId)
      await this.ctx.db
        .update(attachmentTable)
        .set({
          referenceType: "avatar",
          referenceId: userId,
        })
        .where(eq(attachmentTable.id, attachment.id));
    }

    const now = new Date();

    // Update the user's avatar field
    const [updatedUser] = await this.ctx.db
      .update(userTable)
      .set({
        avatar: avatarFilename,
        updatedAt: now,
      })
      .where(eq(userTable.id, userId))
      .returning({
        id: userTable.id,
        email: userTable.email,
        username: userTable.username,
        displayName: userTable.displayName,
        avatar: userTable.avatar,
      });

    if (!updatedUser) {
      throw new HTTPException(404, { message: "User not found" });
    }

    // Delete the old avatar if it exists
    if (oldAvatar) {
      // Delete from R2
      await this.ctx.env.R2.delete(oldAvatar);

      // Delete from attachment table
      await this.ctx.db
        .delete(attachmentTable)
        .where(eq(attachmentTable.filename, oldAvatar));
    }

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      avatar: updatedUser.avatar,
    };
  }

  /**
   * Updates user profile information (display name)
   * Can be extended to update other profile fields as needed
   *
   * @param userId - User ID to update
   * @param displayName - New display name
   * @returns Updated user information
   * @throws NotFoundError if user not found
   */
  async updateProfile(
    userId: number,
    displayName: string | null,
  ): Promise<UserInfo> {
    const now = new Date();

    const [updatedUser] = await this.ctx.db
      .update(userTable)
      .set({
        displayName,
        updatedAt: now,
      })
      .where(eq(userTable.id, userId))
      .returning({
        id: userTable.id,
        email: userTable.email,
        username: userTable.username,
        displayName: userTable.displayName,
        avatar: userTable.avatar,
      });

    if (!updatedUser) {
      throw new HTTPException(404, { message: "User not found" });
    }

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      avatar: updatedUser.avatar,
    };
  }
}
