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
    catalogHeaders: [],
    catalogEnums: null,
    catalogFormState: null,
    catalogOriginalFields: null,
    catalogMediaState: null,
    catalogStoneOptions: null,
    catalogMetalOptions: null,
    catalogNotes: null,
    catalogValidation: null,
    mediaLibraryItems: [],
    sizingSpec: null,
    recommendedOptionIndex: null,
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
    products: [],
    inspirations: [],
    "media-library": [],
    "price-chart": [],
    "cost-chart": [],
    "diamond-price-chart": [],
  };

  const ACTIONS = {
    orders: [
      {
        action: "acknowledge",
        label: "Acknowledge",
        confirm: "Mark as acknowledged?",
      },
      {
        action: "send_invoice",
        label: "Send invoice",
        confirm: "Send invoice and mark invoiced?",
      },
      {
        action: "mark_paid",
        label: "Mark paid",
        confirm: "Confirm payment received?",
      },
      {
        action: "mark_invoice_expired",
        label: "Mark invoice expired",
        confirm: "Mark invoice as expired?",
      },
      {
        action: "mark_processing",
        label: "Mark processing",
        confirm: "Move order into processing?",
      },
      {
        action: "mark_shipped",
        label: "Mark shipped",
        confirm: "Mark as shipped?",
      },
      {
        action: "mark_delivered",
        label: "Mark delivered",
        confirm: "Mark as delivered?",
      },
      {
        action: "cancel",
        label: "Cancel order",
        confirm: "Cancel this order?",
      },
      {
        action: "delete",
        label: "Delete",
        confirm: "Delete this order? This cannot be undone.",
      },
    ],
    quotes: [
      {
        action: "acknowledge",
        label: "Acknowledge",
        confirm: "Mark as acknowledged?",
      },
      {
        action: "submit_quote",
        label: "Send quote link",
        confirm: "Send quote link to customer?",
      },
      {
        action: "refresh_quote",
        label: "Refresh quote link",
        confirm: "Send a refreshed quote link?",
      },
      {
        action: "mark_actioned",
        label: "Mark quote actioned",
        confirm: "Mark quote as actioned?",
      },
      { action: "drop", label: "Drop", confirm: "Drop this quote?" },
      {
        action: "delete",
        label: "Delete",
        confirm: "Delete this quote? This cannot be undone.",
      },
    ],
    tickets: [
      {
        action: "mark_pending",
        label: "Mark pending",
        confirm: "Mark as pending?",
      },
      {
        action: "mark_resolved",
        label: "Mark resolved",
        confirm: "Mark as resolved?",
      },
      {
        action: "send_email",
        label: "Send email",
        confirm: "Send an email to this customer?",
      },
      {
        action: "delete",
        label: "Delete",
        confirm: "Delete this ticket? This cannot be undone.",
      },
    ],
    contacts: [],
    products: [
      {
        action: "delete",
        label: "Delete",
        confirm: "Delete this product? This cannot be undone.",
      },
    ],
    inspirations: [],
    "media-library": [],
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
      "timeline",
      "timeline_adjustment_weeks",
      "metal",
      "metal_weight",
      "stone",
      "stone_weight",
      "diamond_breakdown",
      "size",
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
    products: [],
    inspirations: [],
    "media-library": [],
    "price-chart": ["metal", "adjustment_type", "adjustment_value", "notes"],
    "cost-chart": ["key", "value", "unit", "notes"],
    "diamond-price-chart": [
      "clarity",
      "color",
      "weight_min",
      "weight_max",
      "price_per_ct",
      "notes",
    ],
  };

  const CONFIRM_FIELDS = [
    {
      key: "price",
      label: "Price",
      normalize: normalizePrice,
      format: formatPrice,
    },
    {
      key: "timeline",
      label: "Timeline",
      normalize: normalizeTimelineValue,
      format: formatTimelineValue,
    },
    {
      key: "timeline_adjustment_weeks",
      label: "Timeline delay",
      normalize: normalizeNumber,
      format: formatDelayWeeks,
    },
    {
      key: "metal",
      label: "Metal",
      normalize: normalizeText,
      format: formatPlain,
    },
    {
      key: "metal_weight",
      label: "Metal weight (g)",
      normalize: normalizeNumber,
      format: formatGrams,
    },
    {
      key: "metal_weight_adjustment",
      label: "Final Metal weight difference (g)",
      normalize: normalizeNumber,
      format: formatSignedGrams,
    },
    {
      key: "stone",
      label: "Stone type",
      normalize: normalizeText,
      format: formatPlain,
    },
    {
      key: "stone_weight",
      label: "Stone weight",
      normalize: normalizeNumber,
      format: formatStoneWeight,
    },
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
    products: "Product",
    inspirations: "Inspiration",
    "media-library": "Media library",
    "price-chart": "Price chart",
    "cost-chart": "Cost chart",
    "diamond-price-chart": "Diamond price chart",
  };

  const PRICING_TABS = new Set([
    "price-chart",
    "cost-chart",
    "diamond-price-chart",
  ]);
  const CATALOG_TABS = new Set(["products", "inspirations", "media-library"]);
  const CATALOG_ITEM_TABS = new Set(["products", "inspirations"]);
  const CATALOG_DEFAULT_TAB = "basics";
  const QUOTE_OPTION_FIELDS = [
    {
      clarity: "quote_option_1_clarity",
      color: "quote_option_1_color",
      price: "quote_option_1_price_18k",
    },
    {
      clarity: "quote_option_2_clarity",
      color: "quote_option_2_color",
      price: "quote_option_2_price_18k",
    },
    {
      clarity: "quote_option_3_clarity",
      color: "quote_option_3_color",
      price: "quote_option_3_price_18k",
    },
  ];
  const QUOTE_PRICE_FIELDS = new Set(
    QUOTE_OPTION_FIELDS.map((option) => option.price),
  );
  const QUOTE_BASE_PRICING_FIELDS = new Set([
    "metal",
    "metal_weight",
    "stone",
    "stone_weight",
    "diamond_breakdown",
    "timeline",
    "timeline_adjustment_weeks",
    "quote_discount_type",
    "quote_discount_percent",
    "size",
    "size_label",
    "size_ring",
    "size_bracelet",
    "size_chain",
  ]);
  const QUOTE_OPTION_FIELD_INDEX = new Map();
  QUOTE_OPTION_FIELDS.forEach((option, index) => {
    QUOTE_OPTION_FIELD_INDEX.set(option.clarity, index);
    QUOTE_OPTION_FIELD_INDEX.set(option.color, index);
    QUOTE_OPTION_FIELD_INDEX.set(option.price, index);
  });
  const PRICING_PAYLOAD_KEYS = [
    "metal",
    "metal_weight",
    "stone",
    "stone_weight",
    "diamond_breakdown",
    "diamond_breakdown_components",
    "timeline",
    "timeline_adjustment_weeks",
    "quote_discount_type",
    "quote_discount_percent",
    "size",
    "size_label",
    "size_ring",
    "size_bracelet",
    "size_chain",
    "clarity",
    "color",
  ];

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
  const DEFAULT_STONE_ROLES = [
    { value: "center", label: "Center" },
    { value: "accent", label: "Accent" },
    { value: "side", label: "Side" },
    { value: "halo", label: "Halo" },
  ];
  const DEFAULT_SIZE_TYPES = [
    { value: "xsmall", label: "X-Small" },
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
    { value: "xlarge", label: "X-Large" },
    { value: "xxlarge", label: "XX-Large" },
  ];
  const DEFAULT_STONE_SHAPES = [
    { value: "round", label: "Round" },
    { value: "pear", label: "Pear" },
    { value: "oval", label: "Oval" },
    { value: "marquise", label: "Marquise" },
    { value: "princess", label: "Princess" },
    { value: "emerald", label: "Emerald" },
    { value: "radiant", label: "Radiant" },
    { value: "cushion", label: "Cushion" },
    { value: "heart", label: "Heart" },
    { value: "asscher", label: "Asscher" },
    { value: "baguette", label: "Baguette" },
  ];
  const NOTE_KINDS_SINGLE = ["description", "long_desc"];
  const NOTE_KINDS_LIST = ["takeaway", "translation_note"];
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
    const normalized = String(value || "NEW")
      .trim()
      .toUpperCase();
    return normalized === "INVOICE_NOT_PAID"
      ? "INVOICE_EXPIRED"
      : normalized || "NEW";
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
      return state.role === "admin" || state.role === "ops";
    }
    if (
      state.tab === "price-chart" ||
      state.tab === "cost-chart" ||
      state.tab === "diamond-price-chart"
    ) {
      return state.role === "admin";
    }
    if (CATALOG_TABS.has(state.tab)) {
      return state.role === "admin" || state.role === "ops";
    }
    return false;
  }

  const ui = {
    syncLine: document.querySelector("[data-sync-line]"),
    userRole: document.querySelector("[data-user-role]"),
    userEmail: document.querySelector("[data-user-email]"),
    backLink: document.querySelector("[data-back-link]"),
    detailHeader: document.querySelector("[data-detail-header]"),
    detailType: document.querySelector("[data-detail-type]"),
    detailTitle: document.querySelector("[data-detail-title]"),
    detailSub: document.querySelector("[data-detail-sub]"),
    detailError: document.querySelector("[data-detail-error]"),
    detailStatusCorner: document.querySelector("[data-detail-status-corner]"),
    detailGrid: document.querySelector("[data-detail-grid]"),
    overviewSection: document.querySelector("[data-overview-section]"),
    catalogSection: document.querySelector("[data-catalog-section]"),
    catalogTitle: document.querySelector("[data-catalog-title]"),
    catalogTabs: Array.from(document.querySelectorAll("[data-catalog-tab]")),
    catalogPanels: Array.from(
      document.querySelectorAll("[data-catalog-panel]"),
    ),
    catalogFields: document.querySelector("[data-catalog-fields]"),
    catalogFieldsBasic: document.querySelector("[data-catalog-fields-basic]"),
    catalogFieldsTaxonomy: document.querySelector(
      "[data-catalog-fields-taxonomy]",
    ),
    catalogFieldsMaterials: document.querySelector(
      "[data-catalog-fields-materials]",
    ),
    catalogFieldsAudit: document.querySelector("[data-catalog-fields-audit]"),
    catalogMediaSection: document.querySelector("[data-catalog-media-section]"),
    catalogMediaList: document.querySelector("[data-catalog-media-list]"),
    mediaFile: document.querySelector("[data-media-file]"),
    mediaLabel: document.querySelector("[data-media-label]"),
    mediaAlt: document.querySelector("[data-media-alt]"),
    mediaDescription: document.querySelector("[data-media-description]"),
    mediaPosition: document.querySelector("[data-media-position]"),
    mediaOrder: document.querySelector("[data-media-order]"),
    mediaPrimary: document.querySelector("[data-media-primary]"),
    mediaUpload: document.querySelector("[data-media-upload]"),
    mediaId: document.querySelector("[data-media-id]"),
    mediaPreview: document.querySelector("[data-media-preview]"),
    mediaPositionExisting: document.querySelector(
      "[data-media-position-existing]",
    ),
    mediaOrderExisting: document.querySelector("[data-media-order-existing]"),
    mediaPrimaryExisting: document.querySelector(
      "[data-media-primary-existing]",
    ),
    mediaLink: document.querySelector("[data-media-link]"),
    mediaDetailSection: document.querySelector("[data-media-detail-section]"),
    mediaDetailPreview: document.querySelector("[data-media-detail-preview]"),
    mediaDetailGenerate: document.querySelector("[data-media-detail-generate]"),
    mediaDetailId: document.querySelector("[data-media-detail-id]"),
    mediaDetailType: document.querySelector("[data-media-detail-type]"),
    mediaDetailUrl: document.querySelector("[data-media-detail-url]"),
    catalogNotesSection: document.querySelector("[data-catalog-notes-section]"),
    noteEditors: Array.from(document.querySelectorAll("[data-note-editor]")),
    noteSaveButtons: Array.from(document.querySelectorAll("[data-note-save]")),
    noteAddButtons: Array.from(document.querySelectorAll("[data-note-add]")),
    noteRows: Array.from(document.querySelectorAll("[data-note-rows]")),
    noteInputs: Array.from(document.querySelectorAll("[data-note-input]")),
    noteOrders: Array.from(document.querySelectorAll("[data-note-order]")),
    catalogStoneSection: document.querySelector("[data-catalog-stone-section]"),
    catalogStoneList: document.querySelector("[data-catalog-stone-list]"),
    stoneAddRole: document.querySelector("[data-stone-add-role]"),
    stoneAddCarat: document.querySelector("[data-stone-add-carat]"),
    stoneAddCount: document.querySelector("[data-stone-add-count]"),
    stoneAddSizeType: document.querySelector("[data-stone-add-size-type]"),
    stoneAddShape: document.querySelector("[data-stone-add-shape]"),
    stoneAddPrimary: document.querySelector("[data-stone-add-primary]"),
    stoneAddButton: document.querySelector("[data-stone-add]"),
    catalogMetalSection: document.querySelector("[data-catalog-metal-section]"),
    catalogMetalList: document.querySelector("[data-catalog-metal-list]"),
    metalAddWeight: document.querySelector("[data-metal-add-weight]"),
    metalAddSizeType: document.querySelector("[data-metal-add-size-type]"),
    metalAddPrimary: document.querySelector("[data-metal-add-primary]"),
    metalAddButton: document.querySelector("[data-metal-add]"),
    actionRow: document.querySelector("[data-action-row]"),
    actionSelect: document.querySelector("[data-action-select]"),
    actionRun: document.querySelector("[data-action-run]"),
    editSection: document.querySelector("[data-edit-section]"),
    quoteSection: document.querySelector("[data-quote-section]"),
    quoteMetals: Array.from(
      document.querySelectorAll('[data-quote-metals] input[type="checkbox"]'),
    ),
    quoteMetalInput: document.querySelector(
      '[data-field="quote_metal_options"]',
    ),
    quoteOptionCards: Array.from(
      document.querySelectorAll("[data-quote-option-card]"),
    ),
    quoteOptionStatuses: Array.from(
      document.querySelectorAll("[data-quote-option-status]"),
    ),
    quoteExtras: document.querySelector("[data-quote-extras]"),
    metalWeightLabel: document.querySelector("[data-metal-weight-label]"),
    metalWeightAdjustmentLabel: document.querySelector(
      "[data-metal-weight-adjustment-label]",
    ),
    metalWeightFinal: document.querySelector("[data-metal-weight-final]"),
    metalWeightError: document.querySelector("[data-metal-weight-error]"),
    metalWeightAdjustmentError: document.querySelector(
      "[data-metal-weight-adjustment-error]",
    ),
    editFields: Array.from(document.querySelectorAll("[data-field]")),
    orderDetailsSection: document.querySelector("[data-order-details-section]"),
    orderDetailsFields: Array.from(
      document.querySelectorAll("[data-order-details-field]"),
    ),
    diamondBreakdown: document.querySelector("[data-diamond-breakdown]"),
    diamondBreakdownRows: document.querySelector(
      "[data-diamond-breakdown-rows]",
    ),
    diamondBreakdownAdd: document.querySelector("[data-diamond-breakdown-add]"),
    diamondPieceCount: document.querySelector("[data-diamond-piece-count]"),
    diamondCaratTotal: document.querySelector("[data-diamond-carat-total]"),
    sizeRing: document.querySelector("[data-size-ring] input"),
    sizeBracelet: document.querySelector("[data-size-bracelet] input"),
    sizeChain: document.querySelector("[data-size-chain] input"),
    sizeBlock: document.querySelector("[data-size-block]"),
    detailsSave: document.querySelector("[data-details-save]"),
    primaryAction: document.querySelector("[data-primary-action]"),
    notesSave: document.querySelector("[data-notes-save]"),
    goldRefresh: document.querySelector("[data-gold-refresh]"),
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
    summaryTimelineDelay: document.querySelector(
      "[data-summary-timeline-delay]",
    ),
    summaryMetal: document.querySelector("[data-summary-metal]"),
    summaryStone: document.querySelector("[data-summary-stone]"),
    summaryStoneWeight: document.querySelector("[data-summary-stone-weight]"),
    summaryMetalWeight: document.querySelector("[data-summary-metal-weight]"),
    summaryMetalAdjustment: document.querySelector(
      "[data-summary-metal-adjustment]",
    ),
    summaryDiamondBreakdown: document.querySelector(
      "[data-summary-diamond-breakdown]",
    ),
    summaryDiscount: document.querySelector("[data-summary-discount]"),
    summaryPricingStatus: document.querySelector(
      "[data-summary-pricing-status]",
    ),
    summaryInterests: document.querySelector("[data-summary-interests]"),
    summaryContactPreference: document.querySelector(
      "[data-summary-contact-preference]",
    ),
    summarySubscription: document.querySelector("[data-summary-subscription]"),
    summaryCustomerNotes: document.querySelector(
      "[data-summary-customer-notes]",
    ),
    summaryOption1: document.querySelector("[data-summary-option-1]"),
    summaryOption2: document.querySelector("[data-summary-option-2]"),
    summaryOption3: document.querySelector("[data-summary-option-3]"),
    summaryOptionRecommended: document.querySelector(
      "[data-summary-option-recommended]",
    ),
    summaryLastPriced: document.querySelector("[data-summary-last-priced]"),
    summarySizeRing: document.querySelector("[data-summary-size-ring]"),
    summarySizeBracelet: document.querySelector("[data-summary-size-bracelet]"),
    summarySizeChain: document.querySelector("[data-summary-size-chain]"),
    summaryCustomer: document.querySelector("[data-summary-customer]"),
    summaryEmail: document.querySelector("[data-summary-email]"),
    summaryPhone: document.querySelector("[data-summary-phone]"),
    summaryAddress: document.querySelector("[data-summary-address]"),
    summaryCard: document.querySelector("[data-summary-card]"),
    detailAside: document.querySelector(".detail-aside"),
    summaryQuoteBlock: document.querySelector("[data-summary-quote-block]"),
    summaryPreferencesBlock: document.querySelector(
      "[data-summary-preferences-block]",
    ),
    summaryOptionsBlock: document.querySelector("[data-summary-options-block]"),
    summaryNotesBlock: document.querySelector("[data-summary-notes-block]"),
    summarySizesBlock: document.querySelector("[data-summary-sizes-block]"),
    summaryMore: document.querySelector("[data-summary-more]"),
    summaryPriceRow: document.querySelector("[data-summary-price-row]"),
    nextActionPanel: document.querySelector("[data-next-action-panel]"),
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
    breakdownRaw: document.querySelector("[data-breakdown-raw]"),
    breakdownRawToggle: document.querySelector("[data-breakdown-raw-toggle]"),
    optionFinals: Array.from(document.querySelectorAll("[data-option-final]")),
    optionActiveToggles: Array.from(
      document.querySelectorAll("[data-option-active]"),
    ),
    optionRecommendRadios: Array.from(
      document.querySelectorAll("[data-option-recommend]"),
    ),
    optionCopyButtons: Array.from(
      document.querySelectorAll("[data-option-copy]"),
    ),
    optionAutoButtons: Array.from(
      document.querySelectorAll("[data-option-auto]"),
    ),
    activitySection: document.querySelector("[data-activity-section]"),
    activitySlot: document.querySelector("[data-activity-slot]"),
    diamondPresets: document.querySelector("[data-diamond-presets]"),
    noteTimestamp: document.querySelector("[data-note-timestamp]"),
    noteTemplate: document.querySelector("[data-note-template]"),
    noteTags: Array.from(document.querySelectorAll("[data-note-tag]")),
    notesToggle: document.querySelector("[data-notes-toggle]"),
    openTracking: document.querySelector("[data-open-tracking]"),
    toast: document.querySelector("[data-toast]"),
  };

  function getApiBase() {
    if (typeof window === "undefined") return "";
    const stored = localStorage.getItem("adminApiBase") || "";
    if (stored) return stored;

    const datasetBase = document.body?.dataset?.apiBase;
    if (datasetBase) return datasetBase;

    const host = window.location.hostname;
    const isLocalHost =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("127.") ||
      host === "::1";

    if (isLocalHost) {
      return `${window.location.origin}/admin`;
    }

    return "https://admin-api.heerawalla.com/admin";
  }
  const apiBase = getApiBase();
  const siteBase = (
    document.body.dataset.siteBase || "https://www.heerawalla.com"
  ).replace(/\/$/, "");
  let isSyncingBreakdown = false;
  let quotePricingTimer = null;
  const quotePricingQueue = new Set();
  const quotePricingState = {
    options: QUOTE_OPTION_FIELDS.map(() => ({
      status: "idle",
      signature: "",
      lastPayload: null,
      lastError: "",
      lastPricedAt: "",
    })),
    inflight: new Map(),
    cache: new Map(),
  };
  const catalogCache = { data: null, promise: null };
  const mediaCache = new Map();

  function getStoredAdminEmail() {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem("adminEmail") || "";
    } catch {
      return "";
    }
  }

  function buildAdminHeaders(extra = {}, explicitEmail = "") {
    const headers = { "Content-Type": "application/json", ...extra };
    const localEmail = explicitEmail || "";
    if (localEmail) {
      headers["X-Admin-Email"] = localEmail;
    }
    return headers;
  }

  function isLocalApi(base) {
    return (
      base.startsWith("http://localhost") || base.startsWith("http://127.0.0.1")
    );
  }

  function addLocalAdminQuery(url, base, email) {
    if (isLocalApi(base) && email) {
      url.searchParams.set("admin_email", email);
    }
  }

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
          (parsed.hostname === "business.heerawalla.com" ||
            parsed.hostname === "admin-api.heerawalla.com")
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
    return String(value || "")
      .trim()
      .toLowerCase();
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
      neck: matchValue(
        /\b(?:neck|necklace|chain)(?:\s*(?:size|length))?\s*:\s*([^|\n,;]+)/i,
      ),
      earring: matchValue(
        /\bearrings?(?:\s*(?:style|type|size|preference))?\s*:\s*([^|\n,;]+)/i,
      ),
    };
  }

  function buildSizingRows(item) {
    const sizing = getSizingBlob(item);
    const rows = [];
    const textSizing = parseSizingFromText(getSizingText(item));
    const ringSize = getSizingValue(item, sizing, textSizing, [
      "ring_size",
      "ring",
      "ringSize",
    ]);
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

  function buildSizingSpec(entry) {
    const rawTags = entry?.tags;
    const tags = (
      Array.isArray(rawTags) ? rawTags : String(rawTags || "").split(/[|,;\n]/)
    )
      .map((tag) =>
        String(tag || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean);
    const hasTag = (values) => values.some((value) => tags.includes(value));
    const isSet = hasTag(["set", "sets"]);
    const wantsRing = hasTag(["ring", "rings", "band", "bands"]);
    const wantsBracelet = hasTag([
      "bracelet",
      "bracelets",
      "bangle",
      "bangles",
      "wrist",
    ]);
    const wantsChain = hasTag([
      "pendant",
      "pendants",
      "necklace",
      "necklaces",
      "chain",
      "chains",
    ]);
    if (tags.length) {
      const fallback = isSet && !wantsRing && !wantsBracelet && !wantsChain;
      return {
        ring: wantsRing || fallback,
        bracelet: wantsBracelet || fallback,
        chain: wantsChain || fallback,
      };
    }
    const category = String(entry?.category || entry?.categories || "")
      .toLowerCase()
      .replace(/\s+/g, " ");
    if (category.includes("set")) {
      return { ring: true, bracelet: true, chain: true };
    }
    return {
      ring: category.includes("ring") || category.includes("band"),
      bracelet: category.includes("bracelet") || category.includes("bangle"),
      chain:
        category.includes("pendant") ||
        category.includes("necklace") ||
        category.includes("chain"),
    };
  }

  let isSyncingSizing = false;

  function deriveSizeString(values) {
    const parts = [];
    if (isFilled(values.ring)) parts.push(`Ring size: ${values.ring}`);
    if (isFilled(values.bracelet))
      parts.push(`Bracelet size: ${values.bracelet}`);
    if (isFilled(values.chain)) parts.push(`Chain size: ${values.chain}`);
    return parts.join(" | ");
  }

  function syncSizingToSizeField() {
    if (isSyncingSizing) return;
    const sizeField = getEditField("size");
    if (!sizeField) return;
    const values = {
      ring: ui.sizeRing ? ui.sizeRing.value.trim() : "",
      bracelet: ui.sizeBracelet ? ui.sizeBracelet.value.trim() : "",
      chain: ui.sizeChain ? ui.sizeChain.value.trim() : "",
    };
    const summary = deriveSizeString(values);
    sizeField.value = summary;
    sizeField.dataset.activityValue = summary;
  }

  function applySizingVisibility(spec) {
    if (!ui.sizeBlock) return;
    const showBlock = spec && (spec.ring || spec.bracelet || spec.chain);
    ui.sizeBlock.classList.toggle(
      "is-hidden",
      !showBlock || state.tab !== "quotes",
    );
    const toggle = (node, show) => {
      if (!node) return;
      const wrapper = node.closest(".field");
      if (wrapper) wrapper.classList.toggle("is-hidden", !show);
    };
    toggle(ui.sizeRing, Boolean(spec?.ring));
    toggle(ui.sizeBracelet, Boolean(spec?.bracelet));
    toggle(ui.sizeChain, Boolean(spec?.chain));
  }

  async function refreshSizingInputs(item) {
    if (state.tab !== "quotes") return;
    const catalog = await loadCatalog();
    const entry = resolveCatalogEntry(item, catalog);
    const sizing = getSizingBlob(item);
    const textSizing = parseSizingFromText(getSizingText(item));
    isSyncingSizing = true;
    const ringValue = getSizingValue(item, sizing, textSizing, [
      "ring_size",
      "ring",
      "ringSize",
    ]);
    const braceletValue = getSizingValue(item, sizing, textSizing, [
      "wrist_size",
      "wrist",
      "bracelet_size",
      "bracelet",
    ]);
    const chainValue = getSizingValue(item, sizing, textSizing, [
      "neck_size",
      "neck",
      "chain_size",
      "chain_length",
      "necklace_size",
      "necklace_length",
    ]);
    let spec = buildSizingSpec(entry);
    if (!spec.ring && !spec.bracelet && !spec.chain) {
      spec = {
        ring: isFilled(ringValue),
        bracelet: isFilled(braceletValue),
        chain: isFilled(chainValue),
      };
    }
    applySizingVisibility(spec);
    state.sizingSpec = spec;
    if (ui.sizeRing) {
      ui.sizeRing.value = ringValue;
    }
    if (ui.sizeBracelet) {
      ui.sizeBracelet.value = braceletValue;
    }
    if (ui.sizeChain) {
      ui.sizeChain.value = chainValue;
    }
    syncSizingToSizeField();
    isSyncingSizing = false;
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
      ui.metalWeightAdjustmentLabel.textContent =
        buildMetalWeightAdjustmentLabel(metalValue);
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
    return ui.editFields.find(
      (field) => field.dataset.field === "diamond_breakdown",
    );
  }

  function normalizeStoneTypeLabel(value) {
    const normalized = String(value || "").toLowerCase();
    if (normalized.includes("lab")) return "lab";
    if (normalized.includes("natural")) return "natural";
    return "";
  }

  function getDefaultDiamondType() {
    const stoneValue = String(getEditValue("stone") || "").toLowerCase();
    if (!stoneValue) return "";
    if (stoneValue.includes("lab")) return "lab";
    if (stoneValue.includes("natural")) return "natural";
    const isDiamond = DIAMOND_TERMS.some((term) => stoneValue.includes(term));
    return isDiamond ? "natural" : "";
  }

  function parseDiamondBreakdownValue(value) {
    if (!value) return [];
    return String(value)
      .split(/\n|;|,/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const match = entry.match(
          /([0-9]*\.?[0-9]+)\s*(?:ct)?\s*[x×]\s*([0-9]*\.?[0-9]+)/i,
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

  function parseDiamondBreakdownValueTyped(value) {
    if (!value) return [];
    return String(value)
      .split(/\n|;|,/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        let stoneType = "";
        let payload = entry;
        const typeMatch = entry.match(
          /^(lab(?:\s+grown)?|natural)(?:\s+diamond)?\s*[:=-]\s*(.+)$/i,
        );
        if (typeMatch) {
          stoneType = normalizeStoneTypeLabel(typeMatch[1]);
          payload = typeMatch[2];
        }
        const match = payload.match(
          /([0-9]*\.?[0-9]+)\s*(?:ct)?\s*[xA-]\s*([0-9]*\.?[0-9]+)/i,
        );
        if (match) {
          return { weight: match[1], count: match[2], stoneType };
        }
        const numbers = payload.match(/[0-9]*\.?[0-9]+/g) || [];
        if (numbers.length >= 2) {
          return { weight: numbers[0], count: numbers[1], stoneType };
        }
        if (numbers.length === 1) {
          return { weight: numbers[0], count: "1", stoneType };
        }
        return null;
      })
      .filter(Boolean);
  }

  function formatDiamondBreakdownTyped(rows) {
    return rows
      .map((row) => {
        const weight = String(row.weight || "").trim();
        const count = String(row.count || "").trim();
        if (!weight || !count) return "";
        const typeLabel =
          row.stoneType === "lab"
            ? "Lab"
            : row.stoneType === "natural"
              ? "Natural"
              : "";
        const prefix = typeLabel ? `${typeLabel}: ` : "";
        return `${prefix}${weight} x ${count}`;
      })
      .filter(Boolean)
      .join("\n");
  }

  function getDiamondRowsFromDomTyped() {
    if (!ui.diamondBreakdownRows) return [];
    return Array.from(
      ui.diamondBreakdownRows.querySelectorAll("[data-diamond-row]"),
    ).map((row) => {
      const weight =
        row.querySelector("[data-diamond-weight]")?.value?.trim() || "";
      const count =
        row.querySelector("[data-diamond-count]")?.value?.trim() || "";
      const stoneType =
        row.querySelector("[data-diamond-type]")?.value?.trim() || "";
      return { weight, count, stoneType };
    });
  }

  function syncDiamondBreakdownField() {
    if (isSyncingBreakdown) return;
    const field = getDiamondBreakdownField();
    if (!field) return;
    const defaultType = getDefaultDiamondType();
    const rows = getDiamondRowsFromDomTyped().map((row) => ({
      ...row,
      stoneType: row.stoneType || defaultType,
    }));
    isSyncingBreakdown = true;
    field.value = formatDiamondBreakdownTyped(rows);
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
    const defaultType = getDefaultDiamondType();
    ui.diamondBreakdownRows.innerHTML = rows
      .map((row, index) => {
        const weight = String(row.weight || "").trim();
        const count = String(row.count || "").trim();
        const totalValue = Number(weight || 0) * Number(count || 0);
        const totalText = formatDiamondCarat(totalValue);
        const stoneType = normalizeStoneTypeLabel(row.stoneType) || defaultType;
        return `
          <div class="diamond-row" data-diamond-row data-row-index="${index}">
            <label>
              <span>ct</span>
              <input type="text" data-diamond-weight placeholder="0.10" value="${escapeAttribute(
                weight,
              )}" />
            </label>
            <label>
              <span>count</span>
              <input type="text" data-diamond-count placeholder="1" value="${escapeAttribute(
                count,
              )}" />
            </label>
            <label>
              <span>Type</span>
              <select data-diamond-type>
                <option value="">Auto</option>
                <option value="natural" ${stoneType === "natural" ? "selected" : ""}>Natural</option>
                <option value="lab" ${stoneType === "lab" ? "selected" : ""}>Lab</option>
              </select>
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
    const trimmed =
      value % 1 === 0
        ? value.toFixed(0)
        : value.toFixed(2).replace(/\.?0+$/, "");
    return `${trimmed} ct`;
  }

  function buildDiamondComponentsPayload() {
    if (state.tab !== "quotes") return [];
    const rows = getDiamondRowsFromDomTyped();
    if (!rows.length) return [];
    const defaultType = getDefaultDiamondType();
    const groups = new Map();
    rows.forEach((row) => {
      const weight = String(row.weight || "").trim();
      const count = String(row.count || "").trim();
      if (!weight || !count) return;
      const stoneType = normalizeStoneTypeLabel(row.stoneType) || defaultType;
      if (!stoneType) return;
      const key = stoneType;
      const list = groups.get(key) || [];
      list.push(`${weight} x ${count}`);
      groups.set(key, list);
    });
    return Array.from(groups.entries()).map(([stoneType, lines]) => ({
      stone_type: stoneType,
      diamond_breakdown: lines.join("\n"),
    }));
  }

  function updateDiamondStats(rows) {
    if (!ui.diamondPieceCount || !ui.diamondCaratTotal) return;
    const pieces = rows.reduce(
      (sum, item) => sum + (Number(item.count) || 0),
      0,
    );
    const carats = rows.reduce(
      (sum, item) =>
        sum + (Number(item.weight) || 0) * (Number(item.count) || 0),
      0,
    );
    ui.diamondPieceCount.textContent = pieces;
    ui.diamondCaratTotal.textContent = formatDiamondCarat(carats);
    const stoneValue = getEditValue("stone").toLowerCase();
    const isDiamond = DIAMOND_TERMS.some((term) => stoneValue.includes(term));
    if (isDiamond) {
      const stoneWeightField = getEditField("stone_weight");
      if (stoneWeightField) {
        const normalized =
          carats && Number.isFinite(carats)
            ? carats % 1 === 0
              ? carats.toFixed(0)
              : carats.toFixed(2).replace(/\.?0+$/, "")
            : "";
        stoneWeightField.value = normalized;
        stoneWeightField.dataset.activityValue = normalized;
        if (state.selectedItem) {
          state.selectedItem.stone_weight = normalized;
          updateSummaryCard(state.selectedItem);
        }
      }
    }
  }

  function updateDiamondRowTotals() {
    if (!ui.diamondBreakdownRows) return;
    const rows = Array.from(
      ui.diamondBreakdownRows.querySelectorAll("[data-diamond-row]"),
    );
    rows.forEach((row) => {
      const weight = Number(
        row.querySelector("[data-diamond-weight]")?.value || 0,
      );
      const count = Number(
        row.querySelector("[data-diamond-count]")?.value || 0,
      );
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
    const defaultType = getDefaultDiamondType();
    const rows = getDiamondRowsFromDomTyped();
    rows.push({ weight: match[1], count: match[2], stoneType: defaultType });
    renderDiamondBreakdownRows(rows);
    syncDiamondBreakdownField();
    if (ui.diamondPresets) ui.diamondPresets.value = "";
  }

  function setDiamondBreakdownRowsFromField() {
    const field = getDiamondBreakdownField();
    if (!field) return;
    const rows = parseDiamondBreakdownValueTyped(field.value);
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
    return true;
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

  function initializeQuotePricingStatus() {
    if (state.tab !== "quotes") return;
    QUOTE_OPTION_FIELDS.forEach((option, index) => {
      const field = getEditField(option.price);
      const value = field ? field.value.trim() : "";
      if (value) {
        setOptionStatus(index, "priced");
      } else {
        setOptionStatus(index, "idle");
      }
    });
    initializeOptionDefaults();
    updateOptionFinals();
  }

  function initializeOptionDefaults() {
    if (state.tab !== "quotes") return;
    QUOTE_OPTION_FIELDS.forEach((option, index) => {
      const clarity = getEditValue(option.clarity);
      const color = getEditValue(option.color);
      const price = getEditValue(option.price);
      const isActive = Boolean(clarity || color || price || index === 0);
      setOptionActive(index, isActive);
    });
    if (state.recommendedOptionIndex === null) {
      const firstActive = QUOTE_OPTION_FIELDS.findIndex((_, index) =>
        isOptionActive(index),
      );
      state.recommendedOptionIndex = firstActive >= 0 ? firstActive : null;
      syncRecommendedOptionUi();
    }
  }

  function signature(payload) {
    return PRICING_PAYLOAD_KEYS.map((key) => {
      if (key === "diamond_breakdown_components") {
        return `${key}:${JSON.stringify(payload[key] || [])}`;
      }
      return `${key}:${String(payload[key] ?? "")}`;
    }).join("|");
  }

  function collectBasePricingPayload() {
    if (state.tab !== "quotes") return null;
    syncSizingToSizeField();
    const diamondComponents = buildDiamondComponentsPayload();
    return {
      metal: getEditValue("metal") || "",
      metal_weight: getEditValue("metal_weight") || "",
      stone: getEditValue("stone") || "",
      stone_weight: getEditValue("stone_weight") || "",
      diamond_breakdown: getEditValue("diamond_breakdown") || "",
      diamond_breakdown_components: diamondComponents,
      timeline: getEditValue("timeline") || "",
      timeline_adjustment_weeks:
        getEditValue("timeline_adjustment_weeks") || "",
      quote_discount_type: getEditValue("quote_discount_type") || "",
      quote_discount_percent: getEditValue("quote_discount_percent") || "",
      size: getEditValue("size") || "",
      size_label: "",
      size_ring: ui.sizeRing ? ui.sizeRing.value.trim() : "",
      size_bracelet: ui.sizeBracelet ? ui.sizeBracelet.value.trim() : "",
      size_chain: ui.sizeChain ? ui.sizeChain.value.trim() : "",
    };
  }

  function collectOptionPayload(optionIndex, basePayload) {
    const option = QUOTE_OPTION_FIELDS[optionIndex];
    if (!option) return null;
    const clarity = getEditValue(option.clarity) || "";
    const color = getEditValue(option.color) || "";
    return { ...basePayload, clarity, color };
  }

  function getOptionPriceField(optionIndex) {
    const option = QUOTE_OPTION_FIELDS[optionIndex];
    return option ? getEditField(option.price) : null;
  }

  function setOptionStatus(optionIndex, status, message = "") {
    const entry = quotePricingState.options[optionIndex];
    if (!entry) return;
    entry.status = status;
    entry.lastError = status === "error" ? message : "";
    if (status === "priced") {
      entry.lastPricedAt = new Date().toISOString();
    }
    const card = ui.quoteOptionCards[optionIndex];
    const statusNode = ui.quoteOptionStatuses[optionIndex];
    if (card) {
      card.classList.toggle("is-pricing", status === "pricing");
      card.classList.toggle("is-stale", status === "stale");
      card.classList.toggle("is-error", status === "error");
      card.classList.toggle("is-manual", status === "manual");
      card.classList.toggle("is-inactive", !isOptionActive(optionIndex));
    }
    if (statusNode) {
      const label =
        status === "pricing"
          ? "Pricing..."
          : status === "stale"
            ? "Stale"
            : status === "error"
              ? "Error"
              : status === "manual"
                ? "Manual"
                : status === "priced"
                  ? "Priced"
                  : "Idle";
      statusNode.textContent = message ? `${label} · ${message}` : label;
    }
    updatePricingSummaryStatus();
    updateSummaryCard(state.selectedItem);
  }

  function markOptionManual(optionIndex) {
    if (optionIndex == null) return;
    setOptionStatus(optionIndex, "manual");
  }

  function resolveLastPricedLabel() {
    const timestamps = quotePricingState.options
      .map((entry) => entry.lastPricedAt)
      .filter(Boolean);
    if (!timestamps.length) return "--";
    const latest = timestamps.sort().slice(-1)[0];
    return formatActivityTime(latest);
  }

  function isOptionActive(optionIndex) {
    const toggle = ui.optionActiveToggles[optionIndex];
    return toggle ? toggle.checked : true;
  }

  function setOptionActive(optionIndex, active) {
    const toggle = ui.optionActiveToggles[optionIndex];
    if (toggle) toggle.checked = active;
    const option = QUOTE_OPTION_FIELDS[optionIndex];
    if (!option) return;
    [option.clarity, option.color, option.price].forEach((key) => {
      const field = getEditField(key);
      if (field) field.disabled = !active;
    });
    const radio = ui.optionRecommendRadios[optionIndex];
    if (radio) radio.disabled = !active;
    const copyBtn = ui.optionCopyButtons[optionIndex];
    if (copyBtn) copyBtn.disabled = !active;
    const autoBtn = ui.optionAutoButtons[optionIndex];
    if (autoBtn) autoBtn.disabled = !active;
    const card = ui.quoteOptionCards[optionIndex];
    if (card) card.classList.toggle("is-inactive", !active);
    if (!active && state.recommendedOptionIndex === optionIndex) {
      state.recommendedOptionIndex = null;
      syncRecommendedOptionUi();
    }
    if (!active) {
      setOptionStatus(optionIndex, "idle", "Inactive");
    }
    updateActionButtonState();
  }

  function syncRecommendedOptionUi() {
    ui.optionRecommendRadios.forEach((radio, index) => {
      radio.checked = state.recommendedOptionIndex === index;
    });
    if (state.selectedItem) {
      updateSummaryCard(state.selectedItem);
    }
  }

  function updateOptionFinal(optionIndex) {
    const finalNode = ui.optionFinals[optionIndex];
    if (!finalNode) return;
    const priceField = getOptionPriceField(optionIndex);
    const priceValue = Number(priceField?.value || "");
    if (!priceValue || Number.isNaN(priceValue)) {
      finalNode.textContent = "Final: --";
      return;
    }
    const type = normalizeText(getEditValue("quote_discount_type"));
    const percent = Number(getEditValue("quote_discount_percent")) || 0;
    const applyDiscount = type === "custom" && percent > 0;
    const finalValue = applyDiscount
      ? Math.max(0, priceValue * (1 - percent / 100))
      : priceValue;
    finalNode.textContent = `Final: ${formatPrice(finalValue) || "--"}`;
  }

  function updateOptionFinals() {
    QUOTE_OPTION_FIELDS.forEach((_, index) => updateOptionFinal(index));
  }

  function applyQuotePrice(optionIndex, value) {
    const field = getOptionPriceField(optionIndex);
    if (!field || !shouldApplyAutoPrice(field)) return;
    field.value = value;
    field.dataset.auto = "true";
    field.dataset.manual = "";
    if (state.selectedItem) {
      const key = QUOTE_OPTION_FIELDS[optionIndex].price;
      state.selectedItem[key] = value;
      updateSummaryCard(state.selectedItem);
    }
    updateDiscountPreview();
    updateOptionFinal(optionIndex);
  }

  function shouldPriceOption(optionIndex, basePayload) {
    const option = QUOTE_OPTION_FIELDS[optionIndex];
    if (!option) return false;
    if (!isOptionActive(optionIndex)) return false;
    const priceField = getOptionPriceField(optionIndex);
    const isManual =
      priceField &&
      priceField.dataset.manual === "true" &&
      priceField.value.trim();
    if (isManual) return false;
    const clarity = getEditValue(option.clarity);
    const color = getEditValue(option.color);
    const goldOnly = isGoldOnlyQuote();
    return Boolean(clarity || color || (goldOnly && optionIndex === 0));
  }

  function computeMissingCriticalInfo(basePayload) {
    const chips = [];
    if (!basePayload) return chips;
    if (!basePayload.metal) {
      chips.push(buildMissingChip("Metal missing", '[data-field="metal"]'));
    }
    if (!basePayload.metal_weight) {
      chips.push(
        buildMissingChip("Metal weight missing", '[data-field="metal_weight"]'),
      );
    }
    if (!basePayload.timeline) {
      chips.push(
        buildMissingChip("Timeline missing", '[data-field="timeline"]'),
      );
    }
    const stoneValue = String(basePayload.stone || "").toLowerCase();
    const isDiamond = DIAMOND_TERMS.some((term) => stoneValue.includes(term));
    const components = Array.isArray(basePayload.diamond_breakdown_components)
      ? basePayload.diamond_breakdown_components
      : [];
    if (stoneValue) {
      if (
        isDiamond &&
        !basePayload.diamond_breakdown &&
        components.length === 0
      ) {
        chips.push(
          buildMissingChip(
            "Diamond breakdown missing",
            '[data-field="diamond_breakdown"]',
          ),
        );
      }
      if (!isDiamond && !basePayload.stone_weight) {
        chips.push(
          buildMissingChip(
            "Stone weight missing",
            '[data-field="stone_weight"]',
          ),
        );
      }
    }
    const spec = state.sizingSpec || {};
    if (spec.ring && !basePayload.size_ring) {
      chips.push(
        buildMissingChip("Ring size missing", "[data-size-ring] input"),
      );
    }
    if (spec.bracelet && !basePayload.size_bracelet) {
      chips.push(
        buildMissingChip("Bracelet size missing", "[data-size-bracelet] input"),
      );
    }
    if (spec.chain && !basePayload.size_chain) {
      chips.push(
        buildMissingChip("Chain size missing", "[data-size-chain] input"),
      );
    }
    const goldOnly = isGoldOnlyQuote();
    if (!goldOnly) {
      QUOTE_OPTION_FIELDS.forEach((option, index) => {
        if (!isOptionActive(index)) return;
        const clarity = getEditValue(option.clarity);
        const color = getEditValue(option.color);
        if (!clarity) {
          chips.push(
            buildMissingChip(
              `Option ${index + 1} clarity missing`,
              `[data-field="${option.clarity}"]`,
            ),
          );
        }
        if (!color) {
          chips.push(
            buildMissingChip(
              `Option ${index + 1} color missing`,
              `[data-field="${option.color}"]`,
            ),
          );
        }
      });
    }
    return chips;
  }

  async function priceOption(optionIndex, payload) {
    const option = QUOTE_OPTION_FIELDS[optionIndex];
    if (!option || !payload) return;
    const payloadSignature = signature(payload);
    const cached = quotePricingState.cache.get(payloadSignature);
    if (cached) {
      applyQuotePrice(optionIndex, cached.price);
      setOptionStatus(optionIndex, "priced");
      return;
    }
    const inflight = quotePricingState.inflight.get(optionIndex);
    if (inflight && inflight.signature === payloadSignature)
      return inflight.promise;
    setOptionStatus(optionIndex, "pricing");
    const pricingBase = getCatalogBase();
    const promise = fetch(`${pricingBase}/pricing/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) =>
        response
          .json()
          .catch(() => ({}))
          .then((data) => ({ response, data })),
      )
      .then(({ response, data }) => {
        if (!response.ok || !data?.ok) {
          setOptionStatus(optionIndex, "error");
          return;
        }
        const priceValue = String(data.price ?? "");
        quotePricingState.cache.set(payloadSignature, { price: priceValue });
        applyQuotePrice(optionIndex, priceValue);
        setOptionStatus(optionIndex, "priced");
      })
      .catch(() => {
        setOptionStatus(optionIndex, "error");
      })
      .finally(() => {
        quotePricingState.inflight.delete(optionIndex);
        updatePrimaryActionState();
        updateActionButtonState();
      });
    quotePricingState.inflight.set(optionIndex, {
      promise,
      signature: payloadSignature,
    });
    return promise;
  }

  async function refreshQuotePricing(optionIndexes) {
    if (state.tab !== "quotes") return;
    const basePayload = collectBasePricingPayload();
    if (!basePayload) return;
    QUOTE_OPTION_FIELDS.forEach((_, index) => {
      if (shouldPriceOption(index, basePayload)) return;
      const priceField = getOptionPriceField(index);
      const isManual =
        priceField &&
        priceField.dataset.manual === "true" &&
        priceField.value.trim();
      if (isManual) {
        setOptionStatus(index, "manual");
      } else if (priceField && priceField.value.trim()) {
        setOptionStatus(index, "priced");
      } else {
        setOptionStatus(index, "idle");
      }
    });
    const missing = computeMissingCriticalInfo(basePayload);
    if (missing.length) {
      updatePrimaryActionState();
      updateActionButtonState();
      return;
    }
    const targets = optionIndexes && optionIndexes.length ? optionIndexes : [];
    const shouldPrice = targets.filter((index) =>
      shouldPriceOption(index, basePayload),
    );
    if (!shouldPrice.length) {
      updatePrimaryActionState();
      updateActionButtonState();
      return;
    }
    await Promise.all(
      shouldPrice.map((index) => {
        const payload = collectOptionPayload(index, basePayload);
        return priceOption(index, payload);
      }),
    );
  }

  function scheduleQuotePricingUpdate({
    baseChanged = false,
    optionIndex = null,
  } = {}) {
    if (state.tab !== "quotes") return;
    if (baseChanged) {
      QUOTE_OPTION_FIELDS.forEach((_, index) => {
        quotePricingQueue.add(index);
      });
    } else if (typeof optionIndex === "number") {
      quotePricingQueue.add(optionIndex);
    }
    quotePricingQueue.forEach((index) => {
      const priceField = getOptionPriceField(index);
      const isManual =
        priceField &&
        priceField.dataset.manual === "true" &&
        priceField.value.trim();
      if (!isOptionActive(index)) {
        setOptionStatus(index, "idle");
        return;
      }
      if (isManual) {
        setOptionStatus(index, "manual");
        return;
      }
      setOptionStatus(index, "stale");
    });
    if (quotePricingTimer) clearTimeout(quotePricingTimer);
    quotePricingTimer = setTimeout(() => {
      const targets = Array.from(quotePricingQueue);
      quotePricingQueue.clear();
      refreshQuotePricing(targets);
    }, 500);
  }

  function getCatalogBase() {
    const base = getApiBase();
    return base.replace(/\/admin\/?$/, "");
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
      if (parts.includes("product") || parts.includes("products"))
        return "products";
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
      .map(
        (part) =>
          part
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "uncategorized",
      )
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
      return [normalizeImageUrl("/images/products/placeholder.svg")].filter(
        Boolean,
      );
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
    return Array.from(
      new Set(candidates.map(normalizeImageUrl).filter(Boolean)),
    );
  }

  function resolveCatalogEntry(item, catalog) {
    if (!catalog) return null;
    const url = item.product_url || "";
    const slug = extractSlug(url);
    const type = extractCatalogType(url);
    const designCode = item.design_code || "";
    const name = item.product_name || "";
    const inspirations = Array.isArray(catalog.inspirations)
      ? catalog.inspirations
      : [];
    const products = Array.isArray(catalog.products) ? catalog.products : [];
    const byDesignCode = (entry) =>
      designCode &&
      (entry.design_code || entry.designCode || "").toLowerCase() ===
        designCode.toLowerCase();
    const byName = (entry) =>
      name &&
      String(entry.name || entry.title || "").toLowerCase() ===
        name.toLowerCase();
    const bySlug = (entry) =>
      slug && String(entry.slug || "").toLowerCase() === slug.toLowerCase();
    if (type === "inspirations") {
      return (
        inspirations.find(bySlug) ||
        inspirations.find(byDesignCode) ||
        inspirations.find(byName) ||
        null
      );
    }
    if (type === "products") {
      return (
        products.find(bySlug) ||
        products.find(byDesignCode) ||
        products.find(byName) ||
        null
      );
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
    const fallback = escapeAttribute(
      normalizeImageUrl("/images/products/placeholder.svg"),
    );
    if (images.length === 1) {
      const src = escapeAttribute(images[0]);
      return `<div class="media-frame"><img src="${src}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${fallback}';"></div>`;
    }
    const slides = images
      .map(
        (src) =>
          `<div class="media-slide"><img src="${escapeAttribute(src)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${fallback}';"></div>`,
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
    const cacheKey =
      item.design_code || item.product_url || item.product_name || "";
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
    return num.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }

  function formatPhone(value) {
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

  function hasValue(value) {
    return value !== undefined && value !== null && value !== "";
  }

  async function apiFetch(path, options = {}) {
    const resolvedBase = getApiBase();
    if (!resolvedBase) throw new Error("Missing API base");
    const base = resolvedBase.endsWith("/") ? resolvedBase : `${resolvedBase}/`;
    const url = new URL(path.replace(/^\//, ""), base);
    const localEmail = isLocalApi(base) ? getStoredAdminEmail() : "";
    addLocalAdminQuery(url, base, localEmail);
    const headers = buildAdminHeaders(options.headers || {}, localEmail);
    const response = await fetch(url.toString(), {
      credentials: isLocalApi(base) ? "omit" : "include",
      headers,
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
    if (tab === "tickets") return "/tickets";
    if (tab === "contacts") return "/contacts";
    if (tab === "products") return "/products";
    if (tab === "inspirations") return "/inspirations";
    if (tab === "media-library") return "/media-library";
    if (tab === "price-chart") return "/price-chart";
    if (tab === "cost-chart") return "/cost-chart";
    if (tab === "diamond-price-chart") return "/diamond-price-chart";
    return `/${tab}`;
  }

  function getActionEndpoint() {
    if (state.tab === "orders") return "/orders/action";
    if (state.tab === "quotes") return "/quotes/action";
    if (state.tab === "tickets") return "/tickets/action";
    if (state.tab === "contacts") return "/contacts/action";
    if (state.tab === "products") return "/products/action";
    if (state.tab === "inspirations") return "/inspirations/action";
    if (state.tab === "media-library") return "/media-library/action";
    if (state.tab === "price-chart") return "/price-chart/action";
    if (state.tab === "cost-chart") return "/cost-chart/action";
    if (state.tab === "diamond-price-chart")
      return "/diamond-price-chart/action";
    return "";
  }

  function getSelectedRecordId() {
    if (!state.selectedItem) return "";
    return (
      state.selectedItem.request_id ||
      state.selectedItem.email ||
      state.selectedItem.row_number ||
      state.selectedItem.slug ||
      state.selectedItem.id ||
      state.selectedItem.media_id ||
      ""
    );
  }

  function applyEditVisibility() {
    if (CATALOG_TABS.has(state.tab)) {
      if (ui.editSection) ui.editSection.classList.add("is-hidden");
      return;
    }
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

  function applyCatalogVisibility() {
    const showCatalog = CATALOG_TABS.has(state.tab);
    if (ui.catalogSection)
      ui.catalogSection.classList.toggle("is-hidden", !showCatalog);
    if (showCatalog) {
      const active =
        ui.catalogTabs.find((tab) => tab.classList.contains("is-active"))
          ?.dataset.catalogTab || CATALOG_DEFAULT_TAB;
      setCatalogTab(active);
    } else {
      ui.catalogPanels.forEach((panel) => panel.classList.add("is-hidden"));
    }
    if (ui.missingPanel) ui.missingPanel.classList.toggle("is-hidden", false);
    if (ui.activityFeed)
      ui.activityFeed
        .closest(".drawer-section")
        ?.classList.toggle("is-hidden", showCatalog);
    if (ui.orderDetailsSection)
      ui.orderDetailsSection.classList.toggle("is-hidden", showCatalog);
    if (ui.sizeBlock) ui.sizeBlock.classList.toggle("is-hidden", showCatalog);
    if (ui.summaryCard)
      ui.summaryCard.classList.toggle("is-hidden", showCatalog);
    if (ui.detailAside)
      ui.detailAside.classList.toggle("is-hidden", showCatalog);
    if (ui.nextActionPanel)
      ui.nextActionPanel.classList.toggle("is-hidden", showCatalog);
  }

  function setCatalogTab(next) {
    if (!ui.catalogTabs.length || !ui.catalogPanels.length) return;
    const tab = next || CATALOG_DEFAULT_TAB;
    ui.catalogTabs.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.catalogTab === tab);
    });
    ui.catalogPanels.forEach((panel) => {
      const panelKey = panel.dataset.catalogPanel || "";
      panel.classList.toggle("is-hidden", panelKey !== tab);
    });
  }

  function renderCatalogFields(item, enums) {
    if (!ui.catalogFields && !ui.catalogFieldsBasic) return;
    if (state.tab === "media-library") {
      const headers =
        Array.isArray(state.catalogHeaders) && state.catalogHeaders.length
          ? state.catalogHeaders
          : Object.keys(item || {});
      const keys = headers
        .map((key) => String(key || "").trim())
        .filter((key) => key && key !== "row_number");
      const longFields = new Set(["description", "label", "alt", "url"]);
      ui.catalogFields.innerHTML = keys
        .map((key) => {
          const value = item?.[key] ?? "";
          const label = key.replace(/_/g, " ");
          const isLong = longFields.has(key);
          const isReadOnly = key === "created_at";
          if (isLong) {
            return `
              <label class="field full-span">
                <span>${escapeHtml(label)}</span>
                <textarea rows="2" data-field="${escapeAttribute(key)}" ${isReadOnly ? 'data-readonly="true" disabled' : ""}>${escapeHtml(
                  String(value || ""),
                )}</textarea>
              </label>
            `;
          }
          return `
            <label class="field">
              <span>${escapeHtml(label)}</span>
              <input type="text" data-field="${escapeAttribute(key)}" value="${escapeAttribute(
                String(value || ""),
              )}" ${isReadOnly ? 'data-readonly="true" disabled' : ""} />
            </label>
          `;
        })
        .join("");
      return;
    }
    if (!window.CatalogForm) return;
    const form = window.CatalogForm;
    const safeEnums = enums || {};
    const fixedCatalogOptions = {
      categories: ["RING", "PENDANT", "BRACELET", "BAND", "NECKLACE", "BANGLE"],
      styles: [
        "Bold",
        "Subtle",
        "Minimalist",
        "Contemporary",
        "Traditional",
        "Vintage",
        "Modern",
        "Classic",
        "Art Deco",
        "Bohemian",
        "Romantic",
      ],
      motifs: [
        "Gift",
        "Wedding",
        "Engagement",
        "Anniversary",
        "Birthday",
        "Promise",
        "Eternal Love",
        "Family",
        "Celebration",
      ],
      tags: ["RING", "PENDANT", "BRACELET", "BAND", "NECKLACE", "BANGLE"],
    };
    Object.entries(fixedCatalogOptions).forEach(([key, values]) => {
      safeEnums[key] = values.map((value) => ({ value }));
    });
    const value = item || {};
    const allowCustomLists = new Set([]);
    const activeValue =
      value.is_active === undefined || value.is_active === null
        ? state.isNewRow
        : Boolean(value.is_active);
    const featuredValue = Boolean(value.is_featured);
    const slugHelper = `<button class="btn btn-ghost btn-small" type="button" data-slug-generate>Generate</button>`;
    const basics = [
      form.renderTextInput({
        label: "ID",
        field: "id",
        value: value.id || "",
        readOnly: !state.isNewRow,
      }),
      form.renderTextInput({
        label: "Name",
        field: "name",
        value: value.name || "",
      }),
      form.renderTextInput({
        label: "Slug",
        field: "slug",
        value: value.slug || "",
        helperHtml: slugHelper,
      }),
      form.renderEnumSelect({
        label: "Design code",
        field: "design_code",
        value: value.design_code || "",
        options: safeEnums.design_codes,
        includeEmpty: true,
        placeholder: "Select",
      }),
      form.renderToggle({
        label: "Active",
        field: "is_active",
        value: activeValue,
      }),
      form.renderToggle({
        label: "Featured",
        field: "is_featured",
        value: featuredValue,
      }),
    ];

    const taxonomy = [
      form.renderEnumSelect({
        label: "Gender",
        field: "gender",
        value: value.gender || "",
        options: safeEnums.genders,
        includeEmpty: true,
        placeholder: "Select",
      }),
      form.renderMultiSelectChips({
        label: "Categories",
        field: "categories",
        values: value.categories || [],
        enumKey: "categories",
        allowCustom: allowCustomLists.has("categories"),
        placeholder: "Add category",
        fullSpan: true,
      }),
      form.renderMultiSelectChips({
        label: "Styles",
        field: "styles",
        values: value.styles || [],
        enumKey: "styles",
        allowCustom: allowCustomLists.has("styles"),
        placeholder: "Add style",
        fullSpan: true,
      }),
      form.renderMultiSelectChips({
        label: "Motifs",
        field: "motifs",
        values: value.motifs || [],
        enumKey: "motifs",
        allowCustom: allowCustomLists.has("motifs"),
        placeholder: "Add motif",
        fullSpan: true,
      }),
      form.renderMultiSelectChips({
        label: "Tags",
        field: "tags",
        values: value.tags || [],
        enumKey: "tags",
        allowCustom: allowCustomLists.has("tags"),
        placeholder: "Add tag",
        fullSpan: true,
      }),
    ];

    const materials = [
      form.renderMultiSelectChips({
        label: "Metals",
        field: "metals",
        values: value.metals || [],
        enumKey: "metals",
        allowCustom: false,
        placeholder: "Add metal",
        fullSpan: true,
      }),
      form.renderMultiSelectChips({
        label: "Stone types",
        field: "stone_types",
        values: value.stone_types || [],
        enumKey: "stone_types",
        allowCustom: false,
        placeholder: "Add stone type",
        fullSpan: true,
      }),
      form.renderMultiSelectChips({
        label: "Cut",
        field: "cut",
        values: value.cut || [],
        enumKey: "cuts",
        allowCustom: false,
        placeholder: "Add cut",
        fullSpan: true,
      }),
      form.renderMultiSelectChips({
        label: "Clarity",
        field: "clarity",
        values: value.clarity || [],
        enumKey: "clarities",
        allowCustom: false,
        placeholder: "Add clarity",
        fullSpan: true,
      }),
      form.renderMultiSelectChips({
        label: "Color",
        field: "color",
        values: value.color || [],
        enumKey: "colors",
        allowCustom: false,
        placeholder: "Add color",
        fullSpan: true,
      }),
    ];

    const audit = [
      form.renderTextInput({
        label: "Created at",
        field: "created_at",
        value: value.created_at || "",
        readOnly: true,
      }),
      form.renderTextInput({
        label: "Updated at",
        field: "updated_at",
        value: value.updated_at || "",
        readOnly: true,
      }),
      form.renderTextInput({
        label: "Updated by",
        field: "updated_by",
        value: value.updated_by || "",
        readOnly: true,
      }),
    ];

    if (ui.catalogFieldsBasic)
      ui.catalogFieldsBasic.innerHTML = basics.join("");
    if (ui.catalogFieldsTaxonomy)
      ui.catalogFieldsTaxonomy.innerHTML = taxonomy.join("");
    if (ui.catalogFieldsMaterials)
      ui.catalogFieldsMaterials.innerHTML = materials.join("");
    if (ui.catalogFieldsAudit) ui.catalogFieldsAudit.innerHTML = audit.join("");
    if (ui.catalogFields && !ui.catalogFieldsBasic) {
      ui.catalogFields.innerHTML = [
        ...basics,
        ...taxonomy,
        ...materials,
        ...audit,
      ].join("");
    }

    const handleCatalogChange = () => {
      refreshMissingInfo();
      updatePrimaryActionState();
      updateActionButtonState();
    };
    [
      ui.catalogFieldsBasic,
      ui.catalogFieldsTaxonomy,
      ui.catalogFieldsMaterials,
      ui.catalogFieldsAudit,
      ui.catalogFields,
    ]
      .filter(Boolean)
      .forEach((container) => {
        form.init(container, safeEnums, handleCatalogChange);
      });

    const slugButton = document.querySelector("[data-slug-generate]");
    if (slugButton) {
      slugButton.addEventListener("click", () => {
        const slugContainer = ui.catalogFieldsBasic || ui.catalogFields;
        if (!slugContainer) return;
        const nameInput = slugContainer.querySelector('[data-field="name"]');
        const slugInput = slugContainer.querySelector('[data-field="slug"]');
        if (!nameInput || !slugInput || !window.CatalogUtils) return;
        slugInput.value = window.CatalogUtils.normalizeSlug(
          nameInput.value || "",
        );
        slugInput.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }

    const counterFields = document.querySelectorAll("[data-char-count]");
    counterFields.forEach((input) => {
      const counter = input
        .closest(".field")
        ?.querySelector("[data-char-counter]");
      if (!counter) return;
      const updateCounter = () => {
        counter.textContent = String(input.value.length || 0);
      };
      updateCounter();
      input.addEventListener("input", updateCounter);
    });
  }

  function getMediaDescriptionField() {
    if (!ui.catalogFields) return null;
    return ui.catalogFields.querySelector('[data-field="description"]');
  }

  function renderMediaDetail(item) {
    if (!ui.mediaDetailSection) return;
    const show = state.tab === "media-library";
    ui.mediaDetailSection.classList.toggle("is-hidden", !show);
    if (!show) return;
    const mediaId = String(item?.media_id || item?.id || item?.row_number || "");
    const mediaType = String(item?.media_type || "image").trim() || "image";
    const rawUrl = item?.url || item?.media_url || "";
    const url = normalizeImageUrl(rawUrl);
    if (ui.mediaDetailId) ui.mediaDetailId.textContent = mediaId || "--";
    if (ui.mediaDetailType) ui.mediaDetailType.textContent = mediaType || "--";
    if (ui.mediaDetailUrl) {
      if (url) {
        ui.mediaDetailUrl.href = url;
        ui.mediaDetailUrl.textContent = "Open file";
      } else {
        ui.mediaDetailUrl.href = "#";
        ui.mediaDetailUrl.textContent = "No file";
      }
    }
    if (ui.mediaDetailPreview) {
      if (!url) {
        ui.mediaDetailPreview.innerHTML = '<span class="muted">No preview available.</span>';
      } else if (mediaType.toLowerCase().includes("video")) {
        ui.mediaDetailPreview.innerHTML = `<video controls src="${escapeAttribute(url)}"></video>`;
      } else {
        ui.mediaDetailPreview.innerHTML = `<img src="${escapeAttribute(url)}" alt="" loading="lazy" />`;
      }
    }
  }

  async function renderCatalogMedia(item) {
    if (!ui.catalogMediaList) return;
    if (!CATALOG_ITEM_TABS.has(state.tab)) {
      ui.catalogMediaList.innerHTML = "";
      return;
    }
    const slug = item?.slug || "";
    if (!slug) {
      state.catalogMediaState = { items: [] };
      state.mediaLibraryItems = [];
      updateExistingMediaOptions([]);
      ui.catalogMediaList.innerHTML = `<div class="muted">Save this record before linking media.</div>`;
      return;
    }
    const mappingPath =
      state.tab === "products" ? "/product-media" : "/inspiration-media";
    const mappingParam =
      state.tab === "products" ? "product_slug" : "inspiration_slug";
    try {
      const [mediaLibrary, mappings] = await Promise.all([
        apiFetch("/media-library?limit=500&offset=0"),
        apiFetch(
          `${mappingPath}?${mappingParam}=${encodeURIComponent(slug)}&limit=500&offset=0`,
        ),
      ]);
      state.catalogMediaState = { items: mappings.items || [] };
      state.mediaLibraryItems = Array.isArray(mediaLibrary.items)
        ? mediaLibrary.items
        : [];
      updateExistingMediaOptions(state.mediaLibraryItems);
      const libraryMap = new Map(
        (mediaLibrary.items || []).map((entry) => [entry.media_id, entry]),
      );
      const sortedMappings = (mappings.items || []).slice().sort((a, b) => {
        const orderA = Number(a.sort_order || a.order || 0);
        const orderB = Number(b.sort_order || b.order || 0);
        if (orderA != orderB) return orderA - orderB;
        const idA = Number(a.id || 0);
        const idB = Number(b.id || 0);
        return idA - idB;
      });
      const cards = sortedMappings.map((mapping) => {
        const media = libraryMap.get(mapping.media_id) || {};
        const url = normalizeImageUrl(media.url || "");
        const isVideo = String(media.media_type || "")
          .toLowerCase()
          .startsWith("video");
        const mediaNode = isVideo
          ? `<video src="${escapeAttribute(url)}" controls></video>`
          : `<img src="${escapeAttribute(url)}" alt="">`;
        const position = mapping.position || "";
        const orderValue = String(mapping.sort_order || mapping.order || "");
        const orderDisplay = orderValue || "--";
        const primary = String(mapping.is_primary || "") === "1" ? "Yes" : "No";
        const isHero = String(mapping.position || "").toLowerCase() === "hero";
        const heroBadge = isHero
          ? `<span class="media-hero-badge">Hero</span>`
          : "";
        const labelValue = String(media.label || "");
        const positionOptions = buildSelectOptions(
          (state.catalogEnums || {}).media_positions || [],
          position,
          true,
          "Select",
        );
        return `
          <div class="catalog-media-item" data-position="${escapeAttribute(position)}" data-media-id="${escapeAttribute(
            mapping.media_id || "",
          )}">
            ${mediaNode}
            <div class="catalog-media-header">
              <div class="catalog-media-meta">${escapeHtml(mapping.media_id || "--")}</div>
              <details class="catalog-media-info">
                <summary aria-label="Media details">i</summary>
                <div class="catalog-media-info-content">
                  <div class="catalog-media-meta">${escapeHtml(media.label || media.description || "")}</div>
                  <div class="catalog-media-meta">Position: ${escapeHtml(position || "--")} · Order: ${escapeHtml(
                    orderDisplay,
                  )} · Primary: ${escapeHtml(primary)} ${heroBadge}</div>
                </div>
              </details>
            </div>
            <div class="catalog-media-controls">
              <div class="media-control-row">
                <label class="field field-inline">
                  <span>Order</span>
                  <input type="number" data-media-order value="${escapeAttribute(orderValue)}" />
                </label>
                <label class="field field-inline">
                  <span>Position</span>
                  <select data-media-position>${positionOptions}</select>
                </label>
                <label class="field field-inline">
                  <span>Hero</span>
                  <input type="checkbox" data-media-hero-toggle ${isHero ? "checked" : ""} />
                </label>
              </div>
              <div class="media-control-row">
                <label class="field field-inline media-label-field">
                  <span>Label</span>
                  <input type="text" data-media-label value="${escapeAttribute(labelValue)}" />
                </label>
                <label class="field field-inline media-description-field">
                  <span>Description</span>
                  <textarea rows="2" data-media-description>${escapeAttribute(mapping.description || "")}</textarea>
                </label>
              </div>
              <div class="media-control-row media-control-actions">
                <button class="btn btn-ghost btn-small" type="button" data-media-save data-mapping-id="${escapeAttribute(
                  mapping.id || mapping.row_number || "",
                )}">Save</button>
                <button class="btn btn-ghost btn-small" type="button" data-media-delete data-mapping-id="${escapeAttribute(
                  mapping.id || mapping.row_number || "",
                )}">Delete</button>
                <button class="btn btn-ghost btn-small" type="button" data-media-describe data-media-id="${escapeAttribute(
                  mapping.media_id || ""
                )}">Generate description</button>
              </div>
            </div>
          </div>
        `;
      });
      ui.catalogMediaList.innerHTML = cards.length
        ? cards.join("")
        : `<div class="muted">No media linked yet.</div>`;
    } catch (error) {
      state.catalogMediaState = { items: [] };
      state.mediaLibraryItems = [];
      updateExistingMediaOptions([]);
      ui.catalogMediaList.innerHTML = `<div class="muted">Unable to load media.</div>`;
    }
  }

  function updateExistingMediaOptions(items) {
    if (!ui.mediaId) return;
    const current = ui.mediaId.value || "";
    const options = ['<option value="">Select</option>'];
    (items || [])
      .slice()
      .sort((a, b) =>
        String(a.media_id || "").localeCompare(String(b.media_id || "")),
      )
      .forEach((entry) => {
        const mediaId = String(entry.media_id || "").trim();
        if (!mediaId) return;
        options.push(
          `<option value="${escapeAttribute(mediaId)}">${escapeHtml(mediaId)}</option>`,
        );
      });
    ui.mediaId.innerHTML = options.join("");
    if (current) ui.mediaId.value = current;
    renderMediaPreview(ui.mediaId.value || "");
  }

  function renderMediaPreview(mediaId) {
    if (!ui.mediaPreview) return;
    const items = Array.isArray(state.mediaLibraryItems)
      ? state.mediaLibraryItems
      : [];
    const match = items.find(
      (entry) => String(entry.media_id || "") === String(mediaId || ""),
    );
    if (!match || !mediaId) {
      ui.mediaPreview.innerHTML = `<span class="muted">Select a media item to preview.</span>`;
      return;
    }
    const url = normalizeImageUrl(match.url || "");
    if (!url) {
      ui.mediaPreview.innerHTML = `<span class="muted">No URL available for this media.</span>`;
      return;
    }
    const isVideo = String(match.media_type || "")
      .toLowerCase()
      .startsWith("video");
    ui.mediaPreview.innerHTML = isVideo
      ? `<video src="${escapeAttribute(url)}" controls></video>`
      : `<img src="${escapeAttribute(url)}" alt="${escapeAttribute(match.alt || match.label || "")}">`;
  }

  function getStoneRoleOptions(enums) {
    const roles = enums?.stone_roles;
    return Array.isArray(roles) && roles.length ? roles : DEFAULT_STONE_ROLES;
  }

  function getStoneSizeTypeOptions(enums) {
    const sizes = enums?.stone_size_types;
    return Array.isArray(sizes) && sizes.length
      ? sizes
      : DEFAULT_SIZE_TYPES;
  }

  function getMetalSizeTypeOptions(enums) {
    const sizes = enums?.metal_size_types;
    return Array.isArray(sizes) && sizes.length
      ? sizes
      : DEFAULT_SIZE_TYPES;
  }

  function getStoneShapeOptions(enums) {
    const shapes = enums?.stone_shapes;
    return Array.isArray(shapes) && shapes.length
      ? shapes
      : DEFAULT_STONE_SHAPES;
  }

  function buildSelectOptions(options, selected, includeEmpty, placeholder) {
    const safeSelected = String(selected || "");
    const items = [];
    if (includeEmpty) {
      items.push(
        `<option value="">${escapeHtml(placeholder || "Select")}</option>`,
      );
    }
    (options || []).forEach((option) => {
      const value = String(option.value || "");
      const label = String(option.label || option.value || "");
      const isSelected =
        safeSelected && value.toLowerCase() === safeSelected.toLowerCase();
      items.push(
        `<option value="${escapeAttribute(value)}"${isSelected ? " selected" : ""}>${escapeHtml(label)}</option>`,
      );
    });
    return items.join("");
  }

  function renderStoneOptionRow(entry, enums) {
    const roleOptions = getStoneRoleOptions(enums);
    const sizeOptions = getStoneSizeTypeOptions(enums);
    const shapeOptions = getStoneShapeOptions(enums);
    const isPrimary =
      String(entry.is_primary || entry.isPrimary || "") === "1" ||
      entry.is_primary === true;
    return `
      <div class="catalog-stone-row" data-stone-option-id="${escapeAttribute(entry.id || "")}">
        <div class="catalog-stone-grid">
          <label class="field">
            <span>Role</span>
            <select data-stone-field="role">
              ${buildSelectOptions(roleOptions, entry.role, true, "Select")}
            </select>
          </label>
          <label class="field">
            <span>Carat</span>
            <input type="number" step="0.01" min="0" data-stone-field="carat" value="${escapeAttribute(
              entry.carat ?? "",
            )}">
          </label>
          <label class="field">
            <span>Count</span>
            <input type="number" step="1" min="0" data-stone-field="count" value="${escapeAttribute(
              entry.count ?? "",
            )}">
          </label>
          <label class="field">
            <span>Size type</span>
            <select data-stone-field="size_type">
              ${buildSelectOptions(sizeOptions, entry.size_type, true, "Select")}
            </select>
          </label>
          <label class="field">
            <span>Shape</span>
            <select data-stone-field="shape">
              ${buildSelectOptions(shapeOptions, entry.shape, true, "Select")}
            </select>
          </label>
          <label class="field">
            <span>Primary</span>
            <select data-stone-field="is_primary">
              <option value="" ${isPrimary ? "" : "selected"}>No</option>
              <option value="1" ${isPrimary ? "selected" : ""}>Yes</option>
            </select>
          </label>
        </div>
        <div class="catalog-stone-actions">
          <button class="btn btn-ghost btn-small" type="button" data-stone-save>Save</button>
          <button class="btn btn-ghost btn-small" type="button" data-stone-delete>Delete</button>
        </div>
      </div>
    `;
  }

  function sortStoneOptionsBySize(items) {
    if (!Array.isArray(items)) return [];
    const sizeOrder = ["xsmall", "small", "medium", "large", "xlarge", "xxlarge"];
    const indexMap = new Map(sizeOrder.map((value, index) => [value, index]));
    return [...items].sort((a, b) => {
      const aKey = String(a.size_type || "").toLowerCase();
      const bKey = String(b.size_type || "").toLowerCase();
      const aIndex = indexMap.has(aKey) ? indexMap.get(aKey) : sizeOrder.length + 1;
      const bIndex = indexMap.has(bKey) ? indexMap.get(bKey) : sizeOrder.length + 1;
      if (aIndex !== bIndex) return aIndex - bIndex;
      const aRole = String(a.role || "");
      const bRole = String(b.role || "");
      if (aRole !== bRole) return aRole.localeCompare(bRole);
      const aCarat = Number(a.carat || 0);
      const bCarat = Number(b.carat || 0);
      if (!Number.isNaN(aCarat) && !Number.isNaN(bCarat) && aCarat !== bCarat) {
        return aCarat - bCarat;
      }
      return String(a.id || "").localeCompare(String(b.id || ""));
    });
  }

  function groupStoneOptionsBySize(items) {
    const sorted = sortStoneOptionsBySize(items);
    const groups = new Map();
    sorted.forEach((entry) => {
      const key = String(entry.size_type || "unspecified").toLowerCase() || "unspecified";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(entry);
    });
    return Array.from(groups.entries());
  }

  function getStoneOptionRowValues(row) {
    const read = (key) => {
      const field = row.querySelector(`[data-stone-field="${key}"]`);
      return field ? field.value.trim() : "";
    };
    return {
      role: read("role"),
      carat: read("carat"),
      count: read("count"),
      size_type: read("size_type"),
      shape: read("shape"),
      is_primary: read("is_primary"),
    };
  }

  async function renderCatalogStoneOptions(item) {
    if (!ui.catalogStoneList) return;
    if (!CATALOG_ITEM_TABS.has(state.tab)) {
      ui.catalogStoneList.innerHTML = "";
      return;
    }
    const catalogId = item?.id || "";
    if (!catalogId) {
      state.catalogStoneOptions = { items: [] };
      ui.catalogStoneList.innerHTML = `<div class="muted">Save this record before adding stone options.</div>`;
      return;
    }
    const params = new URLSearchParams();
    params.set("catalog_id", catalogId);
    try {
      const data = await apiFetch(
        `/catalog-stone-options?${params.toString()}`,
      );
      const items = Array.isArray(data.items) ? data.items : [];
      state.catalogStoneOptions = { items };
      const enums = state.catalogEnums || {};
      const grouped = groupStoneOptionsBySize(items);
      if (!grouped.length) {
        ui.catalogStoneList.innerHTML = `<div class="muted">No stone options yet.</div>`;
        return;
      }
      const sections = grouped.map(([sizeType, entries]) => {
        const label = sizeType === "unspecified" ? "Unspecified size" : sizeType.replace(/_/g, " ");
        const rows = entries.map((entry) => renderStoneOptionRow(entry, enums)).join("");
        return `
          <div class="stone-size-group" data-size-type="${escapeAttribute(sizeType)}">
            <div class="stone-size-header">${escapeHtml(label)}</div>
            <div class="stone-size-rows">${rows}</div>
          </div>
        `;
      });
      ui.catalogStoneList.innerHTML = sections.join("");
    } catch (error) {
      state.catalogStoneOptions = { items: [] };
      ui.catalogStoneList.innerHTML = `<div class="muted">Unable to load stone options.</div>`;
    }
  }

  function getStoneAddValues() {
    return {
      role: ui.stoneAddRole?.value.trim() || "",
      carat: ui.stoneAddCarat?.value.trim() || "",
      count: ui.stoneAddCount?.value.trim() || "",
      size_type: ui.stoneAddSizeType?.value.trim() || "",
      shape: ui.stoneAddShape?.value.trim() || "",
      is_primary: ui.stoneAddPrimary?.value || "",
    };
  }

  function resetStoneAddForm() {
    if (ui.stoneAddRole) ui.stoneAddRole.value = "";
    if (ui.stoneAddCarat) ui.stoneAddCarat.value = "";
    if (ui.stoneAddCount) ui.stoneAddCount.value = "";
    if (ui.stoneAddSizeType) ui.stoneAddSizeType.value = "";
    if (ui.stoneAddShape) ui.stoneAddShape.value = "";
    if (ui.stoneAddPrimary) ui.stoneAddPrimary.value = "";
  }

  async function addStoneOption() {
    if (!state.selectedItem) return;
    const catalogId = state.selectedItem.id || "";
    if (!catalogId) {
      showToast("Save the item before adding stone options.", "error");
      return;
    }
    const fields = getStoneAddValues();
    if (!fields.role || !fields.carat) {
      showToast("Role and carat are required.", "error");
      return;
    }
    try {
      await apiFetch("/catalog-stone-options/action", {
        method: "POST",
        body: JSON.stringify({
          action: "add_row",
          fields: {
            catalog_id: catalogId,
            ...fields,
          },
        }),
      });
      resetStoneAddForm();
      await renderCatalogStoneOptions(state.selectedItem);
      showToast("Stone option added.");
    } catch (error) {
      showToast("Unable to add stone option.", "error");
    }
  }

  async function saveStoneOption(row) {
    const id = row.getAttribute("data-stone-option-id") || "";
    if (!id) return;
    const fields = getStoneOptionRowValues(row);
    if (!fields.role || !fields.carat) {
      showToast("Role and carat are required.", "error");
      return;
    }
    try {
      await apiFetch("/catalog-stone-options/action", {
        method: "POST",
        body: JSON.stringify({
          action: "update",
          id,
          fields,
        }),
      });
      await renderCatalogStoneOptions(state.selectedItem);
      showToast("Stone option saved.");
    } catch (error) {
      showToast("Unable to save stone option.", "error");
    }
  }

  async function deleteStoneOption(row) {
    const id = row.getAttribute("data-stone-option-id") || "";
    if (!id) return;
    if (!confirm("Delete this stone option?")) return;
    try {
      await apiFetch("/catalog-stone-options/action", {
        method: "POST",
        body: JSON.stringify({ action: "delete", id }),
      });
      await renderCatalogStoneOptions(state.selectedItem);
      showToast("Stone option deleted.");
    } catch (error) {
      showToast("Unable to delete stone option.", "error");
    }
  }

  function renderMetalOptionRow(entry, enums) {
    const isPrimary =
      String(entry.is_primary || entry.isPrimary || "") === "1" ||
      entry.is_primary === true;
    const sizeOptions = getMetalSizeTypeOptions(enums || {});
    const sizeSelect = buildSelectOptions(
      sizeOptions,
      entry.size_type || "",
      true,
      "Select",
    );
    return `
      <div class="catalog-stone-row" data-metal-option-id="${escapeAttribute(entry.id || "")}">
        <div class="catalog-stone-grid">
          <label class="field">
            <span>Metal weight</span>
            <input type="number" step="0.01" min="0" data-metal-field="metal_weight" value="${escapeAttribute(
              entry.metal_weight ?? "",
            )}">
          </label>
          <label class="field">
            <span>Size type</span>
            <select data-metal-field="size_type">
              ${sizeSelect}
            </select>
          </label>
          <label class="field">
            <span>Primary</span>
            <select data-metal-field="is_primary">
              <option value="" ${isPrimary ? "" : "selected"}>No</option>
              <option value="1" ${isPrimary ? "selected" : ""}>Yes</option>
            </select>
          </label>
        </div>
        <div class="catalog-stone-actions">
          <button class="btn btn-ghost btn-small" type="button" data-metal-save>Save</button>
          <button class="btn btn-ghost btn-small" type="button" data-metal-delete>Delete</button>
        </div>
      </div>
    `;
  }

  function sortMetalOptionsBySize(items) {
    if (!Array.isArray(items)) return [];
    const sizeOrder = ["xsmall", "small", "medium", "large", "xlarge", "xxlarge"];
    const indexMap = new Map(sizeOrder.map((value, index) => [value, index]));
    return [...items].sort((a, b) => {
      const aKey = String(a.size_type || "").toLowerCase();
      const bKey = String(b.size_type || "").toLowerCase();
      const aIndex = indexMap.has(aKey) ? indexMap.get(aKey) : sizeOrder.length + 1;
      const bIndex = indexMap.has(bKey) ? indexMap.get(bKey) : sizeOrder.length + 1;
      if (aIndex !== bIndex) return aIndex - bIndex;
      const aWeight = Number(a.metal_weight || 0);
      const bWeight = Number(b.metal_weight || 0);
      if (!Number.isNaN(aWeight) && !Number.isNaN(bWeight) && aWeight !== bWeight) {
        return aWeight - bWeight;
      }
      return String(a.id || "").localeCompare(String(b.id || ""));
    });
  }

  function groupMetalOptionsBySize(items) {
    const sorted = sortMetalOptionsBySize(items);
    const groups = new Map();
    sorted.forEach((entry) => {
      const key = String(entry.size_type || "unspecified").toLowerCase() || "unspecified";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(entry);
    });
    return Array.from(groups.entries());
  }

  function getMetalOptionRowValues(row) {
    const read = (key) => {
      const field = row.querySelector(`[data-metal-field="${key}"]`);
      return field ? field.value.trim() : "";
    };
    return {
      metal_weight: read("metal_weight"),
      size_type: read("size_type"),
      is_primary: read("is_primary"),
    };
  }

  async function renderCatalogMetalOptions(item) {
    if (!ui.catalogMetalList) return;
    if (!CATALOG_ITEM_TABS.has(state.tab)) {
      ui.catalogMetalList.innerHTML = "";
      return;
    }
    const catalogId = item?.id || "";
    if (!catalogId) {
      state.catalogMetalOptions = { items: [] };
      ui.catalogMetalList.innerHTML = `<div class="muted">Save this record before adding metal options.</div>`;
      return;
    }
    const params = new URLSearchParams({ catalog_id: catalogId });
    try {
      const data = await apiFetch(
        `/catalog-metal-options?${params.toString()}`,
      );
      const items = Array.isArray(data.items) ? data.items : [];
      state.catalogMetalOptions = { items };
      const grouped = groupMetalOptionsBySize(items);
      if (!grouped.length) {
        ui.catalogMetalList.innerHTML = `<div class="muted">No metal options yet.</div>`;
        return;
      }
      const sections = grouped.map(([sizeType, entries]) => {
        const label = sizeType === "unspecified" ? "Unspecified size" : sizeType.replace(/_/g, " ");
        const rows = entries.map((entry) => renderMetalOptionRow(entry, state.catalogEnums)).join("");
        return `
          <div class="stone-size-group" data-size-type="${escapeAttribute(sizeType)}">
            <div class="stone-size-header">${escapeHtml(label)}</div>
            <div class="stone-size-rows">${rows}</div>
          </div>
        `;
      });
      ui.catalogMetalList.innerHTML = sections.join("");
    } catch (error) {
      state.catalogMetalOptions = { items: [] };
      ui.catalogMetalList.innerHTML = `<div class="muted">Unable to load metal options.</div>`;
    }
  }

  function getMetalAddValues() {
    return {
      metal_weight: ui.metalAddWeight?.value.trim() || "",
      size_type: ui.metalAddSizeType?.value.trim() || "",
      is_primary: ui.metalAddPrimary?.value || "",
    };
  }

  function resetMetalAddForm() {
    if (ui.metalAddWeight) ui.metalAddWeight.value = "";
    if (ui.metalAddSizeType) ui.metalAddSizeType.value = "";
    if (ui.metalAddPrimary) ui.metalAddPrimary.value = "";
  }

  async function addMetalOption() {
    if (!state.selectedItem) return;
    const catalogId = state.selectedItem.id || "";
    if (!catalogId) {
      showToast("Save the item before adding metal options.", "error");
      return;
    }
    const fields = getMetalAddValues();
    if (!fields.metal_weight) {
      showToast("Metal weight is required.", "error");
      return;
    }
    try {
      await apiFetch("/catalog-metal-options/action", {
        method: "POST",
        body: JSON.stringify({
          action: "add_row",
          fields: {
            catalog_id: catalogId,
            ...fields,
          },
        }),
      });
      resetMetalAddForm();
      await renderCatalogMetalOptions(state.selectedItem);
      showToast("Metal option added.");
    } catch (error) {
      showToast("Unable to add metal option.", "error");
    }
  }

  async function saveMetalOption(row) {
    const id = row.getAttribute("data-metal-option-id") || "";
    if (!id) return;
    const fields = getMetalOptionRowValues(row);
    if (!fields.metal_weight) {
      showToast("Metal weight is required.", "error");
      return;
    }
    try {
      await apiFetch("/catalog-metal-options/action", {
        method: "POST",
        body: JSON.stringify({
          action: "update",
          id,
          fields,
        }),
      });
      await renderCatalogMetalOptions(state.selectedItem);
      showToast("Metal option saved.");
    } catch (error) {
      showToast("Unable to save metal option.", "error");
    }
  }

  async function deleteMetalOption(row) {
    const id = row.getAttribute("data-metal-option-id") || "";
    if (!id) return;
    if (!confirm("Delete this metal option?")) return;
    try {
      await apiFetch("/catalog-metal-options/action", {
        method: "POST",
        body: JSON.stringify({ action: "delete", id }),
      });
      await renderCatalogMetalOptions(state.selectedItem);
      showToast("Metal option deleted.");
    } catch (error) {
      showToast("Unable to delete metal option.", "error");
    }
  }

  function getNoteEditor(kind) {
    return (
      ui.noteEditors.find((editor) => editor.dataset.noteEditor === kind) ||
      null
    );
  }

  function getNoteRowsContainer(kind) {
    return (
      ui.noteRows.find((container) => container.dataset.noteRows === kind) ||
      null
    );
  }

  function getNoteInput(kind) {
    return (
      ui.noteInputs.find((input) => input.dataset.noteInput === kind) || null
    );
  }

  function getNoteOrderInput(kind) {
    return (
      ui.noteOrders.find((input) => input.dataset.noteOrder === kind) || null
    );
  }

  function setNoteEditor(kind, note) {
    const editor = getNoteEditor(kind);
    if (!editor) return;
    editor.value = note?.note || "";
    editor.dataset.noteId = note?.id || "";
  }

  function renderNoteRows(kind, notes) {
    const container = getNoteRowsContainer(kind);
    if (!container) return;
    if (!notes.length) {
      container.innerHTML = `<div class="muted">No notes yet.</div>`;
      return;
    }
    container.innerHTML = notes
      .map(
        (note) => `
        <div class="note-row" data-note-id="${escapeAttribute(note.id || "")}">
          <input type="text" data-note-field="note" value="${escapeAttribute(note.note || "")}" />
          <input type="number" data-note-field="sort_order" value="${escapeAttribute(
            note.sort_order || "0",
          )}" />
          <div class="note-actions">
            <button class="btn btn-ghost btn-small" type="button" data-note-row-save>Save</button>
            <button class="btn btn-ghost btn-small" type="button" data-note-row-delete>Delete</button>
          </div>
        </div>
      `,
      )
      .join("");
  }

  async function renderCatalogNotes(item) {
    if (!ui.catalogNotesSection) return;
    const catalogId = item?.id || "";
    const catalogSlug = item?.slug || "";
    if (!catalogId) {
      ui.noteEditors.forEach((editor) => {
        editor.value = "";
        editor.dataset.noteId = "";
        editor.disabled = true;
      });
      ui.noteInputs.forEach((input) => {
        input.value = "";
        input.disabled = true;
      });
      ui.noteOrders.forEach((input) => {
        input.value = "";
        input.disabled = true;
      });
      NOTE_KINDS_LIST.forEach((kind) => {
        const container = getNoteRowsContainer(kind);
        if (container) {
          container.innerHTML = `<div class="muted">Save this record before adding notes.</div>`;
        }
      });
      return;
    }
    ui.noteEditors.forEach((editor) => {
      editor.disabled = false;
    });
    ui.noteInputs.forEach((input) => {
      input.disabled = false;
    });
    ui.noteOrders.forEach((input) => {
      input.disabled = false;
    });
    const params = new URLSearchParams({ catalog_id: catalogId });
    if (catalogSlug) params.set("catalog_slug", catalogSlug);
    try {
      const data = await apiFetch(`/catalog-notes?${params.toString()}`);
      const items = Array.isArray(data.items) ? data.items : [];
      state.catalogNotes = items;
      NOTE_KINDS_SINGLE.forEach((kind) => {
        const note = items.find((entry) => String(entry.kind || "") === kind);
        setNoteEditor(kind, note || null);
      });
      NOTE_KINDS_LIST.forEach((kind) => {
        const list = items.filter((entry) => String(entry.kind || "") === kind);
        renderNoteRows(kind, list);
      });
    } catch (error) {
      state.catalogNotes = [];
      NOTE_KINDS_SINGLE.forEach((kind) => setNoteEditor(kind, null));
      NOTE_KINDS_LIST.forEach((kind) => renderNoteRows(kind, []));
    }
  }

  async function saveSingleNote(kind) {
    if (!state.selectedItem) return;
    const editor = getNoteEditor(kind);
    if (!editor) return;
    const noteText = editor.value.trim();
    const noteId = editor.dataset.noteId || "";
    const catalogId = state.selectedItem.id || "";
    const catalogSlug = state.selectedItem.slug || "";
    if (!catalogId) {
      showToast("Save the item before adding notes.", "error");
      return;
    }
    if (!noteText) {
      if (!noteId) return;
      if (!confirm("Delete this note?")) return;
      try {
        await apiFetch("/catalog-notes/action", {
          method: "POST",
          body: JSON.stringify({ action: "delete", id: noteId }),
        });
        editor.value = "";
        editor.dataset.noteId = "";
        showToast("Note removed.");
      } catch (error) {
        showToast("Unable to delete note.", "error");
      }
      return;
    }
    const payload = noteId
      ? {
          action: "update",
          id: noteId,
          fields: { note: noteText, sort_order: "0" },
        }
      : {
          action: "add_row",
          fields: {
            catalog_id: catalogId,
            catalog_slug: catalogSlug,
            kind,
            note: noteText,
            sort_order: "0",
          },
        };
    try {
      const result = await apiFetch("/catalog-notes/action", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!noteId && result.id) {
        editor.dataset.noteId = result.id;
      }
      showToast("Note saved.");
    } catch (error) {
      showToast("Unable to save note.", "error");
    }
  }

  async function saveNoteRow(row) {
    const id = row.getAttribute("data-note-id") || "";
    if (!id) return;
    const noteField = row.querySelector('[data-note-field="note"]');
    const orderField = row.querySelector('[data-note-field="sort_order"]');
    const noteText = noteField ? noteField.value.trim() : "";
    const sortOrder = orderField ? orderField.value.trim() : "";
    if (!noteText) {
      showToast("Note text is required.", "error");
      return;
    }
    try {
      await apiFetch("/catalog-notes/action", {
        method: "POST",
        body: JSON.stringify({
          action: "update",
          id,
          fields: {
            note: noteText,
            sort_order: sortOrder || "0",
          },
        }),
      });
      showToast("Note updated.");
    } catch (error) {
      showToast("Unable to save note.", "error");
    }
  }

  async function deleteNoteRow(row) {
    const id = row.getAttribute("data-note-id") || "";
    if (!id) return;
    if (!confirm("Delete this note?")) return;
    try {
      await apiFetch("/catalog-notes/action", {
        method: "POST",
        body: JSON.stringify({ action: "delete", id }),
      });
      await renderCatalogNotes(state.selectedItem);
      showToast("Note deleted.");
    } catch (error) {
      showToast("Unable to delete note.", "error");
    }
  }

  async function addListNote(kind) {
    if (!state.selectedItem) return;
    const catalogId = state.selectedItem.id || "";
    const catalogSlug = state.selectedItem.slug || "";
    if (!catalogId) {
      showToast("Save the item before adding notes.", "error");
      return;
    }
    const input = getNoteInput(kind);
    if (!input) return;
    const noteText = input.value.trim();
    if (!noteText) {
      showToast("Note text is required.", "error");
      return;
    }
    const orderInput = getNoteOrderInput(kind);
    const sortOrder = orderInput ? orderInput.value.trim() : "";
    try {
      await apiFetch("/catalog-notes/action", {
        method: "POST",
        body: JSON.stringify({
          action: "add_row",
          fields: {
            catalog_id: catalogId,
            catalog_slug: catalogSlug,
            kind,
            note: noteText,
            sort_order: sortOrder || "0",
          },
        }),
      });
      input.value = "";
      if (orderInput) orderInput.value = "";
      await renderCatalogNotes(state.selectedItem);
      showToast("Note added.");
    } catch (error) {
      showToast("Unable to add note.", "error");
    }
  }

  function getCatalogSlug() {
    return state.selectedItem?.slug || "";
  }

  function getCatalogMappingEndpoint() {
    return state.tab === "products"
      ? "/product-media/action"
      : "/inspiration-media/action";
  }

  function getCatalogMappingPayload(mediaId, position, order, isPrimary) {
    const slug = getCatalogSlug();
    if (!slug) return null;
    const fields =
      state.tab === "products"
        ? {
            product_slug: slug,
            media_id: mediaId,
            position,
            order,
            is_primary: isPrimary,
          }
        : {
            inspiration_slug: slug,
            media_id: mediaId,
            position,
            order,
            is_primary: isPrimary,
          };
    return { action: "add_row", fields };
  }

  async function linkExistingMedia() {
    const mediaId = ui.mediaId?.value.trim();
    if (!mediaId) {
      showToast("Add a media ID first.", "error");
      return;
    }
    const position = ui.mediaPositionExisting?.value.trim() || "";
    const order = ui.mediaOrderExisting?.value.trim() || "";
    if (!position) {
      showToast("Choose a media position.", "error");
      return;
    }
    const isPrimary = ui.mediaPrimaryExisting?.value || "";
    if (order && Number.isNaN(Number(order))) {
      showToast("Order must be a number.", "error");
      return;
    }
    const payload = getCatalogMappingPayload(
      mediaId,
      position,
      order,
      isPrimary,
    );
    if (!payload) {
      showToast("Save the record before linking media.", "error");
      return;
    }
    const result = await apiFetch(getCatalogMappingEndpoint(), {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!result.ok) {
      showToast("Linking failed.", "error");
      return;
    }
    showToast("Media linked");
    renderCatalogMedia(state.selectedItem);
  }

  async function uploadAndLinkMedia() {
    const file = ui.mediaFile?.files?.[0];
    if (!file) {
      showToast("Choose a file first.", "error");
      return;
    }
    const label = ui.mediaLabel?.value.trim() || "";
    const alt = ui.mediaAlt?.value.trim() || "";
    const description = ui.mediaDescription?.value.trim() || "";
    const position = ui.mediaPosition?.value.trim() || "";
    const order = ui.mediaOrder?.value.trim() || "";
    const isPrimary = ui.mediaPrimary?.value || "";
    if (order && Number.isNaN(Number(order))) {
      showToast("Order must be a number.", "error");
      return;
    }
    if (!position) {
      showToast("Choose a media position.", "error");
      return;
    }
    try {
      const resolvedBase = getApiBase();
      const base = resolvedBase.endsWith("/")
        ? resolvedBase
        : `${resolvedBase}/`;
      const localEmail = isLocalApi(base) ? getStoredAdminEmail() : "";
      const formData = new FormData();
      formData.append("file", file);
      if (label) formData.append("label", label);
      const uploadUrl = new URL("media/upload", base);
      addLocalAdminQuery(uploadUrl, base, localEmail);
      const uploadResponse = await fetch(uploadUrl.toString(), {
        method: "POST",
        credentials: isLocalApi(base) ? "omit" : "include",
        body: formData,
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResult.ok) throw new Error("upload_failed");
      const media = uploadResult.media || {};
      const createdAt = new Date().toISOString();
      await apiFetch("/media-library/action", {
        method: "POST",
        body: JSON.stringify({
          action: "add_row",
          fields: {
            media_id: media.media_id,
            url: media.url,
            media_type: media.media_type || "image",
            label,
            alt,
            description,
            created_at: createdAt,
          },
        }),
      });
      const mappingPayload = getCatalogMappingPayload(
        media.media_id,
        position,
        order,
        isPrimary,
      );
      if (mappingPayload) {
        await apiFetch(getCatalogMappingEndpoint(), {
          method: "POST",
          body: JSON.stringify(mappingPayload),
        });
      }
      showToast("Media uploaded");
      renderCatalogMedia(state.selectedItem);
      if (ui.mediaFile) ui.mediaFile.value = "";
    } catch (error) {
      showToast("Upload failed.", "error");
    }
  }

  async function setMediaAsHero(mappingId) {
    if (!mappingId) return;
    try {
      await apiFetch(getCatalogMappingEndpoint(), {
        method: "POST",
        body: JSON.stringify({
          action: "edit",
          rowNumber: mappingId,
          fields: {
            position: "hero",
            is_primary: "1",
            sort_order: "0",
          },
        }),
      });
      showToast("Hero media updated.");
      renderCatalogMedia(state.selectedItem);
    } catch (error) {
      showToast("Unable to set hero media.", "error");
    }
  }

  async function saveMediaMapping(mappingId, row) {
    if (!mappingId || !row) return;
    const orderInput = row.querySelector("[data-media-order]");
    const positionSelect = row.querySelector("[data-media-position]");
    const heroToggle = row.querySelector("[data-media-hero-toggle]");
    const labelInput = row.querySelector("[data-media-label]");
    const descriptionInput = row.querySelector("[data-media-description]");
    const orderValue = orderInput ? orderInput.value.trim() : "";
    if (orderValue && Number.isNaN(Number(orderValue))) {
      showToast("Order must be a number.", "error");
      return;
    }
    const originalPosition = row.dataset.position || "";
    const positionValue = positionSelect ? positionSelect.value.trim() : "";
    const heroChecked = heroToggle ? heroToggle.checked : false;
    const forceHero = String(positionValue || "").toLowerCase() === "hero";
    const heroSelected = heroChecked || forceHero;
    let position = heroSelected ? "hero" : positionValue || originalPosition;
    if (
      !heroSelected &&
      String(originalPosition || "").toLowerCase() === "hero"
    ) {
      position = "";
    }
    try {
      const mediaId = row.dataset.mediaId || "";
      if (mediaId && (labelInput || descriptionInput)) {
        await apiFetch("/media-library/action", {
          method: "POST",
          body: JSON.stringify({
            action: "edit",
            rowNumber: mediaId,
            fields: {
              label: labelInput ? labelInput.value.trim() : undefined,
              description: descriptionInput ? descriptionInput.value.trim() : undefined,
            },
          }),
        });
      }
      await apiFetch(getCatalogMappingEndpoint(), {
        method: "POST",
        body: JSON.stringify({
          action: "edit",
          rowNumber: mappingId,
          fields: {
            position,
            is_primary: heroSelected ? "1" : "0",
            sort_order: orderValue,
          },
        }),
      });
      showToast("Media updated.");
      renderCatalogMedia(state.selectedItem);
    } catch (error) {
      showToast("Unable to update media.", "error");
    }
  }

  async function describeMedia(mediaId, row) {
    const button = row?.querySelector("[data-media-describe]");
    if (button) {
      button.disabled = true;
      button.textContent = "Generating...";
    }
    try {
      const result = await apiFetch("/media/describe", {
        method: "POST",
        body: JSON.stringify({ media_id: mediaId }),
      });
      if (!result?.ok) {
        showToast(result?.error || "Failed to generate description.", "error");
        return;
      }
      const descriptionInput = row?.querySelector("[data-media-description]");
      if (descriptionInput) {
        descriptionInput.value = result.description || "";
      }
      showToast("Description generated. Review and click Save to store.", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to generate description.", "error");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Generate description";
      }
    }
  }

  async function deleteMediaMapping(mappingId) {
    if (!mappingId) return;
    if (!window.confirm("Delete this media?")) return;
    try {
      await apiFetch(getCatalogMappingEndpoint(), {
        method: "POST",
        body: JSON.stringify({
          action: "delete",
          rowNumber: mappingId,
          delete_media: true,
        }),
      });
      showToast("Media deleted.");
      renderCatalogMedia(state.selectedItem);
    } catch (error) {
      showToast("Unable to delete media.", "error");
    }
  }

  function applyOrderDetailsVisibility() {
    if (!ui.orderDetailsSection) return;
    const show = state.tab === "orders";
    ui.orderDetailsSection.classList.toggle("is-hidden", !show);
  }

  function isGoldOnlyQuote() {
    if (state.tab !== "quotes") return false;
    const stoneWeight = Number(getEditValue("stone_weight"));
    const diamondBreakdown = getEditValue("diamond_breakdown");
    const hasBreakdown = Boolean(String(diamondBreakdown || "").trim());
    return (!Number.isFinite(stoneWeight) || stoneWeight <= 0) && !hasBreakdown;
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
    const optionCards = Array.from(
      document.querySelectorAll(".quote-option-card"),
    );
    optionCards.forEach((card, index) => {
      if (index === 0) {
        card.classList.toggle("is-hidden", false);
      } else {
        card.classList.toggle("is-hidden", goldOnly);
      }
    });
    toggleFieldVisibility("quote_option_1_clarity", !goldOnly);
    toggleFieldVisibility("quote_option_1_color", !goldOnly);
    if (goldOnly) {
      QUOTE_OPTION_FIELDS.forEach((_, index) => {
        if (index > 0) setOptionStatus(index, "idle");
      });
    }
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
    if (ui.sizeBlock && state.tab !== "quotes") {
      ui.sizeBlock.classList.add("is-hidden");
    }
    if (ui.quoteExtras) {
      ui.quoteExtras.classList.toggle("is-hidden", state.tab === "quotes");
    }
    if (ui.notesToggle) {
      ui.notesToggle.open = state.tab !== "quotes";
    }
    if (ui.summaryMore) {
      ui.summaryMore.classList.toggle("is-hidden", state.tab !== "quotes");
    }
    if (ui.summaryPriceRow) {
      ui.summaryPriceRow.classList.toggle("is-hidden", state.tab === "quotes");
    }
    relocateActivityForQuotes();
  }

  function relocateActivityForQuotes() {
    if (!ui.activitySection || !ui.activitySlot) return;
    if (state.tab === "quotes") {
      if (!ui.activitySection.dataset.originalParent) {
        ui.activitySection.dataset.originalParent = "detail-main";
      }
      ui.activitySlot.appendChild(ui.activitySection);
    } else if (ui.activitySection.dataset.originalParent === "detail-main") {
      const main = document.querySelector(".detail-main");
      if (main && !main.contains(ui.activitySection)) {
        main.insertBefore(ui.activitySection, main.firstChild);
      }
    }
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
    const field = ui.orderDetailsFields.find(
      (input) => input.dataset.orderDetailsField === key,
    );
    return field ? field.value.trim() : "";
  }

  function getOrderDetailsField(key) {
    return ui.orderDetailsFields.find(
      (input) => input.dataset.orderDetailsField === key,
    );
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
    if (state.selectedItem) {
      updateSummaryCard(state.selectedItem);
    }
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
    const isQuoteOrOrder = state.tab === "quotes" || state.tab === "orders";
    const isQuote = state.tab === "quotes";
    if (ui.summaryQuoteBlock) {
      ui.summaryQuoteBlock.classList.toggle("is-hidden", !isQuoteOrOrder);
    }
    if (ui.summaryPreferencesBlock) {
      ui.summaryPreferencesBlock.classList.toggle("is-hidden", !isQuoteOrOrder);
    }
    if (ui.summaryOptionsBlock) {
      ui.summaryOptionsBlock.classList.toggle("is-hidden", !isQuote);
    }
    if (ui.summaryNotesBlock) {
      ui.summaryNotesBlock.classList.toggle("is-hidden", !isQuoteOrOrder);
    }
    if (ui.summarySizesBlock) {
      ui.summarySizesBlock.classList.toggle("is-hidden", !isQuote);
    }
    if (ui.summaryStatus) {
      ui.summaryStatus.textContent = status;
      ui.summaryStatus.dataset.status = status;
    }
    if (ui.summaryProduct)
      ui.summaryProduct.textContent = item.product_name || "--";
    if (ui.summaryDesignCode)
      ui.summaryDesignCode.textContent = item.design_code || "--";
    if (ui.summaryRequest)
      ui.summaryRequest.textContent = item.request_id || "--";
    if (ui.summaryCreated)
      ui.summaryCreated.textContent = formatDate(item.created_at) || "--";
    if (ui.summaryPrice)
      ui.summaryPrice.textContent = formatPrice(item.price) || "--";
    if (ui.summaryTimeline)
      ui.summaryTimeline.textContent =
        formatTimelineValue(item.timeline) || "--";
    if (ui.summaryTimelineDelay) {
      const delayText = formatDelayWeeks(item.timeline_adjustment_weeks);
      ui.summaryTimelineDelay.textContent = delayText || "--";
    }
    const stoneValue = item.stone || (state.orderDetails && state.orderDetails.stone) || "";
    const stoneWeightValue =
      item.stone_weight ||
      (state.orderDetails && state.orderDetails.stone_weight) ||
      "";
    if (ui.summaryMetal) ui.summaryMetal.textContent = item.metal || "--";
    if (ui.summaryStone) ui.summaryStone.textContent = stoneValue || "--";
    if (ui.summaryStoneWeight) {
      ui.summaryStoneWeight.textContent =
        formatStoneWeight(stoneWeightValue) || "--";
    }
    if (ui.summaryMetalWeight) {
      ui.summaryMetalWeight.textContent =
        formatGrams(item.metal_weight) || "--";
    }
    if (ui.summaryMetalAdjustment) {
      ui.summaryMetalAdjustment.textContent =
        formatSignedGrams(item.metal_weight_adjustment) || "--";
    }
    if (ui.summaryDiamondBreakdown) {
      ui.summaryDiamondBreakdown.textContent = item.diamond_breakdown || "--";
    }
    if (ui.summaryDiscount) {
      const type = String(item.quote_discount_type || "").trim();
      const percent = String(item.quote_discount_percent || "").trim();
      if (type && percent) {
        ui.summaryDiscount.textContent = `${type} ${percent}%`;
      } else if (type) {
        ui.summaryDiscount.textContent = type;
      } else if (percent) {
        ui.summaryDiscount.textContent = `${percent}%`;
      } else {
        ui.summaryDiscount.textContent = "--";
      }
    }
    if (ui.summaryInterests) {
      ui.summaryInterests.textContent = item.interests || "--";
    }
    if (ui.summaryContactPreference) {
      ui.summaryContactPreference.textContent = item.contact_preference || "--";
    }
    if (ui.summarySubscription) {
      ui.summarySubscription.textContent = item.subscription_status || "--";
    }
    if (ui.summaryCustomerNotes) {
      ui.summaryCustomerNotes.textContent =
        item.customer_notes || item.request_notes || "--";
    }
    if (ui.summaryOption1) {
      ui.summaryOption1.textContent =
        formatPrice(item.quote_option_1_price_18k) || "--";
    }
    if (ui.summaryOption2) {
      ui.summaryOption2.textContent =
        formatPrice(item.quote_option_2_price_18k) || "--";
    }
    if (ui.summaryOption3) {
      ui.summaryOption3.textContent =
        formatPrice(item.quote_option_3_price_18k) || "--";
    }
    [ui.summaryOption1, ui.summaryOption2, ui.summaryOption3].forEach(
      (node, index) => {
        if (!node) return;
        const row = node.closest(".summary-line");
        if (!row) return;
        row.classList.toggle(
          "is-recommended",
          state.recommendedOptionIndex === index,
        );
      },
    );
    if (ui.summaryOptionRecommended) {
      const recLabel =
        state.recommendedOptionIndex === null
          ? "--"
          : `Option ${state.recommendedOptionIndex + 1}`;
      ui.summaryOptionRecommended.textContent = recLabel;
    }
    if (ui.summaryLastPriced) {
      ui.summaryLastPriced.textContent = resolveLastPricedLabel();
    }
    if (ui.summarySizeRing) {
      ui.summarySizeRing.textContent = ui.sizeRing?.value?.trim() || "--";
    }
    if (ui.summarySizeBracelet) {
      ui.summarySizeBracelet.textContent =
        ui.sizeBracelet?.value?.trim() || "--";
    }
    if (ui.summarySizeChain) {
      ui.summarySizeChain.textContent = ui.sizeChain?.value?.trim() || "--";
    }
    if (ui.summaryCustomer) ui.summaryCustomer.textContent = item.name || "--";
    if (ui.summaryEmail) ui.summaryEmail.textContent = item.email || "--";
    if (ui.summaryPhone) ui.summaryPhone.textContent = formatPhone(item.phone);
    if (ui.summaryAddress)
      ui.summaryAddress.textContent = buildSummaryAddress(item);
  }

  function buildMissingChip(label, selector) {
    return `<button class="chip missing-chip" type="button" data-focus-target='${selector}'>${label}</button>`;
  }

  function buildWarningChip(label, selector) {
    return `<button class="chip is-warning" type="button" data-focus-target='${selector}'>${label}</button>`;
  }

  function refreshMissingInfo() {
    if (!ui.missingList) return;
    let chips = [];
    if (state.tab === "media-library") {
      ui.missingList.innerHTML =
        '<span class="muted">No missing details.</span>';
      updateNextActionText();
      return;
    }
    if (CATALOG_TABS.has(state.tab)) {
      const formState = collectCatalogFormState();
      if (window.CatalogUtils) {
        const enums = state.catalogEnums || {};
        const normalized = window.CatalogUtils.normalizeCatalogItem(
          formState,
          enums,
        );
        state.catalogFormState = normalized.normalized;
        state.catalogValidation = window.CatalogUtils.validateCatalogItem(
          normalized.normalized,
          enums,
          state.catalogMediaState,
        );
        const missing = state.catalogValidation.missingCritical || [];
        const warnings = state.catalogValidation.warnings || [];
        chips = [
          ...missing.map((entry) =>
            buildMissingChip(entry.message, entry.selector || ""),
          ),
          ...warnings.map((entry) =>
            buildWarningChip(entry.message, `[data-field="${entry.field}"]`),
          ),
        ];
      }
      ui.missingList.innerHTML = chips.length
        ? chips.join("")
        : '<span class="muted">No missing details.</span>';
      updateNextActionText();
      return;
    }
    if (state.tab === "quotes") {
      const basePayload = collectBasePricingPayload();
      chips = computeMissingCriticalInfo(basePayload);
    } else {
      const metalWeight = getEditValue("metal_weight");
      if (!metalWeight) {
        chips.push(
          buildMissingChip(
            "Metal weight missing",
            '[data-field="metal_weight"]',
          ),
        );
      }
      const stoneWeight = getEditValue("stone_weight");
      if (!stoneWeight) {
        chips.push(
          buildMissingChip(
            "Stone weight missing",
            '[data-field="stone_weight"]',
          ),
        );
      }
      const stoneValue = getEditValue("stone").toLowerCase();
      const breakdownValue = getEditValue("diamond_breakdown");
      const isDiamond = DIAMOND_TERMS.some((term) => stoneValue.includes(term));
      if (isDiamond && !breakdownValue) {
        chips.push(
          buildMissingChip(
            "Diamond breakdown empty",
            '[data-field="diamond_breakdown"]',
          ),
        );
      }
      const shippingStatus =
        getOrderDetailsValue("shipping_status").toLowerCase();
      const trackingNumber = getOrderDetailsValue("tracking_number");
      if (TRACKING_REQUIRED_STATUSES.has(shippingStatus) && !trackingNumber) {
        chips.push(
          buildMissingChip(
            "Tracking # required for shipping",
            '[data-order-details-field="tracking_number"]',
          ),
        );
      }
      const etaValue = getOrderDetailsValue("delivery_eta");
      if (etaValue && !/^\d{4}-\d{2}-\d{2}$/.test(etaValue)) {
        chips.push(
          buildMissingChip(
            "Delivery ETA needs YYYY-MM-DD",
            '[data-order-details-field="delivery_eta"]',
          ),
        );
      }
    }
    ui.missingList.innerHTML = chips.length
      ? chips.join("")
      : '<span class="muted">No missing details.</span>';
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
    const baseValue =
      getEditValue("price") || getEditValue("quote_option_1_price_18k");
    const base = Number(baseValue);
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
    updateOptionFinals();
  }

  function buildSummaryText(item) {
    if (!item) return "";
    const lines = [
      `Order: ${item.request_id || "--"}`,
      `Created: ${formatDate(item.created_at) || "--"}`,
      `Status: ${normalizeStatus(item.status)}`,
      `Product: ${item.product_name || "--"} (${item.design_code || "--"})`,
      `Specs: ${item.metal || "--"} / ${item.stone || "--"} ${formatStoneWeight(
        item.stone_weight,
      )}`,
      `Price: ${formatPrice(item.price) || "--"}`,
      `Timeline: ${formatTimelineValue(item.timeline) || "--"} ${
        formatDelayWeeks(item.timeline_adjustment_weeks) || ""
      }`,
      `Customer: ${item.name || "--"} (${item.email || "--"} / ${formatPhone(item.phone)})`,
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
    const finalValue =
      (hasWeight ? weight : 0) + (hasAdjustment ? adjustment : 0);
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
        weightValue && !numberPattern.test(weightValue)
          ? "Enter a valid weight"
          : "";
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
      return (
        String(getOrderDetailsValue(key)) !==
        String(state.orderDetails[key] || "")
      );
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
    if (state.tab === "orders" && state.dirtySections.fulfillment) {
      parts.push("Unsaved fulfillment");
    }
    const text = parts.length ? parts.join(" / ") : "All changes saved";
    ui.dirtyIndicator.textContent = text;
    ui.dirtyIndicator.classList.toggle("is-dirty", parts.length > 0);
    updateNextActionText();
  }

  // Mark current form as dirty and refresh related controls.
  function markDirty(section = "edits") {
    if (section === "fulfillment") {
      updateFulfillmentDirty();
      return;
    }
    updatePrimaryActionState();
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
    if (state.tab === "quotes") {
      const gate = getQuotePricingGateState();
      if (gate.blocked && gate.reason) {
        ui.nextActionText.textContent = gate.reason;
        return;
      }
    }
    if (state.criticalDirty) {
      ui.nextActionText.textContent =
        "Critical edits pending. Save before actions.";
      return;
    }
    if (state.dirtySections.fulfillment) {
      ui.nextActionText.textContent =
        "Save fulfillment details to keep tracking current.";
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
      now.getHours(),
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
    if (state.tab === "quotes") {
      const gate = getQuotePricingGateState();
      ui.actionRun.disabled = disabled || gate.blocked;
      updatePricingSummaryStatus(gate);
      return;
    }
    if (CATALOG_ITEM_TABS.has(state.tab)) {
      const missing = state.catalogValidation?.missingCritical?.length || 0;
      const isDelete = ui.actionSelect.value === "delete";
      ui.actionRun.disabled =
        disabled || (isDelete && (missing > 0 || state.dirtySections.edits));
      return;
    }
    ui.actionRun.disabled = disabled;
  }

  function updatePricingSummaryStatus(gateState) {
    if (!ui.summaryPricingStatus) return;
    if (state.tab !== "quotes") {
      ui.summaryPricingStatus.textContent = "--";
      return;
    }
    const gate = gateState || getQuotePricingGateState();
    if (gate.reason === "Pricing in progress") {
      ui.summaryPricingStatus.textContent = "Pricing...";
      return;
    }
    if (gate.reason === "Missing pricing inputs") {
      ui.summaryPricingStatus.textContent = "Missing inputs";
      return;
    }
    if (gate.reason === "Pricing stale") {
      ui.summaryPricingStatus.textContent = "Stale";
      return;
    }
    if (gate.reason === "No active options") {
      ui.summaryPricingStatus.textContent = "No active options";
      return;
    }
    ui.summaryPricingStatus.textContent = "Current";
  }

  function getQuotePricingGateState() {
    if (state.tab !== "quotes") return { blocked: false, reason: "" };
    const basePayload = collectBasePricingPayload();
    const missing = computeMissingCriticalInfo(basePayload);
    const activeOptions = QUOTE_OPTION_FIELDS.map((_, index) => index).filter(
      (index) => isOptionActive(index),
    );
    const statuses = activeOptions.map(
      (index) => quotePricingState.options[index]?.status || "idle",
    );
    const anyPricing = statuses.some((status) => status === "pricing");
    const allPriced =
      activeOptions.length > 0 &&
      statuses.every((status) => status === "priced" || status === "manual");
    const blocked =
      missing.length > 0 ||
      anyPricing ||
      !allPriced ||
      activeOptions.length === 0;
    let reason = "";
    if (missing.length) {
      reason = "Missing pricing inputs";
    } else if (anyPricing) {
      reason = "Pricing in progress";
    } else if (!allPriced) {
      reason = "Pricing stale";
    } else if (activeOptions.length === 0) {
      reason = "No active options";
    }
    return { blocked, reason };
  }

  function renderActions() {
    const canEdit = canEditCurrentTab();
    const actions =
      state.tab === "orders" && state.selectedItem
        ? ACTIONS.orders.filter((action) => {
            if (action.action === "delete") return true;
            return (
              ORDER_ACTION_FLOW[normalizeStatus(state.selectedItem.status)] ||
              []
            ).includes(action.action);
          })
        : ACTIONS[state.tab];
    if (ui.actionSelect) {
      ui.actionSelect.innerHTML =
        '<option value="">Select an action</option>' +
        actions
          .map(
            (action) =>
              `<option value="${action.action}">${action.label}</option>`,
          )
          .join("");
      ui.actionSelect.disabled = !canEdit || actions.length === 0;
    }
    if (ui.actionRun) {
      ui.actionRun.disabled =
        !canEdit || !ui.actionSelect || !ui.actionSelect.value;
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
    if (ui.goldRefresh) {
      const isGold =
        state.tab === "cost-chart" &&
        state.selectedItem &&
        (state.selectedItem.key === "gold_price_per_gram_usd" ||
          state.selectedItem.key === "gold-price-per-gram-usd");
      ui.goldRefresh.classList.toggle("is-hidden", !isGold);
      ui.goldRefresh.disabled = !canEdit || !isGold;
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
    if (ui.catalogFields) {
      ui.catalogFields
        .querySelectorAll("input,textarea,select")
        .forEach((field) => {
          field.disabled = !canEdit || field.hasAttribute("data-readonly");
        });
    }
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
    return date.toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function renderActivityFeed() {
    if (!ui.activityFeed) return;
    if (!activityEvents.length) {
      ui.activityFeed.innerHTML =
        '<div class="activity-item muted">No activity yet.</div>';
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
      time: Number.isNaN(timestamp.getTime())
        ? new Date().toISOString()
        : timestamp.toISOString(),
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
    const isTicket = state.tab === "tickets";
    const createdLabel = isTicket ? "Ticket created" : "Order created";
    if (item.created_at) {
      addActivityEvent({
        time: item.created_at,
        type: "system",
        title: createdLabel,
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

  function collectCatalogFormState() {
    if (!window.CatalogForm) return {};
    const fields = {};
    [
      ui.catalogFieldsBasic,
      ui.catalogFieldsTaxonomy,
      ui.catalogFieldsMaterials,
      ui.catalogFieldsAudit,
      ui.catalogFields,
    ]
      .filter(Boolean)
      .forEach((container) => {
        Object.assign(fields, window.CatalogForm.readFormState(container));
      });
    return fields;
  }

  function collectEditableUpdates() {
    if (CATALOG_TABS.has(state.tab)) {
      if (state.tab === "media-library") {
        const fields = {};
        if (!ui.catalogFields) return fields;
        const inputs = ui.catalogFields.querySelectorAll(
          "input,textarea,select",
        );
        inputs.forEach((field) => {
          const key = field.dataset.field;
          if (!key) return;
          if (field.disabled) return;
          const value = field.value;
          if (value !== undefined) fields[key] = value.trim();
        });
        const original = state.catalogOriginalFields || {};
        const updates = {};
        Object.keys(fields).forEach((key) => {
          const current = fields[key];
          const baseline = original[key];
          if (String(current ?? "") !== String(baseline ?? "")) {
            updates[key] = current;
          }
        });
        return updates;
      }
      const rawState = collectCatalogFormState();
      if (!window.CatalogUtils || !window.CatalogUtils.normalizeCatalogItem)
        return rawState;
      const enums = state.catalogEnums || {};
      const normalized = window.CatalogUtils.normalizeCatalogItem(
        rawState,
        enums,
      );
      state.catalogFormState = normalized.normalized;
      const original = state.catalogOriginalFields || {};
      const updates = {};
      Object.keys(normalized.fields || {}).forEach((key) => {
        const current = normalized.fields[key];
        const baseline = original[key];
        if (String(current ?? "") !== String(baseline ?? "")) {
          updates[key] = current;
        }
      });
      return updates;
    }
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
    const notesField = ui.editFields.find(
      (field) => field.dataset.field === "notes",
    );
    return notesField ? notesField.value.trim() : "";
  }

  function updatePrimaryActionState() {
    const canEdit = canEditCurrentTab();
    const notesChanged = getNotesValue() !== state.originalNotes.trim();
    if (ui.notesSave) {
      if (
        PRICING_TABS.has(state.tab) ||
        CATALOG_TABS.has(state.tab) ||
        state.tab === "quotes"
      ) {
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
        Object.keys(fields).length > 0 ||
        (state.tab === "quotes" && notesChanged);
      ui.primaryAction.textContent =
        state.isNewRow &&
        (PRICING_TABS.has(state.tab) || CATALOG_TABS.has(state.tab))
          ? "Add row"
          : "Save updates";
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
          </div>`,
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
          </tr>`,
      )
      .join("");
  }

  function buildConfirmationEmail(item, changes, confirmationUrl) {
    const requestId = item.request_id || "";
    const name = item.name || "there";
    const product = item.product_name || "your order";
    const timelineValue = getEditValue("timeline") || item.timeline || "";
    const adjustmentValue =
      getEditValue("timeline_adjustment_weeks") ||
      item.timeline_adjustment_weeks ||
      "";
    const etaLine = buildEtaLine(timelineValue, adjustmentValue);
    const subject = requestId
      ? `Heerawalla - Confirm order update (${requestId})`
      : "Heerawalla - Confirm order update";

    const textLines = changes.map(
      (change) =>
        `${change.label}: ${change.from || "--"} -> ${change.to || "--"}`,
    );
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
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
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
      if (
        lastFocusedConfirm &&
        typeof lastFocusedConfirm.focus === "function"
      ) {
        lastFocusedConfirm.focus();
      } else {
        document.body.focus?.();
      }
    }
    ui.confirmModal.classList.remove("is-open");
    ui.confirmModal.setAttribute("aria-hidden", "true");
    ui.confirmModal.setAttribute("inert", "");
  }

  async function populateDetail(item) {
    const isCatalog = CATALOG_TABS.has(state.tab);
    const requestId = state.isNewRow
      ? "New row"
      : item.request_id ||
        item.email ||
        item.slug ||
        item.id ||
        item.media_id ||
        "Record";
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
      item.product_name ||
      item.name ||
      item.key ||
      item.metal ||
      item.clarity ||
      requestId;
    ui.detailSub.textContent = requestId;
    if (ui.detailStatusCorner) {
      const statusValue =
        isCatalog ||
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

    if (isCatalog) {
      await populateCatalogDetail(item);
      return;
    }

    applyCatalogVisibility();

    const detailFields =
      state.tab === "contacts"
        ? [
            ["Created", formatDate(item.created_at)],
            ["Name", item.name],
            ["Email", item.email],
            ["Phone", formatPhone(item.phone)],
            ["Source", item.source],
            ["Request ID", item.request_id],
            ["Contact preference", item.contact_preference],
            ["Interests", item.interests],
            ["Page URL", item.page_url],
            ["Updated", formatDate(item.updated_at)],
          ]
        : state.tab === "tickets"
          ? [
              ["Request ID", item.request_id],
              ["Created", formatDate(item.created_at)],
              ["Status", status],
              ["Name", item.name],
              ["Email", item.email],
              ["Phone", formatPhone(item.phone)],
              ["Subject", item.subject],
              ["Summary", item.summary],
              ["Page URL", item.page_url],
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
                : [];

    const detailSections =
      state.tab === "quotes" || state.tab === "orders" ? [] : [];

    if (detailSections.length) {
      ui.detailGrid.classList.add("detail-sections");
      ui.detailGrid.innerHTML = renderDetailSections(detailSections);
    } else {
      ui.detailGrid.classList.remove("detail-sections");
      ui.detailGrid.innerHTML = renderDetailRows(detailFields);
    }
    if (ui.overviewSection) {
      const hideOverview = state.tab === "quotes" || state.tab === "orders";
      ui.overviewSection.classList.toggle("is-hidden", hideOverview);
    }
    refreshQuoteMedia(item);
    refreshSizingInputs(item);

    ui.editFields.forEach((field) => {
      const key = field.dataset.field;
      if (!key) return;
      if (key === "notes") {
        field.value = state.tab === "tickets" ? "" : item.notes || "";
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
    initializeQuotePricingStatus();
    scheduleQuotePricingUpdate({ baseChanged: true });

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

  async function populateCatalogDetail(item) {
    applyCatalogVisibility();
    if (ui.detailGrid) ui.detailGrid.innerHTML = "";
    if (ui.catalogTitle) {
      ui.catalogTitle.textContent = `${TAB_LABELS[state.tab] || "Catalog"} details`;
    }
    const enums = await loadCatalogEnums();
    if (state.tab === "media-library") {
      state.catalogFormState = item || {};
      state.catalogOriginalFields = {};
      state.catalogValidation = null;
      state.selectedItem = item || {};
      Object.keys(item || {}).forEach((key) => {
        state.catalogOriginalFields[key] = String(item?.[key] ?? "");
      });
      renderCatalogFields(item || {}, enums);
      renderMediaDetail(item || {});
      applyEditVisibility();
      renderActions();
      updateActionButtonState();
      updatePrimaryActionState();
      refreshMissingInfo();
      return;
    }
    const parsed = window.CatalogUtils
      ? window.CatalogUtils.parseLegacyFields(item, enums)
      : item || {};
    if (state.isNewRow && parsed.is_active === undefined) {
      parsed.is_active = true;
    }
    const normalized =
      window.CatalogUtils && window.CatalogUtils.normalizeCatalogItem
        ? window.CatalogUtils.normalizeCatalogItem(parsed, enums)
        : { normalized: parsed, fields: {} };
    state.catalogFormState = normalized.normalized || parsed;
    state.catalogOriginalFields = normalized.fields || {};
    state.catalogValidation = null;
    state.selectedItem = parsed;
    renderCatalogFields(parsed, enums);
    if (window.CatalogForm) {
      window.CatalogForm.setSelectOptions(
        ui.mediaPosition,
        enums.media_positions,
        true,
        "Select",
      );
      window.CatalogForm.setSelectOptions(
        ui.mediaPositionExisting,
        enums.media_positions,
        true,
        "Select",
      );
      const roleOptions = getStoneRoleOptions(enums);
      window.CatalogForm.setSelectOptions(
        ui.stoneAddRole,
        roleOptions,
        true,
        "Select",
      );
      const sizeTypeOptions = getStoneSizeTypeOptions(enums);
      window.CatalogForm.setSelectOptions(
        ui.stoneAddSizeType,
        sizeTypeOptions,
        true,
        "Select",
      );
      const metalSizeOptions = getMetalSizeTypeOptions(enums);
      window.CatalogForm.setSelectOptions(
        ui.metalAddSizeType,
        metalSizeOptions,
        true,
        "Select",
      );
      const shapeOptions = getStoneShapeOptions(enums);
      window.CatalogForm.setSelectOptions(
        ui.stoneAddShape,
        shapeOptions,
        true,
        "Select",
      );
    }
    await renderCatalogMedia(parsed);
    await renderCatalogStoneOptions(parsed);
    await renderCatalogMetalOptions(parsed);
    await renderCatalogNotes(parsed);
    applyEditVisibility();
    renderActions();
    updateActionButtonState();
    updatePrimaryActionState();
    refreshMissingInfo();
  }

  async function loadMe() {
    try {
      const data = await apiFetch("/me");
      state.role = data.role || "";
      state.email = data.email || "";
      if (ui.userRole) ui.userRole.textContent = state.role || "Unknown";
      if (ui.userEmail)
        ui.userEmail.textContent = state.email || "Not authorized";
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
        if (String(requestId).includes("@")) {
          params.set("email", requestId);
        } else {
          params.set("request_id", requestId);
        }
      } else if (
        state.tab === "price-chart" ||
        state.tab === "cost-chart" ||
        state.tab === "diamond-price-chart"
      ) {
        params.set("row_number", requestId);
      } else if (CATALOG_TABS.has(state.tab)) {
        if (state.tab === "media-library") {
          params.set("media_id", requestId);
        } else {
          params.set("slug", requestId);
          params.set("id", requestId);
        }
      } else {
        params.set("request_id", requestId);
      }
      const data = await apiFetch(
        `${getTabEndpoint(state.tab)}?${params.toString()}`,
      );
      state.catalogHeaders = Array.isArray(data.headers) ? data.headers : [];
      const item = (data.items || [])[0];
      if (!item) {
        setSyncStatus("Not found");
        if (ui.detailError) ui.detailError.textContent = "Record not found.";
        return;
      }
      await populateDetail(item);
      if (state.tab === "orders") {
        await loadOrderDetails(item.request_id);
      } else if (state.tab === "tickets") {
        await loadTicketDetails(item.request_id);
      } else {
        populateOrderDetails({});
      }
      setSyncStatus("Loaded");
    } catch (error) {
      setSyncStatus("Error");
      if (ui.detailError) ui.detailError.textContent = "Failed to load record.";
      showToast("Failed to load record.", "error");
    }
  }

  async function loadCatalogHeaders() {
    try {
      const data = await apiFetch(
        `${getTabEndpoint(state.tab)}?limit=1&offset=0`,
      );
      state.catalogHeaders = Array.isArray(data.headers) ? data.headers : [];
    } catch {
      state.catalogHeaders = [];
    }
  }

  async function loadCatalogEnums() {
    if (state.catalogEnums) return state.catalogEnums;
    try {
      const data = await apiFetch("/enums");
      state.catalogEnums = data || {};
      return state.catalogEnums;
    } catch {
      if (window.AdminEnums && window.AdminEnums.FALLBACK_ENUMS) {
        state.catalogEnums = window.AdminEnums.FALLBACK_ENUMS;
        return state.catalogEnums;
      }
      state.catalogEnums = {};
      return state.catalogEnums;
    }
  }

  async function loadOrderDetails(requestId) {
    if (!requestId || state.tab !== "orders") {
      populateOrderDetails({});
      return;
    }
    try {
      const data = await apiFetch(
        `/orders/details?request_id=${encodeURIComponent(requestId)}`,
      );
      populateOrderDetails(data.details || {});
    } catch (error) {
      populateOrderDetails({});
    }
  }

  async function loadTicketDetails(requestId) {
    if (!requestId || state.tab !== "tickets") return;
    try {
      const data = await apiFetch(
        `/tickets/details?request_id=${encodeURIComponent(requestId)}`,
      );
      const details = Array.isArray(data.details) ? data.details : [];
      details.forEach((entry) => {
        const kind = String(entry.kind || "note").toLowerCase();
        const title =
          kind === "email"
            ? "Email sent"
            : kind === "status"
              ? "Status update"
              : "Comment";
        addActivityEvent({
          time: entry.created_at || new Date().toISOString(),
          type: kind,
          title,
          detail: entry.note || "",
        });
      });
    } catch (error) {
      // Ignore detail fetch errors for now.
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
      body: JSON.stringify({
        action: "edit",
        requestId: recordId,
        fields,
        notes,
      }),
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
      const missing = REQUIRED_SHIPPING_DETAILS_FIELDS.filter(
        (field) => !details[field],
      );
      if (missing.length) {
        showToast("Add required fulfillment details before shipping.", "error");
        return;
      }
    }
    if (state.tab === "tickets" && action === "send_email") {
      const subject = window.prompt("Email subject");
      if (!subject) return;
      const body = window.prompt("Email message");
      if (!body) return;
      const result = await apiFetch("/tickets/action", {
        method: "POST",
        body: JSON.stringify({
          action: "send_email",
          requestId: recordId,
          subject,
          body,
        }),
      });
      if (result.ok) {
        showToast("Email sent");
        await loadTicketDetails(recordId);
      } else {
        showToast("Email failed", "error");
      }
      return;
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
      const refreshId = getSelectedRecordId();
      if (refreshId) {
        await loadRecord(refreshId);
      }
    } else {
      showToast("Action failed", "error");
    }
  }

  async function saveDetails() {
    const recordId = getSelectedRecordId();
    const isPricing = PRICING_TABS.has(state.tab);
    const isCatalog = CATALOG_TABS.has(state.tab);
    if (!recordId && !(state.isNewRow && (isPricing || isCatalog))) {
      showToast("Missing record ID", "error");
      return;
    }
    const fields = collectEditableUpdates();
    const notes = getNotesValue();
    if (isPricing) {
      fields.notes = notes;
    }
    const payload = {
      action: state.isNewRow && (isPricing || isCatalog) ? "add_row" : "edit",
      fields,
    };
    if (isPricing && !state.isNewRow) {
      payload.rowNumber = recordId;
    } else if (isCatalog && !state.isNewRow) {
      const rowNumber = state.selectedItem?.row_number || recordId;
      payload.rowNumber = rowNumber;
    } else if (!isPricing && !isCatalog) {
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
      if (state.isNewRow && (PRICING_TABS.has(state.tab) || isCatalog)) {
        window.location.href = `/?tab=${encodeURIComponent(state.tab)}`;
      } else if (PRICING_TABS.has(state.tab)) {
        await loadRecord(recordId);
      } else if (isCatalog) {
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
    if (state.tab === "tickets") {
      const note = getNotesValue();
      if (!note) {
        showToast("Add a comment first.", "error");
        return;
      }
      const result = await apiFetch("/tickets/action", {
        method: "POST",
        body: JSON.stringify({ action: "add_note", requestId: recordId, note }),
      });
      if (result.ok) {
        showToast("Comment added");
        const notesField = getEditField("notes");
        if (notesField) notesField.value = "";
        await loadTicketDetails(recordId);
      } else {
        showToast("Comment failed", "error");
      }
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
        confirmationUrl,
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
        if (state.tab === "quotes") {
          const gate = getQuotePricingGateState();
          if (gate.blocked) {
            showToast(gate.reason || "Pricing not ready.", "error");
            return;
          }
        }
        const config = getActionConfig(action);
        if (config && config.confirm && !window.confirm(config.confirm)) return;
        if (
          state.criticalDirty &&
          !window.confirm("Proceed without saving critical edits?")
        )
          return;
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
          setQuoteMetalSelection(
            ui.quoteMetalInput ? ui.quoteMetalInput.value : "",
            field.value,
          );
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
            const optionIndex = QUOTE_OPTION_FIELD_INDEX.get(key);
            if (field.value) {
              markQuotePriceManual(field);
              markOptionManual(optionIndex);
            } else {
              field.dataset.manual = "";
              field.dataset.auto = "true";
              scheduleQuotePricingUpdate({ optionIndex });
            }
            updateOptionFinal(optionIndex);
          } else if (QUOTE_BASE_PRICING_FIELDS.has(key)) {
            scheduleQuotePricingUpdate({ baseChanged: true });
          } else if (QUOTE_OPTION_FIELD_INDEX.has(key)) {
            scheduleQuotePricingUpdate({
              optionIndex: QUOTE_OPTION_FIELD_INDEX.get(key),
            });
          }
        }
        if (key === "metal_weight" || key === "metal_weight_adjustment") {
          updateMetalWeightFinal();
          validateMetalWeightInputs();
        }
        if (
          ["price", "quote_discount_type", "quote_discount_percent"].includes(
            key,
          )
        ) {
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
                ?.querySelector("span")
                ?.textContent?.trim() || key;
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
        updateActionButtonState();
      };
      field.addEventListener("input", handler);
      field.addEventListener("change", handler);
    });

    [
      ui.catalogFieldsBasic,
      ui.catalogFieldsTaxonomy,
      ui.catalogFieldsMaterials,
      ui.catalogFieldsAudit,
      ui.catalogFields,
    ]
      .filter(Boolean)
      .forEach((container) => {
        ["input", "change"].forEach((eventName) => {
          container.addEventListener(eventName, () => {
            refreshMissingInfo();
            updatePrimaryActionState();
            updateActionButtonState();
          });
        });
      });

    if (ui.catalogTabs.length) {
      ui.catalogTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          setCatalogTab(tab.dataset.catalogTab || CATALOG_DEFAULT_TAB);
        });
      });
    }

    if (ui.mediaUpload) {
      ui.mediaUpload.addEventListener("click", () => {
        uploadAndLinkMedia();
      });
    }

    if (ui.mediaLink) {
      ui.mediaLink.addEventListener("click", () => {
        linkExistingMedia();
      });
    }

    if (ui.mediaId) {
      ui.mediaId.addEventListener("change", () => {
        renderMediaPreview(ui.mediaId.value || "");
      });
    }

    if (ui.mediaDetailGenerate) {
      ui.mediaDetailGenerate.addEventListener("click", async () => {
        const mediaId = String(
          state.selectedItem?.media_id || state.selectedItem?.id || "",
        ).trim();
        if (!mediaId) {
          showToast("Missing media ID.", "error");
          return;
        }
        ui.mediaDetailGenerate.disabled = true;
        ui.mediaDetailGenerate.textContent = "Generating...";
        try {
          const result = await apiFetch("/media/describe", {
            method: "POST",
            body: JSON.stringify({ media_id: mediaId }),
          });
          if (!result?.ok) {
            showToast(result?.error || "Failed to generate description.", "error");
            return;
          }
          const descriptionField = getMediaDescriptionField();
          if (descriptionField) {
            descriptionField.value = result.description || "";
            descriptionField.dispatchEvent(new Event("input", { bubbles: true }));
          }
          updatePrimaryActionState();
          showToast("Description generated. Review and save updates.", "success");
        } catch (error) {
          console.error(error);
          showToast("Failed to generate description.", "error");
        } finally {
          ui.mediaDetailGenerate.disabled = false;
          ui.mediaDetailGenerate.textContent = "Generate description";
        }
      });
    }

    if (ui.catalogMediaList) {
      ui.catalogMediaList.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const row = target.closest(".catalog-media-item");
        if (target.hasAttribute("data-media-save")) {
          const mappingId = target.dataset.mappingId || "";
          if (mappingId) {
            if (!row) {
              showToast("Unable to locate media row.", "error");
              return;
            }
            saveMediaMapping(mappingId, row);
          } else {
            showToast("Missing media mapping id.", "error");
          }
        }
        if (target.hasAttribute("data-media-delete")) {
          const mappingId = target.dataset.mappingId || "";
          if (mappingId) {
            deleteMediaMapping(mappingId);
          } else {
            showToast("Missing media mapping id.", "error");
          }
        }
        if (target.hasAttribute("data-media-describe")) {
          const mediaId = target.dataset.mediaId || "";
          if (!mediaId) {
            showToast("Missing media id.", "error");
            return;
          }
          describeMedia(mediaId, row);
        }
      });
    }
    if (ui.catalogStoneList) {
      ui.catalogStoneList.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const row = target.closest("[data-stone-option-id]");
        if (!row) return;
        if (target.hasAttribute("data-stone-save")) {
          saveStoneOption(row);
          return;
        }
        if (target.hasAttribute("data-stone-delete")) {
          deleteStoneOption(row);
        }
      });
    }
    if (ui.stoneAddButton) {
      ui.stoneAddButton.addEventListener("click", () => {
        addStoneOption();
      });
    }
    if (ui.catalogMetalList) {
      ui.catalogMetalList.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const row = target.closest("[data-metal-option-id]");
        if (!row) return;
        if (target.hasAttribute("data-metal-save")) {
          saveMetalOption(row);
          return;
        }
        if (target.hasAttribute("data-metal-delete")) {
          deleteMetalOption(row);
        }
      });
    }
    if (ui.metalAddButton) {
      ui.metalAddButton.addEventListener("click", () => {
        addMetalOption();
      });
    }
    if (ui.catalogNotesSection) {
      ui.catalogNotesSection.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.hasAttribute("data-note-save")) {
          const kind = target.dataset.noteSave || "";
          if (kind) saveSingleNote(kind);
          return;
        }
        if (target.hasAttribute("data-note-add")) {
          const kind = target.dataset.noteAdd || "";
          if (kind) addListNote(kind);
          return;
        }
        const row = target.closest("[data-note-id]");
        if (!row) return;
        if (target.hasAttribute("data-note-row-save")) {
          saveNoteRow(row);
          return;
        }
        if (target.hasAttribute("data-note-row-delete")) {
          deleteNoteRow(row);
        }
      });
    }
    ui.quoteMetals.forEach((input) => {
      input.addEventListener("change", () => {
        syncQuoteMetalInput();
        updatePrimaryActionState();
      });
    });

    ui.optionActiveToggles.forEach((toggle, index) => {
      toggle.addEventListener("change", () => {
        setOptionActive(index, toggle.checked);
        refreshMissingInfo();
        updatePrimaryActionState();
        scheduleQuotePricingUpdate({ optionIndex: index });
      });
    });

    ui.optionRecommendRadios.forEach((radio, index) => {
      radio.addEventListener("change", () => {
        if (!radio.checked) return;
        state.recommendedOptionIndex = index;
        syncRecommendedOptionUi();
      });
    });

    ui.optionCopyButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.optionCopy);
        const field = getOptionPriceField(index);
        const value = field ? field.value.trim() : "";
        handleCopyText(`Option ${index + 1} price`, value);
      });
    });

    ui.optionAutoButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.optionAuto);
        const field = getOptionPriceField(index);
        if (field) {
          field.dataset.manual = "";
          field.dataset.auto = "true";
          field.value = "";
        }
        setOptionStatus(index, "stale");
        scheduleQuotePricingUpdate({ optionIndex: index });
      });
    });

    if (ui.breakdownRawToggle && ui.breakdownRaw) {
      ui.breakdownRawToggle.addEventListener("click", () => {
        ui.breakdownRaw.classList.toggle("is-hidden");
      });
    }

    if (ui.diamondBreakdownAdd) {
      ui.diamondBreakdownAdd.addEventListener("click", () => {
        const defaultType = getDefaultDiamondType();
        const current = getDiamondRowsFromDomTyped();
        current.push({ weight: "", count: "", stoneType: defaultType });
        renderDiamondBreakdownRows(current);
        scheduleQuotePricingUpdate({ baseChanged: true });
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
        updateDiamondStats(getDiamondRowsFromDomTyped());
        updateDiamondRowTotals();
        updatePrimaryActionState();
        scheduleQuotePricingUpdate({ baseChanged: true });
      });
      ui.diamondBreakdownRows.addEventListener("change", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (!target.hasAttribute("data-diamond-type")) return;
        syncDiamondBreakdownField();
        updateDiamondStats(getDiamondRowsFromDomTyped());
        updatePrimaryActionState();
        scheduleQuotePricingUpdate({ baseChanged: true });
      });
      ui.diamondBreakdownRows.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (!target.hasAttribute("data-diamond-remove")) return;
        const row = target.closest("[data-diamond-row]");
        if (row) row.remove();
        syncDiamondBreakdownField();
        updateDiamondStats(getDiamondRowsFromDomTyped());
        updateDiamondRowTotals();
        updatePrimaryActionState();
        scheduleQuotePricingUpdate({ baseChanged: true });
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
        scheduleQuotePricingUpdate({ baseChanged: true });
        updatePrimaryActionState();
      });
    }

    if (ui.discountType) {
      ui.discountType.addEventListener("change", () => {
        updateDiscountPreview();
        scheduleQuotePricingUpdate({ baseChanged: true });
        updatePrimaryActionState();
      });
    }
    if (ui.discountPercent) {
      ui.discountPercent.addEventListener("input", () => {
        updateDiscountPreview();
        scheduleQuotePricingUpdate({ baseChanged: true });
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
                  ?.querySelector("span")
                  ?.textContent?.trim() ||
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
        scheduleQuotePricingUpdate({ baseChanged: true });
      });
    }

    [ui.sizeRing, ui.sizeBracelet, ui.sizeChain].forEach((input) => {
      if (!input) return;
      ["input", "change"].forEach((eventName) => {
        input.addEventListener(eventName, () => {
          syncSizingToSizeField();
          scheduleQuotePricingUpdate({ baseChanged: true });
          updatePrimaryActionState();
          if (state.selectedItem) updateSummaryCard(state.selectedItem);
        });
      });
    });

    if (ui.primaryAction) {
      ui.primaryAction.addEventListener("click", () => {
        if (state.tab !== "orders") {
          saveDetails();
          return;
        }
        if (
          state.criticalDirty &&
          !window.confirm("Proceed without saving critical edits?")
        )
          return;
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
        handleCopyText(
          "Customer name",
          ui.summaryCustomer?.textContent?.trim(),
        ),
      );
    }
    if (ui.copyEmail) {
      ui.copyEmail.addEventListener("click", () =>
        handleCopyText("Email", ui.summaryEmail?.textContent?.trim()),
      );
    }
    if (ui.copyPhone) {
      ui.copyPhone.addEventListener("click", () =>
        handleCopyText("Phone", ui.summaryPhone?.textContent?.trim()),
      );
    }
    if (ui.copyAddress) {
      ui.copyAddress.addEventListener("click", () =>
        handleCopyText("Address", ui.summaryAddress?.textContent?.trim()),
      );
    }
    if (ui.copySummary) {
      ui.copySummary.addEventListener("click", () => {
        const summary = buildSummaryText(state.selectedItem);
        handleCopyText("Order summary", summary);
      });
    }

    if (ui.goldRefresh) {
      ui.goldRefresh.addEventListener("click", async () => {
        ui.goldRefresh.disabled = true;
        ui.goldRefresh.textContent = "Refreshing...";
        try {
          const result = await apiFetch("/cost-chart/gold-refresh", {
            method: "POST",
          });
          if (result.ok) {
            const valueInput = document.querySelector('[data-field="value"]');
            const notesInput = document.querySelector('[data-field="notes"]');
            if (valueInput && result.value !== undefined) {
              valueInput.value = result.value;
              markDirty();
            }
            if (notesInput && result.notes !== undefined) {
              notesInput.value = result.notes || "";
              markDirty();
            }
            showToast("Gold price refreshed. Review and click Save.");
          } else {
            showToast(result.error || "Failed to refresh gold price", "error");
          }
        } catch (error) {
          showToast("Failed to refresh gold price", "error");
        } finally {
          ui.goldRefresh.textContent = "Refresh gold price";
          ui.goldRefresh.disabled = false;
        }
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
        } else if (CATALOG_TABS.has(state.tab)) {
          saveDetails();
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
        if (
          state.criticalDirty &&
          !window.confirm("Proceed without saving critical edits?")
        )
          return;
        if (window.confirm("Send confirmation to customer?"))
          sendConfirmation();
      });
    }
  }

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const bodyTab = document.body.dataset.detailTab || "";
    let tab = params.get("tab") || bodyTab;
    let id = params.get("id");
    if (!tab || !id) {
      try {
        const storedTab = localStorage.getItem("adminDetailTab") || "";
        const storedId = localStorage.getItem("adminDetailId") || "";
        if (!tab && storedTab && !bodyTab) tab = storedTab;
        if (!id && storedId) id = storedId;
        if (tab || id) {
          if (!bodyTab) {
            const nextParams = new URLSearchParams(window.location.search);
            if (tab) nextParams.set("tab", tab);
            if (id) nextParams.set("id", id);
            const nextUrl = `${window.location.pathname}?${nextParams.toString()}`;
            window.history.replaceState({}, "", nextUrl);
          }
        }
      } catch {
        // ignore storage errors
      }
    }
    if (tab && STATUS_OPTIONS[tab]) {
      state.tab = tab;
    }
    if (ui.backLink) {
      ui.backLink.href = `/?tab=${encodeURIComponent(state.tab)}`;
    }
    bindEvents();
    await loadMe();
    if (
      id === "new" &&
      (PRICING_TABS.has(state.tab) || CATALOG_TABS.has(state.tab))
    ) {
      state.isNewRow = true;
      if (CATALOG_TABS.has(state.tab)) {
        await loadCatalogHeaders();
        await populateCatalogDetail({});
      } else {
        await populateDetail({});
      }
      setSyncStatus("New row");
      return;
    }
    state.isNewRow = false;
    await loadRecord(id);
  }

  init();
})();
