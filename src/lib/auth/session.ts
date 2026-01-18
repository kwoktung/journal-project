import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import {
  verifyJWT,
  isTokenExpired,
  createAccessToken,
  type JWTPayload,
} from "@/lib/auth";
import { hashToken } from "@/lib/auth/token-hash";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from "@/config/config";
import { getDatabase } from "@/database/client";
import { refreshTokenTable } from "@/database/schema";
import type { Context } from "@/lib/context";

/**
 * Validates a refresh token and returns the payload if valid
 * Returns null if token is invalid, expired, or revoked
 */
export async function validateRefreshToken(
  refreshToken: string,
  secret: string,
  db: ReturnType<typeof getDatabase>,
): Promise<JWTPayload | null> {
  // Verify JWT structure and signature
  const payload = await verifyJWT(refreshToken, secret);
  if (!payload || payload.tokenType !== "refresh") {
    return null;
  }

  // Check if token is expired
  if (isTokenExpired(refreshToken) === true) {
    return null;
  }

  // Check database for token validity
  const tokenHash = await hashToken(refreshToken);
  const storedToken = await db
    .select()
    .from(refreshTokenTable)
    .where(eq(refreshTokenTable.tokenHash, tokenHash))
    .get();

  if (!storedToken || storedToken.expiresAt < new Date()) {
    return null;
  }

  return payload;
}

/**
 * Refreshes an access token using a refresh token
 * Returns the new access token and refresh token payload, or null if refresh fails
 */
export async function refreshAccessToken(
  refreshToken: string,
  secret: string,
  db: ReturnType<typeof getDatabase>,
): Promise<{ accessToken: string; payload: JWTPayload } | null> {
  const payload = await validateRefreshToken(refreshToken, secret, db);
  if (!payload) {
    return null;
  }

  // Create new access token
  const newAccessToken = await createAccessToken(
    {
      userId: payload.userId,
    },
    secret,
  );

  return { accessToken: newAccessToken, payload };
}

/**
 * Extracts JWT from Authorization header (priority) or cookie (fallback)
 * If access token from cookie is expired, attempts to refresh using refresh token
 */
export async function getSession(ctx: Context): Promise<JWTPayload | null> {
  const c = ctx.honoContext;
  const secret = ctx.env.JWT_SECRET;

  // Priority 1: Authorization header
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const payload = await verifyJWT(token, secret);

    // Only accept access tokens
    if (payload && (!payload.tokenType || payload.tokenType === "access")) {
      return payload;
    }
  }

  // Priority 2: Cookie fallback
  const sessionToken = getCookie(c, ACCESS_TOKEN_COOKIE_NAME);
  if (sessionToken) {
    const payload = await verifyJWT(sessionToken, secret);

    // Accept access tokens and legacy tokens (no tokenType)
    if (payload && (!payload.tokenType || payload.tokenType === "access")) {
      return payload;
    }

    // If token is expired or invalid, try to refresh using refresh token
    if (isTokenExpired(sessionToken) === true) {
      try {
        const refreshTokenValue = getCookie(c, REFRESH_TOKEN_COOKIE_NAME);

        if (refreshTokenValue) {
          const refreshResult = await refreshAccessToken(
            refreshTokenValue,
            secret,
            ctx.db,
          );

          if (refreshResult) {
            // Set new cookies with refreshed access token
            setAuthCookies(ctx, refreshResult.accessToken, refreshTokenValue);
            return refreshResult.payload;
          }
        }
      } catch {
        // If refresh fails, silently fail and return null
        return null;
      }
    }
  }

  return null;
}

/**
 * Sets both access token and refresh token cookies
 */
export function setAuthCookies(
  ctx: Context,
  accessToken: string,
  refreshToken: string,
): void {
  setCookie(ctx.honoContext, ACCESS_TOKEN_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: ctx.env.ENV === "DEV" ? false : true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  setCookie(ctx.honoContext, REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: ctx.env.ENV === "DEV" ? false : true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

/**
 * Deletes both access token and refresh token cookies
 */
export function deleteAuthCookies(ctx: Context): void {
  deleteCookie(ctx.honoContext, ACCESS_TOKEN_COOKIE_NAME, { path: "/" });
  deleteCookie(ctx.honoContext, REFRESH_TOKEN_COOKIE_NAME, { path: "/" });
}
