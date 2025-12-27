"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to track if the component has mounted on the client.
 * Useful for avoiding hydration mismatches in Next.js by ensuring
 * client-only code runs after the initial render.
 * @returns boolean indicating if the component has mounted
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
