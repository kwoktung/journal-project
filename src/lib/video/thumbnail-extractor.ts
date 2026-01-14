/**
 * Options for thumbnail extraction
 */
export interface ThumbnailOptions {
  /** Video URL to extract thumbnail from */
  videoUrl: string;
  /** Time in seconds to seek to for thumbnail (default: 1s or 10% of duration) */
  seekTime?: number;
  /** Maximum width of thumbnail (default: 320px) */
  width?: number;
  /** JPEG quality 0-1 (default: 0.8) */
  quality?: number;
}

/**
 * Result of thumbnail extraction
 */
export interface ThumbnailResult {
  /** Base64 data URL of thumbnail image */
  dataUrl: string;
  /** Video duration in seconds */
  duration: number;
  /** Thumbnail width in pixels */
  width: number;
  /** Thumbnail height in pixels */
  height: number;
}

/**
 * Error thrown when thumbnail extraction fails
 */
export class ThumbnailExtractionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "LOAD_ERROR"
      | "SEEK_ERROR"
      | "CANVAS_ERROR"
      | "CORS_ERROR"
      | "UNSUPPORTED",
  ) {
    super(message);
    this.name = "ThumbnailExtractionError";
  }
}

/**
 * Extract a thumbnail from a video using Canvas API
 *
 * @param options - Thumbnail extraction options
 * @returns Promise resolving to thumbnail result
 * @throws {ThumbnailExtractionError} If extraction fails
 *
 * @example
 * ```typescript
 * try {
 *   const result = await extractVideoThumbnail({
 *     videoUrl: '/attachment/video.mp4',
 *     seekTime: 2,
 *     width: 320
 *   });
 *   console.log(result.dataUrl); // "data:image/jpeg;base64,..."
 *   console.log(result.duration); // 120.5
 * } catch (error) {
 *   if (error instanceof ThumbnailExtractionError) {
 *     console.error(`Failed to extract thumbnail: ${error.code}`);
 *   }
 * }
 * ```
 */
export async function extractVideoThumbnail(
  options: ThumbnailOptions,
): Promise<ThumbnailResult> {
  const { videoUrl, width: maxWidth = 320, quality = 0.8 } = options;

  // Check if Canvas API is supported
  if (typeof HTMLCanvasElement === "undefined") {
    throw new ThumbnailExtractionError(
      "Canvas API not supported",
      "UNSUPPORTED",
    );
  }

  // Create off-screen video element
  const video = document.createElement("video");
  video.crossOrigin = "anonymous"; // Try to enable CORS
  video.preload = "metadata";
  video.muted = true; // Muted to avoid audio playback
  video.playsInline = true; // Better mobile support

  try {
    // Load video metadata
    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new ThumbnailExtractionError(
            "Video metadata loading timeout",
            "LOAD_ERROR",
          ),
        );
      }, 10000); // 10 second timeout

      video.addEventListener("loadedmetadata", () => {
        clearTimeout(timeoutId);
        resolve();
      });

      video.addEventListener("error", () => {
        clearTimeout(timeoutId);
        const error = video.error;
        if (error) {
          if (error.code === error.MEDIA_ERR_SRC_NOT_SUPPORTED) {
            reject(
              new ThumbnailExtractionError(
                "Video format not supported",
                "UNSUPPORTED",
              ),
            );
          } else {
            reject(
              new ThumbnailExtractionError(
                `Video load error: ${error.message}`,
                "LOAD_ERROR",
              ),
            );
          }
        } else {
          reject(
            new ThumbnailExtractionError(
              "Unknown video load error",
              "LOAD_ERROR",
            ),
          );
        }
      });

      video.src = videoUrl;
    });

    const duration = video.duration;

    // Validate duration
    if (!isFinite(duration) || duration <= 0) {
      throw new ThumbnailExtractionError(
        "Invalid video duration",
        "LOAD_ERROR",
      );
    }

    // Determine seek time (1s or 10% of duration, whichever is smaller)
    const seekTime = options.seekTime ?? Math.min(1, duration * 0.1);

    // Seek to desired time
    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new ThumbnailExtractionError("Video seek timeout", "SEEK_ERROR"),
        );
      }, 5000); // 5 second timeout

      video.addEventListener("seeked", () => {
        clearTimeout(timeoutId);
        resolve();
      });

      video.addEventListener("error", () => {
        clearTimeout(timeoutId);
        reject(new ThumbnailExtractionError("Video seek error", "SEEK_ERROR"));
      });

      video.currentTime = Math.min(seekTime, duration - 0.1);
    });

    // Calculate dimensions maintaining aspect ratio
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (videoWidth === 0 || videoHeight === 0) {
      throw new ThumbnailExtractionError(
        "Invalid video dimensions",
        "CANVAS_ERROR",
      );
    }

    const aspectRatio = videoWidth / videoHeight;
    const targetWidth = maxWidth;
    const targetHeight = Math.round(targetWidth / aspectRatio);

    // Create canvas and draw video frame
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new ThumbnailExtractionError(
        "Failed to get canvas context",
        "CANVAS_ERROR",
      );
    }

    try {
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
    } catch {
      // Likely a CORS error
      throw new ThumbnailExtractionError(
        "Failed to draw video frame (CORS?)",
        "CORS_ERROR",
      );
    }

    // Convert canvas to data URL
    let dataUrl: string;
    try {
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    } catch {
      throw new ThumbnailExtractionError(
        "Failed to convert canvas to data URL",
        "CANVAS_ERROR",
      );
    }

    return {
      dataUrl,
      duration,
      width: targetWidth,
      height: targetHeight,
    };
  } finally {
    // Cleanup: remove video element
    video.src = "";
    video.load();
  }
}
