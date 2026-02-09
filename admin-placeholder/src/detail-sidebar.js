import { createSidebar } from "./ui/sidebar.js";
import { createToast } from "./ui/toast.js";
import { createNotifications } from "./features/notifications.js";
import { apiFetch } from "./core/api.js";

const TAB_LABELS = {
  orders: "Orders",
  quotes: "Quotes",
  tickets: "Tickets",
  contacts: "Contacts",
  products: "Products",
  inspirations: "Inspirations",
  "media-library": "Media",
  "cost-chart": "Cost Chart",
  "diamond-price-chart": "Diamond Pricing",
};

const initDetailSidebar = () => {
  const sidebar = document.querySelector("[data-sidebar]");
  if (!sidebar) return;
  const ui = {
    sidebar,
    sidebarSearch: document.querySelector("[data-sidebar-search]"),
    appShell: document.querySelector(".app-shell"),
    notificationsToggle: document.querySelector("[data-notifications-toggle]"),
    notificationsPanel: document.querySelector("[data-notifications-panel]"),
    notificationsList: document.querySelector("[data-notifications-list]"),
    notificationsBadge: document.querySelector("[data-notifications-badge]"),
    notificationsClose: document.querySelector("[data-notifications-close]"),
  };
  const toastEl = document.querySelector("[data-toast]");
  const showToast = createToast(toastEl);

  const { initSidebar, updateNavigationCounts } = createSidebar({
    ui,
    apiFetch,
    showToast,
  });

  const { bindNotifications } = createNotifications({
    ui,
    apiFetch,
    showToast,
    windowRef: window,
  });

  const detailTab = document.body.dataset.detailTab || "";
  const activeLink = sidebar.querySelector(`.side-link[data-tab="${detailTab}"]`);
  if (activeLink) {
    activeLink.classList.add("is-active");
  }

  const titleEl = document.querySelector("[data-tab-title]");
  if (titleEl) {
    titleEl.textContent = TAB_LABELS[detailTab] || "Details";
  }

  sidebar.querySelectorAll(".side-link[data-tab]").forEach((link) => {
    link.addEventListener("click", () => {
      const tab = link.dataset.tab || "";
      if (!tab) return;
      window.location.href = `/?tab=${encodeURIComponent(tab)}`;
    });
  });

  initSidebar();
  bindNotifications();
  if (document.body.dataset.enableNavCounts !== "true") {
    updateNavigationCounts({});
  }
};

initDetailSidebar();
