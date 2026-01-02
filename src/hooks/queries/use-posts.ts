import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/client";
import { queryKeys } from "@/lib/query-keys";
import { User } from "./use-auth";

export type Post = {
  id: number;
  text: string;
  createdBy: number;
  user: User | null;
  createdAt: string;
  updatedAt: string | null;
  attachments: Array<{
    uri: string;
  }>;
};

export function usePosts() {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.list(),
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam ? JSON.stringify(pageParam) : undefined;
      const data = await apiClient.post.getApiPosts(20, cursor);
      return data;
    },
    initialPageParam: undefined as
      | { createdAt: string; id: number }
      | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60, // 1 minute
  });
}
