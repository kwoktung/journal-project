"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to detect if the current viewport is mobile (width < 768px)
 * @param breakpoint - The breakpoint width in pixels (default: 768)
 * @returns boolean indicating if the viewport is mobile
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile on mount
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, [breakpoint]);

  return isMobile;
}
