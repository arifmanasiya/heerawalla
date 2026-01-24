(() => {
  const LIST_FIELDS = new Set([
    "categories",
    "styles",
    "motifs",
    "metals",
    "stone_types",
    "tags",
    "cut",
    "clarity",
    "color",
    "palette",
    "takeaways",
    "translation_notes",
  ]);

  const ENUM_KEYS = {
    design_code: "design_codes",
    collection: "collections",
    gender: "genders",
    categories: "categories",
    styles: "styles",
    motifs: "motifs",
    metals: "metals",
    stone_types: "stone_types",
    cut: "cuts",
    clarity: "clarities",
    color: "colors",
    tags: "tags",
  };

  function normalizeSlug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function parseList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((entry) => String(entry || "").trim()).filter(Boolean);
    const text = String(value || "").trim();
    if (!text) return [];
    if (text.startsWith("[")) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          return parsed.map((entry) => String(entry || "").trim()).filter(Boolean);
        }
      } catch {
        return [];
      }
    }
    return text
      .split(/[|,\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  function uniqueList(values) {
    const set = new Set(values.map((entry) => String(entry || "").trim()).filter(Boolean));
    return Array.from(set.values());
  }

  function normalizeBoolean(value) {
    if (typeof value === "boolean") return value;
    const text = String(value || "").trim().toLowerCase();
    return text === "true" || text === "1" || text === "yes";
  }

  function normalizeMetal(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    return text
      .replace(/whitegold/gi, "White Gold")
      .replace(/yellowgold/gi, "Yellow Gold")
      .replace(/rosegold/gi, "Rose Gold")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeEnumValues(values, enumList) {
    const normalized = [];
    const lookup = new Map(
      (enumList || []).map((entry) => [String(entry.value).toLowerCase(), entry.value])
    );
    values.forEach((value) => {
      const match = lookup.get(String(value).toLowerCase());
      normalized.push(match || value);
    });
    return uniqueList(normalized);
  }

  function parseLegacyFields(item, enums) {
    const output = { ...(item || {}) };
    Object.keys(output).forEach((key) => {
      if (!LIST_FIELDS.has(key)) return;
      const parsed = parseList(output[key]);
      const enumKey = ENUM_KEYS[key];
      const enumList = enumKey ? enums?.[enumKey] || [] : [];
      output[key] = normalizeEnumValues(parsed, enumList);
    });
    if (output.slug) output.slug = normalizeSlug(output.slug);
    if (output.metals) {
      output.metals = output.metals.map(normalizeMetal).filter(Boolean);
    }
    output.is_active = normalizeBoolean(output.is_active);
    output.is_featured = normalizeBoolean(output.is_featured);
    return output;
  }

  function serializeList(values) {
    return JSON.stringify(uniqueList(values));
  }

  function normalizeCatalogItem(formState, enums) {
    const normalized = parseLegacyFields(formState || {}, enums);
    const fields = { ...normalized };

    Object.keys(fields).forEach((key) => {
      if (!LIST_FIELDS.has(key)) return;
      const values = Array.isArray(fields[key]) ? fields[key] : parseList(fields[key]);
      const enumKey = ENUM_KEYS[key];
      const enumList = enumKey ? enums?.[enumKey] || [] : [];
      const cleaned = normalizeEnumValues(values, enumList);
      fields[key] = serializeList(cleaned);
      normalized[key] = cleaned;
    });

    if (fields.slug) fields.slug = normalizeSlug(fields.slug);
    if (fields.metals) {
      const metals = parseList(normalized.metals || fields.metals).map(normalizeMetal);
      normalized.metals = metals;
      fields.metals = serializeList(metals);
    }
    fields.is_active = normalizeBoolean(fields.is_active) ? "1" : "0";
    fields.is_featured = normalizeBoolean(fields.is_featured) ? "1" : "0";
    if (fields.cut && !fields.cut_range) fields.cut_range = fields.cut;
    if (fields.clarity && !fields.clarity_range) fields.clarity_range = fields.clarity;
    if (fields.color && !fields.color_range) fields.color_range = fields.color;
    if (fields.carat) {
      const parsed = Number(fields.carat);
      fields.carat = Number.isFinite(parsed) ? String(parsed) : fields.carat;
    }

    return { normalized, fields };
  }

  function validateCatalogItem(item, enums, mediaState) {
    const missingCritical = [];
    const warnings = [];
    const safeItem = item || {};
    const required = [
      { key: "name", label: "Name", selector: '[data-field="name"]' },
      { key: "slug", label: "Slug", selector: '[data-field="slug"]' },
      { key: "design_code", label: "Design code", selector: '[data-field="design_code"]' },
    ];
    required.forEach((field) => {
      if (!String(safeItem[field.key] || "").trim()) {
        missingCritical.push({ field: field.key, message: `${field.label} required`, selector: field.selector });
      }
    });
    const requiredLists = [
      { key: "categories", label: "Categories", selector: '[data-field="categories"] [data-chip-search]' },
      { key: "metals", label: "Metals", selector: '[data-field="metals"] [data-chip-search]' },
      { key: "stone_types", label: "Stone types", selector: '[data-field="stone_types"] [data-chip-search]' },
    ];
    requiredLists.forEach((field) => {
      const values = Array.isArray(safeItem[field.key]) ? safeItem[field.key] : parseList(safeItem[field.key]);
      if (!values.length) {
        missingCritical.push({ field: field.key, message: `${field.label} required`, selector: field.selector });
      }
    });
    const isActive = normalizeBoolean(safeItem.is_active);
    if (safeItem.is_active === undefined || safeItem.is_active === null) {
      missingCritical.push({
        field: "is_active",
        message: "Active flag required",
        selector: '[data-field="is_active"]',
      });
    }
    if (isActive) {
      const hero = String(safeItem.hero_image || "").trim();
      const hasHeroMedia =
        mediaState?.items?.some((item) => {
          const position = String(item.position || "").toLowerCase();
          const primary = String(item.is_primary || "").toLowerCase();
          return position === "hero" && (primary === "1" || primary === "true");
        }) || false;
      if (!hero && !hasHeroMedia) {
        missingCritical.push({
          field: "hero_image",
          message: "Hero image required for active items",
          selector: '[data-field="hero_image"]',
        });
      }
    }
    ["cut", "clarity", "color"].forEach((key) => {
      const enumKey = ENUM_KEYS[key];
      const enumList = (enums && enumKey && enums[enumKey]) || [];
      const values = Array.isArray(safeItem[key]) ? safeItem[key] : parseList(safeItem[key]);
      const unknown = findUnknownValues(values, enumList);
      if (unknown.length) {
        warnings.push({ field: key, message: `Unknown ${key}: ${unknown.join(", ")}` });
      }
    });
    Object.keys(ENUM_KEYS).forEach((key) => {
      const enumKey = ENUM_KEYS[key];
      const enumList = enums?.[enumKey] || [];
      if (!LIST_FIELDS.has(key)) return;
      const values = Array.isArray(safeItem[key]) ? safeItem[key] : parseList(safeItem[key]);
      const unknown = findUnknownValues(values, enumList);
      if (unknown.length) {
        warnings.push({ field: key, message: `Unknown ${key}: ${unknown.join(", ")}` });
      }
    });
    ["design_code", "collection", "gender"].forEach((key) => {
      const enumKey = ENUM_KEYS[key];
      const enumList = enums?.[enumKey] || [];
      const value = String(safeItem[key] || "").trim();
      if (!value) return;
      const allowed = new Set(enumList.map((entry) => String(entry.value).toLowerCase()));
      if (!allowed.has(value.toLowerCase())) {
        warnings.push({ field: key, message: `Unknown ${key}: ${value}` });
      }
    });
    return { missingCritical, warnings };
  }

  function findUnknownValues(values, enumList) {
    const allowed = new Set((enumList || []).map((entry) => String(entry.value).toLowerCase()));
    return (values || [])
      .map((value) => String(value))
      .filter((value) => value && !allowed.has(value.toLowerCase()));
  }

  const exports = {
    parseLegacyFields,
    normalizeCatalogItem,
    validateCatalogItem,
    normalizeSlug,
    parseList,
    normalizeMetal,
  };
  if (typeof window !== "undefined") {
    window.CatalogUtils = exports;
  } else {
    globalThis.CatalogUtils = exports;
  }
})();
