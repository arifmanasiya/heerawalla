import { EmailMessage } from "cloudflare:email";

export interface Env {
  FORWARD_TO?: string;
  FORWARD_REJECTS_TO?: string;
  HEERAWALLA_ACKS?: KVNamespace;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REFRESH_TOKEN?: string;
  GOOGLE_CALENDAR_ID?: string;
  SEND_EMAIL?: SendEmail;
  SEND_ACK?: string | boolean;
  SEND_REJECT?: string | boolean;
  SEND_SUBMIT?: string | boolean;
  RESEND_API_KEY?: string;
  ATELIER_SENDERS?: string;
  REPLY_TO_ADDRESS?: string;
  TURNSTILE_SECRET?: string;
}

const ACK_SUBJECT_PREFIX = "Heerawalla - Your request has been received";
const CONTACT_ACK_SUBJECT = "Heerawalla - Thanks for your message";
const EMAIL_TEXT = [
  "Thank you for contacting Heerawalla.",
  "",
  "We confirm receipt of your request. Our atelier will reply personally within 1-2 business days.",
  "",
  "Next, our atelier will review your request and confirm details by reply. Once aligned, we will share a final estimate and timeline.",
  "",
  "Your request now enters a deliberate, best-in-class craftsmanship process - measured, personal, and worth the wait.",
  "",
  "If you would like to add details, simply reply to this email to keep your request in the same thread.",
  "",
  "Warm regards,",
  "Heerawalla",
  "www.heerawalla.com",
  "",
  "Privacy: We do not store your data beyond this email thread. This exchange remains private and direct.",
].join("\n");

const EMAIL_HTML = `<!DOCTYPE html>
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
                We have received your request
              </h1>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
                Thank you for contacting Heerawalla. Your request is now with our atelier, and you can expect a personal reply within 1-2 business days.
              </p>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
                Next, our atelier will review your request and confirm details by reply. Once aligned, we will share a final estimate and timeline.
              </p>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
                Your request now enters a deliberate, best-in-class craftsmanship process - measured, personal, and worth the wait.
              </p>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.7;color:#334155;">
                If you would like to add details, simply reply to this email to keep your request in the same thread.
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
          You are receiving this message in response to your request.
        </p>
        <p style="margin:6px 0 0 0;font-size:11px;color:#94a3b8;">
          Privacy: We do not store your data beyond this email thread. This exchange remains private and direct.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

const CONTACT_ACK_TEXT = [
  "Thank you for reaching out to Heerawalla.",
  "",
  "We have received your message and will respond within 1-2 business days.",
  "",
  "If you need to add details, simply reply to this email.",
  "",
  "Warm regards,",
  "Heerawalla",
  "www.heerawalla.com",
].join("\n");

const CONTACT_ACK_HTML = `<!DOCTYPE html>
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
                Thanks for your message
              </h1>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
                We have received your message and will respond within 1-2 business days.
              </p>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.7;color:#334155;">
                If you need to add details, simply reply to this email.
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
          You are receiving this message in response to your inquiry.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

const CONSULTATION_ACK_SUBJECT = "Heerawalla - Consultation confirmed";
const REQUEST_ID_PREFIX = "HW-REQ:";
const REQUEST_ID_LABEL = "Heerawalla Request ID:";
const REQUEST_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REQUEST_ID_LENGTH = 6;
const BESPOKE_URL = "https://www.heerawalla.com/inspirations";
const BESPOKE_DIRECT_URL = "https://www.heerawalla.com/bespoke";
const SUBMIT_PATH = "/submit";
const SUBMIT_STATUS_PATH = "/submit-status";
const CONTACT_SUBMIT_PATH = "/contact-submit";
const REQUEST_ORIGIN_TTL = 60 * 60 * 24 * 180;
const REQUEST_SUMMARY_TTL = 60 * 60 * 24 * 180;
const REQUEST_SUMMARY_MAX_LINES = 60;
const REQUEST_SUMMARY_MAX_CHARS = 1800;
const DEFAULT_REPLY_TO = "atelier@heerawalla.com";
const MAX_SUBMISSIONS_PER_HOUR = 5;
const CALENDAR_AVAILABILITY_PATH = "/calendar/availability";
const CALENDAR_BOOK_PATH = "/calendar/book";
const CALENDAR_TIMEZONE = "America/Chicago";
const CALENDAR_SLOT_MINUTES = 30;
const CALENDAR_BUFFER_MINUTES = 30;
const CALENDAR_LEAD_HOURS = 24;
const CALENDAR_WINDOWS = [
  { startHour: 10, startMinute: 0, endHour: 12, endMinute: 0 },
  { startHour: 15, startMinute: 0, endHour: 17, endMinute: 0 },
] as const;
const HOLIDAY_CALENDAR_ID = "en.usa#holiday@group.v.calendar.google.com";
const ALLOWED_ORIGINS = [
  "https://www.heerawalla.com",
  "https://heerawalla.com",
  "https://arifmanasiya.github.io",
  "https://herawalla-email-atelier.arifmanasiya.workers.dev",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
];
const REJECT_SUBJECT = "Heerawalla - Please submit your request via our website";
const REJECT_TEXT = [
  "Thank you for your message.",
  "",
  "To protect your privacy and ensure a consistent atelier process, we can only accept new requests submitted through our website.",
  "",
  `Please visit: ${BESPOKE_URL}`,
  'Select an inspiration and click "Request a bespoke quote."',
  `If you did not find a close match, submit a bespoke request here: ${BESPOKE_DIRECT_URL}`,
  "",
  "If you are replying to an existing Heerawalla thread, please reply directly to that email instead.",
  "",
  "Warm regards,",
  "Heerawalla",
  "www.heerawalla.com",
].join("\n");

const REJECT_HTML = `<!DOCTYPE html>
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
              <h1 style="margin:0 0 16px 0;font-size:20px;line-height:1.4;font-weight:600;color:#0f172a;">
                Please submit your request via our website
              </h1>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
                Thank you for your message. To protect your privacy and ensure a consistent atelier process, we can only accept new requests submitted through our website.
              </p>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
                Visit <a href="${BESPOKE_URL}" style="color:#0f172a;text-decoration:underline;">${BESPOKE_URL}</a> and select an inspiration, then click "Request a bespoke quote."
              </p>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.7;color:#475569;">
                If you did not find a close match, submit a bespoke request here:
                <a href="${BESPOKE_DIRECT_URL}" style="color:#0f172a;text-decoration:underline;">${BESPOKE_DIRECT_URL}</a>
              </p>
              <p style="margin:0 0 24px 0;font-size:14px;line-height:1.7;color:#475569;">
                If you are replying to an existing Heerawalla thread, please reply directly to that email instead.
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

type CachedToken = { value: string; expiresAt: number } | null;
let cachedAccessToken: CachedToken = null;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : "";

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
              sender: "Heerawalla <atelier@heerawalla.com>",
              replyTo: getCustomerReplyTo(),
              subject: CONTACT_ACK_SUBJECT,
              textBody: CONTACT_ACK_TEXT,
              htmlBody: CONTACT_ACK_HTML,
              headers: autoReplyHeaders(),
            });
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

      try {
        const payload = await safeJson(request);
        if (!isRecord(payload)) {
          logWarn("submit_invalid_payload", { origin });
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
        const normalizedRequestId = normalizeRequestId(requestId);

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

        const forwardTo = env.FORWARD_TO || "atelier.heerawalla@gmail.com";
        const shouldSendAck = isEnabled(env.SEND_ACK, true);
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

          let shouldAck = true;
          if (env.HEERAWALLA_ACKS) {
            const ackKey = `ack:req:${normalizedRequestId}`;
            const alreadyAcked = await env.HEERAWALLA_ACKS.get(ackKey);
            if (alreadyAcked) {
              shouldAck = false;
              logInfo("submit_ack_skipped", { requestId, email: maskEmail(senderEmail) });
            } else {
              await env.HEERAWALLA_ACKS.put(ackKey, "1", { expirationTtl: 60 * 60 * 24 * 7 });
            }
          }

          if (shouldAck && shouldSendAck) {
            logInfo("submit_ack_start", { requestId, email: maskEmail(senderEmail) });
          await sendEmail(env, {
            to: [senderEmail],
            sender: "Heerawalla <atelier@heerawalla.com>",
            replyTo: getCustomerReplyTo(),
            subject: buildAckSubject(normalizedRequestId),
            textBody: EMAIL_TEXT,
            htmlBody: EMAIL_HTML,
              headers: autoReplyHeaders(),
            });
            logInfo("submit_ack_sent", { requestId, email: maskEmail(senderEmail) });
          }
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
  }
  if (json) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
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
    sender: "Heerawalla <atelier@heerawalla.com>",
    replyTo: getCustomerReplyTo(),
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

function buildAckSubject(requestId: string) {
  const normalizedId = normalizeRequestId(requestId);
  if (!normalizedId) return ACK_SUBJECT_PREFIX;
  return `${ACK_SUBJECT_PREFIX} [HW-REQ:${normalizedId}]`;
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
