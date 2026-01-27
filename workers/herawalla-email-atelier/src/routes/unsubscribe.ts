import type { Env } from "../config";
import type { RouteContext } from "../types";
import { maskEmail } from "../legacy";
import { syncGoogleContact, upsertUnifiedContact } from "../services/contacts-service";
import { buildCorsHeaders } from "../utils/cors";
import { logError, logInfo, logWarn } from "../utils/logging";
import { getString, safeJson } from "../utils/request-utils";
import { isRecord, isValidEmail } from "../utils/validation";

export async function handleUnsubscribeRoute(
  request: Request,
  env: Env,
  context: RouteContext
): Promise<Response> {
  const { allowedOrigin, origin } = context;
  logInfo("unsubscribe_received", { origin, method: request.method });
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }

  if (request.method !== "POST") {
    logWarn("unsubscribe_invalid_method", { method: request.method });
    return new Response("Method Not Allowed", {
      status: 405,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }

  if (!allowedOrigin) {
    logWarn("unsubscribe_forbidden_origin", { origin });
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const payload = await safeJson(request);
    if (!isRecord(payload)) {
      logWarn("unsubscribe_invalid_payload", { origin });
      return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    const senderEmail = getString(payload.email);
    const reason = getString(payload.reason);
    if (!senderEmail) {
      logWarn("unsubscribe_missing_fields");
      return new Response(JSON.stringify({ ok: false, error: "missing_fields" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    if (!isValidEmail(senderEmail)) {
      logWarn("unsubscribe_invalid_email", { email: maskEmail(senderEmail) });
      return new Response(JSON.stringify({ ok: false, error: "invalid_email" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    const now = new Date().toISOString();
    try {
      await upsertUnifiedContact(env, {
        email: senderEmail,
        source: "subscribe",
        createdAt: now,
        subscriptionStatus: "unsubscribed",
        unsubscribedReason: reason,
      });
    } catch (error) {
      logWarn("unified_contact_failed", { email: maskEmail(senderEmail), error: String(error) });
    }
    await syncGoogleContact(env, {
      email: senderEmail,
      source: "unsubscribe",
      subscriptionStatus: "unsubscribed",
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  } catch (error) {
    const message = String(error);
    logError("unsubscribe_error", { message });
    return new Response(JSON.stringify({ ok: false, error: "unsubscribe_failed", detail: message }), {
      status: 500,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }
}
