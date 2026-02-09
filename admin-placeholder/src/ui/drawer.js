export function createDrawer({ ui, escapeHtml }) {
  const closeDrawer = () => {
    if (!ui.drawer) return;
    ui.drawer.classList.remove("is-open");
    ui.drawer.setAttribute("aria-hidden", "true");
    ui.drawer.inert = true;
    if (document.activeElement && ui.drawer.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  };

  const openDrawer = () => {
    if (!ui.drawer) return;
    ui.drawer.inert = false;
    ui.drawer.classList.add("is-open");
    ui.drawer.setAttribute("aria-hidden", "false");
    const focusable = ui.drawer.querySelector(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    if (focusable && typeof focusable.focus === "function") {
      focusable.focus({ preventScroll: true });
    }
  };

  const renderDetailCell = (label, value) => {
    if (label === "Images") {
      return `<div class="detail-media"><span>${label}</span>${value}</div>`;
    }
    return `<div><span>${label}</span>${value}</div>`;
  };

  const renderDetailRows = (rows, hasValue) => {
    return rows
      .filter(([, value]) => hasValue(value))
      .map(([label, value]) => renderDetailCell(label, value))
      .join("");
  };

  const renderDetailSections = (sections, hasValue) => {
    return sections
      .map((section) => {
        const rowsHtml = renderDetailRows(section.rows || [], hasValue);
        if (!rowsHtml) return "";
        return `<div class="detail-section">
          <p class="detail-section-title">${escapeHtml(section.title)}</p>
          <div class="detail-grid">${rowsHtml}</div>
        </div>`;
      })
      .join("");
  };

  const bindDrawerEvents = () => {
    if (ui.drawerClose) {
      ui.drawerClose.addEventListener("click", closeDrawer);
    }
    if (ui.drawer) {
      ui.drawer.addEventListener("click", (event) => {
        if (event.target === ui.drawer) closeDrawer();
      });
    }
    if (ui.detailGrid) {
      ui.detailGrid.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const isPrev = target.closest("[data-carousel-prev]");
        const isNext = target.closest("[data-carousel-next]");
        if (!isPrev && !isNext) return;
        const carousel = target.closest("[data-media-carousel]");
        if (!carousel) return;
        const track = carousel.querySelector("[data-carousel-track]");
        if (!(track instanceof HTMLElement)) return;
        const delta = isPrev ? -1 : 1;
        track.scrollBy({ left: track.clientWidth * delta, behavior: "smooth" });
      });
    }
  };

  return {
    closeDrawer,
    openDrawer,
    renderDetailRows,
    renderDetailSections,
    bindDrawerEvents,
  };
}
