import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import * as Slider from "@radix-ui/react-slider";
import { formatVideoDuration } from "@/lib/video/format-duration";
import {
  getBufferedRanges,
  isFullscreenSupported,
} from "@/lib/video/video-utils";
import type { VideoPlayerState, VideoPlayerActions } from "./use-video-player";

interface VideoControlsProps {
  /** Video player state */
  state: VideoPlayerState;
  /** Video player actions */
  actions: VideoPlayerActions;
  /** Video element ref for buffered ranges */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Optional class name */
  className?: string;
}

/**
 * Custom video player controls
 *
 * Features:
 * - Play/pause toggle
 * - Scrubbing progress bar with buffered ranges
 * - Time display (current / total)
 * - Volume control with mute toggle
 * - Fullscreen toggle
 *
 * @example
 * ```tsx
 * <VideoControls
 *   state={state}
 *   actions={actions}
 *   videoRef={videoRef}
 * />
 * ```
 */
export function VideoControls({
  state,
  actions,
  videoRef,
  className = "",
}: VideoControlsProps) {
  const { isPlaying, currentTime, duration, volume, isMuted, isFullscreen } =
    state;
  const { togglePlay, seek, setVolume, toggleMute, toggleFullscreen } = actions;

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Get buffered ranges for display
  const bufferedRanges = videoRef.current
    ? getBufferedRanges(videoRef.current.buffered, duration)
    : [];

  // Format time displays
  const formattedCurrent = formatVideoDuration(currentTime);
  const formattedDuration = formatVideoDuration(duration);

  // Handle progress bar change
  const handleProgressChange = (values: number[]) => {
    const newTime = (values[0] / 100) * duration;
    seek(newTime);
  };

  // Handle volume change
  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0] / 100);
  };

  return (
    <div
      className={`flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 bg-black/60 backdrop-blur-sm ${className}`}
    >
      {/* Progress bar */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5 group"
          value={[progress]}
          max={100}
          step={0.1}
          onValueChange={handleProgressChange}
          aria-label="Video progress"
        >
          <Slider.Track className="bg-white/20 relative grow rounded-full h-1 group-hover:h-1.5 transition-all">
            {/* Buffered ranges */}
            {bufferedRanges.map((range, index) => (
              <div
                key={index}
                className="absolute bg-white/40 h-full rounded-full"
                style={{
                  left: `${range.start}%`,
                  width: `${range.end - range.start}%`,
                }}
              />
            ))}
            <Slider.Range className="absolute bg-white h-full rounded-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-3 h-3 bg-white rounded-full hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Seek"
          />
        </Slider.Root>
      </div>

      {/* Controls bar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          className="flex items-center justify-center size-8 sm:size-10 rounded-full hover:bg-white/10 transition-colors text-white"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="size-5 sm:size-6" />
          ) : (
            <Play className="size-5 sm:size-6 fill-white" />
          )}
        </button>

        {/* Time display */}
        <div className="flex items-center gap-1 text-white text-xs sm:text-sm font-medium">
          <span>{formattedCurrent}</span>
          <span className="text-white/60">/</span>
          <span className="text-white/80">{formattedDuration}</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Volume control */}
        <div className="flex items-center gap-2">
          {/* Volume/Mute button */}
          <button
            onClick={toggleMute}
            className="flex items-center justify-center size-8 sm:size-10 rounded-full hover:bg-white/10 transition-colors text-white"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="size-5 sm:size-6" />
            ) : (
              <Volume2 className="size-5 sm:size-6" />
            )}
          </button>

          {/* Volume slider - hidden on mobile */}
          <Slider.Root
            className="relative hidden sm:flex items-center select-none touch-none w-20 h-5 group"
            value={[isMuted ? 0 : volume * 100]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            aria-label="Volume"
          >
            <Slider.Track className="bg-white/20 relative grow rounded-full h-1 group-hover:h-1.5 transition-all">
              <Slider.Range className="absolute bg-white h-full rounded-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-3 h-3 bg-white rounded-full hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Volume level"
            />
          </Slider.Root>
        </div>

        {/* Fullscreen button */}
        {isFullscreenSupported() && (
          <button
            onClick={toggleFullscreen}
            className="flex items-center justify-center size-8 sm:size-10 rounded-full hover:bg-white/10 transition-colors text-white"
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="size-5 sm:size-6" />
            ) : (
              <Maximize className="size-5 sm:size-6" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
