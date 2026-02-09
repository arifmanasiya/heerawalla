export function createModal({ modal }) {
  if (!modal) {
    return {
      open: () => {},
      close: () => {},
      isOpen: () => false,
    };
  }

  let lastFocused = null;

  const focusFirstElement = () => {
    const target =
      modal.querySelector(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      ) || modal;
    if (target && typeof target.focus === "function") {
      target.focus();
    }
  };

  const open = () => {
    lastFocused = document.activeElement;
    modal.classList.add("is-open");
    modal.removeAttribute("inert");
    modal.setAttribute("aria-hidden", "false");
    requestAnimationFrame(focusFirstElement);
  };

  const close = () => {
    if (modal.contains(document.activeElement)) {
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      } else {
        document.body.focus?.();
      }
    }
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("inert", "");
  };

  const isOpen = () => modal.classList.contains("is-open");

  return { open, close, isOpen };
}
