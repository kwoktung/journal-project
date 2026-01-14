import { useRef, useState, useEffect } from "react";
import { AlertCircle, Play } from "lucide-react";
import { useVideoPlayer } from "./use-video-player";
import { VideoControls } from "./video-controls";
import { VideoLoadingOverlay } from "./video-loading-overlay";

interface VideoPlayerProps {
  /** Video source URL */
  src: string;
  /** Auto-play when ready (default: false) */
  autoPlay?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when video ends */
  onEnded?: () => void;
  /** Enable keyboard shortcuts (default: true) */
  enableKeyboard?: boolean;
  /** Preload strategy (default: "metadata") */
  preload?: "none" | "metadata" | "auto";
}

/**
 * Custom video player with controls
 *
 * Features:
 * - Custom UI controls (play/pause, progress, volume, fullscreen)
 * - Loading and buffering states
 * - Error handling with retry
 * - Click to play/pause
 * - Keyboard shortcuts
 * - Auto-hide controls
 *
 * @example
 * ```tsx
 * <VideoPlayer
 *   src="/attachment/video.mp4"
 *   autoPlay
 *   onEnded={() => console.log('Video ended')}
 * />
 * ```
 */
export function VideoPlayer({
  src,
  autoPlay = false,
  className = "",
  onEnded,
  enableKeyboard = true,
  preload = "metadata",
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { videoRef, state, actions } = useVideoPlayer({
    autoPlay,
    onEnded,
    enableKeyboard,
    containerRef,
  });

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    // Clear existing timeout
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }

    // Don't auto-hide if paused, loading, has error, or on mobile
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (!state.isPlaying || state.error || isMobile) {
      setShowControls(true);
      return;
    }

    // Show controls when hovering
    if (isHovering) {
      setShowControls(true);
      return;
    }

    // Hide controls after 3 seconds
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [state.isPlaying, state.error, isHovering]);

  // Handle mouse movement to show controls
  const handleMouseMove = () => {
    setShowControls(true);
  };

  // Handle click on video to toggle play/pause
  const handleVideoClick = () => {
    actions.togglePlay();
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        preload={preload}
        playsInline
        className="w-full h-full object-contain"
        onClick={handleVideoClick}
      >
        Your browser does not support video playback.
      </video>

      {/* Loading overlay */}
      <VideoLoadingOverlay
        isLoading={state.isLoading}
        isBuffering={state.isBuffering}
      />

      {/* Error state */}
      {state.error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4">
          <AlertCircle className="size-12 text-red-500 mb-4" />
          <p className="text-white text-sm text-center mb-4">
            {state.error.message}
          </p>
          <button
            onClick={actions.reload}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Center play button (shown when paused and not loading) */}
      {!state.isPlaying && !state.isLoading && !state.error && (
        <button
          onClick={handleVideoClick}
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
          aria-label="Play video"
        >
          <div className="p-4 sm:p-6 rounded-full bg-black/60 group-hover:bg-black/80 transition-colors backdrop-blur-sm">
            <Play className="size-8 sm:size-12 text-white fill-white" />
          </div>
        </button>
      )}

      {/* Controls */}
      {!state.error && (
        <div
          className={`absolute bottom-0 left-0 right-0 transition-opacity duration-200 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <VideoControls state={state} actions={actions} videoRef={videoRef} />
        </div>
      )}

      {/* Screen reader announcements */}
      <div aria-live="polite" className="sr-only">
        {state.isBuffering && "Video is buffering"}
        {state.error && `Error: ${state.error.message}`}
      </div>
    </div>
  );
}
