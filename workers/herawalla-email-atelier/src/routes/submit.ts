import type { Env } from "../config";
import type { RouteContext } from "../types";
import { handleSubmitPayload, isEnabled } from "../legacy";
import { buildCorsHeaders } from "../utils/cors";
import { logInfo, logWarn } from "../utils/logging";
import { safeJson } from "../utils/request-utils";
import { isRecord } from "../utils/validation";

export async function handleSubmitRoute(
  request: Request,
  env: Env,
  context: RouteContext
): Promise<Response> {
  const { allowedOrigin, origin } = context;
  logInfo("submit_received", { origin, method: request.method });
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(allowedOrigin),
    });
  }

  if (request.method !== "POST") {
    logWarn("submit_invalid_method", { method: request.method });
    return new Response("Method Not Allowed", {
      status: 405,
      headers: buildCorsHeaders(allowedOrigin),
    });
  }

  if (!allowedOrigin) {
    logWarn("submit_forbidden_origin", { origin });
    return new Response("Forbidden", { status: 403 });
  }

  const payload = await safeJson(request);
  if (!isRecord(payload)) {
    logWarn("submit_invalid_payload", { origin });
    return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
      status: 400,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }

  return await handleSubmitPayload(env, payload, request, origin, allowedOrigin);
}

export async function handleSubmitStatusRoute(
  request: Request,
  env: Env,
  context: RouteContext
): Promise<Response> {
  const { allowedOrigin } = context;
  if (!allowedOrigin) {
    return new Response("Forbidden", { status: 403 });
  }
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: buildCorsHeaders(allowedOrigin),
    });
  }
  return new Response(JSON.stringify({ enabled: isEnabled(env.SEND_SUBMIT, true) }), {
    status: 200,
    headers: buildCorsHeaders(allowedOrigin, true),
  });
}
