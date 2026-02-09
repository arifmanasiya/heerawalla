export function initKeyboardShortcuts({ ui, loadCurrentView, closeDrawer }) {
  function showShortcutsModal() {
    if (document.querySelector(".shortcuts-modal")) return;
    const modal = document.createElement("div");
    modal.className = "shortcuts-modal";
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button class="btn btn-ghost" data-shortcuts-close type="button">Close</button>
        </div>
        <div class="shortcuts-list">
          <div class="shortcut-item"><kbd>Cmd/Ctrl + K</kbd><span>Focus search</span></div>
          <div class="shortcut-item"><kbd>Cmd/Ctrl + R</kbd><span>Refresh</span></div>
          <div class="shortcut-item"><kbd>Cmd/Ctrl + N</kbd><span>Add row (catalog)</span></div>
          <div class="shortcut-item"><kbd>Esc</kbd><span>Close drawer</span></div>
          <div class="shortcut-item"><kbd>← →</kbd><span>Navigate pages</span></div>
          <div class="shortcut-item"><kbd>?</kbd><span>Show shortcuts</span></div>
        </div>
      </div>
    `;
    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.remove();
    });
    modal.querySelector("[data-shortcuts-close]").addEventListener("click", () => modal.remove());
    document.body.appendChild(modal);
  }

  document.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLElement) {
      if (event.target.matches("input, textarea, select")) return;
    }
    if (event.key === "?") {
      showShortcutsModal();
      return;
    }
    if (event.code === "Escape") {
      closeDrawer();
      return;
    }
    if (event.code === "ArrowLeft") {
      if (ui.prev) ui.prev.click();
      return;
    }
    if (event.code === "ArrowRight") {
      if (ui.next) ui.next.click();
      return;
    }
    const meta = event.metaKey || event.ctrlKey;
    if (!meta) return;
    switch (event.code) {
      case "KeyK": {
        const search = ui.filters.find((el) => el.dataset.filter === "q");
        if (search) {
          event.preventDefault();
          search.focus();
        }
        break;
      }
      case "KeyR":
        event.preventDefault();
        loadCurrentView();
        break;
      case "KeyN":
        event.preventDefault();
        if (ui.addRowButton && !ui.addRowWrap?.classList.contains("is-hidden")) {
          ui.addRowButton.click();
        }
        break;
    }
  });
}
