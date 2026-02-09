export function createRecordActions({
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
  requiredShippingFields,
  pricingTabs,
  getEditField,
  collectConfirmChanges,
  buildConfirmationEmail,
  resolveConfirmationUrl,
  openConfirmModal,
  closeConfirmModal,
  loadOrderDetails,
}) {
  const saveQuoteBeforeRefresh = async (recordId) => {
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
  };

  const runAction = async (action) => {
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
      const missing = requiredShippingFields.filter((field) => !details[field]);
      if (missing.length) {
        showToast("Add required fulfillment details before shipping.", "error");
        return;
      }
    }
    const payload = { action };
    if (state.tab === "cost-chart" || state.tab === "diamond-price-chart") {
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
      await loadList();
    } else {
      showToast("Action failed", "error");
    }
  };

  const saveDetails = async () => {
    const recordId = getSelectedRecordId();
    if (!recordId) {
      showToast("Missing record ID", "error");
      return;
    }
    const fields = collectEditableUpdates();
    const notes = getNotesValue();
    if (pricingTabs.has(state.tab)) {
      fields.notes = notes;
    }
    const payload = { action: "edit", fields };
    if (state.tab === "cost-chart" || state.tab === "diamond-price-chart") {
      payload.rowNumber = recordId;
    } else {
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
      await loadList();
    } else {
      showToast("Update failed", "error");
    }
  };

  const saveNotes = async () => {
    if (pricingTabs.has(state.tab)) {
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
        await loadList();
      } else {
        showToast("Comment failed", "error");
      }
      return;
    }
    const notes = getNotesValue();
    const payload = { action: "edit", notes };
    if (state.tab === "cost-chart" || state.tab === "diamond-price-chart") {
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
      await loadList();
    } else {
      showToast("Notes failed", "error");
    }
  };

  const saveOrderDetails = async () => {
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
  };

  const saveStatus = async () => {
    const recordId = getSelectedRecordId();
    if (!recordId) {
      showToast("Missing record ID", "error");
      return;
    }
    const status = ui.statusSelect.value;
    if (!status) return;
    const details = state.tab === "orders" ? collectOrderDetailsUpdates() : {};
    if (state.tab === "orders" && status === "SHIPPED") {
      const missing = requiredShippingFields.filter((field) => !details[field]);
      if (missing.length) {
        showToast("Add required fulfillment details before shipping.", "error");
        return;
      }
    }
    const payload = {
      requestId: recordId,
      action: "set_status",
      status,
    };
    if (state.tab === "orders" && Object.keys(details).length) {
      payload.details = details;
    }
    const endpoint = getActionEndpoint();
    if (!endpoint) {
      showToast("No status updates available.", "error");
      return;
    }
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
  };

  const prepareConfirmation = async () => {
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
  };

  const sendConfirmation = async () => {
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
      await loadList();
    } else {
      showToast("Email failed", "error");
    }
  };

  return {
    prepareConfirmation,
    runAction,
    saveDetails,
    saveNotes,
    saveOrderDetails,
    saveStatus,
    sendConfirmation,
  };
}
