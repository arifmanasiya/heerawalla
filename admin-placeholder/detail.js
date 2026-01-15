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
    pendingChanges: [],
    confirmation: null,
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
    backLink: document.querySelector("[data-back-link]"),
    detailType: document.querySelector("[data-detail-type]"),
    detailTitle: document.querySelector("[data-detail-title]"),
    detailSub: document.querySelector("[data-detail-sub]"),
    detailError: document.querySelector("[data-detail-error]"),
    detailStatusCorner: document.querySelector("[data-detail-status-corner]"),
    detailGrid: document.querySelector("[data-detail-grid]"),
    actionSelect: document.querySelector("[data-action-select]"),
    actionRun: document.querySelector("[data-action-run]"),
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

  function formatTimelineValue(value) {
    const normalized = normalizeTimelineValue(value);
    if (!normalized) return "";
    if (normalized === "rush") return "Rush";
    if (normalized === "standard") return "Standard";
    return value;
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

  function applyEditVisibility() {
    const allowed = new Set(EDIT_FIELDS[state.tab]);
    ui.editFields.forEach((field) => {
      const wrapper = field.closest(".field");
      const key = field.dataset.field || "";
      const show = allowed.has(key);
      if (wrapper) wrapper.classList.toggle("is-hidden", !show);
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
    const canEdit = state.role === "admin" || (state.role === "ops" && state.tab !== "contacts");
    if (ui.actionSelect) {
      ui.actionSelect.innerHTML =
        '<option value="">Select an action</option>' +
        ACTIONS[state.tab]
          .map((action) => `<option value="${action.action}">${action.label}</option>`)
          .join("");
      ui.actionSelect.disabled = !canEdit;
    }
    if (ui.actionRun) {
      ui.actionRun.disabled = !canEdit || !ui.actionSelect || !ui.actionSelect.value;
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
  }

  function renderDetailField(label, value) {
    const safeLabel = escapeHtml(label);
    const rawValue = String(value);
    if (label === "Product URL") {
      const href = escapeAttribute(rawValue);
      const text = escapeHtml(rawValue);
      return `<div><span>${safeLabel}</span><a href="${href}" target="_blank" rel="noreferrer">${text}</a></div>`;
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

  function populateDetail(item) {
    const requestId = item.request_id || "Request";
    const status = item.status || "NEW";
    state.selectedId = requestId;
    state.selectedItem = item;
    setOriginalValues(item);
    state.pendingChanges = [];
    state.confirmation = null;

    ui.detailType.textContent = `${state.tab.slice(0, -1)} details`;
    ui.detailTitle.textContent = item.product_name || item.name || requestId;
    ui.detailSub.textContent = requestId;
    if (ui.detailStatusCorner) {
      ui.detailStatusCorner.textContent = status;
      ui.detailStatusCorner.dataset.status = status;
    }
    if (ui.detailError) ui.detailError.textContent = "";

    const detailFields = [
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
      ["Stone", item.stone],
      ["Stone weight", item.stone_weight],
      ["Size", item.size],
      ["Price", formatPrice(item.price)],
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
      .filter(([, value]) => hasValue(value))
      .map(([label, value]) => renderDetailField(label, value))
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
      const params = new URLSearchParams({ request_id: requestId, limit: "1", offset: "0" });
      const data = await apiFetch(`/${state.tab}?${params.toString()}`);
      const item = (data.items || [])[0];
      if (!item) {
        setSyncStatus("Not found");
        if (ui.detailError) ui.detailError.textContent = "Record not found.";
        return;
      }
      populateDetail(item);
      setSyncStatus("Loaded");
    } catch (error) {
      setSyncStatus("Error");
      if (ui.detailError) ui.detailError.textContent = "Failed to load record.";
      showToast("Failed to load record.", "error");
    }
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
      await loadRecord(state.selectedItem.request_id);
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
      await loadRecord(state.selectedItem.request_id);
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
      await loadRecord(state.selectedItem.request_id);
    } else {
      showToast("Notes failed", "error");
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
    await loadRecord(id);
  }

  init();
})();
