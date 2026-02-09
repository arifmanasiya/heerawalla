export function createSyncHelpers({ ui }) {
  let syncStatus = "Connecting";
  let lastSync = "";

  const setSyncStatus = (status) => {
    syncStatus = status;
    updateSyncLine();
  };

  const setLastSync = (value) => {
    lastSync = value;
    updateSyncLine();
  };

  const updateSyncLine = () => {
    if (!ui.syncLine) return;
    const autoRefresh = ui.autoRefresh?.checked ?? true;
    if (autoRefresh) {
      ui.syncLine.textContent = syncStatus;
      if (ui.refresh) {
        ui.refresh.disabled = true;
        ui.refresh.setAttribute("aria-disabled", "true");
        ui.refresh.classList.add("is-disabled");
      }
      return;
    }
    const detail = lastSync ? ` | Last sync ${lastSync}` : "";
    ui.syncLine.textContent = `${syncStatus}${detail}`;
    if (ui.refresh) {
      ui.refresh.disabled = false;
      ui.refresh.setAttribute("aria-disabled", "false");
      ui.refresh.classList.remove("is-disabled");
    }
  };

  return {
    setLastSync,
    setSyncStatus,
    updateSyncLine,
  };
}
