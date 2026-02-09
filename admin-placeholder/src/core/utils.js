export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

export function normalizeImageUrl(value, siteBase = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(https?:|data:|blob:)/i.test(raw)) {
    try {
      const parsed = new URL(raw);
      if (
        siteBase &&
        (parsed.hostname === "business.heerawalla.com" || parsed.hostname === "admin-api.heerawalla.com")
      ) {
        return `${siteBase}${parsed.pathname}${parsed.search || ""}`;
      }
    } catch {
      return raw;
    }
    return raw;
  }
  if (raw.startsWith("//")) return `https:${raw}`;
  if (!siteBase) return raw;
  if (raw.startsWith("/")) return `${siteBase}${raw}`;
  return `${siteBase}/${raw}`;
}

export function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export function formatPrice(value) {
  if (value === undefined || value === null || value === "") return "--";
  const num = Number(String(value).replace(/[^0-9.]/g, ""));
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "--";
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length > 11) return `+${digits}`;
  return digits;
}

export function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

export function normalizeNumber(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const number = Number(raw);
  if (Number.isNaN(number)) return raw.toLowerCase();
  return String(number);
}

export function normalizePrice(value) {
  const cleaned = String(value || "").replace(/[^0-9.]/g, "");
  if (!cleaned) return "";
  const number = Number(cleaned);
  if (Number.isNaN(number)) return cleaned;
  return String(number);
}

export function normalizeTimelineValue(value) {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  if (normalized.includes("rush")) return "rush";
  if (normalized.includes("standard")) return "standard";
  return normalized;
}

export function formatPlain(value) {
  return String(value || "").trim();
}

export function formatStoneWeight(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const number = Number(raw);
  if (Number.isNaN(number)) return raw;
  return `${number} ct`;
}

export function formatGrams(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const number = Number(raw);
  if (Number.isNaN(number)) return raw;
  return `${number} g`;
}

export function formatSignedGrams(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const number = Number(raw);
  if (Number.isNaN(number)) return raw;
  const sign = number > 0 ? "+" : "";
  return `${sign}${number} g`;
}

export function formatDelayWeeks(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const number = Number(raw);
  if (Number.isNaN(number)) return raw;
  if (!number) return "No delay";
  return `${number} week${number === 1 ? "" : "s"} delay`;
}

export function formatTimelineValue(value) {
  const normalized = normalizeTimelineValue(value);
  if (!normalized) return "";
  if (normalized === "rush") return "Rush";
  if (normalized === "standard") return "Standard";
  return value;
}

export function isFilled(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}
