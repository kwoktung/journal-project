/**
 * Check if the Fullscreen API is supported
 */
export function isFullscreenSupported(): boolean {
  return !!(
    document.fullscreenEnabled ||
    (document as Document & { webkitFullscreenEnabled?: boolean })
      .webkitFullscreenEnabled
  );
}

/**
 * Enter fullscreen mode for an element
 * @param element - Element to make fullscreen
 * @returns Promise that resolves when fullscreen is entered
 */
export async function enterFullscreen(element: HTMLElement): Promise<void> {
  if (element.requestFullscreen) {
    await element.requestFullscreen();
  } else if (
    (element as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> })
      .webkitRequestFullscreen
  ) {
    await (
      element as HTMLElement & { webkitRequestFullscreen: () => Promise<void> }
    ).webkitRequestFullscreen();
  }
}

/**
 * Exit fullscreen mode
 * @returns Promise that resolves when fullscreen is exited
 */
export async function exitFullscreen(): Promise<void> {
  if (document.exitFullscreen) {
    await document.exitFullscreen();
  } else if (
    (document as Document & { webkitExitFullscreen?: () => Promise<void> })
      .webkitExitFullscreen
  ) {
    await (
      document as Document & { webkitExitFullscreen: () => Promise<void> }
    ).webkitExitFullscreen();
  }
}

/**
 * Check if an element is currently in fullscreen mode
 * @param element - Element to check
 */
export function isElementFullscreen(element: HTMLElement): boolean {
  const fullscreenElement =
    document.fullscreenElement ||
    (document as Document & { webkitFullscreenElement?: Element })
      .webkitFullscreenElement;
  return fullscreenElement === element;
}

/**
 * Throttle a function to limit how often it can be called
 * @param func - Function to throttle
 * @param limit - Minimum time between calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Format buffered time ranges for display
 * @param buffered - TimeRanges object from video element
 * @param duration - Total video duration
 * @returns Array of {start, end} percentage ranges
 */
export function getBufferedRanges(
  buffered: TimeRanges,
  duration: number,
): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];

  for (let i = 0; i < buffered.length; i++) {
    const start = (buffered.start(i) / duration) * 100;
    const end = (buffered.end(i) / duration) * 100;
    ranges.push({ start, end });
  }

  return ranges;
}

/**
 * Get the volume level from localStorage or default
 * @param defaultVolume - Default volume if not found (0-1)
 * @returns Volume level (0-1)
 */
export function getSavedVolume(defaultVolume: number = 1): number {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return defaultVolume;
  }

  const saved = localStorage.getItem("video-player-volume");
  if (saved === null) {
    return defaultVolume;
  }

  const volume = parseFloat(saved);
  if (isNaN(volume) || volume < 0 || volume > 1) {
    return defaultVolume;
  }

  return volume;
}

/**
 * Save volume level to localStorage
 * @param volume - Volume level to save (0-1)
 */
export function saveVolume(volume: number): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem("video-player-volume", volume.toString());
}

/**
 * Get the muted state from localStorage or default
 * @param defaultMuted - Default muted state if not found
 * @returns Muted state
 */
export function getSavedMutedState(defaultMuted: boolean = false): boolean {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return defaultMuted;
  }

  const saved = localStorage.getItem("video-player-muted");
  if (saved === null) {
    return defaultMuted;
  }

  return saved === "true";
}

/**
 * Save muted state to localStorage
 * @param muted - Muted state to save
 */
export function saveMutedState(muted: boolean): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem("video-player-muted", muted.toString());
}
