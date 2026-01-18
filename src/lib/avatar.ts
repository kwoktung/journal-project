/**
 * Gets the avatar URL with proper fallback handling
 * @param filename - Avatar filename (stored in database)
 * @param previewUrl - Optional preview URL (e.g., for blob URLs during editing)
 * @returns Full avatar URL or null
 */
export function getAvatarUrl(
  filename: string | null,
  previewUrl?: string | null,
): string | null {
  if (previewUrl) {
    return previewUrl;
  }

  if (filename) {
    // If filename is already a full URL, return it; otherwise construct the path
    return filename.startsWith("http") || filename.startsWith("/")
      ? filename
      : `/api/attachment/${filename}`;
  }

  return null;
}
