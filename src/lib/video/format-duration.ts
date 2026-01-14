/**
 * Format video duration in seconds to human-readable time string
 * @param seconds - Duration in seconds
 * @returns Formatted time string (MM:SS or HH:MM:SS)
 * @example
 * formatVideoDuration(45) // "0:45"
 * formatVideoDuration(125) // "2:05"
 * formatVideoDuration(3665) // "1:01:05"
 */
export function formatVideoDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
