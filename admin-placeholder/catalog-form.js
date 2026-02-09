(() => {
  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
  }

  function buildEnumOptions(options, selected, includeEmpty, placeholder) {
    const safeSelected = String(selected || "");
    const items = [];
    if (includeEmpty) {
      items.push(`<option value="">${escapeHtml(placeholder || "Select")}</option>`);
    }
    (options || []).forEach((option) => {
      const value = String(option.value || "");
      const label = String(option.label || option.value || "");
      const isSelected = safeSelected && value.toLowerCase() === safeSelected.toLowerCase();
      items.push(
        `<option value="${escapeAttribute(value)}"${isSelected ? " selected" : ""}>${escapeHtml(
          label
        )}</option>`
      );
    });
    return items.join("");
  }

  function renderTextInput({
    label,
    field,
    value,
    placeholder,
    readOnly,
    fullSpan,
    helperHtml,
    type,
  }) {
    const inputType = type || "text";
    return `
      <label class="field ${fullSpan ? "full-span" : ""}">
        <span>${escapeHtml(label)}</span>
        ${helperHtml ? `<div class="field-inline">` : ""}
        <input type="${escapeAttribute(inputType)}" data-field="${escapeAttribute(field)}" value="${escapeAttribute(
          value || ""
        )}" ${readOnly ? 'data-readonly="true" disabled' : ""} placeholder="${escapeAttribute(
          placeholder || ""
        )}" />
        ${helperHtml || ""}
        ${helperHtml ? `</div>` : ""}
      </label>
    `;
  }

  function renderTextarea({ label, field, value, placeholder, readOnly, fullSpan, rows, counter }) {
    return `
      <label class="field ${fullSpan ? "full-span" : ""}">
        <span>${escapeHtml(label)}</span>
        <textarea rows="${rows || 3}" data-field="${escapeAttribute(field)}" ${readOnly ? 'data-readonly="true" disabled' : ""} placeholder="${escapeAttribute(
          placeholder || ""
        )}" ${counter ? 'data-char-count="true"' : ""}>${escapeHtml(value || "")}</textarea>
        ${counter ? `<div class="field-helper" data-char-counter>0</div>` : ""}
      </label>
    `;
  }

  function renderEnumSelect({
    label,
    field,
    value,
    options,
    includeEmpty,
    placeholder,
    fullSpan,
    readOnly,
  }) {
    const optionHtml = buildEnumOptions(options, value, includeEmpty, placeholder);
    return `
      <label class="field ${fullSpan ? "full-span" : ""}">
        <span>${escapeHtml(label)}</span>
        <select data-field="${escapeAttribute(field)}" ${readOnly ? 'data-readonly="true" disabled' : ""}>
          ${optionHtml}
        </select>
      </label>
    `;
  }

  function renderToggle({ label, field, value, fullSpan }) {
    const checked = value ? "checked" : "";
    return `
      <label class="field ${fullSpan ? "full-span" : ""}">
        <span>${escapeHtml(label)}</span>
        <div class="status-toggle">
          <input type="checkbox" data-field="${escapeAttribute(field)}" ${checked} />
          <span class="toggle-track"></span>
          <span class="toggle-label">${checked ? "On" : "Off"}</span>
        </div>
      </label>
    `;
  }

  function renderMultiSelectChips({
    label,
    field,
    values,
    enumKey,
    allowCustom,
    placeholder,
    fullSpan,
  }) {
    const serialized = escapeAttribute(JSON.stringify(values || []));
    const chipInput = allowCustom
      ? `
          <div class="chip-input">
            <input type="text" data-chip-search placeholder="${escapeAttribute(placeholder || "Add value")}" />
            <button class="btn btn-ghost btn-small" type="button" data-chip-add>Add</button>
          </div>
        `
      : "";
    return `
      <label class="field ${fullSpan ? "full-span" : ""}">
        <span>${escapeHtml(label)}</span>
        <div class="multi-select" data-multi-select data-field="${escapeAttribute(
          field
        )}" data-enum-key="${escapeAttribute(enumKey || "")}" data-allow-custom="${allowCustom ? "true" : "false"}">
          ${chipInput}
          <div class="chip-list" data-chip-list></div>
          <div class="multi-select-options" data-chip-options></div>
          <div class="field-helper is-error" data-chip-error></div>
          <input type="hidden" data-field="${escapeAttribute(field)}" value="${serialized}" />
        </div>
      </label>
    `;
  }

  function renderRangeInput({ label, field, value, unit, fullSpan }) {
    return `
      <label class="field ${fullSpan ? "full-span" : ""}">
        <span>${escapeHtml(label)}</span>
        <div class="range-input" data-range-field data-field="${escapeAttribute(field)}">
          <input type="text" data-range-min placeholder="Min${unit ? ` (${escapeAttribute(unit)})` : ""}" />
          <span class="range-sep">to</span>
          <input type="text" data-range-max placeholder="Max${unit ? ` (${escapeAttribute(unit)})` : ""}" />
          <input type="hidden" data-field="${escapeAttribute(field)}" value="${escapeAttribute(value || "")}" />
        </div>
      </label>
    `;
  }

  function renderListTextarea({
    label,
    field,
    values,
    placeholder,
    fullSpan,
  }) {
    const serialized = escapeAttribute(JSON.stringify(values || []));
    const textValue = Array.isArray(values) ? values.join("\n") : String(values || "");
    return `
      <label class="field ${fullSpan ? "full-span" : ""}">
        <span>${escapeHtml(label)}</span>
        <div class="list-textarea" data-list-textarea data-field="${escapeAttribute(field)}">
          <textarea rows="4" data-list-input placeholder="${escapeAttribute(
            placeholder || "Add one item per line"
          )}">${escapeHtml(textValue)}</textarea>
          <div class="field-helper">One item per line.</div>
          <input type="hidden" data-field="${escapeAttribute(field)}" value="${serialized}" />
        </div>
      </label>
    `;
  }

  function setSelectOptions(select, options, includeEmpty, placeholder) {
    if (!select) return;
    const current = select.value;
    select.innerHTML = buildEnumOptions(options, current, includeEmpty, placeholder);
  }

  function readFormState(container) {
    const fields = {};
    if (!container) return fields;
    const inputs = container.querySelectorAll("input,textarea,select");
    inputs.forEach((field) => {
      const key = field.dataset.field;
      if (!key) return;
      if (field.disabled) return;
      if (field.type === "checkbox") {
        fields[key] = field.checked ? "1" : "0";
        return;
      }
      fields[key] = field.value;
    });
    return fields;
  }

  function setupMultiSelect(node, enums, onChange) {
    const enumKey = node.dataset.enumKey || "";
    const allowCustom = node.dataset.allowCustom === "true";
    const searchInput = node.querySelector("[data-chip-search]");
    const addButton = node.querySelector("[data-chip-add]");
    const optionsWrap = node.querySelector("[data-chip-options]");
    const chipList = node.querySelector("[data-chip-list]");
    const hidden = node.querySelector('input[type="hidden"][data-field]');
    const error = node.querySelector("[data-chip-error]");
    const allOptions = Array.isArray(enums?.[enumKey]) ? enums[enumKey] : [];
    const optionLabels = allOptions.map((entry) => String(entry.value || entry.label || ""));
    const optionLookup = new Map(optionLabels.map((value) => [value.toLowerCase(), value]));

    const parseHidden = () => {
      if (!hidden) return [];
      try {
        const parsed = JSON.parse(hidden.value || "[]");
        return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
      } catch {
        return [];
      }
    };

    const setHidden = (values) => {
      if (hidden) hidden.value = JSON.stringify(values);
      if (typeof onChange === "function" && hidden) onChange(hidden);
    };

    const renderOptions = (filter) => {
      if (!optionsWrap) return;
      const normalized = String(filter || "").toLowerCase();
      const buttons = optionLabels
        .filter((value) => !normalized || value.toLowerCase().includes(normalized))
        .map(
          (value) =>
            `<button class="chip" type="button" data-chip-option="${escapeAttribute(value)}">${escapeHtml(
              value
            )}</button>`
        );
      optionsWrap.innerHTML = buttons.join("") || `<div class="muted">No matches.</div>`;
    };

    const renderChips = (values) => {
      if (!chipList) return;
      const chips = values.map((value) => {
        const isCustom = !optionLookup.has(value.toLowerCase());
        return `
          <span class="chip ${isCustom ? "is-warning" : ""}" data-chip-value="${escapeAttribute(value)}">
            ${escapeHtml(value)}
            <button type="button" data-chip-remove aria-label="Remove">×</button>
          </span>
        `;
      });
      chipList.innerHTML = chips.join("") || `<span class="muted">No selections yet.</span>`;
    };

    const addValue = (value) => {
      const trimmed = String(value || "").trim();
      if (!trimmed) return;
      const mapped = optionLookup.get(trimmed.toLowerCase());
      const nextValue = mapped || trimmed;
      if (!allowCustom && !mapped) {
        if (error) error.textContent = "Choose a listed value.";
        return;
      }
      if (error) error.textContent = "";
      const current = parseHidden();
      const normalized = new Set(current.map((entry) => entry.toLowerCase()));
      if (normalized.has(nextValue.toLowerCase())) return;
      const next = [...current, nextValue];
      setHidden(next);
      renderChips(next);
    };

    const removeValue = (value) => {
      const current = parseHidden();
      const next = current.filter((entry) => entry.toLowerCase() !== value.toLowerCase());
      setHidden(next);
      renderChips(next);
    };

    renderOptions("");
    const initial = parseHidden();
    renderChips(initial);

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        renderOptions(searchInput.value);
      });
      searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          addValue(searchInput.value);
          searchInput.value = "";
          renderOptions("");
        }
      });
    }
    if (addButton && searchInput) {
      addButton.addEventListener("click", () => {
        addValue(searchInput.value);
        searchInput.value = "";
        renderOptions("");
      });
    }
    if (optionsWrap) {
      optionsWrap.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const value = target.dataset.chipOption;
        if (!value) return;
        addValue(value);
      });
    }
    if (chipList) {
      chipList.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (!target.hasAttribute("data-chip-remove")) return;
        const chip = target.closest("[data-chip-value]");
        const value = chip?.getAttribute("data-chip-value") || "";
        if (value) removeValue(value);
      });
    }
  }

  function parseRangeValue(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    const text = String(value).trim();
    if (!text) return [];
    if (text.startsWith("[")) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [];
      }
    }
    if (text.includes("|")) return text.split("|").map((entry) => entry.trim());
    if (text.includes("-")) return text.split("-").map((entry) => entry.trim());
    return [text];
  }

  function setupRangeField(node, onChange) {
    const minInput = node.querySelector("[data-range-min]");
    const maxInput = node.querySelector("[data-range-max]");
    const hidden = node.querySelector('input[type="hidden"][data-field]');
    const initial = parseRangeValue(hidden?.value || "");
    if (minInput && initial[0]) minInput.value = initial[0];
    if (maxInput && initial[1]) maxInput.value = initial[1];
    const updateHidden = () => {
      if (!hidden) return;
      const minValue = minInput?.value.trim() || "";
      const maxValue = maxInput?.value.trim() || "";
      if (minValue && maxValue) {
        hidden.value = `${minValue}|${maxValue}`;
      } else if (minValue) {
        hidden.value = minValue;
      } else if (maxValue) {
        hidden.value = maxValue;
      } else {
        hidden.value = "";
      }
      if (typeof onChange === "function") onChange(hidden);
    };
    if (minInput) minInput.addEventListener("input", updateHidden);
    if (maxInput) maxInput.addEventListener("input", updateHidden);
  }

  function setupListTextarea(node, onChange) {
    const input = node.querySelector("[data-list-input]");
    const hidden = node.querySelector('input[type="hidden"][data-field]');
    const updateHidden = () => {
      if (!hidden || !input) return;
      const lines = input.value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      hidden.value = JSON.stringify(lines);
      if (typeof onChange === "function") onChange(hidden);
    };
    if (input) input.addEventListener("input", updateHidden);
    updateHidden();
  }

  function init(container, enums, onChange) {
    if (!container) return;
    const multiSelects = container.querySelectorAll("[data-multi-select]");
    multiSelects.forEach((node) => setupMultiSelect(node, enums, onChange));
    const ranges = container.querySelectorAll("[data-range-field]");
    ranges.forEach((node) => setupRangeField(node, onChange));
    const listTextareas = container.querySelectorAll("[data-list-textarea]");
    listTextareas.forEach((node) => setupListTextarea(node, onChange));
    const toggles = container.querySelectorAll('input[type="checkbox"][data-field]');
    toggles.forEach((toggle) => {
      toggle.addEventListener("change", () => {
        const label = toggle.closest(".status-toggle")?.querySelector(".toggle-label");
        if (label) label.textContent = toggle.checked ? "On" : "Off";
        if (typeof onChange === "function") onChange(toggle);
      });
    });
  }

  const exports = {
    renderTextInput,
    renderTextarea,
    renderEnumSelect,
    renderMultiSelectChips,
    renderToggle,
    renderRangeInput,
    renderListTextarea,
    setSelectOptions,
    readFormState,
    init,
  };

  if (typeof window !== "undefined") {
    window.CatalogForm = exports;
  } else {
    globalThis.CatalogForm = exports;
  }
})();
