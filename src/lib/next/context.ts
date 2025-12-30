import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";

export const getContext = cache(() => getCloudflareContext({ async: true }));
