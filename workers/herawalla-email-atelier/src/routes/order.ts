import type { Env } from "../config";
import type { RouteContext } from "../types";
import {
  handleSubmitPayload,
  maskEmail,
  normalizeMetalOption,
  normalizeTimeline,
  resolveAttribution,
  verifyTurnstile,
} from "../legacy";
import { appendOrderRow } from "../services/sheets";
import { upsertUnifiedContact } from "../services/contacts-service";
import { buildCorsHeaders } from "../utils/cors";
import { logError, logInfo, logWarn } from "../utils/logging";
import { getString, safeJson } from "../utils/request-utils";
import { isRecord, isValidPhone, normalizePhone } from "../utils/validation";

export async function handleOrderRoute(
  request: Request,
  env: Env,
  context: RouteContext
): Promise<Response> {
  const { allowedOrigin, origin } = context;
  logInfo("order_received", { origin, method: request.method });
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(allowedOrigin),
    });
  }

  if (request.method !== "POST") {
    logWarn("order_invalid_method", { method: request.method });
    return new Response("Method Not Allowed", {
      status: 405,
      headers: buildCorsHeaders(allowedOrigin),
    });
  }

  if (!allowedOrigin) {
    logWarn("order_forbidden_origin", { origin });
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const payload = await safeJson(request);
    if (!isRecord(payload)) {
      logWarn("order_invalid_payload", { origin });
      return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    const subject = getString(payload.subject);
    const body = getString(payload.body);
    const senderEmail = getString(payload.email);
    const senderName = getString(payload.name);
    const requestId = getString(payload.requestId);
    const turnstileToken = getString(payload.turnstileToken);
    const phone = normalizePhone(getString(payload.phone));
    const source = getString(payload.source) || "order";
    const productName = getString(payload.productName);
    const productUrl = getString(payload.productUrl);
    const designCode = getString(payload.designCode);
    const metal = normalizeMetalOption(getString(payload.metal));
    const stone = getString(payload.stone);
    const stoneWeight = getString(payload.stoneWeight);
    const size = getString(payload.size);
    const addressLine1 = getString(payload.addressLine1 || payload.address_line1);
    const addressLine2 = getString(payload.addressLine2 || payload.address_line2);
    const city = getString(payload.city);
    const state = getString(payload.state);
    const postalCode = getString(payload.postalCode || payload.postal_code);
    const country = getString(payload.country);
    const status = "NEW";
    let statusUpdatedAt = "";
    const notes = "";
    const lastError = "";
    const price = getString(payload.price);
    const timeline = normalizeTimeline(getString(payload.timeline));
    const metalWeight = getString(payload.metalWeight || payload.metal_weight);
    const metalWeightAdjustment = getString(
      payload.metalWeightAdjustment || payload.metal_weight_adjustment
    );
    const timelineAdjustmentWeeks = getString(
      payload.timelineAdjustmentWeeks || payload.timeline_adjustment_weeks
    );
    const { utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referrer } =
      resolveAttribution(payload, request);
    const pageUrl = getString(payload.pageUrl) || productUrl || referrer;

    if (!subject || !body || !senderEmail || !requestId) {
      logWarn("order_missing_fields", {
        requestId,
        hasSubject: Boolean(subject),
        hasBody: Boolean(body),
        hasEmail: Boolean(senderEmail),
      });
      return new Response(JSON.stringify({ ok: false, error: "missing_fields" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    if (!phone || !addressLine1 || !city || !state || !postalCode || !country) {
      logWarn("order_missing_address", { requestId });
      return new Response(JSON.stringify({ ok: false, error: "missing_address" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (!isValidPhone(phone)) {
      logWarn("order_invalid_phone", { requestId, email: maskEmail(senderEmail) });
      return new Response(JSON.stringify({ ok: false, error: "invalid_phone" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    if (!env.TURNSTILE_SECRET) {
      logError("order_turnstile_missing_secret", { requestId });
      return new Response(JSON.stringify({ ok: false, error: "turnstile_not_configured" }), {
        status: 500,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    if (!turnstileToken) {
      logWarn("order_turnstile_missing", { requestId, email: maskEmail(senderEmail) });
      return new Response(JSON.stringify({ ok: false, error: "turnstile_required" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    const clientIp = request.headers.get("CF-Connecting-IP") || undefined;
    const turnstileOk = await verifyTurnstile(env.TURNSTILE_SECRET, turnstileToken, clientIp);
    if (!turnstileOk) {
      logWarn("order_turnstile_failed", { requestId, email: maskEmail(senderEmail) });
      return new Response(JSON.stringify({ ok: false, error: "turnstile_failed" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    try {
      const now = new Date().toISOString();
      statusUpdatedAt = now;
      const ip = request.headers.get("CF-Connecting-IP") || "";
      const userAgent = request.headers.get("User-Agent") || "";
      await appendOrderRow(env, [
        now,
        requestId,
        status,
        statusUpdatedAt,
        notes,
        lastError,
        price,
        timeline,
        senderName,
        senderEmail,
        phone,
        source,
        productName,
        productUrl,
        designCode,
        metal,
        stone,
        stoneWeight,
        size,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
        referrer,
        origin,
        ip,
        userAgent,
        metalWeight,
        metalWeightAdjustment,
        timelineAdjustmentWeeks,
      ]);
      logInfo("order_sheet_written", { requestId });
      try {
        await upsertUnifiedContact(env, {
          email: senderEmail,
          name: senderName,
          phone,
          source: "order",
          createdAt: now,
          isCustomer: true,
        });
      } catch (error) {
        logWarn("unified_contact_failed", { requestId, error: String(error) });
      }
    } catch (error) {
      logError("order_sheet_failed", { requestId, error: String(error) });
      return new Response(
        JSON.stringify({ ok: false, error: "order_store_failed", detail: String(error) }),
        {
          status: 500,
          headers: buildCorsHeaders(allowedOrigin, true),
        }
      );
    }

    const submitResponse = await handleSubmitPayload(env, payload, request, origin, allowedOrigin, {
      skipTurnstile: true,
    });
    const text = await submitResponse.text();
    if (!text) {
      return new Response(JSON.stringify({ ok: true, orderStored: true }), {
        status: submitResponse.status,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    try {
      const data = JSON.parse(text);
      return new Response(JSON.stringify({ ...data, orderStored: true }), {
        status: submitResponse.status,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    } catch {
      return new Response(text, {
        status: submitResponse.status,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
  } catch (error) {
    const message = String(error);
    logError("order_error", { message });
    return new Response(JSON.stringify({ ok: false, error: "order_failed", detail: message }), {
      status: 500,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }
}
