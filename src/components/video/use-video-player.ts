import { useCallback, useEffect, useRef, useState } from "react";
import {
  enterFullscreen,
  exitFullscreen,
  getSavedMutedState,
  getSavedVolume,
  isElementFullscreen,
  saveMutedState,
  saveVolume,
  throttle,
} from "@/lib/video/video-utils";

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  error: Error | null;
}

export interface VideoPlayerActions {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  reload: () => void;
}

export interface UseVideoPlayerOptions {
  /** Auto-play when video is ready */
  autoPlay?: boolean;
  /** Callback when video ends */
  onEnded?: () => void;
  /** Enable keyboard shortcuts */
  enableKeyboard?: boolean;
  /** Container element for fullscreen (defaults to video element) */
  containerRef?: React.RefObject<HTMLElement | null>;
}

export interface UseVideoPlayerReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  state: VideoPlayerState;
  actions: VideoPlayerActions;
}

/**
 * Custom hook for managing video player state and controls
 *
 * @param options - Configuration options
 * @returns Video ref, state, and control actions
 *
 * @example
 * ```tsx
 * function VideoPlayer({ src }: { src: string }) {
 *   const { videoRef, state, actions } = useVideoPlayer({
 *     autoPlay: true,
 *     enableKeyboard: true
 *   });
 *
 *   return (
 *     <div>
 *       <video ref={videoRef} src={src} />
 *       <button onClick={actions.togglePlay}>
 *         {state.isPlaying ? 'Pause' : 'Play'}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useVideoPlayer(
  options: UseVideoPlayerOptions = {},
): UseVideoPlayerReturn {
  const {
    autoPlay = false,
    onEnded,
    enableKeyboard = true,
    containerRef,
  } = options;

  const videoRef = useRef<HTMLVideoElement>(null);

  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: getSavedVolume(1),
    isMuted: getSavedMutedState(false),
    isFullscreen: false,
    isLoading: true,
    isBuffering: false,
    error: null,
  });

  // Play video
  const play = useCallback(() => {
    videoRef.current?.play();
  }, []);

  // Pause video
  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  // Seek to specific time
  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  // Set volume (0-1)
  const setVolume = useCallback((volume: number) => {
    if (videoRef.current) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      videoRef.current.volume = clampedVolume;
      saveVolume(clampedVolume);
      setState((prev) => ({ ...prev, volume: clampedVolume }));
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      saveMutedState(newMuted);
      setState((prev) => ({ ...prev, isMuted: newMuted }));
    }
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    const element = containerRef?.current || videoRef.current;
    if (!element) return;

    try {
      if (isElementFullscreen(element)) {
        await exitFullscreen();
      } else {
        await enterFullscreen(element);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  }, [containerRef]);

  // Reload video
  const reload = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.load();
      setState((prev) => ({
        ...prev,
        error: null,
        isLoading: true,
      }));
    }
  }, []);

  // Initialize video on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set initial volume and muted state
    video.volume = state.volume;
    video.muted = state.isMuted;

    // Autoplay if enabled
    if (autoPlay) {
      play();
    }
  }, [autoPlay, play, state.volume, state.isMuted]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Throttled time update handler (max 10 FPS)
    const handleTimeUpdate = throttle(() => {
      setState((prev) => ({
        ...prev,
        currentTime: video.currentTime,
      }));
    }, 100);

    const handleLoadStart = () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
    };

    const handleLoadedMetadata = () => {
      setState((prev) => ({
        ...prev,
        duration: video.duration,
      }));
    };

    const handleCanPlay = () => {
      setState((prev) => ({ ...prev, isLoading: false }));
    };

    const handleWaiting = () => {
      setState((prev) => ({ ...prev, isBuffering: true }));
    };

    const handlePlaying = () => {
      setState((prev) => ({
        ...prev,
        isPlaying: true,
        isBuffering: false,
      }));
    };

    const handlePause = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
    };

    const handleVolumeChange = () => {
      setState((prev) => ({
        ...prev,
        volume: video.volume,
        isMuted: video.muted,
      }));
    };

    const handleEnded = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
      onEnded?.();
    };

    const handleError = () => {
      const error = video.error;
      setState((prev) => ({
        ...prev,
        error: error
          ? new Error(
              error.code === error.MEDIA_ERR_SRC_NOT_SUPPORTED
                ? "Video format not supported"
                : error.code === error.MEDIA_ERR_NETWORK
                  ? "Network error while loading video"
                  : error.code === error.MEDIA_ERR_DECODE
                    ? "Video decoding error"
                    : "Unknown video error",
            )
          : new Error("Unknown video error"),
        isLoading: false,
      }));
    };

    // Add event listeners
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("pause", handlePause);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("volumechange", handleVolumeChange);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    // Cleanup
    return () => {
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("volumechange", handleVolumeChange);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
    };
  }, [onEnded]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const element = containerRef?.current || videoRef.current;
      if (!element) return;

      setState((prev) => ({
        ...prev,
        isFullscreen: isElementFullscreen(element),
      }));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, [containerRef]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case " ": // Space
        case "k":
          e.preventDefault();
          togglePlay();
          break;

        case "m":
          e.preventDefault();
          toggleMute();
          break;

        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;

        case "arrowleft":
          e.preventDefault();
          seek(Math.max(0, state.currentTime - 5));
          break;

        case "arrowright":
          e.preventDefault();
          seek(Math.min(state.duration, state.currentTime + 5));
          break;

        case "arrowup":
          e.preventDefault();
          setVolume(Math.min(1, state.volume + 0.1));
          break;

        case "arrowdown":
          e.preventDefault();
          setVolume(Math.max(0, state.volume - 0.1));
          break;

        default:
          // Number keys 0-9 to seek to percentage
          if (e.key >= "0" && e.key <= "9") {
            e.preventDefault();
            const percent = parseInt(e.key) / 10;
            seek(state.duration * percent);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enableKeyboard,
    state.currentTime,
    state.duration,
    state.volume,
    togglePlay,
    toggleMute,
    toggleFullscreen,
    seek,
    setVolume,
  ]);

  const actions: VideoPlayerActions = {
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    reload,
  };

  return {
    videoRef,
    state,
    actions,
  };
}
