export function createSidebar({ ui, apiFetch, showToast }) {
  const updateNavigationCounts = (counts) => {
    if (!counts) return;
    Object.entries(counts).forEach(([tab, count]) => {
      const badge = document.querySelector(`[data-count-${tab}]`);
      if (!badge) return;
      const value = Number(count) || 0;
      badge.textContent = String(value);
      badge.style.display = value > 0 ? "inline-flex" : "none";
    });
  };

  const updateCountsFromApi = async () => {
    try {
      const data = await apiFetch("/navigation/counts");
      updateNavigationCounts(data || {});
    } catch (error) {
      if (error?.status === 404) {
        updateNavigationCounts({});
        return;
      }
      showToast("Failed to load sidebar counts.", "error");
    }
  };

  const initBadgeUpdates = () => {
    updateCountsFromApi();
    setInterval(updateCountsFromApi, 30000);
  };

  const resetSearch = (links) => {
    links.forEach((link) => {
      link.style.display = "";
      link.classList.remove("search-highlight");
    });
    document.querySelector(".side-search__no-results")?.remove();
  };

  const showNoResultsMessage = (show, query) => {
    const existing = document.querySelector(".side-search__no-results");
    if (show && !existing) {
      const container = document.querySelector(".side-search");
      if (!container) return;
      const msg = document.createElement("div");
      msg.className = "side-search__no-results";
      msg.innerHTML = `
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.3;margin-bottom:8px;">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <p>No sections matching<br/><strong>"${query}"</strong></p>
      `;
      container.after(msg);
    } else if (!show && existing) {
      existing.remove();
    }
  };

  const filterNavigationBySearch = (query, links, blocks) => {
    let hasVisible = false;
    blocks.forEach((block) => {
      const blockLinks = Array.from(block.querySelectorAll(".side-link"));
      let blockHasVisible = false;
      blockLinks.forEach((link) => {
        const label = link.querySelector(".side-link__label")?.textContent?.toLowerCase() || "";
        const matches = label.includes(query);
        link.style.display = matches ? "" : "none";
        if (matches) {
          link.classList.add("search-highlight");
          blockHasVisible = true;
          hasVisible = true;
        } else {
          link.classList.remove("search-highlight");
        }
      });
      if (blockHasVisible && block.classList.contains("is-collapsed")) {
        block.classList.remove("is-collapsed");
        const toggle = block.querySelector("[data-side-toggle]");
        if (toggle) toggle.textContent = "-";
      }
    });
    showNoResultsMessage(!hasVisible, query);
  };

  const initSidebarSearch = () => {
    const searchInput = ui.sidebarSearch;
    if (!searchInput) return;
    const links = Array.from(document.querySelectorAll(".side-link"));
    const blocks = Array.from(document.querySelectorAll(".side-block"));
    searchInput.addEventListener("input", (event) => {
      const query = String(event.target.value || "").toLowerCase().trim();
      if (!query) {
        resetSearch(links);
        return;
      }
      filterNavigationBySearch(query, links, blocks);
    });
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        searchInput.value = "";
        searchInput.dispatchEvent(new Event("input"));
        searchInput.blur();
      }
    });
  };

  const initSidebarKeyboardNav = () => {
    const links = Array.from(document.querySelectorAll(".side-link"));
    let currentIndex = links.findIndex((link) => link.classList.contains("is-active"));
    if (currentIndex < 0) currentIndex = 0;
    document.addEventListener("keydown", (event) => {
      if (event.target.matches("input, textarea, select")) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        ui.sidebarSearch?.focus();
        ui.sidebarSearch?.select();
        return;
      }
      if (event.altKey && event.key >= "1" && event.key <= "9") {
        event.preventDefault();
        const index = Number(event.key) - 1;
        if (links[index]) {
          links[index].click();
          links[index].focus();
        }
        return;
      }
      if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        event.preventDefault();
        if (event.key === "ArrowUp") {
          currentIndex = currentIndex > 0 ? currentIndex - 1 : links.length - 1;
        } else {
          currentIndex = currentIndex < links.length - 1 ? currentIndex + 1 : 0;
        }
        links[currentIndex].click();
        links[currentIndex].focus();
      }
    });
  };

  const initSidebarCollapse = () => {
    if (!ui.sidebar) return;
    ui.sidebar.classList.remove("is-collapsed");
    ui.appShell?.classList.remove("sidebar-collapsed");
  };

  const initBlockToggles = () => {
    const toggles = document.querySelectorAll("[data-side-toggle]");
    toggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const block = toggle.closest(".side-block");
        if (!block) return;
        const isCollapsed = block.classList.toggle("is-collapsed");
        toggle.textContent = isCollapsed ? "+" : "-";
        const blockId = block.dataset.blockId;
        if (blockId) {
          const collapsedBlocks = JSON.parse(
            localStorage.getItem("sidebar-collapsed-blocks") || "[]"
          );
          if (isCollapsed) {
            if (!collapsedBlocks.includes(blockId)) {
              collapsedBlocks.push(blockId);
            }
          } else {
            const index = collapsedBlocks.indexOf(blockId);
            if (index > -1) collapsedBlocks.splice(index, 1);
          }
          localStorage.setItem("sidebar-collapsed-blocks", JSON.stringify(collapsedBlocks));
        }
      });
    });
    const collapsedBlocks = JSON.parse(
      localStorage.getItem("sidebar-collapsed-blocks") || "[]"
    );
    collapsedBlocks.forEach((blockId) => {
      const block = document.querySelector(`[data-block-id="${blockId}"]`);
      if (block && !block.classList.contains("is-collapsed")) {
        block.classList.add("is-collapsed");
        const toggle = block.querySelector("[data-side-toggle]");
        if (toggle) toggle.textContent = "+";
      }
    });
  };

  const initSidebar = () => {
    initSidebarCollapse();
    initSidebarSearch();
    initSidebarKeyboardNav();
    initBlockToggles();
    initBadgeUpdates();
    console.log("Sidebar initialized");
  };

  return {
    initSidebar,
    updateNavigationCounts,
  };
}
