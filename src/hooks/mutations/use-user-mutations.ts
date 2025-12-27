import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/client";
import { queryKeys } from "@/lib/query-keys";
import type { User } from "@/hooks/queries/use-auth";

export function useUpdateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { file: File }) => {
      // Upload file first
      const uploadResponse = await apiClient.attachment.postApiAttachment({
        file: data.file,
      });

      // Update avatar with the uploaded filename
      const avatarUrl = `/api/attachment/${uploadResponse.data.filename}`;
      const response = await apiClient.user.patchApiUserAvatar({
        avatar: avatarUrl,
      });

      return response.user;
    },

    // Optimistic update
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.auth.session() });

      const previousUser = queryClient.getQueryData<User | null>(
        queryKeys.auth.session(),
      );

      // Create preview URL for immediate feedback
      const previewUrl = URL.createObjectURL(data.file);

      queryClient.setQueryData<User | null>(queryKeys.auth.session(), (old) => {
        if (!old) return null;
        return {
          ...old,
          avatar: previewUrl,
        };
      });

      return { previousUser, previewUrl };
    },

    onError: (err, data, context) => {
      if (context?.previousUser !== undefined) {
        queryClient.setQueryData(
          queryKeys.auth.session(),
          context.previousUser,
        );
      }
      if (context?.previewUrl) {
        URL.revokeObjectURL(context.previewUrl);
      }
    },

    onSuccess: (data, variables, context) => {
      // Clean up preview URL
      if (context?.previewUrl) {
        URL.revokeObjectURL(context.previewUrl);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
    },
  });
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.user.patchApiUserAvatar({
        avatar: null,
      });
      return response.user;
    },

    // Optimistic update
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.auth.session() });

      const previousUser = queryClient.getQueryData<User | null>(
        queryKeys.auth.session(),
      );

      // Optimistically remove avatar
      queryClient.setQueryData<User | null>(queryKeys.auth.session(), (old) => {
        if (!old) return null;
        return {
          ...old,
          avatar: null,
        };
      });

      return { previousUser };
    },

    onError: (err, data, context) => {
      if (context?.previousUser !== undefined) {
        queryClient.setQueryData(
          queryKeys.auth.session(),
          context.previousUser,
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
    },
  });
}
