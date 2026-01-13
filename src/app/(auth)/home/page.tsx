"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCreationForm } from "./post-creation-form";
import { PostsFeed } from "./posts-feed";
import { GracePeriodBanner } from "./grace-period-banner";
import { useDebounce } from "@/hooks";
import { usePosts } from "@/hooks/queries/use-posts";
import { useRelationship } from "@/hooks/queries/use-relationship";
import { useSession } from "@/hooks/queries/use-auth";
import { useDeletePost } from "@/hooks/mutations/use-post-mutations";
import { handleApiError } from "@/lib/error-handler";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

const Dashboard = () => {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput.trim(), 300);

  const {
    data,
    isLoading: loading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = usePosts(debouncedSearch || undefined);
  const { data: relationshipData } = useRelationship();
  const { data: currentUser } = useSession();
  const deletePostMutation = useDeletePost();
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [ConfirmDialog, confirm] = useConfirmDialog();

  const handleDeletePost = async (postId: number) => {
    const confirmed = await confirm({
      title: "Delete Post?",
      description:
        "This will permanently delete your post. This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
    });

    if (!confirmed) return;

    setDeletingPostId(postId);

    try {
      await deletePostMutation.mutateAsync(postId);
    } catch (err) {
      console.error("Delete post error:", err);
      await confirm({
        title: "Error",
        description: handleApiError(err),
        confirmText: "OK",
      });
    } finally {
      setDeletingPostId(null);
    }
  };

  const partner = relationshipData?.relationship?.partner;
  const isPendingDeletion =
    relationshipData?.relationship?.status === "pending_deletion";
  const permanentDeletionAt =
    relationshipData?.relationship?.permanentDeletionAt;

  return (
    <>
      <ConfirmDialog />
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6">
          {/* Grace Period Banner */}
          {isPendingDeletion && permanentDeletionAt && (
            <GracePeriodBanner
              permanentDeletionAt={permanentDeletionAt}
              resumeRequest={
                relationshipData?.relationship?.resumeRequest || null
              }
              partnerName={
                partner?.displayName || partner?.username || "Your partner"
              }
            />
          )}

          {!isPendingDeletion && <PostCreationForm />}
          <Separator className="my-4 sm:my-6" />

          {/* Search Bar */}
          <div className="mb-4 sm:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:left-4 sm:h-5 sm:w-5" />
              <Input
                type="text"
                placeholder="Search posts..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-12 rounded-[20px] shadow-warm pl-10 pr-10 text-base placeholder:text-base sm:h-14 sm:pl-12 sm:pr-12 sm:text-xl sm:placeholder:text-xl"
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchInput("")}
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 sm:right-2 sm:h-9 sm:w-9"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}
            </div>
          </div>
          <PostsFeed
            pages={data?.pages || []}
            loading={loading}
            hasNextPage={hasNextPage || false}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            deletingPostId={deletingPostId}
            currentUserId={currentUser?.id}
            onDeletePost={handleDeletePost}
            searchQuery={debouncedSearch}
          />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
