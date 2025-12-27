import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/client";
import { queryKeys } from "@/lib/query-keys";
import type { Post } from "@/hooks/queries/use-posts";

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { text: string; attachments?: number[] }) => {
      return await apiClient.post.postApiPosts(data);
    },

    // Optimistic update
    onMutate: async (newPost) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.list() });

      // Snapshot previous value
      const previousPosts = queryClient.getQueryData<Post[]>(
        queryKeys.posts.list(),
      );

      // Optimistically update cache
      queryClient.setQueryData<Post[]>(queryKeys.posts.list(), (old = []) => {
        const optimisticPost: Post = {
          id: Date.now(), // temporary ID
          text: newPost.text,
          createdBy: 0, // will be set by server
          createdAt: new Date().toISOString(),
          updatedAt: null,
          attachments: [],
          user: null, // will be populated by refetch
        };
        return [optimisticPost, ...old];
      });

      return { previousPosts };
    },

    // On error, rollback
    onError: (err, newPost, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(queryKeys.posts.list(), context.previousPosts);
      }
    },

    // Always refetch to get server state
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.list() });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number) => {
      return await apiClient.post.deleteApiPosts(postId.toString());
    },

    // Optimistic update
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.list() });

      const previousPosts = queryClient.getQueryData<Post[]>(
        queryKeys.posts.list(),
      );

      // Optimistically remove from UI
      queryClient.setQueryData<Post[]>(queryKeys.posts.list(), (old = []) =>
        old.filter((post) => post.id !== deletedId),
      );

      return { previousPosts };
    },

    onError: (err, deletedId, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(queryKeys.posts.list(), context.previousPosts);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.list() });
    },
  });
}
