export function createQuoteHelpers({
  state,
  ui,
  escapeAttribute,
  isFilled,
  normalizeText,
  getEditField,
  getEditValue,
  loadCatalog,
  resolveCatalogEntry,
}) {
  const getSizingBlob = (item) => {
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
  };

  const getSizingValue = (item, sizing, textSizing, keys) => {
    for (const key of keys) {
      const itemValue = item ? item[key] : "";
      if (isFilled(itemValue)) return itemValue;
      const sizingValue = sizing ? sizing[key] : "";
      if (isFilled(sizingValue)) return sizingValue;
      const textValue = textSizing ? textSizing[key] : "";
      if (isFilled(textValue)) return textValue;
    }
    return "";
  };

  const getSizingText = (item) => {
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
  };

  const parseSizingFromText = (text) => {
    if (!isFilled(text)) return {};
    const matchValue = (regex) => {
      const match = text.match(regex);
      return match && match[1] ? match[1].trim() : "";
    };
    return {
      ring: matchValue(/\bring(?:\s*size)?\s*:\s*([^|\n,;]+)/i),
      wrist: matchValue(/\b(?:wrist|bracelet)(?:\s*size)?\s*:\s*([^|\n,;]+)/i),
      neck: matchValue(/\b(?:neck|necklace|chain)(?:\s*(?:size|length))?\s*:\s*([^|\n,;]+)/i),
      earring: matchValue(/\bearrings?(?:\s*(?:style|type|size|preference))?\s*:\s*([^|\n,;]+)/i),
    };
  };

  const buildSizingRows = (item) => {
    const sizing = getSizingBlob(item);
    const rows = [];
    const textSizing = parseSizingFromText(getSizingText(item));
    const ringSize = getSizingValue(item, sizing, textSizing, ["ring_size", "ring", "ringSize"]);
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
  };

  const buildSizingSpec = (entry) => {
    const rawTags = entry?.tags;
    const tags = (Array.isArray(rawTags) ? rawTags : String(rawTags || "").split(/[|,;\n]/))
      .map((tag) => String(tag || "").trim().toLowerCase())
      .filter(Boolean);
    const hasTag = (values) => values.some((value) => tags.includes(value));
    const isSet = hasTag(["set", "sets"]);
    const wantsRing = hasTag(["ring", "rings", "band", "bands"]);
    const wantsBracelet = hasTag(["bracelet", "bracelets", "bangle", "bangles", "wrist"]);
    const wantsChain = hasTag(["pendant", "pendants", "necklace", "necklaces", "chain", "chains"]);
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
      chain: category.includes("pendant") || category.includes("necklace") || category.includes("chain"),
    };
  };

  const buildSizeSummary = (values) => {
    const parts = [];
    if (isFilled(values.ring)) parts.push(`Ring size: ${values.ring}`);
    if (isFilled(values.bracelet)) parts.push(`Bracelet size: ${values.bracelet}`);
    if (isFilled(values.chain)) parts.push(`Chain size: ${values.chain}`);
    return parts.join(" | ");
  };

  let isSyncingSizing = false;
  const syncSizingToSizeField = () => {
    if (isSyncingSizing) return;
    const sizeField = getEditField("size");
    if (!sizeField) return;
    const values = {
      ring: ui.sizeRing ? ui.sizeRing.value.trim() : "",
      bracelet: ui.sizeBracelet ? ui.sizeBracelet.value.trim() : "",
      chain: ui.sizeChain ? ui.sizeChain.value.trim() : "",
    };
    const summary = buildSizeSummary(values);
    if (summary) {
      sizeField.value = summary;
    }
  };

  const applySizingVisibility = (spec) => {
    const toggle = (node, show) => {
      if (!node) return;
      const wrapper = node.closest(".field");
      if (wrapper) wrapper.classList.toggle("is-hidden", !show);
    };
    if (state.tab !== "quotes") {
      toggle(ui.sizeRing, false);
      toggle(ui.sizeBracelet, false);
      toggle(ui.sizeChain, false);
      return;
    }
    toggle(ui.sizeRing, Boolean(spec?.ring));
    toggle(ui.sizeBracelet, Boolean(spec?.bracelet));
    toggle(ui.sizeChain, Boolean(spec?.chain));
  };

  const refreshSizingInputs = async (item) => {
    if (state.tab !== "quotes") return;
    const catalog = await loadCatalog();
    const entry = resolveCatalogEntry(item, catalog);
    const sizing = getSizingBlob(item);
    const textSizing = parseSizingFromText(getSizingText(item));
    isSyncingSizing = true;
    const ringValue = getSizingValue(item, sizing, textSizing, ["ring_size", "ring", "ringSize"]);
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
    if (ui.sizeRing) {
      ui.sizeRing.value = ringValue;
    }
    if (ui.sizeBracelet) {
      ui.sizeBracelet.value = braceletValue;
    }
    if (ui.sizeChain) {
      ui.sizeChain.value = chainValue;
    }
    isSyncingSizing = false;
  };

  const getDiamondBreakdownField = () => {
    return ui.editFields.find((field) => field.dataset.field === "diamond_breakdown");
  };

  const parseDiamondBreakdownValue = (value) => {
    if (!value) return [];
    return String(value)
      .split(/\n|;|,/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const match = entry.match(/([0-9]*\.?[0-9]+)\s*(?:ct)?\s*[xX]\s*([0-9]*\.?[0-9]+)/i);
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
  };

  const formatDiamondBreakdown = (rows) => {
    return rows
      .map((row) => {
        const weight = String(row.weight || "").trim();
        const count = String(row.count || "").trim();
        if (!weight || !count) return "";
        return `${weight} x ${count}`;
      })
      .filter(Boolean)
      .join("\n");
  };

  const getDiamondRowsFromDom = () => {
    if (!ui.diamondBreakdownRows) return [];
    return Array.from(ui.diamondBreakdownRows.querySelectorAll("[data-diamond-row]")).map(
      (row) => {
        const weight = row.querySelector("[data-diamond-weight]")?.value?.trim() || "";
        const count = row.querySelector("[data-diamond-count]")?.value?.trim() || "";
        return { weight, count };
      }
    );
  };

  let isSyncingBreakdown = false;
  const syncDiamondBreakdownField = () => {
    if (isSyncingBreakdown) return;
    const field = getDiamondBreakdownField();
    if (!field) return;
    const rows = getDiamondRowsFromDom();
    isSyncingBreakdown = true;
    field.value = formatDiamondBreakdown(rows);
    isSyncingBreakdown = false;
  };

  const renderDiamondBreakdownRows = (rows) => {
    if (!ui.diamondBreakdownRows) return;
    if (!rows.length) {
      ui.diamondBreakdownRows.innerHTML =
        '<p class="muted">No diamond pieces yet. Add a row to begin.</p>';
      return;
    }
    ui.diamondBreakdownRows.innerHTML = rows
      .map(
        (row, index) => `
          <div class="diamond-row" data-diamond-row data-row-index="${index}">
            <input type="text" data-diamond-weight placeholder="0.10" value="${escapeAttribute(
              row.weight || ""
            )}" />
            <span>ct x</span>
            <input type="text" data-diamond-count placeholder="1" value="${escapeAttribute(
              row.count || ""
            )}" />
            <button class="btn btn-ghost" type="button" data-diamond-remove>Remove</button>
          </div>`
      )
      .join("");
  };

  const setDiamondBreakdownRowsFromField = () => {
    const field = getDiamondBreakdownField();
    if (!field) return;
    const rows = parseDiamondBreakdownValue(field.value);
    renderDiamondBreakdownRows(rows);
  };

  const toggleDiamondBreakdownVisibility = () => {
    if (!ui.diamondBreakdown) return;
    ui.diamondBreakdown.classList.toggle("is-hidden", state.tab !== "quotes");
  };

  return {
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
  };
}

export function getQuoteDetailSections({
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
}) {
  return [
    {
      title: "At a glance",
      rows: [
        ["Request ID", item.request_id],
        ["Created", formatDate(item.created_at)],
        ["Status", item.status],
        ["Price", formatPrice(item.price)],
        ["Timeline", item.timeline],
        ["Timeline delay", formatDelayWeeks(item.timeline_adjustment_weeks)],
      ],
    },
    {
      title: "Client",
      rows: [
        ["Name", item.name],
        ["Email", item.email],
        ["Phone", formatPhone(item.phone)],
      ],
    },
    {
      title: "Piece",
      rows: [
        ["Product", item.product_name],
        ["Images", renderQuoteMediaSlot()],
        ["Design code", item.design_code],
        ["Metal", item.metal],
        [buildMetalWeightLabel(item.metal), formatGrams(item.metal_weight)],
        [buildMetalWeightAdjustmentLabel(item.metal), formatSignedGrams(item.metal_weight_adjustment)],
        ["Stone", item.stone],
        ["Stone weight", item.stone_weight],
        ["Diamond breakdown", item.diamond_breakdown],
      ],
    },
    {
      title: "Sizing",
      rows: buildSizingRows(item),
    },
    {
      title: "Quote options",
      rows: [
        ["Discount type", item.quote_discount_type],
        ["Discount percent", item.quote_discount_percent],
      ],
    },
    {
      title: "Address",
      rows: [
        ["Address", item.address_line1],
        ["City", item.city],
        ["State", item.state],
        ["Postal code", item.postal_code],
        ["Country", item.country],
      ],
    },
    {
      title: "Preferences",
      rows: [
        ["Interests", item.interests],
        ["Contact preference", item.contact_preference],
        ["Subscription", item.subscription_status],
      ],
    },
  ];
}
