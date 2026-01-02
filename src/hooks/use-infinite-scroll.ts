import { useEffect, useRef } from "react";

/**
 * Hook for implementing infinite scroll using Intersection Observer
 *
 * @param callback - Function to call when the sentinel element becomes visible
 * @param options - Configuration options
 * @returns Ref to attach to the sentinel element
 */
export function useInfiniteScroll(
  callback: () => void,
  options?: {
    enabled?: boolean;
    rootMargin?: string;
    threshold?: number;
  },
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!options?.enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          callback();
        }
      },
      {
        root: null, // Use viewport as root
        rootMargin: options?.rootMargin ?? "200px", // Load before reaching bottom
        threshold: options?.threshold ?? 0.1,
      },
    );

    observerRef.current = observer;

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [callback, options?.enabled, options?.rootMargin, options?.threshold]);

  return elementRef;
}
