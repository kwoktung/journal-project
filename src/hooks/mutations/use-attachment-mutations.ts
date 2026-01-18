import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/client";
import {
  generateThumbHashForImage,
  generateThumbHashForVideo,
} from "@/lib/thumbhash";

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
