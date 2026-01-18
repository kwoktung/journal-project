import { OpenAPIHono } from "@hono/zod-openapi";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { HttpResponse } from "@/lib/response";
import { getSession } from "@/lib/auth/session";
import { createContext } from "@/lib/context";
import { createServices } from "@/services";
import { requireAuth } from "@/lib/auth/route-helpers";
import { updateAvatar, getUser } from "./definition";

const userApp = new OpenAPIHono({
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

userApp.openapi(getUser, async (c) => {
  const context = getCloudflareContext({ async: false });
  const ctx = createContext(context, c);
  const session = await getSession(ctx);

  if (!session) {
    return c.json({ user: null });
  }

  const services = createServices(ctx);

  const user = await services.user.getUserById(session.userId);

  if (!user) {
    return c.json({ user: null });
  }

  return c.json({ user });
});

userApp.openapi(updateAvatar, async (c) => {
  const { session, context } = await requireAuth(c);

  const body = c.req.valid("json");
  const { avatar } = body;

  const ctx = createContext(context, c);
  const services = createServices(ctx);

  const user = await services.user.updateAvatar(session.userId, avatar);

  return c.json({ user }, 200);
});

export default userApp;
