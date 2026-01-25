import { describe, it, expect, beforeEach, vi } from "vitest";
import { UserService } from "../user.service";
import { createMockContext } from "@/test/helpers";
import { HTTPException } from "hono/http-exception";

describe("UserService", () => {
  let userService: UserService;
  let mockCtx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockCtx = createMockContext();
    userService = new UserService(mockCtx);
  });

  describe("getUserById", () => {
    it("should return null if user not found", async () => {
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await userService.getUserById(1);

      expect(result).toBeNull();
    });

    it("should return user info when user exists", async () => {
      const userId = 1;
      const mockUser = {
        id: userId,
        email: "test@example.com",
        username: "testuser",
        displayName: "Test User",
        avatar: "https://example.com/avatar.jpg",
      };

      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const result = await userService.getUserById(userId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(userId);
      expect(result?.email).toBe(mockUser.email);
      expect(result?.username).toBe(mockUser.username);
      expect(result?.displayName).toBe(mockUser.displayName);
      expect(result?.avatar).toBe(mockUser.avatar);
    });

    it("should handle user with null displayName and avatar", async () => {
      const userId = 1;
      const mockUser = {
        id: userId,
        email: "test@example.com",
        username: "testuser",
        displayName: null,
        avatar: null,
      };

      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const result = await userService.getUserById(userId);

      expect(result).not.toBeNull();
      expect(result?.displayName).toBeNull();
      expect(result?.avatar).toBeNull();
    });
  });

  describe("updateAvatar", () => {
    it("should update user avatar successfully", async () => {
      const userId = 1;
      const newAvatar = "1234567890-abc-123.jpg";
      const currentUser = {
        id: userId,
        email: "test@example.com",
        username: "testuser",
        displayName: "Test User",
        avatar: "old-avatar.jpg",
      };
      const updatedUser = {
        id: userId,
        email: "test@example.com",
        username: "testuser",
        displayName: "Test User",
        avatar: newAvatar,
      };
      const mockAttachment = {
        id: 1,
        filename: newAvatar,
        referenceType: null,
        referenceId: null,
      };

      // Mock db.select - called twice: first for current user, second for attachment
      mockCtx.db.select = vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([currentUser]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockAttachment]),
            }),
          }),
        });

      // Mock R2.get to simulate file exists
      mockCtx.env.R2.get = vi.fn().mockResolvedValue({
        body: new ReadableStream(),
        httpMetadata: { contentType: "image/jpeg" },
        size: 1024,
        httpEtag: "test-etag",
      });

      // Mock R2.delete for old avatar
      mockCtx.env.R2.delete = vi.fn().mockResolvedValue(undefined);

      // Mock db.update - called twice: first for attachment, second for user
      mockCtx.db.update = vi
        .fn()
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        })
        .mockReturnValueOnce({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([updatedUser]),
            }),
          }),
        });

      // Mock db.delete for old avatar attachment
      mockCtx.db.delete = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const result = await userService.updateAvatar(userId, newAvatar);

      expect(result).toBeDefined();
      expect(result.avatar).toBe(newAvatar);
      expect(mockCtx.env.R2.get).toHaveBeenCalledWith(newAvatar);
      expect(mockCtx.env.R2.delete).toHaveBeenCalledWith("old-avatar.jpg");
    });

    it("should allow setting avatar to null", async () => {
      const userId = 1;
      const currentUser = {
        id: userId,
        email: "test@example.com",
        username: "testuser",
        displayName: "Test User",
        avatar: "old-avatar.jpg",
      };
      const updatedUser = {
        id: userId,
        email: "test@example.com",
        username: "testuser",
        displayName: "Test User",
        avatar: null,
      };

      // Mock db.select to get current user
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([currentUser]),
          }),
        }),
      });

      // Mock R2.get as a spy to verify it's not called
      mockCtx.env.R2.get = vi.fn();

      // Mock R2.delete for old avatar
      mockCtx.env.R2.delete = vi.fn().mockResolvedValue(undefined);

      mockCtx.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      // Mock db.delete for old avatar attachment
      mockCtx.db.delete = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const result = await userService.updateAvatar(userId, null);

      expect(result).toBeDefined();
      expect(result.avatar).toBeNull();
      // Should not check R2 when setting avatar to null
      expect(mockCtx.env.R2.get).not.toHaveBeenCalled();
      // Should delete old avatar
      expect(mockCtx.env.R2.delete).toHaveBeenCalledWith("old-avatar.jpg");
    });

    it("should throw HTTPException if avatar file not found in R2", async () => {
      const userId = 1;
      const avatarFilename = "nonexistent-file.jpg";
      const currentUser = {
        id: userId,
        email: "test@example.com",
        username: "testuser",
        displayName: "Test User",
        avatar: null,
      };

      // Mock db.select to get current user
      mockCtx.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([currentUser]),
          }),
        }),
      });

      // Mock R2.get to simulate file doesn't exist
      mockCtx.env.R2.get = vi.fn().mockResolvedValue(null);

      await expect(
        userService.updateAvatar(userId, avatarFilename),
      ).rejects.toThrow(HTTPException);
      await expect(
        userService.updateAvatar(userId, avatarFilename),
      ).rejects.toThrow("Avatar file not found in storage");

      expect(mockCtx.env.R2.get).toHaveBeenCalledWith(avatarFilename);
    });

    it("should throw HTTPException if user not found", async () => {
      const userId = 1;
      const avatarFilename = "1234567890-abc-123.jpg";

      // Mock R2.get to simulate file exists
      mockCtx.env.R2.get = vi.fn().mockResolvedValue({
        body: new ReadableStream(),
        httpMetadata: { contentType: "image/jpeg" },
        size: 1024,
        httpEtag: "test-etag",
      });

      mockCtx.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        userService.updateAvatar(userId, avatarFilename),
      ).rejects.toThrow(HTTPException);
    });
  });

  describe("updateProfile", () => {
    it("should update user display name successfully", async () => {
      const userId = 1;
      const newDisplayName = "New Display Name";
      const updatedUser = {
        id: userId,
        email: "test@example.com",
        username: "testuser",
        displayName: newDisplayName,
        avatar: "https://example.com/avatar.jpg",
      };

      mockCtx.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      const result = await userService.updateProfile(userId, newDisplayName);

      expect(result).toBeDefined();
      expect(result.displayName).toBe(newDisplayName);
      expect(mockCtx.db.update).toHaveBeenCalled();
    });

    it("should allow setting display name to null", async () => {
      const userId = 1;
      const updatedUser = {
        id: userId,
        email: "test@example.com",
        username: "testuser",
        displayName: null,
        avatar: "https://example.com/avatar.jpg",
      };

      mockCtx.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      const result = await userService.updateProfile(userId, null);

      expect(result).toBeDefined();
      expect(result.displayName).toBeNull();
    });

    it("should throw HTTPException if user not found", async () => {
      const userId = 1;

      mockCtx.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        userService.updateProfile(userId, "New Name"),
      ).rejects.toThrow(HTTPException);
    });
  });
});
