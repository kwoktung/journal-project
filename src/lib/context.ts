import { getDatabase, type DatabaseClient } from "@/database/client";
import { getLogger } from "./logger";
import type { Context as HonoContext } from "hono";

type Logger = ReturnType<typeof getLogger>;

export type CloudflareContext = {
  env: CloudflareEnv;
  cf?: IncomingRequestCfProperties;
  ctx?: ExecutionContext;
};

export type Context = {
  env: CloudflareEnv;
  logger: Logger;
  db: DatabaseClient;
  honoContext: HonoContext;
  cloudflareContext: CloudflareContext;
};

export const createContext = (
  cloudflareContext: CloudflareContext,
  honoContext: HonoContext
): Context => {
  return {
    env: cloudflareContext.env,
    logger: getLogger(cloudflareContext.env),
    db: getDatabase(cloudflareContext.env),
    honoContext,
    cloudflareContext,
  };
};
