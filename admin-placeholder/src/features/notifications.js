export function createNotifications({
  ui,
  apiFetch,
  showToast,
  windowRef,
}) {
  let notifications = [];

  const setOpen = (open) => {
    if (!ui.notificationsPanel) return;
    ui.notificationsPanel.classList.toggle("is-open", open);
    ui.notificationsPanel.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) {
      ui.notificationsPanel.removeAttribute("inert");
    } else {
      ui.notificationsPanel.setAttribute("inert", "");
    }
  };

  const render = () => {
    if (!ui.notificationsList) return;
    if (!notifications.length) {
      ui.notificationsList.innerHTML =
        '<p class="muted">No notifications right now.</p>';
      if (ui.notificationsBadge) {
        ui.notificationsBadge.textContent = "";
        ui.notificationsBadge.classList.add("is-hidden");
      }
      return;
    }

    const unreadCount = notifications.filter((item) => !item.read).length;
    if (ui.notificationsBadge) {
      ui.notificationsBadge.textContent = unreadCount ? String(unreadCount) : "";
      ui.notificationsBadge.classList.toggle("is-hidden", unreadCount === 0);
    }

    ui.notificationsList.innerHTML = notifications
      .map((item) => {
        const label = item.title || item.type || "Update";
        const message = item.message || item.body || "";
        const timestamp = item.created_at || item.createdAt || "";
        return `
          <button class="notification-item ${item.read ? "" : "is-unread"}" type="button" data-notification-id="${item.id || ""}">
            <div class="notification-title">${label}</div>
            <div class="notification-body">${message}</div>
            <div class="notification-meta">${timestamp}</div>
          </button>
        `;
      })
      .join("");
  };

  const loadNotifications = async () => {
    try {
      const data = await apiFetch("/notifications");
      notifications = Array.isArray(data?.items) ? data.items : data || [];
      render();
    } catch (error) {
      if (error?.status === 404) {
        notifications = [];
        render();
        return;
      }
      notifications = [];
      render();
      if (windowRef.location.hostname === "localhost") {
        showToast("Notifications unavailable.", "error");
      }
    }
  };

  const markNotificationRead = async (id) => {
    if (!id) return;
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "POST" });
      notifications = notifications.map((item) =>
        String(item.id) === String(id) ? { ...item, read: true } : item
      );
      render();
    } catch (error) {
      showToast("Failed to mark notification read.", "error");
    }
  };

  const bindNotifications = () => {
    if (ui.notificationsToggle) {
      ui.notificationsToggle.addEventListener("click", () => {
        const isOpen = ui.notificationsPanel?.classList.contains("is-open");
        setOpen(!isOpen);
        if (!isOpen) {
          loadNotifications();
        }
      });
    }
    if (ui.notificationsClose) {
      ui.notificationsClose.addEventListener("click", () => setOpen(false));
    }
    if (ui.notificationsList) {
      ui.notificationsList.addEventListener("click", (event) => {
        const button = event.target.closest("[data-notification-id]");
        if (!button) return;
        markNotificationRead(button.dataset.notificationId);
      });
    }
  };

  return { bindNotifications, loadNotifications };
}
