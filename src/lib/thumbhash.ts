import { rgbaToThumbHash, thumbHashToDataURL } from "thumbhash";

/**
 * Generates a ThumbHash from an image file
 * Uses Canvas API to resize to 20x20 and extract RGBA data
 *
 * @param file - Image file to generate thumbhash from
 * @returns Base64-encoded thumbhash string (~25-30 bytes)
 */
export async function generateThumbHashForImage(
  file: File,
): Promise<string | null> {
  try {
    // Create image bitmap from file
    const img = await createImageBitmap(file);

    // Create small canvas for thumbnail
    const canvas = new OffscreenCanvas(20, 20);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get canvas context");
      return null;
    }

    // Draw resized image
    ctx.drawImage(img, 0, 0, 20, 20);

    // Get RGBA pixel data
    const imageData = ctx.getImageData(0, 0, 20, 20);

    // Generate thumbhash from RGBA data
    const thumbHash = rgbaToThumbHash(20, 20, imageData.data);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...thumbHash));
  } catch (error) {
    console.error("Failed to generate thumbhash:", error);
    return null;
  }
}

/**
 * Extracts a frame from a video file at a specific time
 *
 * @param file - Video file to extract frame from
 * @param timeInSeconds - Time to extract frame (default 0.5s)
 * @returns ImageData of the extracted frame, or null if failed
 */
async function extractVideoFrame(
  file: File,
  timeInSeconds: number = 0.5,
): Promise<ImageData | null> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        console.error("Failed to get canvas context");
        resolve(null);
        return;
      }

      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      const url = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        // Seek to specified time (or 0 if video is shorter)
        video.currentTime = Math.min(timeInSeconds, video.duration);
      };

      video.onseeked = () => {
        try {
          // Set canvas to video dimensions
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Draw the frame
          ctx.drawImage(video, 0, 0);

          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Cleanup
          URL.revokeObjectURL(url);
          video.remove();
          canvas.remove();

          resolve(imageData);
        } catch (error) {
          console.error("Failed to extract video frame:", error);
          URL.revokeObjectURL(url);
          video.remove();
          canvas.remove();
          resolve(null);
        }
      };

      video.onerror = () => {
        console.error("Failed to load video");
        URL.revokeObjectURL(url);
        video.remove();
        canvas.remove();
        resolve(null);
      };

      video.src = url;
    } catch (error) {
      console.error("Failed to extract video frame:", error);
      resolve(null);
    }
  });
}

/**
 * Generates a ThumbHash from a video file
 * Extracts frame at 0.5s and generates thumbhash from it
 *
 * @param file - Video file to generate thumbhash from
 * @returns Base64-encoded thumbhash string (~25-30 bytes)
 */
export async function generateThumbHashForVideo(
  file: File,
): Promise<string | null> {
  try {
    // Extract frame at 0.5 seconds
    const frameImageData = await extractVideoFrame(file, 0.5);
    if (!frameImageData) {
      console.error("Failed to extract video frame");
      return null;
    }

    // Create small canvas for thumbnail
    const canvas = new OffscreenCanvas(20, 20);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get canvas context");
      return null;
    }

    // Create temporary canvas with the full frame
    const tempCanvas = new OffscreenCanvas(
      frameImageData.width,
      frameImageData.height,
    );
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) {
      console.error("Failed to get temp canvas context");
      return null;
    }

    // Put the frame data on temp canvas
    tempCtx.putImageData(frameImageData, 0, 0);

    // Draw resized frame to small canvas
    ctx.drawImage(tempCanvas, 0, 0, 20, 20);

    // Get RGBA pixel data from small canvas
    const thumbnailImageData = ctx.getImageData(0, 0, 20, 20);

    // Generate thumbhash from RGBA data
    const thumbHash = rgbaToThumbHash(20, 20, thumbnailImageData.data);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...thumbHash));
  } catch (error) {
    console.error("Failed to generate thumbhash for video:", error);
    return null;
  }
}

/**
 * Converts a base64-encoded thumbhash to a data URL for display
 *
 * @param thumbHashBase64 - Base64-encoded thumbhash string
 * @returns Data URL string for use as image src
 */
export function thumbHashToDataUrl(thumbHashBase64: string): string {
  try {
    // Decode base64 to Uint8Array
    const binary = atob(thumbHashBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Convert thumbhash to data URL
    return thumbHashToDataURL(bytes);
  } catch (error) {
    console.error("Failed to decode thumbhash:", error);
    // Return a transparent pixel as fallback
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  }
}

/**
 * Converts base64 string to Uint8Array
 * Helper function for decoding thumbhash
 *
 * @param base64 - Base64 string
 * @returns Uint8Array of decoded bytes
 */
export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
