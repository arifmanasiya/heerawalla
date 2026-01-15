import { EmailMessage } from "cloudflare:email";
import type { Env } from "./config";
import {
  ACK_SUBJECT_PREFIX,
  QUOTE_ACK_SUBJECT,
  CONTACT_ACK_SUBJECT,
  ORDER_SHEET_HEADER,
  QUOTE_SHEET_HEADER,
  CONTACT_SHEET_HEADER,
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
  REJECT_SUBJECT,
  REJECT_TEXT,
  REJECT_HTML,
} from "./config";

type CachedToken = { value: string; expiresAt: number } | null;
let cachedAccessToken: CachedToken = null;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : "";
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
          const phone = getString(payload.phone);
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
        const phone = getString(payload.phone);
        const interests = getStringArray(payload.interests || payload.interest || payload.designInterests);
        const source = getString(payload.source);
        const pageUrl = getString(payload.pageUrl);
        const requestId = generateRequestId();
        const sourceLabel = source || "subscribe";
        const { utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referrer } =
          resolveAttribution(payload, request);
        const resolvedPageUrl = pageUrl || referrer;

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

        const subject = name
          ? `Heerawalla join request from ${name}`
          : "Heerawalla join request";
        const bodyLines = [
          name ? `Name: ${name}` : "",
          `Email: ${senderEmail}`,
          phone ? `Phone: ${phone}` : "",
          interests.length ? `Interests: ${interests.join(", ")}` : "",
          source ? `Source: ${source}` : "",
          pageUrl ? `Page: ${pageUrl}` : "",
        ].filter(Boolean);
        const body = bodyLines.join("\n");

        const forwardTo = (env.SUBSCRIBE_TO || "noreply.heerawalla@gmail.com").trim();
        const replyTo = name ? `${name} <${senderEmail}>` : senderEmail;
        try {
          await sendEmail(env, {
            to: [forwardTo || "noreply.heerawalla@gmail.com"],
            sender: "Heerawalla <atelier@heerawalla.com>",
            replyTo,
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
              subject: SUBSCRIBE_ACK_SUBJECT,
              textBody: SUBSCRIBE_ACK_TEXT,
              htmlBody: SUBSCRIBE_ACK_HTML,
              headers: autoReplyHeaders(),
            });
          }

          try {
            await storeSubscription(env, {
              email: senderEmail,
              name,
              phone,
              interests,
              source: sourceLabel,
              pageUrl,
              requestId,
              createdAt: new Date().toISOString(),
            });
          } catch (error) {
            logWarn("subscribe_store_failed", { requestId, error: String(error) });
          }

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
          try {
            await appendContactRow(env, [
              new Date().toISOString(),
              senderEmail,
              name,
              phone,
              sourceLabel,
              requestId,
              "",
              interests.join(", "),
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
        } catch (error) {
          logError("subscribe_send_failed", { requestId, email: maskEmail(senderEmail) });
          throw error;
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

        await markUnsubscribed(env, senderEmail, reason);
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
        const phone = getString(payload.phone);
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
            await appendContactRow(env, [
              new Date().toISOString(),
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
            ]);
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
        const phone = getString(payload.phone);
        const source = getString(payload.source) || "order";
        const productName = getString(payload.productName);
        const productUrl = getString(payload.productUrl);
        const designCode = getString(payload.designCode);
        const metal = getString(payload.metal);
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
          ]);
          logInfo("order_sheet_written", { requestId });
          try {
            await appendContactRow(env, [
              now,
              senderEmail,
              senderName,
              phone,
              source,
              requestId,
              "",
              "",
              pageUrl,
              utmSource,
              utmMedium,
              utmCampaign,
              utmTerm,
              utmContent,
              referrer,
              addressLine1,
              addressLine2,
              city,
              state,
              postalCode,
              country,
              "subscribed",
            ]);
          } catch (error) {
            logWarn("contact_sheet_failed", { requestId, error: String(error) });
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
    if (!isEnabled(env.SEND_ACK, true) || ackMode !== "cron") return;
    ctx.waitUntil(processAckQueues(env));
  },
} satisfies ExportedHandler<Env>;

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
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
    headers["Vary"] = "Origin";
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
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(allowedOrigin, true),
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
    if (path === "/orders") {
      const payload = await buildAdminList(env, "order", url.searchParams);
      return new Response(JSON.stringify({ ok: true, ...payload }), {
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
  }

  if (request.method === "POST") {
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
      const result = await handleOrderAdminAction(env, payload);
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
    return new Response(
      JSON.stringify({
        ok: true,
        status: record.status,
        requestId: record.requestId,
        name: record.name || "",
        productName: record.productName || "",
        changes: record.changes || [],
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
    const updatedRecord = { ...record, status: "confirmed", confirmedAt };
    await storeOrderConfirmationRecord(env, updatedRecord);
    await appendOrderNote(env, record.requestId, `Customer confirmed update on ${confirmedAt}.`);
    const paymentUrl = resolveOrderConfirmationPaymentUrl(env, updatedRecord);
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
    const updatedRecord = { ...record, status: "canceled", canceledAt };
    await storeOrderConfirmationRecord(env, updatedRecord);
    await appendOrderNote(env, record.requestId, `Customer canceled update on ${canceledAt}.`);
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
  return "";
}

function isLocalOrigin(origin: string) {
  return origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1");
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

async function buildAdminList(
  env: Env,
  kind: "order" | "quote" | "contact",
  params: URLSearchParams
) {
  const config = getSheetConfig(env, kind);
  const headerRows = await fetchSheetValues(env, config.sheetId, config.headerRange);
  const headerFallback =
    kind === "order" ? ORDER_SHEET_HEADER : kind === "quote" ? QUOTE_SHEET_HEADER : CONTACT_SHEET_HEADER;
  const header = headerRows[0] && headerRows[0].length ? headerRows[0] : headerFallback;
  const rows = await fetchSheetValues(env, config.sheetId, `${config.sheetName}!A2:AZ`);
  const items = rows.map((row, index) => {
    const entry: Record<string, string> = { row_number: String(index + 2) };
    header.forEach((key, idx) => {
      if (!key) return;
      entry[key] = String(row[idx] ?? "");
    });
    return entry;
  });

  const filtered = applyAdminFilters(items, params);
  const sorted = applyAdminSort(filtered, params);
  const offset = Math.max(Number(params.get("offset") || 0), 0);
  const limit = Math.min(Math.max(Number(params.get("limit") || 200), 1), 500);
  const paged = sorted.slice(offset, offset + limit);

  return { items: paged, total: sorted.length };
}

function applyAdminFilters(items: Array<Record<string, string>>, params: URLSearchParams) {
  const status = (params.get("status") || "").trim().toUpperCase();
  const q = (params.get("q") || "").trim().toLowerCase();
  const email = (params.get("email") || "").trim().toLowerCase();
  const requestId = (params.get("request_id") || "").trim().toLowerCase();

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
    if (q) {
      const haystack = [
        item.request_id,
        item.name,
        item.email,
        item.product_name,
        item.design_code,
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

async function handleOrderAdminAction(env: Env, payload: Record<string, unknown>) {
  const requestId = getString(payload.requestId || payload.request_id);
  if (!requestId) return { ok: false, error: "missing_request_id" };
  const action = getString(payload.action).toLowerCase();
  const status = getString(payload.status).toUpperCase();
  const notes = getString(payload.notes);
  const updates = coerceUpdates(payload.fields, ORDER_UPDATE_FIELDS);
  const nextStatus = resolveOrderStatus(action, status);
  return await updateAdminRow(env, "order", requestId, nextStatus, notes, updates);
}

async function handleQuoteAdminAction(env: Env, payload: Record<string, unknown>) {
  const requestId = getString(payload.requestId || payload.request_id);
  if (!requestId) return { ok: false, error: "missing_request_id" };
  const action = getString(payload.action).toLowerCase();
  const status = getString(payload.status).toUpperCase();
  const notes = getString(payload.notes);
  const updates = coerceUpdates(payload.fields, QUOTE_UPDATE_FIELDS);
  const nextStatus = resolveQuoteStatus(action, status);
  return await updateAdminRow(env, "quote", requestId, nextStatus, notes, updates);
}

async function handleContactAdminAction(env: Env, payload: Record<string, unknown>) {
  const requestId = getString(payload.requestId || payload.request_id);
  if (!requestId) return { ok: false, error: "missing_request_id" };
  const action = getString(payload.action).toLowerCase();
  const status = getString(payload.status).toUpperCase();
  const notes = getString(payload.notes);
  const updates = coerceUpdates(payload.fields, CONTACT_UPDATE_FIELDS);
  const nextStatus = resolveContactStatus(action, status);
  return await updateAdminRow(env, "contact", requestId, nextStatus, notes, updates);
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
  "stone",
  "stone_weight",
  "size",
  "price",
  "timeline",
  "address_line1",
  "address_line2",
  "city",
  "state",
  "postal_code",
  "country",
] as const;

const QUOTE_UPDATE_FIELDS = [
  "name",
  "email",
  "phone",
  "product_name",
  "product_url",
  "design_code",
  "metal",
  "stone",
  "stone_weight",
  "size",
  "price",
  "timeline",
  "address_line1",
  "address_line2",
  "city",
  "state",
  "postal_code",
  "country",
] as const;

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
    case "send_invoice":
      return "INVOICED";
    case "mark_paid":
      return "INVOICE_PAID";
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

function resolveQuoteStatus(action: string, status: string) {
  if (status) return status;
  switch (action) {
    case "submit_quote":
      return "QUOTED";
    case "convert_to_order":
      return "CONVERTED";
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
  const config = getSheetConfig(env, kind);
  const headerRows = await fetchSheetValues(env, config.sheetId, config.headerRange);
  const headerFallback =
    kind === "order" ? ORDER_SHEET_HEADER : kind === "quote" ? QUOTE_SHEET_HEADER : CONTACT_SHEET_HEADER;
  const header = headerRows[0] && headerRows[0].length ? headerRows[0] : headerFallback;
  const headerIndex = new Map(header.map((key, idx) => [String(key || ""), idx]));
  const requestIdx = headerIndex.get("request_id") ?? -1;
  if (requestIdx < 0) return { ok: false, error: "missing_request_id_column" };
  const rows = await fetchSheetValues(env, config.sheetId, `${config.sheetName}!A2:AZ`);
  const normalizedTarget = normalizeRequestId(requestId);
  let rowNumber = -1;
  for (let i = 0; i < rows.length; i += 1) {
    const candidate = normalizeRequestId(getString(rows[i]?.[requestIdx]));
    if (candidate && candidate === normalizedTarget) {
      rowNumber = i + 2;
      break;
    }
  }
  if (rowNumber < 0) return { ok: false, error: "request_not_found" };

  const now = new Date().toISOString();
  const updatesToApply: Record<string, string> = { ...updates };
  if (status) updatesToApply.status = status;
  updatesToApply.status_updated_at = now;
  if (notes) updatesToApply.notes = notes;
  updatesToApply.last_error = "";

  await updateSheetColumns(env, config, headerIndex, rowNumber, updatesToApply);
  return { ok: true, status: status || undefined };
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
  const config = getSheetConfig(env, kind);
  const headerRows = await fetchSheetValues(env, config.sheetId, config.headerRange);
  const headerFallback =
    kind === "order" ? ORDER_SHEET_HEADER : kind === "quote" ? QUOTE_SHEET_HEADER : CONTACT_SHEET_HEADER;
  const header = headerRows[0] && headerRows[0].length ? headerRows[0] : headerFallback;
  const headerIndex = new Map(header.map((key, idx) => [String(key || ""), idx]));
  const requestIdx = headerIndex.get("request_id") ?? -1;
  if (requestIdx < 0) return null;
  const rows = await fetchSheetValues(env, config.sheetId, `${config.sheetName}!A2:AZ`);
  const normalizedTarget = normalizeRequestId(requestId);
  for (let i = 0; i < rows.length; i += 1) {
    const candidate = normalizeRequestId(getString(rows[i]?.[requestIdx]));
    if (candidate && candidate === normalizedTarget) {
      return { config, headerIndex, rowNumber: i + 2, row: rows[i] };
    }
  }
  return null;
}

async function appendOrderNote(env: Env, requestId: string, note: string) {
  if (!note) return;
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
  "short_desc",
  "long_desc",
  "hero_image",
  "collection",
  "categories",
  "gender",
  "styles",
  "motifs",
  "metals",
  "stone_types",
  "stone_weight",
  "metal_weight",
  "palette",
  "takeaways",
  "translation_notes",
  "design_code",
  "cut",
  "clarity",
  "color",
  "carat",
  "price_usd_natural",
  "estimated_price_usd_vvs1_vvs2_18k",
  "lab_discount_pct",
  "metal_platinum_premium",
  "metal_14k_discount_pct",
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

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    if (char === "\r") {
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

function parsePalette(value: string | undefined) {
  return parseList(value).map((entry) => {
    const [rawType, ...rest] = entry.split(":");
    const type = rawType === "stone" ? "stone" : "metal";
    const label = rest.length ? rest.join(":").trim() : rawType.trim();
    return { type, label };
  });
}

function buildSheetsCsvUrl(sheetId: string, gid: string) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

function getCatalogUrl(env: Env, kind: "products" | "inspirations" | "site_config") {
  const direct =
    kind === "products"
      ? env.CATALOG_PRODUCTS_URL || env.PRODUCTS_CSV_URL
      : kind === "inspirations"
      ? env.CATALOG_INSPIRATIONS_URL || env.INSPIRATIONS_CSV_URL
      : env.CATALOG_SITE_CONFIG_URL || env.SITE_CONFIG_CSV_URL;
  if (direct) return direct;
  const sheetId = env.CATALOG_SHEET_ID;
  const gid =
    kind === "products"
      ? env.CATALOG_PRODUCTS_GID
      : kind === "inspirations"
      ? env.CATALOG_INSPIRATIONS_GID
      : env.CATALOG_SITE_CONFIG_GID;
  if (sheetId && gid) {
    return buildSheetsCsvUrl(sheetId, gid);
  }
  return "";
}

async function loadCatalogPayload(env: Env, params: URLSearchParams) {
  const includeParam = (params.get("include") || "").trim();
  const includeAll = !includeParam;
  const include = new Set(
    includeAll
      ? ["products", "inspirations", "site_config"]
      : includeParam
          .split(",")
          .map((entry) => entry.trim().toLowerCase())
          .filter(Boolean)
  );

  const payload: Record<string, unknown> = {
    ok: true,
    generatedAt: new Date().toISOString(),
  };

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
        return {
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          short_desc: row.short_desc,
          long_desc: row.long_desc,
          hero_image: row.hero_image,
          collection: row.collection,
          category: categories[0] || row.categories || row.category || "",
          design_code: row.design_code,
          metal: metals[0] || row.metals || row.metal || "",
          stone_types: row.stone_types || "",
          stone_weight: parseNumber(row.stone_weight),
          metal_weight: parseNumber(row.metal_weight),
          cut: row.cut,
          clarity: row.clarity,
          color: row.color,
          carat: parseNumber(row.carat),
          price_usd_natural: parseNumber(row.price_usd_natural),
          estimated_price_usd_vvs1_vvs2_18k: parseNumber(
            row.estimated_price_usd_vvs1_vvs2_18k
          ),
          lab_discount_pct: parseNumber(row.lab_discount_pct),
          metal_platinum_premium: parseNumber(row.metal_platinum_premium),
          metal_14k_discount_pct: parseNumber(row.metal_14k_discount_pct),
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
    payload.inspirations = records.map((row) => ({
      id: row.id,
      title: row.name,
      slug: row.slug,
      heroImage: row.hero_image,
      shortDesc: row.short_desc,
      longDesc: row.long_desc,
      estimatedPriceUsdVvs1Vvs2_18k: parseNumber(row.estimated_price_usd_vvs1_vvs2_18k),
      stoneTypes: parseStoneTypes(row.stone_types),
      stoneWeight: parseNumber(row.stone_weight),
      metalWeight: parseNumber(row.metal_weight),
      tags: parseList(row.tags),
      categories: parseList(row.categories),
      genders: parseList(row.gender),
      styles: parseList(row.styles),
      motifs: parseList(row.motifs),
      metals: parseList(row.metals),
      palette: parsePalette(row.palette),
      takeaways: parseList(row.takeaways),
      translationNotes: parseList(row.translation_notes),
      designCode: row.design_code,
    }));
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
      : env.CONTACTS_SHEET_ID;
  const name =
    kind === "order"
      ? env.ORDER_SHEET_NAME
      : kind === "quote"
      ? env.QUOTE_SHEET_NAME
      : env.CONTACTS_SHEET_NAME;
  const range =
    kind === "order"
      ? env.ORDER_SHEET_RANGE
      : kind === "quote"
      ? env.QUOTE_SHEET_RANGE
      : env.CONTACTS_SHEET_RANGE;
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

async function ensureSheetHeader(
  env: Env,
  config: SheetConfig,
  headerRow: string[],
  cacheKey: string
) {
  if (env.HEERAWALLA_ACKS) {
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
    await ensureSheetHeader(env, config, headerRow, cacheKey);
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
  const config = getSheetConfig(env, "order");
  await appendSheetRow(env, config, values, ORDER_SHEET_HEADER);
}

async function appendQuoteRow(env: Env, values: Array<string | number>) {
  const config = getSheetConfig(env, "quote");
  await appendSheetRow(env, config, values, QUOTE_SHEET_HEADER);
}

async function appendContactRow(env: Env, values: Array<string | number>) {
  const config = getSheetConfig(env, "contact");
  await appendSheetRow(env, config, values, CONTACT_SHEET_HEADER);
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
  const headerRow = headerRows[0] || [];
  if (!headerRow.length) {
    logWarn("ack_queue_missing_header", { kind });
    return;
  }
  const headerIndex = new Map<string, number>();
  headerRow.forEach((cell, idx) => {
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

  const dataRange = `${config.sheetName}!A2:AZ`;
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

    const rowNumber = i + 2;
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
            sender: "Heerawalla <no-reply@heerawalla.com>",
            replyTo: "no-reply@heerawalla.com",
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
    const phone = getString(payload.phone);
    const source = getString(payload.source) || "quote";
    const productName = getString(payload.productName || payload.inspirationTitle);
    const productUrl = getString(payload.productUrl || payload.inspirationUrl);
    const designCode = getString(payload.designCode);
    const metal = getString(payload.metal);
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
        ]);
        logInfo("quote_sheet_written", { requestId: normalizedRequestId });
        try {
          await appendContactRow(env, [
            now,
            senderEmail,
            senderName,
            phone,
            source,
            normalizedRequestId,
            "",
            "",
            pageUrl,
            utmSource,
            utmMedium,
            utmCampaign,
            utmTerm,
            utmContent,
            referrer,
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            country,
            "subscribed",
          ]);
        } catch (error) {
          logWarn("contact_sheet_failed", { requestId: normalizedRequestId, error: String(error) });
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
              <div style="font-size:12px;letter-spacing:0.32em;text-transform:uppercase;color:#64748b;margin-bottom:12px;">
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
  expiresAt?: string;
  paymentUrl?: string;
};

const ORDER_CONFIRMATION_KEY_PREFIX = "order:confirm:";

function buildOrderConfirmationKey(token: string) {
  const normalized = token.trim();
  return normalized ? `${ORDER_CONFIRMATION_KEY_PREFIX}${normalized}` : "";
}

function buildOrderConfirmationPageUrl(env: Env, token: string) {
  const base = (env.ORDER_CONFIRMATION_PAGE_URL || ORDER_CONFIRMATION_PAGE_URL).trim();
  if (!base) return `https://www.heerawalla.com/order_confirmation?token=${encodeURIComponent(token)}`;
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${trimmed}?token=${encodeURIComponent(token)}`;
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

type SubscriptionRecord = {
  email: string;
  name?: string;
  phone?: string;
  interests?: string[];
  source?: string;
  pageUrl?: string;
  requestId?: string;
  createdAt: string;
};

function buildSubscribeKey(email: string) {
  const normalized = normalizeEmailAddress(email);
  return normalized ? `sub:${normalized}` : "";
}

function buildUnsubscribeKey(email: string) {
  const normalized = normalizeEmailAddress(email);
  return normalized ? `unsub:${normalized}` : "";
}

async function storeSubscription(env: Env, record: SubscriptionRecord) {
  if (!env.HEERAWALLA_ACKS) return;
  const key = buildSubscribeKey(record.email);
  if (!key) return;
  await env.HEERAWALLA_ACKS.put(key, JSON.stringify(record));
  const unsubKey = buildUnsubscribeKey(record.email);
  if (unsubKey) {
    await env.HEERAWALLA_ACKS.delete(unsubKey);
  }
}

async function markUnsubscribed(env: Env, email: string, reason?: string) {
  if (!env.HEERAWALLA_ACKS) return;
  const normalized = normalizeEmailAddress(email);
  if (!normalized) return;
  const unsubKey = buildUnsubscribeKey(normalized);
  if (unsubKey) {
    await env.HEERAWALLA_ACKS.put(
      unsubKey,
      JSON.stringify({
        email: normalized,
        reason: reason || "",
        updatedAt: new Date().toISOString(),
      })
    );
  }
  const subKey = buildSubscribeKey(normalized);
  if (subKey) {
    await env.HEERAWALLA_ACKS.delete(subKey);
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
