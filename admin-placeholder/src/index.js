import { state, DASHBOARD_TAB, BULK_TABS } from "./core/state.js";
import {
  apiFetch,
  buildAdminHeaders,
  getApiBase,
  getLocalAdminEmail,
  getStoredAdminEmail,
} from "./core/api.js";
import { createToast } from "./ui/toast.js";
import { createListRenderer } from "./ui/list.js";
import { createFilterHelpers } from "./ui/filters.js";
import { createDrawer } from "./ui/drawer.js";
import { initKeyboardShortcuts } from "./features/keyboard.js";
import { createDashboard } from "./features/dashboard.js";
import { createBulkActions } from "./features/bulk-actions.js";
import { createExporter } from "./features/export.js";
import { getActionEndpoint as getActionEndpointBase, getTabEndpoint as getTabEndpointBase } from "./core/endpoints.js";
import { createRecordHelpers } from "./core/records.js";
import { createLocalAdminHelpers } from "./core/local-access.js";
import { createRouter } from "./core/router.js";
import { createSyncHelpers } from "./core/sync.js";
import { createViewHelpers } from "./core/view.js";
import { createEditHelpers } from "./core/edits.js";
import {
  ACTIONS,
  CATALOG_TABS,
  EDIT_FIELDS,
  LIST_COLUMNS,
  ORDER_ACTION_FLOW,
  ORDER_DETAILS_FIELDS,
  ORDER_STATUS_FLOW,
  PRICING_TABS,
  QUOTE_OPTION_FIELDS,
  QUOTE_PRICE_FIELDS,
  QUOTE_PRICING_FIELDS,
  REQUIRED_SHIPPING_DETAILS_FIELDS,
  SORT_DEFAULTS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  TAB_LABELS,
} from "./core/constants.js";
import {
  escapeAttribute,
  escapeHtml,
  formatDate,
  formatDelayWeeks,
  formatGrams,
  formatPhone,
  formatPlain,
  formatPrice,
  formatSignedGrams,
  formatStoneWeight,
  formatTimelineValue,
  isFilled,
  normalizeImageUrl as normalizeImageUrlBase,
  normalizeNumber,
  normalizePrice,
  normalizeText,
  normalizeTimelineValue,
} from "./core/utils.js";
import { createQuoteHelpers } from "./modules/quotes.js";
import { createCatalogHelpers } from "./modules/catalog.js";
import { createQuotePricingHelpers } from "./modules/quote-pricing.js";
import { createConfirmationHelpers } from "./modules/confirmation.js";
import { createOrderDetailsHelpers } from "./modules/order-details.js";
import { createQuoteSettingsHelpers } from "./modules/quote-settings.js";
import { createRecordActions } from "./modules/record-actions.js";
import { createDeployHelpers } from "./modules/deploy.js";
import { getContactDetailFields } from "./modules/contacts.js";
import { getTicketDetailFields } from "./modules/tickets.js";
import { getOrderDetailSections } from "./modules/orders.js";
import { getQuoteDetailSections } from "./modules/quotes.js";
import { getCostChartDetailFields, getDiamondPriceDetailFields } from "./modules/pricing.js";
import { getProductDetailFields } from "./modules/products.js";
import { getInspirationDetailFields } from "./modules/inspirations.js";
import { getMediaDetailFields } from "./modules/media.js";
import { createEventBindings } from "./ui/events.js";
import { createDetailView } from "./ui/detail-view.js";
import { createNotifications } from "./features/notifications.js";
import { createConsultations } from "./features/consultations.js";
import { createSidebar } from "./ui/sidebar.js";

// Module scope
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
      return state.role === "admin" || state.role === "ops";
    }
    if (
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

  const isDashboardTab = () => state.tab === DASHBOARD_TAB;
  const isConsultationsTab = () => state.tab === "consultations";
  const isFilterlessTab = () => isDashboardTab() || isConsultationsTab();
  const enableNavCounts = document.body.dataset.enableNavCounts === "true";

  const isBulkEnabled = () => BULK_TABS.has(state.tab);

  const ui = {
    syncLine: document.querySelector("[data-sync-line]"),
    userRole: document.querySelector("[data-user-role]"),
    userEmail: document.querySelector("[data-user-email]"),
    tabTitle: document.querySelector("[data-tab-title]"),
    autoRefresh: document.querySelector("[data-auto-refresh]"),
    tabs: Array.from(document.querySelectorAll("[data-tab]")),
    adminTabs: Array.from(document.querySelectorAll("[data-admin-only]")),
    dashboard: document.querySelector("[data-dashboard]"),
    filtersWrap: document.querySelector(".filters"),
    listWrap: document.querySelector(".list-wrap"),
    bulkActions: document.querySelector("[data-bulk-actions]"),
    addRowWrap: document.querySelector("[data-add-row-wrap]"),
    addRowButton: document.querySelector("[data-add-row]"),
    filters: Array.from(document.querySelectorAll("[data-filter]")),
    exportButtons: Array.from(document.querySelectorAll("[data-export]")),
    listHeader: document.querySelector("[data-list-header]"),
    list: document.querySelector("[data-list]"),
    results: document.querySelector("[data-results]"),
    prev: document.querySelector("[data-prev]"),
    next: document.querySelector("[data-next]"),
    refresh: document.querySelector("[data-refresh]"),
    drawer: document.querySelector("[data-drawer]"),
    drawerClose: document.querySelector("[data-drawer-close]"),
    detailType: document.querySelector("[data-detail-type]"),
    detailTitle: document.querySelector("[data-detail-title]"),
    detailSub: document.querySelector("[data-detail-sub]"),
    detailStatus: document.querySelector("[data-detail-status]"),
    statusSelect: document.querySelector("[data-status-select]"),
    statusSave: document.querySelector("[data-status-save]"),
    detailGrid: document.querySelector("[data-detail-grid]"),
    actionButtons: document.querySelector("[data-action-buttons]"),
    editSection: document.querySelector("[data-edit-section]"),
    quoteSection: document.querySelector("[data-quote-section]"),
    quoteMetals: Array.from(document.querySelectorAll("[data-quote-metals] input[type=\"checkbox\"]")),
    quoteMetalInput: document.querySelector("[data-field=\"quote_metal_options\"]"),
    metalWeightLabel: document.querySelector("[data-metal-weight-label]"),
    metalWeightAdjustmentLabel: document.querySelector("[data-metal-weight-adjustment-label]"),
    editFields: Array.from(document.querySelectorAll("[data-field]")),
    orderDetailsSection: document.querySelector("[data-order-details-section]"),
    orderDetailsFields: Array.from(document.querySelectorAll("[data-order-details-field]")),
    diamondBreakdown: document.querySelector("[data-diamond-breakdown]"),
    diamondBreakdownRows: document.querySelector("[data-diamond-breakdown-rows]"),
    diamondBreakdownAdd: document.querySelector("[data-diamond-breakdown-add]"),
    sizeRing: document.querySelector("[data-size-ring] input"),
    sizeBracelet: document.querySelector("[data-size-bracelet] input"),
    sizeChain: document.querySelector("[data-size-chain] input"),
    triggerDeploy: document.querySelector("[data-trigger-deploy]"),
    deployStatus: document.querySelector("[data-deploy-status]"),
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
    notificationsToggle: document.querySelector("[data-notifications-toggle]"),
    notificationsPanel: document.querySelector("[data-notifications-panel]"),
    notificationsList: document.querySelector("[data-notifications-list]"),
    notificationsBadge: document.querySelector("[data-notifications-badge]"),
    notificationsClose: document.querySelector("[data-notifications-close]"),
    consultationsSection: document.querySelector("[data-consultations]"),
    consultationsRange: document.querySelector("[data-consultations-range]"),
    consultationsRefresh: document.querySelector("[data-consultations-refresh]"),
    consultationsTotal: document.querySelector("[data-consultations-total]"),
    consultationsCompleted: document.querySelector("[data-consultations-completed]"),
    consultationsQuotes: document.querySelector("[data-consultations-quotes]"),
    consultationsOrders: document.querySelector("[data-consultations-orders]"),
    consultationsSource: document.querySelector("[data-consultations-source]"),
    consultationsCampaign: document.querySelector("[data-consultations-campaign]"),
    consultationsHear: document.querySelector("[data-consultations-hear]"),
    sidebar: document.querySelector("[data-sidebar]"),
    sidebarCollapse: document.querySelector("[data-sidebar-collapse]"),
    sidebarSearch: document.querySelector("[data-sidebar-search]"),
    appShell: document.querySelector(".app-shell"),
  };

  const showToast = createToast(ui.toast);

  const { closeDrawer, openDrawer, renderDetailRows, renderDetailSections, bindDrawerEvents } = createDrawer({
    ui,
    escapeHtml,
  });

  const { updateStatusOptions, updateSortOptions, updateStatusFilterOptions } = createFilterHelpers({
    state,
    ui,
    statusOptions: STATUS_OPTIONS,
    sortOptions: SORT_OPTIONS,
    sortDefaults: SORT_DEFAULTS,
    isDashboardTab: isFilterlessTab,
    getOrderStatusOptions,
    normalizeStatus,
  });

  const { buildDeletePayload, detailUrl, getItemKey, getSelectedRecordId } = createRecordHelpers({
    state,
    storage: typeof localStorage === "undefined" ? null : localStorage,
    locationHref: window.location.href,
  });

    const { renderList } = createListRenderer({
      state,
      ui,
      listColumns: LIST_COLUMNS,
      isBulkEnabled,
      canEditCurrentTab,
      getValue,
      getItemKey,
      normalizeImageUrl,
      escapeAttribute,
    });

  const { updateBulkActions, handleBulkAction } = createBulkActions({
    state,
    ui,
    apiFetch,
    getActionEndpoint,
    showToast,
    renderList,
    loadList,
    isBulkEnabled,
    clearSelection,
  });

  const { exportData } = createExporter({
    state,
    listColumns: LIST_COLUMNS,
    getItemKey,
    getValue,
    showToast,
  });

  let viewHelpers = null;
  const setTab = (tabName) => {
    if (viewHelpers && viewHelpers.setTab) {
      viewHelpers.setTab(tabName);
      updateTabInUrl(tabName);
    }
  };

  const { loadDashboard } = createDashboard({
    apiFetch,
    ui,
    setTab,
    escapeHtml,
  });

  const apiBase = getApiBase();
  const siteBase = (document.body.dataset.siteBase || "https://www.heerawalla.com").replace(/\/$/, "");
  const normalizeImageUrl = (value) => normalizeImageUrlBase(value, siteBase);
  const getTabEndpoint = (tab) => getTabEndpointBase(tab);
  const getActionEndpoint = () => getActionEndpointBase(state.tab);
  let autoRefresh = localStorage.getItem("adminAutoRefresh") !== "false";
  if (ui.autoRefresh) {
    ui.autoRefresh.checked = autoRefresh;
  }
  const setAutoRefresh = (value) => {
    autoRefresh = value;
    localStorage.setItem("adminAutoRefresh", String(autoRefresh));
  };

  const {
    getCatalogBase,
    loadCatalog,
    refreshQuoteMedia,
    renderQuoteMediaSlot,
    resolveCatalogEntry,
  } = createCatalogHelpers({
    apiBase,
    ui,
    normalizeImageUrl,
    escapeAttribute,
  });

  const { ensureLocalAdminAccess } = createLocalAdminHelpers({
    getLocalAdminEmail,
    storage: typeof localStorage === "undefined" ? null : localStorage,
    documentRef: document,
    windowRef: window,
  });

  const { setLastSync, setSyncStatus, updateSyncLine } = createSyncHelpers({ ui });
  const { getInitialTab, updateTabInUrl } = createRouter({ windowRef: window });

  const {
    applySizingVisibility,
    buildSizingRows,
    getDiamondBreakdownField,
    getDiamondRowsFromDom,
    refreshSizingInputs,
    renderDiamondBreakdownRows,
    setDiamondBreakdownRowsFromField,
    syncDiamondBreakdownField,
    syncSizingToSizeField,
    toggleDiamondBreakdownVisibility,
  } = createQuoteHelpers({
    state,
    ui,
    escapeAttribute,
    isFilled,
    normalizeText,
    getEditField,
    getEditValue,
    loadCatalog,
    resolveCatalogEntry,
  });

  const {
    applyDiscountControlState,
    applyGoldOnlyQuoteState,
    buildMetalWeightAdjustmentLabel,
    buildMetalWeightLabel,
    getRequestedMetalGroup,
    isGoldOnlyQuote,
    setQuoteMetalSelection,
    syncQuoteMetalInput,
    toggleFieldVisibility,
    updateMetalWeightLabels,
  } = createQuoteSettingsHelpers({
    state,
    ui,
    normalizeText,
    getEditValue,
    getEditField,
  });

  const {
    collectConfirmChanges,
    collectEditableUpdates,
    getNotesValue,
    renderActions,
    setOriginalValues,
    updatePrimaryActionState,
  } = createEditHelpers({
    state,
    ui,
    confirmFields: CONFIRM_FIELDS,
    editFields: EDIT_FIELDS,
    pricingTabs: PRICING_TABS,
    canEditCurrentTab,
    actions: ACTIONS,
    orderActionFlow: ORDER_ACTION_FLOW,
    normalizeStatus,
    syncQuoteMetalInput,
    getEditValue,
  });

  const {
    markQuotePriceManual,
    resetQuoteAutoPricingState,
    scheduleQuotePricingUpdate,
    quotePriceFields,
  } = createQuotePricingHelpers({
    state,
    ui,
    quoteOptionFields: QUOTE_OPTION_FIELDS,
    quotePricingFields: QUOTE_PRICING_FIELDS,
    quotePriceFields: QUOTE_PRICE_FIELDS,
    isGoldOnlyQuote,
    getEditField,
    getEditValue,
    getCatalogBase,
    updatePrimaryActionState,
  });

  const {
    buildConfirmationEmail,
    resolveConfirmationUrl,
    openConfirmModal,
    closeConfirmModal,
  } = createConfirmationHelpers({
    ui,
    escapeHtml,
    escapeAttribute,
    buildEtaLine,
    getEditValue,
  });

  const {
    applyOrderDetailsVisibility,
    collectOrderDetailsUpdates,
    loadOrderDetails,
    populateOrderDetails,
  } = createOrderDetailsHelpers({
    state,
    ui,
    apiFetch,
    orderDetailsFields: ORDER_DETAILS_FIELDS,
  });

  const {
    prepareConfirmation,
    runAction,
    saveDetails,
    saveNotes,
    saveOrderDetails,
    saveStatus,
    sendConfirmation,
  } = createRecordActions({
    state,
    ui,
    apiFetch,
    showToast,
    loadList,
    getActionEndpoint,
    getSelectedRecordId,
    collectEditableUpdates,
    getNotesValue,
    collectOrderDetailsUpdates,
    requiredShippingFields: REQUIRED_SHIPPING_DETAILS_FIELDS,
    pricingTabs: PRICING_TABS,
    getEditField,
    collectConfirmChanges,
    buildConfirmationEmail,
    resolveConfirmationUrl,
    openConfirmModal,
    closeConfirmModal,
    loadOrderDetails,
  });

  const { triggerSiteRebuild } = createDeployHelpers({
    ui,
    getApiBase,
    getStoredAdminEmail,
    getLocalAdminEmail,
    buildAdminHeaders,
    showToast,
    windowRef: window,
  });

  const { bindNotifications } = createNotifications({
    ui,
    apiFetch,
    showToast,
    windowRef: window,
  });

  const { bindConsultations, loadConsultations } = createConsultations({
    ui,
    apiFetch,
    showToast,
  });

  const { initSidebar, updateNavigationCounts } = createSidebar({
    ui,
    apiFetch,
    showToast,
  });

  viewHelpers = createViewHelpers({
    state,
    ui,
    tabLabels: TAB_LABELS,
    isDashboardTab,
    isConsultationsTab,
    loadConsultations,
    updateStatusOptions,
    updateStatusFilterOptions,
    updateSortOptions,
    updateBulkActions,
    loadDashboard,
    apiFetch,
    getTabEndpoint,
    renderList,
    getItemKey,
    populateDrawer,
    closeDrawer,
    setSyncStatus,
    setLastSync,
    showToast,
    pricingTabs: PRICING_TABS,
    catalogTabs: CATALOG_TABS,
  });
  const {
    buildQuery,
    loadCurrentView,
    loadList,
    updateAddRowVisibility,
    updateDashboardVisibility,
    updateTabVisibility,
  } = viewHelpers;

  const { populateDrawer, applyEditVisibility } = createDetailView({
    state,
    ui,
    tabLabels: TAB_LABELS,
    detailFieldBuilders: {
      contacts: getContactDetailFields,
      tickets: getTicketDetailFields,
      "cost-chart": getCostChartDetailFields,
      "diamond-price-chart": getDiamondPriceDetailFields,
      products: getProductDetailFields,
      inspirations: getInspirationDetailFields,
      "media-library": getMediaDetailFields,
    },
    detailSectionBuilders: {
      orders: getOrderDetailSections,
      quotes: getQuoteDetailSections,
    },
    editFields: EDIT_FIELDS,
    formatDate,
    formatPhone,
    formatPrice,
    formatDelayWeeks,
    formatGrams,
    formatSignedGrams,
    buildMetalWeightLabel,
    buildMetalWeightAdjustmentLabel,
    buildSizingRows,
    renderDetailRows,
    renderDetailSections,
    renderQuoteMediaSlot,
    refreshQuoteMedia,
    refreshSizingInputs,
    updateMetalWeightLabels,
    setQuoteMetalSelection,
    setDiamondBreakdownRowsFromField,
    resetQuoteAutoPricingState,
    scheduleQuotePricingUpdate,
    applyOrderDetailsVisibility,
    applyQuoteVisibility,
    applyDiscountControlState,
    applyGoldOnlyQuoteState,
    updatePrimaryActionState,
    renderActions,
    updateStatusOptions,
    getContactNotes,
    setOriginalValues,
    toggleDiamondBreakdownVisibility,
    applySizingVisibility,
    isFilled,
  });

  const { bindEvents } = createEventBindings({
    state,
    ui,
    setTab,
    loadCurrentView,
    setAutoRefresh,
    updateSyncLine,
    clearSelection,
    handleBulkAction,
    exportData,
    updateBulkActions,
    renderList,
    getItemKey,
    canEditCurrentTab,
    getActionEndpoint,
    showToast,
    apiFetch,
    buildDeletePayload,
    detailUrl,
    populateDrawer,
    openDrawer,
    bindDrawerEvents,
    runAction,
    triggerSiteRebuild,
    applyDiscountControlState,
    applyGoldOnlyQuoteState,
    setQuoteMetalSelection,
    syncQuoteMetalInput,
    updatePrimaryActionState,
    scheduleQuotePricingUpdate,
    getDiamondRowsFromDom,
    renderDiamondBreakdownRows,
    syncDiamondBreakdownField,
    setDiamondBreakdownRowsFromField,
    getDiamondBreakdownField,
    syncSizingToSizeField,
    prepareConfirmation,
    saveDetails,
    saveNotes,
    saveOrderDetails,
    saveStatus,
    closeConfirmModal,
    sendConfirmation,
    quotePriceFields,
    quotePricingFields: QUOTE_PRICING_FIELDS,
  });

  function clearSelection() {
    state.selectedItems = [];
    updateBulkActions();
    renderList();
  }

  function getContactNotes(item) {
    if (!item) return "";
    const candidates = [
      item.notes,
      item.customer_notes,
      item.note,
      item.message,
      item.inquiry,
      item.details,
    ];
    for (const value of candidates) {
      if (isFilled(value)) return value;
    }
    return "";
  }

  function buildEtaLine(timelineValue, adjustmentValue) {
    const base = formatTimelineValue(timelineValue) || "Standard";
    const adjustment = Number(String(adjustmentValue || "").trim());
    if (!Number.isNaN(adjustment) && adjustment > 0) {
      return `Estimated delivery after payment: ${base} + ${adjustment} week${adjustment === 1 ? "" : "s"}.`;
    }
    return `Estimated delivery after payment: ${base}.`;
  }

  function getEditField(key) {
    return ui.editFields.find((field) => field.dataset.field === key);
  }

  function getEditValue(key) {
    const field = ui.editFields.find((input) => input.dataset.field === key);
    return field ? field.value.trim() : "";
  }

  function applyQuoteVisibility() {
    if (!ui.quoteSection) return;
    ui.quoteSection.classList.toggle("is-hidden", state.tab !== "quotes");
    toggleDiamondBreakdownVisibility();
    applyGoldOnlyQuoteState();
    if (state.tab !== "quotes") {
      applySizingVisibility(null);
    }
  }

  function getValue(item, key) {
    if (key === "created_at") return formatDate(item[key]);
    if (key === "price") return formatPrice(item[key]);
    if (key === "status") return item[key] || "--";
    if (key === "phone") return formatPhone(item[key]);
    if (key === "is_active") return String(item[key] || "").toLowerCase() === "true" ? "Yes" : "No";
    return item[key] || "--";
  }

  async function loadMe() {
    try {
      const data = await apiFetch("/me");
      state.role = data.role || "";
      state.email = data.email || "";
      if (ui.userRole) ui.userRole.textContent = state.role || "Unknown";
      if (ui.userEmail) ui.userEmail.textContent = state.email || "Not authorized";
      updateTabVisibility();
      updateAddRowVisibility();
      setSyncStatus("Connected");
    } catch (error) {
      setSyncStatus("Access blocked");
      showToast("Access denied. Check Access policy.", "error");
    }
  }

  async function init() {
    const initialTab = getInitialTab(state.tab);
    bindEvents();
    bindNotifications();
    bindConsultations();
    initSidebar();
    initKeyboardShortcuts({ ui, loadCurrentView, closeDrawer });
    updateSyncLine();
    if (!ensureLocalAdminAccess()) return;
    await loadMe();
    const targetTab =
      initialTab && (STATUS_OPTIONS[initialTab] || initialTab === DASHBOARD_TAB)
        ? initialTab
        : state.tab;
    setTab(targetTab);
    if (!enableNavCounts) {
      updateNavigationCounts({});
    }
    setInterval(() => {
      if (document.hidden || !autoRefresh) return;
      loadCurrentView();
    }, 60000);
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      window.addEventListener("load", () => {
        const nav = performance.getEntriesByType("navigation")[0];
        const loadTime = nav && Number.isFinite(nav.duration) ? nav.duration : performance.now();
        console.log(`[perf] Page loaded in ${Math.round(loadTime)}ms`);
      });
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const start = performance.now();
        const response = await originalFetch(...args);
        const end = performance.now();
        console.log(`[perf] API call ${(end - start).toFixed(0)}ms`, args[0]);
        return response;
      };
    }
  }

  init();





