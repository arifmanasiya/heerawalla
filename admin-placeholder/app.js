(() => {
  const state = {
    tab: "orders",
    role: "",
    email: "",
    items: [],
    total: 0,
    offset: 0,
    limit: 50,
    selectedId: "",
    selectedItem: null,
    originalValues: {},
    originalRaw: {},
    originalNotes: "",
    pendingChanges: [],
    confirmation: null,
    filters: {
      q: "",
      status: "",
      sort: "created_at",
      dir: "desc",
    },
  };

  const STATUS_OPTIONS = {
    orders: [
      "NEW",
      "ACKNOWLEDGED",
      "PENDING_CONFIRMATION",
      "INVOICED",
      "INVOICE_PAID",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "INVOICE_NOT_PAID",
      "CANCELLED",
    ],
    quotes: ["NEW", "ACKNOWLEDGED", "QUOTED", "CONVERTED", "DROPPED"],
    contacts: ["NEW", "PENDING", "RESOLVED"],
  };

  const LIST_COLUMNS = {
    orders: [
      { key: "created_at", label: "Created" },
      { key: "request_id", label: "Request ID" },
      { key: "product_name", label: "Product" },
      { key: "status", label: "Status" },
      { key: "price", label: "Price" },
      { key: "timeline", label: "Timeline" },
      { key: "view", label: "" },
    ],
    quotes: [
      { key: "created_at", label: "Created" },
      { key: "request_id", label: "Request ID" },
      { key: "product_name", label: "Product" },
      { key: "status", label: "Status" },
      { key: "price", label: "Price" },
      { key: "timeline", label: "Timeline" },
      { key: "view", label: "" },
    ],
    contacts: [
      { key: "created_at", label: "Created" },
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "interests", label: "Interests" },
      { key: "status", label: "Status" },
      { key: "view", label: "" },
    ],
  };

  const ACTIONS = {
    orders: [
      { action: "acknowledge", label: "Acknowledge", confirm: "Mark as acknowledged?" },
      { action: "send_invoice", label: "Send invoice", confirm: "Send invoice and mark invoiced?" },
      { action: "mark_paid", label: "Mark paid", confirm: "Confirm payment received?" },
      { action: "mark_shipped", label: "Mark shipped", confirm: "Mark as shipped?" },
      { action: "mark_delivered", label: "Mark delivered", confirm: "Mark as delivered?" },
      { action: "cancel", label: "Cancel order", confirm: "Cancel this order?" },
    ],
    quotes: [
      { action: "acknowledge", label: "Acknowledge", confirm: "Mark as acknowledged?" },
      { action: "submit_quote", label: "Submit quote", confirm: "Mark as quoted?" },
      { action: "convert_to_order", label: "Convert to order", confirm: "Convert to order?" },
      { action: "drop", label: "Drop", confirm: "Drop this quote?" },
    ],
    contacts: [
      { action: "mark_pending", label: "Mark pending", confirm: "Mark as pending?" },
      { action: "mark_resolved", label: "Mark resolved", confirm: "Mark as resolved?" },
    ],
  };

  const EDIT_FIELDS = {
    orders: ["price", "timeline", "metal", "stone", "stone_weight", "notes"],
    quotes: ["price", "timeline", "metal", "stone", "stone_weight", "notes"],
    contacts: ["notes"],
  };

  const CONFIRM_FIELDS = [
    { key: "price", label: "Price", normalize: normalizePrice, format: formatPrice },
    { key: "timeline", label: "Timeline", normalize: normalizeTimelineValue, format: formatTimelineValue },
    { key: "metal", label: "Metal", normalize: normalizeText, format: formatPlain },
    { key: "stone", label: "Stone type", normalize: normalizeText, format: formatPlain },
    { key: "stone_weight", label: "Stone weight", normalize: normalizeNumber, format: formatStoneWeight },
  ];

  const ui = {
    syncLine: document.querySelector("[data-sync-line]"),
    userRole: document.querySelector("[data-user-role]"),
    userEmail: document.querySelector("[data-user-email]"),
    autoRefresh: document.querySelector("[data-auto-refresh]"),
    tabs: Array.from(document.querySelectorAll("[data-tab]")),
    filters: Array.from(document.querySelectorAll("[data-filter]")),
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
    editFields: Array.from(document.querySelectorAll("[data-field]")),
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
  let syncStatus = "Connecting";
  let lastSync = "";
  let autoRefresh = localStorage.getItem("adminAutoRefresh") !== "false";

  function updateSyncLine() {
    if (!ui.syncLine) return;
    if (autoRefresh) {
      ui.syncLine.textContent = syncStatus;
      if (ui.refresh) {
        ui.refresh.disabled = true;
        ui.refresh.setAttribute("aria-disabled", "true");
        ui.refresh.classList.add("is-disabled");
      }
      return;
    }
    const detail = lastSync ? ` | Last sync ${lastSync}` : "";
    ui.syncLine.textContent = `${syncStatus}${detail}`;
    if (ui.refresh) {
      ui.refresh.disabled = false;
      ui.refresh.setAttribute("aria-disabled", "false");
      ui.refresh.classList.remove("is-disabled");
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
    syncStatus = status;
    updateSyncLine();
  }

  function formatDate(value) {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  }

  function formatPrice(value) {
    if (value === undefined || value === null || value === "") return "--";
    const num = Number(String(value).replace(/[^0-9.]/g, ""));
    if (Number.isNaN(num)) return String(value);
    return num.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
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

  function formatTimelineValue(value) {
    const normalized = normalizeTimelineValue(value);
    if (!normalized) return "";
    if (normalized === "rush") return "Rush";
    if (normalized === "standard") return "Standard";
    return value;
  }

  function getValue(item, key) {
    if (key === "created_at") return formatDate(item[key]);
    if (key === "price") return formatPrice(item[key]);
    if (key === "status") return item[key] || "--";
    return item[key] || "--";
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

  async function loadMe() {
    try {
      const data = await apiFetch("/me");
      state.role = data.role || "";
      state.email = data.email || "";
      if (ui.userRole) ui.userRole.textContent = state.role || "Unknown";
      if (ui.userEmail) ui.userEmail.textContent = state.email || "Not authorized";
      setSyncStatus("Connected");
    } catch (error) {
      setSyncStatus("Access blocked");
      showToast("Access denied. Check Access policy.", "error");
    }
  }

  function buildQuery() {
    const params = new URLSearchParams();
    Object.entries(state.filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set("limit", String(state.limit));
    params.set("offset", String(state.offset));
    return params.toString();
  }

  async function loadList() {
    if (state.isLoading) return;
    state.isLoading = true;
    setSyncStatus("Syncing");
    try {
      const data = await apiFetch(`/${state.tab}?${buildQuery()}`);
      state.items = data.items || [];
      state.total = data.total || 0;
      renderList();
      if (state.selectedId) {
        const updated = state.items.find(
          (entry) => (entry.request_id || entry.row_number) === state.selectedId
        );
        if (updated) {
          populateDrawer(updated);
        } else {
          closeDrawer();
          state.selectedId = "";
          state.selectedItem = null;
        }
      }
      lastSync = new Date().toLocaleTimeString();
      setSyncStatus("Synced");
    } catch (error) {
      setSyncStatus("Error");
      showToast("Failed to load data.", "error");
    } finally {
      state.isLoading = false;
    }
  }

  function renderHeader() {
    if (!ui.listHeader) return;
    const columns = LIST_COLUMNS[state.tab];
    const template = columns
      .map((col) => (col.key === "view" ? "90px" : "minmax(120px, 1fr)"))
      .join(" ");
    ui.listHeader.style.gridTemplateColumns = template;
    ui.listHeader.innerHTML = columns
      .map((col) => `<div>${col.label || ""}</div>`)
      .join("");
  }

  function renderList() {
    renderHeader();
    if (!ui.list) return;
    if (!state.items.length) {
      ui.list.innerHTML = `<div class="list-row"><div class="cell">No results</div></div>`;
      ui.results.textContent = "0 results";
      return;
    }
    const columns = LIST_COLUMNS[state.tab];
    const template = columns
      .map((col) => (col.key === "view" ? "90px" : "minmax(120px, 1fr)"))
      .join(" ");
    ui.list.innerHTML = state.items
      .map((item) => {
        const key = item.request_id || item.row_number || "";
        const cells = columns
          .map((col) => {
            if (col.key === "view") {
              return `<div class="cell"><button class="btn btn-ghost" data-view="${key}">View</button></div>`;
            }
            if (col.key === "status") {
              const status = item.status || "NEW";
              return `<div class="cell"><span class="cell-label">${col.label}</span><span class="badge" data-status="${status}">${status}</span></div>`;
            }
            const value = getValue(item, col.key);
            return `<div class="cell"><span class="cell-label">${col.label}</span><span>${value}</span></div>`;
          })
          .join("");
        return `<div class="list-row" data-row="${key}" style="grid-template-columns:${template}">${cells}</div>`;
      })
      .join("");
    ui.results.textContent = `Showing ${state.items.length} of ${state.total}`;
  }

  function updateStatusOptions() {
    if (!ui.statusSelect) return;
    ui.statusSelect.innerHTML = STATUS_OPTIONS[state.tab]
      .map((status) => `<option value="${status}">${status}</option>`)
      .join("");
    const statusFilter = ui.filters.find((el) => el.dataset.filter === "status");
    if (statusFilter) {
      statusFilter.innerHTML = '<option value="">All statuses</option>' +
        STATUS_OPTIONS[state.tab].map((status) => `<option value="${status}">${status}</option>`).join("");
    }
  }

  function populateDrawer(item) {
    const requestId = item.request_id || "Request";
    state.selectedId = requestId;
    state.selectedItem = item;
    setOriginalValues(item);
    state.pendingChanges = [];
    state.confirmation = null;
    ui.detailType.textContent = `${state.tab.slice(0, -1)} details`;
    ui.detailTitle.textContent = item.product_name || item.name || requestId;
    ui.detailSub.textContent = requestId;
    ui.detailStatus.textContent = item.status || "NEW";
    ui.detailStatus.dataset.status = item.status || "NEW";
    ui.statusSelect.value = item.status || "NEW";

    const detailFields = [
      ["Request ID", item.request_id],
      ["Created", formatDate(item.created_at)],
      ["Status", item.status],
      ["Name", item.name],
      ["Email", item.email],
      ["Phone", item.phone],
      ["Product", item.product_name],
      ["Product URL", item.product_url],
      ["Design code", item.design_code],
      ["Metal", item.metal],
      ["Stone", item.stone],
      ["Stone weight", item.stone_weight],
      ["Size", item.size],
      ["Price", item.price],
      ["Timeline", item.timeline],
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
      .filter(([, value]) => value)
      .map(([label, value]) => `<div><span>${label}</span>${value}</div>`)
      .join("");

    ui.editFields.forEach((field) => {
      const key = field.dataset.field;
      if (!key) return;
      if (key === "notes") {
        field.value = item.notes || "";
        return;
      }
      field.value = item[key] || "";
    });

    applyEditVisibility();
    renderActions();
    updatePrimaryActionState();
  }

  function applyEditVisibility() {
    const allowed = new Set(EDIT_FIELDS[state.tab]);
    ui.editFields.forEach((field) => {
      const wrapper = field.closest(".field");
      const key = field.dataset.field || "";
      const show = allowed.has(key);
      if (wrapper) wrapper.classList.toggle("is-hidden", !show);
    });
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
    const canEdit = state.role === "admin" || (state.role === "ops" && state.tab !== "contacts");
    const notesChanged = getNotesValue() !== state.originalNotes.trim();
    if (ui.notesSave) {
      ui.notesSave.disabled = !canEdit || !notesChanged;
    }

    if (!ui.primaryAction) return;
    if (state.tab !== "orders") {
      ui.primaryAction.textContent = "Save updates";
      const fields = collectEditableUpdates();
      const hasChanges = Object.keys(fields).length > 0;
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

  function renderActions() {
    const canEdit = state.role === "admin" || (state.role === "ops" && state.tab !== "contacts");
    ui.actionButtons.innerHTML = ACTIONS[state.tab]
      .map((action) => {
        const disabled = !canEdit ? "disabled" : "";
        return `<button class="btn btn-ghost" data-action="${action.action}" data-confirm="${action.confirm}" ${disabled}>${action.label}</button>`;
      })
      .join("");
    ui.statusSave.disabled = !canEdit;
    if (ui.primaryAction) {
      ui.primaryAction.disabled = !canEdit;
    }
    if (ui.notesSave) {
      ui.notesSave.disabled = !canEdit;
    }
    ui.editFields.forEach((field) => {
      field.disabled = !canEdit;
    });
  }

  function detailUrl(requestId) {
    const tab = encodeURIComponent(state.tab);
    const id = encodeURIComponent(requestId);
    return `/detail.html?tab=${tab}&id=${id}`;
  }

  function closeDrawer() {
    ui.drawer.classList.remove("is-open");
    ui.drawer.setAttribute("aria-hidden", "true");
  }

  async function runAction(action) {
    if (!state.selectedItem || !state.selectedItem.request_id) {
      showToast("Missing request ID", "error");
      return;
    }
    const payload = {
      requestId: state.selectedItem.request_id,
      action,
    };
    const endpoint =
      state.tab === "orders"
        ? "/orders/action"
        : state.tab === "quotes"
        ? "/quotes/action"
        : "/contacts/action";
    const result = await apiFetch(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (result.ok) {
      showToast("Action saved");
      await loadList();
    } else {
      showToast("Action failed", "error");
    }
  }

  async function saveDetails() {
    if (!state.selectedItem || !state.selectedItem.request_id) {
      showToast("Missing request ID", "error");
      return;
    }
    const fields = collectEditableUpdates();
    const notes = getNotesValue();
    const payload = {
      requestId: state.selectedItem.request_id,
      action: "edit",
      notes,
      fields,
    };
    const endpoint =
      state.tab === "orders"
        ? "/orders/action"
        : state.tab === "quotes"
        ? "/quotes/action"
        : "/contacts/action";
    const result = await apiFetch(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (result.ok) {
      showToast("Updates saved");
      await loadList();
    } else {
      showToast("Update failed", "error");
    }
  }

  async function saveNotes() {
    if (!state.selectedItem || !state.selectedItem.request_id) {
      showToast("Missing request ID", "error");
      return;
    }
    const notes = getNotesValue();
    const payload = {
      requestId: state.selectedItem.request_id,
      action: "edit",
      notes,
    };
    const endpoint =
      state.tab === "orders"
        ? "/orders/action"
        : state.tab === "quotes"
        ? "/quotes/action"
        : "/contacts/action";
    const result = await apiFetch(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (result.ok) {
      showToast("Notes saved");
      await loadList();
    } else {
      showToast("Notes failed", "error");
    }
  }

  async function saveStatus() {
    if (!state.selectedItem || !state.selectedItem.request_id) {
      showToast("Missing request ID", "error");
      return;
    }
    const status = ui.statusSelect.value;
    if (!status) return;
    const payload = {
      requestId: state.selectedItem.request_id,
      action: "set_status",
      status,
    };
    const endpoint =
      state.tab === "orders"
        ? "/orders/action"
        : state.tab === "quotes"
        ? "/quotes/action"
        : "/contacts/action";
    const result = await apiFetch(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (result.ok) {
      showToast("Status updated");
      await loadList();
    } else {
      showToast("Status failed", "error");
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

    if (ui.confirmSend) {
      ui.confirmSend.disabled = true;
    }
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
      if (ui.confirmSend) {
        ui.confirmSend.disabled = false;
      }
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
      action: "edit",
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
      }),
    });

    if (sendResult.ok) {
      showToast("Confirmation sent");
      closeConfirmModal();
      await loadList();
    } else {
      showToast("Email failed", "error");
    }
  }

  function bindEvents() {
    ui.tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        ui.tabs.forEach((button) => button.classList.remove("is-active"));
        tab.classList.add("is-active");
        state.tab = tab.dataset.tab;
        state.offset = 0;
        updateStatusOptions();
        loadList();
      });
    });

    ui.filters.forEach((input) => {
      input.addEventListener("change", () => {
        state.filters[input.dataset.filter] = input.value.trim();
        state.offset = 0;
        loadList();
      });
      if (input.tagName === "INPUT") {
        input.addEventListener("input", () => {
          state.filters[input.dataset.filter] = input.value.trim();
          state.offset = 0;
          loadList();
        });
      }
    });

    ui.prev.addEventListener("click", () => {
      state.offset = Math.max(state.offset - state.limit, 0);
      loadList();
    });
    ui.next.addEventListener("click", () => {
      if (state.offset + state.limit >= state.total) return;
      state.offset += state.limit;
      loadList();
    });

    ui.refresh.addEventListener("click", () => {
      if (autoRefresh) return;
      loadList();
    });

    if (ui.autoRefresh) {
      ui.autoRefresh.checked = autoRefresh;
      ui.autoRefresh.addEventListener("change", () => {
        autoRefresh = ui.autoRefresh.checked;
        localStorage.setItem("adminAutoRefresh", String(autoRefresh));
        updateSyncLine();
      });
    }

    ui.list.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const viewId = target.dataset.view;
      if (viewId) {
        window.location.href = detailUrl(viewId);
        return;
      }
      const row = target.closest(".list-row");
      if (row && row.dataset.row) {
        window.location.href = detailUrl(row.dataset.row);
      }
    });

    ui.drawerClose.addEventListener("click", closeDrawer);
    ui.drawer.addEventListener("click", (event) => {
      if (event.target === ui.drawer) closeDrawer();
    });

    ui.actionButtons.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.dataset.action;
      const confirmText = target.dataset.confirm;
      if (!action) return;
      if (confirmText && !window.confirm(confirmText)) return;
      runAction(action);
    });

    ui.editFields.forEach((field) => {
      field.addEventListener("input", () => {
        updatePrimaryActionState();
      });
    });

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

    ui.statusSave.addEventListener("click", () => {
      if (window.confirm("Update status for this record?")) saveStatus();
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
        if (window.confirm("Send confirmation to customer?")) sendConfirmation();
      });
    }
  }

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const initialTab = params.get("tab");
    if (initialTab && STATUS_OPTIONS[initialTab]) {
      state.tab = initialTab;
      ui.tabs.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.tab === state.tab);
      });
    }
    updateStatusOptions();
    bindEvents();
    updateSyncLine();
    await loadMe();
    await loadList();
    setInterval(() => {
      if (document.hidden || !autoRefresh) return;
      loadList();
    }, 60000);
  }

  init();
})();
