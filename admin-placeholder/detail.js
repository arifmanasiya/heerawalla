(() => {
  const state = {
    tab: "orders",
    role: "",
    email: "",
    selectedId: "",
    selectedItem: null,
    originalValues: {},
    originalRaw: {},
    originalNotes: "",
    orderDetails: {},
    pendingChanges: [],
    confirmation: null,
    isNewRow: false,
  };

  const STATUS_OPTIONS = {
    orders: [
      "NEW",
      "ACKNOWLEDGED",
      "PENDING_CONFIRMATION",
      "INVOICED",
      "INVOICE_EXPIRED",
      "INVOICE_PAID",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ],
    quotes: ["NEW", "ACKNOWLEDGED", "QUOTED", "CONVERTED", "DROPPED"],
    tickets: ["NEW", "PENDING", "RESOLVED"],
    contacts: [],
    "price-chart": [],
    "cost-chart": [],
    "diamond-price-chart": [],
  };

  const ACTIONS = {
    orders: [
      { action: "acknowledge", label: "Acknowledge", confirm: "Mark as acknowledged?" },
      { action: "send_invoice", label: "Send invoice", confirm: "Send invoice and mark invoiced?" },
      { action: "mark_paid", label: "Mark paid", confirm: "Confirm payment received?" },
      { action: "mark_invoice_expired", label: "Mark invoice expired", confirm: "Mark invoice as expired?" },
      { action: "mark_processing", label: "Mark processing", confirm: "Move order into processing?" },
      { action: "mark_shipped", label: "Mark shipped", confirm: "Mark as shipped?" },
      { action: "mark_delivered", label: "Mark delivered", confirm: "Mark as delivered?" },
      { action: "cancel", label: "Cancel order", confirm: "Cancel this order?" },
    ],
    quotes: [
      { action: "acknowledge", label: "Acknowledge", confirm: "Mark as acknowledged?" },
      { action: "submit_quote", label: "Send quote link", confirm: "Send quote link to customer?" },
      { action: "convert_to_order", label: "Convert to order", confirm: "Convert to order?" },
      { action: "drop", label: "Drop", confirm: "Drop this quote?" },
    ],
    tickets: [
      { action: "mark_pending", label: "Mark pending", confirm: "Mark as pending?" },
      { action: "mark_resolved", label: "Mark resolved", confirm: "Mark as resolved?" },
    ],
    contacts: [],
    "price-chart": [],
    "cost-chart": [],
    "diamond-price-chart": [],
  };

  const EDIT_FIELDS = {
    orders: [
      "price",
      "timeline",
      "timeline_adjustment_weeks",
      "metal",
      "metal_weight",
      "metal_weight_adjustment",
      "stone",
      "stone_weight",
      "notes",
    ],
    quotes: [
      "price",
      "timeline",
      "timeline_adjustment_weeks",
      "metal",
      "metal_weight",
      "stone",
      "stone_weight",
      "diamond_breakdown",
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
      "notes",
    ],
    tickets: ["notes"],
    contacts: [],
    "price-chart": ["metal", "adjustment_type", "adjustment_value", "notes"],
    "cost-chart": ["key", "value", "unit", "notes"],
    "diamond-price-chart": ["clarity", "color", "weight_min", "weight_max", "price_per_ct", "notes"],
  };

  const CONFIRM_FIELDS = [
    { key: "price", label: "Price", normalize: normalizePrice, format: formatPrice },
    { key: "timeline", label: "Timeline", normalize: normalizeTimelineValue, format: formatTimelineValue },
    { key: "timeline_adjustment_weeks", label: "Timeline delay", normalize: normalizeNumber, format: formatDelayWeeks },
    { key: "metal", label: "Metal", normalize: normalizeText, format: formatPlain },
    { key: "metal_weight", label: "Metal weight", normalize: normalizeNumber, format: formatGrams },
    {
      key: "metal_weight_adjustment",
      label: "Metal weight adjustment",
      normalize: normalizeNumber,
      format: formatSignedGrams,
    },
    { key: "stone", label: "Stone type", normalize: normalizeText, format: formatPlain },
    { key: "stone_weight", label: "Stone weight", normalize: normalizeNumber, format: formatStoneWeight },
  ];

  const ORDER_DETAILS_FIELDS = [
    "shipping_method",
    "shipping_carrier",
    "tracking_number",
    "tracking_url",
    "shipping_status",
    "delivery_eta",
    "shipping_notes",
    "certificates",
    "care_details",
    "warranty_details",
    "service_details",
  ];

  const REQUIRED_SHIPPING_DETAILS_FIELDS = [
    "shipping_carrier",
    "tracking_number",
    "certificates",
    "care_details",
    "warranty_details",
    "service_details",
  ];

  const ORDER_STATUS_FLOW = {
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

  const ORDER_ACTION_FLOW = {
    NEW: ["acknowledge", "cancel"],
    ACKNOWLEDGED: ["send_invoice", "cancel"],
    PENDING_CONFIRMATION: ["send_invoice", "cancel"],
    INVOICED: ["mark_paid", "mark_invoice_expired", "cancel"],
    INVOICE_EXPIRED: ["send_invoice", "cancel"],
    INVOICE_PAID: ["mark_processing", "mark_shipped"],
    PROCESSING: ["mark_shipped"],
    SHIPPED: ["mark_delivered"],
    DELIVERED: [],
    CANCELLED: ["send_invoice"],
  };

  const TAB_LABELS = {
    orders: "Order",
    quotes: "Quote",
    tickets: "Customer ticket",
    contacts: "Contact",
    "price-chart": "Price chart",
    "cost-chart": "Cost chart",
    "diamond-price-chart": "Diamond price chart",
  };

  const PRICING_TABS = new Set(["price-chart", "cost-chart", "diamond-price-chart"]);
  const QUOTE_OPTION_FIELDS = [
    { clarity: "quote_option_1_clarity", color: "quote_option_1_color", price: "quote_option_1_price_18k" },
    { clarity: "quote_option_2_clarity", color: "quote_option_2_color", price: "quote_option_2_price_18k" },
    { clarity: "quote_option_3_clarity", color: "quote_option_3_color", price: "quote_option_3_price_18k" },
  ];
  const QUOTE_PRICE_FIELDS = new Set(QUOTE_OPTION_FIELDS.map((option) => option.price));
  const QUOTE_PRICING_FIELDS = new Set([
    "metal_weight",
    "stone_weight",
    "diamond_breakdown",
    "timeline",
    "timeline_adjustment_weeks",
    ...QUOTE_OPTION_FIELDS.flatMap((option) => [option.clarity, option.color]),
  ]);

  const normalizeStatus = (value) => {
    const normalized = String(value || "NEW").trim().toUpperCase();
    return normalized === "INVOICE_NOT_PAID" ? "INVOICE_EXPIRED" : normalized || "NEW";
  };

  const getOrderStatusOptions = () => {
    const current = normalizeStatus(state.selectedItem?.status);
    const allowed = ORDER_STATUS_FLOW[current] || [];
    return allowed.filter((status) => status !== "PENDING_CONFIRMATION");
  };

  function canEditCurrentTab() {
    if (state.tab === "orders" || state.tab === "quotes") {
      return state.role === "admin" || state.role === "ops";
    }
    if (state.tab === "tickets") {
      return state.role === "admin";
    }
    if (
      state.tab === "price-chart" ||
      state.tab === "cost-chart" ||
      state.tab === "diamond-price-chart"
    ) {
      return state.role === "admin";
    }
    return false;
  }

  const ui = {
    syncLine: document.querySelector("[data-sync-line]"),
    userRole: document.querySelector("[data-user-role]"),
    userEmail: document.querySelector("[data-user-email]"),
    backLink: document.querySelector("[data-back-link]"),
    detailType: document.querySelector("[data-detail-type]"),
    detailTitle: document.querySelector("[data-detail-title]"),
    detailSub: document.querySelector("[data-detail-sub]"),
    detailError: document.querySelector("[data-detail-error]"),
    detailStatusCorner: document.querySelector("[data-detail-status-corner]"),
    detailGrid: document.querySelector("[data-detail-grid]"),
    actionRow: document.querySelector("[data-action-row]"),
    actionSelect: document.querySelector("[data-action-select]"),
    actionRun: document.querySelector("[data-action-run]"),
    editSection: document.querySelector("[data-edit-section]"),
    quoteSection: document.querySelector("[data-quote-section]"),
    quoteMetals: Array.from(document.querySelectorAll("[data-quote-metals] input[type=\"checkbox\"]")),
    quoteMetalInput: document.querySelector("[data-field=\"quote_metal_options\"]"),
    editFields: Array.from(document.querySelectorAll("[data-field]")),
    orderDetailsSection: document.querySelector("[data-order-details-section]"),
    orderDetailsFields: Array.from(document.querySelectorAll("[data-order-details-field]")),
    diamondBreakdown: document.querySelector("[data-diamond-breakdown]"),
    diamondBreakdownRows: document.querySelector("[data-diamond-breakdown-rows]"),
    diamondBreakdownAdd: document.querySelector("[data-diamond-breakdown-add]"),
    detailsSave: document.querySelector("[data-details-save]"),
    primaryAction: document.querySelector("[data-primary-action]"),
    notesSave: document.querySelector("[data-notes-save]"),
    confirmModal: document.querySelector("[data-confirm-modal]"),
    confirmClose: document.querySelector("[data-confirm-close]"),
    confirmTo: document.querySelector("[data-confirm-to]"),
    confirmSubject: document.querySelector("[data-confirm-subject]"),
    confirmPreview: document.querySelector("[data-confirm-preview]"),
    confirmSend: document.querySelector("[data-confirm-send]"),
    toast: document.querySelector("[data-toast]"),
  };

  const storedBase = localStorage.getItem("adminApiBase") || "";
  const apiBase = storedBase || document.body.dataset.apiBase || "";
  let isSyncingBreakdown = false;
  let quotePricingTimer = null;
  let quotePricingInFlight = false;
  const catalogCache = { data: null, promise: null };
  const mediaCache = new Map();

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizeNumber(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const number = Number(raw);
    if (Number.isNaN(number)) return raw.toLowerCase();
    return String(number);
  }

  function normalizePrice(value) {
    const cleaned = String(value || "").replace(/[^0-9.]/g, "");
    if (!cleaned) return "";
    const number = Number(cleaned);
    if (Number.isNaN(number)) return cleaned;
    return String(number);
  }

  function normalizeTimelineValue(value) {
    const normalized = normalizeText(value);
    if (!normalized) return "";
    if (normalized.includes("rush")) return "rush";
    if (normalized.includes("standard")) return "standard";
    return normalized;
  }

  function formatPlain(value) {
    return String(value || "").trim();
  }

  function formatStoneWeight(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const number = Number(raw);
    if (Number.isNaN(number)) return raw;
    return `${number} ct`;
  }

  function formatGrams(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const number = Number(raw);
    if (Number.isNaN(number)) return raw;
    return `${number} g`;
  }

  function formatSignedGrams(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const number = Number(raw);
    if (Number.isNaN(number)) return raw;
    const sign = number > 0 ? "+" : "";
    return `${sign}${number} g`;
  }

  function formatDelayWeeks(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const number = Number(raw);
    if (Number.isNaN(number)) return raw;
    if (!number) return "No delay";
    return `${number} week${number === 1 ? "" : "s"} delay`;
  }

  function formatTimelineValue(value) {
    const normalized = normalizeTimelineValue(value);
    if (!normalized) return "";
    if (normalized === "rush") return "Rush";
    if (normalized === "standard") return "Standard";
    return value;
  }

  function buildEtaLine(timelineValue, adjustmentValue) {
    const base = formatTimelineValue(timelineValue) || "Standard";
    const adjustment = Number(String(adjustmentValue || "").trim());
    if (!Number.isNaN(adjustment) && adjustment > 0) {
      return `Estimated delivery after payment: ${base} + ${adjustment} week${adjustment === 1 ? "" : "s"}.`;
    }
    return `Estimated delivery after payment: ${base}.`;
  }

  function getDiamondBreakdownField() {
    return ui.editFields.find((field) => field.dataset.field === "diamond_breakdown");
  }

  function parseDiamondBreakdownValue(value) {
    if (!value) return [];
    return String(value)
      .split(/\n|;|,/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const match = entry.match(
          /([0-9]*\.?[0-9]+)\s*(?:ct)?\s*[x×]\s*([0-9]*\.?[0-9]+)/i
        );
        if (match) {
          return { weight: match[1], count: match[2] };
        }
        const numbers = entry.match(/[0-9]*\.?[0-9]+/g) || [];
        if (numbers.length >= 2) {
          return { weight: numbers[0], count: numbers[1] };
        }
        if (numbers.length === 1) {
          return { weight: numbers[0], count: "1" };
        }
        return null;
      })
      .filter(Boolean);
  }

  function formatDiamondBreakdown(rows) {
    return rows
      .map((row) => {
        const weight = String(row.weight || "").trim();
        const count = String(row.count || "").trim();
        if (!weight || !count) return "";
        return `${weight} x ${count}`;
      })
      .filter(Boolean)
      .join("\n");
  }

  function getDiamondRowsFromDom() {
    if (!ui.diamondBreakdownRows) return [];
    return Array.from(ui.diamondBreakdownRows.querySelectorAll("[data-diamond-row]")).map(
      (row) => {
        const weight =
          row.querySelector("[data-diamond-weight]")?.value?.trim() || "";
        const count =
          row.querySelector("[data-diamond-count]")?.value?.trim() || "";
        return { weight, count };
      }
    );
  }

  function syncDiamondBreakdownField() {
    if (isSyncingBreakdown) return;
    const field = getDiamondBreakdownField();
    if (!field) return;
    const rows = getDiamondRowsFromDom();
    isSyncingBreakdown = true;
    field.value = formatDiamondBreakdown(rows);
    isSyncingBreakdown = false;
  }

  function renderDiamondBreakdownRows(rows) {
    if (!ui.diamondBreakdownRows) return;
    if (!rows.length) {
      ui.diamondBreakdownRows.innerHTML =
        '<p class="muted">No diamond pieces yet. Add a row to begin.</p>';
      return;
    }
    ui.diamondBreakdownRows.innerHTML = rows
      .map(
        (row, index) => `
          <div class="diamond-row" data-diamond-row data-row-index="${index}">
            <input type="text" data-diamond-weight placeholder="0.10" value="${escapeAttribute(
              row.weight || ""
            )}" />
            <span>ct ×</span>
            <input type="text" data-diamond-count placeholder="1" value="${escapeAttribute(
              row.count || ""
            )}" />
            <button class="btn btn-ghost" type="button" data-diamond-remove>Remove</button>
          </div>`
      )
      .join("");
  }

  function setDiamondBreakdownRowsFromField() {
    const field = getDiamondBreakdownField();
    if (!field) return;
    const rows = parseDiamondBreakdownValue(field.value);
    renderDiamondBreakdownRows(rows);
  }

  function toggleDiamondBreakdownVisibility() {
    if (!ui.diamondBreakdown) return;
    ui.diamondBreakdown.classList.toggle("is-hidden", state.tab !== "quotes");
  }

  function getEditField(key) {
    return ui.editFields.find((field) => field.dataset.field === key);
  }

  function markQuotePriceManual(field) {
    if (!field) return;
    field.dataset.auto = "false";
    field.dataset.manual = "true";
  }

  function shouldApplyAutoPrice(field) {
    if (!field) return false;
    const manual = field.dataset.manual === "true";
    if (manual && field.value) return false;
    return !field.value || field.dataset.auto === "true";
  }

  function resetQuoteAutoPricingState() {
    if (state.tab !== "quotes") return;
    QUOTE_OPTION_FIELDS.forEach((option) => {
      const field = getEditField(option.price);
      if (!field) return;
      field.dataset.auto = "true";
      field.dataset.manual = "";
    });
  }

  function collectQuotePricingFields() {
    if (state.tab !== "quotes") return null;
    const metalWeight = getEditValue("metal_weight");
    if (!metalWeight) return null;
    const hasOption = QUOTE_OPTION_FIELDS.some((option) => {
      return Boolean(getEditValue(option.clarity) || getEditValue(option.color));
    });
    if (!hasOption) return null;
    const fields = {};
    QUOTE_PRICING_FIELDS.forEach((key) => {
      const value = getEditValue(key);
      if (value) fields[key] = value;
    });
    return fields;
  }

  function applyQuotePricing(fields) {
    if (!fields) return;
    QUOTE_OPTION_FIELDS.forEach((option) => {
      const value = fields[option.price];
      if (!value) return;
      const field = getEditField(option.price);
      if (!shouldApplyAutoPrice(field)) return;
      field.value = value;
      field.dataset.auto = "true";
      field.dataset.manual = "";
    });
    updatePrimaryActionState();
  }

  async function refreshQuotePricing() {
    if (state.tab !== "quotes" || quotePricingInFlight) return;
    const fields = collectQuotePricingFields();
    if (!fields) return;
    quotePricingInFlight = true;
    try {
      const result = await apiFetch("/quotes/price", {
        method: "POST",
        body: JSON.stringify({ fields, force: true }),
      });
      if (result.ok) {
        applyQuotePricing(result.fields || {});
      }
    } catch (error) {
      return;
    } finally {
      quotePricingInFlight = false;
    }
  }

  function scheduleQuotePricingUpdate() {
    if (state.tab !== "quotes") return;
    if (quotePricingTimer) clearTimeout(quotePricingTimer);
    quotePricingTimer = setTimeout(() => {
      refreshQuotePricing();
    }, 350);
  }

  function getCatalogBase() {
    return apiBase.replace(/\/admin\/?$/, "");
  }

  function extractSlug(url) {
    if (!url) return "";
    try {
      const parsed = new URL(url, "https://www.heerawalla.com");
      const parts = parsed.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1] || "";
      if (last.toLowerCase() === "bespoke" && parts.length > 1) {
        return parts[parts.length - 2] || "";
      }
      return last;
    } catch {
      return "";
    }
  }

  function extractCatalogType(url) {
    if (!url) return "";
    try {
      const parsed = new URL(url, "https://www.heerawalla.com");
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.includes("inspirations")) return "inspirations";
      if (parts.includes("product") || parts.includes("products")) return "products";
      return "";
    } catch {
      return "";
    }
  }

  async function loadCatalog() {
    if (catalogCache.data) return catalogCache.data;
    if (catalogCache.promise) return catalogCache.promise;
    const url = `${getCatalogBase()}/catalog?include=products,inspirations`;
    catalogCache.promise = fetch(url)
      .then((response) => response.json())
      .then((data) => {
        catalogCache.data = data || {};
        return catalogCache.data;
      })
      .catch(() => {
        catalogCache.data = {};
        return catalogCache.data;
      })
      .finally(() => {
        catalogCache.promise = null;
      });
    return catalogCache.promise;
  }

  function collectImageUrls(entry) {
    if (!entry) return [];
    const candidates = [];
    if (entry.hero_image) candidates.push(entry.hero_image);
    if (entry.heroImage) candidates.push(entry.heroImage);
    if (Array.isArray(entry.images)) {
      entry.images.forEach((image) => candidates.push(image));
    }
    return Array.from(new Set(candidates.filter(Boolean)));
  }

  function resolveCatalogEntry(item, catalog) {
    if (!catalog) return null;
    const url = item.product_url || "";
    const slug = extractSlug(url);
    const type = extractCatalogType(url);
    const designCode = item.design_code || "";
    const name = item.product_name || "";
    const inspirations = Array.isArray(catalog.inspirations) ? catalog.inspirations : [];
    const products = Array.isArray(catalog.products) ? catalog.products : [];
    const byDesignCode = (entry) =>
      designCode &&
      (entry.design_code || entry.designCode || "").toLowerCase() === designCode.toLowerCase();
    const byName = (entry) =>
      name && String(entry.name || entry.title || "").toLowerCase() === name.toLowerCase();
    const bySlug = (entry) => slug && String(entry.slug || "").toLowerCase() === slug.toLowerCase();
    if (type === "inspirations") {
      return inspirations.find(bySlug) || inspirations.find(byDesignCode) || inspirations.find(byName) || null;
    }
    if (type === "products") {
      return products.find(bySlug) || products.find(byDesignCode) || products.find(byName) || null;
    }
    return (
      inspirations.find(bySlug) ||
      products.find(bySlug) ||
      inspirations.find(byDesignCode) ||
      products.find(byDesignCode) ||
      inspirations.find(byName) ||
      products.find(byName) ||
      null
    );
  }

  function buildMediaCarousel(images) {
    if (!images.length) {
      return '<div class="media-empty muted">No images available.</div>';
    }
    if (images.length === 1) {
      const src = escapeAttribute(images[0]);
      return `<div class="media-frame"><img src="${src}" alt="" loading="lazy"></div>`;
    }
    const slides = images
      .map(
        (src) => `<div class="media-slide"><img src="${escapeAttribute(src)}" alt="" loading="lazy"></div>`
      )
      .join("");
    return `
      <div class="media-carousel" data-media-carousel>
        <button class="carousel-btn" type="button" data-carousel-prev aria-label="Previous image">‹</button>
        <div class="media-track" data-carousel-track>${slides}</div>
        <button class="carousel-btn" type="button" data-carousel-next aria-label="Next image">›</button>
      </div>`;
  }

  function renderQuoteMediaSlot() {
    return '<div class="media-slot" data-media-slot><span class="muted">Loading images...</span></div>';
  }

  async function refreshQuoteMedia(item) {
    if (state.tab !== "quotes" || !ui.detailGrid) return;
    const slot = ui.detailGrid.querySelector("[data-media-slot]");
    if (!slot) return;
    const cacheKey = item.design_code || item.product_url || item.product_name || "";
    if (cacheKey && mediaCache.has(cacheKey)) {
      slot.innerHTML = buildMediaCarousel(mediaCache.get(cacheKey));
      return;
    }
    const catalog = await loadCatalog();
    const entry = resolveCatalogEntry(item, catalog);
    const images = collectImageUrls(entry);
    if (cacheKey) mediaCache.set(cacheKey, images);
    slot.innerHTML = buildMediaCarousel(images);
  }

  function showToast(message, variant) {
    if (!ui.toast) return;
    ui.toast.textContent = message;
    ui.toast.classList.add("is-visible");
    if (variant === "error") {
      ui.toast.style.background = "#b42318";
    } else {
      ui.toast.style.background = "var(--ink)";
    }
    setTimeout(() => ui.toast.classList.remove("is-visible"), 2400);
  }

  function setSyncStatus(status) {
    if (!ui.syncLine) return;
    ui.syncLine.textContent = status;
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  }

  function formatPrice(value) {
    if (value === undefined || value === null || value === "") return "";
    const num = Number(String(value).replace(/[^0-9.]/g, ""));
    if (Number.isNaN(num)) return String(value);
    return num.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  function hasValue(value) {
    return value !== undefined && value !== null && value !== "";
  }

  async function apiFetch(path, options = {}) {
    if (!apiBase) throw new Error("Missing API base");
    const base = apiBase.endsWith("/") ? apiBase : `${apiBase}/`;
    const url = new URL(path.replace(/^\//, ""), base);
    const response = await fetch(url.toString(), {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || response.statusText);
    }
    return await response.json();
  }

  function getTabEndpoint(tab) {
    if (tab === "orders") return "/orders";
    if (tab === "quotes") return "/quotes";
    if (tab === "tickets") return "/contacts";
    if (tab === "contacts") return "/contacts-unified";
    if (tab === "price-chart") return "/price-chart";
    if (tab === "cost-chart") return "/cost-chart";
    if (tab === "diamond-price-chart") return "/diamond-price-chart";
    return `/${tab}`;
  }

  function getActionEndpoint() {
    if (state.tab === "orders") return "/orders/action";
    if (state.tab === "quotes") return "/quotes/action";
    if (state.tab === "tickets") return "/contacts/action";
    if (state.tab === "price-chart") return "/price-chart/action";
    if (state.tab === "cost-chart") return "/cost-chart/action";
    if (state.tab === "diamond-price-chart") return "/diamond-price-chart/action";
    return "";
  }

  function getSelectedRecordId() {
    if (!state.selectedItem) return "";
    return (
      state.selectedItem.request_id ||
      state.selectedItem.email ||
      state.selectedItem.row_number ||
      ""
    );
  }

  function applyEditVisibility() {
    const allowed = new Set(EDIT_FIELDS[state.tab]);
    ui.editFields.forEach((field) => {
      const wrapper = field.closest(".field");
      const key = field.dataset.field || "";
      const show = allowed.has(key);
      if (wrapper) wrapper.classList.toggle("is-hidden", !show);
    });
    if (ui.editSection) {
      ui.editSection.classList.toggle("is-hidden", allowed.size === 0);
    }
    applyQuoteVisibility();
  }

  function applyOrderDetailsVisibility() {
    if (!ui.orderDetailsSection) return;
    const show = state.tab === "orders";
    ui.orderDetailsSection.classList.toggle("is-hidden", !show);
  }

  function applyQuoteVisibility() {
    if (!ui.quoteSection) return;
    ui.quoteSection.classList.toggle("is-hidden", state.tab !== "quotes");
    toggleDiamondBreakdownVisibility();
  }

  function syncQuoteMetalInput() {
    if (!ui.quoteMetalInput) return;
    const selected = ui.quoteMetals
      .filter((input) => input.checked)
      .map((input) => input.value);
    ui.quoteMetalInput.value = selected.join(", ");
  }

  function setQuoteMetalSelection(value) {
    if (!ui.quoteMetalInput) return;
    const selected = String(value || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (!selected.length) {
      selected.push("18K");
    }
    ui.quoteMetalInput.value = selected.join(", ");
    ui.quoteMetals.forEach((input) => {
      input.checked = selected.includes(input.value);
    });
  }

  function getOrderDetailsValue(key) {
    const field = ui.orderDetailsFields.find((input) => input.dataset.orderDetailsField === key);
    return field ? field.value.trim() : "";
  }

  function collectOrderDetailsUpdates() {
    const details = {};
    ORDER_DETAILS_FIELDS.forEach((key) => {
      const value = getOrderDetailsValue(key);
      if (value) details[key] = value;
    });
    return details;
  }

  function populateOrderDetails(details = {}) {
    state.orderDetails = details || {};
    ui.orderDetailsFields.forEach((field) => {
      const key = field.dataset.orderDetailsField;
      if (!key) return;
      const fallback = key === "shipping_method" ? "Express" : "";
      field.value = details[key] || fallback;
    });
  }

  function getActionConfig(action) {
    return ACTIONS[state.tab].find((entry) => entry.action === action);
  }

  function updateActionButtonState() {
    if (!ui.actionRun || !ui.actionSelect) return;
    const disabled = ui.actionSelect.disabled || !ui.actionSelect.value;
    ui.actionRun.disabled = disabled;
  }

  function renderActions() {
    const canEdit = canEditCurrentTab();
    const actions =
      state.tab === "orders" && state.selectedItem
        ? ACTIONS.orders.filter((action) =>
            (ORDER_ACTION_FLOW[normalizeStatus(state.selectedItem.status)] || []).includes(action.action)
          )
        : ACTIONS[state.tab];
    if (ui.actionSelect) {
      ui.actionSelect.innerHTML =
        '<option value="">Select an action</option>' +
        actions.map((action) => `<option value="${action.action}">${action.label}</option>`).join("");
      ui.actionSelect.disabled = !canEdit || actions.length === 0;
    }
    if (ui.actionRun) {
      ui.actionRun.disabled = !canEdit || !ui.actionSelect || !ui.actionSelect.value;
    }
    if (ui.actionRow) {
      ui.actionRow.style.display = actions.length ? "" : "none";
    }
    if (ui.primaryAction) {
      ui.primaryAction.disabled = !canEdit;
    }
    if (ui.notesSave) {
      ui.notesSave.disabled = !canEdit;
    }
    ui.editFields.forEach((field) => {
      field.disabled = !canEdit;
    });
    if (ui.detailsSave) {
      ui.detailsSave.disabled = !canEdit;
    }
    ui.orderDetailsFields.forEach((field) => {
      field.disabled = !canEdit;
    });
  }

  function renderDetailField(label, value) {
    const safeLabel = escapeHtml(label);
    const rawValue = String(value);
    if (label === "Product URL") {
      const href = escapeAttribute(rawValue);
      const text = escapeHtml(rawValue);
      return `<div><span>${safeLabel}</span><a href="${href}" target="_blank" rel="noreferrer">${text}</a></div>`;
    }
    if (label === "Images") {
      return `<div class="detail-media"><span>${safeLabel}</span>${rawValue}</div>`;
    }
    return `<div><span>${safeLabel}</span>${escapeHtml(rawValue)}</div>`;
  }

  function getEditValue(key) {
    const field = ui.editFields.find((input) => input.dataset.field === key);
    return field ? field.value.trim() : "";
  }

  function setOriginalValues(item) {
    state.originalValues = {};
    state.originalRaw = {};
    CONFIRM_FIELDS.forEach((field) => {
      const raw = String(item[field.key] || "");
      state.originalRaw[field.key] = raw;
      state.originalValues[field.key] = field.normalize(raw);
    });
    state.originalNotes = String(item.notes || "");
  }

  function collectConfirmChanges() {
    const changes = [];
    CONFIRM_FIELDS.forEach((field) => {
      const currentRaw = getEditValue(field.key);
      if (!currentRaw && !state.originalValues[field.key]) return;
      if (!currentRaw && state.originalValues[field.key]) return;
      const normalizedCurrent = field.normalize(currentRaw);
      const normalizedOriginal = state.originalValues[field.key] || "";
      if (normalizedCurrent !== normalizedOriginal) {
        changes.push({
          key: field.key,
          label: field.label,
          from: field.format(state.originalRaw[field.key]),
          to: field.format(currentRaw),
        });
      }
    });
    return changes;
  }

  function collectEditableUpdates() {
    const fields = {};
    syncQuoteMetalInput();
    ui.editFields.forEach((field) => {
      const key = field.dataset.field;
      if (!key) return;
      if (key === "notes") return;
      if (!EDIT_FIELDS[state.tab].includes(key)) return;
      if (field.value) fields[key] = field.value.trim();
    });
    return fields;
  }

  function getNotesValue() {
    const notesField = ui.editFields.find((field) => field.dataset.field === "notes");
    return notesField ? notesField.value.trim() : "";
  }

  function updatePrimaryActionState() {
    const canEdit = canEditCurrentTab();
    const notesChanged = getNotesValue() !== state.originalNotes.trim();
    if (ui.notesSave) {
      if (PRICING_TABS.has(state.tab) || state.tab === "quotes") {
        ui.notesSave.style.display = "none";
      } else {
        ui.notesSave.style.display = "";
        ui.notesSave.disabled = !canEdit || !notesChanged;
      }
    }

    if (!ui.primaryAction) return;
    ui.primaryAction.style.display = state.tab === "contacts" ? "none" : "";
    if (state.tab !== "orders") {
      const fields = collectEditableUpdates();
      if (PRICING_TABS.has(state.tab)) {
        fields.notes = getNotesValue();
      }
      const hasChanges =
        Object.keys(fields).length > 0 || (state.tab === "quotes" && notesChanged);
      ui.primaryAction.textContent =
        state.isNewRow && PRICING_TABS.has(state.tab) ? "Add row" : "Save updates";
      ui.primaryAction.disabled = !canEdit || !hasChanges;
      return;
    }

    ui.primaryAction.textContent = "Get Customer Confirmation";
    const changes = collectConfirmChanges();
    state.pendingChanges = changes;
    ui.primaryAction.disabled = !canEdit || changes.length === 0;
  }

  function buildChangeRows(changes) {
    return changes
      .map(
        (change) => `
          <div class="confirm-row">
            <div class="confirm-field">${escapeHtml(change.label)}</div>
            <div class="confirm-values">
              <span class="confirm-old">${escapeHtml(change.from || "--")}</span>
              <span class="confirm-arrow">-></span>
              <span class="confirm-new">${escapeHtml(change.to || "--")}</span>
            </div>
          </div>`
      )
      .join("");
  }

  function buildEmailChangeRows(changes) {
    return changes
      .map(
        (change) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
              <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#64748b;margin-bottom:6px;">
                ${escapeHtml(change.label)}
              </div>
              <div style="font-size:14px;line-height:1.6;color:#0f172a;">
                <span style="color:#94a3b8;text-decoration:line-through;">${escapeHtml(change.from || "--")}</span>
                <span style="color:#94a3b8;padding:0 8px;">-></span>
                <span style="font-weight:600;color:#0f172a;">${escapeHtml(change.to || "--")}</span>
              </div>
            </td>
          </tr>`
      )
      .join("");
  }

  function buildConfirmationEmail(item, changes, confirmationUrl) {
    const requestId = item.request_id || "";
    const name = item.name || "there";
    const product = item.product_name || "your order";
    const timelineValue = getEditValue("timeline") || item.timeline || "";
    const adjustmentValue =
      getEditValue("timeline_adjustment_weeks") || item.timeline_adjustment_weeks || "";
    const etaLine = buildEtaLine(timelineValue, adjustmentValue);
    const subject = requestId
      ? `Heerawalla - Confirm order update (${requestId})`
      : "Heerawalla - Confirm order update";

    const textLines = changes.map((change) => `${change.label}: ${change.from || "--"} -> ${change.to || "--"}`);
    const textBody = [
      `Hello ${name},`,
      "",
      `We reviewed your order for ${product}. Please confirm the updated details below (previous -> updated):`,
      "",
      ...textLines,
      "",
      etaLine,
      "",
      `Use your private confirmation link (Heerawalla.com/order_confirmation): ${confirmationUrl}`,
      "",
      "Once confirmed, you will be guided to a secure checkout to reserve your piece.",
      "Secure checkout supports major cards and wallets.",
      "If anything looks incorrect, choose cancel on the confirmation page or reply to this email.",
      "",
      "Warm regards,",
      "Heerawalla",
      "www.heerawalla.com",
    ].join("\n");

    const previewRows = buildChangeRows(changes);
    const emailRows = buildEmailChangeRows(changes);
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
              <div style="font-size:12px;letter-spacing:0.32em;text-transform:uppercase;color:#64748b;margin-bottom:12px;">Heerawalla</div>
              <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.4;font-weight:600;color:#0f172a;">Please confirm your order update</h1>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">Hello ${escapeHtml(name)},</p>
              <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#334155;">
                We reviewed your order for ${escapeHtml(product)}. Please confirm the updated details below (previous -> updated).
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;background:#fdfbf7;margin-bottom:18px;">
                <tbody>
                  ${emailRows}
                </tbody>
              </table>
              <p style="margin:0 0 18px 0;font-size:14px;line-height:1.7;color:#334155;">
                ${escapeHtml(etaLine)}
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;">
                <tr>
                  <td style="background:#0f172a;border:1px solid #0f172a;">
                    <a href="${escapeAttribute(confirmationUrl)}" style="display:inline-block;padding:12px 22px;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#ffffff;text-decoration:none;">Review and confirm</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px 0;font-size:13px;line-height:1.7;color:#475569;">
                Use your private confirmation link at Heerawalla.com/order_confirmation.
              </p>
              <p style="margin:0 0 6px 0;font-size:13px;line-height:1.7;color:#475569;">
                Once confirmed, you will be guided to a secure checkout to reserve your piece.
              </p>
              <p style="margin:0 0 6px 0;font-size:13px;line-height:1.7;color:#475569;">
                Secure checkout supports major cards and wallets.
              </p>
              <p style="margin:0 0 24px 0;font-size:13px;line-height:1.7;color:#475569;">
                If anything looks incorrect, choose cancel on the confirmation page or reply to this email.
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

    const previewHtml = `
      <div class="confirm-preview-card">
        <p class="confirm-title">Order update to confirm</p>
        <p class="confirm-sub">${escapeHtml(product)}${requestId ? ` (${escapeHtml(requestId)})` : ""}</p>
        <div class="confirm-list">${previewRows}</div>
        <a class="confirm-cta" href="${escapeAttribute(confirmationUrl)}" target="_blank" rel="noreferrer">Review and confirm</a>
        <p class="confirm-foot">${escapeHtml(etaLine)}</p>
        <p class="confirm-foot">
          Private confirmation link lets the customer confirm or cancel before secure checkout.
        </p>
      </div>`;

    return { subject, textBody, htmlBody, previewHtml };
  }

  function resolveConfirmationUrl(confirmResult) {
    const raw = confirmResult.confirmationUrl || confirmResult.url || "";
    if (raw) {
      if (raw.startsWith("http")) return raw;
      if (raw.startsWith("/")) return `https://www.heerawalla.com${raw}`;
      return raw;
    }
    const token = confirmResult.token || confirmResult.confirmationToken || "";
    if (!token) return "";
    return `https://www.heerawalla.com/order_confirmation?token=${encodeURIComponent(token)}`;
  }

  function openConfirmModal(emailPayload) {
    if (!ui.confirmModal) return;
    ui.confirmTo.textContent = emailPayload.to;
    ui.confirmSubject.textContent = emailPayload.subject;
    ui.confirmPreview.innerHTML = emailPayload.previewHtml;
    ui.confirmModal.classList.add("is-open");
    ui.confirmModal.setAttribute("aria-hidden", "false");
  }

  function closeConfirmModal() {
    if (!ui.confirmModal) return;
    ui.confirmModal.classList.remove("is-open");
    ui.confirmModal.setAttribute("aria-hidden", "true");
  }

  function populateDetail(item) {
    const requestId = state.isNewRow ? "New row" : item.request_id || item.email || "Record";
    const status = item.status || "NEW";
    state.selectedId = requestId;
    state.selectedItem = item;
    setOriginalValues(item);
    state.pendingChanges = [];
    state.confirmation = null;

    const detailLabel = TAB_LABELS[state.tab] || state.tab;
    ui.detailType.textContent = `${detailLabel} details`;
    ui.detailTitle.textContent =
      item.product_name || item.name || item.key || item.metal || item.clarity || requestId;
    ui.detailSub.textContent = requestId;
    if (ui.detailStatusCorner) {
      const statusValue =
        state.tab === "contacts" ||
        state.tab === "price-chart" ||
        state.tab === "cost-chart" ||
        state.tab === "diamond-price-chart"
          ? "--"
          : status;
      ui.detailStatusCorner.textContent = statusValue;
      ui.detailStatusCorner.dataset.status = statusValue;
    }
    if (ui.detailError) ui.detailError.textContent = "";

    const detailFields =
      state.tab === "contacts"
        ? [
            ["Created", formatDate(item.created_at)],
            ["Name", item.name],
            ["Email", item.email],
            ["Phone", item.phone],
            ["Type", item.type],
            ["Subscribed", item.subscribed],
            ["Sources", item.sources],
            ["First seen", formatDate(item.first_seen_at)],
            ["Last seen", formatDate(item.last_seen_at)],
            ["Last source", item.last_source],
            ["Unsubscribed at", formatDate(item.unsubscribed_at)],
            ["Unsubscribed reason", item.unsubscribed_reason],
            ["Updated", formatDate(item.updated_at)],
          ]
        : state.tab === "price-chart"
        ? [
            ["Row", item.row_number],
            ["Metal", item.metal],
            ["Adjustment type", item.adjustment_type],
            ["Adjustment value", item.adjustment_value],
            ["Notes", item.notes],
          ]
        : state.tab === "cost-chart"
        ? [
            ["Row", item.row_number],
            ["Key", item.key],
            ["Value", item.value],
            ["Unit", item.unit],
            ["Notes", item.notes],
          ]
        : state.tab === "diamond-price-chart"
        ? [
            ["Row", item.row_number],
            ["Clarity", item.clarity],
            ["Color", item.color],
            ["Weight min", item.weight_min],
            ["Weight max", item.weight_max],
            ["Price per ct", item.price_per_ct],
            ["Notes", item.notes],
          ]
        : state.tab === "quotes"
        ? [
            ["Created", formatDate(item.created_at)],
            ["Name", item.name],
            ["Email", item.email],
            ["Phone", item.phone],
            ["Product", item.product_name],
            ["Images", renderQuoteMediaSlot()],
            ["Design code", item.design_code],
            ["Metal", item.metal],
            ["Metal weight", formatGrams(item.metal_weight)],
            ["Metal weight adjustment", formatSignedGrams(item.metal_weight_adjustment)],
            ["Stone", item.stone],
            ["Stone weight", item.stone_weight],
            ["Diamond breakdown", item.diamond_breakdown],
            ["Size", item.size],
            ["Price", formatPrice(item.price)],
            ["Timeline", item.timeline],
            ["Timeline delay", formatDelayWeeks(item.timeline_adjustment_weeks)],
            ["Address", item.address_line1],
            ["City", item.city],
            ["State", item.state],
            ["Postal code", item.postal_code],
            ["Country", item.country],
            ["Interests", item.interests],
            ["Contact preference", item.contact_preference],
            ["Subscription", item.subscription_status],
            ["Notes", item.notes],
          ]
        : [
            ["Request ID", item.request_id],
            ["Created", formatDate(item.created_at)],
            ["Status", status],
            ["Name", item.name],
            ["Email", item.email],
            ["Phone", item.phone],
            ["Product", item.product_name],
            ["Product URL", item.product_url],
            ["Design code", item.design_code],
            ["Metal", item.metal],
            ["Metal weight", formatGrams(item.metal_weight)],
            ["Metal weight adjustment", formatSignedGrams(item.metal_weight_adjustment)],
            ["Stone", item.stone],
            ["Stone weight", item.stone_weight],
            ["Diamond breakdown", item.diamond_breakdown],
            ["Size", item.size],
            ["Price", formatPrice(item.price)],
            ["Timeline", item.timeline],
            ["Timeline delay", formatDelayWeeks(item.timeline_adjustment_weeks)],
            ["Address", item.address_line1],
            ["City", item.city],
            ["State", item.state],
            ["Postal code", item.postal_code],
            ["Country", item.country],
            ["Interests", item.interests],
            ["Contact preference", item.contact_preference],
            ["Subscription", item.subscription_status],
            ["Notes", item.notes],
          ];

    ui.detailGrid.innerHTML = detailFields
      .filter(([, value]) => hasValue(value))
      .map(([label, value]) => renderDetailField(label, value))
      .join("");
    refreshQuoteMedia(item);

    ui.editFields.forEach((field) => {
      const key = field.dataset.field;
      if (!key) return;
      if (key === "notes") {
        field.value = item.notes || "";
        return;
      }
      field.value = item[key] || "";
    });
    setQuoteMetalSelection(item.quote_metal_options || "");
    setDiamondBreakdownRowsFromField();
    resetQuoteAutoPricingState();
    scheduleQuotePricingUpdate();

    applyEditVisibility();
    applyOrderDetailsVisibility();
    applyQuoteVisibility();
    renderActions();
    updateActionButtonState();
    updatePrimaryActionState();
  }

  async function loadMe() {
    try {
      const data = await apiFetch("/me");
      state.role = data.role || "";
      state.email = data.email || "";
      if (ui.userRole) ui.userRole.textContent = state.role || "Unknown";
      if (ui.userEmail) ui.userEmail.textContent = state.email || "Not authorized";
    } catch (error) {
      showToast("Access denied. Check Access policy.", "error");
    }
  }

  async function loadRecord(requestId) {
    if (!requestId) {
      setSyncStatus("Missing request ID");
      if (ui.detailError) ui.detailError.textContent = "Missing request ID.";
      return;
    }
    setSyncStatus("Loading");
    try {
      const params = new URLSearchParams({ limit: "1", offset: "0" });
      if (state.tab === "contacts") {
        params.set("email", requestId);
      } else if (
        state.tab === "price-chart" ||
        state.tab === "cost-chart" ||
        state.tab === "diamond-price-chart"
      ) {
        params.set("row_number", requestId);
      } else {
        params.set("request_id", requestId);
      }
      const data = await apiFetch(`${getTabEndpoint(state.tab)}?${params.toString()}`);
      const item = (data.items || [])[0];
      if (!item) {
        setSyncStatus("Not found");
        if (ui.detailError) ui.detailError.textContent = "Record not found.";
        return;
      }
      populateDetail(item);
      await loadOrderDetails(item.request_id);
      setSyncStatus("Loaded");
    } catch (error) {
      setSyncStatus("Error");
      if (ui.detailError) ui.detailError.textContent = "Failed to load record.";
      showToast("Failed to load record.", "error");
    }
  }

  async function loadOrderDetails(requestId) {
    if (!requestId || state.tab !== "orders") {
      populateOrderDetails({});
      return;
    }
    try {
      const data = await apiFetch(`/orders/details?request_id=${encodeURIComponent(requestId)}`);
      populateOrderDetails(data.details || {});
    } catch (error) {
      populateOrderDetails({});
    }
  }

  async function runAction(action) {
    const recordId = getSelectedRecordId();
    if (!recordId) {
      showToast("Missing record ID", "error");
      return;
    }
    const details = state.tab === "orders" ? collectOrderDetailsUpdates() : {};
    if (state.tab === "orders" && action === "mark_shipped") {
      const missing = REQUIRED_SHIPPING_DETAILS_FIELDS.filter((field) => !details[field]);
      if (missing.length) {
        showToast("Add required fulfillment details before shipping.", "error");
        return;
      }
    }
    const payload = { action };
    if (
      state.tab === "price-chart" ||
      state.tab === "cost-chart" ||
      state.tab === "diamond-price-chart"
    ) {
      payload.rowNumber = recordId;
    } else {
      payload.requestId = recordId;
    }
    if (state.tab === "orders" && Object.keys(details).length) {
      payload.details = details;
    }
    if (state.tab === "quotes" && action === "submit_quote") {
      payload.fields = collectEditableUpdates();
    }
    const endpoint = getActionEndpoint();
    if (!endpoint) {
      showToast("No actions available.", "error");
      return;
    }
    const result = await apiFetch(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (result.ok) {
      showToast("Action saved");
      await loadRecord(state.selectedItem.request_id);
    } else {
      showToast("Action failed", "error");
    }
  }

  async function saveDetails() {
    const recordId = getSelectedRecordId();
    if (!recordId && !(state.isNewRow && PRICING_TABS.has(state.tab))) {
      showToast("Missing record ID", "error");
      return;
    }
    const fields = collectEditableUpdates();
    const notes = getNotesValue();
    if (PRICING_TABS.has(state.tab)) {
      fields.notes = notes;
    }
    const payload = {
      action: state.isNewRow && PRICING_TABS.has(state.tab) ? "add_row" : "edit",
      fields,
    };
    if (PRICING_TABS.has(state.tab) && !state.isNewRow) {
      payload.rowNumber = recordId;
    } else if (!PRICING_TABS.has(state.tab)) {
      payload.requestId = recordId;
      payload.notes = notes;
    }
    const endpoint = getActionEndpoint();
    if (!endpoint) {
      showToast("No edits allowed.", "error");
      return;
    }
    const result = await apiFetch(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (result.ok) {
      showToast("Updates saved");
      if (state.isNewRow && PRICING_TABS.has(state.tab)) {
        window.location.href = `/?tab=${encodeURIComponent(state.tab)}`;
      } else if (PRICING_TABS.has(state.tab)) {
        await loadRecord(recordId);
      } else {
        await loadRecord(state.selectedItem.request_id);
      }
    } else {
      showToast("Update failed", "error");
    }
  }

  async function saveNotes() {
    if (PRICING_TABS.has(state.tab)) {
      showToast("Use Save updates for pricing notes.", "error");
      return;
    }
    const recordId = getSelectedRecordId();
    if (!recordId) {
      showToast("Missing record ID", "error");
      return;
    }
    const notes = getNotesValue();
    const payload = { action: "edit", notes };
    if (
      state.tab === "price-chart" ||
      state.tab === "cost-chart" ||
      state.tab === "diamond-price-chart"
    ) {
      payload.rowNumber = recordId;
    } else {
      payload.requestId = recordId;
    }
    const endpoint = getActionEndpoint();
    if (!endpoint) {
      showToast("No edits allowed.", "error");
      return;
    }
    const result = await apiFetch(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (result.ok) {
      showToast("Notes saved");
      await loadRecord(state.selectedItem.request_id);
    } else {
      showToast("Notes failed", "error");
    }
  }

  async function saveOrderDetails() {
    if (!state.selectedItem || !state.selectedItem.request_id) {
      showToast("Missing request ID", "error");
      return;
    }
    const details = collectOrderDetailsUpdates();
    if (!Object.keys(details).length) {
      showToast("No fulfillment details to save.", "error");
      return;
    }
    const payload = {
      requestId: state.selectedItem.request_id,
      action: "edit",
      details,
    };
    const result = await apiFetch("/orders/action", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (result.ok) {
      showToast("Fulfillment details saved");
      await loadOrderDetails(state.selectedItem.request_id);
    } else {
      showToast("Fulfillment save failed", "error");
    }
  }

  async function prepareConfirmation() {
    if (!state.selectedItem || !state.selectedItem.request_id) {
      showToast("Missing request ID", "error");
      return;
    }
    const changes = collectConfirmChanges();
    if (!changes.length) {
      showToast("No order updates to confirm.", "error");
      return;
    }

    ui.confirmSend.disabled = true;
    try {
      const confirmResult = await apiFetch("/orders/confirm", {
        method: "POST",
        body: JSON.stringify({
          requestId: state.selectedItem.request_id,
          changes,
          email: state.selectedItem.email || "",
          name: state.selectedItem.name || "",
          productName: state.selectedItem.product_name || "",
        }),
      });
      const confirmationUrl = resolveConfirmationUrl(confirmResult);
      if (!confirmResult.ok || !confirmationUrl) {
        throw new Error("confirmation_failed");
      }
      const emailPayload = buildConfirmationEmail(
        state.selectedItem,
        changes,
        confirmationUrl
      );
      state.pendingChanges = changes;
      state.confirmation = {
        confirmationUrl,
        emailPayload,
        changes,
      };
      openConfirmModal({
        to: state.selectedItem.email || "--",
        subject: emailPayload.subject,
        previewHtml: emailPayload.previewHtml,
      });
    } catch (error) {
      showToast("Unable to build confirmation email.", "error");
    } finally {
      ui.confirmSend.disabled = false;
    }
  }

  async function sendConfirmation() {
    if (!state.selectedItem || !state.selectedItem.request_id) {
      showToast("Missing request ID", "error");
      return;
    }
    const changes = collectConfirmChanges();
    if (!changes.length) {
      showToast("No order updates to confirm.", "error");
      return;
    }
    const confirmation = state.confirmation;
    if (!confirmation || !confirmation.confirmationUrl) {
      showToast("Open the confirmation preview first.", "error");
      return;
    }
    const emailPayload = confirmation.emailPayload;
    if (!emailPayload) {
      showToast("Confirmation email is missing.", "error");
      return;
    }

    const fields = collectEditableUpdates();
    const notes = getNotesValue();
    const updatePayload = {
      requestId: state.selectedItem.request_id,
      action: "request_confirmation",
      status: "PENDING_CONFIRMATION",
      notes,
      fields,
    };
    const updateResult = await apiFetch("/orders/action", {
      method: "POST",
      body: JSON.stringify(updatePayload),
    });
    if (!updateResult.ok) {
      showToast("Update failed before email.", "error");
      return;
    }

    const sendResult = await apiFetch("/email", {
      method: "POST",
      body: JSON.stringify({
        to: state.selectedItem.email || "",
        subject: emailPayload.subject,
        textBody: emailPayload.textBody,
        htmlBody: emailPayload.htmlBody,
        requestId: state.selectedItem.request_id,
        orderStatus: "PENDING_CONFIRMATION",
      }),
    });

    if (sendResult.ok) {
      showToast("Confirmation sent");
      closeConfirmModal();
      await loadRecord(state.selectedItem.request_id);
    } else {
      showToast("Email failed", "error");
    }
  }

  function bindEvents() {
    if (ui.actionSelect) {
      ui.actionSelect.addEventListener("change", () => {
        updateActionButtonState();
      });
    }

    if (ui.actionRun) {
      ui.actionRun.addEventListener("click", () => {
        const action = ui.actionSelect ? ui.actionSelect.value : "";
        if (!action) return;
        const config = getActionConfig(action);
        if (config && config.confirm && !window.confirm(config.confirm)) return;
        runAction(action);
      });
    }
    if (ui.detailGrid) {
      ui.detailGrid.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const isPrev = target.closest("[data-carousel-prev]");
        const isNext = target.closest("[data-carousel-next]");
        if (!isPrev && !isNext) return;
        const carousel = target.closest("[data-media-carousel]");
        if (!carousel) return;
        const track = carousel.querySelector("[data-carousel-track]");
        if (!(track instanceof HTMLElement)) return;
        const delta = isPrev ? -1 : 1;
        track.scrollBy({ left: track.clientWidth * delta, behavior: "smooth" });
      });
    }

    ui.editFields.forEach((field) => {
      const handler = () => {
        const key = field.dataset.field || "";
        if (state.tab === "quotes" && key) {
          if (QUOTE_PRICE_FIELDS.has(key)) {
            if (field.value) {
              markQuotePriceManual(field);
            } else {
              field.dataset.manual = "";
              field.dataset.auto = "true";
              scheduleQuotePricingUpdate();
            }
          } else if (QUOTE_PRICING_FIELDS.has(key)) {
            scheduleQuotePricingUpdate();
          }
        }
        updatePrimaryActionState();
      };
      field.addEventListener("input", handler);
      field.addEventListener("change", handler);
    });
    ui.quoteMetals.forEach((input) => {
      input.addEventListener("change", () => {
        syncQuoteMetalInput();
        updatePrimaryActionState();
      });
    });

    if (ui.diamondBreakdownAdd) {
      ui.diamondBreakdownAdd.addEventListener("click", () => {
        const current = getDiamondRowsFromDom();
        current.push({ weight: "", count: "" });
        renderDiamondBreakdownRows(current);
        scheduleQuotePricingUpdate();
      });
    }

    if (ui.diamondBreakdownRows) {
      ui.diamondBreakdownRows.addEventListener("input", (event) => {
        if (!(event.target instanceof HTMLInputElement)) return;
        if (
          !event.target.hasAttribute("data-diamond-weight") &&
          !event.target.hasAttribute("data-diamond-count")
        ) {
          return;
        }
        syncDiamondBreakdownField();
        updatePrimaryActionState();
        scheduleQuotePricingUpdate();
      });
      ui.diamondBreakdownRows.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (!target.hasAttribute("data-diamond-remove")) return;
        const row = target.closest("[data-diamond-row]");
        if (row) row.remove();
        syncDiamondBreakdownField();
        updatePrimaryActionState();
        scheduleQuotePricingUpdate();
        if (!ui.diamondBreakdownRows.querySelector("[data-diamond-row]")) {
          renderDiamondBreakdownRows([]);
        }
      });
    }

    const diamondField = getDiamondBreakdownField();
    if (diamondField) {
      diamondField.addEventListener("input", () => {
        if (isSyncingBreakdown) return;
        setDiamondBreakdownRowsFromField();
        updatePrimaryActionState();
        scheduleQuotePricingUpdate();
      });
    }

    if (ui.primaryAction) {
      ui.primaryAction.addEventListener("click", () => {
        if (state.tab !== "orders") {
          if (window.confirm("Save updates to this record?")) saveDetails();
          return;
        }
        prepareConfirmation();
      });
    }

    if (ui.notesSave) {
      ui.notesSave.addEventListener("click", () => {
        if (window.confirm("Save internal notes?")) saveNotes();
      });
    }

    if (ui.detailsSave) {
      ui.detailsSave.addEventListener("click", () => {
        if (window.confirm("Save fulfillment details?")) saveOrderDetails();
      });
    }

    if (ui.confirmClose) {
      ui.confirmClose.addEventListener("click", closeConfirmModal);
    }

    if (ui.confirmModal) {
      ui.confirmModal.addEventListener("click", (event) => {
        if (event.target === ui.confirmModal) closeConfirmModal();
      });
    }

    if (ui.confirmSend) {
      ui.confirmSend.addEventListener("click", () => {
        if (window.confirm("Send confirmation to customer?")) sendConfirmation();
      });
    }
  }

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    const id = params.get("id");
    if (tab && STATUS_OPTIONS[tab]) {
      state.tab = tab;
    }
    if (ui.backLink) {
      ui.backLink.href = `/?tab=${encodeURIComponent(state.tab)}`;
    }
    bindEvents();
    await loadMe();
    if (id === "new" && PRICING_TABS.has(state.tab)) {
      state.isNewRow = true;
      populateDetail({});
      setSyncStatus("New row");
      return;
    }
    state.isNewRow = false;
    await loadRecord(id);
  }

  init();
})();
