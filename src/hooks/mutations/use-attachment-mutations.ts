import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/client";
import {
  generateThumbHashForImage,
  generateThumbHashForVideo,
} from "@/lib/thumbhash";
import { queryKeys } from "@/lib/query-keys";

export function useUploadAttachment() {
  return useMutation({
    mutationFn: async (file: File) => {
      // Generate thumbHash for images and videos
      let thumbHash: string | null = null;

      if (file.type.startsWith("image/")) {
        thumbHash = await generateThumbHashForImage(file);
      } else if (file.type.startsWith("video/")) {
        thumbHash = await generateThumbHashForVideo(file);
      }

      const data = await apiClient.attachment.postApiAttachment({
        file,
        thumbHash: thumbHash || undefined,
      });
      return data.data.id;
    },
  });
}

export function useUpdateAttachmentThumbHash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uri }: { uri: string }) => {
      // Extract filename from URI
      const filename = uri.split("/").pop();
      if (!filename) {
        throw new Error("Invalid attachment URI");
      }

      // Fetch the file from URI
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error("Failed to fetch attachment");
      }

      const blob = await response.blob();
      const contentType = response.headers.get("content-type") || "";
      const file = new File([blob], filename, { type: contentType });

      // Generate thumbHash based on file type
      let thumbHash: string | null = null;

      if (contentType.startsWith("image/")) {
        thumbHash = await generateThumbHashForImage(file);
      } else if (contentType.startsWith("video/")) {
        thumbHash = await generateThumbHashForVideo(file);
      }

      if (!thumbHash) {
        throw new Error("Failed to generate thumbHash");
      }

      // Update on server using filename
      const data = await apiClient.attachment.patchApiAttachmentThumbhash(
        filename,
        { thumbHash },
      );

      return { filename, thumbHash: data.data.thumbHash };
    },
    onSuccess: () => {
      // Invalidate posts query to refresh UI with new thumbHash
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.list() });
    },
  });
}
