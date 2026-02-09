export function createDashboard({ apiFetch, ui, setTab, escapeHtml }) {
  async function loadDashboard() {
    if (!ui.dashboard) return;
    ui.dashboard.innerHTML = `<div class="dashboard-section"><h3>Loading dashboard...</h3></div>`;
    try {
      const metrics = await apiFetch("/dashboard/metrics");
      if (!metrics.ok) {
        ui.dashboard.innerHTML = `<div class="dashboard-section"><h3>Unable to load dashboard.</h3></div>`;
        return;
      }
      ui.dashboard.innerHTML = renderDashboard(metrics);
      ui.dashboard.querySelectorAll("[data-dashboard-tab]").forEach((button) => {
        button.addEventListener("click", () => {
          const target = button.dataset.dashboardTab;
          if (target) setTab(target);
        });
      });
    } catch (error) {
      ui.dashboard.innerHTML = `<div class="dashboard-section"><h3>Unable to load dashboard.</h3></div>`;
    }
  }

  function renderDashboard(metrics) {
    const recentOrders = metrics.recentOrders || [];
    const actionItems = metrics.actionRequired || [];
    return `
      <div class="dashboard-grid">
        <div class="metric-card">
          <h3>Today's Activity</h3>
          <div class="metric-value">${metrics.todayOrders || 0}</div>
          <div class="metric-label">New Orders</div>
        </div>
        <div class="metric-card">
          <h3>Pending Quotes</h3>
          <div class="metric-value">${metrics.pendingQuotes || 0}</div>
          <div class="metric-label">Awaiting Response</div>
        </div>
        <div class="metric-card">
          <h3>This Month</h3>
          <div class="metric-value">${metrics.monthlyRevenue || 0}</div>
          <div class="metric-label">Revenue</div>
        </div>
        <div class="metric-card">
          <h3>Alerts</h3>
          <div class="metric-value ${metrics.lowStockCount > 0 ? "warning" : ""}">${metrics.lowStockCount || 0}</div>
          <div class="metric-label">Low Stock Items</div>
        </div>
      </div>
      <div class="dashboard-section">
        <h3>Recent Orders</h3>
        <div class="quick-list">
          ${recentOrders.length ? recentOrders
            .map(
              (order) => `
            <div class="quick-item">
              <div>
                <strong>${escapeHtml(order.product || order.requestId || "Order")}</strong>
                <div class="quick-meta">${escapeHtml(order.requestId || "")}</div>
              </div>
              <div class="quick-meta">${escapeHtml(order.status || "")}</div>
            </div>`
            )
            .join("") : `<div class="quick-meta">No recent orders.</div>`}
        </div>
      </div>
      <div class="dashboard-section">
        <h3>Action Required</h3>
        <div class="quick-list">
          ${actionItems.length ? actionItems
            .map(
              (item) => `
            <div class="quick-item">
              <div>
                <strong>${escapeHtml(item.label || item.requestId || "Item")}</strong>
                <div class="quick-meta">${escapeHtml(item.requestId || "")}</div>
              </div>
              <div class="quick-meta">${escapeHtml(item.status || "")}</div>
            </div>`
            )
            .join("") : `<div class="quick-meta">No actions required.</div>`}
        </div>
      </div>
    `;
  }

  return { loadDashboard };
}
