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
  ACK_MODE?: string;
  SUBSCRIBE_TO?: string;
  RESEND_API_KEY?: string;
  ATELIER_SENDERS?: string;
  REPLY_TO_ADDRESS?: string;
  TURNSTILE_SECRET?: string;
  CONTACT_LABEL_SUBSCRIBED?: string;
  CONTACT_LABEL_UNSUBSCRIBED?: string;
  CATALOG_SHEET_ID?: string;
  CATALOG_PRODUCTS_GID?: string;
  CATALOG_INSPIRATIONS_GID?: string;
  CATALOG_SITE_CONFIG_GID?: string;
  CATALOG_PRODUCTS_URL?: string;
  CATALOG_INSPIRATIONS_URL?: string;
  CATALOG_SITE_CONFIG_URL?: string;
  PRODUCTS_CSV_URL?: string;
  INSPIRATIONS_CSV_URL?: string;
  SITE_CONFIG_CSV_URL?: string;
  ORDER_SHEET_ID?: string;
  ORDER_SHEET_NAME?: string;
  ORDER_SHEET_RANGE?: string;
  QUOTE_SHEET_ID?: string;
  QUOTE_SHEET_NAME?: string;
  QUOTE_SHEET_RANGE?: string;
  CONTACTS_SHEET_ID?: string;
  CONTACTS_SHEET_NAME?: string;
  CONTACTS_SHEET_RANGE?: string;
}

export const ACK_SUBJECT_PREFIX = "Heerawalla - Your request has been received";
export const CONTACT_ACK_SUBJECT = "Heerawalla - Thanks for your message";
export const ORDER_SHEET_HEADER = [
  "created_at",
  "request_id",
  "status",
  "status_updated_at",
  "notes",
  "last_error",
  "price",
  "timeline",
  "name",
  "email",
  "phone",
  "source",
  "product_name",
  "product_url",
  "design_code",
  "metal",
  "stone",
  "stone_weight",
  "size",
  "address_line1",
  "address_line2",
  "city",
  "state",
  "postal_code",
  "country",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "referrer",
  "origin",
  "ip",
  "user_agent",
];
export const QUOTE_SHEET_HEADER = [
  "created_at",
  "request_id",
  "status",
  "status_updated_at",
  "notes",
  "last_error",
  "price",
  "timeline",
  "name",
  "email",
  "phone",
  "source",
  "product_name",
  "product_url",
  "design_code",
  "metal",
  "stone",
  "stone_weight",
  "size",
  "address_line1",
  "address_line2",
  "city",
  "state",
  "postal_code",
  "country",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "referrer",
  "origin",
  "ip",
  "user_agent",
];
export const CONTACT_SHEET_HEADER = [
  "created_at",
  "email",
  "name",
  "phone",
  "source",
  "request_id",
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
];
export const EMAIL_TEXT = [
  "Thank you for contacting Heerawalla.",
  "",
  "We confirm receipt of your request. Our atelier will reply personally within 1-2 business days.",
  "",
  "Next, our atelier will review your request and confirm details by reply. Once aligned, we will share a final estimate and timeline.",
  "",
  "Your request now enters a deliberate, best-in-class craftsmanship process - measured, personal, and worth the wait.",
  "",
  "If you would like to add details, submit a new note at Heerawalla.com/contact and include your request ID.",
  "",
  "Warm regards,",
  "Heerawalla",
  "www.heerawalla.com",
  "",
  "Privacy: We do not store your data beyond this email thread. This exchange remains private and direct.",
].join("\n");

export const EMAIL_HTML = `<!DOCTYPE html>
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
                If you would like to add details, submit a new note at
                <a href="https://www.heerawalla.com/contact" style="color:#0f172a;text-decoration:underline;">Heerawalla.com/contact</a>
                and include your request ID.
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

export const CONTACT_ACK_TEXT = [
  "Thank you for reaching out to Heerawalla.",
  "",
  "We have received your message and will respond within 1-2 business days.",
  "",
  "If you need to add details, submit a new note at Heerawalla.com/contact.",
  "",
  "Warm regards,",
  "Heerawalla",
  "www.heerawalla.com",
].join("\n");

export const CONTACT_ACK_HTML = `<!DOCTYPE html>
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
                If you need to add details, submit a new note at
                <a href="https://www.heerawalla.com/contact" style="color:#0f172a;text-decoration:underline;">Heerawalla.com/contact</a>.
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

export const SUBSCRIBE_ACK_SUBJECT = "Heerawalla - You're on the list";
export const UNSUBSCRIBE_URL = "https://www.heerawalla.com/unsubscribe";
export const DEFAULT_CONTACT_LABEL_SUBSCRIBED = "Heerawalla Subscribed";
export const DEFAULT_CONTACT_LABEL_UNSUBSCRIBED = "Heerawalla Unsubscribed";
export const SUBSCRIBE_ACK_TEXT = [
  "Thank you for joining Heerawalla.",
  "",
  "You're on the list for new drops, atelier updates, and bespoke highlights.",
  "",
  "To refine your interests, visit Heerawalla.com/join.",
  `To unsubscribe, visit ${UNSUBSCRIBE_URL}.`,
  "",
  "Warm regards,",
  "Heerawalla",
  "www.heerawalla.com",
].join("\n");

export const SUBSCRIBE_ACK_HTML = `<!DOCTYPE html>
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
                You're on the list
              </h1>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
                Thank you for joining Heerawalla. You're on the list for new drops, atelier updates, and bespoke highlights.
              </p>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.7;color:#334155;">
                To refine your interests, visit
                <a href="https://www.heerawalla.com/join" style="color:#0f172a;text-decoration:underline;">Heerawalla.com/join</a>.
              </p>
              <p style="margin:0 0 24px 0;font-size:13px;line-height:1.7;color:#64748b;">
                Prefer not to receive updates? You can unsubscribe at
                <a href="${UNSUBSCRIBE_URL}" style="color:#0f172a;text-decoration:underline;">Heerawalla.com/unsubscribe</a>.
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

export const CONSULTATION_ACK_SUBJECT = "Heerawalla - Consultation confirmed";
export const REQUEST_ID_PREFIX = "HW-REQ:";
export const REQUEST_ID_LABEL = "Heerawalla Request ID:";
export const REQUEST_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const REQUEST_ID_LENGTH = 6;
export const BESPOKE_URL = "https://www.heerawalla.com/inspirations";
export const BESPOKE_DIRECT_URL = "https://www.heerawalla.com/bespoke";
export const SUBMIT_PATH = "/submit";
export const SUBMIT_STATUS_PATH = "/submit-status";
export const CONTACT_SUBMIT_PATH = "/contact-submit";
export const ORDER_PATH = "/order";
export const SUBSCRIBE_PATH = "/subscribe";
export const UNSUBSCRIBE_PATH = "/unsubscribe";
export const REQUEST_ORIGIN_TTL = 60 * 60 * 24 * 180;
export const REQUEST_SUMMARY_TTL = 60 * 60 * 24 * 180;
export const REQUEST_SUMMARY_MAX_LINES = 60;
export const REQUEST_SUMMARY_MAX_CHARS = 1800;
export const DEFAULT_REPLY_TO = "atelier@heerawalla.com";
export const MAX_SUBMISSIONS_PER_HOUR = 5;
export const CALENDAR_AVAILABILITY_PATH = "/calendar/availability";
export const CALENDAR_BOOK_PATH = "/calendar/book";
export const CALENDAR_TIMEZONE = "America/Chicago";
export const CALENDAR_SLOT_MINUTES = 30;
export const CALENDAR_BUFFER_MINUTES = 30;
export const CALENDAR_LEAD_HOURS = 24;
export const CALENDAR_WINDOWS = [
  { startHour: 10, startMinute: 0, endHour: 12, endMinute: 0 },
  { startHour: 15, startMinute: 0, endHour: 17, endMinute: 0 },
] as const;
export const CATALOG_PATH = "/catalog";
export const CATALOG_CACHE_SECONDS = 600;
export const HOLIDAY_CALENDAR_ID = "en.usa#holiday@group.v.calendar.google.com";
export const ALLOWED_ORIGINS = [
  "https://www.heerawalla.com",
  "https://heerawalla.com",
  "https://arifmanasiya.github.io",
  "https://herawalla-email-atelier.arifmanasiya.workers.dev",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
];
export const REJECT_SUBJECT = "Heerawalla - Please submit your request via our website";
export const REJECT_TEXT = [
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

export const REJECT_HTML = `<!DOCTYPE html>
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

