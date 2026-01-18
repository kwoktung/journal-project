import { OpenAPIHono } from "@hono/zod-openapi";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createContext } from "@/lib/context";
import { HttpResponse } from "@/lib/response";
import { createServices } from "@/services";
import { requireAuth } from "@/lib/auth/route-helpers";
import { getAttachment, createAttachment } from "./definition";
import { createCache } from "@/lib/cache";

const attachmentApp = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return HttpResponse.error(c, {
        message: result.error.message,
        status: 400,
      });
    }
    return result;
  },
});

attachmentApp.openapi(createAttachment, async (c) => {
  const { session, context } = await requireAuth(c);

  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  const thumbHash = formData.get("thumbHash") as string | null;

  // Validate file size (max 50MB)
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
  if (file && file.size > MAX_FILE_SIZE) {
    return HttpResponse.error(c, {
      message: "File size exceeds the maximum limit of 50MB",
      status: 400,
    });
  }

  const ctx = createContext(context, c);
  const services = createServices(ctx);

  const attachment = await services.attachment.uploadAttachment(
    file!,
    session.userId,
    null, // referenceType - orphaned attachment, will be linked later
    null, // referenceId
    thumbHash,
  );

  return HttpResponse.created(c, attachment);
});

attachmentApp.openapi(getAttachment, async (c) => {
  const context = getCloudflareContext({ async: false });
  const { filename } = c.req.valid("param");

  const cache = createCache(c, {
    cacheName: "attachments",
    cacheControl: "public, max-age=31536000, immutable",
    enableLogging: true,
  });

  const cacheKey = new Request(c.req.url, c.req.raw);

  const response = await cache.withCache(cacheKey, async () => {
    const ctx = createContext(context, c);
    const services = createServices(ctx);

    const object = await services.attachment.getAttachment(filename);

    const contentType =
      object.httpMetadata?.contentType || "application/octet-stream";

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Length", object.size.toString());
    headers.set("ETag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(object.body, {
      status: 200,
      headers,
    });
  });

  return response;
});

export default attachmentApp;
