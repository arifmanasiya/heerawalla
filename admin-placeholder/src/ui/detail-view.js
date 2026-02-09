export function createDetailView({
  state,
  ui,
  tabLabels,
  detailFieldBuilders,
  detailSectionBuilders,
  editFields,
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
}) {
  const applyEditVisibility = () => {
    const allowed = new Set(editFields[state.tab]);
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
  };

  const populateDrawer = (item) => {
    const requestId = (item.request_id || item.email || item.row_number || item.slug || item.id || item.media_id || "") || "Record";
    state.selectedId = requestId;
    state.selectedItem = item;
    setOriginalValues(item);
    state.pendingChanges = [];
    state.confirmation = null;
    const detailLabel = tabLabels[state.tab] || state.tab;
    ui.detailType.textContent = `${detailLabel} details`;
    ui.detailTitle.textContent =
      item.product_name || item.name || item.key || item.metal || item.clarity || requestId;
    ui.detailSub.textContent = requestId;
    const statusValue =
      state.tab === "contacts" || state.tab === "cost-chart" || state.tab === "diamond-price-chart"
        ? "--"
        : item.status || "NEW";
    ui.detailStatus.textContent = statusValue;
    ui.detailStatus.dataset.status = statusValue;
    updateStatusOptions();
    if (ui.statusSelect && ui.statusSelect.options.length) {
      ui.statusSelect.value = ui.statusSelect.options[0].value || "";
    }

    const detailContext = {
      item,
      formatDate,
      formatPhone,
      formatPrice,
      formatDelayWeeks,
      formatGrams,
      formatSignedGrams,
      buildMetalWeightLabel,
      buildMetalWeightAdjustmentLabel,
      buildSizingRows,
      renderQuoteMediaSlot,
      getContactNotes,
    };

    const detailFields = detailFieldBuilders[state.tab]
      ? detailFieldBuilders[state.tab](detailContext)
      : [];

    const detailSections = detailSectionBuilders[state.tab]
      ? detailSectionBuilders[state.tab](detailContext)
      : [];

    if (detailSections.length) {
      ui.detailGrid.classList.add("detail-sections");
      ui.detailGrid.innerHTML = renderDetailSections(detailSections, isFilled);
    } else {
      ui.detailGrid.classList.remove("detail-sections");
      ui.detailGrid.innerHTML = renderDetailRows(detailFields, isFilled);
    }
    refreshQuoteMedia(item);
    refreshSizingInputs(item);

    ui.editFields.forEach((field) => {
      const key = field.dataset.field;
      if (!key) return;
      if (key === "notes") {
        field.value = item.notes || "";
        return;
      }
      field.value = item[key] || "";
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
    toggleDiamondBreakdownVisibility();
    applySizingVisibility(null);
    renderActions();
    updatePrimaryActionState();
  };

  return {
    applyEditVisibility,
    populateDrawer,
  };
}
