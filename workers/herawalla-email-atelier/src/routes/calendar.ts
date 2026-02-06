import type { Env } from "../config";
import type { RouteContext } from "../types";
import {
  BookingError,
  generateRequestId,
  hasD1,
  isEnabled,
  resolveAttribution,
  sendConsultationAck,
} from "../legacy";
import { bookCalendarSlot, getCalendarAvailability } from "../services/calendar-service";
import { appendContactRow, syncGoogleContact, upsertUnifiedContact } from "../services/contacts-service";
import { buildCorsHeaders } from "../utils/cors";
import { logError, logInfo, logWarn } from "../utils/logging";
import { getBoolean, getString, safeJson } from "../utils/request-utils";
import { isRecord, isValidEmail, isValidPhone, normalizeContactPreference, normalizePhone } from "../utils/validation";
import { CALENDAR_AVAILABILITY_PATH, CALENDAR_BOOK_PATH } from "../config";

export async function handleCalendarRoute(
  request: Request,
  env: Env,
  context: RouteContext
): Promise<Response> {
  const { url, origin, allowedOrigin } = context;
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
      const landingPageUrl =
        getString(payload.landingPageUrl || payload.landing_page_url || payload.landingPage) || pageUrl;
      const howHeard = getString(payload.source || payload.howHeardAboutUs || payload.how_heard_about_us);
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
      if (hasD1(env)) {
        try {
          await env.DB.prepare(
            `INSERT INTO consultations (
              id,
              created_at,
              request_id,
              customer_name,
              customer_email,
              customer_phone,
              message,
              how_heard_about_us,
              utm_source,
              utm_medium,
              utm_campaign,
              utm_content,
              utm_term,
              referrer_url,
              landing_page_url,
              consultation_status,
              consultation_date,
              consultation_time,
              contact_preference,
              phone_preferred
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              requestId,
              new Date().toISOString(),
              requestId,
              name,
              email,
              phone,
              message,
              howHeard || null,
              utmSource || null,
              utmMedium || null,
              utmCampaign || null,
              utmContent || null,
              utmTerm || null,
              referrer || null,
              landingPageUrl || resolvedPageUrl || null,
              "scheduled",
              date,
              time,
              contactPreference || (phonePreferred ? "phone" : ""),
              phonePreferred ? 1 : 0
            )
            .run();
        } catch (error) {
          logWarn("consultation_d1_insert_failed", { requestId, error: String(error) });
        }
      }
      logInfo("consultation_marketing_attribution", {
        requestId,
        utmSource,
        utmCampaign,
        howHeard,
        timestamp: new Date().toISOString(),
      });
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

  return new Response("Not Found", {
    status: 404,
    headers: buildCorsHeaders(allowedOrigin, true),
  });
}
