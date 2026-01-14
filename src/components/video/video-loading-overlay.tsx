interface VideoLoadingOverlayProps {
  /** Initial loading state (before video is ready) */
  isLoading: boolean;
  /** Buffering state (during playback) */
  isBuffering: boolean;
  /** Optional label for screen readers */
  label?: string;
}

/**
 * Loading and buffering overlay for video player
 *
 * Shows different visual states:
 * - Initial loading: Full overlay with large spinner
 * - Buffering: Small centered spinner
 * - Ready: Hidden
 */
export function VideoLoadingOverlay({
  isLoading,
  isBuffering,
  label = "Loading video",
}: VideoLoadingOverlayProps) {
  // Don't render anything if not loading or buffering
  if (!isLoading && !isBuffering) {
    return null;
  }

  // Initial loading state
  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
        <div className="flex flex-col items-center gap-2">
          <div
            className="size-8 sm:size-10 border-2 border-white/20 border-t-white rounded-full animate-spin"
            role="status"
            aria-label={label}
          />
          <span className="sr-only">{label}</span>
        </div>
      </div>
    );
  }

  // Buffering during playback
  if (isBuffering) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="size-6 sm:size-8 border-2 border-white/20 border-t-white rounded-full animate-spin"
          role="status"
          aria-label="Buffering"
        />
        <span className="sr-only">Buffering</span>
      </div>
    );
  }

  return null;
}
