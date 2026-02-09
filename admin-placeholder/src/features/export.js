export function createExporter({ state, listColumns, getItemKey, getValue, showToast }) {
  function getExportColumns() {
    const columns = listColumns[state.tab] || [];
    return columns.filter((col) => col.key !== "view" && col.key !== "delete");
  }

  function exportData(format = "csv") {
    if (format !== "csv") return;
    const items =
      state.selectedItems.length > 0
        ? state.items.filter((item) => state.selectedItems.includes(getItemKey(item)))
        : state.items;
    if (!items.length) {
      showToast("No rows to export.", "error");
      return;
    }
    const columns = getExportColumns();
    const headers = columns.map((col) => col.label || col.key);
    const rows = items.map((item) =>
      columns.map((col) => {
        const value = getValue(item, col.key);
        const cleaned = String(value ?? "");
        if (cleaned.includes(",") || cleaned.includes("\"") || cleaned.includes("\n")) {
          return `"${cleaned.replace(/"/g, "\"\"")}"`;
        }
        return cleaned;
      })
    );
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const filename = `${state.tab}-${Date.now()}.csv`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`Exported ${items.length} rows`);
  }

  return { exportData };
}
