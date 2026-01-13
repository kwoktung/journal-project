"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks";

interface VideoPreviewModalProps {
  open: boolean;
  videoUrl: string;
  filename: string;
  onOpenChange: (open: boolean) => void;
}

export function VideoPreviewModal({
  open,
  videoUrl,
  filename,
  onOpenChange,
}: VideoPreviewModalProps) {
  const mounted = useMounted();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Pause video when modal closes
  useEffect(() => {
    if (!open && videoRef.current) {
      videoRef.current.pause();
    }
  }, [open]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-background/95 z-50 animate-in fade-in-0 duration-200 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Content */}
      <div
        className="fixed inset-0 z-50 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Video preview"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <h2 className="text-lg font-semibold truncate">{filename}</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-full hover:bg-muted transition-colors flex-shrink-0"
            aria-label="Close preview"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Video Content */}
        <div className="flex-1 flex items-center justify-center p-4 bg-background">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            autoPlay
            className="max-h-full max-w-full rounded-lg"
            preload="auto"
          >
            Your browser does not support video playback.
          </video>
        </div>

        {/* Footer */}
        <div className="border-t bg-background p-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </div>
    </>,
    document.body,
  );
}
