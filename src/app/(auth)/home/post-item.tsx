"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, MoreHorizontal } from "lucide-react";
import { Post } from "./types";
import { ImageGrid } from "./image-grid";
import { UserAvatar } from "./user-avatar";
import { formatTimestamp, formatFullTimestamp } from "@/lib/format/timestamp";
interface PostItemProps {
  post: Post;
  isDeleting: boolean;
  currentUserId?: number;
  onDelete: (postId: number) => void;
  onImageClick: (attachments: Array<{ uri: string }>, index: number) => void;
}

export const PostItem = ({
  post,
  isDeleting,
  currentUserId,
  onDelete,
  onImageClick,
}: PostItemProps) => {
  const isOwnPost = currentUserId === post.createdBy;

  // Display name: "You" for own posts, partner's name for partner's posts
  const displayName = isOwnPost
    ? "You"
    : post.user
      ? post.user.displayName || post.user.username
      : `User ${post.createdBy}`;

  return (
    <div className="group bg-card border border-border rounded-[20px] p-6 shadow-warm">
      <div className="flex gap-3">
        <UserAvatar user={post.user} createdBy={post.createdBy} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {displayName}
              </span>
              <span
                className="text-muted-foreground text-sm font-normal"
                title={formatFullTimestamp(post.createdAt)}
              >
                · {formatTimestamp(post.createdAt)}
              </span>
            </div>
            {/* Only show delete option for own posts */}
            {isOwnPost && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                    disabled={isDeleting}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onDelete(post.id)}
                    disabled={isDeleting}
                    className="text-destructive focus:text-destructive"
                  >
                    {isDeleting ? (
                      <>
                        <div className="h-4 w-4 mr-2 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words content-text">
            {post.text}
          </p>
          {post.attachments && post.attachments.length > 0 && (
            <ImageGrid
              attachments={post.attachments}
              onImageClick={(idx) => onImageClick(post.attachments, idx)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
