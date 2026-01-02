"use client";

import { useState } from "react";
import { Post } from "./types";
import { AttachmentGallery } from "./gallery";
import { PostItem } from "./post-item";
import { PostSkeleton } from "./post-skeleton";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { Loader2 } from "lucide-react";

type PostsPage = {
  posts: Post[];
  nextCursor: { createdAt: string; id: number } | null;
};

interface PostsFeedProps {
  pages: PostsPage[];
  loading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  deletingPostId: number | null;
  currentUserId?: number;
  onDeletePost: (postId: number) => void;
}

export const PostsFeed = ({
  pages,
  loading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  deletingPostId,
  currentUserId,
  onDeletePost,
}: PostsFeedProps) => {
  const [galleryState, setGalleryState] = useState<{
    open: boolean;
    attachments: Array<{ uri: string }>;
    initialIndex: number;
  } | null>(null);

  // Intersection observer for infinite scroll
  const sentinelRef = useInfiniteScroll(
    () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    { enabled: hasNextPage && !isFetchingNextPage },
  );

  // Flatten all posts from all pages
  const allPosts = pages.flatMap((page) => page.posts);

  const openGallery = (attachments: Array<{ uri: string }>, index: number) => {
    setGalleryState({ open: true, attachments, initialIndex: index });
  };

  const closeGallery = () => {
    setGalleryState(null);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 hidden">Posts</h2>
      {loading ? (
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : allPosts.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No posts yet. Create your first post above!
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {allPosts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                isDeleting={deletingPostId === post.id}
                currentUserId={currentUserId}
                onDelete={onDeletePost}
                onImageClick={openGallery}
              />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div
            ref={sentinelRef}
            className="h-20 flex items-center justify-center"
          >
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading more posts...</span>
              </div>
            )}
            {!hasNextPage && allPosts.length > 0 && (
              <div className="text-center text-muted-foreground py-4">
                You&apos;ve reached the end!
              </div>
            )}
          </div>
        </>
      )}
      {galleryState && (
        <AttachmentGallery
          attachments={galleryState.attachments}
          initialIndex={galleryState.initialIndex}
          open={galleryState.open}
          onOpenChange={(open) => !open && closeGallery()}
        />
      )}
    </div>
  );
};
