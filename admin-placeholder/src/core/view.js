export function createViewHelpers({
  state,
  ui,
  tabLabels,
  isDashboardTab,
  isConsultationsTab,
  loadConsultations,
  updateStatusOptions,
  updateStatusFilterOptions,
  updateSortOptions,
  updateBulkActions,
  loadDashboard,
  apiFetch,
  getTabEndpoint,
  renderList,
  getItemKey,
  populateDrawer,
  closeDrawer,
  setSyncStatus,
  setLastSync,
  showToast,
  pricingTabs,
  catalogTabs,
}) {
  const updateTabVisibility = () => {
    if (!ui.adminTabs.length) return;
    const isAdmin = state.role === "admin";
    ui.adminTabs.forEach((tab) => {
      tab.classList.toggle("is-hidden", !isAdmin);
    });
    if (!isAdmin && ui.adminTabs.some((tab) => tab.classList.contains("is-active"))) {
      const fallback = ui.tabs.find((tab) => tab.dataset.tab === "orders");
      if (fallback) {
        ui.tabs.forEach((tab) => tab.classList.remove("is-active"));
        fallback.classList.add("is-active");
        state.tab = "orders";
        updateStatusOptions();
        updateSortOptions();
      }
    }
  };

  const updateAddRowVisibility = () => {
    if (!ui.addRowWrap) return;
    if (isDashboardTab()) {
      ui.addRowWrap.classList.add("is-hidden");
      return;
    }
    const canAdd = state.role === "admin" || state.role === "ops";
    const show = canAdd && (pricingTabs.has(state.tab) || catalogTabs.has(state.tab));
    ui.addRowWrap.classList.toggle("is-hidden", !show);
    if (ui.addRowButton) {
      const labelMap = {
        products: "Add product",
        inspirations: "Add inspiration",
        "media-library": "Add media",
      };
      ui.addRowButton.textContent = labelMap[state.tab] || "Add row";
    }
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    Object.entries(state.filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set("limit", String(state.limit));
    params.set("offset", String(state.offset));
    return params.toString();
  };

  const updateDashboardVisibility = () => {
    const isDashboard = isDashboardTab();
    const isConsultations = isConsultationsTab ? isConsultationsTab() : false;
    if (ui.dashboard) {
      ui.dashboard.classList.toggle("is-hidden", !isDashboard);
    }
    if (ui.consultationsSection) {
      ui.consultationsSection.classList.toggle("is-hidden", !isConsultations);
    }
    if (ui.filtersWrap) {
      ui.filtersWrap.classList.toggle("is-hidden", isDashboard || isConsultations);
    }
    if (ui.listWrap) {
      ui.listWrap.classList.toggle("is-hidden", isDashboard || isConsultations);
    }
    if (ui.bulkActions) {
      ui.bulkActions.classList.toggle("is-hidden", isDashboard || isConsultations || !state.selectedItems.length);
    }
    if (ui.addRowWrap) {
      ui.addRowWrap.classList.toggle("is-hidden", isDashboard || isConsultations);
    }
  };

  const loadList = async () => {
    if (state.isLoading) return;
    state.isLoading = true;
    state.selectedItems = [];
    updateBulkActions();
    setSyncStatus("Syncing");
    try {
      const data = await apiFetch(`${getTabEndpoint(state.tab)}?${buildQuery()}`);
      const normalizedItems = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
          ? data
          : Array.isArray(data?.rows)
            ? data.rows
            : [];
      if (!Array.isArray(normalizedItems)) {
        console.warn("Unexpected list payload", { tab: state.tab, data });
      }
      state.items = normalizedItems;
      state.total = Number.isFinite(data?.total)
        ? data.total
        : Number.isFinite(data?.count)
          ? data.count
          : normalizedItems.length;
      renderList();
      if (state.selectedId) {
        const updated = state.items.find(
          (entry) => getItemKey(entry) === state.selectedId
        );
        if (updated) {
          populateDrawer(updated);
        } else {
          closeDrawer();
          state.selectedId = "";
          state.selectedItem = null;
        }
      }
      setLastSync(new Date().toLocaleTimeString());
      setSyncStatus("Synced");
    } catch (error) {
      const detail = error?.message ? ` ${String(error.message).trim()}` : "";
      console.error("Load list failed", error);
      setSyncStatus("Error");
      showToast(`Failed to load data.${detail}`, "error");
    } finally {
      state.isLoading = false;
    }
  };

  const loadCurrentView = async () => {
    updateDashboardVisibility();
    updateStatusFilterOptions();
    if (isDashboardTab()) {
      await loadDashboard();
      return;
    }
    if (isConsultationsTab && isConsultationsTab()) {
      if (loadConsultations) {
        await loadConsultations();
      }
      return;
    }
    await loadList();
  };

  const setTab = (tabName) => {
    const target = tabName || "orders";
    state.tab = target;
    state.offset = 0;
    state.selectedItems = [];
    ui.tabs.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tab === state.tab);
    });
    if (ui.tabTitle) {
      const label = tabLabels?.[state.tab] || state.tab;
      ui.tabTitle.textContent = label;
    }
    updateStatusOptions();
    updateStatusFilterOptions();
    updateSortOptions();
    updateAddRowVisibility();
    updateBulkActions();
    loadCurrentView();
  };

  return {
    buildQuery,
    loadCurrentView,
    loadList,
    setTab,
    updateAddRowVisibility,
    updateDashboardVisibility,
    updateTabVisibility,
  };
}
