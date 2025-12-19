import type { Context } from "hono";

export interface CacheOptions {
  /**
   * Cache name/namespace
   * @default 'default'
   */
  cacheName?: string;
  /**
   * Cache-Control header value
   * @default 'public, max-age=31536000, immutable'
   */
  cacheControl?: string;
  /**
   * Whether to log cache hits/misses
   * @default false
   */
  enableLogging?: boolean;
}

/**
 * Checks if the Cloudflare Cache API is available
 */
function isCacheAvailable(): boolean {
  return typeof caches !== "undefined";
}

/**
 * Creates a cache instance bound to a specific context and options
 * @param ctx - Hono context (for executionCtx.waitUntil)
 * @param options - Cache configuration options
 * @returns Object with withCache method
 */
export function createCache(ctx: Context, options: CacheOptions = {}) {
  const {
    cacheName = "default",
    cacheControl = "public, max-age=31536000, immutable",
    enableLogging = false,
  } = options;

  /**
   * Wraps a response fetcher with caching logic
   * @param cacheKey - The request to use as cache key
   * @param fetcherFunc - Async function that returns the response to cache
   * @returns The cached or freshly fetched response
   */
  async function withCache(
    cacheKey: Request,
    fetcherFunc: () => Promise<Response>,
  ): Promise<Response> {
    // Check if Cache API is available
    if (!isCacheAvailable()) {
      // Cache not available - just fetch and return
      return await fetcherFunc();
    }

    try {
      // Try to get cached response
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(cacheKey);

      if (cachedResponse) {
        // Cache hit
        if (enableLogging) {
          console.log(`Cache hit for: ${cacheKey.url}`);
        }
        return cachedResponse;
      }

      // Cache miss
      if (enableLogging) {
        console.log(`Cache miss for: ${cacheKey.url}`);
      }

      // Fetch fresh response
      const response = await fetcherFunc();

      // Ensure Cache-Control header is set
      if (!response.headers.has("Cache-Control")) {
        response.headers.set("Cache-Control", cacheControl);
      }

      // Store in cache asynchronously (non-blocking)
      ctx.executionCtx.waitUntil(
        (async () => {
          try {
            await cache.put(cacheKey, response.clone());
            if (enableLogging) {
              console.log(`Cached response for: ${cacheKey.url}`);
            }
          } catch (error) {
            console.error("Error storing in cache:", error);
          }
        })(),
      );

      return response;
    } catch (error) {
      console.error("Cache operation error:", error);
      // Fallback to fetching without cache
      return await fetcherFunc();
    }
  }

  return {
    withCache,
  };
}
