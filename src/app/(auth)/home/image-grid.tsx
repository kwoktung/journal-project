"use client";

import Image from "next/image";
import { useState } from "react";
import { getFileType, getFilename } from "./attachment-utils";

interface Attachment {
  uri: string;
}

interface ImageGridProps {
  attachments: Attachment[];
  onImageClick?: (index: number) => void;
}

interface GridImageProps {
  uri: string;
  onClick?: () => void;
  className?: string;
  priority?: boolean;
}

const GridImage = ({
  uri,
  onClick,
  className = "",
  priority = false,
}: GridImageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const filename = getFilename(uri) || "Image";
  const fileType = getFileType(filename);

  if (fileType !== "image") {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden bg-muted hover:opacity-95 transition-opacity ${className}`}
    >
      {!imageLoaded && (
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
        unoptimized
        onLoad={() => setImageLoaded(true)}
      />
    </button>
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
            <GridImage
              uri={attachments[0].uri}
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
        <GridImage
          uri={attachments[0].uri}
          onClick={() => handleClick(0)}
          className="aspect-[7/8]"
          priority
        />
        <GridImage
          uri={attachments[1].uri}
          onClick={() => handleClick(1)}
          className="aspect-[7/8]"
          priority
        />
      </div>
    );
  }

  // 3 Images: 1 large left (7:8) + 2 stacked right (each takes half height)
  if (count === 3) {
    return (
      <div className="mt-3 flex gap-0 rounded-[16px] overflow-hidden border border-border max-h-[400px] md:max-h-[506px] aspect-[16/10]">
        <div className="flex-[2] min-w-0">
          <GridImage
            uri={attachments[0].uri}
            onClick={() => handleClick(0)}
            className="h-full w-full"
            priority
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-0">
          <GridImage
            uri={attachments[1].uri}
            onClick={() => handleClick(1)}
            className="flex-1 h-0 w-full"
          />
          <GridImage
            uri={attachments[2].uri}
            onClick={() => handleClick(2)}
            className="flex-1 h-0 w-full"
          />
        </div>
      </div>
    );
  }

  // 4 Images: 2x2 grid, square
  if (count === 4) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-0 rounded-[16px] overflow-hidden border border-border max-h-[400px] md:max-h-[506px]">
        {attachments.map((attachment, idx) => (
          <GridImage
            key={idx}
            uri={attachment.uri}
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
            <GridImage
              key={idx}
              uri={attachment.uri}
              onClick={() => handleClick(idx)}
              className="aspect-square"
              priority={idx === 0}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-0">
          {attachments.slice(2, 5).map((attachment, idx) => (
            <GridImage
              key={idx + 2}
              uri={attachment.uri}
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
          <GridImage
            key={idx}
            uri={attachment.uri}
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
          <GridImage
            key={idx}
            uri={attachment.uri}
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
