export function createToast(toastEl) {
  return function showToast(message, variant) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    if (variant === "error") {
      toastEl.style.background = "#b42318";
    } else {
      toastEl.style.background = "var(--ink)";
    }
    setTimeout(() => toastEl.classList.remove("is-visible"), 2400);
  };
}
