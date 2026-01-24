export const MEDIA_PLACEHOLDER_URL =
  "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"800\" height=\"1000\" viewBox=\"0 0 800 1000\"><rect width=\"800\" height=\"1000\" fill=\"%23f1f5f9\"/><text x=\"50%25\" y=\"50%25\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"%2394a3b8\" font-family=\"Arial\" font-size=\"32\">Heerawalla</text></svg>";

const LOGO_MARK_FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"64\" viewBox=\"0 0 64 64\"><rect width=\"64\" height=\"64\" fill=\"%23ffffff\"/><rect x=\"8\" y=\"8\" width=\"48\" height=\"48\" fill=\"%230b1928\"/><text x=\"32\" y=\"38\" text-anchor=\"middle\" font-family=\"Arial\" font-size=\"28\" fill=\"%23ffffff\">H</text></svg>";

const MEDIA_BASE_URL = import.meta.env.PUBLIC_MEDIA_BASE_URL ?? "";
const MEDIA_BASE = MEDIA_BASE_URL ? MEDIA_BASE_URL.replace(/\/$/, "") : "";

export const LOGO_MARK_URL = MEDIA_BASE
  ? `${MEDIA_BASE}/media/brand/favicon.svg`
  : LOGO_MARK_FALLBACK;
export const HERO_IMAGE_URL = MEDIA_BASE
  ? `${MEDIA_BASE}/media/brand/hero.png`
  : MEDIA_PLACEHOLDER_URL;
export const ATELIER_IMAGE_URL = MEDIA_BASE
  ? `${MEDIA_BASE}/media/brand/atelier.png`
  : MEDIA_PLACEHOLDER_URL;
