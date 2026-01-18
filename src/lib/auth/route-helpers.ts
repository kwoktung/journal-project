import { Context as HonoContext } from "hono";
import { HTTPException } from "hono/http-exception";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "./session";
import { createContext } from "@/lib/context";

/**
 * Requires authentication for a route
 * Throws HTTPException(401) if session is missing
 *
 * @param c - Hono context
 * @returns Session and Cloudflare context
 */
export async function requireAuth(c: HonoContext) {
  const cloudflareContext = getCloudflareContext({ async: false });
  const ctx = createContext(cloudflareContext, c);
  const session = await getSession(ctx);

  if (!session) {
    throw new HTTPException(401, { message: "Authentication required" });
  }

  return { session, context: cloudflareContext };
}
