import type { Env } from "../config";
import type { RouteContext } from "../types";
import { generateRequestId, isEnabled, maskEmail } from "../legacy";
import { syncGoogleContact, upsertUnifiedContact } from "../services/contacts-service";
import { autoReplyHeaders, sendEmail } from "../services/email";
import { buildCorsHeaders } from "../utils/cors";
import { logError, logInfo, logWarn } from "../utils/logging";
import { getString, getStringArray, safeJson } from "../utils/request-utils";
import { hasValidEmailDomain, isRecord, isValidEmail, isValidPhone, normalizePhone } from "../utils/validation";
import {
  MAX_SUBMISSIONS_PER_HOUR,
  SUBSCRIBE_ACK_HTML,
  SUBSCRIBE_ACK_SUBJECT,
  SUBSCRIBE_ACK_TEXT,
} from "../config";

export async function handleSubscribeRoute(
  request: Request,
  env: Env,
  context: RouteContext
): Promise<Response> {
  const { allowedOrigin, origin } = context;
  logInfo("subscribe_received", { origin, method: request.method });
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }

  if (request.method !== "POST") {
    logWarn("subscribe_invalid_method", { method: request.method });
    return new Response("Method Not Allowed", {
      status: 405,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }

  if (!allowedOrigin) {
    logWarn("subscribe_forbidden_origin", { origin });
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const payload = await safeJson(request);
    if (!isRecord(payload)) {
      logWarn("subscribe_invalid_payload", { origin });
      return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    const senderEmail = getString(payload.email);
    const name = getString(payload.name);
    const phone = normalizePhone(getString(payload.phone));
    const interests = getStringArray(payload.interests || payload.interest || payload.designInterests);
    const source = getString(payload.source);
    const pageUrl = getString(payload.pageUrl);
    const requestId = generateRequestId();
    const sourceLabel = source || "subscribe";

    if (!senderEmail) {
      logWarn("subscribe_missing_fields", { requestId });
      return new Response(JSON.stringify({ ok: false, error: "missing_fields" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    if (!isValidEmail(senderEmail)) {
      logWarn("subscribe_invalid_email", { requestId, email: maskEmail(senderEmail) });
      return new Response(JSON.stringify({ ok: false, error: "invalid_email" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    if (phone && !isValidPhone(phone)) {
      logWarn("subscribe_invalid_phone", { requestId, email: maskEmail(senderEmail) });
      return new Response(JSON.stringify({ ok: false, error: "invalid_phone" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    if (!interests.length) {
      logWarn("subscribe_missing_interests", { requestId, email: maskEmail(senderEmail) });
      return new Response(JSON.stringify({ ok: false, error: "missing_interests" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    const senderDomain = senderEmail.split("@")[1] || "";
    const domainOk = await hasValidEmailDomain(senderDomain);
    if (!domainOk) {
      logWarn("subscribe_invalid_domain", { requestId, email: maskEmail(senderEmail) });
      return new Response(JSON.stringify({ ok: false, error: "invalid_email_domain" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    const shouldSendSubmit = isEnabled(env.SEND_SUBMIT, true);
    if (!shouldSendSubmit) {
      logWarn("subscribe_send_disabled", { requestId, email: maskEmail(senderEmail) });
      return new Response(JSON.stringify({ ok: false, error: "send_disabled" }), {
        status: 503,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    if (env.HEERAWALLA_ACKS) {
      const rateIp = request.headers.get("CF-Connecting-IP") || "unknown";
      const bucket = new Date();
      const hourKey = `${bucket.getUTCFullYear()}${String(bucket.getUTCMonth() + 1).padStart(2, "0")}${String(
        bucket.getUTCDate()
      ).padStart(2, "0")}${String(bucket.getUTCHours()).padStart(2, "0")}`;
      const rateKey = `subscribe:rl:${rateIp}:${hourKey}`;
      const currentCount = Number(await env.HEERAWALLA_ACKS.get(rateKey)) || 0;
      if (currentCount >= MAX_SUBMISSIONS_PER_HOUR) {
        logWarn("subscribe_rate_limited", { requestId, email: maskEmail(senderEmail) });
        return new Response(JSON.stringify({ ok: false, error: "rate_limited" }), {
          status: 429,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      await env.HEERAWALLA_ACKS.put(rateKey, String(currentCount + 1), { expirationTtl: 60 * 60 });
    }

    const now = new Date().toISOString();
    if (isEnabled(env.SEND_ACK, true)) {
      try {
        await sendEmail(env, {
          to: [senderEmail],
          sender: "Heerawalla <no-reply@heerawalla.com>",
          replyTo: "no-reply@heerawalla.com",
          subject: SUBSCRIBE_ACK_SUBJECT,
          textBody: SUBSCRIBE_ACK_TEXT,
          htmlBody: SUBSCRIBE_ACK_HTML,
          headers: autoReplyHeaders(),
        });
      } catch (error) {
        logWarn("subscribe_ack_failed", { requestId, error: String(error) });
      }
    }

    try {
      await syncGoogleContact(env, {
        email: senderEmail,
        name,
        phone,
        interests,
        source: sourceLabel,
        requestId,
        pageUrl,
        subscriptionStatus: "subscribed",
      });
    } catch (error) {
      logWarn("subscribe_contact_sync_failed", { requestId, error: String(error) });
    }

    try {
      await upsertUnifiedContact(env, {
        email: senderEmail,
        name,
        phone,
        source: "subscribe",
        createdAt: now,
        subscriptionStatus: "subscribed",
      });
    } catch (error) {
      logWarn("unified_contact_failed", { requestId, error: String(error) });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  } catch (error) {
    const message = String(error);
    logError("subscribe_error", { message });
    return new Response(JSON.stringify({ ok: false, error: "send_failed", detail: message }), {
      status: 500,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }
}
