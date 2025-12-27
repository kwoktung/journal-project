import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/client";

export function useUploadAttachment() {
  return useMutation({
    mutationFn: async (file: File) => {
      const data = await apiClient.attachment.postApiAttachment({ file });
      return data.data.id;
    },
  });
}
