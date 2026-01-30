import { EmailMessage } from "cloudflare:email";
import type { Env } from "./config";
import {
  ACK_SUBJECT_PREFIX,
  QUOTE_ACK_SUBJECT,
  CONTACT_ACK_SUBJECT,
  ORDER_SHEET_HEADER,
  ORDER_DETAILS_SHEET_HEADER,
  QUOTE_SHEET_HEADER,
  CONTACT_SHEET_HEADER,
  TICKET_SHEET_HEADER,
  UNIFIED_CONTACTS_SHEET_HEADER,
  PRICE_CHART_HEADER,
  COST_CHART_HEADER,
  DIAMOND_PRICE_CHART_HEADER,
  PRODUCTS_SHEET_HEADER,
  INSPIRATIONS_SHEET_HEADER,
  MEDIA_LIBRARY_SHEET_HEADER,
  PRODUCT_MEDIA_SHEET_HEADER,
  INSPIRATION_MEDIA_SHEET_HEADER,
  EMAIL_TEXT,
  EMAIL_HTML,
  ORDER_ACK_SUBJECT,
  ORDER_ACK_TEXT,
  ORDER_ACK_HTML,
  CONTACT_ACK_TEXT,
  CONTACT_ACK_HTML,
  SUBSCRIBE_ACK_SUBJECT,
  UNSUBSCRIBE_URL,
  DEFAULT_CONTACT_LABEL_SUBSCRIBED,
  DEFAULT_CONTACT_LABEL_UNSUBSCRIBED,
  SUBSCRIBE_ACK_TEXT,
  SUBSCRIBE_ACK_HTML,
  CONSULTATION_ACK_SUBJECT,
  REQUEST_ID_PREFIX,
  REQUEST_ID_LABEL,
  REQUEST_ID_ALPHABET,
  REQUEST_ID_LENGTH,
  BESPOKE_URL,
  BESPOKE_DIRECT_URL,
  SUBMIT_PATH,
  SUBMIT_STATUS_PATH,
  CONTACT_SUBMIT_PATH,
  ORDER_PATH,
  SUBSCRIBE_PATH,
  UNSUBSCRIBE_PATH,
  ORDER_CONFIRMATION_PATH,
  ORDER_CONFIRMATION_CONFIRM_PATH,
  ORDER_CONFIRMATION_CANCEL_PATH,
  ORDER_CONFIRMATION_PAGE_URL,
  ORDER_CONFIRMATION_TTL,
  ORDER_VERIFY_PATH,
  ORDER_CANCEL_PATH,
  ORDER_CANCEL_CONFIRM_PATH,
  ORDER_CANCEL_PAGE_URL,
  ORDER_CANCEL_TTL,
  QUOTE_CONFIRMATION_PATH,
  QUOTE_CONFIRMATION_ACCEPT_PATH,
  QUOTE_PAGE_URL,
  QUOTE_PAYMENT_URL,
  QUOTE_CONFIRMATION_TTL,
  REQUEST_ORIGIN_TTL,
  REQUEST_SUMMARY_TTL,
  REQUEST_SUMMARY_MAX_LINES,
  REQUEST_SUMMARY_MAX_CHARS,
  DEFAULT_REPLY_TO,
  MAX_SUBMISSIONS_PER_HOUR,
  CALENDAR_AVAILABILITY_PATH,
  CALENDAR_BOOK_PATH,
  CALENDAR_TIMEZONE,
  CALENDAR_SLOT_MINUTES,
  CALENDAR_BUFFER_MINUTES,
  CALENDAR_LEAD_HOURS,
  CALENDAR_WINDOWS,
  CATALOG_PATH,
  CATALOG_CACHE_SECONDS,
  HOLIDAY_CALENDAR_ID,
  ACK_QUEUE_BATCH_LIMIT,
  ALLOWED_ORIGINS,
  ADMIN_ENUMS,
  REJECT_SUBJECT,
  REJECT_TEXT,
  REJECT_HTML,
  ORDER_AUTHENTICITY_PAGE_URL,
} from "./config";

type CachedToken = { value: string; expiresAt: number } | null;
let cachedAccessToken: CachedToken = null;

function hasD1(env: Env): env is Env & { DB: D1Database } {
  return Boolean(env.DB);
}

async function d1All(env: Env & { DB: D1Database }, sql: string, params: unknown[] = []) {
  const statement = env.DB.prepare(sql);
  const bound = params.length ? statement.bind(...params) : statement;
  const result = await bound.all();
  return (result.results || []) as Record<string, string | number | null>[];
}

async function d1Run(env: Env & { DB: D1Database }, sql: string, params: unknown[] = []) {
  const statement = env.DB.prepare(sql);
  const bound = params.length ? statement.bind(...params) : statement;
  return bound.run();
}

async function handleMediaRequest(
  request: Request,
  env: Env,
  url: URL,
  allowedOrigin: string
) {
  let key: string | null = null;
  if (url.pathname.startsWith("/media/")) {
    key = url.pathname.replace(/^\/media\//, "");
  } else if (url.pathname.startsWith("/brand/")) {
    key = `media/brand/${url.pathname.replace(/^\/brand\//, "")}`;
  } else {
    return null;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }
  if (!env.MEDIA_BUCKET) {
    return new Response("Not Found", {
      status: 404,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }
  if (!key) {
    return new Response("Not Found", {
      status: 404,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }
  let object = await env.MEDIA_BUCKET.get(key);
  if (!object && !key.startsWith("media/")) {
    object = await env.MEDIA_BUCKET.get(`media/${key}`);
  }
  if (!object) {
    const remoteBase = env.MEDIA_PUBLIC_BASE_URL;
    if (remoteBase) {
      const normalizedBase = remoteBase.replace(/\/$/, "");
      const remoteKey = key.startsWith("media/") ? key : `media/${key}`;
      const target = `${normalizedBase}/${remoteKey}`;
      return Response.redirect(target, 302);
    }
    return new Response("Not Found", {
      status: 404,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  const contentType = headers.get("content-type") || "";
  if (!contentType || contentType === "application/json") {
    const ext = key.split(".").pop()?.toLowerCase() || "";
    const typeMap: Record<string, string> = {
      svg: "image/svg+xml",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      gif: "image/gif",
      avif: "image/avif",
    };
    if (typeMap[ext]) {
      headers.set("content-type", typeMap[ext]);
    }
  }
  const cors = buildCorsHeaders(allowedOrigin, true);
  Object.entries(cors).forEach(([header, value]) => headers.set(header, value));
  return new Response(request.method === "HEAD" ? null : object.body, {
    status: 200,
    headers,
  });
}

function parseJsonList(value: string | null | undefined) {
  if (!value) return [];
  const trimmed = String(value).trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.map((entry) => String(entry)) : [];
    } catch {
      return [];
    }
  }
  return trimmed
    .split(/[|,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function toPipeList(value: string | null | undefined) {
  if (!value) return "";
  const list = parseJsonList(value);
  if (list.length) return list.join("|");
  return String(value).trim();
}

const legacyWorker = {
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
    const adminResponse = await handleAdminRequest(request, env, url, allowedOrigin, origin);
    if (adminResponse) {
      return adminResponse;
    }

    const confirmationResponse = await handleOrderConfirmationRequest(
      request,
      env,
      url,
      allowedOrigin
    );
    if (confirmationResponse) {
      return confirmationResponse;
    }

    const quoteResponse = await handleQuoteConfirmationRequest(request, env, url, allowedOrigin);
    if (quoteResponse) {
      return quoteResponse;
    }

    const cancelResponse = await handleOrderCancellationRequest(request, env, url, allowedOrigin);
    if (cancelResponse) {
      return cancelResponse;
    }

    const verifyResponse = await handleOrderVerificationRequest(request, env, url, allowedOrigin);
    if (verifyResponse) {
      return verifyResponse;
    }

    // Pricing is handled by the dedicated route in src/routes/pricing.ts; fall through here.

    if (url.pathname === CATALOG_PATH) {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: buildCatalogHeaders(),
        });
      }

      if (request.method !== "GET") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: buildCatalogHeaders(),
        });
      }

      const cacheKey = new Request(url.toString(), { method: "GET" });
      const cache = caches.default;
      const cached = await cache.match(cacheKey);
      if (cached) {
        return cached;
      }
      const kvCacheKey = buildCatalogCacheKey(url);
      if (env.HEERAWALLA_ACKS) {
        const kvPayload = await env.HEERAWALLA_ACKS.get(kvCacheKey);
        if (kvPayload) {
          const response = new Response(kvPayload, {
            status: 200,
            headers: buildCatalogHeaders(),
          });
          response.headers.set(
            "Cache-Control",
            `public, max-age=${CATALOG_CACHE_SECONDS}, s-maxage=${CATALOG_CACHE_SECONDS}`
          );
          await cache.put(cacheKey, response.clone());
          return response;
        }
      }

      try {
        const payload = await loadCatalogPayload(env, url.searchParams);
        const response = new Response(JSON.stringify(payload), {
          status: 200,
          headers: buildCatalogHeaders(),
        });
        response.headers.set(
          "Cache-Control",
          `public, max-age=${CATALOG_CACHE_SECONDS}, s-maxage=${CATALOG_CACHE_SECONDS}`
        );
        if (env.HEERAWALLA_ACKS) {
          await env.HEERAWALLA_ACKS.put(
            kvCacheKey,
            JSON.stringify(payload),
            { expirationTtl: CATALOG_CACHE_SECONDS }
          );
        }
        await cache.put(cacheKey, response.clone());
        return response;
      } catch (error) {
        const message = String(error);
        logError("catalog_error", { message });
        return new Response(JSON.stringify({ ok: false, error: "catalog_failed" }), {
          status: 500,
          headers: buildCatalogHeaders(),
        });
      }
    }

    if (url.pathname.startsWith("/calendar")) {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }

      if (!allowedOrigin) {
        return new Response("Forbidden", { status: 403 });
      }

      if (url.pathname === CALENDAR_AVAILABILITY_PATH) {
        if (request.method !== "GET") {
          return new Response("Method Not Allowed", {
            status: 405,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }

        try {
          const availability = await getCalendarAvailability(env, url);
          return new Response(JSON.stringify(availability), {
            status: 200,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        } catch (error) {
          const message = String(error);
          logError("calendar_availability_error", { message });
          return new Response(JSON.stringify({ ok: false, error: "calendar_unavailable" }), {
            status: 500,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
      }

      if (url.pathname === CALENDAR_BOOK_PATH) {
        if (request.method !== "POST") {
          return new Response("Method Not Allowed", {
            status: 405,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }

        try {
          const payload = await safeJson(request);
          if (!isRecord(payload)) {
            return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
              status: 400,
              headers: buildCorsHeaders(allowedOrigin, true),
            });
          }

          const name = getString(payload.name);
          const email = getString(payload.email);
          const message = getString(payload.message);
          const date = getString(payload.date);
          const time = getString(payload.time);
          const phone = normalizePhone(getString(payload.phone));
          const contactPreference = normalizeContactPreference(
            getString(payload.contactPreference) || getString(payload.contact_preference)
          );
          const phonePreferred = contactPreference
            ? contactPreference === "phone"
            : getBoolean(payload.phonePreferred);
          const replaceExisting = getBoolean(payload.replaceExisting || payload.replace_existing);
          const requestId = generateRequestId();
          const pageUrl = getString(payload.pageUrl);
          const { utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referrer } =
            resolveAttribution(payload, request);
          const resolvedPageUrl = pageUrl || referrer;

          if (!name || !email || !date || !time) {
            return new Response(JSON.stringify({ ok: false, error: "missing_fields" }), {
              status: 400,
              headers: buildCorsHeaders(allowedOrigin, true),
            });
          }

          if (!isValidEmail(email)) {
            return new Response(JSON.stringify({ ok: false, error: "invalid_email" }), {
              status: 400,
              headers: buildCorsHeaders(allowedOrigin, true),
            });
          }

          if (phonePreferred && !isValidPhone(phone)) {
            return new Response(JSON.stringify({ ok: false, error: "invalid_phone" }), {
              status: 400,
              headers: buildCorsHeaders(allowedOrigin, true),
            });
          }

          const booking = await bookCalendarSlot(env, {
            name,
            email,
            message,
            date,
            time,
            phone,
            phonePreferred,
            contactPreference,
            requestId,
            replaceExisting,
          });

          if (isEnabled(env.SEND_ACK, true)) {
            try {
              await sendConsultationAck(env, {
                name,
                email,
                phone,
                phonePreferred,
                contactPreference,
                requestId,
                start: new Date(booking.start),
                end: new Date(booking.end),
                timeZone: booking.timeZone,
                meetingLink: booking.meetingLink,
              });
            } catch (error) {
              logError("calendar_ack_failed", { message: String(error) });
            }
          }

          await syncGoogleContact(env, {
            email,
            name,
            phone,
            source: "concierge",
            requestId,
            contactPreference: contactPreference || (phonePreferred ? "phone" : ""),
            subscriptionStatus: "subscribed",
          });
          try {
            await appendContactRow(env, [
              new Date().toISOString(),
              email,
              name,
              phone,
              "concierge",
              requestId,
              contactPreference || (phonePreferred ? "phone" : ""),
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
            ]);
          } catch (error) {
            logWarn("contact_sheet_failed", { requestId, error: String(error) });
          }
          try {
            await upsertUnifiedContact(env, {
              email,
              name,
              phone,
              source: "contact",
              createdAt: new Date().toISOString(),
            });
          } catch (error) {
            logWarn("unified_contact_failed", { requestId, error: String(error) });
          }

          return new Response(JSON.stringify({ ok: true, booking }), {
            status: 200,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        } catch (error) {
          if (error instanceof BookingError) {
            if (error.code === "existing_booking") {
              logInfo("calendar_booking_existing", { code: error.code });
            } else {
              logWarn("calendar_booking_rejected", { code: error.code });
            }
            const status =
              error.code === "existing_booking" || error.code === "slot_unavailable"
                ? 409
                : error.code === "invalid_slot"
                ? 400
                : 500;
            const payload = { ok: false, error: error.code, ...(error.details || {}) };
            return new Response(JSON.stringify(payload), {
              status,
              headers: buildCorsHeaders(allowedOrigin, true),
            });
          }

          const message = String(error);
          logError("calendar_booking_error", { message });
          const code = message.includes("slot_unavailable") ? 409 : 500;
          return new Response(JSON.stringify({ ok: false, error: message }), {
            status: code,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
      }
    }

    if (url.pathname === SUBSCRIBE_PATH) {
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

    if (url.pathname === UNSUBSCRIBE_PATH) {
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

    if (url.pathname === CONTACT_SUBMIT_PATH) {
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

    if (url.pathname === ORDER_PATH) {
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

    if (url.pathname === SUBMIT_PATH) {
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

    if (url.pathname === SUBMIT_STATUS_PATH) {
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

    if (url.pathname === "/health") {
      return new Response("OK", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    if (url.pathname === "/") {
      const previewDoc = EMAIL_HTML.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
      const rejectPreviewDoc = REJECT_HTML.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Heerawalla Email Atelier</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, sans-serif; max-width: 900px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #0f172a; }
          .status { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 20px 0; border-radius: 4px; }
          .preview { width: 100%; height: 720px; border: 1px solid #e5e7eb; background: #fff; }
          .label { font-size: 12px; letter-spacing: 0.32em; text-transform: uppercase; color: #64748b; margin: 24px 0 12px; }
        </style>
      </head>
      <body>
        <h1>Heerawalla Email Atelier</h1>
        <div class="status">
          <strong>Status:</strong> Operational<br>
          <strong>Service:</strong> Email forwarding & auto-reply<br>
          <small>First emails get auto-reply, replies only forwarded</small>
        </div>
        <p><a href="/health">Health check</a></p>
        <div class="label">Acknowledgment Preview</div>
        <iframe class="preview" title="Heerawalla acknowledgment preview" srcdoc="${previewDoc}"></iframe>
        <div class="label">Reject Preview</div>
        <iframe class="preview" title="Heerawalla reject preview" srcdoc="${rejectPreviewDoc}"></iframe>
      </body>
      </html>`;

      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    return new Response("Not Found", { status: 404 });
  },

  async email(message: ForwardableEmailMessage, env: Env) {
    try {
      const headers = message.headers;
      const fromHeader = (headers.get("from") || message.from || "").trim();
      if (!fromHeader) return;
      const toHeader = (headers.get("to") || (message as { to?: string | string[] }).to || "").toString();
      if (toHeader.toLowerCase().includes("no-reply@heerawalla.com")) {
        logInfo("email_sink_no_reply", { to: toHeader });
        return;
      }

      const subjectLine = (headers.get("subject") || "").trim();
      const normalizedSubject = normalizeSubject(subjectLine);
      const inReplyTo = headers.get("in-reply-to");
      const references = headers.get("references");
      logInfo("email_received", {
        from: maskEmail(fromHeader),
        subject: subjectLine,
        hasThreadHeaders: Boolean(inReplyTo || references),
      });
      const autoSubmitted = (headers.get("auto-submitted") || "").toLowerCase();
      const precedence = (headers.get("precedence") || "").toLowerCase();
      const listId = headers.get("list-id");

      const senderInfo = parseSender(fromHeader);
      const senderEmail = senderInfo.email.toLowerCase();
      if (!isValidEmail(senderEmail)) return;

      const isAutoMail =
        autoSubmitted.includes("auto-") ||
        ["bulk", "list", "junk"].some((value) => precedence.includes(value)) ||
        Boolean(listId);
      const looksNoReply = NO_REPLY_MARKERS.some((marker) => fromHeader.toLowerCase().includes(marker));
      if (isAutoMail || looksNoReply) {
        logInfo("email_skipped_auto", { from: maskEmail(fromHeader) });
        return;
      }

      const hasResentHeader = [
        "resent-from",
        "resent-to",
        "resent-date",
        "resent-message-id",
        "resent-sender",
      ].some((header) => headers.get(header));
      const isForwardedSubject = /^(fwd|fw):/i.test(subjectLine);
      const isForwarded = Boolean(hasResentHeader || isForwardedSubject);
      const emailBody = (await extractEmailBody(message)).trim();
      const requestId =
        extractRequestIdFromText(subjectLine) || extractRequestIdFromText(emailBody) || extractRequestId(normalizedSubject);
      const normalizedRequestId = normalizeRequestId(requestId);
      const hasRequestId = Boolean(normalizedRequestId);
      const isAckSubject = normalizedSubject.startsWith(ACK_SUBJECT_PREFIX);
      const { body: forwardBody, wasTrimmed } = buildForwardBody(emailBody);
      const internalSenders = getInternalSenders(env);
      const isInternalSenderEmail = internalSenders.has(senderEmail);
      if (wasTrimmed) {
        logInfo("email_reply_trimmed", {
          requestId: normalizedRequestId || "unknown",
          from: maskEmail(fromHeader),
        });
      }

      if (hasRequestId && !isInternalSenderEmail) {
        await storeRequestOrigin(env, normalizedRequestId, senderEmail, senderInfo.name);
      }

      if (isInternalSenderEmail && hasRequestId) {
        const requestOrigin = await getRequestOrigin(env, normalizedRequestId);
        if (!requestOrigin) {
          logWarn("email_reply_origin_missing", {
            requestId: normalizedRequestId,
            from: maskEmail(fromHeader),
          });
          return;
        }
        const replySubject = buildReplySubject(subjectLine, normalizedRequestId);
        const replyBody = forwardBody || "(No message body)";
        logInfo("email_reply_routed", {
          to: maskEmail(requestOrigin.email),
          requestId: normalizedRequestId,
        });
        await sendEmail(env, {
          to: [requestOrigin.email],
          sender: "Heerawalla <atelier@heerawalla.com>",
          replyTo: getCustomerReplyTo(),
          subject: replySubject,
          textBody: replyBody,
          htmlBody: buildReplyHtml(replyBody),
        });
        return;
      }

      if (isForwarded || !hasRequestId) {
        logInfo("email_route", {
          route: "forward_rejects_to",
          reason: isForwarded ? "forwarded_message" : "missing_request_id",
          from: maskEmail(fromHeader),
        });
        logInfo("email_reject_start", {
          from: maskEmail(fromHeader),
          forwarded: Boolean(isForwarded),
          hasRequestId,
        });
        if (env.FORWARD_REJECTS_TO) {
          const forwardSubject = buildForwardSubject(subjectLine, normalizedRequestId || "UNKNOWN");
          await sendEmail(env, {
            to: [env.FORWARD_REJECTS_TO],
            sender: "Heerawalla <atelier@heerawalla.com>",
            replyTo: getInternalReplyTo(env),
            subject: forwardSubject,
            textBody: forwardBody || "(No message body)",
            htmlBody: buildForwardHtml({
              subject: forwardSubject,
              body: forwardBody || "(No message body)",
              senderEmail,
              senderName: senderInfo.name || "Not provided",
              requestId: normalizedRequestId || "Not provided",
            }),
          });
        } else {
          logWarn("email_reject_forward_missing", { from: maskEmail(fromHeader) });
        }
        if (isEnabled(env.SEND_REJECT, true)) {
          await sendEmail(env, {
            to: [senderEmail],
            sender: "Heerawalla <atelier@heerawalla.com>",
            replyTo: getCustomerReplyTo(),
            subject: REJECT_SUBJECT,
            textBody: REJECT_TEXT,
            htmlBody: REJECT_HTML,
            headers: autoReplyHeaders(),
          });
          logInfo("email_reject_sent", { from: maskEmail(fromHeader) });
        }
        return;
      }

      const forwardTo = env.FORWARD_TO || "atelier.heerawalla@gmail.com";
      const forwardSubject = buildForwardSubject(subjectLine, normalizedRequestId);
      const requestSummary = await getRequestSummary(env, normalizedRequestId);
      const forwardBodyWithSummary = appendRequestSummary(forwardBody || "(No message body)", requestSummary);
      logInfo("email_route", {
        route: "forward_to",
        reason: isAckSubject ? "ack_subject" : "request_id",
        from: maskEmail(fromHeader),
      });
      await sendEmail(env, {
        to: [forwardTo],
        sender: "Heerawalla <atelier@heerawalla.com>",
        replyTo: getInternalReplyTo(env),
        subject: forwardSubject,
        textBody: forwardBodyWithSummary,
        htmlBody: buildForwardHtml({
          subject: forwardSubject,
          body: forwardBodyWithSummary,
          senderEmail,
          senderName: senderInfo.name || "Not provided",
          requestId: normalizedRequestId,
        }),
      });
      logInfo("email_forwarded", { from: maskEmail(fromHeader) });

      if (env.HEERAWALLA_ACKS && normalizedRequestId) {
        const key = `ack:req:${normalizedRequestId}`;
        if (await env.HEERAWALLA_ACKS.get(key)) return;
        await env.HEERAWALLA_ACKS.put(key, "1", { expirationTtl: 60 * 60 * 24 * 7 });
      }

      if (isEnabled(env.SEND_ACK, true)) {
        await sendEmail(env, {
          to: [senderEmail],
          sender: "Heerawalla <atelier@heerawalla.com>",
          replyTo: getCustomerReplyTo(),
          subject: buildAckSubject(normalizedRequestId),
          textBody: EMAIL_TEXT,
          htmlBody: EMAIL_HTML,
          headers: autoReplyHeaders(),
        });
        logInfo("email_ack_sent", { to: maskEmail(senderEmail) });
      }
    } catch (error) {
      logError("email_processing_error", { message: String(error) });
    }
  },
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const ackMode = getAckMode(env);
  const tasks: Array<Promise<void>> = [];
  if (isEnabled(env.SEND_ACK, true) && ackMode === "cron") {
    tasks.push(processAckQueues(env));
  }
  if (isEnabled(env.SEND_STATUS_UPDATES, true)) {
    tasks.push(processOrderStatusEmails(env));
  }
  if (env.ORDER_DETAILS_SHEET_ID) {
    tasks.push(processShippedOrderUpdates(env));
  }
    // Daily gold price sync
    tasks.push(updateGoldPrice(env));
      tasks.push(processContactsDirectory(env));
  if (tasks.length) {
    ctx.waitUntil(Promise.all(tasks));
  }
},
} satisfies ExportedHandler<Env>;

export default legacyWorker;

export async function handleEmailInbound(message: ForwardableEmailMessage, env: Env) {
  return legacyWorker.email(message, env);
}

export async function handleScheduledEvent(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
) {
  return legacyWorker.scheduled(event, env, ctx);
}

/**
 * Fetch daily gold price (XAU/USD) from goldapi.io and store USD per gram
 * into D1.cost_chart.gold_price_per_gram_usd. Requires GOLD_API_KEY secret.
 */
async function updateGoldPrice(env: Env, options?: { force?: boolean }) {
  if (!env.GOLD_API_KEY || !env.DB) return;

  try {
    const force = Boolean(options?.force);
    const now = Date.now();
    const lastRunRaw = env.HEERAWALLA_ACKS
      ? await env.HEERAWALLA_ACKS.get("gold_price_last_run", "text")
      : null;
    const lastRun = lastRunRaw ? Number(lastRunRaw) : 0;
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    if (!force && lastRun && now - lastRun < TWENTY_FOUR_HOURS) {
      return;
    }

    const headers = new Headers({
      "x-access-token": env.GOLD_API_KEY,
      "Content-Type": "application/json",
    });
    const res = await fetch("https://www.goldapi.io/api/XAU/USD", { method: "GET", headers });
    if (!res.ok) {
      logError("gold_price_fetch_failed", { status: res.status, statusText: res.statusText });
      return;
    }
    const data = (await res.json()) as Record<string, unknown>;
    const usdPerOz = Number(data.price);
    const gram24 = Number(data.price_gram_24k);
    const gram22 = Number(data.price_gram_22k);
    const gram21 = Number(data.price_gram_21k);
    const gram20 = Number(data.price_gram_20k);
    const gram18 = Number(data.price_gram_18k);
    const gram16 = Number(data.price_gram_16k);
    const gram14 = Number(data.price_gram_14k);
    const gram10 = Number(data.price_gram_10k);

    if (!Number.isFinite(usdPerOz) || usdPerOz <= 0) {
      logError("gold_price_invalid", { price: data.price });
      return;
    }

    // troy ounce to grams
    const round2 = (val: number) => Math.round(val * 100) / 100;
    const GRAMS_PER_TROY_OUNCE = 31.1034768;
    const usdPerGram = gram24 && Number.isFinite(gram24) ? gram24 : usdPerOz / GRAMS_PER_TROY_OUNCE;
    const today = new Date().toISOString().slice(0, 10);

    const costEntries: Array<{ key: string; value: number; unit: string }> = [
      { key: "gold_price_per_gram_usd", value: usdPerGram, unit: "USD/g" },
      { key: "price_gram_24k", value: gram24, unit: "USD/g" },
      { key: "price_gram_22k", value: gram22, unit: "USD/g" },
      { key: "price_gram_21k", value: gram21, unit: "USD/g" },
      { key: "price_gram_20k", value: gram20, unit: "USD/g" },
      { key: "price_gram_18k", value: gram18, unit: "USD/g" },
      { key: "price_gram_16k", value: gram16, unit: "USD/g" },
      { key: "price_gram_14k", value: gram14, unit: "USD/g" },
      { key: "price_gram_10k", value: gram10, unit: "USD/g" },
    ];

    for (const entry of costEntries) {
      if (!Number.isFinite(entry.value) || entry.value <= 0) continue;
      const rounded = round2(entry.value);
      const updated = await env.DB.prepare(
        `UPDATE cost_chart SET value = ?, unit = ?, notes = ? WHERE key = ?`
      ).bind(rounded, entry.unit, today, entry.key).run();

      if (!updated.meta?.changes) {
        await env.DB.prepare(
          `INSERT INTO cost_chart (key, value, unit, notes) VALUES (?, ?, ?, ?)`
        ).bind(entry.key, rounded, entry.unit, today).run();
      }
    }

    logInfo("gold_price_updated", {
      usdPerGram,
      date: today,
      price_gram_24k: gram24,
      price_gram_18k: gram18,
      price_gram_14k: gram14,
      price_gram_22k: gram22,
      price_gram_21k: gram21,
      price_gram_20k: gram20,
      price_gram_16k: gram16,
      price_gram_10k: gram10,
    });
    if (env.HEERAWALLA_ACKS) {
      await env.HEERAWALLA_ACKS.put("gold_price_last_run", String(Date.now()), {
        expirationTtl: 60 * 60 * 24 * 3, // keep a few days
      });
    }
  } catch (error) {
    logError("gold_price_error", { message: String(error) });
  }
}

async function upsertMetalAdjustment(env: Env, metal: string, value: number, notes: string) {
  if (!env.DB || !Number.isFinite(value)) return;
  const updated = await env.DB.prepare(
    `UPDATE price_chart SET adjustment_value = ?, adjustment_type = 'Percent', notes = ? WHERE metal = ?`
  ).bind(value, notes, metal).run();

  if (!updated.meta?.changes) {
    await env.DB.prepare(
      `INSERT INTO price_chart (metal, adjustment_type, adjustment_value, notes) VALUES (?, 'Percent', ?, ?)`
    ).bind(metal, value, notes).run();
  }
}

function withMarkup(base: number, markup = 0.02) {
  return Math.round(base * (1 + markup) * 100) / 100;
}

function extractEmail(fromHeader: string) {
  if (!fromHeader) return "";
  const match = fromHeader.match(/<([^>]+)>/);
  return (match ? match[1] : fromHeader).trim();
}

function isValidEmail(email: string) {
  const normalized = email.trim();
  if (!normalized || normalized.length > 254) return false;
  const atIndex = normalized.lastIndexOf("@");
  if (atIndex <= 0 || atIndex === normalized.length - 1) return false;
  const local = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);
  if (!local || !domain || local.length > 64 || domain.length > 253) return false;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) return false;
  if (!domain.includes(".")) return false;
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return false;
  if (!/^[A-Za-z0-9.-]+$/.test(domain)) return false;
  const labels = domain.split(".");
  if (labels.some((label) => !label || label.length > 63 || label.startsWith("-") || label.endsWith("-"))) {
    return false;
  }
  return true;
}

function maskEmail(email: string) {
  const normalized = email.trim();
  const match = normalized.match(/<([^>]+)>/);
  const address = (match ? match[1] : normalized).trim();
  const [local, domain] = address.split("@");
  if (!domain) return address;
  const safeLocal = local ? `${local[0]}***` : "***";
  return `${safeLocal}@${domain}`;
}

const NO_REPLY_MARKERS = ["no-reply", "noreply", "mailer-daemon", "postmaster", "bounce."];

function normalizeRequestId(value: string) {
  return value.trim().toUpperCase();
}

function extractRequestId(subject: string) {
  return extractRequestIdFromText(subject);
}

function extractRequestIdFromText(text: string) {
  if (!text) return "";
  const upperText = text.toUpperCase();
  const match = upperText.match(/HW-REQ:([A-Z0-9]+)/);
  if (match) return match[1];
  const labelMatch = text.match(/Heerawalla Request ID:\s*([A-Z0-9]+)/i);
  return labelMatch ? labelMatch[1].toUpperCase() : "";
}

function buildForwardSubject(subject: string, requestId: string) {
  const trimmed = subject.trim();
  if (!requestId) return trimmed || "Heerawalla Atelier Submission";
  const normalizedId = normalizeRequestId(requestId);
  const base = trimmed || "Heerawalla Atelier Submission";
  if (base.toUpperCase().includes(REQUEST_ID_PREFIX)) return base;
  return `${base} [HW-REQ:${normalizedId}]`;
}

function buildReplySubject(subject: string, requestId: string) {
  const trimmed = subject.trim();
  const normalizedId = normalizeRequestId(requestId);
  if (!normalizedId) return trimmed || "Heerawalla Reply";
  if (!trimmed) return `Heerawalla Reply [HW-REQ:${normalizedId}]`;
  if (trimmed.toUpperCase().includes(REQUEST_ID_PREFIX)) return trimmed;
  return `${trimmed} [HW-REQ:${normalizedId}]`;
}

async function extractEmailBody(message: ForwardableEmailMessage) {
  const raw = await new Response(message.raw).text();
  return extractTextFromRawEmail(raw).trim();
}

function extractTextFromRawEmail(raw: string) {
  const { headerText, bodyText } = splitRawEmail(raw);
  const contentType = getHeaderValue(headerText, "content-type").toLowerCase();
  const transferEncoding = getHeaderValue(headerText, "content-transfer-encoding");
  if (contentType.includes("multipart/")) {
    const boundaryMatch = contentType.match(/boundary="?([^";]+)"?/i);
    const boundary = boundaryMatch ? boundaryMatch[1] : "";
    if (boundary) {
      const partText = extractTextFromMultipart(bodyText, boundary);
      if (partText) return partText;
    }
  }
  return decodeContent(bodyText, transferEncoding);
}

function buildForwardBody(body: string) {
  const normalized = normalizeReplyText(body);
  if (!normalized) return { body: "", wasTrimmed: false };
  const lines = normalized.split("\n");
  const cutIndex = findReplyCutIndex(lines);
  const separatorFound = cutIndex < lines.length;
  const cleanedLines = stripMimeArtifacts(lines.slice(0, cutIndex));
  const trimmedLines = trimSignatureLines(cleanedLines);
  const cleaned = trimmedLines.join("\n").trim();
  if (!cleaned) {
    if (separatorFound) {
      return { body: "(No new message body provided.)", wasTrimmed: true };
    }
    return { body: normalized, wasTrimmed: false };
  }
  const wasTrimmed = separatorFound || cleaned.length < normalized.length;
  return { body: cleaned, wasTrimmed };
}

const REPLY_SEPARATORS = [
  /^On .+ wrote:$/i,
  /^-{2,}\s*Original Message\s*-{2,}$/i,
  /^-{2,}\s*Forwarded message\s*-{2,}$/i,
];

const MIME_ARTIFACTS = [
  /^--+_=*Part_/i,
  /^--[-_A-Za-z0-9=+.]+$/,
  /^Content-Type:/i,
  /^Content-Transfer-Encoding:/i,
  /^Content-Disposition:/i,
  /^MIME-Version:/i,
];

function normalizeReplyText(body: string) {
  if (!body) return "";
  const normalized = body.replace(/\r\n/g, "\n").trim();
  if (!normalized) return "";
  if (looksQuotedPrintable(normalized)) {
    return decodeQuotedPrintable(normalized).trim();
  }
  return normalized;
}

function looksQuotedPrintable(value: string) {
  return /=\r?\n/.test(value) || /=[0-9A-F]{2}/i.test(value);
}

function findReplyCutIndex(lines: string[]) {
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    if (REPLY_SEPARATORS.some((pattern) => pattern.test(trimmed))) return i;
    if (/^On .+/i.test(trimmed)) {
      const lookAhead = lines.slice(i, i + 3).map((line) => line.trim()).join(" ");
      if (/wrote:/i.test(lookAhead)) return i;
    }
    if (/^>+/.test(trimmed)) return i;
    if (/^\|/.test(trimmed)) return i;
    if (/^From:\s.+/i.test(trimmed)) {
      const lookAhead = lines.slice(i, i + 4).map((line) => line.trim());
      if (lookAhead.some((line) => /^Sent:\s.+/i.test(line))) return i;
      if (lookAhead.some((line) => /^To:\s.+/i.test(line))) return i;
      if (lookAhead.some((line) => /^Subject:\s.+/i.test(line))) return i;
    }
  }
  return lines.length;
}

const SIGNATURE_LINES = [
  /^sent from/i,
  /^sent via/i,
  /^sent using/i,
];
const SIGNATURE_DELIMITER = /^--\s*$/;

function stripMimeArtifacts(lines: string[]) {
  const filtered: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && MIME_ARTIFACTS.some((pattern) => pattern.test(trimmed))) {
      continue;
    }
    filtered.push(line);
  }
  return filtered;
}

function trimSignatureLines(lines: string[]) {
  let end = lines.length;
  while (end > 0) {
    const line = lines[end - 1].trim();
    if (!line) {
      end -= 1;
      continue;
    }
    if (SIGNATURE_DELIMITER.test(line)) {
      end -= 1;
      break;
    }
    if (SIGNATURE_LINES.some((pattern) => pattern.test(line))) {
      end -= 1;
      continue;
    }
    break;
  }
  return lines.slice(0, end);
}

function extractTextFromMultipart(bodyText: string, boundary: string) {
  const boundaryMarker = `--${boundary}`;
  const parts = bodyText.split(boundaryMarker).slice(1);
  let htmlCandidate = "";
  for (const part of parts) {
    if (part.startsWith("--")) continue;
    const cleaned = part.replace(/^\r?\n/, "");
    const { headerText, bodyText: partBody } = splitRawEmail(cleaned);
    const contentType = getHeaderValue(headerText, "content-type").toLowerCase();
    const transferEncoding = getHeaderValue(headerText, "content-transfer-encoding");
    const decoded = decodeContent(partBody, transferEncoding).trim();
    if (!decoded) continue;
    if (contentType.includes("text/plain")) return decoded;
    if (!htmlCandidate && contentType.includes("text/html")) {
      htmlCandidate = decoded;
    }
  }
  return htmlCandidate ? stripHtml(htmlCandidate) : "";
}

function splitRawEmail(raw: string) {
  const separator = raw.includes("\r\n\r\n") ? "\r\n\r\n" : "\n\n";
  const splitIndex = raw.indexOf(separator);
  if (splitIndex === -1) {
    return { headerText: "", bodyText: raw };
  }
  return {
    headerText: raw.slice(0, splitIndex),
    bodyText: raw.slice(splitIndex + separator.length),
  };
}

function getHeaderValue(headersText: string, name: string) {
  const unfolded = headersText.replace(/\r?\n[ \t]+/g, " ");
  const match = unfolded.match(new RegExp(`^${name}:\\s*([^\\r\\n]+)`, "im"));
  return match ? match[1].trim() : "";
}

function decodeContent(body: string, transferEncoding: string) {
  const normalizedBody = body.replace(/\r\n/g, "\n");
  const encoding = transferEncoding.trim().toLowerCase();
  if (encoding.includes("base64")) {
    return fromBase64(normalizedBody);
  }
  if (encoding.includes("quoted-printable")) {
    return decodeQuotedPrintable(normalizedBody);
  }
  return normalizedBody;
}

function fromBase64(value: string) {
  const cleaned = value.replace(/[\s\r\n]+/g, "");
  if (!cleaned) return "";
  try {
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return value;
  }
}

function decodeQuotedPrintable(value: string) {
  const withoutSoftBreaks = value.replace(/=\r?\n/g, "");
  return withoutSoftBreaks.replace(/=([0-9A-F]{2})/gi, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

function stripHtml(value: string) {
  return value
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/p\s*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

async function hasValidEmailDomain(domain: string) {
  const normalized = domain.trim().toLowerCase();
  if (!normalized || normalized.length > 253) return false;
  if (!/^[a-z0-9.-]+$/.test(normalized)) return false;
  if (normalized.startsWith(".") || normalized.endsWith(".") || normalized.includes("..")) return false;

  const mxResult = await queryDnsRecord(normalized, "MX", 15);
  if (mxResult === true) return true;
  if (mxResult === false) {
    const aResult = await queryDnsRecord(normalized, "A", 1);
    return aResult === true;
  }
  return true;
}

async function queryDnsRecord(domain: string, type: string, expectedType: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`,
      {
        headers: { Accept: "application/dns-json" },
        signal: controller.signal,
      }
    );
    if (!response.ok) return undefined;
    const result = (await response.json()) as { Status?: number; Answer?: Array<{ type?: number }> };
    if (result.Status === 3) return false;
    if (result.Status !== 0) return undefined;
    const answers = Array.isArray(result.Answer) ? result.Answer : [];
    return answers.some((answer) => Number(answer.type) === expectedType);
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyTurnstile(secret: string, token: string, ip?: string) {
  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  if (ip) formData.append("remoteip", ip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) return false;
  const result = (await response.json()) as { success?: boolean };
  return Boolean(result.success);
}

function buildCorsHeaders(origin: string, json = false) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Email",
  };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    if (origin !== "*") {
      headers["Access-Control-Allow-Credentials"] = "true";
      headers["Vary"] = "Origin";
    }
    if (isLocalOrigin(origin) || origin === "*") {
      headers["X-Dev-Cors"] = "1";
    }
  }
  if (json) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

function buildCatalogHeaders() {
  return {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };
}

function buildCatalogCacheKey(url: URL) {
  const params = url.searchParams.toString();
  return params ? `catalog:${url.pathname}?${params}` : `catalog:${url.pathname}`;
}

async function handleAdminRequest(
  request: Request,
  env: Env,
  url: URL,
  allowedOrigin: string,
  origin: string
) {
  if (!url.pathname.startsWith("/admin")) return null;
  if (request.method === "OPTIONS") {
    const isLocalHost = url.hostname === "127.0.0.1" || url.hostname === "localhost";
    const debugHeaders = isLocalHost
      ? {
          "X-Debug-Origin": origin || "none",
          "X-Debug-Allow-Origin": allowedOrigin || "none",
        }
      : {};
    return new Response(null, {
      status: 200,
      headers: { ...buildCorsHeaders(allowedOrigin, true), ...debugHeaders },
    });
  }

  const adminEmail = getAdminEmail(request, origin);
  const role = getAdminRole(env, adminEmail);
  if (!role) {
    return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
      status: 403,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }

  const path = url.pathname.replace(/^\/admin/, "") || "/";
    if (request.method === "GET") {
      if (path === "/" || path === "/me") {
        return new Response(JSON.stringify({ ok: true, role, email: adminEmail }), {
          status: 200,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/enums") {
        return new Response(JSON.stringify(ADMIN_ENUMS), {
          status: 200,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
    if (path === "/orders") {
      const payload = await buildAdminList(env, "order", url.searchParams);
      return new Response(JSON.stringify({ ok: true, ...payload }), {
        status: 200,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (path === "/orders/details") {
      const requestId =
        url.searchParams.get("request_id") || url.searchParams.get("requestId") || "";
      if (!requestId) {
        return new Response(JSON.stringify({ ok: false, error: "missing_request_id" }), {
          status: 400,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      const details = await getOrderDetailsRecord(env, requestId);
      return new Response(JSON.stringify({ ok: true, details: details || {} }), {
        status: 200,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (path === "/quotes") {
      const payload = await buildAdminList(env, "quote", url.searchParams);
      return new Response(JSON.stringify({ ok: true, ...payload }), {
        status: 200,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
      if (path === "/contacts") {
        const payload = await buildAdminList(env, "contact", url.searchParams);
        return new Response(JSON.stringify({ ok: true, ...payload }), {
          status: 200,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/tickets") {
        const payload = await buildAdminList(env, "ticket", url.searchParams);
        return new Response(JSON.stringify({ ok: true, ...payload }), {
          status: 200,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/products") {
        const payload = await buildAdminList(env, "product", url.searchParams);
        return new Response(JSON.stringify({ ok: true, ...payload }), {
          status: 200,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/inspirations") {
        const payload = await buildAdminList(env, "inspiration", url.searchParams);
        return new Response(JSON.stringify({ ok: true, ...payload }), {
          status: 200,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/media-library") {
        const payload = await buildAdminList(env, "media_library", url.searchParams);
        return new Response(JSON.stringify({ ok: true, ...payload }), {
          status: 200,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/product-media") {
        const payload = await buildAdminList(env, "product_media", url.searchParams);
        return new Response(JSON.stringify({ ok: true, ...payload }), {
          status: 200,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/inspiration-media") {
        const payload = await buildAdminList(env, "inspiration_media", url.searchParams);
        return new Response(JSON.stringify({ ok: true, ...payload }), {
          status: 200,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/catalog-stone-options") {
        const payload = await buildCatalogStoneOptionsList(env, url.searchParams);
        return new Response(JSON.stringify({ ok: true, ...payload }), {
          status: 200,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/catalog-notes") {
        const payload = await buildCatalogNotesList(env, url.searchParams);
        return new Response(JSON.stringify({ ok: true, ...payload }), {
          status: 200,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/catalog-metal-options") {
        const payload = await buildCatalogMetalOptionsList(env, url.searchParams);
        return new Response(JSON.stringify({ ok: true, ...payload }), {
          status: 200,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/site-config") {
        const payload = await buildSiteConfigList(env, url.searchParams);
        return new Response(JSON.stringify({ ok: true, ...payload }), {
          status: 200,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/contacts-unified") {
        const payload = await buildUnifiedContactsList(env, url.searchParams);
        return new Response(JSON.stringify({ ok: true, ...payload }), {
          status: 200,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/tickets/details") {
        const payload = await buildTicketDetails(env, url.searchParams);
        return new Response(JSON.stringify({ ok: true, ...payload }), {
          status: 200,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/price-chart") {
        if (!canEditPricing(role)) {
          return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
            status: 403,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
        const payload = await buildPricingList(env, "price_chart", url.searchParams);
        return new Response(JSON.stringify({ ok: true, ...payload }), {
          status: 200,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/cost-chart") {
        if (!canEditPricing(role)) {
          return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
            status: 403,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
        const payload = await buildPricingList(env, "cost_chart", url.searchParams);
        return new Response(JSON.stringify({ ok: true, ...payload }), {
          status: 200,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/diamond-price-chart") {
        if (!canEditPricing(role)) {
          return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
            status: 403,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
        const payload = await buildPricingList(env, "diamond_price_chart", url.searchParams);
        return new Response(JSON.stringify({ ok: true, ...payload }), {
          status: 200,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
    }

  if (request.method === "POST") {
    if (path === "/media/upload") {
      if (!canEditCatalog(role)) {
        return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
          status: 403,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      const result = await handleMediaUpload(env, request);
      return new Response(JSON.stringify(result), {
        status: result.ok ? 200 : 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (path === "/media/describe") {
      if (!canEditCatalog(role)) {
        return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
          status: 403,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      const payload = await safeJson(request);
      const mediaId = getString(payload.media_id || payload.mediaId);
      if (!mediaId) {
        return new Response(JSON.stringify({ ok: false, error: "media_id_required" }), {
          status: 400,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      const result = await describeMedia(env, mediaId);
      const status = result.ok || result.error === "ai_credentials_missing" ? 200 : 400;
      return new Response(JSON.stringify(result), {
        status,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (path === "/cost-chart/gold-refresh") {
      if (!canEditPricing(role)) {
        return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
          status: 403,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (!env.GOLD_API_KEY) {
        return new Response(
          JSON.stringify({ ok: false, error: "gold_api_key_missing" }),
          { status: 400, headers: buildCorsHeaders(allowedOrigin, true) },
        );
      }
      await updateGoldPrice(env, { force: true });
      const rows = await d1All(
        env,
        "SELECT value, unit, notes FROM cost_chart WHERE key = 'gold_price_per_gram_usd' LIMIT 1",
      );
      const payload =
        rows && rows.length
          ? { value: rows[0].value, unit: rows[0].unit, notes: rows[0].notes }
          : {};
      return new Response(JSON.stringify({ ok: true, ...payload }), {
        status: 200,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (path === "/deploy-site") {
      if (role !== "admin") {
        return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
          status: 403,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      const result = await triggerSiteRebuild(env);
      return new Response(JSON.stringify(result), {
        status: result.ok ? 200 : 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    const payload = await safeJson(request);
    if (!isRecord(payload)) {
      return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (path === "/orders/action") {
      if (!canEditOrders(role)) {
        return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
          status: 403,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      const result = await handleOrderAdminAction(env, payload, adminEmail);
      return new Response(JSON.stringify(result), {
        status: result.ok ? 200 : 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (path === "/orders/confirm") {
      if (!canEditOrders(role)) {
        return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
          status: 403,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      const result = await handleOrderConfirmationAdmin(env, payload);
      return new Response(JSON.stringify(result), {
        status: result.ok ? 200 : 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (path === "/quotes/action") {
      if (!canEditQuotes(role)) {
        return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
          status: 403,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      const result = await handleQuoteAdminAction(env, payload);
      return new Response(JSON.stringify(result), {
        status: result.ok ? 200 : 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (path === "/quotes/price") {
      if (!canEditQuotes(role)) {
        return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
          status: 403,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      const fields = coerceUpdates(payload.fields || payload, QUOTE_UPDATE_FIELDS);
      const force = getBoolean(payload.force);
      const result = await computeQuoteOptionPrices(env, fields, { force });
      return new Response(JSON.stringify(result), {
        status: result.ok ? 200 : 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
      if (path === "/contacts/action") {
        if (!canEditContacts(role)) {
          return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
            status: 403,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
        const result = await handleContactAdminAction(env, payload);
        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 400,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/tickets/action") {
        if (!canEditTickets(role)) {
          return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
            status: 403,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
        const result = await handleTicketAdminAction(env, payload, adminEmail);
        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 400,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/products/action") {
        if (!canEditCatalog(role)) {
          return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
            status: 403,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
        const result = await handleCatalogAdminAction(env, "product", payload);
        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 400,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/inspirations/action") {
        if (!canEditCatalog(role)) {
          return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
            status: 403,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
        const result = await handleCatalogAdminAction(env, "inspiration", payload);
        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 400,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/media-library/action") {
        if (!canEditCatalog(role)) {
          return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
            status: 403,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
        const result = await handleCatalogAdminAction(env, "media_library", payload);
        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 400,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/product-media/action") {
        if (!canEditCatalog(role)) {
          return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
            status: 403,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
        const result = await handleCatalogAdminAction(env, "product_media", payload);
        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 400,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/inspiration-media/action") {
        if (!canEditCatalog(role)) {
          return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
            status: 403,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
        const result = await handleCatalogAdminAction(env, "inspiration_media", payload);
        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 400,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/catalog-stone-options/action") {
        if (!canEditCatalog(role)) {
          return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
            status: 403,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
        const result = await handleCatalogStoneOptionAction(env, payload);
        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 400,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/catalog-notes/action") {
        if (!canEditCatalog(role)) {
          return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
            status: 403,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
        const result = await handleCatalogNotesAction(env, payload);
        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 400,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/catalog-metal-options/action") {
        if (!canEditCatalog(role)) {
          return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
            status: 403,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
        const result = await handleCatalogMetalOptionAction(env, payload);
        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 400,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/site-config/action") {
        if (!canEditSiteConfig(role)) {
          return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
            status: 403,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
        const result = await handleSiteConfigAdminAction(env, payload);
        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 400,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/email") {
        if (!canEditOrders(role)) {
          return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
            status: 403,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
        const result = await handleAdminEmail(env, payload);
        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 400,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/price-chart/action") {
        if (!canEditPricing(role)) {
          return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
            status: 403,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
        const result = await handlePricingAdminAction(env, "price_chart", payload);
        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 400,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/cost-chart/action") {
        if (!canEditPricing(role)) {
          return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
            status: 403,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
        const result = await handlePricingAdminAction(env, "cost_chart", payload);
        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 400,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      if (path === "/diamond-price-chart/action") {
        if (!canEditPricing(role)) {
          return new Response(JSON.stringify({ ok: false, error: "admin_forbidden" }), {
            status: 403,
            headers: buildCorsHeaders(allowedOrigin, true),
          });
        }
        const result = await handlePricingAdminAction(env, "diamond_price_chart", payload);
        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 400,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
    }

  return new Response(JSON.stringify({ ok: false, error: "admin_not_found" }), {
    status: 404,
    headers: buildCorsHeaders(allowedOrigin, true),
  });
}

async function handleOrderConfirmationRequest(
  request: Request,
  env: Env,
  url: URL,
  allowedOrigin: string
) {
  if (!url.pathname.startsWith(ORDER_CONFIRMATION_PATH)) return null;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }
  if (!allowedOrigin) {
    return new Response("Forbidden", { status: 403 });
  }
  if (url.pathname === ORDER_CONFIRMATION_PATH && request.method === "GET") {
    const token =
      url.searchParams.get("token") ||
      url.searchParams.get("t") ||
      url.searchParams.get("confirmation") ||
      "";
    const normalizedToken = token.trim();
    if (!normalizedToken) {
      return new Response(JSON.stringify({ ok: false, error: "missing_token" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    const record = await getOrderConfirmationRecord(env, normalizedToken);
    if (!record) {
      return new Response(JSON.stringify({ ok: false, error: "not_found" }), {
        status: 404,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    let orderSummary: Record<string, string> = {};
    try {
      const orderLookup = await findSheetRowByRequestId(env, "order", record.requestId);
      if (orderLookup) {
        const orderHeader = Array.from(orderLookup.headerIndex.keys());
        const orderRecord = mapSheetRowToRecord(orderHeader, orderLookup.row);
        orderSummary = {
          requestId: getString(orderRecord.request_id || record.requestId),
          productName: getString(orderRecord.product_name || record.productName),
          productUrl: getString(orderRecord.product_url),
          designCode: getString(orderRecord.design_code),
          metal: getString(orderRecord.metal),
          metalWeight: getString(orderRecord.metal_weight),
          metalWeightAdjustment: getString(orderRecord.metal_weight_adjustment),
          stone: getString(orderRecord.stone),
          stoneWeight: getString(orderRecord.stone_weight),
          diamondBreakdown: getString(orderRecord.diamond_breakdown),
          size: getString(orderRecord.size),
          price: getString(orderRecord.price),
          timeline: getString(orderRecord.timeline),
          timelineAdjustmentWeeks: getString(orderRecord.timeline_adjustment_weeks),
          addressLine1: getString(orderRecord.address_line1),
          addressLine2: getString(orderRecord.address_line2),
          city: getString(orderRecord.city),
          state: getString(orderRecord.state),
          postalCode: getString(orderRecord.postal_code),
          country: getString(orderRecord.country),
        };
      }
    } catch (error) {
      logWarn("order_confirmation_order_fetch_failed", { requestId: record.requestId, error: String(error) });
    }
    let cancelUrl = "";
    try {
      if (record.requestId) {
        const cancelRecord = await ensureOrderCancelRecord(
          env,
          record.requestId,
          record.email || "",
          record.name || "",
          record.productName || ""
        );
        cancelUrl = buildOrderCancelPageUrl(env, cancelRecord.token);
      }
    } catch {
      cancelUrl = "";
    }
    return new Response(
      JSON.stringify({
        ok: true,
        status: record.status,
        requestId: record.requestId,
        name: record.name || "",
        productName: record.productName || "",
        changes: record.changes || [],
        order: orderSummary,
        cancelUrl: cancelUrl || "",
      }),
      {
        status: 200,
        headers: buildCorsHeaders(allowedOrigin, true),
      }
    );
  }

  if (url.pathname === ORDER_CONFIRMATION_CONFIRM_PATH && request.method === "POST") {
    const payload = await safeJson(request);
    if (!isRecord(payload)) {
      return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    const token = getString(payload.token || payload.confirmationToken);
    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: "missing_token" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    const record = await getOrderConfirmationRecord(env, token);
    if (!record) {
      return new Response(JSON.stringify({ ok: false, error: "not_found" }), {
        status: 404,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (record.status !== "pending") {
      return new Response(JSON.stringify({ ok: false, error: "already_used", status: record.status }), {
        status: 409,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    const confirmedAt = new Date().toISOString();
    const paymentUrl = resolveOrderConfirmationPaymentUrl(env, record);
    const updatedRecord = {
      ...record,
      status: "confirmed",
      confirmedAt,
      paymentUrl: paymentUrl || record.paymentUrl,
    };
    await storeOrderConfirmationRecord(env, updatedRecord);
    const paymentNote = paymentUrl ? ` Payment link: ${paymentUrl}.` : "";
    await appendOrderNote(
      env,
      record.requestId,
      `Customer confirmed update on ${confirmedAt}.${paymentNote}`
    );
    try {
      if (paymentUrl) {
        await upsertOrderDetailsRecord(
          env,
          record.requestId,
          { payment_url: paymentUrl },
          "INVOICED",
          "customer"
        );
      }
    } catch (error) {
      logWarn("order_confirmation_details_failed", { requestId: record.requestId, error: String(error) });
    }
    try {
      const lookup = await findSheetRowByRequestId(env, "order", record.requestId);
      if (lookup) {
        const currentStatus = getOrderStatusFromRow(lookup);
        if (isOrderTransitionAllowed(currentStatus, "INVOICED")) {
          await updateAdminRow(env, "order", record.requestId, "INVOICED", "", {});
        }
      }
    } catch (error) {
      logWarn("order_confirmation_status_failed", { requestId: record.requestId, error: String(error) });
    }
    return new Response(
      JSON.stringify({
        ok: true,
        status: updatedRecord.status,
        paymentUrl: paymentUrl || undefined,
      }),
      {
        status: 200,
        headers: buildCorsHeaders(allowedOrigin, true),
      }
    );
  }

  if (url.pathname === ORDER_CONFIRMATION_CANCEL_PATH && request.method === "POST") {
    const payload = await safeJson(request);
    if (!isRecord(payload)) {
      return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    const token = getString(payload.token || payload.confirmationToken);
    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: "missing_token" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    const record = await getOrderConfirmationRecord(env, token);
    if (!record) {
      return new Response(JSON.stringify({ ok: false, error: "not_found" }), {
        status: 404,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (record.status !== "pending") {
      return new Response(JSON.stringify({ ok: false, error: "already_used", status: record.status }), {
        status: 409,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    const canceledAt = new Date().toISOString();
    const updatedRecord = {
      ...record,
      status: "canceled",
      canceledAt,
      cancellationReason: reason || undefined,
      cancellationNote: note || undefined,
    };
    await storeOrderConfirmationRecord(env, updatedRecord);
    const reasonNote = reason ? ` Reason: ${reason}.` : "";
    const detailNote = note ? ` Note: ${note}.` : "";
    await appendOrderNote(
      env,
      record.requestId,
      `Customer canceled update on ${canceledAt}.${reasonNote}${detailNote}`.trim()
    );
    return new Response(JSON.stringify({ ok: true, status: updatedRecord.status }), {
      status: 200,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: buildCorsHeaders(allowedOrigin, true),
  });
}

async function handleQuoteConfirmationRequest(
  request: Request,
  env: Env,
  url: URL,
  allowedOrigin: string
) {
  if (!url.pathname.startsWith(QUOTE_CONFIRMATION_PATH)) return null;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }
  if (!allowedOrigin) {
    return new Response("Forbidden", { status: 403 });
  }

  if (url.pathname === QUOTE_CONFIRMATION_PATH && request.method === "GET") {
    const token =
      url.searchParams.get("token") ||
      url.searchParams.get("t") ||
      url.searchParams.get("quote") ||
      "";
    const normalizedToken = token.trim();
    if (!normalizedToken) {
      return new Response(JSON.stringify({ ok: false, error: "missing_token" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    const record = await getQuoteConfirmationRecord(env, normalizedToken);
    if (!record) {
      return new Response(JSON.stringify({ ok: false, error: "not_found" }), {
        status: 404,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (record.status === "expired") {
      const redirectUrl = record.redirectToken ? buildQuotePageUrl(env, record.redirectToken) : "";
      return new Response(
        JSON.stringify({ ok: false, error: "expired", status: "expired", redirectUrl }),
        {
          status: 410,
          headers: buildCorsHeaders(allowedOrigin, true),
        }
      );
    }
    if (record.status !== "expired" && isQuoteExpired(record)) {
      const updatedRecord = { ...record, status: "expired" as const };
      await storeQuoteConfirmationRecord(env, updatedRecord);
      const redirectUrl = updatedRecord.redirectToken
        ? buildQuotePageUrl(env, updatedRecord.redirectToken)
        : "";
      return new Response(
        JSON.stringify({ ok: false, error: "expired", status: "expired", redirectUrl }),
        {
          status: 410,
          headers: buildCorsHeaders(allowedOrigin, true),
        }
      );
    }
    return new Response(
      JSON.stringify({
        ok: true,
        status: record.status,
        requestId: record.requestId,
        name: record.name || "",
        productName: record.productName || "",
        productUrl: record.productUrl || "",
        designCode: record.designCode || "",
        metal: record.metal || "",
        metalWeight: record.metalWeight || "",
        metalWeightAdjustment: record.metalWeightAdjustment || "",
        stoneWeight: record.stoneWeight || "",
        diamondBreakdown: record.diamondBreakdown || "",
        discountSummary: record.discountSummary || "",
        discountPercent: record.discountPercent ?? null,
        metals: record.metals || [],
        options: record.options || [],
        expiresAt: record.expiresAt || "",
        selectedMetal: record.selectedMetal || "",
        selectedOption: record.selectedOption ?? null,
        selectedPrice: record.selectedPrice ?? null,
        selectedAt: record.selectedAt || record.acceptedAt || "",
      }),
      {
        status: 200,
        headers: buildCorsHeaders(allowedOrigin, true),
      }
    );
  }

  if (url.pathname === QUOTE_CONFIRMATION_ACCEPT_PATH && request.method === "POST") {
    const payload = await safeJson(request);
    if (!isRecord(payload)) {
      return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    const token = getString(payload.token);
    const metal = normalizeMetalOption(getString(payload.metal || payload.selectedMetal));
    const optionIndex = Number(payload.optionIndex ?? payload.option ?? payload.selectedOption);
    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: "missing_token" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    const record = await getQuoteConfirmationRecord(env, token);
    if (!record) {
      return new Response(JSON.stringify({ ok: false, error: "not_found" }), {
        status: 404,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (record.status === "expired" || isQuoteExpired(record)) {
      const updatedRecord = record.status === "expired" ? record : { ...record, status: "expired" as const };
      if (record.status !== "expired") {
        await storeQuoteConfirmationRecord(env, updatedRecord);
      }
      return new Response(JSON.stringify({ ok: false, error: "expired", status: "expired" }), {
        status: 410,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (!["pending", "selected", "accepted"].includes(record.status)) {
      return new Response(JSON.stringify({ ok: false, error: "already_used", status: record.status }), {
        status: 409,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= record.options.length) {
      return new Response(JSON.stringify({ ok: false, error: "invalid_option" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (metal && !record.metals.includes(metal)) {
      return new Response(JSON.stringify({ ok: false, error: "invalid_metal" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    const option = record.options[optionIndex];
    const selectedMetal = metal || record.metals[0] || "18K";
    const selectedPrice = option.prices[selectedMetal] ?? option.price18k;
    const confirmChange = getBoolean(payload.confirm);
    const hasSelection = record.selectedOption !== undefined && record.selectedOption !== null;
    const isDifferentSelection =
      hasSelection &&
      (record.selectedOption !== optionIndex || (record.selectedMetal || "") !== selectedMetal);
    if (isDifferentSelection && !confirmChange) {
      const currentOption =
        record.selectedOption !== undefined && record.selectedOption !== null
          ? record.options[record.selectedOption]
          : null;
      const currentPrice = currentOption
        ? currentOption.prices?.[record.selectedMetal || ""] ?? currentOption.price18k
        : null;
      return new Response(
        JSON.stringify({
          ok: false,
          error: "confirm_required",
          status: record.status,
          currentSelection: {
            metal: record.selectedMetal || "",
            option: record.selectedOption,
            price: currentPrice,
          },
        }),
        {
          status: 409,
          headers: buildCorsHeaders(allowedOrigin, true),
        }
      );
    }

    const acceptedAt = new Date().toISOString();
    const updatedRecord: QuoteConfirmationRecord = {
      ...record,
      status: "selected",
      selectedMetal,
      selectedOption: optionIndex,
      selectedPrice,
      acceptedAt: record.acceptedAt || acceptedAt,
      selectedAt: acceptedAt,
    };
    await storeQuoteConfirmationRecord(env, updatedRecord);

    try {
      await updateAdminRow(env, "quote", record.requestId, "", "", {
        quote_selected_metal: selectedMetal,
        quote_selected_option: String(optionIndex + 1),
        quote_selected_price: String(selectedPrice),
      });
    } catch (error) {
      logWarn("quote_accept_update_failed", { requestId: record.requestId, error: String(error) });
    }

    const paymentUrl = resolveQuotePaymentUrl(
      env,
      record.requestId,
      record.token,
      selectedMetal,
      String(optionIndex + 1)
    );
    return new Response(
      JSON.stringify({
        ok: true,
        status: updatedRecord.status,
        paymentUrl: paymentUrl || undefined,
      }),
      {
        status: 200,
        headers: buildCorsHeaders(allowedOrigin, true),
      }
    );
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: buildCorsHeaders(allowedOrigin, true),
  });
}

async function handleOrderCancellationRequest(
  request: Request,
  env: Env,
  url: URL,
  allowedOrigin: string
) {
  if (!url.pathname.startsWith(ORDER_CANCEL_PATH)) return null;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }
  if (!allowedOrigin) {
    return new Response("Forbidden", { status: 403 });
  }

  if (url.pathname === ORDER_CANCEL_PATH && request.method === "GET") {
    const token =
      url.searchParams.get("token") ||
      url.searchParams.get("t") ||
      url.searchParams.get("cancel") ||
      "";
    const normalizedToken = token.trim();
    if (!normalizedToken) {
      return new Response(JSON.stringify({ ok: false, error: "missing_token" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    const record = await getOrderCancelRecord(env, normalizedToken);
    if (!record) {
      return new Response(JSON.stringify({ ok: false, error: "not_found" }), {
        status: 404,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    return new Response(
      JSON.stringify({
        ok: true,
        status: record.status,
        requestId: record.requestId,
        name: record.name || "",
        productName: record.productName || "",
      }),
      {
        status: 200,
        headers: buildCorsHeaders(allowedOrigin, true),
      }
    );
  }

  if (url.pathname === ORDER_CANCEL_CONFIRM_PATH && request.method === "POST") {
    const payload = await safeJson(request);
    if (!isRecord(payload)) {
      return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    const token = getString(payload.token || payload.cancelToken);
    const reason = getString(payload.reason || payload.cancelReason);
    const note = getString(payload.note || payload.cancelNote);
    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: "missing_token" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (!reason) {
      return new Response(JSON.stringify({ ok: false, error: "missing_reason" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    const record = await getOrderCancelRecord(env, token);
    if (!record) {
      return new Response(JSON.stringify({ ok: false, error: "not_found" }), {
        status: 404,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (record.status !== "pending") {
      return new Response(JSON.stringify({ ok: false, error: "already_used", status: record.status }), {
        status: 409,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    const lookup = await findSheetRowByRequestId(env, "order", record.requestId);
    if (!lookup) {
      return new Response(JSON.stringify({ ok: false, error: "request_not_found" }), {
        status: 404,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    const currentStatus = getOrderStatusFromRow(lookup);
    if (!isOrderTransitionAllowed(currentStatus, "CANCELLED")) {
      return new Response(
        JSON.stringify({ ok: false, error: "status_not_cancellable", status: currentStatus }),
        {
          status: 409,
          headers: buildCorsHeaders(allowedOrigin, true),
        }
      );
    }

    const canceledAt = new Date().toISOString();
    const reasonNote = reason ? `Reason: ${reason}.` : "";
    const detailNote = note ? `Note: ${note}.` : "";
    const cancelNote = `Customer canceled order on ${canceledAt}. ${reasonNote} ${detailNote}`.trim();
    const notesIdx = lookup.headerIndex.get("notes");
    const existingNotes = notesIdx === undefined ? "" : getString(lookup.row[notesIdx]);
    const combinedNotes = appendNote(appendNote(existingNotes, cancelNote), buildStatusAuditNote("CANCELLED"));

    await updateAdminRow(env, "order", record.requestId, "CANCELLED", combinedNotes, {});

    const updatedRecord = {
      ...record,
      status: "canceled" as const,
      canceledAt,
      cancellationReason: reason,
      cancellationNote: note || undefined,
    };
    await storeOrderCancelRecord(env, updatedRecord);

    return new Response(JSON.stringify({ ok: true, status: updatedRecord.status }), {
      status: 200,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: buildCorsHeaders(allowedOrigin, true),
  });
}

async function handleOrderVerificationRequest(
  request: Request,
  env: Env,
  url: URL,
  allowedOrigin: string
) {
  if (!url.pathname.startsWith(ORDER_VERIFY_PATH)) return null;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }
  if (!allowedOrigin) {
    return new Response("Forbidden", { status: 403 });
  }
  if (url.pathname !== ORDER_VERIFY_PATH) {
    return new Response("Not Found", { status: 404 });
  }
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }
  const payload = await safeJson(request);
  if (!isRecord(payload)) {
    return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
      status: 400,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }
  const rawRequestId = getString(payload.requestId || payload.request_id || payload.orderId || payload.order_id);
  const normalizedRequestId = normalizeRequestId(rawRequestId).replace(/^HW-REQ:/, "");
  const email = getString(payload.email);
  const phone = normalizePhone(getString(payload.phone));
  if (!normalizedRequestId || (!email && !phone)) {
    return new Response(JSON.stringify({ ok: false, error: "missing_fields" }), {
      status: 400,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }

  const lookup = await findSheetRowByRequestId(env, "order", normalizedRequestId);
  if (!lookup) {
    return new Response(JSON.stringify({ ok: false, error: "not_found" }), {
      status: 404,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }
  const emailIdx = lookup.headerIndex.get("email") ?? -1;
  const phoneIdx = lookup.headerIndex.get("phone") ?? -1;
  const nameIdx = lookup.headerIndex.get("name") ?? -1;
  const productIdx = lookup.headerIndex.get("product_name") ?? -1;
  const statusIdx = lookup.headerIndex.get("status") ?? -1;
  const createdIdx = lookup.headerIndex.get("created_at") ?? -1;
  const orderEmail = emailIdx >= 0 ? normalizeEmailAddress(getString(lookup.row[emailIdx])) : "";
  const orderPhone = phoneIdx >= 0 ? normalizePhone(getString(lookup.row[phoneIdx])) : "";
  const emailMatch = email ? normalizeEmailAddress(email) === orderEmail : false;
  const phoneMatch = phone ? normalizePhone(phone) === orderPhone : false;
  if (!emailMatch && !phoneMatch) {
    return new Response(JSON.stringify({ ok: false, error: "not_found" }), {
      status: 404,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }

  const details = await getOrderDetailsRecord(env, normalizedRequestId);
  const order = {
    requestId: normalizedRequestId,
    name: nameIdx >= 0 ? getString(lookup.row[nameIdx]) : "",
    productName: productIdx >= 0 ? getString(lookup.row[productIdx]) : "",
    status: statusIdx >= 0 ? getString(lookup.row[statusIdx]) : "",
    createdAt: createdIdx >= 0 ? getString(lookup.row[createdIdx]) : "",
  };
  return new Response(
    JSON.stringify({
      ok: true,
      order,
      details: details
        ? {
            certificates: getString(details.certificates),
            deliveredAt: getString(details.delivered_at),
          }
        : {},
    }),
    {
      status: 200,
      headers: buildCorsHeaders(allowedOrigin, true),
    }
  );
}

function getAdminEmail(request: Request, origin: string) {
  const accessEmail =
    request.headers.get("Cf-Access-Authenticated-User-Email") ||
    request.headers.get("cf-access-authenticated-user-email") ||
    "";
  if (accessEmail) return normalizeEmailAddress(accessEmail);
  const localOverride = request.headers.get("X-Admin-Email") || "";
  if (localOverride && isLocalOrigin(origin)) {
    return normalizeEmailAddress(localOverride);
  }
  if (isLocalOrigin(origin)) {
    const url = new URL(request.url);
    const queryEmail = url.searchParams.get("admin_email") || url.searchParams.get("adminEmail") || "";
    if (queryEmail) return normalizeEmailAddress(queryEmail);
  }
  return "";
}

function isLocalOrigin(origin: string) {
  return origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1");
}

async function triggerSiteRebuild(env: Env) {
  const token = (env.GITHUB_TOKEN || "").trim();
  const owner = (env.GITHUB_OWNER || "").trim();
  const repo = (env.GITHUB_REPO || "").trim();
  const workflow = (env.GITHUB_WORKFLOW || "deploy.yml").trim();
  const ref = (env.GITHUB_REF || "main").trim();
  if (!token || !owner || !repo || !workflow || !ref) {
    return { ok: false, error: "missing_github_config" };
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ ref }),
    }
  );
  if (!response.ok) {
    const message = (await response.text()).slice(0, 500);
    logError("github_dispatch_failed", {
      status: response.status,
      message,
      owner,
      repo,
      workflow,
      ref,
    });
    return {
      ok: false,
      error: "github_dispatch_failed",
      status: response.status,
      message,
    };
  }
  return { ok: true };
}

function parseAllowlist(value?: string) {
  const list = new Set<string>();
  if (!value) return list;
  value
    .split(",")
    .map((entry) => normalizeEmailAddress(entry))
    .filter(Boolean)
    .forEach((entry) => list.add(entry));
  return list;
}

function getAdminRole(env: Env, email: string) {
  if (!email) return "";
  if (parseAllowlist(env.ADMIN_ALLOWLIST).has(email)) return "admin";
  if (parseAllowlist(env.OPS_ALLOWLIST).has(email)) return "ops";
  if (parseAllowlist(env.VIEWER_ALLOWLIST).has(email)) return "viewer";
  return "";
}

function canEditOrders(role: string) {
  return role === "admin" || role === "ops";
}

function canEditQuotes(role: string) {
  return role === "admin" || role === "ops";
}

function canEditContacts(role: string) {
  return role === "admin";
}

function canEditTickets(role: string) {
  return role === "admin" || role === "ops";
}

function canEditPricing(role: string) {
  return role === "admin";
}

function canEditCatalog(role: string) {
  return role === "admin" || role === "ops";
}

function canEditSiteConfig(role: string) {
  return role === "admin";
}

function mapD1RowToRecord(row: Record<string, unknown>) {
  const record: Record<string, string> = {};
  Object.entries(row).forEach(([key, value]) => {
    record[key] = value === null || value === undefined ? "" : String(value);
  });
  return record;
}

  async function buildAdminList(
    env: Env,
    kind:
      | "order"
      | "quote"
      | "contact"
      | "ticket"
      | "product"
      | "inspiration"
      | "media_library"
      | "product_media"
    | "inspiration_media",
  params: URLSearchParams
  ) {
  if (!hasD1(env) && kind === "ticket") {
    return { items: [], total: 0, headers: TICKET_SHEET_HEADER };
  }
  if (hasD1(env)) {
    let rows: Record<string, unknown>[] = [];
    let headerFallback: string[] = [];
    if (kind === "order") {
      rows = await d1All(env, "SELECT * FROM orders");
      headerFallback = ORDER_SHEET_HEADER;
    } else if (kind === "quote") {
      rows = await d1All(env, "SELECT * FROM quotes");
      headerFallback = QUOTE_SHEET_HEADER;
      } else if (kind === "contact") {
        rows = await d1All(env, "SELECT * FROM contacts");
        headerFallback = CONTACT_SHEET_HEADER;
      } else if (kind === "ticket") {
        rows = await d1All(env, "SELECT * FROM tickets");
        headerFallback = TICKET_SHEET_HEADER;
      } else if (kind === "product") {
        rows = await d1All(env, "SELECT * FROM catalog_items WHERE type = 'product'");
        headerFallback = PRODUCTS_SHEET_HEADER;
      } else if (kind === "inspiration") {
      rows = await d1All(env, "SELECT * FROM catalog_items WHERE type = 'inspiration'");
      headerFallback = INSPIRATIONS_SHEET_HEADER;
    } else if (kind === "media_library") {
      rows = await d1All(env, "SELECT * FROM media_library");
      headerFallback = MEDIA_LIBRARY_SHEET_HEADER;
    } else if (kind === "product_media") {
      rows = await d1All(
        env,
        `SELECT
           catalog_media.id,
           catalog_items.slug AS catalog_slug,
           catalog_media.media_id,
           catalog_media.position,
           catalog_media.is_primary,
           catalog_media.sort_order,
           media_library.url,
           media_library.media_type,
           media_library.label,
           media_library.alt,
           media_library.description
         FROM catalog_media
         JOIN catalog_items ON catalog_items.id = catalog_media.catalog_id
         LEFT JOIN media_library ON media_library.media_id = catalog_media.media_id
         WHERE catalog_items.type = 'product'`
      );
      headerFallback = PRODUCT_MEDIA_SHEET_HEADER;
    } else if (kind === "inspiration_media") {
      rows = await d1All(
        env,
        `SELECT
           catalog_media.id,
           catalog_items.slug AS catalog_slug,
           catalog_media.media_id,
           catalog_media.position,
           catalog_media.is_primary,
           catalog_media.sort_order,
           media_library.url,
           media_library.media_type,
           media_library.label,
           media_library.alt,
           media_library.description
         FROM catalog_media
         JOIN catalog_items ON catalog_items.id = catalog_media.catalog_id
         LEFT JOIN media_library ON media_library.media_id = catalog_media.media_id
         WHERE catalog_items.type = 'inspiration'`
      );
      headerFallback = INSPIRATION_MEDIA_SHEET_HEADER;
    }

    const items = rows.map((row) => {
      const entry = mapD1RowToRecord(row);
      if (kind === "product") {
        entry.type = "product";
      }
      if (kind === "inspiration") {
        entry.type = "inspiration";
      }
      if (kind === "product_media") {
        entry.product_slug = entry.catalog_slug || entry.product_slug || "";
        entry.order = entry.sort_order || entry.order || "";
      }
      if (kind === "inspiration_media") {
        entry.inspiration_slug = entry.catalog_slug || entry.inspiration_slug || "";
        entry.order = entry.sort_order || entry.order || "";
      }
      entry.row_number =
        entry.request_id ||
        entry.email ||
        entry.slug ||
        entry.media_id ||
        entry.id ||
        "";
      return entry;
    });

    const filtered = applyAdminFilters(items, params, kind);
    const sorted = applyAdminSort(filtered, params);
    const offset = Math.max(Number(params.get("offset") || 0), 0);
    const limit = Math.min(Math.max(Number(params.get("limit") || 200), 1), 500);
    const paged = sorted.slice(offset, offset + limit);

    return { items: paged, total: sorted.length, headers: headerFallback };
  }

  if (!hasD1(env) && (kind === "order" || kind === "quote" || kind === "contact")) {
    const headerFallback =
      kind === "order"
        ? ORDER_SHEET_HEADER
        : kind === "quote"
        ? QUOTE_SHEET_HEADER
        : CONTACT_SHEET_HEADER;
    return { items: [], total: 0, headers: headerFallback, error: "d1_unavailable" };
  }

  const isCatalog =
    kind === "product" ||
    kind === "inspiration" ||
    kind === "media_library" ||
    kind === "product_media" ||
    kind === "inspiration_media";
  const config = isCatalog
    ? getCatalogSheetConfig(env, kind)
    : getSheetConfig(env, kind as "order" | "quote" | "contact");
  const headerFallback =
    kind === "order"
      ? ORDER_SHEET_HEADER
      : kind === "quote"
      ? QUOTE_SHEET_HEADER
      : kind === "contact"
      ? CONTACT_SHEET_HEADER
      : kind === "product"
      ? PRODUCTS_SHEET_HEADER
      : kind === "inspiration"
      ? INSPIRATIONS_SHEET_HEADER
      : kind === "media_library"
      ? MEDIA_LIBRARY_SHEET_HEADER
      : kind === "product_media"
      ? PRODUCT_MEDIA_SHEET_HEADER
      : INSPIRATION_MEDIA_SHEET_HEADER;
  const cacheKey = `sheet_header:${config.sheetId}:${config.sheetName}`;
  await ensureSheetHeader(env, config, headerFallback, cacheKey);
  const headerRows = await fetchSheetValues(env, config.sheetId, config.headerRange);
  const headerRow = headerRows[0] && headerRows[0].length ? headerRows[0] : [];
  const requiredKey =
    kind === "contact"
      ? "email"
      : kind === "product"
      ? "slug"
      : kind === "inspiration"
      ? "slug"
      : kind === "media_library"
      ? "media_id"
      : kind === "product_media"
      ? "product_slug"
      : kind === "inspiration_media"
      ? "inspiration_slug"
      : "request_id";
  const headerConfig = resolveHeaderConfig(headerRow, headerFallback, requiredKey);
  const rows = await fetchSheetValues(
    env,
    config.sheetId,
    `${config.sheetName}!A${headerConfig.rowStart}:AZ`
  );
  const items = rows.map((row, index) => {
    const entry: Record<string, string> = {
      row_number: String(index + headerConfig.rowStart),
    };
    headerConfig.header.forEach((key, idx) => {
      if (!key) return;
      entry[key] = String(row[idx] ?? "");
    });
    if (kind === "quote") {
      const normalizedStatus = normalizeQuoteStatus(entry.status || "");
      if (normalizedStatus) entry.status = normalizedStatus;
    }
    return entry;
  });

  const filtered = applyAdminFilters(items, params, kind);
  const sorted = applyAdminSort(filtered, params);
  const offset = Math.max(Number(params.get("offset") || 0), 0);
  const limit = Math.min(Math.max(Number(params.get("limit") || 200), 1), 500);
  const paged = sorted.slice(offset, offset + limit);

    return { items: paged, total: sorted.length, headers: headerConfig.header };
  }

  async function buildCatalogStoneOptionsList(env: Env, params: URLSearchParams) {
    if (!hasD1(env)) {
      return { items: [], total: 0, headers: CATALOG_STONE_OPTIONS_HEADER };
    }
    const catalogId = (params.get("catalog_id") || params.get("catalogId") || "").trim();
    let sql = "SELECT * FROM catalog_stone_options";
    const bindings: string[] = [];
    if (catalogId) {
      sql += " WHERE catalog_id = ? order by carat asc";
      bindings.push(catalogId);
    }
    const rows = await d1All(env, sql, bindings);
    const items = rows.map((row) => {
      const entry = mapD1RowToRecord(row);
      entry.row_number = entry.id || "";
      return entry;
    });
    return { items, total: items.length, headers: CATALOG_STONE_OPTIONS_HEADER };
  }

  async function buildCatalogNotesList(env: Env, params: URLSearchParams) {
    if (!hasD1(env)) {
      return { items: [], total: 0, headers: CATALOG_NOTES_HEADER };
    }
    const catalogId = (params.get("catalog_id") || params.get("catalogId") || "").trim();
    const catalogSlug = (params.get("catalog_slug") || params.get("catalogSlug") || "").trim();
    const kind = (params.get("kind") || "").trim();
    let sql = "SELECT * FROM catalog_notes";
    const clauses: string[] = [];
    const bindings: string[] = [];
    if (catalogId) {
      clauses.push("catalog_id = ?");
      bindings.push(catalogId);
    } else if (catalogSlug) {
      clauses.push("catalog_slug = ?");
      bindings.push(catalogSlug);
    }
    if (kind) {
      clauses.push("kind = ?");
      bindings.push(kind);
    }
    if (clauses.length) {
      sql += ` WHERE ${clauses.join(" AND ")}`;
    }
    sql += " ORDER BY sort_order, created_at";
    const rows = await d1All(env, sql, bindings);
    const items = rows.map((row) => {
      const entry = mapD1RowToRecord(row);
      entry.row_number = entry.id || "";
      return entry;
    });
    return { items, total: items.length, headers: CATALOG_NOTES_HEADER };
  }

  async function buildCatalogMetalOptionsList(env: Env, params: URLSearchParams) {
    if (!hasD1(env)) {
      return { items: [], total: 0, headers: CATALOG_METAL_OPTIONS_HEADER };
    }
    const catalogId = (params.get("catalog_id") || params.get("catalogId") || "").trim();
    let sql = "SELECT * FROM catalog_metal_options";
    const bindings: string[] = [];
    if (catalogId) {
      sql += " WHERE catalog_id = ?";
      bindings.push(catalogId);
    }
    const rows = await d1All(env, sql, bindings);
    const items = rows.map((row) => {
      const entry = mapD1RowToRecord(row);
      entry.row_number = entry.id || "";
      return entry;
    });
    return { items, total: items.length, headers: CATALOG_METAL_OPTIONS_HEADER };
  }

  async function buildSiteConfigList(env: Env, params: URLSearchParams) {
    if (!hasD1(env)) {
      return { items: [], total: 0, headers: ["key", "value", "updated_at"] };
    }
  const rows = await d1All(env, "SELECT key, value, updated_at FROM site_config");
  const items = rows.map((row) => {
    const entry = mapD1RowToRecord(row);
    entry.row_number = entry.key || "";
    return entry;
  });

  const q = (params.get("q") || "").trim().toLowerCase();
  const filtered = q
    ? items.filter(
        (item) =>
          String(item.key || "").toLowerCase().includes(q) ||
          String(item.value || "").toLowerCase().includes(q)
      )
    : items;
  const sorted = applyAdminSort(filtered, params);
  const offset = Math.max(Number(params.get("offset") || 0), 0);
  const limit = Math.min(Math.max(Number(params.get("limit") || 200), 1), 500);
  const paged = sorted.slice(offset, offset + limit);

  return { items: paged, total: sorted.length, headers: ["key", "value", "updated_at"] };
}

async function buildPricingList(
  env: Env,
  kind: "price_chart" | "cost_chart" | "diamond_price_chart",
  params: URLSearchParams
) {
  if (hasD1(env)) {
    let rows: Record<string, unknown>[] = [];
    let headerFallback: string[] = [];
    if (kind === "price_chart") {
      rows = await d1All(env, "SELECT id, metal, adjustment_type, adjustment_value, notes FROM price_chart");
      headerFallback = PRICE_CHART_HEADER;
    } else if (kind === "cost_chart") {
      rows = await d1All(env, "SELECT id, key, value, unit, notes FROM cost_chart");
      headerFallback = COST_CHART_HEADER;
    } else {
      rows = await d1All(
        env,
        "SELECT id, clarity, color, weight_min, weight_max, price_per_ct, notes FROM diamond_price_chart"
      );
      headerFallback = DIAMOND_PRICE_CHART_HEADER;
    }

    const items = rows.map((row) => {
      const entry = mapD1RowToRecord(row);
      entry.row_number = entry.id || "";
      return entry;
    });

    const filtered = applyPricingFilters(items, params);
    const sorted = applyAdminSort(filtered, params);
    const offset = Math.max(Number(params.get("offset") || 0), 0);
    const limit = Math.min(Math.max(Number(params.get("limit") || 200), 1), 500);
    const paged = sorted.slice(offset, offset + limit);

    return { items: paged, total: sorted.length, headers: headerFallback };
  }
  // Require D1 for pricing data; do not fall back to Sheets.
  const headerFallback =
    kind === "price_chart"
      ? PRICE_CHART_HEADER
      : kind === "cost_chart"
      ? COST_CHART_HEADER
      : DIAMOND_PRICE_CHART_HEADER;
  return { items: [], total: 0, headers: headerFallback, error: "d1_unavailable" };
}

async function buildUnifiedContactsList(env: Env, params: URLSearchParams) {
  if (hasD1(env)) {
    const rows = await d1All(env, "SELECT * FROM unified_contacts");
    const items = rows.map((row) => {
      const entry = mapD1RowToRecord(row);
      entry.row_number = entry.email || "";
      return entry;
    });

    const filtered = applyUnifiedContactsFilters(items, params);
    const sorted = applyAdminSort(filtered, params);
    const offset = Math.max(Number(params.get("offset") || 0), 0);
    const limit = Math.min(Math.max(Number(params.get("limit") || 200), 1), 500);
    const paged = sorted.slice(offset, offset + limit);

  return { items: paged, total: sorted.length, headers: UNIFIED_CONTACTS_SHEET_HEADER };
}

async function buildTicketDetails(env: Env, params: URLSearchParams) {
  if (!hasD1(env)) return { details: [] as Record<string, string>[] };
  const requestId = (params.get("request_id") || params.get("ticket_id") || "").trim();
  if (!requestId) return { details: [] as Record<string, string>[] };
  const rows = await d1All(
    env,
    "SELECT id, request_id, created_at, kind, note, updated_by FROM ticket_details WHERE request_id = ? ORDER BY created_at DESC",
    [requestId]
  );
  const details = rows.map((row) => mapD1RowToRecord(row));
  return { details };
}
  const config = getUnifiedContactsSheetConfig(env);
  if (!config) {
    return { items: [], total: 0 };
  }
  const cacheKey = `sheet_header:${config.sheetId}:${config.sheetName}`;
  await ensureSheetHeader(env, config, UNIFIED_CONTACTS_SHEET_HEADER, cacheKey);
  const headerRows = await fetchSheetValues(env, config.sheetId, config.headerRange);
  const headerRow = headerRows[0] && headerRows[0].length ? headerRows[0] : [];
  const headerConfig = resolveHeaderConfig(headerRow, UNIFIED_CONTACTS_SHEET_HEADER, "email");
  const rows = await fetchSheetValues(
    env,
    config.sheetId,
    `${config.sheetName}!A${headerConfig.rowStart}:AZ`
  );
  const items = rows.map((row, index) => {
    const entry: Record<string, string> = {
      row_number: String(index + headerConfig.rowStart),
    };
    headerConfig.header.forEach((key, idx) => {
      if (!key) return;
      entry[key] = String(row[idx] ?? "");
    });
    return entry;
  });

  const filtered = applyUnifiedContactsFilters(items, params);
  const sorted = applyAdminSort(filtered, params);
  const offset = Math.max(Number(params.get("offset") || 0), 0);
  const limit = Math.min(Math.max(Number(params.get("limit") || 200), 1), 500);
  const paged = sorted.slice(offset, offset + limit);

  return { items: paged, total: sorted.length };
}

function applyAdminFilters(
  items: Array<Record<string, string>>,
  params: URLSearchParams,
    kind?:
      | "order"
      | "quote"
      | "contact"
      | "ticket"
      | "product"
      | "inspiration"
      | "media_library"
    | "product_media"
    | "inspiration_media"
) {
  const status = (params.get("status") || "").trim().toUpperCase();
  const q = (params.get("q") || "").trim().toLowerCase();
  const email = (params.get("email") || "").trim().toLowerCase();
  const requestId = (params.get("request_id") || "").trim().toLowerCase();
  const slug = (params.get("slug") || "").trim().toLowerCase();
  const id = (params.get("id") || "").trim().toLowerCase();
  const mediaId = (params.get("media_id") || "").trim().toLowerCase();
  const productSlug = (params.get("product_slug") || "").trim().toLowerCase();
  const inspirationSlug = (params.get("inspiration_slug") || "").trim().toLowerCase();

  return items.filter((item) => {
    if (status) {
      const value = String(item.status || "").trim().toUpperCase();
      if (value !== status) return false;
    }
    if (email) {
      if (!String(item.email || "").toLowerCase().includes(email)) return false;
    }
    if (requestId) {
      if (!String(item.request_id || "").toLowerCase().includes(requestId)) return false;
    }
    if (slug || id) {
      const slugMatch = slug
        ? String(item.slug || "").toLowerCase().includes(slug)
        : false;
      const idMatch = id
        ? String(item.id || "").toLowerCase().includes(id)
        : false;
      if (slug && id) {
        if (!slugMatch && !idMatch) return false;
      } else if (slug && !slugMatch) {
        return false;
      } else if (id && !idMatch) {
        return false;
      }
    }
    if (mediaId) {
      if (!String(item.media_id || "").toLowerCase().includes(mediaId)) return false;
    }
    if (productSlug) {
      if (!String(item.product_slug || "").toLowerCase().includes(productSlug)) return false;
    }
    if (inspirationSlug) {
      if (!String(item.inspiration_slug || "").toLowerCase().includes(inspirationSlug)) return false;
    }
    if (q) {
      const isCatalog =
        kind === "product" ||
        kind === "inspiration" ||
        kind === "media_library" ||
        kind === "product_media" ||
        kind === "inspiration_media";
        const haystack = [
          item.request_id,
          item.name,
          item.email,
          item.subject,
          item.summary,
          item.product_name,
          item.design_code,
          item.slug,
          item.id,
        item.media_id,
        item.product_slug,
        item.inspiration_slug,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q) && isCatalog) {
        const fallback = Object.values(item)
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!fallback.includes(q)) return false;
      }
      if (!haystack.includes(q) && !isCatalog) return false;
    }
    return true;
  });
}

function applyPricingFilters(items: Array<Record<string, string>>, params: URLSearchParams) {
  const q = (params.get("q") || "").trim().toLowerCase();
  const rowNumber = (params.get("row_number") || params.get("row") || "").trim();
  return items.filter((item) => {
    if (rowNumber && String(item.row_number || "").trim() !== rowNumber) return false;
    if (q) {
      const haystack = Object.values(item)
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

function normalizeBooleanFilter(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "1"].includes(normalized)) return "true";
  if (["false", "no", "0"].includes(normalized)) return "false";
  return "";
}

function normalizeHeaderRow(row: string[]) {
  return row.map((cell) => String(cell || "").trim().toLowerCase());
}

function headerHasKey(row: string[], key: string) {
  const normalized = normalizeHeaderRow(row);
  return normalized.includes(key.toLowerCase());
}

function resolveHeaderConfig<T extends string>(
  headerRow: string[],
  fallback: T[],
  requiredKey: string
) {
  const hasHeader = headerRow.length > 0 && headerHasKey(headerRow, requiredKey);
  return {
    header: hasHeader ? headerRow : fallback,
    rowStart: hasHeader ? 2 : 1,
    hasHeader,
  };
}

function applyUnifiedContactsFilters(items: Array<Record<string, string>>, params: URLSearchParams) {
  const q = (params.get("q") || "").trim().toLowerCase();
  const email = (params.get("email") || "").trim().toLowerCase();
  const type = (params.get("type") || "").trim().toLowerCase();
  const subscribed = normalizeBooleanFilter(params.get("subscribed") || "");

  return items.filter((item) => {
    if (email) {
      if (!String(item.email || "").toLowerCase().includes(email)) return false;
    }
    if (type) {
      if (!String(item.type || "").toLowerCase().includes(type)) return false;
    }
    if (subscribed) {
      const itemValue = normalizeBooleanFilter(String(item.subscribed || ""));
      if (itemValue !== subscribed) return false;
    }
    if (q) {
      const haystack = [
        item.name,
        item.email,
        item.phone,
        item.type,
        item.sources,
        item.last_source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

function applyAdminSort(items: Array<Record<string, string>>, params: URLSearchParams) {
  const sortKey = (params.get("sort") || "created_at").trim();
  const dir = (params.get("dir") || "desc").toLowerCase() === "asc" ? 1 : -1;
  return items.slice().sort((a, b) => {
    const left = a[sortKey] || "";
    const right = b[sortKey] || "";
    return left.localeCompare(right, undefined, { numeric: true }) * dir;
  });
}

type PriceAdjustment = { type: "percent" | "flat"; value: number; mode?: "delta" | "multiplier" };

function normalizeAdjustmentType(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("flat") || normalized.includes("fixed") || normalized.includes("amount")) {
    return "flat";
  }
  return "percent";
}

function parseAdjustmentValue(rawValue: string, adjustmentType: "percent" | "flat") {
  if (!rawValue) return 0;
  const cleaned = rawValue.replace(/[^0-9.+-]/g, "");
  const numeric = Number(cleaned);
  if (Number.isNaN(numeric)) return 0;
  if (adjustmentType === "percent") {
    if (Math.abs(numeric) > 1) return numeric / 100;
  }
  return numeric;
}

function getMetalColorSuffix(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("white")) return "White Gold";
  if (normalized.includes("yellow")) return "Yellow Gold";
  if (normalized.includes("rose")) return "Rose Gold";
  return "";
}

function normalizeMetalOption(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const normalized = trimmed.toLowerCase();
  if (normalized.includes("plat")) return "Platinum";
  const color = getMetalColorSuffix(trimmed);
  if (normalized.startsWith("14")) return color ? `14K ${color}` : "14K";
  if (normalized.startsWith("18")) return color ? `18K ${color}` : "18K";
  if (normalized.startsWith("24")) return "24K";
  if (normalized.startsWith("22")) return "22K";
  if (normalized.startsWith("21")) return "21K";
  if (normalized.startsWith("20")) return "20K";
  if (normalized.startsWith("16")) return "16K";
  if (normalized.startsWith("10")) return "10K";
  return trimmed;
}

function parseMetalOptions(value: string) {
  const metals = value
    .split(",")
    .map((entry) => normalizeMetalOption(entry))
    .filter(Boolean);
  const unique = Array.from(new Set(metals));
  if (!unique.length) return ["18K"];
  return unique;
}

function resolveQuoteMetalOptions(value: string, requestedMetal: string) {
  const metals = parseMetalOptions(value);
  const normalizedRequested = normalizeMetalOption(requestedMetal || "");
  if (
    normalizedRequested.startsWith("18K") ||
    normalizedRequested.startsWith("14K") ||
    normalizedRequested === "Platinum"
  ) {
    return [normalizedRequested || "18K"];
  }
  return metals;
}

function parsePriceValue(value: string) {
  if (!value) return NaN;
  const cleaned = value.replace(/[^0-9.]/g, "");
  const numeric = Number(cleaned);
  return Number.isNaN(numeric) ? NaN : numeric;
}

function parseNumberValue(value: string) {
  if (!value) return NaN;
  if (value.includes("|")) {
    const parts = value
      .split("|")
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (parts.length) {
      return parseNumberValue(parts[0]);
    }
  }
  const rangeMatch = value.match(/^\s*([0-9]*\.?[0-9]+)\s*-\s*([0-9]*\.?[0-9]+)\b/);
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      return (min + max) / 2;
    }
  }
  const cleaned = value.replace(/[^0-9.+-]/g, "");
  const numeric = Number(cleaned);
  return Number.isNaN(numeric) ? NaN : numeric;
}

function parseSizeInches(value: string) {
  if (!value) return NaN;
  const cleaned = value.replace(/,/g, " ");
  const match = cleaned.match(/([0-9]*\.?[0-9]+)/);
  if (!match) return NaN;
  const numeric = Number(match[1]);
  return Number.isFinite(numeric) ? numeric : NaN;
}

function parsePercentValue(value: string) {
  if (!value) return 0;
  const numeric = parseNumberValue(value);
  if (!Number.isFinite(numeric)) return 0;
  if (value.includes("%") || Math.abs(numeric) > 1) {
    return numeric / 100;
  }
  return numeric;
}

function applyPriceAdjustment(base: number, adjustment?: PriceAdjustment) {
  if (!adjustment || !adjustment.value) return base;
  if (adjustment.type === "flat") return base + adjustment.value;
  if (adjustment.mode === "multiplier") return base * adjustment.value;
  return base * (1 + adjustment.value);
}

function adjustmentToMultiplier(adjustment?: PriceAdjustment) {
  if (!adjustment || adjustment.type !== "percent") return null;
  if (adjustment.mode === "multiplier") return adjustment.value;
  return 1 + adjustment.value;
}

function resolveMetalPricingKey(metal: string, requestedMetal: string) {
  const normalized = normalizeMetalOption(metal);
  if (!normalized) return "";
  if (normalized === "Platinum") return normalized;
  const color = getMetalColorSuffix(requestedMetal || "");
  if (color && (normalized === "14K" || normalized === "18K")) {
    return `${normalized} ${color}`;
  }
  return normalized;
}

function metalPriceKeysFor(metal: string): string[] {
  const normalized = normalizeMetalOption(metal);
  if (normalized.startsWith("24K")) return ["price_gram_24k", "gold_price_per_gram_usd"];
  if (normalized.startsWith("22K")) return ["price_gram_22k", "price_gram_24k", "gold_price_per_gram_usd"];
  if (normalized.startsWith("21K")) return ["price_gram_21k", "price_gram_24k", "gold_price_per_gram_usd"];
  if (normalized.startsWith("20K")) return ["price_gram_20k", "price_gram_24k", "gold_price_per_gram_usd"];
  if (normalized.startsWith("18K")) {
    return [
      "price_gram_18k",
      "metal_cost_18k_per_gram",
      "metal_cost_per_gram_18k",
      "gold_price_per_gram_usd",
    ];
  }
  if (normalized.startsWith("16K")) return ["price_gram_16k", "price_gram_18k", "gold_price_per_gram_usd"];
  if (normalized.startsWith("14K")) {
    return [
      "price_gram_14k",
      "price_gram_18k",
      "metal_cost_14k_per_gram",
      "gold_price_per_gram_usd",
    ];
  }
  if (normalized.startsWith("10K")) return ["price_gram_10k", "price_gram_14k", "gold_price_per_gram_usd"];
  return ["gold_price_per_gram_usd", "price_gram_24k"];
}

function findAdjustmentMultiplier(adjustments: Record<string, PriceAdjustment>, keys: string[]) {
  for (const key of keys) {
    if (!key) continue;
    const multiplier = adjustmentToMultiplier(adjustments[key]);
    if (multiplier && multiplier > 0) return multiplier;
  }
  return null;
}

async function loadPriceChartAdjustments(env: Env): Promise<Record<string, PriceAdjustment>> {
  // Price chart adjustments are deprecated; rely solely on cost chart per-gram values.
  return {};
}

type CostChartValues = Record<string, string>;
type DiamondPriceEntry = {
  clarity: string;
  color: string;
  weightMin: number;
  weightMax: number;
  pricePerCt: number;
};
type DiamondClarityGroups = {
  detailToComposite: Map<string, string>;
  compositeToDetails: Map<string, string[]>;
};

async function fetchPublicSheetRecords(config: SheetConfig, expectedHeaders: string[]) {
  const candidateNames = [
    config.sheetName,
    config.sheetName.replace(/_/g, " "),
  ].filter((value, index, list) => value && list.indexOf(value) === index);
  for (const name of candidateNames) {
    const url = buildSheetsCsvUrlByName(config.sheetId, name);
    const response = await fetch(url);
    const csv = await response.text();
    if (!response.ok) {
      logError("public_sheet_fetch_failed", {
        sheet: name,
        status: response.status,
        snippet: csv.slice(0, 120),
      });
      continue;
    }
    const parsed = parseCsvRecordsLoose(csv);
    if (expectedHeaders.every((header) => parsed.headers.includes(header))) {
      return parsed.records;
    }
    const fallback = parseDelimitedRecords(csv);
    if (expectedHeaders.every((header) => fallback.headers.includes(header))) {
      return fallback.records;
    }
    const merged = parseMergedHeaderRecords(csv, expectedHeaders);
    if (merged && expectedHeaders.every((header) => merged.headers.includes(header))) {
      return merged.records;
    }
    logError("public_sheet_headers_missing", {
      sheet: name,
      headers: parsed.headers,
    });
  }
  throw new Error("public_sheet_missing_headers");
}

function normalizeCostKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeDiamondToken(value: string) {
  return value.trim().toUpperCase();
}

function isDiamondWildcard(value: string) {
  const normalized = normalizeDiamondToken(value);
  return !normalized || normalized === "ANY" || normalized === "ALL";
}

async function loadCostChartValues(env: Env): Promise<CostChartValues> {
  if (hasD1(env)) {
    const rows = await d1All(env, "SELECT key, value FROM cost_chart");
    const values: CostChartValues = {};
    rows.forEach((row) => {
      const key = normalizeCostKey(String(row.key || ""));
      if (!key) return;
      values[key] = String(row.value ?? "");
    });
    return values;
  }
  const config = getCostChartSheetConfig(env);
  if (!config) return {};
  try {
    const cacheKey = `sheet_header:${config.sheetId}:${config.sheetName}`;
    await ensureSheetHeader(env, config, COST_CHART_HEADER, cacheKey);
    const headerRows = await fetchSheetValues(env, config.sheetId, config.headerRange);
    const headerRow = headerRows[0] && headerRows[0].length ? headerRows[0] : [];
    const headerConfig = resolveHeaderConfig(headerRow, COST_CHART_HEADER, "key");
    const rows = await fetchSheetValues(
      env,
      config.sheetId,
      `${config.sheetName}!A${headerConfig.rowStart}:AZ`
    );
    const values: CostChartValues = {};
    rows.forEach((row) => {
      const record = mapSheetRowToRecord(headerConfig.header, row);
      const key = normalizeCostKey(record.key || "");
      if (!key) return;
      values[key] = record.value || "";
    });
    return values;
  } catch {
    try {
      const records = await fetchPublicSheetRecords(config, ["key", "value"]);
      const values: CostChartValues = {};
      records.forEach((record) => {
        const key = normalizeCostKey(record.key || "");
        if (!key) return;
        values[key] = record.value || "";
      });
      return values;
    } catch {
      return {};
    }
  }
}

async function loadDiamondPriceChart(env: Env): Promise<DiamondPriceEntry[]> {
  if (hasD1(env)) {
    const rows = await d1All(
      env,
      "SELECT clarity, color, weight_min, weight_max, price_per_ct FROM diamond_price_chart"
    );
    const entries: DiamondPriceEntry[] = [];
    rows.forEach((row) => {
      const pricePerCt = parseNumberValue(String(row.price_per_ct ?? ""));
      if (!Number.isFinite(pricePerCt) || pricePerCt <= 0) return;
      const weightMin = parseNumberValue(String(row.weight_min ?? ""));
      const weightMaxRaw = parseNumberValue(String(row.weight_max ?? ""));
      if (!Number.isFinite(weightMin) || weightMin < 0) return;
      const weightMax = Number.isFinite(weightMaxRaw) && weightMaxRaw > 0 ? weightMaxRaw : Infinity;
      entries.push({
        clarity: normalizeDiamondToken(String(row.clarity || "")),
        color: normalizeDiamondToken(String(row.color || "")),
        weightMin,
        weightMax,
        pricePerCt,
      });
    });
    return entries;
  }
  const config = getDiamondPriceChartSheetConfig(env);
  if (!config) return [];
  try {
    const cacheKey = `sheet_header:${config.sheetId}:${config.sheetName}`;
    await ensureSheetHeader(env, config, DIAMOND_PRICE_CHART_HEADER, cacheKey);
    const headerRows = await fetchSheetValues(env, config.sheetId, config.headerRange);
    const headerRow = headerRows[0] && headerRows[0].length ? headerRows[0] : [];
    const headerConfig = resolveHeaderConfig(headerRow, DIAMOND_PRICE_CHART_HEADER, "price_per_ct");
    const rows = await fetchSheetValues(
      env,
      config.sheetId,
      `${config.sheetName}!A${headerConfig.rowStart}:AZ`
    );
    const entries: DiamondPriceEntry[] = [];
    rows.forEach((row) => {
      const record = mapSheetRowToRecord(headerConfig.header, row);
      const pricePerCt = parseNumberValue(record.price_per_ct || "");
      if (!Number.isFinite(pricePerCt) || pricePerCt <= 0) return;
      const weightMin = parseNumberValue(record.weight_min || "");
      const weightMaxRaw = parseNumberValue(record.weight_max || "");
      if (!Number.isFinite(weightMin) || weightMin < 0) return;
      const weightMax = Number.isFinite(weightMaxRaw) && weightMaxRaw > 0 ? weightMaxRaw : Infinity;
      entries.push({
        clarity: normalizeDiamondToken(record.clarity || ""),
        color: normalizeDiamondToken(record.color || ""),
        weightMin,
        weightMax,
        pricePerCt,
      });
    });
    return entries;
  } catch {
    try {
      const records = await fetchPublicSheetRecords(config, [
        "clarity",
        "color",
        "weight_min",
        "weight_max",
        "price_per_ct",
      ]);
      const entries: DiamondPriceEntry[] = [];
      records.forEach((record) => {
        const pricePerCt = parseNumberValue(record.price_per_ct || "");
        if (!Number.isFinite(pricePerCt) || pricePerCt <= 0) return;
        const weightMin = parseNumberValue(record.weight_min || "");
        const weightMaxRaw = parseNumberValue(record.weight_max || "");
        if (!Number.isFinite(weightMin) || weightMin < 0) return;
        const weightMax = Number.isFinite(weightMaxRaw) && weightMaxRaw > 0 ? weightMaxRaw : Infinity;
        entries.push({
          clarity: normalizeDiamondToken(record.clarity || ""),
          color: normalizeDiamondToken(record.color || ""),
          weightMin,
          weightMax,
          pricePerCt,
        });
      });
      return entries;
    } catch {
      return [];
    }
  }
}

function getCostNumber(values: CostChartValues, keys: string[], fallback = 0) {
  for (const key of keys) {
    const normalized = normalizeCostKey(key);
    if (values[normalized] !== undefined) {
      const numeric = parseNumberValue(values[normalized]);
      if (Number.isFinite(numeric)) return numeric;
    }
  }
  return fallback;
}

function getCostPercent(values: CostChartValues, keys: string[], fallback = 0) {
  for (const key of keys) {
    const normalized = normalizeCostKey(key);
    if (values[normalized] !== undefined) {
      return parsePercentValue(values[normalized]);
    }
  }
  return fallback;
}

type DiscountDetails = {
  label: string;
  rawPercent: number;
  appliedPercent: number;
  summary: string;
  source: string;
};

function normalizeDiscountType(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  if (normalized.includes("friend")) return "friends";
  if (normalized.includes("welcome")) return "welcome";
  if (normalized.includes("offer")) return "offer";
  if (normalized.includes("custom")) return "custom";
  if (normalized.includes("none")) return "none";
  return normalized;
}

function resolveDiscountDetails(costValues: CostChartValues, record?: Record<string, string>): DiscountDetails {
  const maxDiscountPercent = getCostPercent(costValues, [
    "max_discount_pct",
    "max_discount_percent",
    "max_discount",
  ]);
  const type = normalizeDiscountType(getString(record?.quote_discount_type || ""));
  const overridePercent = parsePercentValue(getString(record?.quote_discount_percent || ""));
  const presets = {
    friends: {
      label: "Friends & family",
      value: getCostPercent(costValues, [
        "friends_and_family_discount_pct",
        "friends_and_familty_discount_pct",
      ]),
    },
    welcome: { label: "Welcome", value: getCostPercent(costValues, ["welcome_discount_pct"]) },
    offer: { label: "Offer code", value: getCostPercent(costValues, ["offer_code_discount_pct"]) },
  };

  let rawPercent = 0;
  let label = "";
  let source = "auto";

  if (type === "none") {
    rawPercent = 0;
    label = "";
    source = "none";
  } else if (type === "custom" && overridePercent > 0) {
    rawPercent = overridePercent;
    label = "Custom";
    source = "custom";
  } else if (type && presets[type as keyof typeof presets]) {
    rawPercent = presets[type as keyof typeof presets].value;
    label = presets[type as keyof typeof presets].label;
    source = type;
  } else if (overridePercent > 0) {
    rawPercent = overridePercent;
    label = "Custom";
    source = "custom";
  } else {
    const candidates = Object.values(presets).filter((entry) => entry.value > 0);
    if (candidates.length) {
      rawPercent = Math.max(...candidates.map((entry) => entry.value));
      label = candidates
        .filter((entry) => entry.value === rawPercent)
        .map((entry) => entry.label)
        .join(" / ");
      source = "auto";
    }
  }

  const appliedPercent =
    maxDiscountPercent > 0 ? Math.min(rawPercent, maxDiscountPercent) : rawPercent;
  const percentDisplay = Math.round(appliedPercent * 100);
  let summary = appliedPercent > 0 ? `${label} (${percentDisplay}% off)` : "No discount applied";
  if (appliedPercent > 0 && maxDiscountPercent > 0 && appliedPercent < rawPercent) {
    summary = `${summary} - max discount applied`;
  }

  return { label, rawPercent, appliedPercent, summary, source };
}

type DiamondPiece = { weight: number; count: number; stoneType?: "lab" | "natural" };
type DiamondBreakdownComponent = { stoneType?: "lab" | "natural"; breakdown: string };
type DiamondBreakdownParseOptions = {
  defaultType?: string;
  allowInlineType?: boolean;
};

function normalizeStoneTypeToken(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("lab")) return "lab";
  if (normalized.includes("natural")) return "natural";
  return "";
}

function parseDiamondBreakdownLine(payload: string) {
  const match = payload.match(
    /([0-9]*\.?[0-9]+)\s*(?:ct)?\s*(?:x|\u00d7|\*)\s*([0-9]*\.?[0-9]+)/i
  );
  if (match) {
    const weight = Number(match[1]);
    const count = Number(match[2]);
    return { weight, count };
  }
  const numbers = payload.match(/[0-9]*\.?[0-9]+/g) || [];
  if (numbers.length >= 2) {
    const first = Number(numbers[0]);
    const second = Number(numbers[1]);
    const weight = first <= second ? first : second;
    const count = first <= second ? second : first;
    return { weight, count };
  }
  if (numbers.length === 1) {
    const weight = Number(numbers[0]);
    return { weight, count: 1 };
  }
  return { weight: 0, count: 0 };
}

function parseDiamondBreakdownUnified(
  input: string,
  options: DiamondBreakdownParseOptions = {}
): DiamondPiece[] {
  if (!input) return [];
  const fallbackType = normalizeStoneTypeToken(options.defaultType || "");
  const allowInlineType = options.allowInlineType !== false;
  return input
    .split(/\n|;|,|\|/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      let payload = line;
      let stoneType = fallbackType;
      if (allowInlineType) {
        const typeMatch = line.match(
          /^(lab(?:\s+grown)?|natural)(?:\s+diamond)?\s*[:=-]\s*(.+)$/i
        );
        if (typeMatch) {
          stoneType = normalizeStoneTypeToken(typeMatch[1]) || fallbackType;
          payload = typeMatch[2];
        }
      }
      const parsed = parseDiamondBreakdownLine(payload);
      return { ...parsed, stoneType: stoneType || undefined };
    })
    .filter(
      (entry) =>
        Number.isFinite(entry.weight) &&
        entry.weight > 0 &&
        Number.isFinite(entry.count) &&
        entry.count > 0
    );
}

function parseDiamondBreakdown(input: string): DiamondPiece[] {
  return parseDiamondBreakdownUnified(input, { allowInlineType: false });
}

function parseDiamondBreakdownWithType(input: string, defaultType: string): DiamondPiece[] {
  return parseDiamondBreakdownUnified(input, {
    defaultType,
    allowInlineType: true,
  });
}

function parseDiamondBreakdownComponentsPayload(value: unknown): DiamondBreakdownComponent[] {
  if (!value) return [];
  let raw = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const stoneType = normalizeStoneTypeToken(
        getString(record.stone_type || record.stoneType || record.type)
      );
      const breakdown = getString(
        record.diamond_breakdown || record.diamondBreakdown || record.breakdown
      );
      if (!breakdown) return null;
      return { stoneType: stoneType || undefined, breakdown };
    })
    .filter(Boolean) as DiamondBreakdownComponent[];
}

function resolveDiamondPieces(
  record: Record<string, string>,
  components?: DiamondBreakdownComponent[]
) {
  const stoneLabel = String(record.stone || "").toLowerCase();
  let defaultType = normalizeStoneTypeToken(stoneLabel);
  if (!defaultType && stoneLabel.includes("diamond")) {
    defaultType = "natural";
  }
  let pieces: DiamondPiece[] = [];
  if (components && components.length) {
    for (const component of components) {
      const componentType = normalizeStoneTypeToken(component.stoneType || "") || defaultType;
      pieces = pieces.concat(parseDiamondBreakdownWithType(component.breakdown, componentType));
    }
  }
  if (!pieces.length) {
    pieces = parseDiamondBreakdownWithType(record.diamond_breakdown || "", defaultType);
  }
  if (!pieces.length && record.stone_weight) {
    pieces = parseDiamondBreakdownWithType(record.stone_weight || "", defaultType);
  }
  return { pieces, defaultType };
}

function findDiamondPricePerCt(
  entries: DiamondPriceEntry[],
  clarity: string,
  color: string,
  weight: number,
  groups?: DiamondClarityGroups | null
) {
  const result = findDiamondPricePerCtWithPriority(
    entries,
    clarity,
    color,
    weight,
    groups
  );
  return result.pricePerCt;
}

const FALLBACK_DIAMOND_CLARITY_GROUP_ROWS = [
  { group_key: "IF", clarity: "IF-VVS" },
  { group_key: "VVS1", clarity: "IF-VVS" },
  { group_key: "VVS2", clarity: "IF-VVS" },
  { group_key: "VS1", clarity: "VS" },
  { group_key: "VS2", clarity: "VS" },
];
const SMALL_DIAMOND_WEIGHT_THRESHOLD = 0.3;
const DIAMOND_CLARITY_ORDER = [
  "FL",
  "IF",
  "VVS1",
  "VVS2",
  "VVS",
  "VS1",
  "VS2",
  "VS",
  "SI1",
  "SI2",
  "SI3",
  "SI",
  "I1",
  "I2",
  "I3",
  "I",
];

function buildDiamondClarityGroups(
  rows: Array<Record<string, string | number | null>> = []
): DiamondClarityGroups {
  const detailToComposite = new Map<string, string>();
  const compositeToDetails = new Map<string, string[]>();
  const source = rows.length ? rows : FALLBACK_DIAMOND_CLARITY_GROUP_ROWS;
  source.forEach((row) => {
    const record = row as Record<string, unknown>;
    const detail = normalizeDiamondToken(String(record.group_key || ""));
    const composite = normalizeDiamondToken(String(record.clarity || ""));
    if (!detail || !composite) return;
    detailToComposite.set(detail, composite);
    const list = compositeToDetails.get(composite) || [];
    if (!list.includes(detail)) list.push(detail);
    compositeToDetails.set(composite, list);
  });
  return { detailToComposite, compositeToDetails };
}

async function loadDiamondClarityGroups(env: Env): Promise<DiamondClarityGroups> {
  if (hasD1(env)) {
    const rows = await d1All(env, "SELECT group_key, clarity FROM diamond_clarity_groups");
    return buildDiamondClarityGroups(rows);
  }
  return buildDiamondClarityGroups([]);
}

function parseDiamondTokens(value: string) {
  if (!value) return [];
  const normalized = normalizeDiamondToken(value);
  if (!normalized) return [];
  const rangeMatch = normalized.match(/^([A-Z])\s*-\s*([A-Z])$/);
  if (rangeMatch) {
    const start = rangeMatch[1].charCodeAt(0);
    const end = rangeMatch[2].charCodeAt(0);
    const tokens: string[] = [];
    const step = start <= end ? 1 : -1;
    for (let code = start; step > 0 ? code <= end : code >= end; code += step) {
      tokens.push(String.fromCharCode(code));
    }
    return tokens;
  }
  return normalized.split(/[^A-Z0-9]+/).filter(Boolean);
}

function resolveDiamondClarityMatchPlan(
  value: string,
  weight: number,
  groups?: DiamondClarityGroups | null
) {
  const normalized = normalizeDiamondToken(value || "");
  if (!normalized) return { primary: [], secondary: [] };
  // Handle generic group labels (e.g., "VVS", "VS") by expanding to specific grades
  if (normalized === "VVS") {
    return { primary: ["VVS1", "VVS2"], secondary: ["IF-VVS"] };
  }
  if (normalized === "VS") {
    return { primary: ["VS1", "VS2"], secondary: [] };
  }
  if (normalized === "SI") {
    return { primary: ["SI1", "SI2", "SI3"], secondary: [] };
  }
  if (normalized === "I") {
    return { primary: ["I1", "I2", "I3"], secondary: [] };
  }
  const useComposite =
    Number.isFinite(weight) && weight > 0 && weight < SMALL_DIAMOND_WEIGHT_THRESHOLD;
  const compositeToDetails = groups?.compositeToDetails;
  const detailToComposite = groups?.detailToComposite;
  if (!useComposite) {
    return { primary: [normalized], secondary: [] };
  }
  if (compositeToDetails?.has(normalized)) {
    return { primary: [normalized], secondary: compositeToDetails.get(normalized) || [] };
  }
  const composite = detailToComposite?.get(normalized);
  if (composite) return { primary: [normalized], secondary: [composite] };
  return { primary: [normalized], secondary: [] };
}

function resolveDiamondClarityTokens(
  value: string,
  weight: number,
  groups?: DiamondClarityGroups | null
) {
  const plan = resolveDiamondClarityMatchPlan(value, weight, groups);
  if (plan.primary.length) return plan.primary;
  if (plan.secondary.length) return plan.secondary;
  return parseDiamondTokens(normalizeDiamondToken(value || ""));
}

function matchesDiamondToken(entryValue: string, tokens: string[], allowRange: boolean) {
  if (isDiamondWildcard(entryValue) || !tokens.length) return true;
  if (!allowRange) return tokens.includes(entryValue);
  const entryTokens = parseDiamondTokens(entryValue);
  if (!entryTokens.length) return tokens.includes(entryValue);
  return entryTokens.some((token) => tokens.includes(token));
}

function getDiamondClarityRank(value: string, groups?: DiamondClarityGroups | null) {
  const normalized = normalizeDiamondToken(value || "");
  if (!normalized || isDiamondWildcard(normalized)) return Number.POSITIVE_INFINITY;
  const rankOf = (token: string) => {
    const idx = DIAMOND_CLARITY_ORDER.indexOf(token);
    return idx === -1 ? Number.POSITIVE_INFINITY : idx;
  };
  let best = Number.POSITIVE_INFINITY;
  const compositeDetails = groups?.compositeToDetails?.get(normalized);
  if (compositeDetails && compositeDetails.length) {
    compositeDetails.forEach((detail) => {
      const rank = rankOf(detail);
      if (rank < best) best = rank;
    });
    return best;
  }
  const tokens = parseDiamondTokens(normalized);
  if (tokens.length) {
    tokens.forEach((token) => {
      const rank = rankOf(token);
      if (rank < best) best = rank;
    });
  }
  if (!Number.isFinite(best)) {
    best = rankOf(normalized);
  }
  return best;
}

function isCompositeClarity(value: string, groups?: DiamondClarityGroups | null) {
  const normalized = normalizeDiamondToken(value || "");
  if (!normalized) return false;
  if (groups?.compositeToDetails?.has(normalized)) return true;
  return normalized.includes("-");
}

function findBestDiamondEntry(
  entries: DiamondPriceEntry[],
  clarityTokens: string[],
  colorTokens: string[],
  weight: number,
  groups?: DiamondClarityGroups | null
) {
  let bestInRange: {
    entry: DiamondPriceEntry;
    specificity: number;
    clarityRank: number;
    range: number;
  } | null = null;
  let bestNearest: {
    entry: DiamondPriceEntry;
    specificity: number;
    clarityRank: number;
    range: number;
    diff: number;
  } | null = null;

  const disallowComposite =
    Number.isFinite(weight) && weight >= SMALL_DIAMOND_WEIGHT_THRESHOLD;
  for (const entry of entries) {
    if (disallowComposite && isCompositeClarity(entry.clarity, groups)) {
      continue;
    }
    const clarityMatch = matchesDiamondToken(entry.clarity, clarityTokens, false);
    const colorMatch = matchesDiamondToken(entry.color, colorTokens, true);
    if (!clarityMatch || !colorMatch) continue;
    const specificity =
      (isDiamondWildcard(entry.clarity) ? 0 : 2) + (isDiamondWildcard(entry.color) ? 0 : 1);
    const clarityRank = getDiamondClarityRank(entry.clarity, groups);
    const range = entry.weightMax - entry.weightMin;
    const inRange = weight >= entry.weightMin && weight <= entry.weightMax;
    if (inRange) {
      const candidate = { entry, specificity, clarityRank, range };
      if (!bestInRange) {
        bestInRange = candidate;
        continue;
      }
      if (candidate.specificity > bestInRange.specificity) {
        bestInRange = candidate;
        continue;
      }
      if (candidate.specificity === bestInRange.specificity) {
        if (candidate.clarityRank < bestInRange.clarityRank) {
          bestInRange = candidate;
          continue;
        }
        if (candidate.clarityRank === bestInRange.clarityRank) {
          if (candidate.range < bestInRange.range) {
            bestInRange = candidate;
            continue;
          }
          if (candidate.range === bestInRange.range) {
            if (candidate.entry.pricePerCt > bestInRange.entry.pricePerCt) {
              bestInRange = candidate;
            }
          }
        }
      }
      continue;
    }

    const diff = weight < entry.weightMin ? entry.weightMin - weight : weight - entry.weightMax;
    const candidate = { entry, specificity, clarityRank, range, diff };
    if (!bestNearest) {
      bestNearest = candidate;
      continue;
    }
    if (candidate.diff < bestNearest.diff) {
      bestNearest = candidate;
      continue;
    }
    if (candidate.diff === bestNearest.diff) {
      if (candidate.specificity > bestNearest.specificity) {
        bestNearest = candidate;
        continue;
      }
      if (candidate.specificity === bestNearest.specificity) {
        if (candidate.clarityRank < bestNearest.clarityRank) {
          bestNearest = candidate;
          continue;
        }
        if (candidate.clarityRank === bestNearest.clarityRank) {
          if (candidate.range < bestNearest.range) {
            bestNearest = candidate;
            continue;
          }
          if (candidate.range === bestNearest.range) {
            if (candidate.entry.pricePerCt > bestNearest.entry.pricePerCt) {
              bestNearest = candidate;
            }
          }
        }
      }
    }
  }

  return bestInRange?.entry || bestNearest?.entry || null;
}

function findDiamondPricePerCtWithPriority(
  entries: DiamondPriceEntry[],
  clarity: string,
  color: string,
  weight: number,
  groups?: DiamondClarityGroups | null
) {
  const colorTokens = parseDiamondTokens(color || "");
  const plan = resolveDiamondClarityMatchPlan(clarity, weight, groups);
  const clarityTokenSets: string[][] = [];
  if (plan.primary.length) clarityTokenSets.push(plan.primary);
  if (plan.secondary.length) clarityTokenSets.push(plan.secondary);
  if (!clarityTokenSets.length) clarityTokenSets.push([]);

  const tryMatch = (clarityTokens: string[], colorList: string[]) => {
    const entry = findBestDiamondEntry(entries, clarityTokens, colorList, weight, groups);
    if (!entry) return null;
    return { entry, clarityTokens, colorTokens: colorList };
  };

  for (const clarityTokens of clarityTokenSets) {
    if (colorTokens.length) {
      const match = tryMatch(clarityTokens, colorTokens);
      if (match) {
        return {
          pricePerCt: match.entry.pricePerCt,
          clarityTokens: match.clarityTokens,
          colorTokens: match.colorTokens,
        };
      }
    }
    const match = tryMatch(clarityTokens, []);
    if (match) {
      return {
        pricePerCt: match.entry.pricePerCt,
        clarityTokens: match.clarityTokens,
        colorTokens: match.colorTokens,
      };
    }
  }

  return {
    pricePerCt: null,
    clarityTokens: plan.primary.length ? plan.primary : plan.secondary,
    colorTokens,
  };
}

function computeOptionPriceFromCosts(
  record: Record<string, string>,
  clarity: string,
  color: string,
  costValues: CostChartValues,
  diamondPrices: DiamondPriceEntry[],
  clarityGroups?: DiamondClarityGroups | null,
  adjustments?: Record<string, PriceAdjustment>,
  discountDetails?: DiscountDetails,
  diamondComponents?: DiamondBreakdownComponent[]
) {
  let metalWeight = parseNumberValue(record.metal_weight || "");
  if (!Number.isFinite(metalWeight) || metalWeight <= 0) {
    return { ok: false, error: "missing_metal_weight" } as const;
  }

  const sizeValue = record.size || "";
  const sizeLabel = record.size_label || "";
  const sizeText = `${sizeLabel} ${sizeValue}`.toLowerCase();
  const ringValue = record.size_ring || "";
  const braceletValue = record.size_bracelet || record.size_wrist || "";
  const chainValue = record.size_chain || record.size_neck || "";
  const isChainSize =
    sizeText.includes("chain") ||
    sizeValue.includes("\"") ||
    sizeText.includes("inch") ||
    sizeText.includes(" in");
  const isBraceletSize = sizeText.includes("bracelet") || sizeText.includes("wrist");
  const isRingSize = sizeText.includes("ring");
  const chainLength = parseSizeInches(chainValue) || (isChainSize ? parseSizeInches(sizeValue) : NaN);
  const chainStep = getCostNumber(costValues, ["chain_length_weight_step_g"]);
  const chainBase = getCostNumber(costValues, ["chain_length_base_inches"], 16);
  const chainAdjustment =
    Number.isFinite(chainLength) && chainLength > chainBase && chainStep > 0
      ? (chainLength - chainBase) * chainStep
      : 0;
  const braceletLength = parseSizeInches(braceletValue) || (isBraceletSize ? parseSizeInches(sizeValue) : NaN);
  const braceletStep = getCostNumber(costValues, ["bracelet_size_weight_step_g"]);
  const braceletBase = getCostNumber(costValues, ["bracelet_size_base"], 0);
  const braceletAdjustment =
    Number.isFinite(braceletLength) && braceletLength > braceletBase && braceletStep > 0
      ? (braceletLength - braceletBase) * braceletStep
      : 0;
  const ringSize = parseNumberValue(ringValue) || (isRingSize ? parseNumberValue(sizeValue) : NaN);
  const ringStep = getCostNumber(costValues, ["ring_size_weight_step_g"]);
  const ringBase = getCostNumber(costValues, ["ring_size_base"], 0);
  const ringAdjustment =
    Number.isFinite(ringSize) && ringSize > ringBase && ringStep > 0
      ? (ringSize - ringBase) * ringStep
      : 0;
  const sizeAdjustment = chainAdjustment + braceletAdjustment + ringAdjustment;
  if (sizeAdjustment > 0) {
    metalWeight += sizeAdjustment;
  }

  const { pieces, defaultType } = resolveDiamondPieces(record, diamondComponents);
  if (!pieces.length) {
    const fallbackStoneWeight = parseNumberValue(record.stone_weight || "");
    if (Number.isFinite(fallbackStoneWeight) && fallbackStoneWeight > 0) {
      pieces.push({ weight: fallbackStoneWeight, count: 1, stoneType: defaultType || undefined });
    }
  }

  const goldPricePerGram = getCostNumber(costValues, [
    "price_gram_24k",
    "gold_price_per_gram_usd",
    "gold_price_per_gram",
    "gold_price_gram",
    "gold_per_gram",
  ]);
  const requestedMetal = normalizeMetalOption(record.metal || "");
  const baseMetalKey = requestedMetal || "18K";
  const metalPriceKeys = metalPriceKeysFor(baseMetalKey);
  let metalCostPerGram = getCostNumber(costValues, metalPriceKeys);
  if ((!Number.isFinite(metalCostPerGram) || metalCostPerGram <= 0) && goldPricePerGram > 0) {
    metalCostPerGram = goldPricePerGram;
  }
  const metalCostPerGramBase = metalCostPerGram;
  const metalAdjustmentKey = "";
  const metalAdjustment = undefined;
  if (!Number.isFinite(metalCostPerGram) || metalCostPerGram <= 0) {
    logError("missing_metal_cost", {
      keys: Object.keys(costValues),
      goldPricePerGram,
      metal: record.metal || "",
    });
    return { ok: false, error: "missing_metal_cost" } as const;
  }
  const metalCost = metalCostPerGram * metalWeight;

  let diamondCost = 0;
  const diamondDebug: Array<{
    weight: number;
    count: number;
    clarityTokens: string[];
    colorTokens: string[];
    pricePerCt: number;
    pieceType: string;
  }> = [];
  const labRelativeCost = getCostPercent(costValues, ["lab_diamonds_relative_cost_pct"]);
  const labMultiplier = labRelativeCost > 0 ? labRelativeCost : 0.2;
  if (pieces.length) {
    for (const piece of pieces) {
      const priceLookup = findDiamondPricePerCtWithPriority(
        diamondPrices,
        clarity || "",
        color || "",
        piece.weight,
        clarityGroups
      );
      const clarityTokens = priceLookup.clarityTokens;
      const colorTokensUsed = priceLookup.colorTokens;
      const pricePerCt = priceLookup.pricePerCt;

      if (!pricePerCt) {
        logError("diamond_price_missing", {
          pieceWeight: piece.weight,
          pieceCount: piece.count,
          clarityTokens,
          colorTokens: colorTokensUsed,
          availableEntries: diamondPrices.length,
        });
        return { ok: false, error: "diamond_price_missing" } as const;
      }
      const pieceType = normalizeStoneTypeToken(piece.stoneType || "") || defaultType;
      const multiplier = pieceType === "lab" ? labMultiplier : 1;
      diamondDebug.push({
        weight: piece.weight,
        count: piece.count,
        clarityTokens,
        colorTokens: colorTokensUsed,
        pricePerCt,
        pieceType: pieceType || "",
      });
      diamondCost += pricePerCt * piece.weight * piece.count * multiplier;
    }
  }

  const totalDiamondWeight = pieces.reduce((sum, piece) => sum + piece.weight * piece.count, 0);
  const totalDiamondPieces = pieces.reduce((sum, piece) => sum + piece.count, 0);

  const laborFlat = getCostNumber(costValues, ["labor_flat", "labor_cost_flat"]);
  const laborPerGram = getCostNumber(costValues, ["labor_cost_per_gram_usd", "labor_per_gram", "labor_cost_per_gram"]);
  const laborPerCt = getCostNumber(costValues, ["labor_per_ct", "labor_cost_per_ct"]);
  const laborPerPiece = getCostNumber(costValues, ["labor_per_piece_usd", "labor_per_piece", "labor_cost_per_piece"]);
  const laborMarginPct = getCostPercent(costValues, ["labor_margin_per_gram_pct", "labor_margin_percent"]);
  const laborCostBase =
    laborFlat + laborPerGram * metalWeight + laborPerCt * totalDiamondWeight + laborPerPiece * totalDiamondPieces;
  const laborCost = laborCostBase * (1 + laborMarginPct);

  const materialCost = metalCost + diamondCost;
  const tariffPercent = getCostPercent(costValues, ["tariff_percent", "tariff_rate"]);
  const tariffCost = materialCost * tariffPercent;
  const dollarRiskPct = getCostPercent(costValues, ["dollar_risk_pct", "risk_percent"]);
  const riskCost = (materialCost + laborCost) * dollarRiskPct;

  const shippingCost = getCostNumber(costValues, ["shipping_cost_usd", "shipping_cost", "shipping_fee"]);
  const timeCostFlat = getCostNumber(costValues, ["time_cost_flat_usd", "time_cost_flat", "time_cost"]);
  const timeCostPerWeek = getCostNumber(costValues, ["time_cost_per_week_usd", "time_cost_per_week", "time_cost_weekly"]);
  const timelineAdjustment = parseNumberValue(record.timeline_adjustment_weeks || "");
  const timelineWeeks = Number.isFinite(timelineAdjustment) && timelineAdjustment > 0 ? timelineAdjustment : 0;
  const timeCost = timeCostFlat + timeCostPerWeek * timelineWeeks;

  const rushFeePercent = getCostPercent(costValues, ["rush_fee_percent", "rush_percent"]);
  const rushFeeFlat = getCostNumber(costValues, ["rush_fee_flat_usd", "rush_fee_flat", "rush_fee"]);
  const timelineValue = (record.timeline || "").toLowerCase();
  const rushFee =
    timelineValue.includes("rush") ? materialCost * rushFeePercent + rushFeeFlat : 0;

  const baseCost =
    materialCost + laborCost + tariffCost + shippingCost + timeCost + riskCost + rushFee;
  const pricePremium = getCostPercent(costValues, ["price_premium_pct", "price_premium_percent"]);
  const profitProduction = getCostPercent(costValues, [
    "profit_margin_production_pct",
    "profit_margin_percent",
    "profit_margin",
  ]);
  const profitSales = getCostPercent(costValues, ["profit_margin_sales_pct"]);
  const priceWithMargin = baseCost * (1 + pricePremium + profitProduction + profitSales);

  const discount = discountDetails || resolveDiscountDetails(costValues);
  const finalPrice = priceWithMargin * (1 - discount.appliedPercent);

  return {
    ok: true,
    price: Math.round(finalPrice),
    discount,
    debug: {
      metalCostPerGramBase,
      metalCostPerGram,
      metalAdjustmentKey,
      metalAdjustmentType: metalAdjustment?.type || "",
      metalAdjustmentValue: metalAdjustment?.value ?? null,
      metalAdjustmentMode: metalAdjustment?.mode || "",
      chainAdjustment,
      chainLength,
      chainStep,
      chainBase,
      braceletAdjustment,
      braceletLength,
      braceletStep,
      braceletBase,
      ringAdjustment,
      ringSize,
      ringStep,
      ringBase,
      diamondCost,
      diamondDebug,
    },
  } as const;
}

function buildQuoteOptions(
  record: Record<string, string>,
  metals: string[],
  costValues: CostChartValues,
  diamondPrices: DiamondPriceEntry[],
  clarityGroups?: DiamondClarityGroups | null,
  discountDetails?: DiscountDetails
) {
  const options: QuoteOption[] = [];
  for (let i = 1; i <= 3; i += 1) {
    const clarity = record[`quote_option_${i}_clarity`] || "";
    const color = record[`quote_option_${i}_color`] || "";
    const priceRaw = record[`quote_option_${i}_price_18k`] || "";
    const price18k = parsePriceValue(priceRaw);
    if (!Number.isFinite(price18k)) continue;
    const prices: Record<string, number> = {};
    metals.forEach((metal) => {
      const normalized = normalizeMetalOption(metal);
      if (!normalized) return;
      const overrideRecord = { ...record, metal: normalized };
      const computed = computeOptionPriceFromCosts(
        overrideRecord,
        clarity,
        color,
        costValues,
        diamondPrices,
        clarityGroups,
        {},
        discountDetails
      );
      if (computed.ok) {
        prices[normalized] = computed.price;
      }
    });
    options.push({
      clarity,
      color,
      price18k: Math.round(price18k),
      prices,
    });
  }
  return options;
}

async function computeQuoteOptionPrices(
  env: Env,
  record: Record<string, string>,
  options?: { force?: boolean }
): Promise<
  | {
      ok: true;
      fields: Record<string, string>;
      meta: { discountSummary: string; discountPercent: number; discountDetails: DiscountDetails };
    }
  | { ok: false; error: string }
> {
  const fields: Record<string, string> = {};
  const force = Boolean(options?.force);
  let needsPricing = false;
  const { pieces: breakdownPieces } = resolveDiamondPieces(record);
  const stoneWeightValue = parseNumberValue(record.stone_weight || "");
  const hasDiamonds =
    breakdownPieces.length > 0 ||
    (Number.isFinite(stoneWeightValue) && stoneWeightValue > 0);
  for (let i = 1; i <= 3; i += 1) {
    const priceRaw = record[`quote_option_${i}_price_18k`] || "";
    const clarity = record[`quote_option_${i}_clarity`] || "";
    const color = record[`quote_option_${i}_color`] || "";
    const goldOnlyOption = !hasDiamonds && i === 1;
    if (!force && priceRaw) continue;
    if (!goldOnlyOption && !clarity && !color) continue;
    needsPricing = true;
  }

  const costValues = await loadCostChartValues(env);
  const discountDetails = resolveDiscountDetails(costValues, record);
  if (!needsPricing) {
    return {
      ok: true,
      fields,
      meta: {
        discountSummary: discountDetails.summary,
        discountPercent: discountDetails.appliedPercent,
        discountDetails,
      },
    };
  }

  const diamondPrices = await loadDiamondPriceChart(env);
  const clarityGroups = await loadDiamondClarityGroups(env);
  for (let i = 1; i <= 3; i += 1) {
    const priceRaw = record[`quote_option_${i}_price_18k`] || "";
    const clarity = record[`quote_option_${i}_clarity`] || "";
    const color = record[`quote_option_${i}_color`] || "";
    const goldOnlyOption = !hasDiamonds && i === 1;
    if (!force && priceRaw) continue;
    if (!goldOnlyOption && !clarity && !color) continue;
    const result = computeOptionPriceFromCosts(
      record,
      clarity,
      color,
      costValues,
      diamondPrices,
      clarityGroups,
      {},
      discountDetails
    );
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    fields[`quote_option_${i}_price_18k`] = String(result.price);
  }

  return {
    ok: true,
    fields,
    meta: {
      discountSummary: discountDetails.summary,
      discountPercent: discountDetails.appliedPercent,
      discountDetails,
    },
  };
}

  async function handleOrderAdminAction(
    env: Env,
    payload: Record<string, unknown>,
    adminEmail: string
  ) {
    if (!hasD1(env)) return { ok: false, error: "d1_unavailable" };
    const requestId = getString(payload.requestId || payload.request_id);
    if (!requestId) return { ok: false, error: "missing_request_id" };
    const action = getString(payload.action).toLowerCase();
    if (action === "delete" || action === "remove") {
      if (!hasD1(env)) return { ok: false, error: "d1_unavailable" };
      const normalizedRequestId = normalizeRequestId(requestId);
      const lookup = await findSheetRowByRequestId(env, "order", normalizedRequestId);
      if (!lookup) return { ok: false, error: "request_not_found" };
      await d1Run(env, "DELETE FROM order_details WHERE request_id = ?", [normalizedRequestId]);
      await d1Run(env, "DELETE FROM orders WHERE request_id = ?", [normalizedRequestId]);
      return { ok: true };
    }
    const requestedStatus = getString(payload.status).toUpperCase();
    const notes = getString(payload.notes);
    const updates = coerceUpdates(payload.fields, ORDER_UPDATE_FIELDS);
    const detailUpdates = coerceUpdates(payload.details, ORDER_DETAILS_UPDATE_FIELDS);
    const lookup = await findSheetRowByRequestId(env, "order", requestId);
  if (!lookup) return { ok: false, error: "request_not_found" };
  const record = mapSheetRowToRecord(Array.from(lookup.headerIndex.keys()), lookup.row);
  const currentStatus = getOrderStatusFromRow(lookup);
  const resolvedStatus = resolveOrderStatus(action, requestedStatus);
  let nextStatus = resolvedStatus;
  if (!nextStatus && action === "set_status") {
    nextStatus = requestedStatus;
  }

  if (nextStatus === "PENDING_CONFIRMATION" && action !== "request_confirmation") {
    return { ok: false, error: "confirmation_required" };
  }

  if (nextStatus && nextStatus !== currentStatus) {
    const allowConfirmationFromNew =
      action === "request_confirmation" &&
      nextStatus === "PENDING_CONFIRMATION" &&
      currentStatus === "NEW";
    if (!isOrderTransitionAllowed(currentStatus, nextStatus) && !allowConfirmationFromNew) {
      return {
        ok: false,
        error: "invalid_transition",
        currentStatus,
        nextStatus,
      };
    }
  } else if (nextStatus === currentStatus) {
    nextStatus = "";
  }

  const needsOrderDetails =
    Object.keys(detailUpdates).length > 0 || nextStatus === "SHIPPED" || nextStatus === "DELIVERED";
  let existingDetails: OrderDetailsRecord | null = null;
  if (needsOrderDetails) {
    existingDetails = await getOrderDetailsRecord(env, requestId);
  }

  if (nextStatus === "SHIPPED") {
    const missing = REQUIRED_SHIPPING_DETAILS_FIELDS.filter((field) => {
      if (detailUpdates[field]) return false;
      const existingValue = existingDetails
        ? getString(existingDetails[field as keyof OrderDetailsRecord])
        : "";
      return !existingValue;
    });
    if (missing.length) {
      return { ok: false, error: "missing_shipping_details", fields: missing };
    }
  }

  const notesIdx = lookup.headerIndex.get("notes");
  const existingNotes = notesIdx === undefined ? "" : getString(lookup.row[notesIdx]);
  const statusChanged = Boolean(nextStatus);
  const auditNote = statusChanged ? buildStatusAuditNote(nextStatus) : "";
  const baseNotes = notes || existingNotes;
  let paymentUrl = "";
  if (nextStatus === "INVOICED") {
    paymentUrl = resolveOrderPaymentUrl(env, requestId, getString(record.email || ""), "");
  }
  const paymentNote = paymentUrl ? `Invoice link prepared: ${paymentUrl}.` : "";
  const combinedNotes = appendNote(appendNote(baseNotes, auditNote), paymentNote);
  const notesToSave = combinedNotes && (statusChanged || notes) ? combinedNotes : "";

  if (needsOrderDetails) {
    const detailsToSave: Record<string, string> = { ...detailUpdates };
    const now = new Date().toISOString();
    if (nextStatus === "SHIPPED") {
      if (!detailsToSave.shipping_status) {
        detailsToSave.shipping_status =
          getString(existingDetails?.shipping_status) || "Shipped";
      }
      if (!detailsToSave.shipped_at && !getString(existingDetails?.shipped_at)) {
        detailsToSave.shipped_at = now;
      }
    }
    if (nextStatus === "DELIVERED") {
      if (!detailsToSave.shipping_status) {
        detailsToSave.shipping_status =
          getString(existingDetails?.shipping_status) || "Delivered";
      }
      if (!detailsToSave.delivered_at && !getString(existingDetails?.delivered_at)) {
        detailsToSave.delivered_at = now;
      }
    }
    const detailsStatus = nextStatus || currentStatus;
    try {
      await upsertOrderDetailsRecord(env, requestId, detailsToSave, detailsStatus, adminEmail);
    } catch (error) {
      return { ok: false, error: "order_details_failed", detail: String(error) };
    }
  }

  const updateResult = await updateAdminRow(env, "order", requestId, nextStatus, notesToSave, updates);
  if (updateResult.ok && paymentUrl) {
    try {
      await upsertOrderDetailsRecord(
        env,
        requestId,
        { payment_url: paymentUrl },
        "INVOICED",
        adminEmail
      );
    } catch (error) {
      logWarn("order_invoice_details_failed", { requestId, error: String(error) });
    }
  }
  return updateResult;
}

  async function handleQuoteAdminAction(env: Env, payload: Record<string, unknown>) {
    if (!hasD1(env)) return { ok: false, error: "d1_unavailable" };
    const requestId = getString(payload.requestId || payload.request_id);
    if (!requestId) return { ok: false, error: "missing_request_id" };
    const action = getString(payload.action).toLowerCase();
    if (action === "delete" || action === "remove") {
      if (!hasD1(env)) return { ok: false, error: "d1_unavailable" };
      const normalizedRequestId = normalizeRequestId(requestId);
      const lookup = await findSheetRowByRequestId(env, "quote", normalizedRequestId);
      if (!lookup) return { ok: false, error: "request_not_found" };
      await d1Run(env, "DELETE FROM quotes WHERE request_id = ?", [normalizedRequestId]);
      return { ok: true };
    }
    const status = getString(payload.status).toUpperCase();
    const notes = getString(payload.notes);
    const updates = coerceUpdates(payload.fields, QUOTE_UPDATE_FIELDS);
    if (action === "submit_quote") {
    return await submitQuoteAdmin(env, requestId, updates, notes);
  }
  if (action === "refresh_quote") {
    return await submitQuoteAdmin(env, requestId, updates, notes, {
      expireExisting: true,
      refreshEmail: true,
    });
  }
  const nextStatus = resolveQuoteStatus(action, status);
  return await updateAdminRow(env, "quote", requestId, nextStatus, notes, updates);
}

type QuoteOption = {
  clarity: string;
  color: string;
  price18k: number;
  prices: Record<string, number>;
};

type QuoteConfirmationRecord = {
  token: string;
  requestId: string;
  email?: string;
  name?: string;
  productName?: string;
  productUrl?: string;
  designCode?: string;
  metal?: string;
  metalWeight?: string;
  metalWeightAdjustment?: string;
  stoneWeight?: string;
  diamondBreakdown?: string;
  discountSummary?: string;
  discountPercent?: number;
  status: "pending" | "selected" | "accepted" | "expired";
  createdAt: string;
  expiresAt?: string;
  refreshedAt?: string;
  redirectToken?: string;
  metals: string[];
  options: QuoteOption[];
  selectedMetal?: string;
  selectedOption?: number;
  selectedPrice?: number;
  acceptedAt?: string;
  selectedAt?: string;
};

async function submitQuoteAdmin(
  env: Env,
  requestId: string,
  updates: Record<string, string>,
  notes: string,
  submitOptions?: { expireExisting?: boolean; refreshEmail?: boolean }
) {
  if (!env.HEERAWALLA_ACKS) {
    return { ok: false, error: "kv_missing" };
  }
  const lookup = await findSheetRowByRequestId(env, "quote", requestId);
  if (!lookup) return { ok: false, error: "request_not_found" };
  const header = Array.from(lookup.headerIndex.keys());
  const record = mapSheetRowToRecord(header, lookup.row);
  const existingNotes = getString(record.notes);
  const existingToken = getString(record.quote_token || "");
  const mergedBase = { ...record, ...updates };
  const computed = await computeQuoteOptionPrices(env, mergedBase);
  if (!computed.ok) {
    return { ok: false, error: computed.error };
  }
  const merged = { ...mergedBase, ...computed.fields };
  const discountSummary = computed.meta?.discountSummary || "";
  const discountPercent = Number(computed.meta?.discountPercent || 0);
  const discountDetails = computed.meta?.discountDetails;
  const metals = resolveQuoteMetalOptions(merged.quote_metal_options || "", merged.metal || "");
  const costValues = await loadCostChartValues(env);
  const diamondPrices = await loadDiamondPriceChart(env);
  const clarityGroups = await loadDiamondClarityGroups(env);
  const quoteOptions = buildQuoteOptions(
    merged,
    metals,
    costValues,
    diamondPrices,
    clarityGroups,
    discountDetails ||
      (computed.meta?.discountPercent !== undefined
        ? {
            label: discountSummary,
            rawPercent: discountPercent,
            appliedPercent: discountPercent,
            summary: discountSummary,
          }
        : undefined)
  );
  if (!quoteOptions.length) {
    return { ok: false, error: "quote_options_missing" };
  }

  const token = generateQuoteConfirmationToken();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + QUOTE_CONFIRMATION_TTL * 1000).toISOString();
  const quoteRecord: QuoteConfirmationRecord = {
    token,
    requestId: normalizeRequestId(requestId),
    email: merged.email || record.email,
    name: merged.name || record.name,
    productName: merged.product_name || record.product_name,
    productUrl: merged.product_url || record.product_url,
    designCode: merged.design_code || record.design_code,
    metal: merged.metal || record.metal,
    metalWeight: merged.metal_weight || record.metal_weight,
    metalWeightAdjustment: merged.metal_weight_adjustment || record.metal_weight_adjustment,
    stoneWeight: merged.stone_weight || record.stone_weight,
    diamondBreakdown: merged.diamond_breakdown || record.diamond_breakdown,
    discountSummary: discountSummary || "",
    discountPercent: Number.isFinite(discountPercent) ? discountPercent : 0,
    status: "pending",
    createdAt: now,
    expiresAt,
    metals,
    options: quoteOptions,
  };
  if (!quoteRecord.email) {
    return { ok: false, error: "missing_email" };
  }

  await storeQuoteConfirmationRecord(env, quoteRecord);
  const quoteUrl = buildQuotePageUrl(env, token);
  const emailPayload = buildQuoteEmail(quoteRecord, quoteUrl, {
    refreshed: Boolean(submitOptions?.refreshEmail),
  });
  try {
    await sendEmail(env, {
      to: [quoteRecord.email || ""],
      sender: "Heerawalla <atelier@heerawalla.com>",
      replyTo: getCustomerReplyTo(),
      subject: emailPayload.subject,
      textBody: emailPayload.textBody,
      htmlBody: emailPayload.htmlBody,
    });
  } catch (error) {
    return { ok: false, error: "quote_email_failed", detail: String(error) };
  }

  const updatePayload = {
    ...updates,
    ...computed.fields,
    quote_token: token,
    quote_expires_at: expiresAt,
    quote_sent_at: now,
  };
  const auditLabel = submitOptions?.refreshEmail ? "Quote link refreshed" : "Quote link sent";
  const auditNote = `${auditLabel}: ${quoteUrl} (${now})`;
  const combinedNotes = appendNote(appendNote(existingNotes, notes), auditNote);
  const updateResult = await updateAdminRow(env, "quote", requestId, "QUOTED", combinedNotes, updatePayload);
  if (!updateResult.ok) return updateResult;
  if (submitOptions?.expireExisting && existingToken && existingToken !== token) {
    await expireQuoteConfirmationToken(env, existingToken, token);
  }
  return updateResult;
}

async function handleContactAdminAction(env: Env, payload: Record<string, unknown>) {
  if (!hasD1(env)) return { ok: false, error: "d1_unavailable" };
  const requestId = getString(payload.requestId || payload.request_id);
  if (!requestId) return { ok: false, error: "missing_request_id" };
  const action = getString(payload.action).toLowerCase();
  const statusFromAction =
    action === "mark_pending" ? "PENDING" : action === "mark_resolved" ? "RESOLVED" : "";
  const status = getString(payload.status || statusFromAction).toUpperCase();
  const notes = getString(payload.notes);
  const updates = coerceUpdates(payload.fields, CONTACT_UPDATE_FIELDS);
  const nextStatus = resolveContactStatus(action, status);
  return await updateAdminRow(env, "contact", requestId, nextStatus, notes, updates);
}

async function handleTicketAdminAction(
  env: Env,
  payload: Record<string, unknown>,
  adminEmail: string
) {
  if (!hasD1(env)) return { ok: false, error: "d1_unavailable" };
  const requestId = getString(payload.requestId || payload.request_id);
  if (!requestId) return { ok: false, error: "missing_request_id" };
  const action = getString(payload.action).toLowerCase();
  const now = new Date().toISOString();
  if (action === "add_note") {
    const note = getString(payload.note || payload.notes);
    if (!note) return { ok: false, error: "missing_note" };
    await addTicketDetail(env, {
      requestId,
      note,
      kind: "note",
      createdAt: now,
      updatedBy: adminEmail,
    });
    return { ok: true };
  }
  if (action === "send_email") {
    const subject = getString(payload.subject);
    const body = getString(payload.body);
    if (!subject || !body) return { ok: false, error: "missing_email_payload" };
    const rows = await d1All(env, "SELECT email, name FROM tickets WHERE request_id = ? LIMIT 1", [
      requestId,
    ]);
    if (!rows.length) return { ok: false, error: "ticket_not_found" };
    const record = rows[0] as Record<string, unknown>;
    const toEmail = getString(record.email);
    if (!toEmail) return { ok: false, error: "missing_email" };
    await sendEmail(env, {
      to: [toEmail],
      sender: "Heerawalla <atelier@heerawalla.com>",
      replyTo: getCustomerReplyTo(),
      subject,
      textBody: body,
      htmlBody: buildPlainEmailHtml(body),
    });
    await addTicketDetail(env, {
      requestId,
      note: `Email sent: ${subject}\n\n${body}`,
      kind: "email",
      createdAt: now,
      updatedBy: adminEmail,
    });
    return { ok: true };
  }
  if (action === "delete" || action === "remove") {
    await d1Run(env, "DELETE FROM tickets WHERE request_id = ?", [requestId]);
    return { ok: true };
  }
  const status = getString(payload.status).toUpperCase();
  const fields = isRecord(payload.fields) ? payload.fields : {};
  const subject = getString(fields.subject || payload.subject);
  const summary = getString(fields.summary || payload.summary);
  const updates: Array<string> = [];
  const params: Array<string> = [];
  if (subject) {
    updates.push("subject = ?");
    params.push(subject);
  }
  if (summary) {
    updates.push("summary = ?");
    params.push(summary);
  }
  if (status) {
    updates.push("status = ?");
    params.push(status);
    await addTicketDetail(env, {
      requestId,
      note: `Status set to ${status}`,
      kind: "status",
      createdAt: now,
      updatedBy: adminEmail,
    });
  }
  updates.push("updated_at = ?");
  params.push(now);
  updates.push("updated_by = ?");
  params.push(adminEmail);
  params.push(requestId);
  if (updates.length) {
    await d1Run(env, `UPDATE tickets SET ${updates.join(", ")} WHERE request_id = ?`, params);
  }
  return { ok: true };
}

async function handlePricingAdminAction(
  env: Env,
  kind: "price_chart" | "cost_chart" | "diamond_price_chart",
  payload: Record<string, unknown>
) {
  if (!hasD1(env)) return { ok: false, error: "d1_unavailable" };
  const action = getString(payload.action).toLowerCase();
  const updates =
    kind === "price_chart"
      ? coerceUpdates(payload.fields, PRICE_CHART_UPDATE_FIELDS)
      : kind === "cost_chart"
      ? coerceUpdates(payload.fields, COST_CHART_UPDATE_FIELDS)
      : coerceUpdates(payload.fields, DIAMOND_PRICE_CHART_UPDATE_FIELDS);
  if (action === "add_row" || action === "add") {
    await appendPricingRow(env, kind, updates);
    return { ok: true };
  }
  const rowValue = getString(payload.rowNumber || payload.row_number || "");
  if (!rowValue) {
    return { ok: false, error: "missing_row_number" };
  }
  const rowNumber = Number(rowValue);
  if (!hasD1(env) && (!rowNumber || rowNumber < 2)) {
    return { ok: false, error: "missing_row_number" };
  }
  await updatePricingRow(env, kind, hasD1(env) ? Number(rowValue) : rowNumber, updates);
  return { ok: true };
}

function resolveMediaKeyFromUrl(url: string) {
  if (!url) return "";
  try {
    const parsed = new URL(url, "https://example.com");
    const pathname = parsed.pathname || "";
    const mediaIndex = pathname.indexOf("/media/");
    if (mediaIndex !== -1) {
      const suffix = pathname.slice(mediaIndex + "/media/".length).replace(/^\/+/, "");
      return suffix ? `media/${suffix}` : "";
    }
    const libraryIndex = pathname.indexOf("/library/");
    if (libraryIndex !== -1) {
      const suffix = pathname.slice(libraryIndex + "/library/".length).replace(/^\/+/, "");
      return suffix ? `media/library/${suffix}` : "";
    }
  } catch {}
  return "";
}

async function deleteMediaObject(env: Env, mediaId: string, url: string) {
  if (!env.MEDIA_BUCKET) return;
  const key = resolveMediaKeyFromUrl(url);
  if (!key) return;
  await env.MEDIA_BUCKET.delete(key);
}

async function handleCatalogAdminAction(
  env: Env,
  kind: "product" | "inspiration" | "media_library" | "product_media" | "inspiration_media",
  payload: Record<string, unknown>
) {
  const action = getString(payload.action).toLowerCase();
  if (action === "delete" || action === "remove") {
    if (!hasD1(env)) return { ok: false, error: "d1_unavailable" };
    if (kind === "product_media" || kind === "inspiration_media") {
      const mappingId = getString(payload.rowNumber || payload.row_number || payload.id || "");
      if (!mappingId) return { ok: false, error: "missing_row_number" };
      const mappingRows = await d1All(env, "SELECT id, media_id FROM catalog_media WHERE id = ? LIMIT 1", [
        mappingId,
      ]);
      if (!mappingRows.length) return { ok: false, error: "not_found" };
      const mediaId = getString(mappingRows[0].media_id || "");
      await d1Run(env, "DELETE FROM catalog_media WHERE id = ?", [mappingId]);
      const deleteMedia = Boolean(payload.delete_media || payload.deleteMedia);
      if (deleteMedia && mediaId) {
        const remaining = await d1All(
          env,
          "SELECT COUNT(*) AS total FROM catalog_media WHERE media_id = ?",
          [mediaId]
        );
        const count = remaining.length ? Number(remaining[0].total || 0) : 0;
        if (!count) {
          const mediaRows = await d1All(
            env,
            "SELECT media_id, url FROM media_library WHERE media_id = ? LIMIT 1",
            [mediaId]
          );
          if (mediaRows.length) {
            const mediaUrl = getString(mediaRows[0].url || "");
            await d1Run(env, "DELETE FROM media_library WHERE media_id = ?", [mediaId]);
            await deleteMediaObject(env, mediaId, mediaUrl);
          }
        }
      }
      return { ok: true };
    }
    if (kind !== "product" && kind !== "inspiration") {
      return { ok: false, error: "unsupported_delete" };
    }
    const identifier = getString(
      payload.requestId || payload.request_id || payload.slug || payload.id || ""
    );
      if (!identifier) return { ok: false, error: "missing_identifier" };
      const rows = await d1All(
        env,
        "SELECT id, slug FROM catalog_items WHERE type = ? AND (id = ? OR slug = ?) LIMIT 1",
        [kind, identifier, identifier]
      );
      if (!rows.length) return { ok: false, error: "not_found" };
      const catalogId = getString((rows[0] as Record<string, unknown>).id);
      if (catalogId) {
        await d1Run(env, "DELETE FROM catalog_media WHERE catalog_id = ?", [catalogId]);
      }
      await d1Run(env, "DELETE FROM catalog_items WHERE type = ? AND (id = ? OR slug = ?)", [
        kind,
        identifier,
        identifier,
      ]);
      return { ok: true };
    }
  const updates =
      kind === "product"
        ? coerceUpdates(payload.fields, PRODUCT_UPDATE_FIELDS)
        : kind === "inspiration"
      ? coerceUpdates(payload.fields, INSPIRATION_UPDATE_FIELDS)
      : kind === "media_library"
      ? coerceUpdates(payload.fields, MEDIA_LIBRARY_UPDATE_FIELDS)
      : kind === "product_media"
      ? coerceUpdates(payload.fields, PRODUCT_MEDIA_UPDATE_FIELDS)
      : coerceUpdates(payload.fields, INSPIRATION_MEDIA_UPDATE_FIELDS);
  if (action === "add_row" || action === "add") {
    await appendCatalogRow(env, kind, updates);
    return { ok: true };
  }
  const rowValue = getString(payload.rowNumber || payload.row_number || "");
  if (!rowValue) {
    return { ok: false, error: "missing_row_number" };
  }
  const rowNumber = Number(rowValue);
  if (!hasD1(env) && (!rowNumber || rowNumber < 2)) {
    return { ok: false, error: "missing_row_number" };
  }
    await updateCatalogRow(env, kind, hasD1(env) ? rowValue : rowNumber, updates);
    return { ok: true };
  }

  async function handleCatalogStoneOptionAction(env: Env, payload: Record<string, unknown>) {
    if (!hasD1(env)) return { ok: false, error: "d1_unavailable" };
    const action = getString(payload.action).toLowerCase();
    const updates = coerceUpdates(payload.fields || payload, CATALOG_STONE_OPTIONS_UPDATE_FIELDS);
    if (action === "delete" || action === "remove") {
      const id = getString(payload.id || updates.id);
      if (!id) return { ok: false, error: "missing_id" };
      await d1Run(env, "DELETE FROM catalog_stone_options WHERE id = ?", [id]);
      return { ok: true };
    }

    const now = new Date().toISOString();
    if (action === "add_row" || action === "add") {
      const id = getString(payload.id || "") || crypto.randomUUID();
      const catalogId = getString(payload.catalog_id || updates.catalog_id);
      const role = getString(payload.role || updates.role);
      if (!catalogId) return { ok: false, error: "missing_catalog" };
      if (!role) return { ok: false, error: "missing_fields" };
      await d1Run(
        env,
        `INSERT INTO catalog_stone_options (id, catalog_id, role, carat, count, is_primary, size_type, created_at, updated_at, shape)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            catalogId,
            role,
            updates.carat || null,
            updates.count || null,
            updates.is_primary || "0",
            updates.size_type || null,
            now,
            now,
            updates.shape || null,
          ]
      );
      return { ok: true, id };
    }

    if (action === "update" || action === "edit" || action === "save") {
      const id = getString(payload.id);
      if (!id) return { ok: false, error: "missing_id" };
      const fields = { ...updates, updated_at: now };
      const entries = Object.entries(fields).filter(([, value]) => value !== undefined);
      if (!entries.length) return { ok: false, error: "missing_updates" };
      const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
      const values = entries.map(([, value]) => value);
      await d1Run(env, `UPDATE catalog_stone_options SET ${setClause} WHERE id = ?`, [...values, id]);
      return { ok: true };
    }

    return { ok: false, error: "invalid_action" };
  }

  async function handleCatalogNotesAction(env: Env, payload: Record<string, unknown>) {
    if (!hasD1(env)) return { ok: false, error: "d1_unavailable" };
    const action = getString(payload.action).toLowerCase();
    const updates = coerceUpdates(payload.fields || payload, CATALOG_NOTES_UPDATE_FIELDS);
    if (action === "delete" || action === "remove") {
      const id = getString(payload.id || updates.id);
      if (!id) return { ok: false, error: "missing_id" };
      await d1Run(env, "DELETE FROM catalog_notes WHERE id = ?", [id]);
      return { ok: true };
    }

    const now = new Date().toISOString();
    if (action === "add_row" || action === "add") {
      const id = getString(payload.id || "") || crypto.randomUUID();
      let catalogSlug = getString(payload.catalog_slug || updates.catalog_slug);
      let catalogId = getString(payload.catalog_id || updates.catalog_id);
      if (!catalogId && catalogSlug) {
        const rows = await d1All(
          env,
          "SELECT id FROM catalog_items WHERE slug = ? LIMIT 1",
          [catalogSlug]
        );
        catalogId = rows.length ? String(rows[0].id || "") : "";
      }
      if (!catalogSlug && catalogId) {
        const rows = await d1All(
          env,
          "SELECT slug FROM catalog_items WHERE id = ? LIMIT 1",
          [catalogId]
        );
        catalogSlug = rows.length ? String(rows[0].slug || "") : "";
      }
      const kind = getString(payload.kind || updates.kind);
      const note = getString(payload.note || updates.note);
      const sortOrder = getString(payload.sort_order || updates.sort_order || "0");
      if (!catalogId || !catalogSlug) return { ok: false, error: "missing_catalog" };
      if (!kind || !note) return { ok: false, error: "missing_fields" };
      await d1Run(
        env,
        `INSERT INTO catalog_notes (id, catalog_id, catalog_slug, kind, note, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          catalogId,
          catalogSlug,
          kind,
          note,
          sortOrder,
          now,
          now,
        ]
      );
      return { ok: true, id };
    }

    if (action === "update" || action === "edit" || action === "save") {
      const id = getString(payload.id);
      if (!id) return { ok: false, error: "missing_id" };
      const fields = { ...updates, updated_at: now };
      const entries = Object.entries(fields).filter(([, value]) => value !== undefined);
      if (!entries.length) return { ok: false, error: "missing_updates" };
      const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
      const values = entries.map(([, value]) => value);
      await d1Run(env, `UPDATE catalog_notes SET ${setClause} WHERE id = ?`, [...values, id]);
      return { ok: true };
    }

    return { ok: false, error: "invalid_action" };
  }

  async function handleCatalogMetalOptionAction(env: Env, payload: Record<string, unknown>) {
    if (!hasD1(env)) return { ok: false, error: "d1_unavailable" };
    const action = getString(payload.action).toLowerCase();
    const updates = coerceUpdates(payload.fields || payload, CATALOG_METAL_OPTIONS_UPDATE_FIELDS);
    if (action === "delete" || action === "remove") {
      const id = getString(payload.id || updates.id);
      if (!id) return { ok: false, error: "missing_id" };
      await d1Run(env, "DELETE FROM catalog_metal_options WHERE id = ?", [id]);
      return { ok: true };
    }

    const now = new Date().toISOString();
    if (action === "add_row" || action === "add") {
      const id = getString(payload.id || "") || crypto.randomUUID();
      const catalogId = getString(payload.catalog_id || updates.catalog_id);
      const metalWeight = getString(payload.metal_weight || updates.metal_weight);
      if (!catalogId) return { ok: false, error: "missing_catalog" };
      if (!metalWeight) return { ok: false, error: "missing_fields" };
      await d1Run(
        env,
        `INSERT INTO catalog_metal_options (id, catalog_id, metal_weight, is_primary, size_type, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            catalogId,
            metalWeight,
            updates.is_primary || "0",
            updates.size_type || null,
            now,
            now,
          ]
        );
      return { ok: true, id };
    }

    if (action === "update" || action === "edit" || action === "save") {
      const id = getString(payload.id);
      if (!id) return { ok: false, error: "missing_id" };
      const fields = { ...updates, updated_at: now };
      const entries = Object.entries(fields).filter(([, value]) => value !== undefined);
      if (!entries.length) return { ok: false, error: "missing_updates" };
      const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
      const values = entries.map(([, value]) => value);
      await d1Run(env, `UPDATE catalog_metal_options SET ${setClause} WHERE id = ?`, [
        ...values,
        id,
      ]);
      return { ok: true };
    }

    return { ok: false, error: "invalid_action" };
  }

  async function handleSiteConfigAdminAction(env: Env, payload: Record<string, unknown>) {
    if (!hasD1(env)) return { ok: false, error: "d1_unavailable" };
    const action = getString(payload.action).toLowerCase();
    const updates = coerceUpdates(payload.fields || payload, SITE_CONFIG_UPDATE_FIELDS);
  const key = getString(updates.key || payload.key);
  if (!key) return { ok: false, error: "missing_key" };
  if (action === "delete" || action === "remove") {
    await d1Run(env, "DELETE FROM site_config WHERE key = ?", [key]);
    return { ok: true };
  }
  const value = getString(updates.value ?? payload.value);
  const now = new Date().toISOString();
  await d1Run(
    env,
    "INSERT INTO site_config (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    [key, value, now]
  );
  return { ok: true };
}

async function handleMediaUpload(env: Env, request: Request) {
  if (!env.MEDIA_BUCKET) return { ok: false, error: "media_bucket_missing" };
  const baseUrl = (env.MEDIA_PUBLIC_BASE_URL || "").trim().replace(/\/+$/, "");
  if (!baseUrl) return { ok: false, error: "media_public_base_missing" };
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "missing_file" };
  const rawId = getString(formData.get("media_id") || formData.get("mediaId"));
  const label = getString(formData.get("label"));
  const originalName = file.name || "upload";
  const extMatch = originalName.match(/\.[a-z0-9]+$/i);
  const ext = extMatch ? extMatch[0].toLowerCase() : "";
  const baseId = rawId || label || originalName.replace(ext, "");
  const normalizedId = slugifyMediaId(baseId);
  const uniqueSuffix = Date.now().toString(36);
  const mediaId = rawId || `${normalizedId}-${uniqueSuffix}`;
  const key = `media/library/${mediaId}${ext || ""}`;
  const contentType = file.type || "application/octet-stream";
  await env.MEDIA_BUCKET.put(key, file, {
    httpMetadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });
  const url = `${baseUrl}/${key}`;
  return {
    ok: true,
    media: {
      media_id: mediaId,
      url,
      media_type: contentType.startsWith("video/") ? "video" : "image",
      label,
    },
  };
}

async function handleOrderConfirmationAdmin(env: Env, payload: Record<string, unknown>) {
  if (!env.HEERAWALLA_ACKS) {
    return { ok: false, error: "confirmation_store_unavailable" };
  }
  const requestId = getString(payload.requestId || payload.request_id);
  if (!requestId) return { ok: false, error: "missing_request_id" };
  const changes = normalizeOrderConfirmationChanges(payload.changes);
  if (!changes.length) return { ok: false, error: "missing_changes" };
  const email = getString(payload.email);
  const name = getString(payload.name);
  const productName = getString(payload.productName || payload.product_name);
  const paymentUrl = getString(payload.paymentUrl || payload.payment_url);
  const token = generateOrderConfirmationToken();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + ORDER_CONFIRMATION_TTL * 1000).toISOString();
  const record: OrderConfirmationRecord = {
    token,
    requestId: normalizeRequestId(requestId),
    email,
    name,
    productName,
    changes,
    status: "pending",
    createdAt,
    expiresAt,
    paymentUrl: paymentUrl || undefined,
  };
  await storeOrderConfirmationRecord(env, record);
  await storeOrderConfirmationIndex(env, record);
  const confirmationUrl = buildOrderConfirmationPageUrl(env, token);
  return {
    ok: true,
    token,
    confirmationUrl,
    expiresAt,
  };
}

async function handleAdminEmail(env: Env, payload: Record<string, unknown>) {
  const to = getString(payload.to);
  const subject = getString(payload.subject);
  const textBody = getString(payload.textBody || payload.text);
  const htmlBody = getString(payload.htmlBody || payload.html);
  const statusRequestId = getString(payload.requestId || payload.request_id);
  const statusValue = normalizeOrderStatus(getString(payload.orderStatus || payload.status));
  if (!to || !subject || (!textBody && !htmlBody)) {
    return { ok: false, error: "missing_fields" };
  }
  if (!isValidEmail(to)) {
    return { ok: false, error: "invalid_email" };
  }
  await sendEmail(env, {
    to: [to],
    sender: "Heerawalla <atelier@heerawalla.com>",
    replyTo: getInternalReplyTo(env),
    subject,
    textBody: textBody || undefined,
    htmlBody: htmlBody || undefined,
  });
  if (statusRequestId && statusValue) {
    await recordOrderStatusEmailSent(env, statusRequestId, statusValue);
  }
  return { ok: true };
}

const ORDER_UPDATE_FIELDS = [
  "name",
  "email",
  "phone",
  "product_name",
  "product_url",
  "design_code",
  "metal",
  "metal_weight",
  "metal_weight_adjustment",
  "stone",
  "stone_weight",
  "size",
  "price",
  "timeline",
  "timeline_adjustment_weeks",
  "address_line1",
  "address_line2",
  "city",
  "state",
  "postal_code",
  "country",
] as const;

const ORDER_DETAILS_UPDATE_FIELDS = [
  "payment_url",
  "shipping_method",
  "shipping_carrier",
  "tracking_number",
  "tracking_url",
  "shipping_status",
  "shipping_notes",
  "delivery_eta",
  "certificates",
  "care_details",
  "warranty_details",
  "service_details",
] as const;

const REQUIRED_SHIPPING_DETAILS_FIELDS = [
  "shipping_carrier",
  "tracking_number",
  "certificates",
  "care_details",
  "warranty_details",
  "service_details",
] as const;

const QUOTE_UPDATE_FIELDS = [
  "name",
  "email",
  "phone",
  "product_name",
  "product_url",
  "design_code",
  "metal",
  "metal_weight",
  "stone",
  "stone_weight",
  "diamond_breakdown",
  "size",
  "price",
  "timeline",
  "timeline_adjustment_weeks",
  "address_line1",
  "address_line2",
  "city",
  "state",
  "postal_code",
  "country",
  "quote_metal_options",
  "quote_option_1_clarity",
  "quote_option_1_color",
  "quote_option_1_price_18k",
  "quote_option_2_clarity",
  "quote_option_2_color",
  "quote_option_2_price_18k",
  "quote_option_3_clarity",
  "quote_option_3_color",
  "quote_option_3_price_18k",
  "quote_discount_type",
  "quote_discount_percent",
  "quote_token",
  "quote_expires_at",
  "quote_sent_at",
  "quote_selected_metal",
  "quote_selected_option",
  "quote_selected_price",
] as const;

const PRICE_CHART_UPDATE_FIELDS = ["metal", "adjustment_type", "adjustment_value", "notes"] as const;
const COST_CHART_UPDATE_FIELDS = ["key", "value", "unit", "notes"] as const;
const DIAMOND_PRICE_CHART_UPDATE_FIELDS = [
  "clarity",
  "color",
  "weight_min",
  "weight_max",
  "price_per_ct",
  "notes",
] as const;
const PRODUCT_UPDATE_FIELDS = PRODUCTS_SHEET_HEADER;
const INSPIRATION_UPDATE_FIELDS = INSPIRATIONS_SHEET_HEADER;
const MEDIA_LIBRARY_UPDATE_FIELDS = MEDIA_LIBRARY_SHEET_HEADER;
const PRODUCT_MEDIA_UPDATE_FIELDS = PRODUCT_MEDIA_SHEET_HEADER;
const INSPIRATION_MEDIA_UPDATE_FIELDS = INSPIRATION_MEDIA_SHEET_HEADER;
const CATALOG_NOTES_HEADER = [
  "id",
  "catalog_id",
  "catalog_slug",
  "kind",
  "note",
  "sort_order",
  "created_at",
  "updated_at",
];
const CATALOG_NOTES_UPDATE_FIELDS = [
  "catalog_id",
  "catalog_slug",
  "kind",
  "note",
  "sort_order",
] as const;
const CATALOG_STONE_OPTIONS_HEADER = [
  "id",
  "catalog_id",
  "role",
  "carat",
  "count",
  "is_primary",
  "size_type",
  "created_at",
  "updated_at",
  "shape",
];
const CATALOG_STONE_OPTIONS_UPDATE_FIELDS = [
  "catalog_id",
  "role",
  "carat",
  "count",
  "is_primary",
  "size_type",
  "shape",
] as const;
const CATALOG_METAL_OPTIONS_HEADER = [
  "id",
  "catalog_id",
  "metal_weight",
  "is_primary",
  "size_type",
  "created_at",
  "updated_at",
];
const CATALOG_METAL_OPTIONS_UPDATE_FIELDS = [
  "catalog_id",
  "metal_weight",
  "is_primary",
  "size_type",
] as const;
const SITE_CONFIG_UPDATE_FIELDS = ["key", "value"];

const CONTACT_UPDATE_FIELDS = [
  "name",
  "email",
  "phone",
  "source",
  "contact_preference",
  "interests",
  "page_url",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "referrer",
  "address_line1",
  "address_line2",
  "city",
  "state",
  "postal_code",
  "country",
  "subscription_status",
] as const;

function coerceUpdates(
  fields: unknown,
  allowed: readonly string[]
) {
  const updates: Record<string, string> = {};
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return updates;
  Object.entries(fields).forEach(([key, value]) => {
    if (!allowed.includes(key)) return;
    updates[key] = getString(value);
  });
  return updates;
}

function resolveOrderStatus(action: string, status: string) {
  if (status) return status;
  switch (action) {
    case "request_confirmation":
      return "PENDING_CONFIRMATION";
    case "send_invoice":
      return "INVOICED";
    case "mark_invoice_expired":
      return "INVOICE_EXPIRED";
    case "mark_paid":
      return "INVOICE_PAID";
    case "mark_processing":
      return "PROCESSING";
    case "mark_shipped":
      return "SHIPPED";
    case "mark_delivered":
      return "DELIVERED";
    case "cancel":
      return "CANCELLED";
    case "acknowledge":
      return "ACKNOWLEDGED";
    default:
      return "";
  }
}

const ORDER_STATUS_FLOW: Record<string, string[]> = {
  NEW: ["ACKNOWLEDGED", "CANCELLED"],
  ACKNOWLEDGED: ["PENDING_CONFIRMATION", "INVOICED", "CANCELLED"],
  PENDING_CONFIRMATION: ["INVOICED", "CANCELLED"],
  INVOICED: ["INVOICE_PAID", "INVOICE_EXPIRED", "CANCELLED"],
  INVOICE_EXPIRED: ["INVOICED", "CANCELLED"],
  INVOICE_PAID: ["PROCESSING", "SHIPPED"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: ["INVOICED"],
};

function normalizeOrderStatus(value: string) {
  const normalized = getString(value).toUpperCase();
  return normalized === "INVOICE_NOT_PAID" ? "INVOICE_EXPIRED" : normalized;
}

function normalizeQuoteStatus(value: string) {
  const normalized = getString(value).toUpperCase();
  if (normalized === "CONVERTED") return "QUOTE_ACTIONED";
  return normalized;
}

function getOrderStatusFromRow(lookup: SheetRowLookup) {
  const statusIdx = lookup.headerIndex.get("status");
  const rawStatus = statusIdx === undefined ? "" : getString(lookup.row[statusIdx]);
  return normalizeOrderStatus(rawStatus) || "NEW";
}

function isOrderTransitionAllowed(currentStatus: string, nextStatus: string) {
  const normalizedCurrent = normalizeOrderStatus(currentStatus) || "NEW";
  const normalizedNext = normalizeOrderStatus(nextStatus);
  if (!normalizedNext) return false;
  const allowed = ORDER_STATUS_FLOW[normalizedCurrent] || [];
  return allowed.includes(normalizedNext);
}

function resolveQuoteStatus(action: string, status: string) {
  if (status) return normalizeQuoteStatus(status);
  switch (action) {
    case "submit_quote":
    case "refresh_quote":
      return "QUOTED";
    case "convert_to_order":
    case "mark_actioned":
      return "QUOTE_ACTIONED";
    case "drop":
      return "DROPPED";
    case "acknowledge":
      return "ACKNOWLEDGED";
    default:
      return "";
  }
}

function resolveContactStatus(action: string, status: string) {
  if (status) return status;
  switch (action) {
    case "mark_pending":
      return "PENDING";
    case "mark_resolved":
      return "RESOLVED";
    default:
      return "";
  }
}

async function updateAdminRow(
  env: Env,
  kind: "order" | "quote" | "contact",
  requestId: string,
  status: string,
  notes: string,
  updates: Record<string, string>
) {
  if (hasD1(env)) {
    const table = kind === "order" ? "orders" : kind === "quote" ? "quotes" : "contacts";
    const now = new Date().toISOString();
    const updatesToApply: Record<string, string> = { ...updates };
    if (status) {
      updatesToApply.status = status;
      updatesToApply.status_updated_at = now;
    }
    if (notes) updatesToApply.notes = notes;
    updatesToApply.last_error = "";
    updatesToApply.updated_at = now;

    const entries = Object.entries(updatesToApply).filter(([, value]) => value !== undefined);
    if (!entries.length) {
      return { ok: false, error: "no_updates" };
    }
    const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
    const values = entries.map(([, value]) => value);

    let normalizedRequestId = kind === "contact" ? requestId.trim() : normalizeRequestId(requestId);
    if (!normalizedRequestId) return { ok: false, error: "missing_request_id" };

    let result = await d1Run(
      env,
      `UPDATE ${table} SET ${setClause} WHERE LOWER(request_id) = LOWER(?)`,
      [...values, normalizedRequestId]
    );
    let changes = (result as { changes?: number }).changes || 0;
    if (!changes && kind === "contact" && normalizedRequestId.includes("@")) {
      result = await d1Run(env, `UPDATE ${table} SET ${setClause} WHERE email = ?`, [
        ...values,
        normalizeEmailAddress(normalizedRequestId),
      ]);
      changes = (result as { changes?: number }).changes || 0;
    }

    if (!changes) {
      // UPDATE can report zero changes even when the row exists but values are unchanged.
      const exists = await d1All(env, `SELECT 1 FROM ${table} WHERE LOWER(request_id) = LOWER(?) LIMIT 1`, [
        normalizedRequestId,
      ]);
      if (!exists.length) {
        return { ok: false, error: "request_not_found" };
      }
    }
    return { ok: true, status: status || undefined };
  }
  const config = getSheetConfig(env, kind);
  const headerFallback =
    kind === "order" ? ORDER_SHEET_HEADER : kind === "quote" ? QUOTE_SHEET_HEADER : CONTACT_SHEET_HEADER;
  const cacheKey = `sheet_header:${config.sheetId}:${config.sheetName}`;
  await ensureSheetHeader(env, config, headerFallback, cacheKey);
  const headerRows = await fetchSheetValues(env, config.sheetId, config.headerRange);
  const headerRow = headerRows[0] && headerRows[0].length ? headerRows[0] : [];
  const requiredKey = kind === "contact" ? "email" : "request_id";
  const headerConfig = resolveHeaderConfig(headerRow, headerFallback, requiredKey);
  const headerIndex = new Map(
    headerConfig.header.map((key, idx) => [String(key || ""), idx])
  );
  const requestIdx = headerIndex.get("request_id") ?? -1;
  if (requestIdx < 0) return { ok: false, error: "missing_request_id_column" };
  const rows = await fetchSheetValues(
    env,
    config.sheetId,
    `${config.sheetName}!A${headerConfig.rowStart}:AZ`
  );
  const normalizedTarget = normalizeRequestId(requestId);
  let rowNumber = -1;
  for (let i = 0; i < rows.length; i += 1) {
    const candidate = normalizeRequestId(getString(rows[i]?.[requestIdx]));
    if (candidate && candidate === normalizedTarget) {
      rowNumber = i + headerConfig.rowStart;
      break;
    }
  }
  if (rowNumber < 0) return { ok: false, error: "request_not_found" };

  const now = new Date().toISOString();
  const updatesToApply: Record<string, string> = { ...updates };
  if (status) {
    updatesToApply.status = status;
    updatesToApply.status_updated_at = now;
  }
  if (notes) updatesToApply.notes = notes;
  updatesToApply.last_error = "";

  await updateSheetColumns(env, config, headerIndex, rowNumber, updatesToApply);
  return { ok: true, status: status || undefined };
}

async function updatePricingRow(
  env: Env,
  kind: "price_chart" | "cost_chart" | "diamond_price_chart",
  rowNumber: number,
  updates: Record<string, string>
) {
  if (hasD1(env)) {
    if (!Number.isFinite(rowNumber)) return;
    const table = kind === "price_chart" ? "price_chart" : kind === "cost_chart" ? "cost_chart" : "diamond_price_chart";
    const entries = Object.entries(updates).filter(([, value]) => value !== undefined);
    if (!entries.length) return;
    const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
    const values = entries.map(([, value]) => value);
    await d1Run(env, `UPDATE ${table} SET ${setClause} WHERE id = ?`, [...values, rowNumber]);
    return;
  }
  const config = getPricingSheetConfig(env, kind);
  if (!config) {
    throw new Error("pricing_sheet_missing");
  }
  const headerFallback =
    kind === "price_chart"
      ? PRICE_CHART_HEADER
      : kind === "cost_chart"
      ? COST_CHART_HEADER
      : DIAMOND_PRICE_CHART_HEADER;
  const cacheKey = `sheet_header:${config.sheetId}:${config.sheetName}`;
  await ensureSheetHeader(env, config, headerFallback, cacheKey);
  const headerRows = await fetchSheetValues(env, config.sheetId, config.headerRange);
  const headerRow = headerRows[0] && headerRows[0].length ? headerRows[0] : [];
  const requiredKey =
    kind === "price_chart" ? "metal" : kind === "cost_chart" ? "key" : "price_per_ct";
  const headerConfig = resolveHeaderConfig(headerRow, headerFallback, requiredKey);
  const headerIndex = new Map(headerConfig.header.map((key, idx) => [String(key || ""), idx]));
  await updateSheetColumns(env, config, headerIndex, rowNumber, updates);
}

async function appendPricingRow(
  env: Env,
  kind: "price_chart" | "cost_chart" | "diamond_price_chart",
  updates: Record<string, string>
) {
  if (hasD1(env)) {
    const table = kind === "price_chart" ? "price_chart" : kind === "cost_chart" ? "cost_chart" : "diamond_price_chart";
    const header =
      kind === "price_chart"
        ? PRICE_CHART_HEADER
        : kind === "cost_chart"
        ? COST_CHART_HEADER
        : DIAMOND_PRICE_CHART_HEADER;
    const columns = header.filter((key) => key !== "");
    const values = columns.map((key) => updates[key] || "");
    const placeholders = columns.map(() => "?").join(", ");
    await d1Run(env, `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`, values);
    return;
  }
  const config = getPricingSheetConfig(env, kind);
  if (!config) {
    throw new Error("pricing_sheet_missing");
  }
  const headerFallback =
    kind === "price_chart"
      ? PRICE_CHART_HEADER
      : kind === "cost_chart"
      ? COST_CHART_HEADER
      : DIAMOND_PRICE_CHART_HEADER;
  const cacheKey = `sheet_header:${config.sheetId}:${config.sheetName}`;
  await ensureSheetHeader(env, config, headerFallback, cacheKey);
  const headerRows = await fetchSheetValues(env, config.sheetId, config.headerRange);
  const headerRow = headerRows[0] && headerRows[0].length ? headerRows[0] : [];
  const requiredKey =
    kind === "price_chart" ? "metal" : kind === "cost_chart" ? "key" : "price_per_ct";
  const headerConfig = resolveHeaderConfig(headerRow, headerFallback, requiredKey);
  const rowValues = headerConfig.header.map((key) => (key ? updates[key] || "" : ""));
  await appendSheetRow(env, config, rowValues, headerConfig.header);
}

async function updateCatalogRow(
  env: Env,
  kind: "product" | "inspiration" | "media_library" | "product_media" | "inspiration_media",
  rowNumber: number | string,
  updates: Record<string, string>
) {
  if (hasD1(env)) {
    let normalizedUpdates = { ...updates };
    if (kind === "product_media" || kind === "inspiration_media") {
      const catalogSlug =
        updates.catalog_slug || updates.product_slug || updates.inspiration_slug || "";
      let catalogId = getString(updates.catalog_id || "");
      if (!catalogId && catalogSlug) {
        const catalogType = kind === "product_media" ? "product" : "inspiration";
        const rows = await d1All(
          env,
          "SELECT id FROM catalog_items WHERE type = ? AND slug = ? LIMIT 1",
          [catalogType, catalogSlug]
        );
        catalogId = rows.length ? String(rows[0].id || "") : "";
      }
      const hasOwn = (key: string) => Object.prototype.hasOwnProperty.call(updates, key);
      const hasCatalogRef =
        hasOwn("catalog_id") || hasOwn("catalog_slug") || hasOwn("product_slug") || hasOwn("inspiration_slug");
      normalizedUpdates = {};
      if (hasCatalogRef) {
        normalizedUpdates.catalog_id = catalogId || "";
      }
      if (hasOwn("media_id")) {
        normalizedUpdates.media_id = updates.media_id;
      }
      if (hasOwn("position")) {
        normalizedUpdates.position = updates.position;
      }
      if (hasOwn("is_primary")) {
        normalizedUpdates.is_primary = updates.is_primary;
      }
      if (hasOwn("sort_order") || hasOwn("order")) {
        normalizedUpdates.sort_order = updates.sort_order || updates.order || "";
      }
    }
    const entries = Object.entries(normalizedUpdates).filter(([, value]) => value !== undefined);
    if (!entries.length) return;
    const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
    const values = entries.map(([, value]) => value);
    if (kind === "product" || kind === "inspiration") {
      const slug = updates.slug || String(rowNumber || "");
      if (!slug) return;
      await d1Run(env, `UPDATE catalog_items SET ${setClause} WHERE slug = ?`, [...values, slug]);
      return;
    }
    if (kind === "media_library") {
      const mediaId = updates.media_id || String(rowNumber || "");
      if (!mediaId) return;
      await d1Run(env, `UPDATE media_library SET ${setClause} WHERE media_id = ?`, [...values, mediaId]);
      return;
    }
    const id = Number(rowNumber);
    if (!Number.isFinite(id)) return;
    await d1Run(env, `UPDATE catalog_media SET ${setClause} WHERE id = ?`, [...values, id]);
    if (kind === "product_media" || kind === "inspiration_media") {
      const isHero = String(normalizedUpdates.position || "").toLowerCase() === "hero";
      const isPrimary = String(normalizedUpdates.is_primary || "") === "1";
      if (isHero || isPrimary) {
        const rows = await d1All(env, "SELECT catalog_id FROM catalog_media WHERE id = ? LIMIT 1", [id]);
        const catalogId = rows.length ? String(rows[0].catalog_id || "") : "";
        if (catalogId) {
          const updatesSql = [];
          const updateValues: string[] = [];
          if (isHero) {
            updatesSql.push("position = CASE WHEN position = 'hero' THEN '' ELSE position END");
          }
          updatesSql.push("is_primary = 0");
          const clause = updatesSql.join(", ");
          await d1Run(
            env,
            `UPDATE catalog_media SET ${clause} WHERE catalog_id = ? AND id <> ?`,
            [catalogId, id]
          );
        }
      }
    }
    return;
  }
  const config = getCatalogSheetConfig(env, kind);
  const headerFallback =
    kind === "product"
      ? PRODUCTS_SHEET_HEADER
      : kind === "inspiration"
      ? INSPIRATIONS_SHEET_HEADER
      : kind === "media_library"
      ? MEDIA_LIBRARY_SHEET_HEADER
      : kind === "product_media"
      ? PRODUCT_MEDIA_SHEET_HEADER
      : INSPIRATION_MEDIA_SHEET_HEADER;
  const cacheKey = `sheet_header:${config.sheetId}:${config.sheetName}`;
  await ensureSheetHeader(env, config, headerFallback, cacheKey);
  const headerRows = await fetchSheetValues(env, config.sheetId, config.headerRange);
  const headerRow = headerRows[0] && headerRows[0].length ? headerRows[0] : [];
  const requiredKey =
    kind === "product"
      ? "slug"
      : kind === "inspiration"
      ? "slug"
      : kind === "media_library"
      ? "media_id"
      : kind === "product_media"
      ? "product_slug"
      : "inspiration_slug";
  const headerConfig = resolveHeaderConfig(headerRow, headerFallback, requiredKey);
  const headerIndex = new Map(headerConfig.header.map((key, idx) => [String(key || ""), idx]));
  await updateSheetColumns(env, config, headerIndex, rowNumber, updates);
}

async function appendCatalogRow(
  env: Env,
  kind: "product" | "inspiration" | "media_library" | "product_media" | "inspiration_media",
  updates: Record<string, string>
) {
  if (hasD1(env)) {
    if (kind === "product" || kind === "inspiration") {
      const columns = kind === "product" ? PRODUCTS_SHEET_HEADER : INSPIRATIONS_SHEET_HEADER;
      const slug = updates.slug || "";
      const id = updates.id || (crypto.randomUUID ? crypto.randomUUID() : `cat_${Date.now()}`);
      const values = columns.map((key) => {
        if (key === "id") return id;
        if (key === "slug") return slug;
        if (key === "is_active") return updates.is_active || "1";
        if (key === "is_featured") return updates.is_featured || "0";
        return updates[key] || "";
      });
      const placeholders = columns.map(() => "?").join(", ");
      await d1Run(
        env,
        `INSERT INTO catalog_items (${columns.join(", ")}, type) VALUES (${placeholders}, ?)`,
        [...values, kind]
      );
      return;
    }
    if (kind === "media_library") {
      const columns = MEDIA_LIBRARY_SHEET_HEADER;
      const mediaId =
        updates.media_id || (crypto.randomUUID ? crypto.randomUUID() : `media_${Date.now()}`);
      const values = columns.map((key) => {
        if (key === "media_id") return mediaId;
        if (key === "created_at") return updates.created_at || new Date().toISOString();
        return updates[key] || "";
      });
      const placeholders = columns.map(() => "?").join(", ");
      await d1Run(env, `INSERT INTO media_library (${columns.join(", ")}) VALUES (${placeholders})`, values);
      return;
    }
    const catalogType = kind === "product_media" ? "product" : "inspiration";
    const catalogSlug =
      updates.catalog_slug ||
      updates.product_slug ||
      updates.inspiration_slug ||
      "";
    let catalogId = getString(updates.catalog_id || "");
    if (!catalogId && catalogSlug) {
      const rows = await d1All(env, "SELECT id FROM catalog_items WHERE type = ? AND slug = ? LIMIT 1", [
        catalogType,
        catalogSlug,
      ]);
      catalogId = rows.length ? String(rows[0].id || "") : "";
    }
    if (!catalogId) return;
    const isPrimary = updates.is_primary ? (parseBoolean(updates.is_primary) ? 1 : 0) : 0;
    const sortOrder = parseNumber(updates.sort_order || updates.order) ?? 0;
    const values = [
      catalogId,
      updates.media_id || "",
      updates.position || "",
      isPrimary,
      sortOrder,
    ];
    await d1Run(
      env,
      "INSERT INTO catalog_media (catalog_id, media_id, position, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)",
      values
    );
    return;
  }
  const config = getCatalogSheetConfig(env, kind);
  const headerFallback =
    kind === "product"
      ? PRODUCTS_SHEET_HEADER
      : kind === "inspiration"
      ? INSPIRATIONS_SHEET_HEADER
      : kind === "media_library"
      ? MEDIA_LIBRARY_SHEET_HEADER
      : kind === "product_media"
      ? PRODUCT_MEDIA_SHEET_HEADER
      : INSPIRATION_MEDIA_SHEET_HEADER;
  const cacheKey = `sheet_header:${config.sheetId}:${config.sheetName}`;
  await ensureSheetHeader(env, config, headerFallback, cacheKey);
  const headerRows = await fetchSheetValues(env, config.sheetId, config.headerRange);
  const headerRow = headerRows[0] && headerRows[0].length ? headerRows[0] : [];
  const requiredKey =
    kind === "product"
      ? "slug"
      : kind === "inspiration"
      ? "slug"
      : kind === "media_library"
      ? "media_id"
      : kind === "product_media"
      ? "product_slug"
      : "inspiration_slug";
  const headerConfig = resolveHeaderConfig(headerRow, headerFallback, requiredKey);
  const rowValues = headerConfig.header.map((key) => (key ? updates[key] || "" : ""));
  await appendSheetRow(env, config, rowValues, headerConfig.header);
}

async function updateSheetColumns(
  env: Env,
  config: SheetConfig,
  headerIndex: Map<string, number>,
  rowNumber: number,
  updates: Record<string, string>
) {
  const tasks = Object.entries(updates).map(([key, value]) => {
    const idx = headerIndex.get(key);
    if (idx === undefined || idx < 0) return null;
    return updateSheetRow(env, config, rowNumber, idx, idx, [value]);
  });
  await Promise.all(tasks.filter(Boolean) as Array<Promise<void>>);
}

type SheetRowLookup = {
  config: SheetConfig;
  headerIndex: Map<string, number>;
  rowNumber: number;
  row: Array<unknown>;
};

async function findSheetRowByRequestId(
  env: Env,
  kind: "order" | "quote" | "contact",
  requestId: string
): Promise<SheetRowLookup | null> {
  if (hasD1(env)) {
    const normalizedRequestId = kind === "contact" ? requestId.trim() : normalizeRequestId(requestId);
    const header =
      kind === "order" ? ORDER_SHEET_HEADER : kind === "quote" ? QUOTE_SHEET_HEADER : CONTACT_SHEET_HEADER;
    const headerIndex = new Map(header.map((key, idx) => [String(key || ""), idx]));
    let rows: Record<string, unknown>[] = [];
    if (kind === "order") {
      rows = await d1All(
        env,
        "SELECT * FROM orders WHERE LOWER(request_id) = LOWER(?) LIMIT 1",
        [normalizedRequestId]
      );
    } else if (kind === "quote") {
      rows = await d1All(
        env,
        "SELECT * FROM quotes WHERE LOWER(request_id) = LOWER(?) LIMIT 1",
        [normalizedRequestId]
      );
    } else {
      rows = await d1All(
        env,
        "SELECT * FROM contacts WHERE request_id = ? LIMIT 1",
        [normalizedRequestId]
      );
      if (!rows.length && normalizedRequestId.includes("@")) {
        rows = await d1All(env, "SELECT * FROM contacts WHERE email = ? LIMIT 1", [
          normalizeEmailAddress(normalizedRequestId),
        ]);
      }
    }
  if (!rows.length) return null;
  const row = rows[0];
  const rowValues = header.map((key) => (row as Record<string, unknown>)[key]);
  return {
    config: {
        sheetId: "",
        sheetName: "",
        headerRange: "",
        appendRange: "",
      },
      headerIndex,
      rowNumber: 0,
      row: rowValues,
    };
  }
  // For orders/quotes/contacts we no longer fall back to Sheets when D1 is missing.
  return null;
}

function mapSheetRowToRecord(header: string[], row: Array<unknown>) {
  const record: Record<string, string> = {};
  header.forEach((key, idx) => {
    const normalizedKey = String(key || "").trim();
    if (!normalizedKey) return;
    record[normalizedKey] = getString(row[idx]);
  });
  return record;
}

async function findOrderDetailsRowByRequestId(
  env: Env,
  requestId: string
): Promise<SheetRowLookup | null> {
  const config = getOrderDetailsSheetConfig(env);
  const headerRows = await fetchSheetValues(env, config.sheetId, config.headerRange);
  const headerRow = headerRows[0] && headerRows[0].length ? headerRows[0] : [];
  const headerConfig = resolveHeaderConfig(headerRow, ORDER_DETAILS_SHEET_HEADER, "request_id");
  const headerIndex = new Map(headerConfig.header.map((key, idx) => [String(key || ""), idx]));
  const requestIdx = headerIndex.get("request_id") ?? -1;
  if (requestIdx < 0) return null;
  const rows = await fetchSheetValues(
    env,
    config.sheetId,
    `${config.sheetName}!A${headerConfig.rowStart}:AZ`
  );
  const normalizedTarget = normalizeRequestId(requestId);
  for (let i = 0; i < rows.length; i += 1) {
    const candidate = normalizeRequestId(getString(rows[i]?.[requestIdx]));
    if (candidate && candidate === normalizedTarget) {
      return {
        config,
        headerIndex,
        rowNumber: i + headerConfig.rowStart,
        row: rows[i],
      };
    }
  }
  return null;
}

async function getOrderDetailsRecord(env: Env, requestId: string): Promise<OrderDetailsRecord | null> {
  if (!hasD1(env)) return null;
  const normalizedRequestId = normalizeRequestId(requestId);
  const rows = await d1All(env, "SELECT * FROM order_details WHERE request_id = ? LIMIT 1", [
    normalizedRequestId,
  ]);
  if (!rows.length) return null;
  return mapD1RowToRecord(rows[0]) as OrderDetailsRecord;
}

async function loadOrderDetailsMap(env: Env) {
  const map = new Map<string, OrderDetailsRecord>();
  if (!hasD1(env)) return map;
  const rows = await d1All(env, "SELECT * FROM order_details");
  rows.forEach((row) => {
    const requestId = getString(row.request_id);
    if (!requestId) return;
    map.set(normalizeRequestId(requestId), mapD1RowToRecord(row) as OrderDetailsRecord);
  });
  return map;
}

async function upsertOrderDetailsRecord(
  env: Env,
  requestId: string,
  updates: Record<string, string>,
  status: string,
  updatedBy: string
) {
  if (hasD1(env)) {
    const now = new Date().toISOString();
    const updatesToApply: Record<string, string> = { ...updates };
    updatesToApply.updated_at = now;
    if (updatedBy) updatesToApply.updated_by = updatedBy;
    if (status) updatesToApply.status = status;
    const columns = ["request_id", "created_at", ...Object.keys(updatesToApply)];
    const uniqueColumns = Array.from(new Set(columns));
    const values = uniqueColumns.map((key) => {
      if (key === "request_id") return normalizeRequestId(requestId);
      if (key === "created_at") return updatesToApply.created_at || now;
      return updatesToApply[key] || "";
    });
    const placeholders = uniqueColumns.map(() => "?").join(", ");
    const updateSet = uniqueColumns
      .filter((key) => key !== "request_id" && key !== "created_at")
      .map((key) => `${key} = excluded.${key}`)
      .join(", ");
    await d1Run(
      env,
      `INSERT INTO order_details (${uniqueColumns.join(", ")}) VALUES (${placeholders}) ON CONFLICT(request_id) DO UPDATE SET ${updateSet}`,
      values
    );
    return;
  }
  const config = getOrderDetailsSheetConfig(env);
  const cacheKey = `sheet_header:${config.sheetId}:${config.sheetName}`;
  await ensureSheetHeader(env, config, ORDER_DETAILS_SHEET_HEADER, cacheKey, true);
  const headerRows = await fetchSheetValues(env, config.sheetId, config.headerRange);
  let headerRow = headerRows[0] && headerRows[0].length ? headerRows[0] : [];
  if (headerRow.length) {
    const normalized = headerRow.map((cell) => String(cell || "").trim().toLowerCase());
    const missing = ORDER_DETAILS_SHEET_HEADER.filter(
      (key) => !normalized.includes(key.toLowerCase())
    );
    if (missing.length) {
      headerRow = [...headerRow, ...missing];
      await updateSheetRow(env, config, 1, 0, headerRow.length - 1, headerRow);
    }
  }
  const headerConfig = resolveHeaderConfig(headerRow, ORDER_DETAILS_SHEET_HEADER, "request_id");
  const headerIndex = new Map(headerConfig.header.map((key, idx) => [String(key || ""), idx]));
  const lookup = await findOrderDetailsRowByRequestId(env, requestId);
  const now = new Date().toISOString();
  const updatesToApply: Record<string, string> = { ...updates };
  updatesToApply.updated_at = now;
  if (updatedBy) updatesToApply.updated_by = updatedBy;
  if (status) updatesToApply.status = status;

  if (lookup) {
    await updateSheetColumns(env, lookup.config, lookup.headerIndex, lookup.rowNumber, updatesToApply);
    return;
  }

  const createdAt = now;
  const normalizedRequestId = normalizeRequestId(requestId);
  const rowValues = ORDER_DETAILS_SHEET_HEADER.map((key) => {
    if (key === "created_at") return createdAt;
    if (key === "request_id") return normalizedRequestId;
    if (updatesToApply[key]) return updatesToApply[key];
    return "";
  });
  await appendSheetRow(env, config, rowValues, ORDER_DETAILS_SHEET_HEADER);
}

async function appendOrderNote(env: Env, requestId: string, note: string) {
  if (!note) return;
  if (hasD1(env)) {
    try {
      const normalizedRequestId = normalizeRequestId(requestId);
      const rows = await d1All(env, "SELECT notes FROM orders WHERE request_id = ? LIMIT 1", [
        normalizedRequestId,
      ]);
      if (!rows.length) return;
      const existingNotes = getString(rows[0].notes);
      const trimmed = existingNotes.trim();
      const nextNotes = trimmed ? `${trimmed}\n\n${note}` : note;
      await d1Run(env, "UPDATE orders SET notes = ?, updated_at = ? WHERE request_id = ?", [
        nextNotes,
        new Date().toISOString(),
        normalizedRequestId,
      ]);
    } catch (error) {
      logWarn("order_confirmation_note_failed", { requestId, error: String(error) });
    }
    return;
  }
  try {
    const lookup = await findSheetRowByRequestId(env, "order", requestId);
    if (!lookup) return;
    const notesIdx = lookup.headerIndex.get("notes");
    if (notesIdx === undefined || notesIdx < 0) return;
    const existingNotes = getString(lookup.row[notesIdx]);
    const trimmed = existingNotes.trim();
    const nextNotes = trimmed ? `${trimmed}\n\n${note}` : note;
    await updateSheetRow(env, lookup.config, lookup.rowNumber, notesIdx, notesIdx, [nextNotes]);
  } catch (error) {
    logWarn("order_confirmation_note_failed", { requestId, error: String(error) });
  }
}

const CATALOG_COLUMNS = [
  "id",
  "name",
  "slug",
  "description",
  "long_desc",
  "categories",
  "gender",
  "styles",
  "motifs",
  "metals",
  "stone_types",
  "design_code",
  "cut",
  "clarity",
  "color",
  "is_active",
  "is_featured",
  "tags",
] as const;

function parseCsvRecords(csv: string, source: string) {
  const rows = parseCsv(csv);
  if (!rows.length) return [];
  const headers = rows[0].map((cell) => cell.trim());
  for (const col of CATALOG_COLUMNS) {
    if (!headers.includes(col)) {
      throw new Error(`Catalog CSV missing required column: ${col} in ${source}`);
    }
  }
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => String(cell || "").trim()))
    .map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = (row[index] || "").trim();
      });
      return record;
    });
}

function parseConfigRecords(csv: string, source: string) {
  const rows = parseCsv(csv);
  if (!rows.length) return [];
  const headers = rows[0].map((cell) => cell.trim());
  if (!headers.includes("key") || !headers.includes("value")) {
    throw new Error(`Site config CSV missing key/value columns in ${source}`);
  }
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => String(cell || "").trim()))
    .map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = (row[index] || "").trim();
      });
      return record;
    });
}

function parseCsv(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === "," || char === "\t") {
      row.push(field);
      field = "";
      continue;
    }

    if (
      char === "\n" ||
      char === "\r" ||
      char === "\u000b" ||
      char === "\u000c" ||
      char === "\u0085" ||
      char === "\u2028" ||
      char === "\u2029"
    ) {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      if (input[i + 1] === "\n") {
        i += 1;
      }
      continue;
    }

    field += char;
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseCsvRecordsLoose(csv: string) {
  const rows = parseCsv(csv);
  if (!rows.length) return { headers: [], records: [] };
  const headers = rows[0].map((cell) => cell.trim().replace(/^\uFEFF/, ""));
  const records = rows
    .slice(1)
    .filter((row) => row.some((cell) => String(cell || "").trim()))
    .map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = (row[index] || "").trim();
      });
      return record;
    });
  return { headers, records };
}

function parseDelimitedRecords(input: string) {
  const normalized = input
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, ",");
  const lines = normalized
    .split(/(?:\n|\u000b|\u000c|\u0085|\u2028|\u2029)/)
    .filter((line) => line.trim().length > 0);
  if (!lines.length) return { headers: [], records: [] };
  const delimiter = ",";
  const headers = lines[0]
    .split(delimiter)
    .map((cell) => cell.trim().replace(/^\uFEFF/, ""));
  const records = lines.slice(1).map((line) => {
    const cells = line.split(delimiter);
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = (cells[index] || "").trim();
    });
    return record;
  });
  return { headers, records };
}

function parseMergedHeaderRecords(input: string, expectedHeaders: string[]) {
  const rows = parseCsv(input);
  if (!rows.length) return null;
  const headerCells = rows[0].map((cell) => cell.trim().replace(/^\uFEFF/, ""));
  const expectedLower = expectedHeaders.map((header) => header.toLowerCase());
  const headerIndexByExpected = new Map<string, number>();
  const remainderByExpected = new Map<string, string>();

  headerCells.forEach((cell, index) => {
    const lower = cell.toLowerCase();
    expectedLower.forEach((expected) => {
      if (headerIndexByExpected.has(expected)) return;
      if (lower === expected) {
        headerIndexByExpected.set(expected, index);
        remainderByExpected.set(expected, "");
      } else if (lower.startsWith(`${expected} `)) {
        headerIndexByExpected.set(expected, index);
        remainderByExpected.set(expected, cell.slice(expected.length).trim());
      }
    });
  });

  if (!expectedLower.every((expected) => headerIndexByExpected.has(expected))) return null;

  const metalKeyIndex = expectedLower.indexOf("metal");
  let groupedRecords: Record<string, string>[] = [];
  if (metalKeyIndex >= 0) {
    const metalKey = expectedLower[metalKeyIndex];
    const remainder = remainderByExpected.get(metalKey) || "";
    const metalParts = remainder
      .split(/(?=\b(?:\d{2}K|Platinum)\b)/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (metalParts.length > 1) {
      const columnParts = expectedLower.map((expected) => {
        if (expected === metalKey) return metalParts;
        const value = remainderByExpected.get(expected) || "";
        const parts = value.split(/\s+/).filter(Boolean);
        return parts.length === metalParts.length ? parts : Array(metalParts.length).fill(value);
      });
      for (let i = 0; i < metalParts.length; i += 1) {
        const record: Record<string, string> = {};
        expectedHeaders.forEach((header, idx) => {
          record[header] = columnParts[idx][i] || "";
        });
        groupedRecords.push(record);
      }
    }
  }

  if (!groupedRecords.length) {
    const record: Record<string, string> = {};
    expectedHeaders.forEach((header, idx) => {
      const expected = expectedLower[idx];
      record[header] = remainderByExpected.get(expected) || "";
    });
    groupedRecords = [record];
  }

  const remainingRecords = rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    expectedHeaders.forEach((header) => {
      const expected = header.toLowerCase();
      const index = headerIndexByExpected.get(expected) ?? -1;
      record[header] = index >= 0 ? (row[index] || "").trim() : "";
    });
    return record;
  });

  return {
    headers: expectedHeaders,
    records: [...groupedRecords, ...remainingRecords].filter((record) =>
      Object.values(record).some((value) => String(value || "").trim())
    ),
  };
}

function parseList(value: string | undefined) {
  if (!value) return [];
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumber(value: string | undefined) {
  if (value === undefined || value === null) return undefined;
  const trimmed = value.toString().trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBoolean(value: string | undefined) {
  if (!value) return false;
  return ["true", "1", "yes", "y"].includes(value.trim().toLowerCase());
}

function normalizeStoneType(value: string) {
  return value
    .replace(/diamond\(s\)/gi, "Diamond")
    .replace(/diamonds?\b/gi, "Diamond")
    .replace(/\s+/g, " ")
    .trim();
}

function parseStoneTypes(value: string | undefined) {
  return parseList(value).map(normalizeStoneType).filter(Boolean);
}

function buildSheetsCsvUrl(sheetId: string, gid: string) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

function buildSheetsCsvUrlByName(sheetId: string, sheetName: string) {
  const encoded = encodeURIComponent(sheetName);
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encoded}`;
}

function getCatalogUrl(
  env: Env,
  kind: "products" | "inspirations" | "site_config" | "media_library" | "product_media" | "inspiration_media"
) {
  const direct =
    kind === "products"
      ? env.CATALOG_PRODUCTS_URL || env.PRODUCTS_CSV_URL
      : kind === "inspirations"
      ? env.CATALOG_INSPIRATIONS_URL || env.INSPIRATIONS_CSV_URL
      : kind === "site_config"
      ? env.CATALOG_SITE_CONFIG_URL || env.SITE_CONFIG_CSV_URL
      : kind === "media_library"
      ? env.CATALOG_MEDIA_LIBRARY_URL || env.MEDIA_LIBRARY_CSV_URL
      : kind === "product_media"
      ? env.CATALOG_PRODUCT_MEDIA_URL || env.PRODUCT_MEDIA_CSV_URL
      : env.CATALOG_INSPIRATION_MEDIA_URL || env.INSPIRATION_MEDIA_CSV_URL;
  if (direct) return direct;
  const sheetId = env.CATALOG_SHEET_ID;
  const gid =
    kind === "products"
      ? env.CATALOG_PRODUCTS_GID
      : kind === "inspirations"
      ? env.CATALOG_INSPIRATIONS_GID
      : kind === "site_config"
      ? env.CATALOG_SITE_CONFIG_GID
      : kind === "media_library"
      ? env.CATALOG_MEDIA_LIBRARY_GID
      : kind === "product_media"
      ? env.CATALOG_PRODUCT_MEDIA_GID
      : env.CATALOG_INSPIRATION_MEDIA_GID;
  if (sheetId && gid) {
    return buildSheetsCsvUrl(sheetId, gid);
  }
  return "";
}

type MediaLibraryEntry = {
  media_id: string;
  url: string;
  media_type: string;
  label?: string;
  alt?: string;
  description?: string;
};

type MediaMapping = {
  media_id: string;
  position?: string;
  is_primary?: boolean;
  order?: number;
  product_slug?: string;
  inspiration_slug?: string;
};

const MEDIA_POSITION_ORDER = [
  "hero",
  "pendant",
  "earring",
  "bracelet",
  "ring",
  "composition",
  "feature",
  "engraving",
  "gallery",
  "detail",
];

function slugifyMediaId(value: string) {
  const cleaned = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "media";
}

function parseDelimitedSlugs(value: string) {
  return value
    .split("|")
    .map((slug) => slug.trim())
    .filter(Boolean);
}

function normalizeMediaPosition(value: string) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "earrings") return "earring";
  if (normalized === "bangle" || normalized === "bangles") return "bracelet";
  if (normalized === "rings") return "ring";
  return normalized;
}

function sortMediaMappings(a: MediaMapping, b: MediaMapping) {
  const primaryA = a.is_primary ? 0 : 1;
  const primaryB = b.is_primary ? 0 : 1;
  if (primaryA !== primaryB) return primaryA - primaryB;
  const positionA = MEDIA_POSITION_ORDER.indexOf(normalizeMediaPosition(a.position || ""));
  const positionB = MEDIA_POSITION_ORDER.indexOf(normalizeMediaPosition(b.position || ""));
  if (positionA !== positionB) {
    const safeA = positionA === -1 ? 99 : positionA;
    const safeB = positionB === -1 ? 99 : positionB;
    if (safeA !== safeB) return safeA - safeB;
  }
  const orderA = Number.isFinite(a.order) ? a.order : 0;
  const orderB = Number.isFinite(b.order) ? b.order : 0;
  if (orderA !== orderB) return orderA - orderB;
  return String(a.media_id || "").localeCompare(String(b.media_id || ""));
}

function buildMediaUrl(raw: string) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "";
  return trimmed;
}

async function loadCatalogMedia(env: Env, include: Set<string>) {
  if (hasD1(env)) {
    const needsLibrary =
      include.has("media_library") ||
      include.has("product_media") ||
      include.has("inspiration_media") ||
      include.has("products") ||
      include.has("inspirations");
    if (!needsLibrary) {
      return {
        library: [] as MediaLibraryEntry[],
        productMedia: [] as MediaMapping[],
        inspirationMedia: [] as MediaMapping[],
      };
    }
    const libraryRows = await d1All(
      env,
      "SELECT media_id, url, media_type, label, alt, description FROM media_library"
    );
    const library = libraryRows
      .map((row) => ({
        media_id: String(row.media_id || "").trim(),
        url: buildMediaUrl(row.url || ""),
        media_type: String(row.media_type || "image").trim(),
        label: String(row.label || ""),
        alt: String(row.alt || ""),
        description: String(row.description || ""),
      }))
      .filter((entry) => entry.media_id && entry.url);

    const productMediaRows =
      include.has("product_media") || include.has("products")
        ? await d1All(
            env,
            `SELECT
               catalog_media.media_id,
               catalog_items.slug AS catalog_slug,
               catalog_media.position,
               catalog_media.is_primary,
               catalog_media.sort_order
             FROM catalog_media
             JOIN catalog_items ON catalog_items.id = catalog_media.catalog_id
             WHERE catalog_items.type = 'product'`
          )
        : [];
    const inspirationMediaRows =
      include.has("inspiration_media") || include.has("inspirations")
        ? await d1All(
            env,
            `SELECT
               catalog_media.media_id,
               catalog_items.slug AS catalog_slug,
               catalog_media.position,
               catalog_media.is_primary,
               catalog_media.sort_order
             FROM catalog_media
             JOIN catalog_items ON catalog_items.id = catalog_media.catalog_id
             WHERE catalog_items.type = 'inspiration'`
          )
        : [];

    const productMedia = productMediaRows
      .map((row) => ({
        media_id: String(row.media_id || "").trim(),
        product_slug: String(row.catalog_slug || "").trim(),
        position: String(row.position || ""),
        is_primary: Boolean(row.is_primary),
        order: typeof row.sort_order === "number" ? row.sort_order : parseNumber(String(row.sort_order || "")),
      }))
      .filter((entry) => entry.media_id && entry.product_slug);

    const inspirationMedia = inspirationMediaRows
      .map((row) => ({
        media_id: String(row.media_id || "").trim(),
        inspiration_slug: String(row.catalog_slug || "").trim(),
        position: String(row.position || ""),
        is_primary: Boolean(row.is_primary),
        order: typeof row.sort_order === "number" ? row.sort_order : parseNumber(String(row.sort_order || "")),
      }))
      .filter((entry) => entry.media_id && entry.inspiration_slug);

    return { library, productMedia, inspirationMedia };
  }

  const needsLibrary =
    include.has("media_library") ||
    include.has("product_media") ||
    include.has("inspiration_media") ||
    include.has("products") ||
    include.has("inspirations");
  if (!needsLibrary) {
    return { library: [] as MediaLibraryEntry[], productMedia: [] as MediaMapping[], inspirationMedia: [] as MediaMapping[] };
  }
  const librarySource = getCatalogUrl(env, "media_library");
  const productSource = getCatalogUrl(env, "product_media");
  const inspirationSource = getCatalogUrl(env, "inspiration_media");

  const [libraryCsv, productCsv, inspirationCsv] = await Promise.all([
    librarySource ? fetchText(librarySource).catch(() => "") : Promise.resolve(""),
    productSource ? fetchText(productSource).catch(() => "") : Promise.resolve(""),
    inspirationSource ? fetchText(inspirationSource).catch(() => "") : Promise.resolve(""),
  ]);

  const library = libraryCsv
    ? parseCsvRecordsLoose(libraryCsv).records
        .map((row) => ({
          media_id: String(row.media_id || row.id || "").trim(),
          url: buildMediaUrl(row.url || ""),
          media_type: String(row.media_type || row.type || "image").trim(),
          label: row.label || "",
          alt: row.alt || "",
          description: row.description || "",
        }))
        .filter((entry) => entry.media_id && entry.url)
    : [];

  const productMedia = productCsv
    ? parseCsvRecordsLoose(productCsv).records
        .map((row) => ({
          media_id: String(row.media_id || "").trim(),
          product_slug: String(row.product_slug || row.product_slugs || "").trim(),
          position: row.position || "",
          is_primary: parseBoolean(row.is_primary),
          order: parseNumber(row.order),
        }))
        .filter((entry) => entry.media_id && entry.product_slug)
    : [];

  const inspirationMedia = inspirationCsv
    ? parseCsvRecordsLoose(inspirationCsv).records
        .map((row) => ({
          media_id: String(row.media_id || "").trim(),
          inspiration_slug: String(row.inspiration_slug || row.inspiration_slugs || "").trim(),
          position: row.position || "",
          is_primary: parseBoolean(row.is_primary),
          order: parseNumber(row.order),
        }))
        .filter((entry) => entry.media_id && entry.inspiration_slug)
    : [];

  return { library, productMedia, inspirationMedia };
}

type NotesBucket = {
  takeaways: string[];
  translationNotes: string[];
  description: string;
  longDesc: string;
};

type CatalogNotesState = {
  byId: Map<string, NotesBucket>;
  bySlug: Map<string, NotesBucket>;
};

function buildNotesBucket(): NotesBucket {
  return { takeaways: [], translationNotes: [], description: "", longDesc: "" };
}

function addCatalogNote(map: Map<string, NotesBucket>, key: string, kind: string, note: string) {
  if (!key || !note) return;
  const bucket = map.get(key) || buildNotesBucket();
  if (kind === "takeaway") {
    bucket.takeaways.push(note);
  } else if (kind === "translation_note") {
    bucket.translationNotes.push(note);
  } else if (kind === "description" && !bucket.description) {
    bucket.description = note;
  } else if (kind === "long_desc" && !bucket.longDesc) {
    bucket.longDesc = note;
  }
  map.set(key, bucket);
}

function resolveCatalogNotes(
  notes: CatalogNotesState,
  catalogId: string,
  catalogSlug: string
) {
  if (catalogId && notes.byId.has(catalogId)) {
    return notes.byId.get(catalogId) || buildNotesBucket();
  }
  const slugKey = catalogSlug.toLowerCase();
  return notes.bySlug.get(slugKey) || buildNotesBucket();
}

async function loadCatalogNotes(env: Env): Promise<CatalogNotesState> {
  const empty = { byId: new Map<string, NotesBucket>(), bySlug: new Map<string, NotesBucket>() };
  if (!hasD1(env)) return empty;
  const rows = await d1All(
    env,
    "SELECT catalog_id, catalog_slug, kind, note FROM catalog_notes ORDER BY sort_order, created_at"
  );
  rows.forEach((row) => {
    const id = String(row.catalog_id || "");
    const slug = String(row.catalog_slug || "");
    const kind = String(row.kind || "");
    const note = String(row.note || "");
    if (id) addCatalogNote(empty.byId, id, kind, note);
    if (slug) addCatalogNote(empty.bySlug, slug.toLowerCase(), kind, note);
  });
  return empty;
}

async function loadCatalogPayload(env: Env, params: URLSearchParams) {
  const includeParam = (params.get("include") || "").trim();
  const includeAll = !includeParam;
  const include = new Set(
    includeAll
      ? [
          "products",
          "inspirations",
          "site_config",
          "media_library",
          "product_media",
          "inspiration_media",
        ]
      : includeParam
          .split(",")
          .map((entry) => entry.trim().toLowerCase())
          .filter(Boolean)
  );

  const payload: Record<string, unknown> = {
    ok: true,
    generatedAt: new Date().toISOString(),
  };
  const slugParam = (params.get("slug") || "").trim().toLowerCase();

    if (hasD1(env)) {
      const mediaState = await loadCatalogMedia(env, include);
      const mediaById = new Map(mediaState.library.map((entry) => [entry.media_id, entry]));
      const stoneOptionsById = new Map<string, Record<string, unknown>[]>();
      const metalOptionsById = new Map<string, Record<string, unknown>[]>();
      const notesState =
        include.has("products") || include.has("inspirations")
          ? await loadCatalogNotes(env)
          : { byId: new Map(), bySlug: new Map() };
      if (include.has("products") || include.has("inspirations")) {
        const stoneRows = await d1All(env, "SELECT * FROM catalog_stone_options");
        stoneRows.forEach((row) => {
          const option = {
            id: String(row.id || ""),
            catalog_id: String(row.catalog_id || ""),
            role: String(row.role || ""),
            carat: parseNumber(String(row.carat || "")),
            count: parseNumber(String(row.count || "")),
            is_primary: Boolean(row.is_primary),
            size_type: String(row.size_type || ""),
            shape: String(row.shape || ""),
          };
          if (option.catalog_id) {
            const list = stoneOptionsById.get(option.catalog_id) || [];
            list.push(option);
            stoneOptionsById.set(option.catalog_id, list);
          }
        });
        const metalRows = await d1All(env, "SELECT * FROM catalog_metal_options");
        metalRows.forEach((row) => {
          const option = {
            id: String(row.id || ""),
            catalog_id: String(row.catalog_id || ""),
            metal_weight: String(row.metal_weight || ""),
            is_primary: Boolean(row.is_primary),
            size_type: String(row.size_type || ""),
          };
          if (option.catalog_id) {
            const list = metalOptionsById.get(option.catalog_id) || [];
            list.push(option);
            metalOptionsById.set(option.catalog_id, list);
          }
        });
      }

      if (include.has("products")) {
        let productSql = "SELECT * FROM catalog_items WHERE type = 'product' AND is_active = 1";
        const productParams: unknown[] = [];
        if (slugParam) {
          productSql += " AND lower(slug) = ?";
          productParams.push(slugParam);
        }
        const rows = await d1All(env, productSql, productParams);
      const products = rows.map((row) => {
        const categories = parseJsonList(String(row.categories || ""));
        const metals = parseJsonList(String(row.metals || ""));
        const productSlug = String(row.slug || "");
        const notes = resolveCatalogNotes(notesState, String(row.id || ""), productSlug);
        const productMedia = mediaState.productMedia
          .filter((entry) => {
            const slugs = parseDelimitedSlugs(entry.product_slug || "");
            return slugs.some((slug) => slug.toLowerCase() === productSlug.toLowerCase());
          })
          .sort(sortMediaMappings);
          const resolvedMedia = productMedia
            .map((entry) => {
              const media = mediaById.get(entry.media_id);
              if (!media) return null;
              return {
                ...entry,
                url: media.url,
                media_type: media.media_type,
                label: media.label,
                alt: media.alt,
                description: media.description,
              };
            })
            .filter(Boolean);
          const images = resolvedMedia
            .filter((entry) => entry.media_type === "image")
            .map((entry) => entry.url);
          const heroImage = images[0] || "";
          const idKey = String(row.id || "");
          const stoneOptions = stoneOptionsById.get(idKey) || [];
          const metalOptions = metalOptionsById.get(idKey) || [];
          const metalOption =
            metalOptions.find((entry) => entry.is_primary) || metalOptions[0];
          const metalWeightValue = metalOption
            ? String((metalOption as Record<string, unknown>).metal_weight || "")
            : "";
          const metalWeightFallback = metalWeightValue || String(row.metal_weight || "");
          return {
          id: String(row.id || ""),
          name: String(row.name || ""),
          slug: productSlug,
          description: notes.description,
          long_desc: notes.longDesc,
          hero_image: heroImage,
          images,
          media: resolvedMedia,
          category: categories[0] || toPipeList(String(row.categories || "")) || String(row.category || ""),
          gender: toPipeList(String(row.gender || "")),
          design_code: String(row.design_code || ""),
          metal: metals[0] || toPipeList(String(row.metals || "")) || String(row.metal || ""),
          metal_options: toPipeList(String(row.metals || "")) || String(row.metal || ""),
          metals: metals,
          stone_types: toPipeList(String(row.stone_types || "")),
          stone_weight: parseNumber(String(row.stone_weight || "")),
          metal_weight: metalWeightFallback,
            cut: String(row.cut || ""),
            clarity: String(row.clarity || ""),
            color: String(row.color || ""),
            is_active: Boolean(row.is_active),
            is_featured: Boolean(row.is_featured),
            tags: toPipeList(String(row.tags || "")),
            stone_options: stoneOptions,
            metal_weight_options: metalOptions,
          };
        });
        payload.products = products;
      }

      if (include.has("inspirations")) {
        const rows = await d1All(
          env,
          "SELECT * FROM catalog_items WHERE type = 'inspiration' AND is_active = 1"
        );
      payload.inspirations = rows.map((row) => {
        const inspirationSlug = String(row.slug || "");
        const notes = resolveCatalogNotes(notesState, String(row.id || ""), inspirationSlug);
        const idKey = String(row.id || "");
        const stoneOptions = stoneOptionsById.get(idKey) || [];
        const metalOptions = metalOptionsById.get(idKey) || [];
        const metalOption =
          metalOptions.find((entry) => entry.is_primary) || metalOptions[0];
        const metalWeightValue = metalOption
          ? String((metalOption as Record<string, unknown>).metal_weight || "")
          : "";
        const inspirationMedia = mediaState.inspirationMedia
          .filter((entry) => {
            const slugs = parseDelimitedSlugs(entry.inspiration_slug || "");
            return slugs.some((slug) => slug.toLowerCase() === inspirationSlug.toLowerCase());
          })
          .sort(sortMediaMappings);
        const resolvedMedia = inspirationMedia
          .map((entry) => {
            const media = mediaById.get(entry.media_id);
            if (!media) return null;
            return {
              ...entry,
              url: media.url,
              media_type: media.media_type,
              label: media.label,
              alt: media.alt,
              description: media.description,
            };
          })
          .filter(Boolean);
        const images = resolvedMedia
          .filter((entry) => entry.media_type === "image")
          .map((entry) => entry.url);
        const heroImage = images[0] || "";
        return {
          id: String(row.id || ""),
          title: String(row.name || ""),
          slug: inspirationSlug,
          heroImage,
          images,
          media: resolvedMedia,
          description: notes.description,
          longDesc: notes.longDesc,
          stoneTypes: parseStoneTypes(toPipeList(String(row.stone_types || ""))),
          stoneWeight: parseNumber(String(row.stone_weight || "")),
          metalWeight: metalWeightValue,
          metalWeightOptions: metalOptions,
          tags: parseList(toPipeList(String(row.tags || ""))),
          categories: parseList(toPipeList(String(row.categories || ""))),
          genders: parseList(toPipeList(String(row.gender || ""))),
          styles: parseList(toPipeList(String(row.styles || ""))),
          motifs: parseList(toPipeList(String(row.motifs || ""))),
          metals: parseList(toPipeList(String(row.metals || ""))),
          takeaways: notes.takeaways,
          translationNotes: notes.translationNotes,
          designCode: String(row.design_code || ""),
        };
      });
    }

    if (include.has("media_library")) {
      payload.media_library = mediaState.library;
    }
    if (include.has("product_media")) {
      payload.product_media = mediaState.productMedia;
    }
    if (include.has("inspiration_media")) {
      payload.inspiration_media = mediaState.inspirationMedia;
    }

    if (include.has("site_config")) {
      const rows = await d1All(env, "SELECT key, value FROM site_config");
      const config: Record<string, string> = {};
      rows.forEach((row) => {
        const key = String(row.key || "");
        if (key) config[key] = String(row.value || "");
      });
      payload.siteConfig = config;
    }
    if (include.has("cost_chart")) {
      const rows = await d1All(env, "SELECT key, value FROM cost_chart");
      const chart: Record<string, string> = {};
      rows.forEach((row) => {
        const key = String(row.key || "");
        if (key) chart[key] = String(row.value || "");
      });
      payload.costChart = chart;
    }

    return payload;
  }

  const mediaState = await loadCatalogMedia(env, include);
  const mediaById = new Map(mediaState.library.map((entry) => [entry.media_id, entry]));

  if (include.has("products")) {
    const source = getCatalogUrl(env, "products");
    if (!source) {
      throw new Error("catalog_products_source_missing");
    }
    const csv = await fetchText(source);
    const records = parseCsvRecords(csv, source);
    const products = records
      .map((row) => {
        const categories = parseList(row.categories);
        const metals = parseList(row.metals);
        const productSlug = row.slug;
        const productMedia = mediaState.productMedia
          .filter((entry) => {
            const slugs = parseDelimitedSlugs(entry.product_slug || "");
            return slugs.some((slug) => slug.toLowerCase() === String(productSlug || "").toLowerCase());
          })
          .sort(sortMediaMappings);
        const resolvedMedia = productMedia
          .map((entry) => {
            const media = mediaById.get(entry.media_id);
            if (!media) return null;
            return {
              ...entry,
              url: media.url,
              media_type: media.media_type,
              label: media.label,
              alt: media.alt,
              description: media.description,
            };
          })
          .filter(Boolean);
        const images = resolvedMedia
          .filter((entry) => entry.media_type === "image")
          .map((entry) => entry.url);
        const heroImage = images[0] || "";
        return {
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          long_desc: row.long_desc,
          hero_image: heroImage,
          images,
          media: resolvedMedia,
          category: categories[0] || row.categories || row.category || "",
          gender: row.gender || "",
          design_code: row.design_code,
          metal: metals[0] || row.metals || row.metal || "",
          stone_types: row.stone_types || "",
          stone_weight: parseNumber(row.stone_weight),
          metal_weight: parseNumber(row.metal_weight),
          cut: row.cut,
          clarity: row.clarity,
          color: row.color,
          is_active: parseBoolean(row.is_active),
          is_featured: parseBoolean(row.is_featured),
          tags: row.tags,
        };
      })
      .filter((item) => item.is_active);
    payload.products = products;
  }

  if (include.has("inspirations")) {
    const source = getCatalogUrl(env, "inspirations");
    if (!source) {
      throw new Error("catalog_inspirations_source_missing");
    }
    const csv = await fetchText(source);
    const records = parseCsvRecords(csv, source);
    payload.inspirations = records.map((row) => {
      const inspirationSlug = row.slug;
      const inspirationMedia = mediaState.inspirationMedia
        .filter((entry) => {
          const slugs = parseDelimitedSlugs(entry.inspiration_slug || "");
          return slugs.some((slug) => slug.toLowerCase() === String(inspirationSlug || "").toLowerCase());
        })
        .sort(sortMediaMappings);
      const resolvedMedia = inspirationMedia
        .map((entry) => {
          const media = mediaById.get(entry.media_id);
          if (!media) return null;
          return {
            ...entry,
            url: media.url,
            media_type: media.media_type,
            label: media.label,
            alt: media.alt,
            description: media.description,
          };
        })
        .filter(Boolean);
      const images = resolvedMedia
        .filter((entry) => entry.media_type === "image")
        .map((entry) => entry.url);
      const heroImage = images[0] || "";
      return {
        id: row.id,
        title: row.name,
        slug: row.slug,
        heroImage,
        images,
        media: resolvedMedia,
        description: row.description,
        longDesc: row.long_desc,
        stoneTypes: parseStoneTypes(row.stone_types),
        stoneWeight: parseNumber(row.stone_weight),
        metalWeight: parseNumber(row.metal_weight),
        tags: parseList(row.tags),
        categories: parseList(row.categories),
        genders: parseList(row.gender),
        styles: parseList(row.styles),
        motifs: parseList(row.motifs),
        metals: parseList(row.metals),
        takeaways: parseList(row.takeaways),
        translationNotes: parseList(row.translation_notes),
        designCode: row.design_code,
      };
    });
  }

  if (include.has("media_library")) {
    payload.media_library = mediaState.library;
  }
  if (include.has("product_media")) {
    payload.product_media = mediaState.productMedia;
  }
  if (include.has("inspiration_media")) {
    payload.inspiration_media = mediaState.inspirationMedia;
  }

  if (include.has("site_config")) {
    const source = getCatalogUrl(env, "site_config");
    if (!source) {
      throw new Error("catalog_site_config_source_missing");
    }
    const csv = await fetchText(source);
    const records = parseConfigRecords(csv, source);
    const config: Record<string, string> = {};
    records.forEach((row) => {
      if (row.key) {
        config[row.key] = row.value || "";
      }
    });
    payload.siteConfig = config;
  }

  return payload;
}

async function fetchText(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`catalog_fetch_failed:${response.status}`);
  }
  return await response.text();
}

async function discardResponse(response: Response) {
  if (!response.body) return;
  try {
    await response.body.cancel();
  } catch {
    // Ignore cancellation failures to avoid masking upstream errors.
  }
}

function isResendRateLimitError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("resend_failed:429") || normalized.includes("rate_limit_exceeded");
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

type SheetConfig = {
  sheetId: string;
  sheetName: string;
  appendRange: string;
  headerRange: string;
};

function getSheetConfig(env: Env, kind: "order" | "quote" | "contact"): SheetConfig {
  const id =
    kind === "order"
      ? env.ORDER_SHEET_ID
      : kind === "quote"
      ? env.QUOTE_SHEET_ID
      : env.CUSTOMER_TICKETS_SHEET_ID || env.CONTACTS_SHEET_ID;
  const name =
    kind === "order"
      ? env.ORDER_SHEET_NAME
      : kind === "quote"
      ? env.QUOTE_SHEET_NAME
      : env.CUSTOMER_TICKETS_SHEET_NAME || env.CONTACTS_SHEET_NAME;
  const range =
    kind === "order"
      ? env.ORDER_SHEET_RANGE
      : kind === "quote"
      ? env.QUOTE_SHEET_RANGE
      : env.CUSTOMER_TICKETS_SHEET_RANGE || env.CONTACTS_SHEET_RANGE;
  const sheetId = (id || "").trim();
  if (!sheetId) {
    throw new Error(`${kind}_sheet_missing`);
  }
  const sheetName = (name || "").trim() || (kind === "order" ? "Orders" : kind === "quote" ? "Quotes" : "Contacts");
  const appendRange = (range || "").trim() || `${sheetName}!A1`;
  const resolvedSheetName = appendRange.includes("!")
    ? appendRange.split("!")[0]
    : sheetName;
  const headerRange = `${resolvedSheetName}!A1:AZ1`;
  return { sheetId, sheetName: resolvedSheetName, appendRange, headerRange };
}

function getCatalogSheetConfig(
  env: Env,
  kind: "product" | "inspiration" | "media_library" | "product_media" | "inspiration_media"
): SheetConfig {
  const catalogSheetId = (env.CATALOG_SHEET_ID || "").trim();
  const sheetId = (
    kind === "media_library"
      ? env.MEDIA_LIBRARY_SHEET_ID || catalogSheetId
      : kind === "product_media"
      ? env.PRODUCT_MEDIA_SHEET_ID || catalogSheetId
      : kind === "inspiration_media"
      ? env.INSPIRATION_MEDIA_SHEET_ID || catalogSheetId
      : catalogSheetId
  )?.trim();
  if (!sheetId) {
    throw new Error("catalog_sheet_missing");
  }
  const sheetName =
    kind === "product"
      ? (env.CATALOG_PRODUCTS_SHEET_NAME || "products")
      : kind === "inspiration"
      ? (env.CATALOG_INSPIRATIONS_SHEET_NAME || "inspirations")
      : kind === "media_library"
      ? (env.MEDIA_LIBRARY_SHEET_NAME || "media_library")
      : kind === "product_media"
      ? (env.PRODUCT_MEDIA_SHEET_NAME || "product_media")
      : (env.INSPIRATION_MEDIA_SHEET_NAME || "inspiration_media");
  const range =
    kind === "media_library"
      ? env.MEDIA_LIBRARY_SHEET_RANGE
      : kind === "product_media"
      ? env.PRODUCT_MEDIA_SHEET_RANGE
      : kind === "inspiration_media"
      ? env.INSPIRATION_MEDIA_SHEET_RANGE
      : undefined;
  const appendRange = (range || "").trim() || `${sheetName}!A1`;
  const resolvedSheetName = appendRange.includes("!") ? appendRange.split("!")[0] : sheetName;
  const headerRange = `${resolvedSheetName}!A1:AZ1`;
  return { sheetId, sheetName: resolvedSheetName, appendRange, headerRange };
}

function getPricingSheetConfig(
  env: Env,
  kind: "price_chart" | "cost_chart" | "diamond_price_chart"
): SheetConfig | null {
  if (kind === "price_chart") return getPriceChartSheetConfig(env);
  if (kind === "cost_chart") return getCostChartSheetConfig(env);
  return getDiamondPriceChartSheetConfig(env);
}

function getOrderDetailsSheetConfig(env: Env): SheetConfig {
  const sheetId = (env.ORDER_DETAILS_SHEET_ID || "").trim();
  if (!sheetId) {
    throw new Error("order_details_sheet_missing");
  }
  const sheetName = (env.ORDER_DETAILS_SHEET_NAME || "").trim() || "order_details";
  const appendRange = (env.ORDER_DETAILS_SHEET_RANGE || "").trim() || `${sheetName}!A1`;
  const resolvedSheetName = appendRange.includes("!") ? appendRange.split("!")[0] : sheetName;
  const headerRange = `${resolvedSheetName}!A1:AZ1`;
  return { sheetId, sheetName: resolvedSheetName, appendRange, headerRange };
}

function getUnifiedContactsSheetConfig(env: Env): SheetConfig | null {
  const sheetId = (env.UNIFIED_CONTACTS_SHEET_ID || env.CONTACTS_SHEET_ID || "").trim();
  if (!sheetId) return null;
  const sheetName =
    (env.UNIFIED_CONTACTS_SHEET_NAME || env.CONTACTS_SHEET_NAME || "").trim() ||
    "contacts";
  const appendRange =
    (env.UNIFIED_CONTACTS_SHEET_RANGE || env.CONTACTS_SHEET_RANGE || "").trim() ||
    `${sheetName}!A1`;
  const resolvedSheetName = appendRange.includes("!") ? appendRange.split("!")[0] : sheetName;
  const headerRange = `${resolvedSheetName}!A1:AZ1`;
  return { sheetId, sheetName: resolvedSheetName, appendRange, headerRange };
}

function getPriceChartSheetConfig(env: Env): SheetConfig | null {
  const sheetId = (env.PRICE_CHART_SHEET_ID || "").trim();
  if (!sheetId) return null;
  const sheetName = (env.PRICE_CHART_SHEET_NAME || "").trim() || "price_chart";
  const appendRange = (env.PRICE_CHART_SHEET_RANGE || "").trim() || `${sheetName}!A1`;
  const resolvedSheetName = appendRange.includes("!") ? appendRange.split("!")[0] : sheetName;
  const headerRange = `${resolvedSheetName}!A1:AZ1`;
  return { sheetId, sheetName: resolvedSheetName, appendRange, headerRange };
}

function getCostChartSheetConfig(env: Env): SheetConfig | null {
  const sheetId = (env.COST_CHART_SHEET_ID || "").trim();
  if (!sheetId) return null;
  const sheetName = (env.COST_CHART_SHEET_NAME || "").trim() || "cost_chart";
  const appendRange = (env.COST_CHART_SHEET_RANGE || "").trim() || `${sheetName}!A1`;
  const resolvedSheetName = appendRange.includes("!") ? appendRange.split("!")[0] : sheetName;
  const headerRange = `${resolvedSheetName}!A1:AZ1`;
  return { sheetId, sheetName: resolvedSheetName, appendRange, headerRange };
}

function getDiamondPriceChartSheetConfig(env: Env): SheetConfig | null {
  const sheetId = (env.DIAMOND_PRICE_CHART_SHEET_ID || "").trim();
  if (!sheetId) return null;
  const sheetName = (env.DIAMOND_PRICE_CHART_SHEET_NAME || "").trim() || "diamonds_price_chart";
  const appendRange =
    (env.DIAMOND_PRICE_CHART_SHEET_RANGE || "").trim() || `${sheetName}!A1`;
  const resolvedSheetName = appendRange.includes("!") ? appendRange.split("!")[0] : sheetName;
  const headerRange = `${resolvedSheetName}!A1:AZ1`;
  return { sheetId, sheetName: resolvedSheetName, appendRange, headerRange };
}

async function ensureSheetHeader(
  env: Env,
  config: SheetConfig,
  headerRow: string[],
  cacheKey: string,
  forceCheck = false
) {
  if (!forceCheck && env.HEERAWALLA_ACKS) {
    const cached = await env.HEERAWALLA_ACKS.get(cacheKey);
    if (cached) return;
  }
  const token = await getAccessToken(env);
  const headerUrl = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${encodeURIComponent(config.headerRange)}`
  );
  const headerResponse = await fetch(headerUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!headerResponse.ok) {
    const errorText = await headerResponse.text();
    throw new Error(`sheet_header_check_failed:${headerResponse.status}:${errorText}`);
  }
  const headerPayload = (await headerResponse.json()) as { values?: string[][] };
  const firstRow = headerPayload.values?.[0] || [];
  const hasHeader = firstRow.some((cell) => String(cell || "").trim());
  if (!hasHeader) {
    await appendSheetRow(env, config, headerRow, headerRow, true);
  }
  if (env.HEERAWALLA_ACKS) {
    await env.HEERAWALLA_ACKS.put(cacheKey, "1", { expirationTtl: 60 * 60 * 12 });
  }
}

async function appendSheetRow(
  env: Env,
  config: SheetConfig,
  values: Array<string | number>,
  headerRow: string[],
  skipHeaderCheck = false
) {
  if (!skipHeaderCheck) {
    const cacheKey = `sheet_header:${config.sheetId}:${config.sheetName}`;
    await ensureSheetHeader(env, config, headerRow, cacheKey, true);
  }
  const token = await getAccessToken(env);
  const appendUrl = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${encodeURIComponent(config.appendRange)}:append`
  );
  appendUrl.searchParams.set("valueInputOption", "USER_ENTERED");
  appendUrl.searchParams.set("insertDataOption", "INSERT_ROWS");
  const response = await fetch(appendUrl.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [values] }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`sheet_append_failed:${response.status}:${errorText}`);
  }
  await discardResponse(response);
}

async function appendOrderRow(env: Env, values: Array<string | number>) {
  if (hasD1(env)) {
    const record: Record<string, string> = {};
    ORDER_SHEET_HEADER.forEach((key, idx) => {
      record[key] = values[idx] === undefined || values[idx] === null ? "" : String(values[idx]);
    });
    record.request_id = normalizeRequestId(record.request_id || "");
    const columns = ORDER_SHEET_HEADER;
    const placeholders = columns.map(() => "?").join(", ");
    const updates = columns
      .filter((key) => key !== "request_id")
      .map((key) => `${key} = excluded.${key}`)
      .join(", ");
    const params = columns.map((key) => record[key] || "");
    await d1Run(
      env,
      `INSERT INTO orders (${columns.join(", ")}) VALUES (${placeholders}) ON CONFLICT(request_id) DO UPDATE SET ${updates}`,
      params
    );
    return;
  }
  const config = getSheetConfig(env, "order");
  await appendSheetRow(env, config, values, ORDER_SHEET_HEADER);
}

async function appendQuoteRow(env: Env, values: Array<string | number>) {
  if (hasD1(env)) {
    const record: Record<string, string> = {};
    QUOTE_SHEET_HEADER.forEach((key, idx) => {
      record[key] = values[idx] === undefined || values[idx] === null ? "" : String(values[idx]);
    });
    record.request_id = normalizeRequestId(record.request_id || "");
    const columns = QUOTE_SHEET_HEADER;
    const placeholders = columns.map(() => "?").join(", ");
    const updates = columns
      .filter((key) => key !== "request_id")
      .map((key) => `${key} = excluded.${key}`)
      .join(", ");
    const params = columns.map((key) => record[key] || "");
    await d1Run(
      env,
      `INSERT INTO quotes (${columns.join(", ")}) VALUES (${placeholders}) ON CONFLICT(request_id) DO UPDATE SET ${updates}`,
      params
    );
    return;
  }
  const config = getSheetConfig(env, "quote");
  await appendSheetRow(env, config, values, QUOTE_SHEET_HEADER);
}

async function appendContactRow(env: Env, values: Array<string | number>) {
  if (hasD1(env)) {
    const record: Record<string, string> = {};
    CONTACT_SHEET_HEADER.forEach((key, idx) => {
      record[key] = values[idx] === undefined || values[idx] === null ? "" : String(values[idx]);
    });
    record.email = normalizeEmailAddress(record.email || "");
    const columns = CONTACT_SHEET_HEADER;
    const placeholders = columns.map(() => "?").join(", ");
    const updates = columns
      .filter((key) => key !== "email")
      .map((key) => `${key} = excluded.${key}`)
      .join(", ");
    const params = columns.map((key) => record[key] || "");
    await d1Run(
      env,
      `INSERT INTO contacts (${columns.join(", ")}) VALUES (${placeholders}) ON CONFLICT(email) DO UPDATE SET ${updates}`,
      params
    );
    return;
  }
  const config = getSheetConfig(env, "contact");
  await appendSheetRow(env, config, values, CONTACT_SHEET_HEADER);
}

type TicketInsertPayload = {
  requestId: string;
  createdAt: string;
  status: string;
  subject?: string;
  summary?: string;
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  pageUrl?: string;
  updatedBy?: string;
};

type TicketDetailPayload = {
  requestId: string;
  note: string;
  kind?: string;
  createdAt?: string;
  updatedBy?: string;
};

async function createTicketFromContact(env: Env & { DB: D1Database }, payload: TicketInsertPayload) {
  const now = payload.createdAt || new Date().toISOString();
  const columns = [
    "created_at",
    "request_id",
    "status",
    "subject",
    "summary",
    "name",
    "email",
    "phone",
    "source",
    "page_url",
    "updated_at",
    "updated_by",
  ];
  const params = [
    now,
    payload.requestId,
    payload.status || "NEW",
    payload.subject || "",
    payload.summary || "",
    payload.name || "",
    normalizeEmailAddress(payload.email || ""),
    payload.phone || "",
    payload.source || "",
    payload.pageUrl || "",
    now,
    payload.updatedBy || "system",
  ];
  const placeholders = columns.map(() => "?").join(", ");
  const updates = columns
    .filter((key) => key !== "request_id")
    .map((key) => `${key} = excluded.${key}`)
    .join(", ");
  await d1Run(
    env,
    `INSERT INTO tickets (${columns.join(", ")}) VALUES (${placeholders}) ON CONFLICT(request_id) DO UPDATE SET ${updates}`,
    params
  );
}

async function addTicketDetail(env: Env & { DB: D1Database }, payload: TicketDetailPayload) {
  const createdAt = payload.createdAt || new Date().toISOString();
  await d1Run(
    env,
    "INSERT INTO ticket_details (request_id, created_at, kind, note, updated_by) VALUES (?, ?, ?, ?, ?)",
    [
      payload.requestId,
      createdAt,
      payload.kind || "note",
      payload.note,
      payload.updatedBy || "",
    ]
  );
}

type UnifiedContactUpdate = {
  email: string;
  name?: string;
  phone?: string;
  source?: string;
  sources?: string[];
  createdAt?: string;
  firstSeenAt?: string;
  lastSeenAt?: string;
  lastSource?: string;
  isCustomer?: boolean;
  subscriptionStatus?: "subscribed" | "unsubscribed";
  unsubscribedReason?: string;
};

type UnifiedContactsState = {
  config: SheetConfig;
  header: string[];
  headerIndex: Map<string, number>;
  map: Map<string, { rowNumber: number; record: Record<string, string> }>;
};

type UnifiedContactAggregate = {
  email: string;
  name: string;
  phone: string;
  sources: Set<string>;
  firstSeenAt: string;
  lastSeenAt: string;
  lastSource: string;
  isCustomer: boolean;
};

function normalizeSource(value: string) {
  return value.trim().toLowerCase();
}

function parseSourcesList(value: string) {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => normalizeSource(entry))
    .filter(Boolean);
}

function mergeSources(existing: string[], incoming: string[]) {
  const merged = [...existing];
  const seen = new Set(existing);
  incoming.forEach((source) => {
    if (!source || seen.has(source)) return;
    seen.add(source);
    merged.push(source);
  });
  return merged;
}

function parseSubscribedFlag(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (["1", "true", "yes", "y"].includes(normalized)) return true;
  if (["0", "false", "no", "n"].includes(normalized)) return false;
  return null;
}

function resolveSubscribedStatus(
  existingValue: string,
  status?: "subscribed" | "unsubscribed"
) {
  if (status === "unsubscribed") return false;
  if (status === "subscribed") return true;
  const parsed = parseSubscribedFlag(existingValue);
  return parsed === null ? true : parsed;
}

function resolveEarlierDate(existing: string, candidate: string) {
  if (!existing) return candidate;
  if (!candidate) return existing;
  const existingMs = Date.parse(existing);
  const candidateMs = Date.parse(candidate);
  if (Number.isFinite(existingMs) && Number.isFinite(candidateMs)) {
    return candidateMs < existingMs ? candidate : existing;
  }
  if (!Number.isFinite(existingMs) && Number.isFinite(candidateMs)) return candidate;
  return existing;
}

function resolveLaterDate(existing: string, candidate: string) {
  if (!existing) return candidate;
  if (!candidate) return existing;
  const existingMs = Date.parse(existing);
  const candidateMs = Date.parse(candidate);
  if (Number.isFinite(existingMs) && Number.isFinite(candidateMs)) {
    return candidateMs > existingMs ? candidate : existing;
  }
  if (!Number.isFinite(existingMs) && Number.isFinite(candidateMs)) return candidate;
  return existing;
}

function isAfterDate(candidate: string, baseline: string) {
  const candidateMs = Date.parse(candidate);
  const baselineMs = Date.parse(baseline);
  if (!Number.isFinite(candidateMs)) return false;
  if (!Number.isFinite(baselineMs)) return true;
  return candidateMs > baselineMs;
}

function choosePreferredText(existing: string, incoming: string) {
  const trimmedIncoming = incoming.trim();
  if (!trimmedIncoming) return existing;
  if (!existing) return trimmedIncoming;
  return trimmedIncoming.length > existing.length ? trimmedIncoming : existing;
}

function resolveContactType(existingType: string, isCustomer: boolean, sources: string[]) {
  const normalizedExisting = existingType.trim().toLowerCase();
  if (normalizedExisting === "customer") return "Customer";
  if (isCustomer) return "Customer";
  if (sources.some((source) => source === "order" || source === "quote")) {
    return "Customer";
  }
  return "Subscriber";
}

function mergeUnifiedContactRecord(
  existing: Record<string, string> | null,
  update: UnifiedContactUpdate,
  now: string
) {
  const base = existing || {};
  const normalizedEmail = normalizeEmailAddress(update.email);
  const incomingSources = mergeSources(
    parseSourcesList(base.sources || ""),
    (update.sources || (update.source ? [update.source] : [])).map((source) => normalizeSource(source))
  );
  const incomingFirstSeen = update.firstSeenAt || update.createdAt || "";
  const incomingLastSeen = update.lastSeenAt || update.createdAt || incomingFirstSeen;
  const incomingLastSource = normalizeSource(update.lastSource || update.source || "");

  const createdAt = base.created_at || incomingFirstSeen || now;
  const firstSeenAt =
    resolveEarlierDate(base.first_seen_at || "", incomingFirstSeen) || createdAt;
  const lastSeenAt =
    resolveLaterDate(base.last_seen_at || "", incomingLastSeen) || incomingLastSeen || now;

  const shouldUpdateLastSource = incomingLastSource
    ? isAfterDate(incomingLastSeen || now, base.last_seen_at || "")
    : false;
  const lastSource =
    incomingLastSource && (shouldUpdateLastSource || !base.last_source)
      ? incomingLastSource
      : base.last_source || incomingLastSource;

  const subscribed = resolveSubscribedStatus(base.subscribed || "", update.subscriptionStatus);
  let unsubscribedAt = base.unsubscribed_at || "";
  let unsubscribedReason = base.unsubscribed_reason || "";
  if (update.subscriptionStatus === "unsubscribed") {
    unsubscribedAt = now;
    unsubscribedReason = update.unsubscribedReason || "";
  }
  if (update.subscriptionStatus === "subscribed") {
    unsubscribedAt = "";
    unsubscribedReason = "";
  }

  const type = resolveContactType(
    base.type || "",
    Boolean(update.isCustomer),
    incomingSources
  );

  return {
    created_at: createdAt,
    email: normalizedEmail,
    name: choosePreferredText(base.name || "", update.name || ""),
    phone: base.phone || update.phone || "",
    type,
    subscribed: subscribed ? "True" : "False",
    sources: incomingSources.join(", "),
    first_seen_at: firstSeenAt,
    last_seen_at: lastSeenAt,
    last_source: lastSource || "",
    unsubscribed_at: unsubscribedAt,
    unsubscribed_reason: unsubscribedReason,
    updated_at: now,
  };
}

function buildUnifiedRowValues(header: string[], record: Record<string, string>) {
  return header.map((key) => {
    const normalizedKey = String(key || "").trim();
    if (!normalizedKey) return "";
    return getString(record[normalizedKey]);
  });
}

function buildUnifiedContactUpdates(record: Record<string, string>) {
  const updates: Record<string, string> = {};
  UNIFIED_CONTACTS_SHEET_HEADER.forEach((key) => {
    updates[key] = getString(record[key]);
  });
  return updates;
}

function hasUnifiedRecordChanged(
  existing: Record<string, string> | null,
  updated: Record<string, string>
) {
  if (!existing) return true;
  for (const key of UNIFIED_CONTACTS_SHEET_HEADER) {
    if (getString(existing[key]) !== getString(updated[key])) {
      return true;
    }
  }
  return false;
}

async function loadUnifiedContactsState(env: Env): Promise<UnifiedContactsState | null> {
  const config = getUnifiedContactsSheetConfig(env);
  if (!config) return null;
  const cacheKey = `sheet_header:${config.sheetId}:${config.sheetName}:unified`;
  await ensureSheetHeader(env, config, UNIFIED_CONTACTS_SHEET_HEADER, cacheKey);
  const headerRows = await fetchSheetValues(env, config.sheetId, config.headerRange);
  const headerRow = headerRows[0] && headerRows[0].length ? headerRows[0] : [];
  const headerConfig = resolveHeaderConfig(headerRow, UNIFIED_CONTACTS_SHEET_HEADER, "email");
  const headerIndex = new Map(
    headerConfig.header.map((key, idx) => [String(key || "").trim(), idx])
  );
  const emailIdx = headerIndex.get("email") ?? -1;
  if (emailIdx < 0) return null;
  const rows = await fetchSheetValues(
    env,
    config.sheetId,
    `${config.sheetName}!A${headerConfig.rowStart}:AZ`
  );
  const map = new Map<string, { rowNumber: number; record: Record<string, string> }>();
  rows.forEach((row, index) => {
    const email = normalizeEmailAddress(getString(row[emailIdx]));
    if (!email) return;
    map.set(email, {
      rowNumber: index + headerConfig.rowStart,
      record: mapSheetRowToRecord(headerConfig.header, row),
    });
  });
  return { config, header: headerConfig.header, headerIndex, map };
}

async function upsertUnifiedContact(env: Env, update: UnifiedContactUpdate) {
  const normalizedEmail = normalizeEmailAddress(update.email);
  if (!normalizedEmail) return;
  if (hasD1(env)) {
    const now = new Date().toISOString();
    const existingRows = await d1All(env, "SELECT * FROM unified_contacts WHERE email = ? LIMIT 1", [
      normalizedEmail,
    ]);
    const existing = existingRows.length ? (mapD1RowToRecord(existingRows[0]) as Record<string, string>) : null;
    const merged = mergeUnifiedContactRecord(
      existing,
      { ...update, email: normalizedEmail },
      now
    );
    const columns = UNIFIED_CONTACTS_SHEET_HEADER;
    const values = columns.map((key) => merged[key] || "");
    const placeholders = columns.map(() => "?").join(", ");
    const updateSet = columns
      .filter((key) => key !== "email")
      .map((key) => `${key} = excluded.${key}`)
      .join(", ");
    await d1Run(
      env,
      `INSERT INTO unified_contacts (${columns.join(", ")}) VALUES (${placeholders}) ON CONFLICT(email) DO UPDATE SET ${updateSet}`,
      values
    );
    return;
  }
  const state = await loadUnifiedContactsState(env);
  if (!state) return;
  const now = new Date().toISOString();
  const existing = state.map.get(normalizedEmail) || null;
  const merged = mergeUnifiedContactRecord(
    existing?.record || null,
    { ...update, email: normalizedEmail },
    now
  );
  const updates = buildUnifiedContactUpdates(merged);
  if (existing) {
    if (hasUnifiedRecordChanged(existing.record, merged)) {
      await updateSheetColumns(env, state.config, state.headerIndex, existing.rowNumber, updates);
    }
    return;
  }
  const values = buildUnifiedRowValues(state.header, merged);
  await appendSheetRow(env, state.config, values, UNIFIED_CONTACTS_SHEET_HEADER);
}

function applyUnifiedAggregate(
  map: Map<string, UnifiedContactAggregate>,
  entry: {
    email: string;
    name: string;
    phone: string;
    source: string;
    createdAt: string;
    isCustomer: boolean;
  }
) {
  const normalizedEmail = normalizeEmailAddress(entry.email);
  if (!normalizedEmail) return;
  const normalizedSource = normalizeSource(entry.source || "");
  const aggregate = map.get(normalizedEmail) || {
    email: normalizedEmail,
    name: "",
    phone: "",
    sources: new Set<string>(),
    firstSeenAt: "",
    lastSeenAt: "",
    lastSource: "",
    isCustomer: false,
  };

  aggregate.name = choosePreferredText(aggregate.name, entry.name || "");
  if (!aggregate.phone && entry.phone) {
    aggregate.phone = entry.phone;
  }

  if (normalizedSource) {
    aggregate.sources.add(normalizedSource);
  }

  if (entry.createdAt) {
    aggregate.firstSeenAt = resolveEarlierDate(aggregate.firstSeenAt, entry.createdAt);
    const isNewer = isAfterDate(entry.createdAt, aggregate.lastSeenAt);
    aggregate.lastSeenAt = resolveLaterDate(aggregate.lastSeenAt, entry.createdAt);
    if (normalizedSource && (isNewer || !aggregate.lastSource)) {
      aggregate.lastSource = normalizedSource;
    }
  } else if (normalizedSource && !aggregate.lastSource) {
    aggregate.lastSource = normalizedSource;
  }

  if (entry.isCustomer) {
    aggregate.isCustomer = true;
  }

  map.set(normalizedEmail, aggregate);
}

async function collectUnifiedContacts(
  env: Env,
  kind: "order" | "quote" | "contact",
  source: string,
  isCustomer: boolean,
  aggregates: Map<string, UnifiedContactAggregate>
) {
  const config = getSheetConfig(env, kind);
  const headerRows = await fetchSheetValues(env, config.sheetId, config.headerRange);
  const headerFallback =
    kind === "order" ? ORDER_SHEET_HEADER : kind === "quote" ? QUOTE_SHEET_HEADER : CONTACT_SHEET_HEADER;
  const headerRow = headerRows[0] && headerRows[0].length ? headerRows[0] : [];
  const headerConfig = resolveHeaderConfig(headerRow, headerFallback, "email");
  const headerIndex = new Map<string, number>();
  headerConfig.header.forEach((cell, idx) => {
    headerIndex.set(String(cell || "").trim().toLowerCase(), idx);
  });

  const emailIdx = headerIndex.get("email") ?? -1;
  if (emailIdx < 0) return;
  const nameIdx = headerIndex.get("name") ?? -1;
  const phoneIdx = headerIndex.get("phone") ?? -1;
  const createdAtIdx = headerIndex.get("created_at") ?? -1;

  const rows = await fetchSheetValues(
    env,
    config.sheetId,
    `${config.sheetName}!A${headerConfig.rowStart}:AZ`
  );
  rows.forEach((row) => {
    const email = getString(row[emailIdx]);
    if (!email) return;
    applyUnifiedAggregate(aggregates, {
      email,
      name: nameIdx >= 0 ? getString(row[nameIdx]) : "",
      phone: phoneIdx >= 0 ? getString(row[phoneIdx]) : "",
      source,
      createdAt: createdAtIdx >= 0 ? getString(row[createdAtIdx]) : "",
      isCustomer,
    });
  });
}

async function processUnifiedContacts(env: Env) {
  if (hasD1(env)) {
    const aggregates = new Map<string, UnifiedContactAggregate>();
    const orderRows = await d1All(env, "SELECT email, name, phone, created_at FROM orders");
    orderRows.forEach((row) => {
      applyUnifiedAggregate(aggregates, {
        email: getString(row.email),
        name: getString(row.name),
        phone: getString(row.phone),
        source: "order",
        createdAt: getString(row.created_at),
        isCustomer: true,
      });
    });
    const quoteRows = await d1All(env, "SELECT email, name, phone, created_at FROM quotes");
    quoteRows.forEach((row) => {
      applyUnifiedAggregate(aggregates, {
        email: getString(row.email),
        name: getString(row.name),
        phone: getString(row.phone),
        source: "quote",
        createdAt: getString(row.created_at),
        isCustomer: true,
      });
    });
    const contactRows = await d1All(env, "SELECT email, name, phone, created_at FROM contacts");
    contactRows.forEach((row) => {
      applyUnifiedAggregate(aggregates, {
        email: getString(row.email),
        name: getString(row.name),
        phone: getString(row.phone),
        source: "contact",
        createdAt: getString(row.created_at),
        isCustomer: false,
      });
    });

    if (!aggregates.size) return;
    const now = new Date().toISOString();
    for (const [email, aggregate] of aggregates) {
      const existingRows = await d1All(env, "SELECT * FROM unified_contacts WHERE email = ? LIMIT 1", [email]);
      const existing = existingRows.length ? (mapD1RowToRecord(existingRows[0]) as Record<string, string>) : null;
      const merged = mergeUnifiedContactRecord(
        existing,
        {
          email,
          name: aggregate.name,
          phone: aggregate.phone,
          sources: Array.from(aggregate.sources),
          firstSeenAt: aggregate.firstSeenAt,
          lastSeenAt: aggregate.lastSeenAt,
          lastSource: aggregate.lastSource,
          isCustomer: aggregate.isCustomer,
        },
        now
      );
      const columns = UNIFIED_CONTACTS_SHEET_HEADER;
      const values = columns.map((key) => merged[key] || "");
      const placeholders = columns.map(() => "?").join(", ");
      const updateSet = columns
        .filter((key) => key !== "email")
        .map((key) => `${key} = excluded.${key}`)
        .join(", ");
      await d1Run(
        env,
        `INSERT INTO unified_contacts (${columns.join(", ")}) VALUES (${placeholders}) ON CONFLICT(email) DO UPDATE SET ${updateSet}`,
        values
      );
    }
    return;
  }
  let state: UnifiedContactsState | null = null;
  try {
    state = await loadUnifiedContactsState(env);
  } catch (error) {
    logWarn("unified_contacts_load_failed", { error: String(error) });
    return;
  }
  if (!state) return;

  const aggregates = new Map<string, UnifiedContactAggregate>();
  try {
    await collectUnifiedContacts(env, "order", "order", true, aggregates);
  } catch (error) {
    logWarn("unified_contacts_orders_failed", { error: String(error) });
  }
  try {
    await collectUnifiedContacts(env, "quote", "quote", true, aggregates);
  } catch (error) {
    logWarn("unified_contacts_quotes_failed", { error: String(error) });
  }
  try {
    await collectUnifiedContacts(env, "contact", "contact", false, aggregates);
  } catch (error) {
    logWarn("unified_contacts_contacts_failed", { error: String(error) });
  }

  if (!aggregates.size) return;
  const now = new Date().toISOString();
  for (const [email, aggregate] of aggregates) {
    const existing = state.map.get(email) || null;
    const merged = mergeUnifiedContactRecord(
      existing?.record || null,
      {
        email,
        name: aggregate.name,
        phone: aggregate.phone,
        sources: Array.from(aggregate.sources),
        firstSeenAt: aggregate.firstSeenAt,
        lastSeenAt: aggregate.lastSeenAt,
        lastSource: aggregate.lastSource,
        isCustomer: aggregate.isCustomer,
      },
      now
    );
    const updates = buildUnifiedContactUpdates(merged);
    if (existing) {
      if (hasUnifiedRecordChanged(existing.record, merged)) {
        await updateSheetColumns(env, state.config, state.headerIndex, existing.rowNumber, updates);
      }
    } else {
      const values = buildUnifiedRowValues(state.header, merged);
      await appendSheetRow(env, state.config, values, UNIFIED_CONTACTS_SHEET_HEADER);
    }
  }
}

async function processContactsDirectory(env: Env) {
  if (!hasD1(env)) return;
  const cacheKey = "contacts_directory:last_run";
  if (env.HEERAWALLA_ACKS) {
    const lastRun = await env.HEERAWALLA_ACKS.get(cacheKey);
    if (lastRun) return;
    await env.HEERAWALLA_ACKS.put(cacheKey, new Date().toISOString(), {
      expirationTtl: 60 * 60 * 24,
    });
  }
  const [orders, quotes, tickets] = await Promise.all([
    d1All(env, "SELECT email, name, phone, created_at FROM orders"),
    d1All(env, "SELECT email, name, phone, created_at FROM quotes"),
    d1All(env, "SELECT email, name, phone, created_at FROM tickets"),
  ]);
  const directory = new Map<
    string,
    { email: string; name: string; phone: string; createdAt: string; sources: Set<string> }
  >();
  const mergeRow = (row: Record<string, unknown>, source: string) => {
    const email = normalizeEmailAddress(getString(row.email));
    if (!email) return;
    const name = getString(row.name);
    const phone = getString(row.phone);
    const createdAt = getString(row.created_at);
    const existing = directory.get(email);
    if (!existing) {
      directory.set(email, {
        email,
        name,
        phone,
        createdAt,
        sources: new Set([source]),
      });
      return;
    }
    if (!existing.name && name) existing.name = name;
    if (!existing.phone && phone) existing.phone = phone;
    if (createdAt) {
      if (!existing.createdAt) {
        existing.createdAt = createdAt;
      } else if (new Date(createdAt) < new Date(existing.createdAt)) {
        existing.createdAt = createdAt;
      }
    }
    existing.sources.add(source);
  };
  orders.forEach((row) => mergeRow(row, "order"));
  quotes.forEach((row) => mergeRow(row, "quote"));
  tickets.forEach((row) => mergeRow(row, "ticket"));
  const now = new Date().toISOString();
  for (const entry of directory.values()) {
    const source = Array.from(entry.sources.values()).join(",");
    await d1Run(
      env,
      `INSERT INTO contacts (created_at, email, name, phone, source, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         name = excluded.name,
         phone = excluded.phone,
         source = excluded.source,
         updated_at = excluded.updated_at,
         updated_by = excluded.updated_by,
         created_at = CASE
           WHEN contacts.created_at IS NULL OR contacts.created_at = ''
             THEN excluded.created_at
           ELSE contacts.created_at
         END`,
      [
        entry.createdAt || now,
        entry.email,
        entry.name || "",
        entry.phone || "",
        source,
        now,
        "cron",
      ]
    );
  }
}

async function fetchSheetValues(env: Env, sheetId: string, range: string): Promise<string[][]> {
  const token = await getAccessToken(env);
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`
  );
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`sheet_read_failed:${response.status}:${errorText}`);
  }
  const payload = (await response.json()) as { values?: string[][] };
  return payload.values || [];
}

function columnToLetter(index: number) {
  let result = "";
  let value = index;
  while (value > 0) {
    const rem = (value - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

async function updateSheetRow(
  env: Env,
  config: SheetConfig,
  rowNumber: number,
  startIndex: number,
  endIndex: number,
  values: string[]
) {
  const token = await getAccessToken(env);
  const range = `${config.sheetName}!${columnToLetter(startIndex + 1)}${rowNumber}:${columnToLetter(
    endIndex + 1
  )}${rowNumber}`;
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${encodeURIComponent(range)}`
  );
  url.searchParams.set("valueInputOption", "RAW");
  const response = await fetch(url.toString(), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [values] }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`sheet_update_failed:${response.status}:${errorText}`);
  }
  await discardResponse(response);
}

async function processAckQueues(env: Env) {
  await Promise.all([processAckQueue(env, "order"), processAckQueue(env, "quote")]);
}

async function processAckQueue(env: Env, kind: "order" | "quote") {
  const config = getSheetConfig(env, kind);
  const headerRows = await fetchSheetValues(env, config.sheetId, config.headerRange);
  const headerFallback = kind === "order" ? ORDER_SHEET_HEADER : QUOTE_SHEET_HEADER;
  const headerRow = headerRows[0] && headerRows[0].length ? headerRows[0] : [];
  const headerConfig = resolveHeaderConfig(headerRow, headerFallback, "request_id");
  if (!headerConfig.header.length) {
    logWarn("ack_queue_missing_header", { kind });
    return;
  }
  const headerIndex = new Map<string, number>();
  headerConfig.header.forEach((cell, idx) => {
    headerIndex.set(String(cell || "").trim().toLowerCase(), idx);
  });
  const statusIdx = headerIndex.get("status") ?? -1;
  const statusUpdatedIdx = headerIndex.get("status_updated_at") ?? -1;
  const notesIdx = headerIndex.get("notes") ?? -1;
  const lastErrorIdx = headerIndex.get("last_error") ?? -1;
  const requestIdIdx = headerIndex.get("request_id") ?? -1;
  const emailIdx = headerIndex.get("email") ?? -1;
  const nameIdx = headerIndex.get("name") ?? -1;

  if ([statusIdx, statusUpdatedIdx, notesIdx, lastErrorIdx, requestIdIdx, emailIdx].some((idx) => idx < 0)) {
    logError("ack_queue_header_invalid", { kind });
    return;
  }

  const dataRange = `${config.sheetName}!A${headerConfig.rowStart}:AZ`;
  const rows = await fetchSheetValues(env, config.sheetId, dataRange);
  if (!rows.length) return;

  let processedCount = 0;
  const useResend = Boolean(env.RESEND_API_KEY);
  const resendThrottleMs = 600;
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] || [];
    const statusRaw = String(row[statusIdx] || "").trim().toUpperCase();
    if (statusRaw !== "NEW") continue;
    if (processedCount >= ACK_QUEUE_BATCH_LIMIT) {
      logInfo("ack_queue_throttled", { kind, limit: ACK_QUEUE_BATCH_LIMIT });
      break;
    }

    const rowNumber = i + headerConfig.rowStart;
    const requestId = getString(row[requestIdIdx]);
    const senderEmail = getString(row[emailIdx]);
    const senderName = getString(row[nameIdx]);
    const notesValue = String(row[notesIdx] || "");
    let lastErrorValue = "";
    let nextStatus = statusRaw;
    let shouldThrottle = false;
    let hitRateLimit = false;
    const now = new Date().toISOString();

    if (!requestId || !senderEmail) {
      lastErrorValue = "missing_request_or_email";
    } else {
      const normalizedRequestId = normalizeRequestId(requestId);
      const ackKey = `ack:req:${normalizedRequestId}`;
      const alreadyAcked = env.HEERAWALLA_ACKS ? await env.HEERAWALLA_ACKS.get(ackKey) : null;

      if (alreadyAcked) {
        nextStatus = "ACKNOWLEDGED";
      } else {
        try {
          const ackPrefix = kind === "order" ? ORDER_ACK_SUBJECT : QUOTE_ACK_SUBJECT;
          const ackText = kind === "order" ? ORDER_ACK_TEXT : EMAIL_TEXT;
          const ackHtml = kind === "order" ? ORDER_ACK_HTML : EMAIL_HTML;
          await sendEmail(env, {
            to: [senderEmail],
            sender: kind === "order" ? "Heerawalla <atelier@heerawalla.com>" : "Heerawalla <no-reply@heerawalla.com>",
            replyTo: kind === "order" ? getCustomerReplyTo() : "no-reply@heerawalla.com",
            subject: buildAckSubject(normalizedRequestId, ackPrefix),
            textBody: ackText,
            htmlBody: ackHtml,
            headers: autoReplyHeaders(),
          });
          nextStatus = "ACKNOWLEDGED";
          shouldThrottle = useResend;
          if (env.HEERAWALLA_ACKS) {
            await env.HEERAWALLA_ACKS.put(ackKey, "1", { expirationTtl: 60 * 60 * 24 * 7 });
          }
          if (kind === "order") {
            await recordOrderStatusEmailSent(env, normalizedRequestId, "ACKNOWLEDGED", now);
          }
          logInfo("ack_queue_sent", { kind, requestId: normalizedRequestId, email: maskEmail(senderEmail) });
        } catch (error) {
          lastErrorValue = String(error).slice(0, 200);
          hitRateLimit = useResend && isResendRateLimitError(lastErrorValue);
          shouldThrottle = useResend;
          logWarn("ack_queue_failed", { kind, requestId: normalizedRequestId, error: lastErrorValue });
        }
      }
    }

    if (!nextStatus) continue;
    const startIndex = Math.min(statusIdx, statusUpdatedIdx, notesIdx, lastErrorIdx);
    const endIndex = Math.max(statusIdx, statusUpdatedIdx, notesIdx, lastErrorIdx);
    const values = new Array(endIndex - startIndex + 1).fill("");
    values[statusIdx - startIndex] = nextStatus;
    values[statusUpdatedIdx - startIndex] = now;
    values[notesIdx - startIndex] = notesValue;
    values[lastErrorIdx - startIndex] = lastErrorValue;

    try {
      await updateSheetRow(env, config, rowNumber, startIndex, endIndex, values);
    } catch (error) {
      logError("ack_queue_update_failed", { kind, requestId, error: String(error) });
    }
    processedCount += 1;
    if (shouldThrottle && resendThrottleMs > 0) {
      await sleep(resendThrottleMs);
    }
    if (hitRateLimit) {
      logWarn("ack_queue_rate_limited", { kind });
      break;
    }
  }
}

async function handleSubmitPayload(
  env: Env,
  payload: Record<string, unknown>,
  request: Request,
  origin: string,
  allowedOrigin: string,
  options?: { skipTurnstile?: boolean }
) {
  try {
    const subject = getString(payload.subject);
    const body = getString(payload.body);
    const senderEmail = getString(payload.email);
    const senderName = getString(payload.name);
    const requestId = getString(payload.requestId);
    const turnstileToken = getString(payload.turnstileToken);
    const phone = normalizePhone(getString(payload.phone));
    const source = getString(payload.source) || "quote";
    const productName = getString(payload.productName || payload.inspirationTitle);
    const productUrl = getString(payload.productUrl || payload.inspirationUrl);
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
    const normalizedRequestId = normalizeRequestId(requestId);
    const status = "NEW";
    let statusUpdatedAt = "";
    const notes = "";
    const lastError = "";
    const price = getString(payload.price);
    const timeline = normalizeTimeline(getString(payload.timeline));
    const metalWeight = getString(payload.metalWeight || payload.metal_weight);
    const timelineAdjustmentWeeks = getString(
      payload.timelineAdjustmentWeeks || payload.timeline_adjustment_weeks
    );
    const diamondBreakdown = getString(payload.diamondBreakdown || payload.diamond_breakdown);
    const { utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referrer } =
      resolveAttribution(payload, request);
    const pageUrl = getString(payload.pageUrl) || productUrl || referrer;

    if (!subject || !body || !senderEmail || !normalizedRequestId) {
      logWarn("submit_missing_fields", {
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
      logWarn("submit_missing_address", { requestId });
      return new Response(JSON.stringify({ ok: false, error: "missing_address" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    if (!isValidPhone(phone)) {
      logWarn("submit_invalid_phone", { requestId, email: maskEmail(senderEmail) });
      return new Response(JSON.stringify({ ok: false, error: "invalid_phone" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    if (!options?.skipTurnstile) {
      if (!env.TURNSTILE_SECRET) {
        logError("submit_turnstile_missing_secret", { requestId });
        return new Response(JSON.stringify({ ok: false, error: "turnstile_not_configured" }), {
          status: 500,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }

      if (!turnstileToken) {
        logWarn("submit_turnstile_missing", { requestId, email: maskEmail(senderEmail) });
        return new Response(JSON.stringify({ ok: false, error: "turnstile_required" }), {
          status: 400,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }

      const clientIp = request.headers.get("CF-Connecting-IP") || undefined;
      const turnstileOk = await verifyTurnstile(env.TURNSTILE_SECRET, turnstileToken, clientIp);
      if (!turnstileOk) {
        logWarn("submit_turnstile_failed", { requestId, email: maskEmail(senderEmail) });
        return new Response(JSON.stringify({ ok: false, error: "turnstile_failed" }), {
          status: 400,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
    }

    if (!isValidEmail(senderEmail)) {
      logWarn("submit_invalid_email", { requestId, email: maskEmail(senderEmail) });
      return new Response(JSON.stringify({ ok: false, error: "invalid_email" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    const senderDomain = senderEmail.split("@")[1] || "";
    const domainOk = await hasValidEmailDomain(senderDomain);
    if (!domainOk) {
      logWarn("submit_invalid_domain", { requestId, email: maskEmail(senderEmail) });
      return new Response(JSON.stringify({ ok: false, error: "invalid_email_domain" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    const upperBody = body.toUpperCase();
    const hasRequestId =
      subject.toUpperCase().includes(REQUEST_ID_PREFIX) ||
      body.includes(REQUEST_ID_LABEL) ||
      upperBody.includes(normalizedRequestId);

    if (!hasRequestId) {
      logWarn("submit_missing_request_id", { requestId, email: maskEmail(senderEmail) });
      return new Response(JSON.stringify({ ok: false, error: "missing_request_id" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }

    let requestKey = "";
    if (env.HEERAWALLA_ACKS) {
      requestKey = `req:${normalizedRequestId}`;
      const alreadySubmitted = await env.HEERAWALLA_ACKS.get(requestKey);
      if (alreadySubmitted) {
        logInfo("submit_duplicate", { requestId, email: maskEmail(senderEmail) });
        return new Response(JSON.stringify({ ok: true, duplicate: true }), {
          status: 200,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }

      const rateIp = request.headers.get("CF-Connecting-IP") || "unknown";
      const bucket = new Date();
      const hourKey = `${bucket.getUTCFullYear()}${String(bucket.getUTCMonth() + 1).padStart(2, "0")}${String(
        bucket.getUTCDate()
      ).padStart(2, "0")}${String(bucket.getUTCHours()).padStart(2, "0")}`;
      const rateKey = `rl:${rateIp}:${hourKey}`;
      const currentCount = Number(await env.HEERAWALLA_ACKS.get(rateKey)) || 0;
      if (currentCount >= MAX_SUBMISSIONS_PER_HOUR) {
        logWarn("submit_rate_limited", { requestId, email: maskEmail(senderEmail) });
        return new Response(JSON.stringify({ ok: false, error: "rate_limited" }), {
          status: 429,
          headers: buildCorsHeaders(allowedOrigin, true),
        });
      }
      await env.HEERAWALLA_ACKS.put(rateKey, String(currentCount + 1), { expirationTtl: 60 * 60 });
      await env.HEERAWALLA_ACKS.put(requestKey, "1", { expirationTtl: 60 * 60 * 24 });
    }

    const shouldWriteQuoteSheet = source !== "order";
    if (shouldWriteQuoteSheet) {
      try {
        const now = new Date().toISOString();
        statusUpdatedAt = now;
        const ip = request.headers.get("CF-Connecting-IP") || "";
        const userAgent = request.headers.get("User-Agent") || "";
        await appendQuoteRow(env, [
          now,
          normalizedRequestId,
          status,
          statusUpdatedAt,
          notes,
          lastError,
          price,
          timeline,
          timelineAdjustmentWeeks,
          senderName,
          senderEmail,
          phone,
          source,
          productName,
          productUrl,
          designCode,
          metal,
          metalWeight,
          stone,
          stoneWeight,
          diamondBreakdown,
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
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]);
        logInfo("quote_sheet_written", { requestId: normalizedRequestId });
        try {
          await upsertUnifiedContact(env, {
            email: senderEmail,
            name: senderName,
            phone,
            source: "quote",
            createdAt: now,
            isCustomer: true,
          });
        } catch (error) {
          logWarn("unified_contact_failed", { requestId: normalizedRequestId, error: String(error) });
        }
      } catch (error) {
        logError("quote_sheet_failed", { requestId: normalizedRequestId, error: String(error) });
        return new Response(
          JSON.stringify({ ok: false, error: "quote_store_failed", detail: String(error) }),
          {
            status: 500,
            headers: buildCorsHeaders(allowedOrigin, true),
          }
        );
      }
    } else {
      logInfo("quote_sheet_skipped", { requestId: normalizedRequestId, source });
    }

    const forwardTo = env.FORWARD_TO || "atelier.heerawalla@gmail.com";
    const ackMode = getAckMode(env);
    const shouldSendAck = isEnabled(env.SEND_ACK, true) && ackMode === "inline";
    const shouldSendSubmit = isEnabled(env.SEND_SUBMIT, true);
    if (!shouldSendSubmit) {
      logWarn("submit_send_disabled", { requestId, email: maskEmail(senderEmail) });
      return new Response(JSON.stringify({ ok: false, error: "send_disabled" }), {
        status: 503,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    try {
      await storeRequestOrigin(env, normalizedRequestId, senderEmail, senderName);
      await storeRequestSummary(env, normalizedRequestId, {
        subject,
        body,
        email: senderEmail,
        name: senderName,
      });
      logInfo("submit_forward_start", { requestId, email: maskEmail(senderEmail) });
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
          senderName,
          requestId,
        }),
      });
      logInfo("submit_forward_sent", { requestId, email: maskEmail(senderEmail) });

      let shouldAck = shouldSendAck;
      if (shouldAck && env.HEERAWALLA_ACKS) {
        const ackKey = `ack:req:${normalizedRequestId}`;
        const alreadyAcked = await env.HEERAWALLA_ACKS.get(ackKey);
        if (alreadyAcked) {
          shouldAck = false;
          logInfo("submit_ack_skipped", { requestId, email: maskEmail(senderEmail) });
        } else {
          await env.HEERAWALLA_ACKS.put(ackKey, "1", { expirationTtl: 60 * 60 * 24 * 7 });
        }
      }

      if (shouldAck) {
        const ackPrefix = source === "order" ? ORDER_ACK_SUBJECT : QUOTE_ACK_SUBJECT;
        const ackText = source === "order" ? ORDER_ACK_TEXT : EMAIL_TEXT;
        const ackHtml = source === "order" ? ORDER_ACK_HTML : EMAIL_HTML;
        logInfo("submit_ack_start", { requestId, email: maskEmail(senderEmail) });
        await sendEmail(env, {
          to: [senderEmail],
          sender: "Heerawalla <no-reply@heerawalla.com>",
          replyTo: "no-reply@heerawalla.com",
          subject: buildAckSubject(normalizedRequestId, ackPrefix),
          textBody: ackText,
          htmlBody: ackHtml,
          headers: autoReplyHeaders(),
        });
        logInfo("submit_ack_sent", { requestId, email: maskEmail(senderEmail) });
      } else if (ackMode === "cron") {
        logInfo("submit_ack_deferred", { requestId, email: maskEmail(senderEmail) });
      }

      // People sync is optional and not required for order/quote flows.
    } catch (error) {
      logError("submit_send_failed", { requestId, email: maskEmail(senderEmail) });
      if (env.HEERAWALLA_ACKS && requestKey) {
        await env.HEERAWALLA_ACKS.delete(requestKey);
      }
      throw error;
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  } catch (error) {
    const message = String(error);
    logError("submit_error", { message });
    return new Response(JSON.stringify({ ok: false, error: "send_failed", detail: message }), {
      status: 500,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }
}

const STATUS_EMAIL_MAX_ATTEMPTS = 3;
const ORDER_SHIPPING_CHECK_INTERVAL_HOURS = 6;
const ORDER_STATUS_EMAIL_TTL_SECONDS = 60 * 60 * 24 * 180;
const STATUS_EMAIL_REMINDER_STATUSES = new Set(["PENDING_CONFIRMATION", "INVOICED", "INVOICE_EXPIRED"]);
const STATUS_EMAIL_SKIP_STATUSES = new Set(["NEW"]);
const ORDER_STATUS_EMAIL_KEY_PREFIX = "order:status-email:";
const ORDER_CONFIRMATION_INDEX_PREFIX = "order:confirm:request:";
const ORDER_CANCEL_INDEX_PREFIX = "order:cancel:request:";

type OrderStatusEmailRecord = {
  status: string;
  statusUpdatedAt: string;
  lastSentAt: string;
  attempts: number;
};

function buildOrderStatusEmailKey(requestId: string, status: string) {
  const normalizedId = normalizeRequestId(requestId);
  const normalizedStatus = normalizeOrderStatus(status);
  if (!normalizedId || !normalizedStatus) return "";
  return `${ORDER_STATUS_EMAIL_KEY_PREFIX}${normalizedId}:${normalizedStatus}`;
}

function buildOrderConfirmationIndexKey(requestId: string) {
  const normalized = normalizeRequestId(requestId);
  return normalized ? `${ORDER_CONFIRMATION_INDEX_PREFIX}${normalized}` : "";
}

function buildOrderCancelIndexKey(requestId: string) {
  const normalized = normalizeRequestId(requestId);
  return normalized ? `${ORDER_CANCEL_INDEX_PREFIX}${normalized}` : "";
}

async function storeOrderConfirmationIndex(env: Env, record: OrderConfirmationRecord) {
  if (!env.HEERAWALLA_ACKS) return;
  const key = buildOrderConfirmationIndexKey(record.requestId);
  if (!key) return;
  const payload = JSON.stringify({ token: record.token, createdAt: record.createdAt });
  await env.HEERAWALLA_ACKS.put(key, payload, { expirationTtl: ORDER_CONFIRMATION_TTL });
}

async function storeOrderCancelIndex(env: Env, record: OrderCancelRecord) {
  if (!env.HEERAWALLA_ACKS) return;
  const key = buildOrderCancelIndexKey(record.requestId);
  if (!key) return;
  const payload = JSON.stringify({ token: record.token, createdAt: record.createdAt });
  await env.HEERAWALLA_ACKS.put(key, payload, { expirationTtl: ORDER_CANCEL_TTL });
}

async function getOrderConfirmationTokenByRequestId(env: Env, requestId: string) {
  if (!env.HEERAWALLA_ACKS) return "";
  const key = buildOrderConfirmationIndexKey(requestId);
  if (!key) return "";
  const value = await env.HEERAWALLA_ACKS.get(key);
  if (!value) return "";
  try {
    const parsed = JSON.parse(value) as { token?: string };
    return getString(parsed.token);
  } catch {
    return "";
  }
}

async function getOrderCancelTokenByRequestId(env: Env, requestId: string) {
  if (!env.HEERAWALLA_ACKS) return "";
  const key = buildOrderCancelIndexKey(requestId);
  if (!key) return "";
  const value = await env.HEERAWALLA_ACKS.get(key);
  if (!value) return "";
  try {
    const parsed = JSON.parse(value) as { token?: string };
    return getString(parsed.token);
  } catch {
    return "";
  }
}

async function ensureOrderCancelRecord(
  env: Env,
  requestId: string,
  email: string,
  name: string,
  productName: string
) {
  const existingToken = await getOrderCancelTokenByRequestId(env, requestId);
  if (existingToken) {
    const existing = await getOrderCancelRecord(env, existingToken);
    if (existing && existing.status === "pending") return existing;
  }

  const token = generateOrderConfirmationToken();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + ORDER_CANCEL_TTL * 1000).toISOString();
  const record: OrderCancelRecord = {
    token,
    requestId: normalizeRequestId(requestId),
    email,
    name,
    productName,
    status: "pending",
    createdAt,
    expiresAt,
  };
  await storeOrderCancelRecord(env, record);
  await storeOrderCancelIndex(env, record);
  return record;
}

async function getOrderStatusEmailRecord(env: Env, requestId: string, status: string) {
  if (!env.HEERAWALLA_ACKS) return null;
  const key = buildOrderStatusEmailKey(requestId, status);
  if (!key) return null;
  const value = await env.HEERAWALLA_ACKS.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as OrderStatusEmailRecord;
  } catch {
    return null;
  }
}

async function storeOrderStatusEmailRecord(
  env: Env,
  requestId: string,
  status: string,
  record: OrderStatusEmailRecord
) {
  if (!env.HEERAWALLA_ACKS) return;
  const key = buildOrderStatusEmailKey(requestId, status);
  if (!key) return;
  await env.HEERAWALLA_ACKS.put(key, JSON.stringify(record), { expirationTtl: ORDER_STATUS_EMAIL_TTL_SECONDS });
}

function getStatusEmailIntervalHours(env: Env) {
  const raw = getString(env.STATUS_EMAIL_INTERVAL_HOURS);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 48;
  return parsed;
}

function getInvoiceEmailDelayMs(env: Env) {
  const raw = getString(env.STATUS_EMAIL_INVOICE_DELAY_MINUTES);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return 15 * 60 * 1000;
  return parsed * 60 * 1000;
}

function formatOrderReference(requestId: string) {
  const normalized = normalizeRequestId(requestId);
  return normalized ? `HW-REQ:${normalized}` : "Heerawalla Request";
}

function appendNote(base: string, note: string) {
  const trimmed = base.trim();
  const next = note.trim();
  if (!next) return trimmed;
  return trimmed ? `${trimmed}\n\n${next}` : next;
}

function buildStatusAuditNote(status: string) {
  const now = new Date().toISOString();
  return `Status updated to ${status} on ${now}. Status email pending.`;
}

const ORDER_SHIPPING_SNAPSHOT_PREFIX = "order:shipping:update:";

function buildShippingSnapshotKey(requestId: string) {
  const normalized = normalizeRequestId(requestId);
  return normalized ? `${ORDER_SHIPPING_SNAPSHOT_PREFIX}${normalized}` : "";
}

function normalizeShippingStatus(value: string) {
  return getString(value).toUpperCase();
}

function isDeliveredShippingStatus(value: string) {
  const normalized = normalizeShippingStatus(value);
  return normalized === "DELIVERED" || normalized.includes("DELIVERED");
}

function buildShippingSnapshot(details: OrderDetailsRecord) {
  const snapshot = {
    status: normalizeShippingStatus(details.shipping_status || ""),
    notes: getString(details.shipping_notes),
    method: getString(details.shipping_method),
    carrier: getString(details.shipping_carrier),
    tracking: getString(details.tracking_number),
  };
  return JSON.stringify(snapshot);
}

function buildShippingUpdateNote(details: OrderDetailsRecord, checkedAt: string) {
  const parts: string[] = [];
  const status = getString(details.shipping_status);
  if (status) parts.push(`Status: ${status}`);
  const method = getString(details.shipping_method);
  if (method) parts.push(`Method: ${method}`);
  const carrier = getString(details.shipping_carrier);
  if (carrier) parts.push(`Carrier: ${carrier}`);
  const tracking = getString(details.tracking_number);
  if (tracking) parts.push(`Tracking: ${tracking}`);
  const trackingUrl = getString(details.tracking_url);
  if (trackingUrl) parts.push(`Tracking URL: ${trackingUrl}`);
  const notes = getString(details.shipping_notes);
  if (notes) parts.push(`Notes: ${notes}`);
  if (!parts.length) return "";
  return `Shipping update on ${checkedAt}: ${parts.join(" | ")}`;
}

async function shouldAppendShippingNote(env: Env, requestId: string, snapshot: string) {
  if (!env.HEERAWALLA_ACKS) return true;
  const key = buildShippingSnapshotKey(requestId);
  if (!key) return true;
  const existing = await env.HEERAWALLA_ACKS.get(key);
  if (existing === snapshot) return false;
  await env.HEERAWALLA_ACKS.put(key, snapshot);
  return true;
}

function resolveOrderPaymentUrl(env: Env, requestId: string, email: string, token = "") {
  const template = getString(env.ORDER_CONFIRMATION_PAYMENT_URL);
  if (!template) return "";
  return template
    .replace(/\{requestId\}/g, requestId)
    .replace(/\{token\}/g, token)
    .replace(/\{email\}/g, email || "");
}

function resolveQuotePaymentUrl(env: Env, requestId: string, token = "", metal = "", option = "") {
  const template = getString(env.QUOTE_PAYMENT_URL || QUOTE_PAYMENT_URL);
  if (!template) return "";
  return template
    .replace(/\{requestId\}/g, requestId)
    .replace(/\{token\}/g, token)
    .replace(/\{metal\}/g, metal)
    .replace(/\{option\}/g, option);
}

function buildQuoteEmail(
  record: QuoteConfirmationRecord,
  quoteUrl: string,
  options?: { refreshed?: boolean }
) {
  const requestId = record.requestId || "";
  const name = record.name || "there";
  const product = record.productName || "your piece";
  const refreshed = Boolean(options?.refreshed);
  const subject = refreshed
    ? requestId
      ? `Heerawalla - Updated quote (${requestId})`
      : "Heerawalla - Updated quote"
    : requestId
    ? `Heerawalla - Your personal quote is ready (${requestId})`
    : "Heerawalla - Your personal quote is ready";
  const heading = refreshed ? "Your quote has been updated" : "Your personal quote is ready";
  const intro = refreshed
    ? `Hello ${name}, we updated your quote for ${product}.`
    : `Hello ${name}, your quote for ${product} is ready to review.`;
  const followUp = refreshed
    ? "Please use the new link below. The previous link is no longer valid."
    : "This private link is valid for 72 hours.";
  const validityLine = "This private link is valid for 72 hours.";
  const textBody = [
    `Hello ${name},`,
    "",
    refreshed
      ? `We updated your quote for ${product}.`
      : `Your personal quote for ${product} is ready to review.`,
    `Use your private link (valid for 72 hours): ${quoteUrl}`,
    "",
    refreshed
      ? "Your previous link is no longer valid."
      : "Your link is private and can be used once to begin purchase.",
    "If you need changes, reply to this email and our concierge will assist.",
    "",
    "Warm regards,",
    "Heerawalla",
    "www.heerawalla.com",
  ].join("\n");

  const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f6f5f2;color:#0f172a;font-family:-apple-system, Segoe UI, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:36px 40px 28px 40px;">
              <div style="margin:0 0 16px 0;">
                <img src="https://www.heerawalla.com/images/engraving_mark.svg" width="36" height="36" alt="Heerawalla" style="display:block;">
              </div>
              <div style="font-family:'Baskervville','Cormorant Garamond',serif;font-size:24px;letter-spacing:0.08em;text-transform:none;color:#0b1928;margin-bottom:12px;">
                Heerawalla
              </div>
              <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.4;font-weight:600;color:#0f172a;">
                ${escapeHtml(heading)}
              </h1>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
                ${escapeHtml(intro)}
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;">
                <tr>
                  <td style="background:#0f172a;border:1px solid #0f172a;">
                    <a href="${escapeHtml(quoteUrl)}" style="display:inline-block;padding:12px 22px;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#ffffff;text-decoration:none;">View your quote</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px 0;font-size:13px;line-height:1.7;color:#475569;">
                ${escapeHtml(followUp)}
              </p>
              ${
                refreshed
                  ? `<p style="margin:0 0 24px 0;font-size:13px;line-height:1.7;color:#475569;">
                ${escapeHtml(validityLine)}
              </p>`
                  : ""
              }
              <p style="margin:0 0 24px 0;font-size:13px;line-height:1.7;color:#475569;">
                If you need adjustments, reply to this email and our concierge will assist.
              </p>
              <div style="height:1px;background:#e5e7eb;margin:0 0 18px 0;"></div>
              <p style="margin:0 0 6px 0;font-size:14px;color:#0f172a;">Warm regards,</p>
              <p style="margin:0 0 10px 0;font-size:14px;font-weight:600;color:#0f172a;">Heerawalla</p>
              <p style="margin:0;font-size:12px;color:#64748b;">
                <a href="https://www.heerawalla.com" style="color:#64748b;text-decoration:underline;">www.heerawalla.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, textBody, htmlBody };
}

function buildChangeSummaryText(changes: ConfirmationChange[]) {
  if (!changes.length) return "";
  return changes
    .map((change) => {
      const label = change.label || change.key || "Update";
      const fromValue = change.from || "--";
      const toValue = change.to || "--";
      return `${label}: ${fromValue} -> ${toValue}`;
    })
    .join("\n");
}

function buildChangeSummaryHtml(changes: ConfirmationChange[]) {
  if (!changes.length) return "";
  const rows = changes
    .map((change) => {
      const label = escapeHtml(change.label || change.key || "Update");
      const fromValue = escapeHtml(change.from || "--");
      const toValue = escapeHtml(change.to || "--");
      return `<tr>
        <td style="padding:8px 0;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.18em;">${label}</td>
        <td style="padding:8px 0;font-size:14px;color:#0f172a;">
          <span style="color:#94a3b8;text-decoration:line-through;">${fromValue}</span>
          <span style="margin:0 6px;color:#94a3b8;">→</span>
          <strong>${toValue}</strong>
        </td>
      </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table>`;
}

function parseCertificateLines(value: string) {
  return value
    .split(/\r?\n|,/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatMultilineHtml(value: string) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

function buildOrderStatusEmail(payload: {
  status: string;
  requestId: string;
  name: string;
  email: string;
  productName: string;
  confirmationUrl?: string;
  paymentUrl?: string;
  cancelUrl?: string;
  changes?: ConfirmationChange[];
  orderDetails?: OrderDetailsRecord | null;
  authenticityUrl?: string;
}) {
  const status = normalizeOrderStatus(payload.status);
  const reference = formatOrderReference(payload.requestId);
  const customerName = payload.name || "there";
  const productName = payload.productName || "your piece";
  const confirmationUrl = payload.confirmationUrl || "";
  const paymentUrl = payload.paymentUrl || "";
  const cancelUrl = payload.cancelUrl || "";
  const orderDetails = payload.orderDetails || null;
  const authenticityUrl = payload.authenticityUrl || "";
  const changeSummaryText = payload.changes ? buildChangeSummaryText(payload.changes) : "";
  const changeSummaryHtml = payload.changes ? buildChangeSummaryHtml(payload.changes) : "";

  const baseDetails = [
    `Request: ${reference}`,
    `Piece: ${productName}`,
  ];
  const detailLines = [...baseDetails];

  if (orderDetails) {
    const carrier = getString(orderDetails.shipping_carrier);
    const tracking = getString(orderDetails.tracking_number);
    const trackingUrl = getString(orderDetails.tracking_url);
    const shippingStatus = getString(orderDetails.shipping_status);
    const deliveryEta = getString(orderDetails.delivery_eta);
    const deliveredAt = getString(orderDetails.delivered_at);
    if (carrier) detailLines.push(`Carrier: ${carrier}`);
    if (tracking) detailLines.push(`Tracking: ${tracking}`);
    if (trackingUrl) detailLines.push(`Tracking URL: ${trackingUrl}`);
    if (shippingStatus) detailLines.push(`Shipment status: ${shippingStatus}`);
    if (deliveryEta) detailLines.push(`Delivery ETA: ${deliveryEta}`);
    if (deliveredAt) detailLines.push(`Delivered: ${deliveredAt}`);
  }

  let subject = `Heerawalla - Order update [${reference}]`;
  let title = "Order update";
  let intro = "";
  let ctaLabel = "";
  let ctaUrl = "";
  let secondaryLabel = "";
  let secondaryUrl = "";
  let footer = "Warm regards,\nHeerawalla";
  let detailIntro = "Order details";
  let extraHtml = "";
  let extraText = "";

  switch (status) {
    case "ACKNOWLEDGED":
      subject = `Heerawalla - We received your order request [${reference}]`;
      title = "We received your order request";
      intro = `Thank you, ${customerName}. Your request for ${productName} is in good hands. A concierge will confirm availability and sizing shortly.`;
      detailIntro = "Order summary";
      break;
    case "PENDING_CONFIRMATION":
      if (!confirmationUrl) return null;
      subject = `Heerawalla - Please confirm your updated order [${reference}]`;
      title = "Please confirm your updated order";
      intro = `Hello ${customerName}, your concierge updated the details for ${productName}. Review the changes and confirm to continue to secure checkout.`;
      ctaLabel = "Review and confirm";
      ctaUrl = confirmationUrl;
      detailIntro = "Updated details";
      if (changeSummaryText) {
        extraText = `\nChanges:\n${changeSummaryText}`;
      }
      if (changeSummaryHtml) {
        extraHtml = `<div style="margin-top:16px;">${changeSummaryHtml}</div>`;
      }
      break;
    case "INVOICED":
      subject = `Heerawalla - Your secure checkout link is ready [${reference}]`;
      title = "Your secure checkout link is ready";
      intro = `Your concierge prepared secure checkout for ${productName}. Complete payment to reserve your piece.`;
      ctaLabel = "Open secure checkout";
      ctaUrl = paymentUrl;
      secondaryLabel = cancelUrl ? "Cancel order" : "";
      secondaryUrl = cancelUrl;
      detailIntro = "Order summary";
      break;
    case "INVOICE_EXPIRED":
      subject = `Heerawalla - Your payment link expired [${reference}]`;
      title = "Your payment link expired";
      intro = `We can reopen secure checkout whenever you're ready. Use the link below or reply to this email if you'd like to pause or cancel.`;
      ctaLabel = paymentUrl ? "Reopen secure checkout" : "";
      ctaUrl = paymentUrl;
      secondaryLabel = cancelUrl ? "Cancel order" : "";
      secondaryUrl = cancelUrl;
      detailIntro = "Order summary";
      break;
    case "INVOICE_PAID":
      subject = `Heerawalla - Payment received [${reference}]`;
      title = "Payment received";
      intro = `Thank you. Your payment is confirmed and your piece is reserved. Our atelier will begin next steps shortly.`;
      detailIntro = "Order summary";
      break;
    case "PROCESSING":
      subject = `Heerawalla - Your piece is in production [${reference}]`;
      title = "Your piece is in production";
      intro = `Our atelier has started crafting ${productName}. We'll keep you updated at key milestones.`;
      detailIntro = "Order summary";
      break;
    case "SHIPPED":
      subject = `Heerawalla - Your order has shipped [${reference}]`;
      title = "Your order has shipped";
      intro = `Your piece is on its way. Track shipment details below or reply if you need anything.`;
      if (orderDetails) {
        const trackingUrl = getString(orderDetails.tracking_url);
        if (trackingUrl) {
          ctaLabel = "Track shipment";
          ctaUrl = trackingUrl;
        }
        const shippingNotes = getString(orderDetails.shipping_notes);
        if (shippingNotes) {
          extraText = `\nShipping notes:\n${shippingNotes}`;
          extraHtml = `<p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:#475569;"><strong>Shipping notes:</strong><br>${formatMultilineHtml(
            shippingNotes
          )}</p>`;
        }
      }
      detailIntro = "Shipment details";
      break;
    case "DELIVERED":
      subject = `Heerawalla - Welcome to the family [${reference}]`;
      title = "Welcome to the Heerawalla family";
      intro = `Your ${productName} has been delivered. We're honored to welcome you into the Heerawalla family & friends.`;
      detailIntro = "Your order";
      if (authenticityUrl) {
        ctaLabel = "Verify authenticity";
        ctaUrl = authenticityUrl;
      }
      if (orderDetails) {
        const certificateLines = parseCertificateLines(getString(orderDetails.certificates));
        const careDetails = getString(orderDetails.care_details);
        const warrantyDetails = getString(orderDetails.warranty_details);
        const serviceDetails = getString(orderDetails.service_details);
        const sections: Array<{ title: string; body: string }> = [];
        if (certificateLines.length) {
          sections.push({
            title: "Certificates",
            body: certificateLines.map((line) => `- ${line}`).join("\n"),
          });
        }
        if (careDetails) {
          sections.push({ title: "Care instructions", body: careDetails });
        }
        if (warrantyDetails) {
          sections.push({ title: "Warranty", body: warrantyDetails });
        }
        if (serviceDetails) {
          sections.push({ title: "Service", body: serviceDetails });
        }
        if (sections.length) {
          extraText = sections
            .map((section) => `\n${section.title}:\n${section.body}`)
            .join("");
          extraHtml = sections
            .map(
              (section) => `<div style="margin-top:16px;">
                <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;">${escapeHtml(
                  section.title
                )}</div>
                <div style="font-size:13px;line-height:1.6;color:#475569;">${formatMultilineHtml(
                  section.body
                )}</div>
              </div>`
            )
            .join("");
        }
      }
      if (authenticityUrl) {
        const verifyText = `\nVerify authenticity: ${authenticityUrl}\nUse your order number and the email or phone on file.`;
        extraText = `${extraText}${verifyText}`;
        extraHtml = `${extraHtml}<p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:#475569;">
          Verify authenticity at <a href="${escapeHtml(
            authenticityUrl
          )}" style="color:#0f172a;text-decoration:underline;">Heerawalla.com/authenticity</a> using your order number and the email or phone on file.
        </p>`;
      }
      break;
    case "CANCELLED":
      subject = `Heerawalla - Order canceled [${reference}]`;
      title = "Order canceled";
      intro = `We've noted your order as canceled. If you'd like to revisit the design or timing, reply and we'll assist.`;
      detailIntro = "Order summary";
      break;
    default:
      return null;
  }

  if ((status === "INVOICED" || status === "INVOICE_EXPIRED") && !paymentUrl) {
    return null;
  }

  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);
  const safeDetailIntro = escapeHtml(detailIntro);
  const detailRows = detailLines
    .map((line) => {
      const [label, value] = line.split(": ");
      return `<tr>
        <td style="padding:6px 0;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.18em;">${escapeHtml(
          label
        )}</td>
        <td style="padding:6px 0;font-size:14px;color:#0f172a;">${escapeHtml(value || "")}</td>
      </tr>`;
    })
    .join("");

  const ctaBlock = ctaLabel && ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:18px;">
        <tr>
          <td style="background:#0f172a;">
            <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:12px 22px;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#ffffff;text-decoration:none;">${escapeHtml(
              ctaLabel
            )}</a>
          </td>
        </tr>
      </table>`
    : "";
  const secondaryBlock = secondaryLabel && secondaryUrl
    ? `<p style="margin:14px 0 0 0;font-size:12px;">
        <a href="${escapeHtml(secondaryUrl)}" style="color:#0f172a;text-decoration:underline;">${escapeHtml(
          secondaryLabel
        )}</a>
      </p>`
    : "";

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial, sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:28px 32px;">
                <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#94a3b8;">Order update</p>
                <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:600;color:#0f172a;">${safeTitle}</h1>
                <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#475569;">${safeIntro}</p>
                <div style="border-top:1px solid #e2e8f0;padding-top:16px;">
                  <div style="font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#94a3b8;">${safeDetailIntro}</div>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;border-collapse:collapse;">
                    ${detailRows}
                  </table>
                  ${extraHtml}
                  ${ctaBlock}
                  ${secondaryBlock}
                </div>
                <p style="margin:20px 0 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
                  Reply to this email if you need anything in the meantime.
                </p>
                <p style="margin:16px 0 0 0;font-size:14px;color:#0f172a;">Warm regards,<br>Heerawalla</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textLines = [
    title,
    "",
    intro,
    "",
    detailIntro,
    ...detailLines,
    extraText,
    ctaLabel && ctaUrl ? "" : "",
    ctaLabel && ctaUrl ? `${ctaLabel}: ${ctaUrl}` : "",
    secondaryLabel && secondaryUrl ? `${secondaryLabel}: ${secondaryUrl}` : "",
    "",
    footer,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { subject, textBody: textLines, htmlBody };
}

async function processOrderStatusEmails(env: Env) {
  if (!env.HEERAWALLA_ACKS) return;
  if (!isEnabled(env.SEND_STATUS_UPDATES, true)) return;

  if (hasD1(env)) {
    const rows = await d1All(
      env,
      "SELECT request_id, status, status_updated_at, created_at, email, name, product_name FROM orders"
    );
    if (!rows.length) return;

    const intervalMs = getStatusEmailIntervalHours(env) * 60 * 60 * 1000;
    const invoiceDelayMs = getInvoiceEmailDelayMs(env);
    const now = Date.now();

    const useResend = Boolean(env.RESEND_API_KEY);
    const resendThrottleMs = 600;
    for (const row of rows) {
      const requestId = getString(row.request_id);
      const statusRaw = getString(row.status);
      const status = normalizeOrderStatus(statusRaw);
      if (!requestId || !status || STATUS_EMAIL_SKIP_STATUSES.has(status)) continue;
      const email = getString(row.email);
      if (!email) continue;
      const name = getString(row.name);
      const productName = getString(row.product_name);
      const statusUpdatedAt = getString(row.status_updated_at) || getString(row.created_at) || "";
      const statusUpdatedMs = Date.parse(statusUpdatedAt);

      const existingRecord = await getOrderStatusEmailRecord(env, requestId, status);
      const isNewStatus = !existingRecord || existingRecord.statusUpdatedAt !== statusUpdatedAt;
      const attempts = existingRecord && !isNewStatus ? existingRecord.attempts : 0;
      const lastSentAt = existingRecord && !isNewStatus ? existingRecord.lastSentAt : "";

      if (attempts >= STATUS_EMAIL_MAX_ATTEMPTS) continue;
      if (!isNewStatus && !STATUS_EMAIL_REMINDER_STATUSES.has(status)) continue;

      if (!isNewStatus && STATUS_EMAIL_REMINDER_STATUSES.has(status)) {
        if (!lastSentAt) continue;
        const lastSentMs = Date.parse(lastSentAt);
        if (!Number.isFinite(lastSentMs) || now - lastSentMs < intervalMs) {
          continue;
        }
      }
      if (status === "INVOICED" && isNewStatus && Number.isFinite(statusUpdatedMs)) {
        if (now - statusUpdatedMs < invoiceDelayMs) {
          continue;
        }
      }

      let confirmationUrl = "";
      let cancelUrl = "";
      let changes: ConfirmationChange[] = [];
      let orderDetails: OrderDetailsRecord | null = null;
      if (status === "PENDING_CONFIRMATION") {
        const token = await getOrderConfirmationTokenByRequestId(env, requestId);
        if (!token) continue;
        const record = await getOrderConfirmationRecord(env, token);
        if (!record || record.status !== "pending") continue;
        confirmationUrl = buildOrderConfirmationPageUrl(env, token);
        changes = record.changes || [];
      }
      if (status === "INVOICED" || status === "INVOICE_EXPIRED") {
        const cancelRecord = await ensureOrderCancelRecord(env, requestId, email, name, productName);
        cancelUrl = buildOrderCancelPageUrl(env, cancelRecord.token);
      }
      if (status === "INVOICED" || status === "INVOICE_EXPIRED" || status === "SHIPPED" || status === "DELIVERED") {
        orderDetails = await getOrderDetailsRecord(env, requestId);
      }

      const paymentUrl =
        (orderDetails && getString(orderDetails.payment_url)) ||
        resolveOrderPaymentUrl(env, requestId, email, "");
      const emailPayload = buildOrderStatusEmail({
        status,
        requestId,
        name,
        email,
        productName,
        confirmationUrl,
        paymentUrl,
        cancelUrl,
        changes,
        orderDetails,
        authenticityUrl: status === "DELIVERED" ? buildOrderAuthenticityPageUrl(env) : "",
      });
      if (!emailPayload) continue;

      try {
        await sendEmail(env, {
          to: [email],
          sender: "Heerawalla <atelier@heerawalla.com>",
          replyTo: getCustomerReplyTo(),
          subject: emailPayload.subject,
          textBody: emailPayload.textBody,
          htmlBody: emailPayload.htmlBody,
        });
        const nextAttempts = attempts + 1;
        const sentAt = new Date().toISOString();
        await storeOrderStatusEmailRecord(env, requestId, status, {
          status,
          statusUpdatedAt,
          lastSentAt: sentAt,
          attempts: nextAttempts,
        });
        const noteType = isNewStatus ? "Status email sent" : "Reminder sent";
        await appendOrderNote(
          env,
          requestId,
          `${noteType}: ${status} (attempt ${nextAttempts}/${STATUS_EMAIL_MAX_ATTEMPTS}) on ${sentAt}.`
        );
        if (useResend && resendThrottleMs > 0) {
          await sleep(resendThrottleMs);
        }
      } catch (error) {
        const errorMessage = String(error);
        logWarn("order_status_email_failed", { requestId, status, error: errorMessage });
        if (useResend && isResendRateLimitError(errorMessage)) {
          break;
        }
      }
    }
    return;
  }

  const config = getSheetConfig(env, "order");
  const headerRows = await fetchSheetValues(env, config.sheetId, config.headerRange);
  const headerRow = headerRows[0] && headerRows[0].length ? headerRows[0] : [];
  const headerConfig = resolveHeaderConfig(headerRow, ORDER_SHEET_HEADER, "request_id");
  if (!headerConfig.header.length) return;

  const headerIndex = new Map<string, number>();
  headerConfig.header.forEach((cell, idx) => {
    headerIndex.set(String(cell || "").trim().toLowerCase(), idx);
  });

  const requestIdIdx = headerIndex.get("request_id") ?? -1;
  const statusIdx = headerIndex.get("status") ?? -1;
  const statusUpdatedIdx = headerIndex.get("status_updated_at") ?? -1;
  const createdAtIdx = headerIndex.get("created_at") ?? -1;
  const emailIdx = headerIndex.get("email") ?? -1;
  const nameIdx = headerIndex.get("name") ?? -1;
  const productIdx = headerIndex.get("product_name") ?? -1;
  if ([requestIdIdx, statusIdx, emailIdx].some((idx) => idx < 0)) return;

  const rows = await fetchSheetValues(
    env,
    config.sheetId,
    `${config.sheetName}!A${headerConfig.rowStart}:AZ`
  );
  if (!rows.length) return;

  const intervalMs = getStatusEmailIntervalHours(env) * 60 * 60 * 1000;
  const invoiceDelayMs = getInvoiceEmailDelayMs(env);
  const now = Date.now();

  const useResend = Boolean(env.RESEND_API_KEY);
  const resendThrottleMs = 600;
  for (const row of rows) {
    const requestId = getString(row[requestIdIdx]);
    const statusRaw = getString(row[statusIdx]);
    const status = normalizeOrderStatus(statusRaw);
    if (!requestId || !status || STATUS_EMAIL_SKIP_STATUSES.has(status)) continue;
    const email = getString(row[emailIdx]);
    if (!email) continue;
    const name = nameIdx >= 0 ? getString(row[nameIdx]) : "";
    const productName = productIdx >= 0 ? getString(row[productIdx]) : "";
    const statusUpdatedAt =
      (statusUpdatedIdx >= 0 ? getString(row[statusUpdatedIdx]) : "") ||
      (createdAtIdx >= 0 ? getString(row[createdAtIdx]) : "") ||
      "";
    const statusUpdatedMs = Date.parse(statusUpdatedAt);

    const existingRecord = await getOrderStatusEmailRecord(env, requestId, status);
    const isNewStatus = !existingRecord || existingRecord.statusUpdatedAt !== statusUpdatedAt;
    const attempts = existingRecord && !isNewStatus ? existingRecord.attempts : 0;
    const lastSentAt = existingRecord && !isNewStatus ? existingRecord.lastSentAt : "";

    if (attempts >= STATUS_EMAIL_MAX_ATTEMPTS) continue;
    if (!isNewStatus && !STATUS_EMAIL_REMINDER_STATUSES.has(status)) continue;

    if (!isNewStatus && STATUS_EMAIL_REMINDER_STATUSES.has(status)) {
      if (!lastSentAt) continue;
      const lastSentMs = Date.parse(lastSentAt);
      if (!Number.isFinite(lastSentMs) || now - lastSentMs < intervalMs) {
        continue;
      }
    }
    if (status === "INVOICED" && isNewStatus && Number.isFinite(statusUpdatedMs)) {
      if (now - statusUpdatedMs < invoiceDelayMs) {
        continue;
      }
    }

    let confirmationUrl = "";
    let cancelUrl = "";
    let changes: ConfirmationChange[] = [];
    let orderDetails: OrderDetailsRecord | null = null;
    if (status === "PENDING_CONFIRMATION") {
      const token = await getOrderConfirmationTokenByRequestId(env, requestId);
      if (!token) continue;
      const record = await getOrderConfirmationRecord(env, token);
      if (!record || record.status !== "pending") continue;
      confirmationUrl = buildOrderConfirmationPageUrl(env, token);
      changes = record.changes || [];
    }
    if (status === "INVOICED" || status === "INVOICE_EXPIRED") {
      const cancelRecord = await ensureOrderCancelRecord(env, requestId, email, name, productName);
      cancelUrl = buildOrderCancelPageUrl(env, cancelRecord.token);
    }
    if (status === "INVOICED" || status === "INVOICE_EXPIRED" || status === "SHIPPED" || status === "DELIVERED") {
      orderDetails = await getOrderDetailsRecord(env, requestId);
    }

    const paymentUrl =
      (orderDetails && getString(orderDetails.payment_url)) ||
      resolveOrderPaymentUrl(env, requestId, email, "");
    const emailPayload = buildOrderStatusEmail({
      status,
      requestId,
      name,
      email,
      productName,
      confirmationUrl,
      paymentUrl,
      cancelUrl,
      changes,
      orderDetails,
      authenticityUrl: status === "DELIVERED" ? buildOrderAuthenticityPageUrl(env) : "",
    });
    if (!emailPayload) continue;

    try {
      await sendEmail(env, {
        to: [email],
        sender: "Heerawalla <atelier@heerawalla.com>",
        replyTo: getCustomerReplyTo(),
        subject: emailPayload.subject,
        textBody: emailPayload.textBody,
        htmlBody: emailPayload.htmlBody,
      });
      const nextAttempts = attempts + 1;
      const sentAt = new Date().toISOString();
      await storeOrderStatusEmailRecord(env, requestId, status, {
        status,
        statusUpdatedAt,
        lastSentAt: sentAt,
        attempts: nextAttempts,
      });
      const noteType = isNewStatus ? "Status email sent" : "Reminder sent";
      await appendOrderNote(
        env,
        requestId,
        `${noteType}: ${status} (attempt ${nextAttempts}/${STATUS_EMAIL_MAX_ATTEMPTS}) on ${sentAt}.`
      );
      if (useResend && resendThrottleMs > 0) {
        await sleep(resendThrottleMs);
      }
    } catch (error) {
      const errorMessage = String(error);
      logWarn("order_status_email_failed", { requestId, status, error: errorMessage });
      if (useResend && isResendRateLimitError(errorMessage)) {
        break;
      }
    }
  }
}

async function processShippedOrderUpdates(env: Env) {
  let detailsMap: Map<string, OrderDetailsRecord>;
  try {
    detailsMap = await loadOrderDetailsMap(env);
  } catch (error) {
    logWarn("shipping_details_load_failed", { error: String(error) });
    return;
  }
  if (!detailsMap.size) return;

  if (hasD1(env)) {
    const rows = await d1All(env, "SELECT request_id, status, notes FROM orders WHERE status = 'SHIPPED'");
    if (!rows.length) return;
    const intervalMs = ORDER_SHIPPING_CHECK_INTERVAL_HOURS * 60 * 60 * 1000;
    const now = Date.now();
    const checkedAt = new Date(now).toISOString();

    for (const row of rows) {
      const requestId = getString(row.request_id);
      if (!requestId) continue;
      const status = normalizeOrderStatus(getString(row.status));
      if (status !== "SHIPPED") continue;
      const details = detailsMap.get(normalizeRequestId(requestId));
      if (!details) continue;

      const lastCheckRaw = getString(details.last_shipping_check_at);
      if (lastCheckRaw) {
        const lastCheckMs = Date.parse(lastCheckRaw);
        if (Number.isFinite(lastCheckMs) && now - lastCheckMs < intervalMs) {
          continue;
        }
      }

      const shippingSnapshot = buildShippingSnapshot(details);
      const shouldAppend = await shouldAppendShippingNote(env, requestId, shippingSnapshot);
      const shippingNote = shouldAppend ? buildShippingUpdateNote(details, checkedAt) : "";
      const delivered = isDeliveredShippingStatus(details.shipping_status || "");

      if (delivered) {
        const existingNotes = getString(row.notes);
        const combinedNotes = appendNote(
          appendNote(existingNotes, shippingNote),
          buildStatusAuditNote("DELIVERED")
        );
        await updateAdminRow(env, "order", requestId, "DELIVERED", combinedNotes, {});
        await upsertOrderDetailsRecord(
          env,
          requestId,
          {
            delivered_at: getString(details.delivered_at) || checkedAt,
            shipping_status: getString(details.shipping_status) || "Delivered",
            last_shipping_check_at: checkedAt,
          },
          "DELIVERED",
          "cron"
        );
        continue;
      }

      if (shippingNote) {
        await appendOrderNote(env, requestId, shippingNote);
      }

      await upsertOrderDetailsRecord(
        env,
        requestId,
        { last_shipping_check_at: checkedAt },
        status,
        "cron"
      );
    }
    return;
  }

  const config = getSheetConfig(env, "order");
  const headerRows = await fetchSheetValues(env, config.sheetId, config.headerRange);
  const headerRow = headerRows[0] && headerRows[0].length ? headerRows[0] : [];
  const headerConfig = resolveHeaderConfig(headerRow, ORDER_SHEET_HEADER, "request_id");
  if (!headerConfig.header.length) return;

  const headerIndex = new Map<string, number>();
  headerConfig.header.forEach((cell, idx) => {
    headerIndex.set(String(cell || "").trim().toLowerCase(), idx);
  });

  const requestIdIdx = headerIndex.get("request_id") ?? -1;
  const statusIdx = headerIndex.get("status") ?? -1;
  const notesIdx = headerIndex.get("notes") ?? -1;
  if ([requestIdIdx, statusIdx, notesIdx].some((idx) => idx < 0)) return;

  const rows = await fetchSheetValues(
    env,
    config.sheetId,
    `${config.sheetName}!A${headerConfig.rowStart}:AZ`
  );
  if (!rows.length) return;

  const intervalMs = ORDER_SHIPPING_CHECK_INTERVAL_HOURS * 60 * 60 * 1000;
  const now = Date.now();
  const checkedAt = new Date(now).toISOString();

  for (const row of rows) {
    const requestId = getString(row[requestIdIdx]);
    if (!requestId) continue;
    const status = normalizeOrderStatus(getString(row[statusIdx]));
    if (status !== "SHIPPED") continue;
    const details = detailsMap.get(normalizeRequestId(requestId));
    if (!details) continue;

    const lastCheckRaw = getString(details.last_shipping_check_at);
    if (lastCheckRaw) {
      const lastCheckMs = Date.parse(lastCheckRaw);
      if (Number.isFinite(lastCheckMs) && now - lastCheckMs < intervalMs) {
        continue;
      }
    }

    const shippingSnapshot = buildShippingSnapshot(details);
    const shouldAppend = await shouldAppendShippingNote(env, requestId, shippingSnapshot);
    const shippingNote = shouldAppend ? buildShippingUpdateNote(details, checkedAt) : "";
    const delivered = isDeliveredShippingStatus(details.shipping_status || "");

    if (delivered) {
      const existingNotes = getString(row[notesIdx]);
      const combinedNotes = appendNote(
        appendNote(existingNotes, shippingNote),
        buildStatusAuditNote("DELIVERED")
      );
      await updateAdminRow(env, "order", requestId, "DELIVERED", combinedNotes, {});
      await upsertOrderDetailsRecord(
        env,
        requestId,
        {
          delivered_at: getString(details.delivered_at) || checkedAt,
          shipping_status: getString(details.shipping_status) || "Delivered",
          last_shipping_check_at: checkedAt,
        },
        "DELIVERED",
        "cron"
      );
      continue;
    }

    if (shippingNote) {
      await appendOrderNote(env, requestId, shippingNote);
    }

    await upsertOrderDetailsRecord(
      env,
      requestId,
      { last_shipping_check_at: checkedAt },
      status,
      "cron"
    );
  }
}

async function recordOrderStatusEmailSent(
  env: Env,
  requestId: string,
  status: string,
  statusUpdatedAtOverride?: string
) {
  if (!env.HEERAWALLA_ACKS) return;
  const normalizedStatus = normalizeOrderStatus(status);
  if (!normalizedStatus || STATUS_EMAIL_SKIP_STATUSES.has(normalizedStatus)) return;
  let statusUpdatedAt = getString(statusUpdatedAtOverride);
  if (!statusUpdatedAt) {
    const lookup = await findSheetRowByRequestId(env, "order", requestId);
    const statusUpdatedIdx = lookup?.headerIndex.get("status_updated_at") ?? -1;
    const createdAtIdx = lookup?.headerIndex.get("created_at") ?? -1;
    const row = lookup?.row || [];
    statusUpdatedAt =
      (statusUpdatedIdx >= 0 ? getString(row[statusUpdatedIdx]) : "") ||
      (createdAtIdx >= 0 ? getString(row[createdAtIdx]) : "") ||
      "";
  }
  const existing = await getOrderStatusEmailRecord(env, requestId, normalizedStatus);
  const sameStatus = existing && existing.statusUpdatedAt === statusUpdatedAt;
  const attempts = sameStatus ? existing.attempts : 0;
  const sentAt = new Date().toISOString();
  const nextAttempts = attempts + 1;
  await storeOrderStatusEmailRecord(env, requestId, normalizedStatus, {
    status: normalizedStatus,
    statusUpdatedAt,
    lastSentAt: sentAt,
    attempts: nextAttempts,
  });
  await appendOrderNote(
    env,
    requestId,
    `Status email sent: ${normalizedStatus} (attempt ${nextAttempts}/${STATUS_EMAIL_MAX_ATTEMPTS}) on ${sentAt}.`
  );
}

async function safeJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => getString(entry)).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[|,]/g)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function extractUtmFromUrl(urlValue: string) {
  if (!urlValue) return {};
  try {
    const url = new URL(urlValue);
    return {
      utmSource: url.searchParams.get("utm_source") || "",
      utmMedium: url.searchParams.get("utm_medium") || "",
      utmCampaign: url.searchParams.get("utm_campaign") || "",
      utmTerm: url.searchParams.get("utm_term") || "",
      utmContent: url.searchParams.get("utm_content") || "",
    };
  } catch {
    return {};
  }
}

function resolveAttribution(payload: Record<string, unknown>, request: Request) {
  const referrerInput =
    getString(payload.referrer || payload.referrerUrl || payload.pageReferrer) ||
    request.headers.get("Referer") ||
    "";
  const utmFromPayload = {
    utmSource: getString(payload.utmSource || payload.utm_source),
    utmMedium: getString(payload.utmMedium || payload.utm_medium),
    utmCampaign: getString(payload.utmCampaign || payload.utm_campaign),
    utmTerm: getString(payload.utmTerm || payload.utm_term),
    utmContent: getString(payload.utmContent || payload.utm_content),
  };
  const utmFromUrl = extractUtmFromUrl(referrerInput);

  return {
    utmSource: utmFromPayload.utmSource || utmFromUrl.utmSource || "",
    utmMedium: utmFromPayload.utmMedium || utmFromUrl.utmMedium || "",
    utmCampaign: utmFromPayload.utmCampaign || utmFromUrl.utmCampaign || "",
    utmTerm: utmFromPayload.utmTerm || utmFromUrl.utmTerm || "",
    utmContent: utmFromPayload.utmContent || utmFromUrl.utmContent || "",
    referrer: referrerInput,
  };
}

function getBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["1", "true", "yes", "y", "on"].includes(normalized);
  }
  return false;
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function isValidPhone(value: string) {
  return normalizePhone(value).length >= 7;
}

function normalizeContactPreference(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  if (["phone", "call"].includes(normalized)) return "phone";
  if (["meet", "video"].includes(normalized)) return "meet";
  return "";
}

function normalizeTimeline(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "Standard";
  if (normalized.includes("rush")) return "Rush";
  if (normalized.includes("standard")) return "Standard";
  return "Standard";
}

function generateRequestId() {
  const bytes = new Uint8Array(REQUEST_ID_LENGTH);
  crypto.getRandomValues(bytes);
  let id = "";
  for (const byte of bytes) {
    id += REQUEST_ID_ALPHABET[byte % REQUEST_ID_ALPHABET.length];
  }
  return id;
}

type DateParts = {
  year: number;
  month: number;
  day: number;
  weekday?: string;
};

type CalendarConfig = {
  calendarId: string;
  timeZone: string;
  slotMinutes: number;
  bufferMinutes: number;
  leadHours: number;
  windows: Array<{
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  }>;
  holidayCalendarId: string;
};

type CalendarBookingRequest = {
  name: string;
  email: string;
  message: string;
  date: string;
  time: string;
  phone?: string;
  phonePreferred?: boolean;
  contactPreference?: string;
  requestId?: string;
  replaceExisting?: boolean;
};

type ConsultationAckPayload = {
  name: string;
  email: string;
  phone?: string;
  phonePreferred?: boolean;
  contactPreference?: string;
  requestId?: string;
  start: Date;
  end: Date;
  timeZone: string;
  meetingLink?: string;
};

type BusyInterval = { start: Date; end: Date };

type ExistingBooking = {
  id: string;
  start: string;
  end: string;
  timeZone: string;
  meetingLink?: string;
};

class BookingError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(code: string, details?: Record<string, unknown>) {
    super(code);
    this.code = code;
    this.details = details;
  }
}

function getCalendarConfig(env: Env): CalendarConfig {
  const calendarId = (env.GOOGLE_CALENDAR_ID || "").trim();
  if (!calendarId) {
    throw new Error("calendar_config_missing");
  }
  return {
    calendarId,
    timeZone: CALENDAR_TIMEZONE,
    slotMinutes: CALENDAR_SLOT_MINUTES,
    bufferMinutes: CALENDAR_BUFFER_MINUTES,
    leadHours: CALENDAR_LEAD_HOURS,
    windows: CALENDAR_WINDOWS.map((window) => ({ ...window })),
    holidayCalendarId: HOLIDAY_CALENDAR_ID,
  };
}

async function getCalendarAvailability(env: Env, url: URL) {
  const config = getCalendarConfig(env);
  const range = getCalendarRange(url, config.timeZone);
  const rangeStart = zonedTimeToUtc(range.start, 0, 0, config.timeZone);
  const rangeEndParts = addDays(range.start, range.days, config.timeZone);
  const rangeEnd = zonedTimeToUtc(rangeEndParts, 0, 0, config.timeZone);
  const busy = await fetchCalendarBusy(env, config, rangeStart, rangeEnd);
  const bufferedBusy = applyBuffer(busy, config.bufferMinutes);
  const earliest = new Date(Date.now() + config.leadHours * 60 * 60 * 1000);
  const days: Record<string, string[]> = {};

  for (let i = 0; i < range.days; i += 1) {
    const dayParts = addDays(range.start, i, config.timeZone);
    if (!isBusinessDay(dayParts.weekday)) {
      continue;
    }
    const dayKey = formatDateKey(dayParts);
    const slots = buildSlotsForDay(dayParts, config, earliest, bufferedBusy);
    if (slots.length) {
      days[dayKey] = slots;
    }
  }

  return {
    ok: true,
    timeZone: config.timeZone,
    slotMinutes: config.slotMinutes,
    days,
  };
}

async function bookCalendarSlot(env: Env, request: CalendarBookingRequest) {
  const config = getCalendarConfig(env);
  const dateParts = parseDateParts(request.date, config.timeZone);
  const timeParts = parseTimeParts(request.time);
  if (!dateParts || !timeParts) {
    throw new BookingError("invalid_slot");
  }

  const slotStart = zonedTimeToUtc(
    dateParts,
    timeParts.hour,
    timeParts.minute,
    config.timeZone
  );
  const slotEnd = new Date(slotStart.getTime() + config.slotMinutes * 60 * 1000);
  const earliest = new Date(Date.now() + config.leadHours * 60 * 60 * 1000);
  if (slotStart < earliest) {
    throw new BookingError("slot_unavailable");
  }

  if (!isBusinessDay(dateParts.weekday)) {
    throw new BookingError("slot_unavailable");
  }
  if (!isTimeWithinWindows(timeParts, config)) {
    throw new BookingError("slot_unavailable");
  }

  const existingBookings = await listExistingBookings(env, config, request.email);
  if (existingBookings.length) {
    const summary = toExistingSummary(existingBookings[0]);
    if (!request.replaceExisting) {
      throw new BookingError("existing_booking", { existing: summary });
    }
    const cancelled = await cancelExistingBookings(env, config, existingBookings);
    if (!cancelled) {
      throw new BookingError("cancel_failed", { existing: summary });
    }
  }

  const busy = await fetchCalendarBusy(env, config, slotStart, slotEnd);
  const bufferedBusy = applyBuffer(busy, config.bufferMinutes);
  if (isSlotOverlapping(slotStart, slotEnd, bufferedBusy)) {
    throw new BookingError("slot_unavailable");
  }

  const token = await getAccessToken(env);
  const description = buildEventDescription(request);
  const useMeet = request.contactPreference !== "phone";
  const conferenceRequestId = useMeet ? createConferenceRequestId() : "";
  const eventPayload: {
    summary: string;
    description: string;
    location: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    attendees: Array<{ email: string; displayName: string }>;
    extendedProperties: { private: { source: string } };
    reminders: { useDefault: boolean };
    conferenceData?: {
      createRequest: {
        requestId: string;
        conferenceSolutionKey: { type: string };
      };
    };
  } = {
    summary: "Heerawalla Consultation",
    description,
    location: useMeet ? "Video conference bridge (Google Meet)" : "Phone call",
    start: {
      dateTime: formatDateTimeInTimeZone(slotStart, config.timeZone),
      timeZone: config.timeZone,
    },
    end: {
      dateTime: formatDateTimeInTimeZone(slotEnd, config.timeZone),
      timeZone: config.timeZone,
    },
    attendees: [{ email: request.email, displayName: request.name }],
    extendedProperties: {
      private: {
        source: "heerawalla-site",
      },
    },
    reminders: { useDefault: true },
  };
  if (useMeet) {
    eventPayload.conferenceData = {
      createRequest: {
        requestId: conferenceRequestId,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      config.calendarId
    )}/events?sendUpdates=all${useMeet ? "&conferenceDataVersion=1" : ""}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventPayload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`booking_failed:${response.status}:${errorText}`);
  }

  const result = (await response.json()) as {
    id?: string;
    htmlLink?: string;
    hangoutLink?: string;
    conferenceData?: { entryPoints?: Array<{ entryPointType?: string; uri?: string }> };
  };
  const meetingLink = extractMeetingLink(result);
  return {
    id: result.id,
    htmlLink: result.htmlLink,
    meetingLink,
    start: slotStart.toISOString(),
    end: slotEnd.toISOString(),
    timeZone: config.timeZone,
    requestId: request.requestId,
  };
}

function createConferenceRequestId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `hw-${generateRequestId()}`;
}

function extractMeetingLink(payload: {
  hangoutLink?: string;
  conferenceData?: { entryPoints?: Array<{ entryPointType?: string; uri?: string }> };
}) {
  if (payload.hangoutLink) return payload.hangoutLink;
  const entryPoints = payload.conferenceData?.entryPoints || [];
  const videoEntry = entryPoints.find((entry) => entry.entryPointType === "video");
  return videoEntry?.uri || "";
}

function buildEventDescription(request: CalendarBookingRequest) {
  const lines = [
    `Client: ${request.name}`,
    `Email: ${request.email}`,
  ];
  if (request.requestId) {
    lines.push(`${REQUEST_ID_LABEL} ${request.requestId}`);
  }
  if (request.phone) {
    lines.push(`Phone: ${request.phone}`);
  }
  if (request.phonePreferred) {
    lines.push("Contact preference: Phone call");
  }
  if (request.message) {
    lines.push("", "Message:", request.message);
  }
  return lines.join("\n");
}

async function getAccessToken(env: Env) {
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt - 60_000) {
    return cachedAccessToken.value;
  }
  const clientId = requireSecret(env.GOOGLE_CLIENT_ID, "google_client_id");
  const clientSecret = requireSecret(env.GOOGLE_CLIENT_SECRET, "google_client_secret");
  const refreshToken = requireSecret(env.GOOGLE_REFRESH_TOKEN, "google_refresh_token");
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`token_exchange_failed:${response.status}:${errorText}`);
  }
  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!payload.access_token) {
    throw new Error("token_missing");
  }
  const expiresIn = Number(payload.expires_in) || 3600;
  cachedAccessToken = {
    value: payload.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  return payload.access_token;
}

type ContactSyncPayload = {
  email: string;
  name?: string;
  phone?: string;
  interests?: string[];
  source: string;
  requestId?: string;
  pageUrl?: string;
  contactPreference?: string;
  subscriptionStatus?: "subscribed" | "unsubscribed";
};

async function syncGoogleContact(env: Env, payload: ContactSyncPayload) {
  if (!canSyncContacts(env)) return;
  try {
    await upsertGoogleContact(env, payload);
  } catch (error) {
    logWarn("people_sync_failed", { source: payload.source, error: String(error) });
  }
}

function canSyncContacts(env: Env) {
  return Boolean(
    (env.GOOGLE_CLIENT_ID || "").trim() &&
      (env.GOOGLE_CLIENT_SECRET || "").trim() &&
      (env.GOOGLE_REFRESH_TOKEN || "").trim()
  );
}

async function upsertGoogleContact(env: Env, payload: ContactSyncPayload) {
  const normalizedEmail = normalizeEmailAddress(payload.email);
  if (!normalizedEmail) return;
  const token = await getAccessToken(env);
  const searchUrl = new URL("https://people.googleapis.com/v1/people:searchContacts");
  searchUrl.searchParams.set("query", normalizedEmail);
  searchUrl.searchParams.set("readMask", "names,emailAddresses,phoneNumbers,userDefined");

  const searchResponse = await fetch(searchUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!searchResponse.ok) {
    const errorText = await searchResponse.text();
    throw new Error(`people_search_failed:${searchResponse.status}:${errorText}`);
  }
  const searchPayload = (await searchResponse.json()) as {
    results?: Array<{
      person?: {
        resourceName?: string;
        etag?: string;
        names?: Array<{ displayName?: string; givenName?: string; familyName?: string }>;
        emailAddresses?: Array<{ value?: string }>;
        phoneNumbers?: Array<{ value?: string }>;
        userDefined?: Array<{ key?: string; value?: string }>;
      };
    }>;
  };
  const matches = findContactMatches(searchPayload.results || [], normalizedEmail);
  const person = selectPrimaryContact(matches);
  if (person?.resourceName && matches.length > 1) {
    await mergeDuplicateContacts(token, person.resourceName, matches);
  }
  const userDefined = buildUserDefinedFields(person?.userDefined || [], payload);

  let personResourceName = "";
  if (person?.resourceName) {
    const updateFields = ["userDefined", "emailAddresses"];
    const updateBody: {
      resourceName: string;
      etag?: string;
      names?: Array<{ givenName?: string; familyName?: string; displayName?: string }>;
      emailAddresses?: Array<{ value: string }>;
      phoneNumbers?: Array<{ value: string }>;
      userDefined?: Array<{ key?: string; value?: string }>;
    } = {
      resourceName: person.resourceName,
      etag: person.etag,
      emailAddresses: mergeEmailAddresses(person.emailAddresses || [], normalizedEmail),
      userDefined,
    };

    if (payload.name) {
      updateBody.names = buildNameEntries(payload.name);
      updateFields.push("names");
    }
    if (payload.phone) {
      updateBody.phoneNumbers = mergePhoneNumbers(person.phoneNumbers || [], payload.phone);
      updateFields.push("phoneNumbers");
    }

    const updateUrl = new URL(`https://people.googleapis.com/v1/${person.resourceName}:updateContact`);
    updateUrl.searchParams.set("updatePersonFields", updateFields.join(","));
    const updateResponse = await fetch(updateUrl.toString(), {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateBody),
    });
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`people_update_failed:${updateResponse.status}:${errorText}`);
    }
    personResourceName = person.resourceName;
  } else {
    const createBody: {
      names?: Array<{ givenName?: string; familyName?: string; displayName?: string }>;
      emailAddresses?: Array<{ value: string }>;
      phoneNumbers?: Array<{ value: string }>;
      userDefined?: Array<{ key?: string; value?: string }>;
    } = {
      emailAddresses: mergeEmailAddresses([], normalizedEmail),
      userDefined,
    };
    if (payload.name) {
      createBody.names = buildNameEntries(payload.name);
    }
    if (payload.phone) {
      createBody.phoneNumbers = mergePhoneNumbers([], payload.phone);
    }

    const createResponse = await fetch("https://people.googleapis.com/v1/people:createContact", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createBody),
    });
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`people_create_failed:${createResponse.status}:${errorText}`);
    }
    const created = (await createResponse.json()) as { resourceName?: string };
    personResourceName = created.resourceName || "";
  }

  if (personResourceName && payload.subscriptionStatus) {
    await updateContactGroupMembership(env, token, personResourceName, payload.subscriptionStatus);
  }
}

function findContactMatches(
  results: Array<{
    person?: {
      resourceName?: string;
      etag?: string;
      names?: Array<{ displayName?: string; givenName?: string; familyName?: string }>;
      emailAddresses?: Array<{ value?: string }>;
      phoneNumbers?: Array<{ value?: string }>;
      userDefined?: Array<{ key?: string; value?: string }>;
    };
  }>,
  email: string
) {
  const normalizedEmail = normalizeEmailAddress(email);
  const matches: Array<{
    resourceName?: string;
    etag?: string;
    names?: Array<{ displayName?: string; givenName?: string; familyName?: string }>;
    emailAddresses?: Array<{ value?: string }>;
    phoneNumbers?: Array<{ value?: string }>;
    userDefined?: Array<{ key?: string; value?: string }>;
  }> = [];
  results.forEach((result) => {
    const person = result.person;
    if (!person) return;
    const addresses = person.emailAddresses || [];
    const hasMatch = addresses.some((entry) => normalizeEmailAddress(entry.value || "") === normalizedEmail);
    if (hasMatch) {
      matches.push(person);
    }
  });
  return matches;
}

function selectPrimaryContact(
  matches: Array<{
    resourceName?: string;
    etag?: string;
    names?: Array<{ displayName?: string; givenName?: string; familyName?: string }>;
    emailAddresses?: Array<{ value?: string }>;
    phoneNumbers?: Array<{ value?: string }>;
    userDefined?: Array<{ key?: string; value?: string }>;
  }>
) {
  if (!matches.length) return null;
  return matches.reduce((best, current) => {
    if (!best) return current;
    return scoreContact(current) > scoreContact(best) ? current : best;
  }, matches[0]);
}

function scoreContact(contact: {
  names?: Array<{ displayName?: string; givenName?: string; familyName?: string }>;
  emailAddresses?: Array<{ value?: string }>;
  phoneNumbers?: Array<{ value?: string }>;
  userDefined?: Array<{ key?: string; value?: string }>;
}) {
  const nameScore = contact.names?.length || 0;
  const emailScore = contact.emailAddresses?.length || 0;
  const phoneScore = contact.phoneNumbers?.length || 0;
  const userDefinedScore = contact.userDefined?.length || 0;
  return nameScore + emailScore + phoneScore + userDefinedScore;
}

async function mergeDuplicateContacts(
  token: string,
  primaryResourceName: string,
  matches: Array<{ resourceName?: string }>
) {
  const uniqueOthers = Array.from(
    new Set(
      matches
        .map((match) => match.resourceName || "")
        .filter((resourceName) => resourceName && resourceName !== primaryResourceName)
    )
  );

  for (const otherResourceName of uniqueOthers) {
    try {
      await mergeContacts(token, primaryResourceName, otherResourceName);
    } catch (error) {
      logWarn("people_merge_failed", { primaryResourceName, otherResourceName, error: String(error) });
    }
  }
}

async function mergeContacts(token: string, primaryResourceName: string, otherResourceName: string) {
  const url = new URL("https://people.googleapis.com/v1/people:mergeContacts");
  url.searchParams.set("resourceName", primaryResourceName);
  url.searchParams.set("otherResourceName", otherResourceName);
  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`people_merge_failed:${response.status}:${errorText}`);
  }
  await discardResponse(response);
}

function buildNameEntries(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return [];
  const parts = trimmed.split(/\s+/);
  const givenName = parts[0];
  const familyName = parts.slice(1).join(" ");
  return [
    {
      givenName,
      familyName: familyName || undefined,
      displayName: trimmed,
    },
  ];
}

function mergeEmailAddresses(existing: Array<{ value?: string }>, email: string) {
  const values = new Set<string>();
  existing.forEach((entry) => {
    const normalized = normalizeEmailAddress(entry.value || "");
    if (normalized) values.add(normalized);
  });
  if (email) {
    values.add(normalizeEmailAddress(email));
  }
  return Array.from(values)
    .filter(Boolean)
    .map((value) => ({ value }));
}

function mergePhoneNumbers(existing: Array<{ value?: string }>, phone: string) {
  const values = new Set<string>();
  existing.forEach((entry) => {
    const normalized = (entry.value || "").trim();
    if (normalized) values.add(normalized);
  });
  if (phone) {
    values.add(phone.trim());
  }
  return Array.from(values)
    .filter(Boolean)
    .map((value) => ({ value }));
}

function buildUserDefinedFields(
  existing: Array<{ key?: string; value?: string }>,
  payload: ContactSyncPayload
) {
  const reservedKeys = new Set([
    "heerawalla_sources",
    "heerawalla_last_source",
    "heerawalla_request_id",
    "heerawalla_interests",
    "heerawalla_page",
    "heerawalla_contact_preference",
  ]);
  const deprecatedKeys = new Set([
    "heerawalla_subscription_status",
    "heerawalla_unsubscribe_reason",
    "heerawalla_unsubscribed_at",
  ]);
  const preserved: Array<{ key?: string; value?: string }> = [];
  const reservedMap = new Map<string, string>();

  existing.forEach((entry) => {
    const key = (entry.key || "").trim();
    if (!key) return;
    if (deprecatedKeys.has(key)) {
      return;
    }
    if (!reservedKeys.has(key)) {
      preserved.push(entry);
      return;
    }
    reservedMap.set(key, entry.value || "");
  });

  const sources = new Set<string>();
  const existingSources = reservedMap.get("heerawalla_sources") || "";
  existingSources
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => sources.add(value));
  if (payload.source) {
    sources.add(payload.source);
  }
  if (sources.size) {
    reservedMap.set("heerawalla_sources", Array.from(sources).join(", "));
  }
  if (payload.source) {
    reservedMap.set("heerawalla_last_source", payload.source);
  }
  if (payload.requestId) {
    reservedMap.set("heerawalla_request_id", payload.requestId);
  }
  if (payload.interests && payload.interests.length) {
    reservedMap.set("heerawalla_interests", payload.interests.join(", "));
  }
  if (payload.pageUrl) {
    reservedMap.set("heerawalla_page", payload.pageUrl);
  }
  if (payload.contactPreference) {
    reservedMap.set("heerawalla_contact_preference", payload.contactPreference);
  }

  const reservedEntries = Array.from(reservedMap.entries()).map(([key, value]) => ({ key, value }));
  return [...reservedEntries, ...preserved];
}

const CONTACT_GROUP_CACHE_SUBSCRIBED = "contact_group:subscribed";
const CONTACT_GROUP_CACHE_UNSUBSCRIBED = "contact_group:unsubscribed";

function getContactLabel(env: Env, status: "subscribed" | "unsubscribed") {
  if (status === "subscribed") {
    return (env.CONTACT_LABEL_SUBSCRIBED || "").trim() || DEFAULT_CONTACT_LABEL_SUBSCRIBED;
  }
  return (env.CONTACT_LABEL_UNSUBSCRIBED || "").trim() || DEFAULT_CONTACT_LABEL_UNSUBSCRIBED;
}

async function updateContactGroupMembership(
  env: Env,
  token: string,
  personResourceName: string,
  status: "subscribed" | "unsubscribed"
) {
  const subscribedLabel = getContactLabel(env, "subscribed");
  const unsubscribedLabel = getContactLabel(env, "unsubscribed");
  const subscribedGroup = await ensureContactGroup(env, token, subscribedLabel, CONTACT_GROUP_CACHE_SUBSCRIBED);
  const unsubscribedGroup = await ensureContactGroup(
    env,
    token,
    unsubscribedLabel,
    CONTACT_GROUP_CACHE_UNSUBSCRIBED
  );

  const tasks: Array<Promise<void>> = [];
  if (subscribedGroup) {
    const add = status === "subscribed" ? [personResourceName] : [];
    const remove = status === "unsubscribed" ? [personResourceName] : [];
    tasks.push(modifyContactGroupMembers(token, subscribedGroup, add, remove));
  }
  if (unsubscribedGroup) {
    const add = status === "unsubscribed" ? [personResourceName] : [];
    const remove = status === "subscribed" ? [personResourceName] : [];
    tasks.push(modifyContactGroupMembers(token, unsubscribedGroup, add, remove));
  }

  await Promise.all(tasks);
}

async function ensureContactGroup(env: Env, token: string, labelName: string, cacheKey: string) {
  if (!labelName) return "";
  if (env.HEERAWALLA_ACKS) {
    const cached = await env.HEERAWALLA_ACKS.get(cacheKey);
    if (cached) return cached;
  }

  const groups = await listContactGroups(token);
  const existing = groups.find((group) => group.name === labelName);
  if (existing?.resourceName) {
    if (env.HEERAWALLA_ACKS) {
      await env.HEERAWALLA_ACKS.put(cacheKey, existing.resourceName);
    }
    return existing.resourceName;
  }

  const created = await createContactGroup(token, labelName);
  if (created.resourceName && env.HEERAWALLA_ACKS) {
    await env.HEERAWALLA_ACKS.put(cacheKey, created.resourceName);
  }
  return created.resourceName || "";
}

async function listContactGroups(token: string) {
  const groups: Array<{ resourceName?: string; name?: string; groupType?: string }> = [];
  let pageToken = "";
  do {
    const url = new URL("https://people.googleapis.com/v1/contactGroups");
    url.searchParams.set("pageSize", "200");
    url.searchParams.set("groupFields", "name,groupType");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`people_group_list_failed:${response.status}:${errorText}`);
    }
    const payload = (await response.json()) as {
      contactGroups?: Array<{ resourceName?: string; name?: string; groupType?: string }>;
      nextPageToken?: string;
    };
    if (payload.contactGroups?.length) {
      groups.push(...payload.contactGroups);
    }
    pageToken = payload.nextPageToken || "";
  } while (pageToken);
  return groups;
}

async function createContactGroup(token: string, name: string) {
  const response = await fetch("https://people.googleapis.com/v1/contactGroups", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contactGroup: { name } }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`people_group_create_failed:${response.status}:${errorText}`);
  }
  return (await response.json()) as { resourceName?: string; name?: string };
}

async function modifyContactGroupMembers(
  token: string,
  groupResourceName: string,
  add: string[],
  remove: string[]
) {
  if (!groupResourceName || (!add.length && !remove.length)) return;
  const response = await fetch(
    `https://people.googleapis.com/v1/${groupResourceName}/members:modify`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resourceNamesToAdd: add,
        resourceNamesToRemove: remove,
      }),
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`people_group_modify_failed:${response.status}:${errorText}`);
  }
  await discardResponse(response);
}

function requireSecret(value: string | undefined, name: string) {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    throw new Error(`missing_${name}`);
  }
  return trimmed;
}

async function fetchCalendarBusy(
  env: Env,
  config: CalendarConfig,
  timeMin: Date,
  timeMax: Date
) {
  const token = await getAccessToken(env);
  const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: config.timeZone,
      items: [{ id: config.calendarId }, { id: config.holidayCalendarId }],
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`freebusy_failed:${response.status}:${errorText}`);
  }
  const payload = (await response.json()) as {
    calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }>;
  };
  const calendars = payload.calendars || {};
  const busy: BusyInterval[] = [];
  [config.calendarId, config.holidayCalendarId].forEach((calendarId) => {
    const entries = calendars[calendarId]?.busy || [];
    entries.forEach((entry) => {
      const start = new Date(entry.start);
      const end = new Date(entry.end);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
      busy.push({ start, end });
    });
  });
  return busy;
}

async function listExistingBookings(
  env: Env,
  config: CalendarConfig,
  email: string
): Promise<ExistingBooking[]> {
  const normalizedEmail = normalizeEmailAddress(email);
  if (!normalizedEmail) return [];

  const token = await getAccessToken(env);
  const baseParams = new URLSearchParams({
    timeMin: new Date().toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
    timeZone: config.timeZone,
  });
  baseParams.append("privateExtendedProperty", "source=heerawalla-site");

  const bookings: ExistingBooking[] = [];
  let pageToken = "";
  do {
    const params = new URLSearchParams(baseParams);
    if (pageToken) {
      params.set("pageToken", pageToken);
    }
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        config.calendarId
      )}/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      logWarn("calendar_existing_query_failed", { status: response.status });
      return bookings;
    }

    const payload = (await response.json()) as {
      items?: Array<{
        id?: string;
        status?: string;
        start?: { dateTime?: string; date?: string; timeZone?: string };
        end?: { dateTime?: string; date?: string; timeZone?: string };
        attendees?: Array<{ email?: string; responseStatus?: string }>;
        hangoutLink?: string;
        conferenceData?: { entryPoints?: Array<{ entryPointType?: string; uri?: string }> };
      }>;
      nextPageToken?: string;
    };

    const events = Array.isArray(payload.items) ? payload.items : [];
    for (const event of events) {
      if (!event || event.status === "cancelled") continue;
      if (!event.id) continue;
      const attendees = Array.isArray(event.attendees) ? event.attendees : [];
      const attendee = attendees.find(
        (entry) => normalizeEmailAddress(entry?.email || "") === normalizedEmail
      );
      if (!attendee) continue;
      const responseStatus = (attendee.responseStatus || "").toLowerCase();
      if (responseStatus === "declined") continue;

      const start = parseEventDateTime(event.start?.dateTime || event.start?.date);
      const end = parseEventDateTime(event.end?.dateTime || event.end?.date);
      if (!start || !end) continue;
      const timeZone = event.start?.timeZone || config.timeZone;
      const meetingLink = extractMeetingLink(event);

      bookings.push({
        id: event.id,
        start: start.toISOString(),
        end: end.toISOString(),
        timeZone,
        meetingLink,
      });
    }
    pageToken = payload.nextPageToken || "";
  } while (pageToken);

  bookings.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return bookings;
}

async function cancelExistingBookings(
  env: Env,
  config: CalendarConfig,
  bookings: ExistingBooking[]
) {
  if (!bookings.length) return true;
  const token = await getAccessToken(env);
  const failures: string[] = [];
  for (const booking of bookings) {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        config.calendarId
      )}/events/${encodeURIComponent(booking.id)}?sendUpdates=all`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      failures.push(booking.id);
    } else {
      await discardResponse(response);
    }
  }
  if (failures.length) {
    logWarn("calendar_cancel_failed", { failures });
    return false;
  }
  return true;
}

function toExistingSummary(booking: ExistingBooking) {
  return {
    start: booking.start,
    end: booking.end,
    timeZone: booking.timeZone,
    meetingLink: booking.meetingLink,
  };
}

function applyBuffer(busy: BusyInterval[], bufferMinutes: number) {
  if (!bufferMinutes) return busy;
  const bufferMs = bufferMinutes * 60 * 1000;
  return busy.map((interval) => ({
    start: new Date(interval.start.getTime() - bufferMs),
    end: new Date(interval.end.getTime() + bufferMs),
  }));
}

function isSlotOverlapping(start: Date, end: Date, busy: BusyInterval[]) {
  return busy.some((interval) => start < interval.end && end > interval.start);
}

function buildSlotsForDay(
  parts: DateParts,
  config: CalendarConfig,
  earliest: Date,
  busy: BusyInterval[]
) {
  const slots: string[] = [];
  config.windows.forEach((window) => {
    const startMinutes = window.startHour * 60 + window.startMinute;
    const endMinutes = window.endHour * 60 + window.endMinute;
    for (let minutes = startMinutes; minutes + config.slotMinutes <= endMinutes; minutes += config.slotMinutes) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const slotStart = zonedTimeToUtc(parts, hour, minute, config.timeZone);
      const slotEnd = new Date(slotStart.getTime() + config.slotMinutes * 60 * 1000);
      if (slotStart < earliest) {
        continue;
      }
      if (isSlotOverlapping(slotStart, slotEnd, busy)) {
        continue;
      }
      slots.push(`${padNumber(hour)}:${padNumber(minute)}`);
    }
  });
  return slots;
}

function getCalendarRange(url: URL, timeZone: string) {
  const monthParam = (url.searchParams.get("month") || "").trim();
  const startParam = (url.searchParams.get("start") || "").trim();
  const daysParam = (url.searchParams.get("days") || "").trim();

  if (monthParam) {
    const match = monthParam.match(/^(\d{4})-(\d{2})$/);
    if (!match) {
      throw new Error("invalid_month");
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (!year || month < 1 || month > 12) {
      throw new Error("invalid_month");
    }
    const daysInMonth = new Date(year, month, 0).getDate();
    return {
      start: { year, month, day: 1 },
      days: daysInMonth,
    };
  }

  if (startParam) {
    const start = parseDateParts(startParam, timeZone);
    if (!start) {
      throw new Error("invalid_start");
    }
    const days = clampNumber(Number(daysParam) || 14, 1, 62);
    return { start, days };
  }

  const nowParts = getZonedParts(new Date(), timeZone);
  const daysInMonth = new Date(nowParts.year, nowParts.month, 0).getDate();
  return {
    start: { year: nowParts.year, month: nowParts.month, day: 1 },
    days: daysInMonth,
  };
}

function parseDateParts(value: string, timeZone: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return getZonedParts(date, timeZone);
}

function parseTimeParts(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function parseEventDateTime(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function getZonedParts(date: Date, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return {
    weekday: get("weekday"),
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
  };
}

function zonedTimeToUtc(parts: DateParts, hour: number, minute: number, timeZone: string) {
  const utcGuess = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, 0));
  const local = new Date(
    utcGuess.toLocaleString("en-US", {
      timeZone,
    })
  );
  const offset = utcGuess.getTime() - local.getTime();
  return new Date(utcGuess.getTime() + offset);
}

function formatDateTimeInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
}

function isBusinessDay(weekday?: string) {
  if (!weekday) return false;
  return weekday !== "Sat" && weekday !== "Sun";
}

function isTimeWithinWindows(
  time: { hour: number; minute: number },
  config: CalendarConfig
) {
  const minutes = time.hour * 60 + time.minute;
  return config.windows.some((window) => {
    const startMinutes = window.startHour * 60 + window.startMinute;
    const endMinutes = window.endHour * 60 + window.endMinute;
    return minutes >= startMinutes && minutes + config.slotMinutes <= endMinutes;
  });
}

function addDays(parts: DateParts, days: number, timeZone: string): DateParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, 12, 0, 0));
  return getZonedParts(date, timeZone);
}

function formatDateKey(parts: DateParts) {
  return `${parts.year}-${padNumber(parts.month)}-${padNumber(parts.day)}`;
}

function padNumber(value: number) {
  return String(value).padStart(2, "0");
}

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildForwardHtml({
  subject,
  body,
  senderEmail,
  senderName,
  requestId,
}: {
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string;
  requestId: string;
}) {
  const safeBody = escapeHtml(body);
  const safeSubject = escapeHtml(subject);
  const safeName = escapeHtml(senderName || "Not provided");
  const safeEmail = escapeHtml(senderEmail);
  const safeRequestId = escapeHtml(requestId);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:24px;background:#f6f5f2;color:#0f172a;font-family:-apple-system, Segoe UI, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:28px 32px;">
              <div style="font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#64748b;margin-bottom:8px;">
                Heerawalla Atelier Submission
              </div>
              <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.4;color:#0f172a;">${safeSubject}</h1>
              <p style="margin:0 0 8px 0;font-size:14px;color:#334155;">
                Request ID: <strong style="color:#0f172a;">${safeRequestId}</strong>
              </p>
              <p style="margin:0 0 18px 0;font-size:14px;color:#334155;">
                From: ${safeName} &lt;${safeEmail}&gt;
              </p>
              <div style="border-top:1px solid #e5e7eb;margin:0 0 16px 0;"></div>
              <pre style="margin:0;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;font-size:13px;line-height:1.6;color:#0f172a;white-space:pre-wrap;">${safeBody}</pre>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildReplyHtml(body: string) {
  const safeBody = escapeHtml(body || "(No message body)").replace(/\n/g, "<br>");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:24px;background:#f6f5f2;color:#0f172a;font-family:-apple-system, Segoe UI, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:24px 28px;font-size:15px;line-height:1.7;color:#0f172a;">
              ${safeBody}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function formatSlotForDisplay(start: Date, end: Date, timeZone: string) {
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const zoneName = getTimeZoneAbbr(start, timeZone);
  return {
    dateText: dateFormatter.format(start),
    timeRangeText: `${timeFormatter.format(start)} - ${timeFormatter.format(end)} ${zoneName}`,
  };
}

function getTimeZoneAbbr(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short",
  }).formatToParts(date);
  return parts.find((part) => part.type === "timeZoneName")?.value || timeZone;
}

function buildConsultationAckText({
  name,
  phone,
  phonePreferred,
  contactPreference,
  requestId,
  start,
  end,
  timeZone,
  meetingLink,
}: ConsultationAckPayload) {
  const { dateText, timeRangeText } = formatSlotForDisplay(start, end, timeZone);
  const greeting = name ? `Hello ${name},` : "Hello,";
  const reference = requestId ? `${REQUEST_ID_PREFIX}${requestId}` : "";
  const wantsPhone = contactPreference === "phone" || phonePreferred;
  const lines = [
    greeting,
    "",
    "We have received your concierge consultation request and are excited to meet and discuss your specific needs.",
    "A calendar invite is on its way to this address.",
    "",
    `Scheduled time: ${dateText}`,
    `Time: ${timeRangeText}`,
    "Duration: 30 minutes",
  ];
  if (reference) {
    lines.push(`Reference ID: ${reference}`);
  }
  if (wantsPhone) {
    lines.push("");
    lines.push("Format: Phone call");
    if (phone) {
      lines.push(`We will call you at ${phone}.`);
    }
  } else {
    if (phone) {
      lines.push("");
      lines.push(`Phone (if needed): ${phone}`);
    }
    lines.push("");
    if (meetingLink) {
      lines.push(`Join via video conference bridge (Google Meet): ${meetingLink}`);
    } else {
      lines.push("Your calendar invite includes the video conference bridge (Google Meet) link.");
    }
  }
  lines.push(
    "",
    "To reschedule, please cancel this appointment and book a new time at Heerawalla.com.",
    "",
    "Warm regards,",
    "Heerawalla",
    "www.heerawalla.com"
  );
  return lines.join("\n");
}

function buildConsultationAckHtml(payload: ConsultationAckPayload) {
  const { dateText, timeRangeText } = formatSlotForDisplay(payload.start, payload.end, payload.timeZone);
  const safeName = escapeHtml(payload.name || "there");
  const safeDate = escapeHtml(dateText);
  const safeTime = escapeHtml(timeRangeText);
  const reference = payload.requestId ? `${REQUEST_ID_PREFIX}${payload.requestId}` : "";
  const safeReference = reference ? escapeHtml(reference) : "";
  const safePhone = payload.phone ? escapeHtml(payload.phone) : "";
  const safeMeetingLink = payload.meetingLink ? escapeHtml(payload.meetingLink) : "";
  const wantsPhone = payload.contactPreference === "phone" || payload.phonePreferred;
  const meetingHtml = wantsPhone
    ? ""
    : payload.meetingLink
    ? `<p style="margin:0 0 16px 0;font-size:14px;line-height:1.7;color:#334155;">
        <strong>Video conference bridge (Google Meet):</strong>
        <a href="${safeMeetingLink}" style="color:#0f172a;text-decoration:underline;">${safeMeetingLink}</a>
      </p>`
    : `<p style="margin:0 0 16px 0;font-size:14px;line-height:1.7;color:#334155;">
        Your calendar invite includes the video conference bridge (Google Meet) link.
      </p>`;
  const phoneHtml = wantsPhone
    ? `<p style="margin:0 0 8px 0;font-size:14px;line-height:1.7;color:#334155;">
        <strong>Format:</strong> Phone call
      </p>${
        safePhone
          ? `<p style="margin:0 0 8px 0;font-size:14px;line-height:1.7;color:#334155;">
              <strong>We will call:</strong> ${safePhone}
            </p>`
          : ""
      }`
    : safePhone
    ? `<p style="margin:0 0 8px 0;font-size:14px;line-height:1.7;color:#334155;">
        <strong>Phone (if needed):</strong> ${safePhone}
      </p>`
    : "";
  const referenceHtml = safeReference
    ? `<p style="margin:0 0 8px 0;font-size:13px;line-height:1.6;color:#64748b;">
        Reference ID: ${safeReference}
      </p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f6f5f2;color:#0f172a;font-family:-apple-system, Segoe UI, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:36px 40px 28px 40px;">
              <div style="margin:0 0 16px 0;">
                <img src="https://www.heerawalla.com/images/engraving_mark.svg" width="36" height="36" alt="Heerawalla" style="display:block;">
              </div>
              <div style="font-family:'Baskervville','Cormorant Garamond',serif;font-size:24px;letter-spacing:0.08em;text-transform:none;color:#0b1928;margin-bottom:12px;">
                Heerawalla
              </div>
              <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.4;font-weight:600;color:#0f172a;">
                Consultation confirmed
              </h1>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
                Hello ${safeName}, we have received your concierge consultation request and are excited to meet and discuss your specific needs.
              </p>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
                A calendar invite is on its way to this address.
              </p>
              <div style="padding:14px 16px;border:1px solid #e5e7eb;margin:0 0 16px 0;">
                <p style="margin:0 0 6px 0;font-size:14px;line-height:1.6;color:#0f172a;">
                  <strong>Date:</strong> ${safeDate}
                </p>
                <p style="margin:0 0 6px 0;font-size:14px;line-height:1.6;color:#0f172a;">
                  <strong>Time:</strong> ${safeTime}
                </p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#0f172a;">
                  <strong>Duration:</strong> 30 minutes
                </p>
              </div>
              ${referenceHtml}
              ${phoneHtml}
              ${meetingHtml}
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.7;color:#334155;">
                To reschedule, please cancel this appointment and book a new time at Heerawalla.com.
              </p>
              <div style="height:1px;background:#e5e7eb;margin:0 0 18px 0;"></div>
              <p style="margin:0 0 6px 0;font-size:14px;color:#0f172a;">Warm regards,</p>
              <p style="margin:0 0 10px 0;font-size:14px;font-weight:600;color:#0f172a;">Heerawalla</p>
              <p style="margin:0;font-size:12px;color:#64748b;">
                <a href="https://www.heerawalla.com" style="color:#64748b;text-decoration:underline;">www.heerawalla.com</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:14px 0 0 0;font-size:11px;color:#94a3b8;">
          You are receiving this message because you requested a concierge consultation.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendConsultationAck(env: Env, payload: ConsultationAckPayload) {
  const reference = payload.requestId ? `${REQUEST_ID_PREFIX}${payload.requestId}` : "";
  const subject = reference ? `${CONSULTATION_ACK_SUBJECT} [${reference}]` : CONSULTATION_ACK_SUBJECT;
  await sendEmail(env, {
    to: [payload.email],
    sender: "Heerawalla <no-reply@heerawalla.com>",
    replyTo: "no-reply@heerawalla.com",
    subject,
    textBody: buildConsultationAckText(payload),
    htmlBody: buildConsultationAckHtml(payload),
    headers: autoReplyHeaders(),
  });
}

function appendRequestSummary(body: string, summary: string | null) {
  const normalizedBody = body.trim();
  if (!summary) return normalizedBody || body;
  const separator = "\n\n--- Original request ---\n";
  return normalizedBody ? `${normalizedBody}${separator}${summary}` : summary;
}

function parseSender(sender: string) {
  const trimmed = sender.trim();
  const match = trimmed.match(/^\s*"?([^"<]+?)"?\s*<([^>]+)>\s*$/);
  if (match) {
    const name = match[1].trim();
    const email = match[2].trim();
    return { name: name || undefined, email };
  }
  return { name: undefined, email: trimmed };
}

async function sendEmail(
  env: Env,
  {
    to,
    sender,
    replyTo,
    subject,
    textBody,
    htmlBody,
    headers,
  }: {
    to: string[];
    sender: string;
    replyTo: string;
    subject: string;
    textBody: string;
    htmlBody: string;
    headers?: Record<string, string>;
  }
) {
  if (env.RESEND_API_KEY) {
    await sendResend(env.RESEND_API_KEY, {
      to,
      sender,
      replyTo,
      subject,
      textBody,
      htmlBody,
      headers,
    });
    return;
  }

  if (!env.SEND_EMAIL) {
    throw new Error("send_email_binding_missing");
  }

  const { name, email } = parseSender(sender);
  const fromHeader = formatAddress(email, name);
  const replyToParts = replyTo ? parseSender(replyTo) : null;
  const replyToHeader = replyToParts ? formatAddress(replyToParts.email, replyToParts.name) : "";
  const safeSubject = encodeHeaderValue(subject);

  for (const recipient of to) {
    const { name: toName, email: toEmail } = parseSender(recipient);
    const toHeader = formatAddress(toEmail, toName);
    const raw = buildRawEmail({
      fromHeader,
      toHeader,
      replyToHeader,
      subject: safeSubject,
      textBody,
      htmlBody,
      headers,
    });
    const message = new EmailMessage(email, toEmail, raw);
    await env.SEND_EMAIL.send(message);
  }
}

async function sendResend(
  apiKey: string,
  {
    to,
    sender,
    replyTo,
    subject,
    textBody,
    htmlBody,
    headers,
  }: {
    to: string[];
    sender: string;
    replyTo: string;
    subject: string;
    textBody: string;
    htmlBody: string;
    headers?: Record<string, string>;
  }
) {
  const { name, email } = parseSender(sender);
  const from = formatAddress(email, name);
  const replyToParts = replyTo ? parseSender(replyTo) : null;
  const replyToValue = replyToParts ? formatAddress(replyToParts.email, replyToParts.name) : "";
  const toList = to.map((address) => {
    const { name: toName, email: toEmail } = parseSender(address);
    return formatAddress(toEmail, toName);
  });

  const payload: Record<string, unknown> = {
    from,
    to: toList,
    subject,
    text: textBody,
    html: htmlBody,
  };
  if (replyToValue) {
    payload.reply_to = replyToValue;
  }
  if (headers && Object.keys(headers).length) {
    payload.headers = headers;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`resend_failed:${response.status}:${errorText}`);
  }
  await discardResponse(response);
}

function buildPlainEmailHtml(body: string) {
  const safeBody = escapeHtml(body).replace(/\n/g, "<br>");
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body style="margin:0;padding:24px;background:#f8fafc;color:#0f172a;font-family:-apple-system, Segoe UI, Helvetica, Arial, sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;padding:24px;line-height:1.6;">
      ${safeBody}
    </div>
  </body>
</html>`;
}

function buildRawEmail({
  fromHeader,
  toHeader,
  replyToHeader,
  subject,
  textBody,
  htmlBody,
  headers,
}: {
  fromHeader: string;
  toHeader: string;
  replyToHeader: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  headers?: Record<string, string>;
}) {
  const boundary = `boundary-${crypto.randomUUID()}`;
  const extraHeaders = headers
    ? Object.entries(headers)
        .map(([key, value]) => {
          const safeKey = sanitizeHeaderValue(key);
          const safeValue = sanitizeHeaderValue(value);
          return safeKey && safeValue ? `${safeKey}: ${safeValue}` : "";
        })
        .filter(Boolean)
    : [];
  const headersList = [
    `From: ${fromHeader}`,
    `To: ${toHeader}`,
    `Subject: ${subject}`,
    replyToHeader ? `Reply-To: ${replyToHeader}` : "",
    ...extraHeaders,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].filter(Boolean);

  const textEncoded = wrapBase64(toBase64(textBody));
  const htmlEncoded = wrapBase64(toBase64(htmlBody));

  return [
    ...headersList,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    textEncoded,
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    htmlEncoded,
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

function formatAddress(email: string, name?: string) {
  const safeEmail = sanitizeHeaderValue(email);
  if (!name) return safeEmail;
  const safeName = sanitizeHeaderValue(name).replace(/"/g, '\\"');
  if (needsEncoding(safeName)) {
    return `${encodeHeaderValue(safeName)} <${safeEmail}>`;
  }
  return `"${safeName}" <${safeEmail}>`;
}

function sanitizeHeaderValue(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function needsEncoding(value: string) {
  return /[^\x00-\x7F]/.test(value);
}

function encodeHeaderValue(value: string) {
  const safeValue = sanitizeHeaderValue(value);
  if (!needsEncoding(safeValue)) return safeValue;
  return `=?UTF-8?B?${toBase64(safeValue)}?=`;
}

function toBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function wrapBase64(value: string, lineLength = 76) {
  if (value.length <= lineLength) return value;
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += lineLength) {
    chunks.push(value.slice(i, i + lineLength));
  }
  return chunks.join("\r\n");
}

function normalizeSubject(subject: string) {
  let normalized = subject.trim();
  while (/^(re|fwd?|aw):/i.test(normalized)) {
    normalized = normalized.replace(/^(re|fwd?|aw):/i, "").trim();
  }
  return normalized;
}

function normalizeEmailAddress(value: string) {
  if (!value) return "";
  const parsed = parseSender(value);
  return parsed.email.trim().toLowerCase();
}

function parseSenderList(value?: string) {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getInternalSenders(env: Env) {
  const list = new Set<string>();
  const entries = [
    "atelier@heerawalla.com",
    ...parseSenderList(env.ATELIER_SENDERS),
  ];
  entries.forEach((entry) => {
    if (!entry) return;
    const normalized = normalizeEmailAddress(entry);
    if (normalized) list.add(normalized);
  });
  return list;
}

function buildAckSubject(requestId: string, prefix = ACK_SUBJECT_PREFIX) {
  const normalizedId = normalizeRequestId(requestId);
  if (!normalizedId) return prefix;
  return `${prefix} [HW-REQ:${normalizedId}]`;
}

function autoReplyHeaders() {
  return { "Auto-Submitted": "auto-replied" };
}

function getInternalReplyTo(env: Env) {
  const configured = (env.REPLY_TO_ADDRESS || "").trim();
  if (!configured) return DEFAULT_REPLY_TO;
  return configured;
}

function getCustomerReplyTo() {
  return DEFAULT_REPLY_TO;
}

function isEnabled(value: string | boolean | undefined, defaultValue: boolean) {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === "boolean") return value;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return defaultValue;
  return ["1", "true", "yes", "y", "on"].includes(normalized);
}

function getAckMode(env: Env) {
  const normalized = (env.ACK_MODE || "").trim().toLowerCase();
  if (["cron", "scheduled", "schedule"].includes(normalized)) return "cron";
  return "inline";
}

function buildOriginKey(requestId: string) {
  const normalized = normalizeRequestId(requestId);
  return normalized ? `origin:req:${normalized}` : "";
}

type RequestSummary = {
  subject: string;
  body: string;
  email: string;
  name?: string;
};

type ConfirmationChange = {
  key?: string;
  label?: string;
  from?: string;
  to?: string;
};

type OrderConfirmationRecord = {
  token: string;
  requestId: string;
  email?: string;
  name?: string;
  productName?: string;
  changes: ConfirmationChange[];
  status: "pending" | "confirmed" | "canceled";
  createdAt: string;
  confirmedAt?: string;
  canceledAt?: string;
  cancellationReason?: string;
  cancellationNote?: string;
  expiresAt?: string;
  paymentUrl?: string;
};

type OrderCancelRecord = {
  token: string;
  requestId: string;
  email?: string;
  name?: string;
  productName?: string;
  status: "pending" | "canceled";
  createdAt: string;
  canceledAt?: string;
  cancellationReason?: string;
  cancellationNote?: string;
  expiresAt?: string;
};

type OrderDetailsRecord = {
  created_at?: string;
  request_id?: string;
  status?: string;
  payment_url?: string;
  shipping_method?: string;
  shipping_carrier?: string;
  tracking_number?: string;
  tracking_url?: string;
  shipping_status?: string;
  shipping_notes?: string;
  shipped_at?: string;
  delivery_eta?: string;
  delivered_at?: string;
  certificates?: string;
  care_details?: string;
  warranty_details?: string;
  service_details?: string;
  updated_at?: string;
  updated_by?: string;
  last_shipping_check_at?: string;
};

const ORDER_CONFIRMATION_KEY_PREFIX = "order:confirm:";
const ORDER_CANCEL_KEY_PREFIX = "order:cancel:";
const QUOTE_CONFIRMATION_KEY_PREFIX = "quote:confirm:";

function buildOrderConfirmationKey(token: string) {
  const normalized = token.trim();
  return normalized ? `${ORDER_CONFIRMATION_KEY_PREFIX}${normalized}` : "";
}

function buildOrderCancelKey(token: string) {
  const normalized = token.trim();
  return normalized ? `${ORDER_CANCEL_KEY_PREFIX}${normalized}` : "";
}

function buildQuoteConfirmationKey(token: string) {
  const normalized = token.trim();
  return normalized ? `${QUOTE_CONFIRMATION_KEY_PREFIX}${normalized}` : "";
}

function buildOrderConfirmationPageUrl(env: Env, token: string) {
  const base = (env.ORDER_CONFIRMATION_PAGE_URL || ORDER_CONFIRMATION_PAGE_URL).trim();
  if (!base) return `https://www.heerawalla.com/order_confirmation?token=${encodeURIComponent(token)}`;
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${trimmed}?token=${encodeURIComponent(token)}`;
}

function buildOrderCancelPageUrl(env: Env, token: string) {
  const base = (env.ORDER_CANCEL_PAGE_URL || ORDER_CANCEL_PAGE_URL).trim();
  if (!base) return `https://www.heerawalla.com/order_cancel?token=${encodeURIComponent(token)}`;
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${trimmed}?token=${encodeURIComponent(token)}`;
}

function buildOrderAuthenticityPageUrl(env: Env) {
  const base = (env.ORDER_AUTHENTICITY_PAGE_URL || ORDER_AUTHENTICITY_PAGE_URL).trim();
  if (!base) return "https://www.heerawalla.com/authenticity";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

function buildQuotePageUrl(env: Env, token: string) {
  const base = (env.QUOTE_PAGE_URL || QUOTE_PAGE_URL).trim();
  if (!base) return `https://www.heerawalla.com/quote?token=${encodeURIComponent(token)}`;
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${trimmed}?token=${encodeURIComponent(token)}`;
}

function isQuoteExpired(record: QuoteConfirmationRecord) {
  if (!record.expiresAt) return false;
  const expiresAt = Date.parse(record.expiresAt);
  if (!Number.isFinite(expiresAt)) return false;
  return Date.now() > expiresAt;
}

function generateOrderConfirmationToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  const buffer = new Uint8Array(16);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function generateQuoteConfirmationToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  const buffer = new Uint8Array(16);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeOrderConfirmationChanges(value: unknown): ConfirmationChange[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const key = getString(entry.key);
      const label = getString(entry.label);
      const from = getString(entry.from);
      const to = getString(entry.to);
      if (!key && !label && !from && !to) return null;
      return { key: key || undefined, label: label || undefined, from: from || undefined, to: to || undefined };
    })
    .filter(Boolean) as ConfirmationChange[];
}

async function storeOrderConfirmationRecord(env: Env, record: OrderConfirmationRecord) {
  if (!env.HEERAWALLA_ACKS) return;
  const key = buildOrderConfirmationKey(record.token);
  if (!key) return;
  await env.HEERAWALLA_ACKS.put(key, JSON.stringify(record), { expirationTtl: ORDER_CONFIRMATION_TTL });
}

async function getOrderConfirmationRecord(env: Env, token: string) {
  if (!env.HEERAWALLA_ACKS) return null;
  const key = buildOrderConfirmationKey(token);
  if (!key) return null;
  const value = await env.HEERAWALLA_ACKS.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as OrderConfirmationRecord;
  } catch {
    return null;
  }
}

async function storeQuoteConfirmationRecord(env: Env, record: QuoteConfirmationRecord) {
  if (!env.HEERAWALLA_ACKS) return;
  const key = buildQuoteConfirmationKey(record.token);
  if (!key) return;
  await env.HEERAWALLA_ACKS.put(key, JSON.stringify(record), { expirationTtl: QUOTE_CONFIRMATION_TTL });
}

async function expireQuoteConfirmationToken(env: Env, token: string, redirectToken = "") {
  if (!env.HEERAWALLA_ACKS) return;
  const existing = await getQuoteConfirmationRecord(env, token);
  if (!existing) return;
  const refreshedAt = new Date().toISOString();
  const updated: QuoteConfirmationRecord = {
    ...existing,
    status: "expired",
    expiresAt: refreshedAt,
    refreshedAt,
    redirectToken: redirectToken || existing.redirectToken,
  };
  await storeQuoteConfirmationRecord(env, updated);
}

async function getQuoteConfirmationRecord(env: Env, token: string) {
  if (!env.HEERAWALLA_ACKS) return null;
  const key = buildQuoteConfirmationKey(token);
  if (!key) return null;
  const value = await env.HEERAWALLA_ACKS.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as QuoteConfirmationRecord;
  } catch {
    return null;
  }
}

async function storeOrderCancelRecord(env: Env, record: OrderCancelRecord) {
  if (!env.HEERAWALLA_ACKS) return;
  const key = buildOrderCancelKey(record.token);
  if (!key) return;
  await env.HEERAWALLA_ACKS.put(key, JSON.stringify(record), { expirationTtl: ORDER_CANCEL_TTL });
}

async function getOrderCancelRecord(env: Env, token: string) {
  if (!env.HEERAWALLA_ACKS) return null;
  const key = buildOrderCancelKey(token);
  if (!key) return null;
  const value = await env.HEERAWALLA_ACKS.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as OrderCancelRecord;
  } catch {
    return null;
  }
}

function resolveOrderConfirmationPaymentUrl(env: Env, record: OrderConfirmationRecord) {
  if (record.paymentUrl) return record.paymentUrl;
  const template = getString(env.ORDER_CONFIRMATION_PAYMENT_URL);
  if (!template) return "";
  return template
    .replace(/\{requestId\}/g, record.requestId)
    .replace(/\{token\}/g, record.token)
    .replace(/\{email\}/g, record.email || "");
}

function buildSummaryKey(requestId: string) {
  const normalized = normalizeRequestId(requestId);
  return normalized ? `summary:req:${normalized}` : "";
}

async function storeRequestSummary(env: Env, requestId: string, summary: RequestSummary) {
  if (!env.HEERAWALLA_ACKS) return;
  const key = buildSummaryKey(requestId);
  if (!key) return;
  const payload = JSON.stringify({
    subject: summary.subject || "",
    body: summary.body || "",
    email: summary.email || "",
    name: summary.name || "",
  });
  await env.HEERAWALLA_ACKS.put(key, payload, { expirationTtl: REQUEST_SUMMARY_TTL });
}

async function getRequestSummary(env: Env, requestId: string) {
  if (!env.HEERAWALLA_ACKS) return null;
  const key = buildSummaryKey(requestId);
  if (!key) return null;
  const value = await env.HEERAWALLA_ACKS.get(key);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as RequestSummary;
    if (!parsed?.body && !parsed?.subject) return null;
    return buildRequestSummaryText(parsed);
  } catch {
    return null;
  }
}

function buildRequestSummaryText(summary: RequestSummary) {
  const subject = summary.subject ? summary.subject.trim() : "Heerawalla request";
  const sender = summary.email
    ? summary.name
      ? `${summary.name} <${summary.email}>`
      : summary.email
    : "Not provided";
  const body = truncateSummaryBody(summary.body || "");
  return `Subject: ${subject}\nFrom: ${sender}\n\n${body}`;
}

function truncateSummaryBody(body: string) {
  const normalized = body.replace(/\r\n/g, "\n").trim();
  if (!normalized) return "(No original request body stored.)";
  const lines = normalized.split("\n");
  const limitedLines = lines.slice(0, REQUEST_SUMMARY_MAX_LINES);
  let text = limitedLines.join("\n");
  if (text.length > REQUEST_SUMMARY_MAX_CHARS) {
    text = text.slice(0, REQUEST_SUMMARY_MAX_CHARS).trimEnd();
  }
  if (lines.length > REQUEST_SUMMARY_MAX_LINES || normalized.length > REQUEST_SUMMARY_MAX_CHARS) {
    text += "\n[truncated]";
  }
  return text;
}

async function storeRequestOrigin(env: Env, requestId: string, email: string, name?: string) {
  if (!env.HEERAWALLA_ACKS) return;
  const key = buildOriginKey(requestId);
  if (!key || !email) return;
  const payload = JSON.stringify({ email, name: name || "" });
  await env.HEERAWALLA_ACKS.put(key, payload, { expirationTtl: REQUEST_ORIGIN_TTL });
}

async function getRequestOrigin(env: Env, requestId: string) {
  if (!env.HEERAWALLA_ACKS) return null;
  const key = buildOriginKey(requestId);
  if (!key) return null;
  const value = await env.HEERAWALLA_ACKS.get(key);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as { email?: string; name?: string };
    if (!parsed?.email) return null;
    return { email: parsed.email, name: parsed.name || "" };
  } catch {
    return null;
  }
}

function logInfo(message: string, details: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ level: "info", message, ...details }));
}

function logWarn(message: string, details: Record<string, unknown> = {}) {
  console.warn(JSON.stringify({ level: "warn", message, ...details }));
}

function logError(message: string, details: Record<string, unknown> = {}) {
  console.error(JSON.stringify({ level: "error", message, ...details }));
}

async function describeMedia(env: Env, mediaId: string) {
  const accountId =
    env.CF_ACCOUNT_ID ||
    env.CLOUDFLARE_ACCOUNT_ID ||
    (env as any).CF_ACCOUNT ||
    (env as any).CLOUDFLARE_ACCOUNT ||
    "";
  const apiToken =
    env.CF_API_TOKEN ||
    env.CLOUDFLARE_API_TOKEN ||
    (env as any).CF_TOKEN ||
    (env as any).CLOUDFLARE_TOKEN ||
    "";
  const modelChoices = (
    [
      env.CF_AI_MODEL,
      env.AI_MODEL,
      "@cf/openai/vision-mini",
    ] as Array<string | undefined>
  ).filter(Boolean) as string[];
  const geminiKey = (env as any).GEMINI_API_KEY || env.GEMINI_API_KEY;
  const geminiModel = (env as any).GEMINI_MODEL || env.GEMINI_MODEL || "gemini-2.0-flash";

  if (!accountId || !apiToken) {
    if (!geminiKey) {
      return { ok: false, error: "ai_credentials_missing" };
    }
  }

  const rows = await d1All(
    env,
    "SELECT media_id, url, media_type, label, alt, description FROM media_library WHERE media_id = ? LIMIT 1",
    [mediaId]
  );
  if (!rows.length) return { ok: false, error: "media_not_found" };

  const row = rows[0];
  const imageUrl = getString(row.url || "");
  if (!imageUrl) return { ok: false, error: "media_url_missing" };

  // Pull a little more context (catalog slug / position / tags) to guide the model toward the correct item type.
  const mappingHints = await d1All(
    env,
    `SELECT catalog_items.slug, catalog_items.categories, catalog_items.tags, catalog_media.position
     FROM catalog_media
     JOIN catalog_items ON catalog_items.id = catalog_media.catalog_id
     WHERE catalog_media.media_id = ?
     LIMIT 1`,
    [mediaId]
  );
  const map = mappingHints[0] || {};
  const catalogSlug = getString(map.slug || "");
  const catalogCategories = getString(map.categories || "");
  const catalogTags = getString(map.tags || "");
  const catalogPosition = getString(map.position || "");

  const prompt = `Write a customer-facing jewelry image description for Heerawalla in 90-110 words.
- First word should be the item type you see (choose exactly one: Bracelet, Bangle, Ring, Pendant, Earrings, Necklace, Chain, or Set).
- Then describe metal tone and the key diamond/gem arrangement and any visible silhouette details.
- Keep it elegant, sensory, and specific to what is visible. Avoid prices, guarantees, carat numbers, or certifications.
- Use natural prose (2-3 sentences), no bullet points, no marketing hype.
- If unsure, prefer "Bracelet" when the piece is wrist-worn and has continuous links/band; prefer "Ring" only when finger-sized; prefer "Bangle" for rigid wrist pieces.
- Media hints: label=${row.label || ""}, alt=${row.alt || ""}, position=${catalogPosition}, slug=${catalogSlug}, categories=${catalogCategories}, tags=${catalogTags}.`;

  const body = {
    messages: [
      {
        role: "system",
        content: "You are a luxury jewelry copywriter. Write refined, specific, imagery-rich text.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: `${prompt}\nMedia hints: id=${row.media_id || ""} label=${row.label || ""} alt=${row.alt || ""}` },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
    max_tokens: 260,
    temperature: 0.55,
  };

  let description = "";
  let lastError = "";
  for (const candidate of modelChoices) {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${encodeURIComponent(candidate)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) {
        const text = await response.text();
        if (text.includes("No route for that URI") || text.includes("\"code\":7000")) {
          lastError = `ai_model_unavailable:${candidate}`;
          continue;
        }
        lastError = `ai_failed:${candidate}:${response.status}:${text.slice(0, 200)}`;
        continue;
      }
      const data = (await response.json()) as Record<string, unknown>;
      const result = (data as any).result || {};
      description =
        result.response ||
        result.output ||
        result.output_text ||
        result.generated_text ||
        result.text ||
        result?.choices?.[0]?.message?.content ||
        "";
      if (!description || typeof description !== "string") {
        lastError = `ai_empty_response:${candidate}`;
        continue;
      }
      description = description.trim();
      break;
    } catch (error) {
      lastError = `ai_error:${candidate}:${String((error as Error).message || error)}`;
    }
  }
  if (!description && geminiKey) {
    const geminiResult = await describeWithGemini(geminiKey, geminiModel, imageUrl, prompt);
    if (geminiResult.ok && geminiResult.description) {
      description = geminiResult.description;
    } else {
      lastError = geminiResult.error || lastError || "ai_model_unavailable";
    }
  }
  if (!description) {
    return { ok: false, error: lastError || "ai_model_unavailable" };
  }

  // Do not auto-save; caller can decide to persist
  return { ok: true, description };
}

async function describeWithGemini(
  apiKey: string,
  model: string,
  imageUrl: string,
  prompt: string
): Promise<{ ok: boolean; description?: string; error?: string }> {
  try {
    const imageResp = await fetch(imageUrl);
    if (!imageResp.ok) {
      return { ok: false, error: `gemini_fetch_image:${imageResp.status}` };
    }
    const buf = await imageResp.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    const mime = imageResp.headers.get("content-type") || "image/jpeg";

    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mime, data: base64 } },
          ],
        },
      ],
      generationConfig: { temperature: 0.4, maxOutputTokens: 200 },
    };

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!resp.ok) {
      const text = await resp.text();
      return { ok: false, error: `gemini_failed:${resp.status}:${text.slice(0, 200)}` };
    }
    const data = (await resp.json()) as any;
    const description =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join(" ").trim() || "";
    if (!description) return { ok: false, error: "gemini_empty_response" };
    return { ok: true, description };
  } catch (error) {
    return { ok: false, error: `gemini_error:${String((error as Error).message || error)}` };
  }
}

export {
  BookingError,
  addTicketDetail,
  appendContactRow,
  appendOrderRow,
  autoReplyHeaders,
  buildCatalogCacheKey,
  buildCatalogHeaders,
  buildCorsHeaders,
  buildForwardHtml,
  buildForwardSubject,
  computeOptionPriceFromCosts,
  createTicketFromContact,
  generateRequestId,
  getBoolean,
  getCalendarAvailability,
  getInternalReplyTo,
  getString,
  getStringArray,
  handleAdminRequest,
  handleMediaRequest,
  handleOrderCancellationRequest,
  handleOrderConfirmationRequest,
  handleOrderVerificationRequest,
  handleQuoteConfirmationRequest,
  handleSubmitPayload,
  hasD1,
  hasValidEmailDomain,
  isEnabled,
  isLocalOrigin,
  isRecord,
  isValidEmail,
  isValidPhone,
  loadCatalogPayload,
  loadCostChartValues,
  loadDiamondClarityGroups,
  loadDiamondPriceChart,
  loadPriceChartAdjustments,
  logError,
  logInfo,
  logWarn,
  maskEmail,
  normalizeContactPreference,
  normalizeMetalOption,
  normalizePhone,
  normalizeRequestId,
  normalizeTimeline,
  parseDiamondBreakdownComponentsPayload,
  resolveAttribution,
  resolveDiscountDetails,
  safeJson,
  sendConsultationAck,
  sendEmail,
  storeRequestOrigin,
  storeRequestSummary,
  syncGoogleContact,
  upsertUnifiedContact,
  verifyTurnstile,
  bookCalendarSlot,
};
