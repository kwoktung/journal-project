"use client";

import { useEffect, useRef } from "react";

/**
 * Custom hook to set up an interval that can be paused by passing null as delay.
 * The callback will have access to the latest state/props without causing
 * the interval to restart when dependencies change.
 *
 * @param callback - The function to call on each interval tick
 * @param delay - The delay in milliseconds, or null/undefined to pause the interval
 *
 * @example
 * ```tsx
 * const [count, setCount] = useState(0);
 *
 * useInterval(() => {
 *   setCount(c => c + 1);
 * }, 1000); // Runs every second
 *
 * // To pause:
 * useInterval(() => {
 *   setCount(c => c + 1);
 * }, null); // Paused
 * ```
 */
export function useInterval(
  callback: () => void,
  delay: number | null | undefined,
): void {
  const savedCallback = useRef<(() => void) | undefined>(undefined);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }

    if (delay !== null && delay !== undefined) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
