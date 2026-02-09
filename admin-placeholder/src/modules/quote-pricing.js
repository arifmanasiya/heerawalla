export function createQuotePricingHelpers({
  state,
  ui,
  quoteOptionFields,
  quotePricingFields,
  quotePriceFields,
  isGoldOnlyQuote,
  getEditField,
  getEditValue,
  getCatalogBase,
  updatePrimaryActionState,
}) {
  let quotePricingTimer = null;
  let quotePricingInFlight = false;

  const markQuotePriceManual = (field) => {
    if (!field) return;
    field.dataset.auto = "false";
    field.dataset.manual = "true";
  };

  const shouldApplyAutoPrice = (field) => {
    if (!field) return false;
    const manual = field.dataset.manual === "true";
    if (manual && field.value) return false;
    return true;
  };

  const resetQuoteAutoPricingState = () => {
    if (state.tab !== "quotes") return;
    quoteOptionFields.forEach((option) => {
      const field = getEditField(option.price);
      if (!field) return;
      field.dataset.auto = "true";
      field.dataset.manual = "";
    });
  };

  const collectQuotePricingFields = () => {
    if (state.tab !== "quotes") return null;
    const metalWeight = getEditValue("metal_weight");
    if (!metalWeight) return null;
    const goldOnly = isGoldOnlyQuote();
    const hasOption = quoteOptionFields.some((option) => {
      return Boolean(getEditValue(option.clarity) || getEditValue(option.color));
    });
    if (!hasOption && !goldOnly) return null;
    const fields = {};
    quotePricingFields.forEach((key) => {
      const value = getEditValue(key);
      if (value) fields[key] = value;
    });
    return fields;
  };

  const applyQuotePricing = (fields) => {
    if (!fields) return;
    quoteOptionFields.forEach((option) => {
      const value = fields[option.price];
      if (!value) return;
      const field = getEditField(option.price);
      if (!shouldApplyAutoPrice(field)) return;
      field.value = value;
      field.dataset.auto = "true";
      field.dataset.manual = "";
    });
    updatePrimaryActionState();
  };

  const refreshQuotePricing = async () => {
    if (state.tab !== "quotes" || quotePricingInFlight) return;
    const fields = collectQuotePricingFields();
    if (!fields) return;
    const basePayload = {
      metal: fields.metal || "",
      metal_weight: fields.metal_weight || "",
      stone: fields.stone || "",
      stone_weight: fields.stone_weight || "",
      diamond_breakdown: fields.diamond_breakdown || "",
      timeline: fields.timeline || "",
      timeline_adjustment_weeks: fields.timeline_adjustment_weeks || "",
      quote_discount_type: fields.quote_discount_type || "",
      quote_discount_percent: fields.quote_discount_percent || "",
      size: getEditValue("size") || "",
      size_label: "",
      size_ring: ui.sizeRing ? ui.sizeRing.value.trim() : "",
      size_bracelet: ui.sizeBracelet ? ui.sizeBracelet.value.trim() : "",
      size_chain: ui.sizeChain ? ui.sizeChain.value.trim() : "",
    };
    const pricingBase = getCatalogBase();
    quotePricingInFlight = true;
    try {
      const updates = {};
      const goldOnly = isGoldOnlyQuote();
      const requests = quoteOptionFields.map(async (option, index) => {
        const clarity = fields[option.clarity] || "";
        const color = fields[option.color] || "";
        if (!clarity && !color && !(goldOnly && index === 0)) return;
        const payload = { ...basePayload, clarity, color };
        const response = await fetch(`${pricingBase}/pricing/estimate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.ok) return;
        updates[option.price] = String(data.price || "");
      });
      await Promise.all(requests);
      applyQuotePricing(updates);
    } catch (error) {
      return;
    } finally {
      quotePricingInFlight = false;
    }
  };

  const scheduleQuotePricingUpdate = () => {
    if (state.tab !== "quotes") return;
    if (quotePricingTimer) clearTimeout(quotePricingTimer);
    quotePricingTimer = setTimeout(() => {
      refreshQuotePricing();
    }, 350);
  };

  return {
    markQuotePriceManual,
    resetQuoteAutoPricingState,
    scheduleQuotePricingUpdate,
    quotePriceFields,
  };
}
