import { useEffect, useRef, useState } from "react";
import { Play, Video } from "lucide-react";
import {
  extractVideoThumbnail,
  ThumbnailExtractionError,
} from "@/lib/video/thumbnail-extractor";
import { formatVideoDuration } from "@/lib/video/format-duration";

interface VideoThumbnailProps {
  /** Video URL to generate thumbnail from */
  videoUrl: string;
  /** Additional CSS classes */
  className?: string;
  /** Show play button overlay (default: true) */
  showPlayButton?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Aria label for accessibility */
  ariaLabel?: string;
}

/**
 * Video thumbnail component with duration badge
 *
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Automatic thumbnail extraction using Canvas API
 * - Duration badge in bottom-right corner
 * - Play button overlay
 * - Error fallback to video icon
 *
 * @example
 * ```tsx
 * <VideoThumbnail
 *   videoUrl="/attachment/video.mp4"
 *   onClick={() => setModalOpen(true)}
 *   className="aspect-video"
 * />
 * ```
 */
export function VideoThumbnail({
  videoUrl,
  className = "",
  showPlayButton = true,
  onClick,
  ariaLabel = "Play video",
}: VideoThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [thumbnailData, setThumbnailData] = useState<{
    dataUrl: string;
    duration: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  // Extract thumbnail when element comes into viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !thumbnailData && !isLoading && !error) {
            setIsLoading(true);

            extractVideoThumbnail({ videoUrl, width: 320 })
              .then((result) => {
                setThumbnailData({
                  dataUrl: result.dataUrl,
                  duration: result.duration,
                });
                setIsLoading(false);
              })
              .catch((err) => {
                console.error("Failed to extract video thumbnail:", err);
                if (err instanceof ThumbnailExtractionError) {
                  console.error(`Error code: ${err.code}`);
                }
                setError(true);
                setIsLoading(false);
              });
          }
        });
      },
      {
        rootMargin: "200px", // Start loading 200px before visible
      },
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [videoUrl, thumbnailData, isLoading, error]);

  // Common container classes
  const containerClasses = `relative overflow-hidden bg-muted ${className}`;

  // Loading state
  if (isLoading) {
    return (
      <div ref={containerRef} className={containerClasses}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-6 sm:size-8 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Error state - show video icon placeholder
  if (error || !thumbnailData) {
    const content = (
      <div className="absolute inset-0 flex items-center justify-center bg-muted">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Video className="size-10 sm:size-12" />
          <span className="text-xs font-medium">Video</span>
        </div>
        {showPlayButton && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group">
            <div className="p-2 sm:p-3 rounded-full bg-black/60 group-hover:bg-black/80 transition-colors backdrop-blur-sm">
              <Play className="size-5 sm:size-6 text-white fill-white" />
            </div>
          </div>
        )}
      </div>
    );

    return (
      <div ref={containerRef} className={containerClasses}>
        {onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="block w-full h-full"
            aria-label={ariaLabel}
          >
            {content}
          </button>
        ) : (
          content
        )}
      </div>
    );
  }

  // Success state - show thumbnail with duration badge
  const thumbnailContent = (
    <>
      <img
        src={thumbnailData.dataUrl}
        alt="Video thumbnail"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Duration badge */}
      <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 backdrop-blur-sm">
        <span className="text-white text-xs font-medium">
          {formatVideoDuration(thumbnailData.duration)}
        </span>
      </div>

      {/* Play button overlay */}
      {showPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group">
          <div className="p-2 sm:p-3 rounded-full bg-black/60 group-hover:bg-black/80 transition-colors backdrop-blur-sm">
            <Play className="size-5 sm:size-6 text-white fill-white" />
          </div>
        </div>
      )}
    </>
  );

  return (
    <div ref={containerRef} className={containerClasses}>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="block w-full h-full"
          aria-label={ariaLabel}
        >
          {thumbnailContent}
        </button>
      ) : (
        thumbnailContent
      )}
    </div>
  );
}
