import {
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/client";
import { queryKeys } from "@/lib/query-keys";
import type { Post } from "@/hooks/queries/use-posts";

type PostsResponse = {
  posts: Post[];
  nextCursor: { createdAt: string; id: number } | null;
};

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { text: string; attachments?: number[] }) => {
      return await apiClient.post.postApiPosts(data);
    },

    // Optimistic update for infinite query
    onMutate: async (newPost) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.list() });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<
        InfiniteData<PostsResponse>
      >(queryKeys.posts.list());

      // Optimistically update: prepend to first page
      queryClient.setQueryData<InfiniteData<PostsResponse>>(
        queryKeys.posts.list(),
        (old) => {
          if (!old) return old;

          const optimisticPost: Post = {
            id: Date.now(), // temporary ID
            text: newPost.text,
            createdBy: 0, // will be set by server
            createdAt: new Date().toISOString(),
            updatedAt: null,
            attachments: [],
            user: null, // will be populated by refetch
          };

          return {
            ...old,
            pages: old.pages.map((page, index) =>
              index === 0
                ? { ...page, posts: [optimisticPost, ...page.posts] }
                : page,
            ),
          };
        },
      );

      return { previousData };
    },

    // On error, rollback
    onError: (err, newPost, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.posts.list(), context.previousData);
      }
    },

    // Refetch on success
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.list(),
      });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: number) => {
      return await apiClient.post.deleteApiPosts(postId.toString());
    },

    // Optimistic update for infinite query
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.list() });

      const previousData = queryClient.getQueryData<
        InfiniteData<PostsResponse>
      >(queryKeys.posts.list());

      // Optimistically remove from all pages
      queryClient.setQueryData<InfiniteData<PostsResponse>>(
        queryKeys.posts.list(),
        (old) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              posts: page.posts.filter((post) => post.id !== deletedId),
            })),
          };
        },
      );

      return { previousData };
    },

    onError: (err, deletedId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.posts.list(), context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.list() });
    },
  });
}
