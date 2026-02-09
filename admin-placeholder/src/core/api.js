export function getApiBase() {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem("adminApiBase") || "";
  return stored || document.body.dataset.apiBase || "";
}

export function getLocalAdminEmail() {
  if (typeof window === "undefined") return "";
  const origin = window.location.origin || "";
  if (!origin.startsWith("http://localhost") && !origin.startsWith("http://127.0.0.1")) {
    return "";
  }
  const stored = localStorage.getItem("adminEmail") || "";
  if (stored) return stored;
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("adminEmail") || params.get("admin_email") || "";
  if (fromQuery && fromQuery.includes("@")) {
    localStorage.setItem("adminEmail", fromQuery);
    return fromQuery;
  }
  return "";
}

export function getStoredAdminEmail() {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem("adminEmail") || "";
  } catch {
    return "";
  }
}

export function buildAdminHeaders(extra = {}, explicitEmail = "") {
  const headers = { "Content-Type": "application/json", ...extra };
  const localEmail = explicitEmail || getLocalAdminEmail();
  if (localEmail) {
    headers["X-Admin-Email"] = localEmail;
  }
  return headers;
}

export async function apiFetch(path, options = {}) {
  const resolvedBase = getApiBase();
  if (!resolvedBase) throw new Error("Missing API base");
  const base = resolvedBase.endsWith("/") ? resolvedBase : `${resolvedBase}/`;
  const url = new URL(path.replace(/^\//, ""), base);
  const isLocalApi = base.startsWith("http://localhost") || base.startsWith("http://127.0.0.1");
  const localEmail = isLocalApi ? getStoredAdminEmail() : getLocalAdminEmail();
  const headers = buildAdminHeaders(options.headers || {}, localEmail);
  if (isLocalApi && localEmail) {
    url.searchParams.set("admin_email", localEmail);
  }
  const response = await fetch(url.toString(), {
    credentials: isLocalApi ? "omit" : "include",
    headers,
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    const error = new Error(text || response.statusText);
    error.status = response.status;
    throw error;
  }
  return await response.json();
}
