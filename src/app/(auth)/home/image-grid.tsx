"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { VideoThumbnail } from "@/components/video/video-thumbnail";
import { getFileType, getFilename } from "./attachment-utils";
import { thumbHashToDataUrl } from "@/lib/thumbhash";
import { useUpdateAttachmentThumbHash } from "@/hooks/mutations/use-attachment-mutations";

interface Attachment {
  uri: string;
  thumbHash?: string | null;
}

interface ImageGridProps {
  attachments: Attachment[];
  onImageClick?: (index: number) => void;
}

interface GridMediaProps {
  uri: string;
  thumbHash?: string | null;
  onClick?: () => void;
  className?: string;
  priority?: boolean;
}

/**
 * Side-effect component that handles automatic thumbHash generation and updates
 * Returns null - purely for managing thumbHash updates as a side effect
 */
const ThumbHashUpdater = ({
  uri,
  thumbHash,
}: {
  uri: string;
  thumbHash?: string | null;
}) => {
  const updateMutation = useUpdateAttachmentThumbHash();
  const hasAttemptedUpdate = useRef(false);

  useEffect(() => {
    // Only attempt update if thumbHash is missing and we haven't tried before
    if (!thumbHash && !hasAttemptedUpdate.current) {
      hasAttemptedUpdate.current = true;

      updateMutation.mutate({ uri });
    }
  }, [uri, thumbHash, updateMutation]);

  return null;
};

const GridMedia = ({
  uri,
  thumbHash,
  onClick,
  className = "",
  priority = false,
}: GridMediaProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const filename = getFilename(uri) || "Media";
  const fileType = getFileType(filename);

  // Render video with thumbnail and play button
  if (fileType === "video") {
    return (
      <VideoThumbnail
        videoUrl={uri}
        thumbHash={thumbHash}
        onClick={onClick}
        className={`hover:opacity-95 transition-opacity ${className}`}
        ariaLabel={`Play ${filename}`}
      />
    );
  }

  // Render image
  if (fileType === "image") {
    // Generate blur placeholder from thumbHash if available
    const blurDataURL = thumbHash ? thumbHashToDataUrl(thumbHash) : undefined;

    return (
      <button
        type="button"
        onClick={onClick}
        className={`relative overflow-hidden bg-muted hover:opacity-95 transition-opacity ${className}`}
      >
        {!imageLoaded && !blurDataURL && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
          </div>
        )}
        <Image
          src={uri}
          alt={filename}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 600px"
          priority={priority}
          placeholder={blurDataURL ? "blur" : "empty"}
          blurDataURL={blurDataURL}
          onLoad={() => setImageLoaded(true)}
        />
      </button>
    );
  }

  // Unknown file type - don't render
  return null;
};

/**
 * Wrapper component that encapsulates thumbHash update logic and media rendering
 * Combines ThumbHashUpdater (side effects) and GridMedia (rendering) into one component
 */
const GridMediaWithUpdate = ({
  uri,
  thumbHash,
  onClick,
  className = "",
  priority = false,
}: GridMediaProps) => {
  return (
    <>
      <ThumbHashUpdater uri={uri} thumbHash={thumbHash} />
      <GridMedia
        uri={uri}
        thumbHash={thumbHash}
        onClick={onClick}
        className={className}
        priority={priority}
      />
    </>
  );
};

export function ImageGrid({ attachments, onImageClick }: ImageGridProps) {
  const count = attachments.length;

  if (count === 0) return null;

  const handleClick = (index: number) => {
    onImageClick?.(index);
  };

  // 1 Image: Full width, max aspect 16:9
  if (count === 1) {
    return (
      <div className="mt-3 rounded-[16px] overflow-hidden border border-border max-h-[400px] md:max-h-[600px]">
        <div className="relative w-full aspect-video">
          <div className="relative w-full h-full">
            <GridMediaWithUpdate
              uri={attachments[0].uri}
              thumbHash={attachments[0].thumbHash}
              onClick={() => handleClick(0)}
              className="w-full h-full"
              priority
            />
          </div>
        </div>
      </div>
    );
  }

  // 2 Images: Side by side, 7:8 aspect ratio each
  if (count === 2) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-0 rounded-[16px] overflow-hidden border border-border max-h-[400px] md:max-h-[506px]">
        <GridMediaWithUpdate
          uri={attachments[0].uri}
          thumbHash={attachments[0].thumbHash}
          onClick={() => handleClick(0)}
          className="aspect-[7/8]"
          priority
        />
        <GridMediaWithUpdate
          uri={attachments[1].uri}
          thumbHash={attachments[1].thumbHash}
          onClick={() => handleClick(1)}
          className="aspect-[7/8]"
          priority
        />
      </div>
    );
  }

  // 3 Images: 1 row with 3 columns
  if (count === 3) {
    return (
      <div className="mt-3 grid grid-cols-3 gap-0 rounded-[16px] overflow-hidden border border-border max-h-[400px] md:max-h-[506px]">
        {attachments.map((attachment, idx) => (
          <GridMediaWithUpdate
            key={attachment.uri}
            uri={attachment.uri}
            thumbHash={attachment.thumbHash}
            onClick={() => handleClick(idx)}
            className="aspect-square"
            priority={idx === 0}
          />
        ))}
      </div>
    );
  }

  // 4 Images: 2x2 grid, square
  if (count === 4) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-0 rounded-[16px] overflow-hidden border border-border max-h-[400px] md:max-h-[506px]">
        {attachments.map((attachment, idx) => (
          <GridMediaWithUpdate
            key={attachment.uri}
            uri={attachment.uri}
            thumbHash={attachment.thumbHash}
            onClick={() => handleClick(idx)}
            className="aspect-square"
            priority={idx === 0}
          />
        ))}
      </div>
    );
  }

  // 5 Images: 2 top row + 3 bottom row
  if (count === 5) {
    return (
      <div className="mt-3 rounded-[16px] overflow-hidden border border-border max-h-[400px] md:max-h-[506px]">
        <div className="grid grid-cols-2 gap-0">
          {attachments.slice(0, 2).map((attachment, idx) => (
            <GridMediaWithUpdate
              key={attachment.uri}
              uri={attachment.uri}
              thumbHash={attachment.thumbHash}
              onClick={() => handleClick(idx)}
              className="aspect-square"
              priority={idx === 0}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-0">
          {attachments.slice(2, 5).map((attachment, idx) => (
            <GridMediaWithUpdate
              key={attachment.uri}
              uri={attachment.uri}
              thumbHash={attachment.thumbHash}
              onClick={() => handleClick(idx + 2)}
              className="aspect-square"
            />
          ))}
        </div>
      </div>
    );
  }

  // 6 Images: 3x2 grid
  if (count === 6) {
    return (
      <div className="mt-3 grid grid-cols-3 gap-0 rounded-lg md:rounded-2xl overflow-hidden border max-h-[400px] md:max-h-[506px]">
        {attachments.map((attachment, idx) => (
          <GridMediaWithUpdate
            key={attachment.uri}
            uri={attachment.uri}
            thumbHash={attachment.thumbHash}
            onClick={() => handleClick(idx)}
            className="aspect-square"
            priority={idx === 0}
          />
        ))}
      </div>
    );
  }

  // 7-9 Images: 3x3 grid (partial or full)
  if (count >= 7) {
    return (
      <div className="mt-3 grid grid-cols-3 gap-0 rounded-lg md:rounded-2xl overflow-hidden border max-h-[400px] md:max-h-[506px]">
        {attachments.slice(0, 9).map((attachment, idx) => (
          <GridMediaWithUpdate
            key={attachment.uri}
            uri={attachment.uri}
            thumbHash={attachment.thumbHash}
            onClick={() => handleClick(idx)}
            className="aspect-square"
            priority={idx === 0}
          />
        ))}
      </div>
    );
  }

  return null;
}
