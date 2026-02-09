export function createQuoteSettingsHelpers({
  state,
  ui,
  normalizeText,
  getEditValue,
  getEditField,
}) {
  const buildMetalWeightLabel = () => "Metal weight (g)";
  const buildMetalWeightAdjustmentLabel = () => "Final Metal weight difference (g)";

  const updateMetalWeightLabels = () => {
    if (ui.metalWeightLabel) {
      ui.metalWeightLabel.textContent = buildMetalWeightLabel();
    }
    if (ui.metalWeightAdjustmentLabel) {
      ui.metalWeightAdjustmentLabel.textContent = buildMetalWeightAdjustmentLabel();
    }
  };

  const getRequestedMetalGroup = (value) => {
    const normalized = normalizeText(value);
    if (normalized.includes("platinum")) return "Platinum";
    if (normalized.includes("14k")) return "14K";
    if (normalized.includes("18k")) return "18K";
    return "";
  };

  const toggleFieldVisibility = (key, show) => {
    const field = getEditField(key);
    if (!field) return;
    const wrapper = field.closest(".field");
    if (wrapper) wrapper.classList.toggle("is-hidden", !show);
  };

  const isGoldOnlyQuote = () => {
    if (state.tab !== "quotes") return false;
    const stoneWeight = Number(getEditValue("stone_weight"));
    const diamondBreakdown = getEditValue("diamond_breakdown");
    const hasBreakdown = Boolean(String(diamondBreakdown || "").trim());
    return (!Number.isFinite(stoneWeight) || stoneWeight <= 0) && !hasBreakdown;
  };

  const applyGoldOnlyQuoteState = () => {
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
  };

  const applyDiscountControlState = () => {
    if (state.tab !== "quotes") return;
    const type = normalizeText(getEditValue("quote_discount_type"));
    const percentField = getEditField("quote_discount_percent");
    if (!percentField) return;
    const isCustom = type === "custom";
    percentField.disabled = !isCustom;
  };

  const syncQuoteMetalInput = () => {
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
  };

  const setQuoteMetalSelection = (value, requestedMetal = "") => {
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
  };

  return {
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
  };
}
