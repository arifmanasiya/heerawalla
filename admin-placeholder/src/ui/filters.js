export function createFilterHelpers({
  state,
  ui,
  statusOptions,
  sortOptions,
  sortDefaults,
  isDashboardTab,
  getOrderStatusOptions,
  normalizeStatus,
}) {
  function updateStatusOptions() {
    if (!ui.statusSelect) return;
    const currentStatus = normalizeStatus(state.selectedItem?.status);
    let options =
      state.tab === "orders"
        ? getOrderStatusOptions()
        : (statusOptions[state.tab] || []).filter((status) => status !== currentStatus);
    if (!options.length) {
      ui.statusSelect.innerHTML = '<option value="">No status actions</option>';
    } else {
      ui.statusSelect.innerHTML = options
        .map((status) => `<option value="${status}">${status}</option>`)
        .join("");
    }
  }

  function updateSortOptions() {
    const sortFilter = ui.filters.find((el) => el.dataset.filter === "sort");
    if (!sortFilter) return;
    const options = sortOptions[state.tab] || sortOptions.orders;
    const defaults = sortDefaults[state.tab] || sortDefaults.orders;
    const allowed = options.map((option) => option.value);
    if (!allowed.includes(state.filters.sort)) {
      state.filters.sort = defaults.sort;
    }
    if (!["asc", "desc"].includes(state.filters.dir)) {
      state.filters.dir = defaults.dir;
    }
    sortFilter.innerHTML = options
      .map((option) => `<option value="${option.value}">${option.label}</option>`)
      .join("");
    sortFilter.value = state.filters.sort;
  }

  function updateStatusFilterOptions() {
    if (!ui.filtersWrap) return;
    const statusWrap = ui.filtersWrap.querySelector("[data-filter-status]");
    const statusSelect = ui.filters.find((el) => el.dataset.filter === "status");
    if (!statusWrap || !statusSelect) return;
    const options = statusOptions[state.tab] || [];
    if (isDashboardTab() || !options.length) {
      statusWrap.classList.add("is-hidden");
      statusSelect.value = "";
      state.filters.status = "";
      return;
    }
    statusWrap.classList.remove("is-hidden");
    const currentValue = state.filters.status || "";
    statusSelect.innerHTML =
      `<option value="">All statuses</option>` +
      options.map((status) => `<option value="${status}">${status}</option>`).join("");
    statusSelect.value = options.includes(currentValue) ? currentValue : "";
    state.filters.status = statusSelect.value;
  }

  return { updateStatusOptions, updateSortOptions, updateStatusFilterOptions };
}
