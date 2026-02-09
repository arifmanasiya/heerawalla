export function createListRenderer({
  state,
  ui,
  listColumns,
  isBulkEnabled,
  canEditCurrentTab,
  getValue,
  getItemKey,
  escapeAttribute,
}) {
  function renderHeader() {
    if (!ui.listHeader) return;
    const columns = listColumns[state.tab];
    if (!columns) return;
    const bulkEnabled = isBulkEnabled();
    const templateParts = [];
    if (bulkEnabled) templateParts.push("44px");
    templateParts.push(
      ...columns.map((col) => (col.key === "view" || col.key === "delete" ? "90px" : "minmax(120px, 1fr)"))
    );
    const template = templateParts.join(" ");
    ui.listHeader.style.gridTemplateColumns = template;
    const headerCells = [];
    if (bulkEnabled) {
      const allSelected =
        state.items.length > 0 && state.selectedItems.length === state.items.length;
      headerCells.push(
        `<div class="cell"><input type="checkbox" class="bulk-select" data-bulk-select-all ${allSelected ? "checked" : ""} /></div>`
      );
    }
    headerCells.push(...columns.map((col) => `<div>${col.label || ""}</div>`));
    ui.listHeader.innerHTML = headerCells.join("");
  }

  function renderList() {
    renderHeader();
    if (!ui.list) return;
    const isInlinePricing = state.tab === "cost-chart" || state.tab === "diamond-price-chart";
    const numericKeys = new Set(["value", "weight_min", "weight_max", "price_per_ct", "row_number"]);
    const debugInfo = {
      tab: state.tab,
      hasColumns: Array.isArray(listColumns[state.tab]),
      getValue: typeof getValue,
      getItemKey: typeof getItemKey,
      escapeAttribute: typeof escapeAttribute,
      isBulkEnabled: typeof isBulkEnabled,
      canEditCurrentTab: typeof canEditCurrentTab,
    };
    if (debugInfo.getValue !== "function" || debugInfo.getItemKey !== "function") {
      console.error("List renderer miswired", debugInfo);
      throw new Error("List renderer miswired");
    }
    if (!Array.isArray(state.items)) {
      console.error("List items not array", { tab: state.tab, items: state.items });
      ui.list.innerHTML = `<div class="list-row"><div class="cell">No results</div></div>`;
      ui.results.textContent = "0 results";
      return;
    }
    if (!state.items.length) {
      ui.list.innerHTML = `<div class="list-row"><div class="cell">No results</div></div>`;
      ui.results.textContent = "0 results";
      return;
    }
    const columns = listColumns[state.tab] || [];
    const bulkEnabled = isBulkEnabled();
    const templateParts = [];
    if (bulkEnabled) templateParts.push("44px");
    templateParts.push(
      ...columns.map((col) => (col.key === "view" || col.key === "delete" ? "90px" : "minmax(120px, 1fr)"))
    );
    const template = templateParts.join(" ");
    try {
      ui.list.innerHTML = state.items
        .map((item) => {
          const key = getItemKey(item);
          const rowId =
            key ||
            item.slug ||
            item.id ||
            item.request_id ||
            item.email ||
            item.row_number ||
            item.media_id ||
            "";
          const cells = [];
          if (bulkEnabled) {
            const isChecked = state.selectedItems.includes(key);
            cells.push(
              `<div class="cell"><input type="checkbox" class="bulk-select" data-bulk-select-item="${escapeAttribute(
                key
              )}" ${isChecked ? "checked" : ""} /></div>`
            );
          }
          cells.push(
            ...columns.map((col) => {
              if (col.key === "view") {
                const disabled = key ? "" : "disabled";
                if (isInlinePricing && canEditCurrentTab()) {
                  return `<div class="cell inline-actions">
                    <button class="btn btn-ghost btn-small" data-inline-edit="${key}" ${disabled}>Edit</button>
                    <button class="btn btn-ghost btn-small" data-view="${key}" ${disabled}>View</button>
                  </div>`;
                }
                return `<div class="cell"><button class="btn btn-ghost" data-view="${key}" ${disabled}>View</button></div>`;
              }
              if (col.key === "delete") {
                const disabled = canEditCurrentTab() ? "" : "disabled";
                return `<div class="cell"><button class="btn btn-ghost" data-delete="${key}" ${disabled}>Delete</button></div>`;
              }
              if (col.key === "status") {
                const status = item.status || "NEW";
                return `<div class="cell"><span class="cell-label">${col.label}</span><span class="badge" data-status="${status}">${status}</span></div>`;
              }
              const value = getValue(item, col.key);
              if (isInlinePricing && canEditCurrentTab()) {
                const rowNumber = item.row_number ?? item.id ?? item.request_id ?? "";
                const inputType = numericKeys.has(col.key) ? "number" : "text";
                const step =
                  col.key === "price_per_ct" || col.key === "value" ? "0.01" : "1";
                return `<div class="cell"><span class="cell-label">${col.label}</span><span class="inline-value" data-inline-display>${value}</span><input class="inline-input is-hidden" type="${inputType}" step="${step}" data-inline-field="${escapeAttribute(
                  col.key
                )}" data-row-number="${escapeAttribute(
                  rowNumber
                )}" value="${escapeAttribute(value)}" /></div>`;
              }
              return `<div class="cell"><span class="cell-label">${col.label}</span><span>${value}</span></div>`;
            })
          );
          const rowClass = bulkEnabled && state.selectedItems.includes(key) ? "list-row is-selected" : "list-row";
          const inlineAttr = isInlinePricing ? ' data-inline-row="true"' : "";
          return `<div class="${rowClass}" data-row="${escapeAttribute(
            rowId
          )}" data-slug="${escapeAttribute(item.slug || "")}" data-id="${escapeAttribute(
            item.id || ""
          )}" style="grid-template-columns:${template}"${inlineAttr}>${cells.join("")}</div>`;
        })
        .join("");
    } catch (error) {
      console.error("List render failure", { error, debugInfo, columns, items: state.items });
      throw error;
    }
    ui.results.textContent = `Showing ${state.items.length} of ${state.total}`;
  }

  return { renderHeader, renderList };
}
