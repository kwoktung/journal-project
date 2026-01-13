"use client";

import { useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { X, Crop, Paperclip, Play } from "lucide-react";

type FileType = "image" | "video" | "unknown";

interface AttachmentPreview {
  file: File;
  preview?: string;
  fileType: FileType;
  editedFile?: File;
  editedPreview?: string;
  hasEdits?: boolean;
  uploading?: boolean;
}

interface ImagePreviewGalleryProps {
  attachments: AttachmentPreview[];
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onVideoClick?: (index: number) => void;
  disabled?: boolean;
}

export function ImagePreviewGallery({
  attachments,
  onEdit,
  onRemove,
  onVideoClick,
  disabled,
}: ImagePreviewGalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      // Optional: Track which slide is in view
    };

    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-2">
          {attachments.map((attachment, index) => {
            const displayPreview =
              attachment.editedPreview || attachment.preview;
            const isImage = attachment.fileType === "image";
            const isVideo = attachment.fileType === "video";

            return (
              <div
                key={index}
                className="flex-[0_0_auto] w-[120px] sm:w-[140px] relative group"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                  {/* Image Preview */}
                  {isImage && displayPreview ? (
                    <>
                      <Image
                        src={displayPreview}
                        alt={attachment.file.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {attachment.uploading && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <div className="w-6 h-6 border-4 border-muted-foreground/20 border-t-foreground rounded-full animate-spin" />
                        </div>
                      )}
                    </>
                  ) : isVideo && displayPreview ? (
                    /* Video Preview with Play Button */
                    <>
                      <video
                        src={displayPreview}
                        className="absolute inset-0 w-full h-full object-cover"
                        preload="metadata"
                      />
                      {/* Play button overlay - clickable to preview */}
                      {onVideoClick && !attachment.uploading && (
                        <button
                          type="button"
                          onClick={() => onVideoClick(index)}
                          disabled={disabled}
                          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group/play"
                          aria-label="Preview video"
                        >
                          <div className="p-2 rounded-full bg-black/60 group-hover/play:bg-black/80 transition-colors backdrop-blur-sm">
                            <Play className="size-5 text-white fill-white" />
                          </div>
                        </button>
                      )}
                      {!onVideoClick && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                          <div className="p-2 rounded-full bg-black/60 backdrop-blur-sm">
                            <Play className="size-5 text-white fill-white" />
                          </div>
                        </div>
                      )}
                      {attachment.uploading && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <div className="w-6 h-6 border-4 border-muted-foreground/20 border-t-foreground rounded-full animate-spin" />
                        </div>
                      )}
                    </>
                  ) : (
                    /* Fallback for unknown types */
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
                      <Paperclip className="size-6 text-muted-foreground" />
                      <span className="text-xs text-center truncate w-full text-muted-foreground">
                        {attachment.file.name}
                      </span>
                      {attachment.uploading && (
                        <div className="w-4 h-4 border-2 border-muted-foreground/20 border-t-foreground rounded-full animate-spin" />
                      )}
                    </div>
                  )}

                  {/* Edit button overlay */}
                  {isImage && !attachment.uploading && (
                    <button
                      type="button"
                      onClick={() => onEdit(index)}
                      disabled={disabled}
                      className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      aria-label="Edit image"
                    >
                      <div className="p-2 rounded-full bg-background/90 hover:bg-background">
                        <Crop className="size-5" />
                      </div>
                    </button>
                  )}

                  {/* Edited badge */}
                  {attachment.hasEdits && (
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded">
                      Edited
                    </div>
                  )}

                  {/* Remove button - Translucent style */}
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    disabled={disabled || attachment.uploading}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all disabled:cursor-not-allowed disabled:opacity-30 backdrop-blur-sm"
                    aria-label="Remove attachment"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
