import type { Env } from "./config";
import { ALLOWED_ORIGINS } from "./config";
import { dispatchRoute } from "./routes";
import type { RouteContext } from "./types";
import { handleEmailInbound, handleMediaRequest, handleScheduledEvent, isLocalOrigin } from "./legacy";
import { buildCorsHeaders } from "./utils/cors";
import { logInfo } from "./utils/logging";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const isLocalHost = url.hostname === "127.0.0.1" || url.hostname === "localhost";
    const allowedOrigin =
      ALLOWED_ORIGINS.includes(origin) || isLocalOrigin(origin)
        ? origin
        : !origin && isLocalHost
        ? "*"
        : "";

    if (request.method === "OPTIONS" && url.pathname.startsWith("/admin")) {
      logInfo("admin_preflight", {
        origin,
        allowedOrigin,
        acrh: request.headers.get("Access-Control-Request-Headers") || "",
        acrm: request.headers.get("Access-Control-Request-Method") || "",
      });
    }

    if (request.method === "OPTIONS" && isLocalOrigin(origin)) {
      return new Response(null, {
        status: 200,
        headers: buildCorsHeaders(origin, true),
      });
    }

    const mediaResponse = await handleMediaRequest(request, env, url, allowedOrigin);
    if (mediaResponse) {
      return mediaResponse;
    }

    const context: RouteContext = {
      url,
      origin,
      allowedOrigin,
    };

    const routed = await dispatchRoute(request, env, context);
    if (routed) return routed;

    return new Response("Not Found", { status: 404 });
  },

  async email(message: ForwardableEmailMessage, env: Env) {
    return handleEmailInbound(message, env);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    return handleScheduledEvent(event, env, ctx);
  },
};
