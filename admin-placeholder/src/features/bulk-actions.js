export function createBulkActions({
  state,
  ui,
  apiFetch,
  getActionEndpoint,
  showToast,
  renderList,
  loadList,
  isBulkEnabled,
  clearSelection,
}) {
  function updateBulkActions() {
    if (!ui.bulkActions) return;
    if (!isBulkEnabled() || !state.selectedItems.length) {
      ui.bulkActions.classList.add("is-hidden");
      ui.bulkActions.innerHTML = "";
      return;
    }
    const actions = getBulkActionsForTab(state.tab);
    ui.bulkActions.classList.remove("is-hidden");
    ui.bulkActions.innerHTML = `
      <div class="bulk-info">
        <span>${state.selectedItems.length} selected</span>
        <button class="btn-link" data-bulk-clear type="button">Clear</button>
      </div>
      <div class="bulk-buttons">
        ${actions
          .map(
            (action) =>
              `<button class="btn ${action.danger ? "btn-danger" : ""}" data-bulk-action="${action.action}" type="button">${action.label}</button>`
          )
          .join("")}
      </div>
    `;
  }

  function getBulkActionsForTab(tab) {
    const actions = {
      orders: [
        { action: "acknowledge", label: "Acknowledge" },
        { action: "cancel", label: "Cancel" },
        { action: "delete", label: "Delete", danger: true },
      ],
      quotes: [
        { action: "acknowledge", label: "Acknowledge" },
        { action: "drop", label: "Drop" },
        { action: "delete", label: "Delete", danger: true },
      ],
      tickets: [
        { action: "mark_resolved", label: "Resolve" },
        { action: "delete", label: "Delete", danger: true },
      ],
      products: [{ action: "delete", label: "Delete", danger: true }],
    };
    return actions[tab] || [];
  }

  async function handleBulkAction(action) {
    if (!state.selectedItems.length) return;
    const label = getBulkActionsForTab(state.tab).find((entry) => entry.action === action)?.label || action;
    if (!window.confirm(`Apply \"${label}\" to ${state.selectedItems.length} items?`)) return;
    const endpoint = getActionEndpoint();
    if (!endpoint) {
      showToast("No bulk actions available.", "error");
      return;
    }
    let successCount = 0;
    for (const id of state.selectedItems) {
      try {
        const payload = { action, requestId: id };
        const result = await apiFetch(endpoint, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (result.ok) successCount += 1;
      } catch {
        // Ignore per-item errors and continue.
      }
    }
    showToast(`Updated ${successCount} of ${state.selectedItems.length} items`);
    clearSelection();
    await loadList();
    renderList();
  }

  return { updateBulkActions, handleBulkAction, getBulkActionsForTab };
}
