export function createEditHelpers({
  state,
  ui,
  confirmFields,
  editFields,
  pricingTabs,
  canEditCurrentTab,
  actions,
  orderActionFlow,
  normalizeStatus,
  syncQuoteMetalInput,
  getEditValue,
}) {
  const setOriginalValues = (item) => {
    state.originalValues = {};
    state.originalRaw = {};
    confirmFields.forEach((field) => {
      const raw = String(item[field.key] || "");
      state.originalRaw[field.key] = raw;
      state.originalValues[field.key] = field.normalize(raw);
    });
    state.originalNotes = String(item.notes || "");
  };

  const collectConfirmChanges = () => {
    const changes = [];
    confirmFields.forEach((field) => {
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
  };

  const collectEditableUpdates = () => {
    const fields = {};
    syncQuoteMetalInput();
    ui.editFields.forEach((field) => {
      const key = field.dataset.field;
      if (!key) return;
      if (key === "notes") return;
      if (!editFields[state.tab].includes(key)) return;
      if (field.value) fields[key] = field.value.trim();
    });
    return fields;
  };

  const getNotesValue = () => {
    const notesField = ui.editFields.find((field) => field.dataset.field === "notes");
    return notesField ? notesField.value.trim() : "";
  };

  const updatePrimaryActionState = () => {
    const canEdit = canEditCurrentTab();
    const notesChanged = getNotesValue() !== state.originalNotes.trim();
    if (ui.notesSave) {
      if (pricingTabs.has(state.tab) || state.tab === "quotes") {
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
      if (pricingTabs.has(state.tab)) {
        fields.notes = getNotesValue();
      }
      const hasChanges =
        Object.keys(fields).length > 0 || (state.tab === "quotes" && notesChanged);
      ui.primaryAction.textContent = "Save updates";
      ui.primaryAction.disabled = !canEdit || !hasChanges;
      return;
    }

    ui.primaryAction.textContent = "Get Customer Confirmation";
    const changes = collectConfirmChanges();
    state.pendingChanges = changes;
    ui.primaryAction.disabled = !canEdit || changes.length === 0;
  };

  const renderActions = () => {
    const canEdit = canEditCurrentTab();
    const actionsList =
      state.tab === "orders" && state.selectedItem
        ? actions.orders.filter((action) => {
            if (action.action === "delete") return true;
            return (orderActionFlow[normalizeStatus(state.selectedItem.status)] || []).includes(action.action);
          })
        : actions[state.tab];
    ui.actionButtons.innerHTML = actionsList
      .map((action) => {
        const disabled = !canEdit ? "disabled" : "";
        return `<button class="btn btn-ghost" data-action="${action.action}" data-confirm="${action.confirm}" ${disabled}>${action.label}</button>`;
      })
      .join("");
    ui.actionButtons.style.display = actionsList.length ? "" : "none";
    let hasStatusOptions = false;
    if (ui.statusSelect) {
      hasStatusOptions =
        ui.statusSelect.options.length > 0 && ui.statusSelect.options[0].value !== "";
      ui.statusSelect.disabled = !canEdit || !hasStatusOptions;
    }
    ui.statusSave.disabled = !canEdit || !hasStatusOptions;
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
  };

  return {
    collectConfirmChanges,
    collectEditableUpdates,
    getNotesValue,
    renderActions,
    setOriginalValues,
    updatePrimaryActionState,
  };
}
