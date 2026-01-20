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
    dirtySections: { edits: false, fulfillment: false },
    criticalDirty: false,
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
    quotes: ["NEW", "ACKNOWLEDGED", "QUOTED", "QUOTE_ACTIONED", "DROPPED"],
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
      { action: "refresh_quote", label: "Refresh quote link", confirm: "Send a refreshed quote link?" },
      { action: "mark_actioned", label: "Mark quote actioned", confirm: "Mark quote as actioned?" },
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
      "quote_discount_type",
      "quote_discount_percent",
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
    { key: "metal_weight", label: "Metal weight (g)", normalize: normalizeNumber, format: formatGrams },
    {
      key: "metal_weight_adjustment",
      label: "Final Metal weight difference (g)",
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
    "metal",
    "metal_weight",
    "stone_weight",
    "diamond_breakdown",
    "timeline",
    "timeline_adjustment_weeks",
    "quote_discount_type",
    "quote_discount_percent",
    ...QUOTE_OPTION_FIELDS.flatMap((option) => [option.clarity, option.color]),
  ]);

  const CRITICAL_EDIT_FIELDS = new Set([
    "price",
    "timeline",
    "timeline_adjustment_weeks",
    "metal",
    "metal_weight",
    "metal_weight_adjustment",
    "stone",
    "stone_weight",
  ]);

  const TRACKING_URL_TEMPLATES = {
    fedex: "https://www.fedex.com/apps/fedextrack/?tracknumbers=",
    ups: "https://www.ups.com/track?tracknum=",
    dhl: "https://www.dhl.com/en/express/tracking.html?AWB=",
    usps: "https://tools.usps.com/go/TrackConfirmAction?tLabels=",
  };

  const TRACKING_REQUIRED_STATUSES = new Set([
    "in transit",
    "out for delivery",
    "delivered",
    "picked up",
    "exception",
  ]);

  const DIAMOND_TERMS = ["diamond", "lab grown diamond"];
  const NOTE_CHECKLIST = [
    "Metal weight confirmed",
    "Diamond breakdown confirmed",
    "Customer confirmation sent",
    "Vendor assigned",
    "Tracking added",
  ];

  const ACTIVITY_LIMIT = 40;
  const activityEvents = [];

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
    metalWeightLabel: document.querySelector("[data-metal-weight-label]"),
    metalWeightAdjustmentLabel: document.querySelector("[data-metal-weight-adjustment-label]"),
    metalWeightFinal: document.querySelector("[data-metal-weight-final]"),
    metalWeightError: document.querySelector("[data-metal-weight-error]"),
    metalWeightAdjustmentError: document.querySelector("[data-metal-weight-adjustment-error]"),
    editFields: Array.from(document.querySelectorAll("[data-field]")),
    orderDetailsSection: document.querySelector("[data-order-details-section]"),
    orderDetailsFields: Array.from(document.querySelectorAll("[data-order-details-field]")),
    diamondBreakdown: document.querySelector("[data-diamond-breakdown]"),
    diamondBreakdownRows: document.querySelector("[data-diamond-breakdown-rows]"),
    diamondBreakdownAdd: document.querySelector("[data-diamond-breakdown-add]"),
    diamondPieceCount: document.querySelector("[data-diamond-piece-count]"),
    diamondCaratTotal: document.querySelector("[data-diamond-carat-total]"),
    detailsSave: document.querySelector("[data-details-save]"),
    primaryAction: document.querySelector("[data-primary-action]"),
    notesSave: document.querySelector("[data-notes-save]"),
    confirmModal: document.querySelector("[data-confirm-modal]"),
    confirmClose: document.querySelector("[data-confirm-close]"),
    confirmTo: document.querySelector("[data-confirm-to]"),
    confirmSubject: document.querySelector("[data-confirm-subject]"),
    confirmPreview: document.querySelector("[data-confirm-preview]"),
    confirmSend: document.querySelector("[data-confirm-send]"),
    dirtyIndicator: document.querySelector("[data-dirty-indicator]"),
    missingPanel: document.querySelector("[data-missing-panel]"),
    missingList: document.querySelector("[data-missing-list]"),
    activityFeed: document.querySelector("[data-activity-feed]"),
    summaryStatus: document.querySelector("[data-summary-status]"),
    summaryProduct: document.querySelector("[data-summary-product]"),
    summaryDesignCode: document.querySelector("[data-summary-design-code]"),
    summaryRequest: document.querySelector("[data-summary-request]"),
    summaryCreated: document.querySelector("[data-summary-created]"),
    summaryPrice: document.querySelector("[data-summary-price]"),
    summaryTimeline: document.querySelector("[data-summary-timeline]"),
    summaryTimelineDelay: document.querySelector("[data-summary-timeline-delay]"),
    summaryMetal: document.querySelector("[data-summary-metal]"),
    summaryStone: document.querySelector("[data-summary-stone]"),
    summaryStoneWeight: document.querySelector("[data-summary-stone-weight]"),
    summaryCustomer: document.querySelector("[data-summary-customer]"),
    summaryEmail: document.querySelector("[data-summary-email]"),
    summaryPhone: document.querySelector("[data-summary-phone]"),
    summaryAddress: document.querySelector("[data-summary-address]"),
    copyCustomer: document.querySelector("[data-copy-customer]"),
    copyEmail: document.querySelector("[data-copy-email]"),
    copyPhone: document.querySelector("[data-copy-phone]"),
    copyAddress: document.querySelector("[data-copy-address]"),
    copySummary: document.querySelector("[data-copy-summary]"),
    nextActionText: document.querySelector("[data-next-action-text]"),
    discountPanel: document.querySelector("[data-discount-panel]"),
    discountType: document.querySelector("[data-discount-type]"),
    discountPercent: document.querySelector("[data-discount-percent]"),
    discountFinal: document.querySelector("[data-discount-final]"),
    diamondPresets: document.querySelector("[data-diamond-presets]"),
    noteTimestamp: document.querySelector("[data-note-timestamp]"),
    noteTemplate: document.querySelector("[data-note-template]"),
    noteTags: Array.from(document.querySelectorAll("[data-note-tag]")),
    openTracking: document.querySelector("[data-open-tracking]"),
    toast: document.querySelector("[data-toast]"),
  };

  const storedBase = localStorage.getItem("adminApiBase") || "";
  const apiBase = storedBase || document.body.dataset.apiBase || "";
  const siteBase = (document.body.dataset.siteBase || "https://www.heerawalla.com").replace(/\/$/, "");
  let isSyncingBreakdown = false;
  let quotePricingTimer = null;
  let quotePricingInFlight = false;
  const catalogCache = { data: null, promise: null };
  const mediaCache = new Map();

  function setButtonEnabled(button, enabled) {
    if (!button) return;
    button.disabled = !enabled;
    button.classList.toggle("is-disabled", !enabled);
  }

  function scrollToField(selector) {
    if (!selector) return;
    const target = document.querySelector(selector);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    if (typeof target.focus === "function") {
      target.focus({ preventScroll: true });
    }
  }

  function trackDirty(sectionElement, handler) {
    if (!sectionElement || typeof handler !== "function") return;
    const fields = sectionElement.querySelectorAll("input,select,textarea");
    fields.forEach((field) => {
      const listener = () => handler(field);
      field.addEventListener("input", listener);
      field.addEventListener("change", listener);
    });
  }

  function copyToClipboard(text) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } catch (error) {
        // ignore
      }
      document.body.removeChild(textarea);
    }
  }

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

  function normalizeImageUrl(value) {
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

  function isFilled(value) {
    return value !== undefined && value !== null && String(value).trim() !== "";
  }

  function getSizingBlob(item) {
    const raw =
      item?.sizing ||
      item?.sizing_details ||
      item?.sizing_info ||
      item?.size_details ||
      item?.size_info;
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      } catch {
        return {};
      }
    }
    return {};
  }

  function getSizingValue(item, sizing, textSizing, keys) {
    for (const key of keys) {
      const itemValue = item ? item[key] : "";
      if (isFilled(itemValue)) return itemValue;
      const sizingValue = sizing ? sizing[key] : "";
      if (isFilled(sizingValue)) return sizingValue;
      const textValue = textSizing ? textSizing[key] : "";
      if (isFilled(textValue)) return textValue;
    }
    return "";
  }

  function getSizingText(item) {
    const parts = [
      item?.notes,
      item?.customer_notes,
      item?.request_notes,
      item?.size,
      item?.size_details,
      item?.sizeDetails,
      item?.body,
      item?.email_body,
      item?.email_text,
      item?.request_body,
      item?.quote_body,
      item?.summary,
      item?.summary_text,
      item?.details,
      item?.inquiry,
      item?.message,
    ];
    return parts.filter(isFilled).join("\n");
  }

  function parseSizingFromText(text) {
    if (!isFilled(text)) return {};
    const matchValue = (regex) => {
      const match = text.match(regex);
      return match && match[1] ? match[1].trim() : "";
    };
    return {
      ring: matchValue(/\bring(?:\s*size)?\s*:\s*([^|\n,;]+)/i),
      wrist: matchValue(/\b(?:wrist|bracelet)(?:\s*size)?\s*:\s*([^|\n,;]+)/i),
      neck: matchValue(/\b(?:neck|necklace|chain)(?:\s*(?:size|length))?\s*:\s*([^|\n,;]+)/i),
      earring: matchValue(/\bearrings?(?:\s*(?:style|type|size|preference))?\s*:\s*([^|\n,;]+)/i),
    };
  }

  function buildSizingRows(item) {
    const sizing = getSizingBlob(item);
    const rows = [];
    const textSizing = parseSizingFromText(getSizingText(item));
    const ringSize = getSizingValue(item, sizing, textSizing, ["ring_size", "ring", "ringSize"]);
    const wristSize = getSizingValue(item, sizing, textSizing, [
      "wrist_size",
      "wrist",
      "bracelet_size",
      "bracelet",
    ]);
    const neckSize = getSizingValue(item, sizing, textSizing, [
      "neck_size",
      "neck",
      "chain_size",
      "chain_length",
      "necklace_size",
      "necklace_length",
    ]);
    const earringStyle = getSizingValue(item, sizing, textSizing, [
      "earring_style",
      "earring_type",
      "earring",
      "earring_size",
    ]);
    if (isFilled(ringSize)) rows.push(["Ring size", ringSize]);
    if (isFilled(wristSize)) rows.push(["Wrist size", wristSize]);
    if (isFilled(neckSize)) rows.push(["Neck/chain size", neckSize]);
    if (isFilled(earringStyle)) rows.push(["Earring style", earringStyle]);
    if (!rows.length && isFilled(item?.size)) {
      rows.push(["Size", item.size]);
    }
    return rows;
  }

  function buildMetalWeightLabel(metalValue) {
    return "Metal weight (g)";
  }

  function buildMetalWeightAdjustmentLabel(metalValue) {
    return "Final Metal weight difference (g)";
  }

  function updateMetalWeightLabels(metalValue) {
    if (ui.metalWeightLabel) {
      ui.metalWeightLabel.textContent = buildMetalWeightLabel(metalValue);
    }
    if (ui.metalWeightAdjustmentLabel) {
      ui.metalWeightAdjustmentLabel.textContent = buildMetalWeightAdjustmentLabel(metalValue);
    }
  }

  function getRequestedMetalGroup(value) {
    const normalized = normalizeText(value);
    if (normalized.includes("platinum")) return "Platinum";
    if (normalized.includes("14k")) return "14K";
    if (normalized.includes("18k")) return "18K";
    return "";
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
      updateDiamondStats([]);
      return;
    }
    ui.diamondBreakdownRows.innerHTML = rows
      .map((row, index) => {
        const weight = String(row.weight || "").trim();
        const count = String(row.count || "").trim();
        const totalValue = Number(weight || 0) * Number(count || 0);
        const totalText = formatDiamondCarat(totalValue);
        return `
          <div class="diamond-row" data-diamond-row data-row-index="${index}">
            <label>
              <span>ct</span>
              <input type="text" data-diamond-weight placeholder="0.10" value="${escapeAttribute(
                weight
              )}" />
            </label>
            <label>
              <span>count</span>
              <input type="text" data-diamond-count placeholder="1" value="${escapeAttribute(
                count
              )}" />
            </label>
            <div class="diamond-total">
              <span>Total ct</span>
              <strong data-diamond-row-total>${totalText}</strong>
            </div>
            <button class="btn btn-ghost" type="button" data-diamond-remove>Remove</button>
          </div>`;
      })
      .join("");
    updateDiamondStats(rows);
  }

  function formatDiamondCarat(value) {
    if (!Number.isFinite(value)) return "--";
    const trimmed = value % 1 === 0 ? value.toFixed(0) : value.toFixed(2).replace(/\.?0+$/, "");
    return `${trimmed} ct`;
  }

  function updateDiamondStats(rows) {
    if (!ui.diamondPieceCount || !ui.diamondCaratTotal) return;
    const pieces = rows.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
    const carats = rows.reduce(
      (sum, item) => sum + (Number(item.weight) || 0) * (Number(item.count) || 0),
      0
    );
    ui.diamondPieceCount.textContent = pieces;
    ui.diamondCaratTotal.textContent = formatDiamondCarat(carats);
  }

  function updateDiamondRowTotals() {
    if (!ui.diamondBreakdownRows) return;
    const rows = Array.from(ui.diamondBreakdownRows.querySelectorAll("[data-diamond-row]"));
    rows.forEach((row) => {
      const weight = Number(row.querySelector("[data-diamond-weight]")?.value || 0);
      const count = Number(row.querySelector("[data-diamond-count]")?.value || 0);
      const totalValue = weight * count;
      const totalEl = row.querySelector("[data-diamond-row-total]");
      if (totalEl) {
        totalEl.textContent = formatDiamondCarat(totalValue);
      }
    });
  }

  function applyDiamondPreset(value) {
    if (!value) return;
    const match = value.match(/([0-9]*\.?[0-9]+)x([0-9]+)/i);
    if (!match) return;
    const rows = getDiamondRowsFromDom();
    rows.push({ weight: match[1], count: match[2] });
    renderDiamondBreakdownRows(rows);
    syncDiamondBreakdownField();
    if (ui.diamondPresets) ui.diamondPresets.value = "";
  }

  function setDiamondBreakdownRowsFromField() {
    const field = getDiamondBreakdownField();
    if (!field) return;
    const rows = parseDiamondBreakdownValue(field.value);
    renderDiamondBreakdownRows(rows);
  }

  function toggleDiamondBreakdownVisibility() {
    if (!ui.diamondBreakdown) return;
    const stoneValue = getEditValue("stone").toLowerCase();
    const hasDiamond = DIAMOND_TERMS.some((term) => stoneValue.includes(term));
    const shouldShow = state.tab === "quotes" && hasDiamond;
    ui.diamondBreakdown.classList.toggle("is-hidden", !shouldShow);
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
    const goldOnly = isGoldOnlyQuote();
    const hasOption = QUOTE_OPTION_FIELDS.some((option) => {
      return Boolean(getEditValue(option.clarity) || getEditValue(option.color));
    });
    if (!hasOption && !goldOnly) return null;
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

  function slugifyCategory(value) {
    return String(value || "uncategorized")
      .split("/")
      .map((part) => part.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "uncategorized")
      .filter(Boolean)
      .join("/");
  }

  function buildProductImageFallbacks(entry) {
    const categorySlug = slugifyCategory(entry.category || "uncategorized");
    const folder = `/images/products/${categorySlug}/${entry.id}`;
    const candidates = [
      "img-hero-1.png",
      "img-hero-1.jpeg",
      "img-hero-1.jpg",
      "img-hero-2.png",
      "img-hero-2.jpeg",
      "img-hero-2.jpg",
      "img-hero-03.jpeg",
      "img-1.png",
      "img-1.jpeg",
      "img-1.jpg",
      "image-1.svg",
    ].map((file) => `${folder}/${file}`);
    candidates.push(`/images/products/${categorySlug}/image-1.svg`);
    candidates.push("/images/products/placeholder.svg");
    return candidates;
  }

  function collectImageUrls(entry) {
    if (!entry) {
      return [normalizeImageUrl("/images/products/placeholder.svg")].filter(Boolean);
    }
    let candidates = [];
    if (entry.hero_image) candidates.push(entry.hero_image);
    if (entry.heroImage) candidates.push(entry.heroImage);
    if (Array.isArray(entry.images)) {
      entry.images.forEach((image) => candidates.push(image));
    }
    if (!candidates.length && entry.id && entry.category) {
      candidates = buildProductImageFallbacks(entry);
    }
    if (!candidates.length) {
      candidates = ["/images/products/placeholder.svg"];
    }
    return Array.from(new Set(candidates.map(normalizeImageUrl).filter(Boolean)));
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
    const fallback = escapeAttribute(normalizeImageUrl("/images/products/placeholder.svg"));
    if (images.length === 1) {
      const src = escapeAttribute(images[0]);
      return `<div class="media-frame"><img src="${src}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${fallback}';"></div>`;
    }
    const slides = images
      .map(
        (src) =>
          `<div class="media-slide"><img src="${escapeAttribute(src)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${fallback}';"></div>`
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
    if (state.tab !== "quotes" && state.tab !== "orders") return;
    if (!ui.detailGrid) return;
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

  function isGoldOnlyQuote() {
    if (state.tab !== "quotes") return false;
    const stoneWeightRaw = String(getEditValue("stone_weight") || "").trim();
    const diamondBreakdown = getEditValue("diamond_breakdown");
    const hasBreakdown = Boolean(String(diamondBreakdown || "").trim());
    if (hasBreakdown) return false;
    if (!stoneWeightRaw) return false;
    const stoneWeight = Number(stoneWeightRaw);
    return Number.isFinite(stoneWeight) && stoneWeight <= 0;
  }

  function toggleFieldVisibility(key, show) {
    const field = getEditField(key);
    if (!field) return;
    const wrapper = field.closest(".field");
    if (wrapper) wrapper.classList.toggle("is-hidden", !show);
  }

  function applyGoldOnlyQuoteState() {
    if (state.tab !== "quotes") return;
    const goldOnly = isGoldOnlyQuote();
    const optionCards = Array.from(document.querySelectorAll(".quote-option-card"));
    optionCards.forEach((card, index) => {
      if (index === 0) {
        card.classList.toggle("is-hidden", false);
      } else {
        card.classList.toggle("is-hidden", goldOnly);
      }
    });
    toggleFieldVisibility("quote_option_1_clarity", !goldOnly);
    toggleFieldVisibility("quote_option_1_color", !goldOnly);
  }

  function applyDiscountControlState() {
    if (state.tab !== "quotes") return;
    const type = normalizeText(getEditValue("quote_discount_type"));
    const percentField = getEditField("quote_discount_percent");
    if (!percentField) return;
    const isCustom = type === "custom";
    percentField.disabled = !isCustom;
    if (ui.discountPercent) {
      ui.discountPercent.disabled = !isCustom;
    }
  }

  function applyQuoteVisibility() {
    if (!ui.quoteSection) return;
    ui.quoteSection.classList.toggle("is-hidden", state.tab !== "quotes");
    toggleDiamondBreakdownVisibility();
    applyGoldOnlyQuoteState();
  }

  function syncQuoteMetalInput() {
    if (!ui.quoteMetalInput) return;
    const requestedMetal = getEditValue("metal");
    const group = getRequestedMetalGroup(requestedMetal);
    if (group) {
      setQuoteMetalSelection(group, requestedMetal);
      return;
    }
    const selected = ui.quoteMetals
      .filter((input) => input.checked)
      .map((input) => input.value);
    ui.quoteMetalInput.value = selected.join(", ");
  }

  function setQuoteMetalSelection(value, requestedMetal = "") {
    if (!ui.quoteMetalInput) return;
    const group = getRequestedMetalGroup(requestedMetal);
    const selected = String(value || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (group) {
      selected.length = 0;
      selected.push(group);
    } else if (!selected.length) {
      selected.push("18K");
    }
    ui.quoteMetalInput.value = selected.join(", ");
    ui.quoteMetals.forEach((input) => {
      input.checked = selected.includes(input.value);
      if (group) {
        input.disabled = input.value !== group;
      } else {
        input.disabled = false;
      }
    });
  }

  function getOrderDetailsValue(key) {
    const field = ui.orderDetailsFields.find((input) => input.dataset.orderDetailsField === key);
    return field ? field.value.trim() : "";
  }

  function getOrderDetailsField(key) {
    return ui.orderDetailsFields.find((input) => input.dataset.orderDetailsField === key);
  }

  function collectOrderDetailsUpdates() {
    const details = {};
    ORDER_DETAILS_FIELDS.forEach((key) => {
      const value = getOrderDetailsValue(key);
      if (value) details[key] = value;
    });
    return details;
  }

  function updateTrackingUrlAuto() {
    const carrier = getOrderDetailsValue("shipping_carrier").toLowerCase();
    const trackingNumber = getOrderDetailsValue("tracking_number");
    const urlField = getOrderDetailsField("tracking_url");
    if (!urlField) return;
    const template = TRACKING_URL_TEMPLATES[carrier];
    if (template && trackingNumber) {
      const generated = `${template}${encodeURIComponent(trackingNumber)}`;
      if (!urlField.value || urlField.dataset.autoGenerated === "true") {
        urlField.value = generated;
        urlField.dataset.autoGenerated = "true";
      }
    }
    if (!template || !trackingNumber) {
      if (urlField.dataset.autoGenerated === "true") {
        urlField.value = "";
      }
      urlField.dataset.autoGenerated = "";
    }
    setButtonEnabled(ui.openTracking, Boolean(urlField.value));
  }

  function handleFulfillmentFieldChange(field) {
    if (!field) return;
    if (field.dataset.orderDetailsField === "tracking_url") {
      field.dataset.autoGenerated = "";
    }
    updateTrackingUrlAuto();
    refreshMissingInfo();
    updateFulfillmentDirty();
  }

  function populateOrderDetails(details = {}) {
    state.orderDetails = details || {};
    ui.orderDetailsFields.forEach((field) => {
      const key = field.dataset.orderDetailsField;
      if (!key) return;
      const fallback = key === "shipping_method" ? "Express" : "";
      field.value = details[key] || fallback;
      field.dataset.activityValue = field.value;
    });
    updateFulfillmentDirty();
    updateTrackingUrlAuto();
  }

  function buildSummaryAddress(item) {
    const lines = [
      item.address_line1,
      item.address_line2,
      item.city,
      item.state,
      item.postal_code,
      item.country,
    ]
      .filter(Boolean)
      .join(", ");
    return lines || "--";
  }

  function updateSummaryCard(item) {
    if (!item) return;
    const status = normalizeStatus(item.status);
    if (ui.summaryStatus) {
      ui.summaryStatus.textContent = status;
      ui.summaryStatus.dataset.status = status;
    }
    if (ui.summaryProduct) ui.summaryProduct.textContent = item.product_name || "--";
    if (ui.summaryDesignCode) ui.summaryDesignCode.textContent = item.design_code || "--";
    if (ui.summaryRequest) ui.summaryRequest.textContent = item.request_id || "--";
    if (ui.summaryCreated) ui.summaryCreated.textContent = formatDate(item.created_at) || "--";
    if (ui.summaryPrice) ui.summaryPrice.textContent = formatPrice(item.price) || "--";
    if (ui.summaryTimeline) ui.summaryTimeline.textContent = formatTimelineValue(item.timeline) || "--";
    if (ui.summaryTimelineDelay) {
      const delayText = formatDelayWeeks(item.timeline_adjustment_weeks);
      ui.summaryTimelineDelay.textContent = delayText || "--";
    }
    if (ui.summaryMetal) ui.summaryMetal.textContent = item.metal || "--";
    if (ui.summaryStone) ui.summaryStone.textContent = item.stone || "--";
    if (ui.summaryStoneWeight) {
      ui.summaryStoneWeight.textContent = formatStoneWeight(item.stone_weight) || "--";
    }
    if (ui.summaryCustomer) ui.summaryCustomer.textContent = item.name || "--";
    if (ui.summaryEmail) ui.summaryEmail.textContent = item.email || "--";
    if (ui.summaryPhone) ui.summaryPhone.textContent = item.phone || "--";
    if (ui.summaryAddress) ui.summaryAddress.textContent = buildSummaryAddress(item);
  }

  function buildMissingChip(label, selector) {
    return `<button class="chip missing-chip" type="button" data-focus-target='${selector}'>${label}</button>`;
  }

  function refreshMissingInfo() {
    if (!ui.missingList) return;
    const chips = [];
    const metalWeight = getEditValue("metal_weight");
    if (!metalWeight) {
      chips.push(buildMissingChip("Metal weight missing", '[data-field="metal_weight"]'));
    }
    const stoneWeight = getEditValue("stone_weight");
    if (!stoneWeight) {
      chips.push(buildMissingChip("Stone weight missing", '[data-field="stone_weight"]'));
    }
    const stoneValue = getEditValue("stone").toLowerCase();
    const breakdownValue = getEditValue("diamond_breakdown");
    const isDiamond = DIAMOND_TERMS.some((term) => stoneValue.includes(term));
    if (isDiamond && !breakdownValue) {
      chips.push(buildMissingChip("Diamond breakdown empty", '[data-field="diamond_breakdown"]'));
    }
    const shippingStatus = getOrderDetailsValue("shipping_status").toLowerCase();
    const trackingNumber = getOrderDetailsValue("tracking_number");
    if (TRACKING_REQUIRED_STATUSES.has(shippingStatus) && !trackingNumber) {
      chips.push(
        buildMissingChip("Tracking # required for shipping", '[data-order-details-field="tracking_number"]')
      );
    }
    const etaValue = getOrderDetailsValue("delivery_eta");
    if (etaValue && !/^\d{4}-\d{2}-\d{2}$/.test(etaValue)) {
      chips.push(
        buildMissingChip("Delivery ETA needs YYYY-MM-DD", '[data-order-details-field="delivery_eta"]')
      );
    }
    ui.missingList.innerHTML = chips.length ? chips.join("") : '<span class="muted">No missing details.</span>';
    updateNextActionText();
  }

  function syncDiscountUiFromFields() {
    if (!ui.discountType || !ui.discountPercent) return;
    const typeField = getEditField("quote_discount_type");
    const percentField = getEditField("quote_discount_percent");
    if (typeField) {
      ui.discountType.value = typeField.value || "none";
    }
    if (percentField) {
      ui.discountPercent.value = percentField.value || "";
    }
  }

  function syncDiscountFieldsFromUi() {
    const typeField = getEditField("quote_discount_type");
    const percentField = getEditField("quote_discount_percent");
    if (typeField && ui.discountType) {
      typeField.value = ui.discountType.value;
    }
    if (percentField && ui.discountPercent) {
      percentField.value = ui.discountPercent.value.trim();
    }
  }

  function updateDiscountPreview() {
    if (!ui.discountFinal) return;
    const base = Number(getEditValue("price"));
    const percent = Number(ui.discountPercent?.value) || 0;
    if (ui.discountType && ui.discountPercent) {
      ui.discountPercent.disabled = ui.discountType.value !== "custom";
    }
    if (!base || Number.isNaN(base)) {
      ui.discountFinal.textContent = "--";
      syncDiscountFieldsFromUi();
      return;
    }
    const finalValue =
      percent && percent > 0 ? Math.max(0, base * (1 - percent / 100)) : base;
    ui.discountFinal.textContent = formatPrice(finalValue) || "--";
    syncDiscountFieldsFromUi();
  }

  function buildSummaryText(item) {
    if (!item) return "";
    const lines = [
      `Order: ${item.request_id || "--"}`,
      `Created: ${formatDate(item.created_at) || "--"}`,
      `Status: ${normalizeStatus(item.status)}`,
      `Product: ${item.product_name || "--"} (${item.design_code || "--"})`,
      `Specs: ${item.metal || "--"} / ${item.stone || "--"} ${formatStoneWeight(
        item.stone_weight
      )}`,
      `Price: ${formatPrice(item.price) || "--"}`,
      `Timeline: ${formatTimelineValue(item.timeline) || "--"} ${
        formatDelayWeeks(item.timeline_adjustment_weeks) || ""
      }`,
      `Customer: ${item.name || "--"} (${item.email || "--"} / ${item.phone || "--"})`,
      `Address: ${buildSummaryAddress(item)}`,
    ];
    return lines.filter(Boolean).join("\n");
  }

  function updateMetalWeightFinal() {
    if (!ui.metalWeightFinal) return;
    const weight = Number(getEditValue("metal_weight"));
    const adjustment = Number(getEditValue("metal_weight_adjustment"));
    const hasWeight = Number.isFinite(weight);
    const hasAdjustment = Number.isFinite(adjustment);
    if (!hasWeight && !hasAdjustment) {
      ui.metalWeightFinal.textContent = "--";
      return;
    }
    const finalValue = (hasWeight ? weight : 0) + (hasAdjustment ? adjustment : 0);
    ui.metalWeightFinal.textContent = `${finalValue.toFixed(2).replace(/\.?0+$/, "")} g`;
  }

  function validateMetalWeightInputs() {
    const weightField = getEditField("metal_weight");
    const adjustmentField = getEditField("metal_weight_adjustment");
    const weightError = ui.metalWeightError;
    const adjustmentError = ui.metalWeightAdjustmentError;
    const numberPattern = /^[+-]?\d+(\.\d+)?$/;
    const weightValue = weightField ? weightField.value.trim() : "";
    const adjustmentValue = adjustmentField ? adjustmentField.value.trim() : "";
    if (weightError) {
      weightError.textContent =
        weightValue && !numberPattern.test(weightValue) ? "Enter a valid weight" : "";
    }
    if (adjustmentError) {
      adjustmentError.textContent =
        adjustmentValue && !numberPattern.test(adjustmentValue)
          ? "Use + or - followed by a number"
          : "";
    }
  }

  function updateFulfillmentDirty() {
    if (!ui.detailsSave) return;
    const dirty = ORDER_DETAILS_FIELDS.some((key) => {
      return String(getOrderDetailsValue(key)) !== String(state.orderDetails[key] || "");
    });
    state.dirtySections.fulfillment = dirty;
    setButtonEnabled(ui.detailsSave, dirty && canEditCurrentTab());
    updateDirtyIndicator();
  }

  function evaluateCriticalDirty() {
    state.criticalDirty = CONFIRM_FIELDS.some((field) => {
      if (!CRITICAL_EDIT_FIELDS.has(field.key)) return false;
      const current = field.normalize(getEditValue(field.key));
      const original = state.originalValues[field.key] || "";
      return current !== original;
    });
  }

  function updateDirtyIndicator() {
    if (!ui.dirtyIndicator) return;
    const parts = [];
    if (state.dirtySections.edits) parts.push("Unsaved edits");
    if (state.dirtySections.fulfillment) parts.push("Unsaved fulfillment");
    const text = parts.length ? parts.join(" / ") : "All changes saved";
    ui.dirtyIndicator.textContent = text;
    ui.dirtyIndicator.classList.toggle("is-dirty", parts.length > 0);
    updateNextActionText();
  }

  function updateNextActionText() {
    if (!ui.nextActionText) return;
    const missingCount = ui.missingList
      ? ui.missingList.querySelectorAll(".missing-chip").length
      : 0;
    if (missingCount) {
      ui.nextActionText.textContent = `${missingCount} critical items need attention.`;
      return;
    }
    if (state.criticalDirty) {
      ui.nextActionText.textContent = "Critical edits pending. Save before actions.";
      return;
    }
    if (state.dirtySections.fulfillment) {
      ui.nextActionText.textContent = "Save fulfillment details to keep tracking current.";
      return;
    }
    if (state.dirtySections.edits) {
      ui.nextActionText.textContent = "Review edits and request confirmation.";
      return;
    }
    ui.nextActionText.textContent = "Review edits or choose an action.";
  }

  function getNotesField() {
    return getEditField("notes");
  }

  function insertIntoNotes(text) {
    const notes = getNotesField();
    if (!notes) return;
    const start = notes.selectionStart || 0;
    const end = notes.selectionEnd || 0;
    notes.value = `${notes.value.slice(0, start)}${text}${notes.value.slice(end)}`;
    const caret = start + text.length;
    notes.setSelectionRange(caret, caret);
    notes.focus();
  }

  function insertTimestampMarker() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const timestamp = `[${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
      now.getHours()
    )}:${pad(now.getMinutes())} CT] `;
    insertIntoNotes(timestamp);
  }

  function insertChecklistTemplate() {
    const checklist = NOTE_CHECKLIST.map((line) => `- ${line}`).join("\n");
    insertIntoNotes(`${checklist}\n`);
  }

  function handleCopyText(label, value) {
    if (!value) return;
    copyToClipboard(value);
    showToast(`${label} copied`);
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
      ui.actionRow.style.display = "";
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

  function renderDetailRows(rows) {
    return rows
      .filter(([, value]) => hasValue(value))
      .map(([label, value]) => renderDetailField(label, value))
      .join("");
  }

  function renderDetailSections(sections) {
    return sections
      .map((section) => {
        const rowsHtml = renderDetailRows(section.rows || []);
        if (!rowsHtml) return "";
        return `<div class="detail-section">
          <p class="detail-section-title">${escapeHtml(section.title)}</p>
          <div class="detail-grid">${rowsHtml}</div>
        </div>`;
      })
      .join("");
  }

  function formatActivityTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  }

  function renderActivityFeed() {
    if (!ui.activityFeed) return;
    if (!activityEvents.length) {
      ui.activityFeed.innerHTML = '<div class="activity-item muted">No activity yet.</div>';
      return;
    }
    const sorted = [...activityEvents]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, ACTIVITY_LIMIT);
    ui.activityFeed.innerHTML = sorted
      .map((event) => {
        const detail = event.detail
          ? `<p class="activity-detail">${escapeHtml(event.detail)}</p>`
          : "";
        return `<div class="activity-item activity-${event.type || "system"}">
          <div class="activity-meta">
            <span class="activity-time">${formatActivityTime(event.time)}</span>
            <strong class="activity-title">${escapeHtml(event.title || "Updated")}</strong>
          </div>
          ${detail}
        </div>`;
      })
      .join("");
  }

  function addActivityEvent(event) {
    const timestamp = event.time ? new Date(event.time) : new Date();
    const normalized = {
      ...event,
      time: Number.isNaN(timestamp.getTime()) ? new Date().toISOString() : timestamp.toISOString(),
    };
    activityEvents.unshift(normalized);
    if (activityEvents.length > ACTIVITY_LIMIT) {
      activityEvents.pop();
    }
    renderActivityFeed();
  }

  function initActivityStream(item) {
    activityEvents.length = 0;
    if (!item) {
      renderActivityFeed();
      return;
    }
    if (item.created_at) {
      addActivityEvent({
        time: item.created_at,
        type: "system",
        title: "Order created",
        detail: `Status: ${normalizeStatus(item.status)}`,
      });
    }
    if (item.status) {
      addActivityEvent({
        time: new Date().toISOString(),
        type: "status",
        title: `Current status: ${normalizeStatus(item.status)}`,
      });
    }
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
      state.dirtySections.edits = hasChanges;
      updateDirtyIndicator();
      return;
    }

    ui.primaryAction.textContent = "Get Customer Confirmation";
    const changes = collectConfirmChanges();
    state.pendingChanges = changes;
    ui.primaryAction.disabled = !canEdit || changes.length === 0;
    state.dirtySections.edits = changes.length > 0 || notesChanged;
    updateDirtyIndicator();
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

  let lastFocusedConfirm = null;

  function focusFirstConfirmElement() {
    if (!ui.confirmModal) return;
    const target =
      ui.confirmClose ||
      ui.confirmModal.querySelector(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
    if (target && typeof target.focus === "function") {
      target.focus();
    }
  }

  function openConfirmModal(emailPayload) {
    if (!ui.confirmModal) return;
    lastFocusedConfirm = document.activeElement;
    ui.confirmTo.textContent = emailPayload.to;
    ui.confirmSubject.textContent = emailPayload.subject;
    ui.confirmPreview.innerHTML = emailPayload.previewHtml;
    ui.confirmModal.classList.add("is-open");
    ui.confirmModal.removeAttribute("inert");
    ui.confirmModal.setAttribute("aria-hidden", "false");
    requestAnimationFrame(focusFirstConfirmElement);
  }

  function closeConfirmModal() {
    if (!ui.confirmModal) return;
    if (ui.confirmModal.contains(document.activeElement)) {
      if (lastFocusedConfirm && typeof lastFocusedConfirm.focus === "function") {
        lastFocusedConfirm.focus();
      } else {
        document.body.focus?.();
      }
    }
    ui.confirmModal.classList.remove("is-open");
    ui.confirmModal.setAttribute("aria-hidden", "true");
    ui.confirmModal.setAttribute("inert", "");
  }

  function populateDetail(item) {
    const requestId = state.isNewRow ? "New row" : item.request_id || item.email || "Record";
    const status = item.status || "NEW";
    state.selectedId = requestId;
    state.selectedItem = item;
    setOriginalValues(item);
    state.dirtySections = { edits: false, fulfillment: false };
    state.criticalDirty = false;
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
        : state.tab === "tickets"
        ? [
            ["Request ID", item.request_id],
            ["Created", formatDate(item.created_at)],
            ["Status", status],
            ["Name", item.name],
            ["Email", item.email],
            ["Phone", item.phone],
            ["Interests", item.interests],
            ["Contact preference", item.contact_preference],
            ["Customer notes", item.notes],
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
        : [];

    const detailSections =
      state.tab === "quotes"
        ? [
            {
              title: "Request",
              rows: [
                ["Request ID", item.request_id],
                ["Created", formatDate(item.created_at)],
                ["Status", status],
              ],
            },
            {
              title: "Client",
              rows: [
                ["Name", item.name],
                ["Email", item.email],
                ["Phone", item.phone],
              ],
            },
            {
              title: "Piece",
              rows: [
                ["Product", item.product_name],
                ["Images", renderQuoteMediaSlot()],
                ["Design code", item.design_code],
                ["Metal", item.metal],
                [buildMetalWeightLabel(item.metal), formatGrams(item.metal_weight)],
                [buildMetalWeightAdjustmentLabel(item.metal), formatSignedGrams(item.metal_weight_adjustment)],
                ["Stone", item.stone],
                ["Stone weight", item.stone_weight],
                ["Diamond breakdown", item.diamond_breakdown],
                ...buildSizingRows(item),
              ],
            },
            {
              title: "Quote",
              rows: [
                ["Price", formatPrice(item.price)],
                ["Timeline", item.timeline],
                ["Timeline delay", formatDelayWeeks(item.timeline_adjustment_weeks)],
                ["Discount type", item.quote_discount_type],
                ["Discount percent", item.quote_discount_percent],
              ],
            },
            {
              title: "Address",
              rows: [
                ["Address", item.address_line1],
                ["City", item.city],
                ["State", item.state],
                ["Postal code", item.postal_code],
                ["Country", item.country],
              ],
            },
            {
              title: "Preferences",
              rows: [
                ["Interests", item.interests],
                ["Contact preference", item.contact_preference],
                ["Subscription", item.subscription_status],
              ],
            },
          ]
        : state.tab === "orders"
        ? [
            {
              title: "Request",
              rows: [
                ["Request ID", item.request_id],
                ["Created", formatDate(item.created_at)],
                ["Status", status],
              ],
            },
            {
              title: "Client",
              rows: [
                ["Name", item.name],
                ["Email", item.email],
                ["Phone", item.phone],
              ],
            },
            {
              title: "Piece",
              rows: [
                ["Product", item.product_name],
                ["Images", renderQuoteMediaSlot()],
                ["Design code", item.design_code],
                ["Metal", item.metal],
                [buildMetalWeightLabel(item.metal), formatGrams(item.metal_weight)],
                [buildMetalWeightAdjustmentLabel(item.metal), formatSignedGrams(item.metal_weight_adjustment)],
                ["Stone", item.stone],
                ["Stone weight", item.stone_weight],
                ["Diamond breakdown", item.diamond_breakdown],
                ...buildSizingRows(item),
              ],
            },
            {
              title: "Timeline & Pricing",
              rows: [
                ["Price", formatPrice(item.price)],
                ["Timeline", item.timeline],
                ["Timeline delay", formatDelayWeeks(item.timeline_adjustment_weeks)],
              ],
            },
            {
              title: "Address",
              rows: [
                ["Address", item.address_line1],
                ["City", item.city],
                ["State", item.state],
                ["Postal code", item.postal_code],
                ["Country", item.country],
              ],
            },
            {
              title: "Preferences",
              rows: [
                ["Interests", item.interests],
                ["Contact preference", item.contact_preference],
                ["Subscription", item.subscription_status],
              ],
            },
          ]
        : [];

    if (detailSections.length) {
      ui.detailGrid.classList.add("detail-sections");
      ui.detailGrid.innerHTML = renderDetailSections(detailSections);
    } else {
      ui.detailGrid.classList.remove("detail-sections");
      ui.detailGrid.innerHTML = renderDetailRows(detailFields);
    }
    refreshQuoteMedia(item);

    ui.editFields.forEach((field) => {
      const key = field.dataset.field;
      if (!key) return;
      if (key === "notes") {
        field.value = item.notes || "";
        field.dataset.activityValue = field.value;
        return;
      }
      field.value = item[key] || "";
      field.dataset.activityValue = field.value;
    });
    updateMetalWeightLabels(item.metal || "");
    setQuoteMetalSelection(item.quote_metal_options || "", item.metal || "");
    setDiamondBreakdownRowsFromField();
    resetQuoteAutoPricingState();
    scheduleQuotePricingUpdate();

    applyEditVisibility();
    applyOrderDetailsVisibility();
    applyQuoteVisibility();
    applyDiscountControlState();
    applyGoldOnlyQuoteState();
    renderActions();
    updateActionButtonState();
    updatePrimaryActionState();
    updateSummaryCard(item);
    refreshMissingInfo();
    initActivityStream(item);
    syncDiscountUiFromFields();
    updateDiscountPreview();
    updateMetalWeightFinal();
    validateMetalWeightInputs();
    updateFulfillmentDirty();
    updateDirtyIndicator();
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

  async function saveQuoteBeforeRefresh(recordId) {
    if (state.tab !== "quotes") return true;
    const fields = collectEditableUpdates();
    const notes = getNotesValue();
    if (!Object.keys(fields).length && !notes) return true;
    const endpoint = getActionEndpoint();
    if (!endpoint) {
      showToast("No edits allowed.", "error");
      return false;
    }
    const result = await apiFetch(endpoint, {
      method: "POST",
      body: JSON.stringify({ action: "edit", requestId: recordId, fields, notes }),
    });
    if (!result.ok) {
      showToast("Save failed", "error");
      return false;
    }
    return true;
  }

  async function runAction(action) {
    const recordId = getSelectedRecordId();
    if (!recordId) {
      showToast("Missing record ID", "error");
      return;
    }
    if (state.tab === "quotes" && action === "refresh_quote") {
      const saved = await saveQuoteBeforeRefresh(recordId);
      if (!saved) return;
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
    let notes = getNotesValue();
    if (state.tab === "orders" && ui.discountType) {
      const typeValue = ui.discountType.value || "none";
      const percentValue = ui.discountPercent?.value?.trim() || "";
      if (typeValue !== "none") {
        const line = `DISCOUNT: ${typeValue}${percentValue ? ` ${percentValue}%` : ""} (internal)`;
        if (!notes.includes(line)) {
          notes = notes ? `${notes}\n${line}` : line;
          const notesField = getEditField("notes");
          if (notesField) notesField.value = notes;
        }
      }
    }
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
      addActivityEvent({
        type: "notes",
        title: "Internal notes saved",
        detail: "Updated internal notes",
      });
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
      addActivityEvent({
        type: "fulfillment",
        title: "Fulfillment details saved",
        detail: `${details.shipping_carrier || "Carrier"} / ${details.tracking_number || "No tracking"}`,
      });
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
        if (state.criticalDirty && !window.confirm("Proceed without saving critical edits?")) return;
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
      const handler = (event) => {
        const key = field.dataset.field || "";
        if (key === "metal") {
          updateMetalWeightLabels(field.value);
          setQuoteMetalSelection(ui.quoteMetalInput ? ui.quoteMetalInput.value : "", field.value);
        }
        if (key === "quote_discount_type" || key === "quote_discount_percent") {
          applyDiscountControlState();
        }
        if (key === "stone_weight" || key === "diamond_breakdown") {
          applyGoldOnlyQuoteState();
        }
        if (key === "stone") {
          toggleDiamondBreakdownVisibility();
        }
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
        if (key === "metal_weight" || key === "metal_weight_adjustment") {
          updateMetalWeightFinal();
          validateMetalWeightInputs();
        }
        if (["price", "quote_discount_type", "quote_discount_percent"].includes(key)) {
          updateDiscountPreview();
        }
        if (state.selectedItem && key) {
          state.selectedItem[key] = field.value;
          updateSummaryCard(state.selectedItem);
        }
        if (event.type === "change" && key) {
          const prevValue = field.dataset.activityValue || "";
          const newValue = field.value.trim();
          if (prevValue !== newValue) {
            const labelText =
              field
                .closest(".field")
                ?.querySelector("span")?.textContent?.trim() || key;
            addActivityEvent({
              type: "edit",
              title: `${labelText} updated`,
              detail: `${prevValue || "--"} -> ${newValue || "--"}`,
            });
            field.dataset.activityValue = newValue;
          }
        }
        evaluateCriticalDirty();
        refreshMissingInfo();
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
        updateDiamondStats(getDiamondRowsFromDom());
        updateDiamondRowTotals();
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
        updateDiamondStats(getDiamondRowsFromDom());
        updateDiamondRowTotals();
        updatePrimaryActionState();
        scheduleQuotePricingUpdate();
        if (!ui.diamondBreakdownRows.querySelector("[data-diamond-row]")) {
          renderDiamondBreakdownRows([]);
        }
      });
    }

    if (ui.missingList) {
      ui.missingList.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const selector = target.dataset.focusTarget;
        if (selector) scrollToField(selector);
      });
    }

    if (ui.diamondPresets) {
      ui.diamondPresets.addEventListener("change", () => {
        applyDiamondPreset(ui.diamondPresets.value);
        scheduleQuotePricingUpdate();
        updatePrimaryActionState();
      });
    }

    if (ui.discountType) {
      ui.discountType.addEventListener("change", () => {
        updateDiscountPreview();
        updatePrimaryActionState();
      });
    }
    if (ui.discountPercent) {
      ui.discountPercent.addEventListener("input", () => {
        updateDiscountPreview();
        updatePrimaryActionState();
      });
    }

    ui.orderDetailsFields.forEach((field) => {
      ["input", "change"].forEach((eventName) => {
        field.addEventListener(eventName, (event) => {
          handleFulfillmentFieldChange(field);
          if (event.type === "change") {
            const prevValue = field.dataset.activityValue || "";
            const newValue = field.value.trim();
            if (prevValue !== newValue) {
              const labelText =
                field
                  .closest(".field")
                  ?.querySelector("span")?.textContent?.trim() ||
                field.dataset.orderDetailsField ||
                "Fulfillment update";
              addActivityEvent({
                type: "edit",
                title: `${labelText} updated`,
                detail: `${prevValue || "--"} -> ${newValue || "--"}`,
              });
              field.dataset.activityValue = newValue;
            }
          }
        });
      });
    });

    trackDirty(ui.orderDetailsSection, () => {
      refreshMissingInfo();
      updateFulfillmentDirty();
    });

    if (ui.openTracking) {
      ui.openTracking.addEventListener("click", () => {
        const urlValue = getOrderDetailsValue("tracking_url");
        if (urlValue) {
          window.open(urlValue, "_blank");
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
        if (state.criticalDirty && !window.confirm("Proceed without saving critical edits?")) return;
        prepareConfirmation();
      });
    }

    if (ui.notesSave) {
      ui.notesSave.addEventListener("click", () => {
        if (window.confirm("Save internal notes?")) saveNotes();
      });
    }

    if (ui.noteTimestamp) {
      ui.noteTimestamp.addEventListener("click", () => {
        insertTimestampMarker();
        updatePrimaryActionState();
      });
    }
    if (ui.noteTemplate) {
      ui.noteTemplate.addEventListener("click", () => {
        insertChecklistTemplate();
        updatePrimaryActionState();
      });
    }
    ui.noteTags.forEach((tag) => {
      tag.addEventListener("click", () => {
        insertIntoNotes(`${tag.dataset.noteTag} `);
        updatePrimaryActionState();
      });
    });
    if (ui.copyCustomer) {
      ui.copyCustomer.addEventListener("click", () =>
        handleCopyText("Customer name", ui.summaryCustomer?.textContent?.trim())
      );
    }
    if (ui.copyEmail) {
      ui.copyEmail.addEventListener("click", () =>
        handleCopyText("Email", ui.summaryEmail?.textContent?.trim())
      );
    }
    if (ui.copyPhone) {
      ui.copyPhone.addEventListener("click", () =>
        handleCopyText("Phone", ui.summaryPhone?.textContent?.trim())
      );
    }
    if (ui.copyAddress) {
      ui.copyAddress.addEventListener("click", () =>
        handleCopyText("Address", ui.summaryAddress?.textContent?.trim())
      );
    }
    if (ui.copySummary) {
      ui.copySummary.addEventListener("click", () => {
        const summary = buildSummaryText(state.selectedItem);
        handleCopyText("Order summary", summary);
      });
    }

    if (ui.detailsSave) {
      ui.detailsSave.addEventListener("click", () => {
        if (window.confirm("Save fulfillment details?")) saveOrderDetails();
      });
    }

    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        const active = document.activeElement;
        if (active && active.closest("[data-order-details-section]")) {
          saveOrderDetails();
        } else {
          saveNotes();
        }
      }
    });

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
        if (state.criticalDirty && !window.confirm("Proceed without saving critical edits?")) return;
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

