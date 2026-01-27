import type { Env } from "../config";
import type { RouteContext } from "../types";
import {
  generateRequestId,
  hasD1,
  isEnabled,
  maskEmail,
  normalizeRequestId,
  resolveAttribution,
  storeRequestOrigin,
  storeRequestSummary,
} from "../legacy";
import { addTicketDetail, appendContactRow, createTicketFromContact, syncGoogleContact, upsertUnifiedContact } from "../services/contacts-service";
import { autoReplyHeaders, buildForwardHtml, buildForwardSubject, getInternalReplyTo, sendEmail } from "../services/email";
import { buildCorsHeaders } from "../utils/cors";
import { logError, logInfo, logWarn } from "../utils/logging";
import { getBoolean, getString, safeJson } from "../utils/request-utils";
import { hasValidEmailDomain, isRecord, isValidEmail, isValidPhone, normalizePhone } from "../utils/validation";
import {
  CONTACT_ACK_HTML,
  CONTACT_ACK_SUBJECT,
  CONTACT_ACK_TEXT,
  MAX_SUBMISSIONS_PER_HOUR,
  REQUEST_ID_LABEL,
} from "../config";

export async function handleContactRoute(
  request: Request,
  env: Env,
  context: RouteContext
): Promise<Response> {
  const { allowedOrigin, origin } = context;
  logInfo("contact_submit_received", { origin, method: request.method });
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }

  if (request.method !== "POST") {
    logWarn("contact_submit_invalid_method", { method: request.method });
    return new Response("Method Not Allowed", {
      status: 405,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }

  if (!allowedOrigin) {
    logWarn("contact_submit_forbidden_origin", { origin });
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const payload = await safeJson(request);
    if (!isRecord(payload)) {
      logWarn("contact_submit_invalid_payload", { origin });
      return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    const name = getString(payload.name);
    const senderEmail = getString(payload.email);
    const message = getString(payload.message);
    const subjectInput = getString(payload.subject);
    const requestIdInput = getString(payload.requestId) || generateRequestId();
    const requestId = normalizeRequestId(requestIdInput);
    const phone = normalizePhone(getString(payload.phone));
    const phonePreferred = getBoolean(payload.phonePreferred);
    const { utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referrer } =
      resolveAttribution(payload, request);
    const resolvedPageUrl = referrer || origin;

    if (!name || !senderEmail || !message) {
      logWarn("contact_submit_missing_fields", { requestId });
      return new Response(JSON.stringify({ ok: false, error: "missing_fields" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    if (!isValidEmail(senderEmail)) {
      logWarn("contact_submit_invalid_email", { requestId, email: maskEmail(senderEmail) });
      return new Response(JSON.stringify({ ok: false, error: "invalid_email" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    if (phonePreferred && !isValidPhone(phone)) {
      logWarn("contact_submit_invalid_phone", { requestId, email: maskEmail(senderEmail) });
      return new Response(JSON.stringify({ ok: false, error: "invalid_phone" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    const senderDomain = senderEmail.split("@")[1] || "";
    const domainOk = await hasValidEmailDomain(senderDomain);
    if (!domainOk) {
      logWarn("contact_submit_invalid_domain", { requestId, email: maskEmail(senderEmail) });
      return new Response(JSON.stringify({ ok: false, error: "invalid_email_domain" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    const shouldSendSubmit = isEnabled(env.SEND_SUBMIT, true);
    if (!shouldSendSubmit) {
      logWarn("contact_submit_send_disabled", { requestId, email: maskEmail(senderEmail) });
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
      const rateKey = `contact:rl:${rateIp}:${hourKey}`;
      const currentCount = Number(await env.HEERAWALLA_ACKS.get(rateKey)) || 0;
      if (currentCount >= MAX_SUBMISSIONS_PER_HOUR) {
        logWarn("contact_submit_rate_limited", { requestId, email: maskEmail(senderEmail) });
        return new Response(JSON.stringify({ ok: false, error: "rate_limited" }), {
          status: 429,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      await env.HEERAWALLA_ACKS.put(rateKey, String(currentCount + 1), { expirationTtl: 60 * 60 });
    }

    const baseSubject = subjectInput || (name ? `Heerawalla inquiry from ${name}` : "Heerawalla inquiry");
    const subject = buildForwardSubject(baseSubject, requestId);
    const bodyLines = [
      `Name: ${name}`,
      `Email: ${senderEmail}`,
      phone ? `Phone: ${phone}` : "",
      phonePreferred ? "Contact preference: Phone call" : "",
      `${REQUEST_ID_LABEL} ${requestId}`,
      "",
      message,
    ].filter(Boolean);
    const body = bodyLines.join("\n");

    const forwardTo = env.FORWARD_TO || "atelier.heerawalla@gmail.com";
    try {
      await storeRequestOrigin(env, requestId, senderEmail, name);
      await storeRequestSummary(env, requestId, {
        subject,
        body,
        email: senderEmail,
        name,
      });
      await sendEmail(env, {
        to: [forwardTo],
        sender: "Heerawalla <atelier@heerawalla.com>",
        replyTo: getInternalReplyTo(env),
        subject,
        textBody: body,
        htmlBody: buildForwardHtml({
          subject,
          body,
          senderEmail,
          senderName: name,
          requestId,
        }),
      });

      if (isEnabled(env.SEND_ACK, true)) {
        await sendEmail(env, {
          to: [senderEmail],
          sender: "Heerawalla <no-reply@heerawalla.com>",
          replyTo: "no-reply@heerawalla.com",
          subject: CONTACT_ACK_SUBJECT,
          textBody: CONTACT_ACK_TEXT,
          htmlBody: CONTACT_ACK_HTML,
          headers: autoReplyHeaders(),
        });
      }

      await syncGoogleContact(env, {
        email: senderEmail,
        name,
        phone,
        source: "contact",
        requestId,
        contactPreference: phonePreferred ? "phone" : "",
        subscriptionStatus: "subscribed",
      });
      try {
        const now = new Date().toISOString();
        if (hasD1(env)) {
          await createTicketFromContact(env, {
            requestId,
            createdAt: now,
            status: "NEW",
            subject: subjectInput || "",
            summary: message,
            name,
            email: senderEmail,
            phone,
            source: "contact",
            pageUrl: resolvedPageUrl,
          });
          await addTicketDetail(env, {
            requestId,
            note: message,
            kind: "note",
            createdAt: now,
            updatedBy: "system",
          });
        } else {
          await appendContactRow(env, [
            now,
            senderEmail,
            name,
            phone,
            "contact",
            requestId,
            phonePreferred ? "phone" : "",
            "",
            resolvedPageUrl,
            utmSource,
            utmMedium,
            utmCampaign,
            utmTerm,
            utmContent,
            referrer,
            "",
            "",
            "",
            "",
            "",
            "",
            "subscribed",
            "NEW",
            now,
            message,
            "",
          ]);
        }
      } catch (error) {
        logWarn("contact_sheet_failed", { requestId, error: String(error) });
      }
    } catch (error) {
      logError("contact_submit_send_failed", { requestId, email: maskEmail(senderEmail) });
      throw error;
    }

    return new Response(JSON.stringify({ ok: true, requestId }), {
      status: 200,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  } catch (error) {
    const message = String(error);
    logError("contact_submit_error", { message });
    return new Response(JSON.stringify({ ok: false, error: "send_failed", detail: message }), {
      status: 500,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }
}
