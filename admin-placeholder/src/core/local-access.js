export function createLocalAdminHelpers({
  getLocalAdminEmail,
  storage,
  documentRef,
  windowRef,
}) {
  const renderLocalAdminPrompt = () => {
    if (documentRef.querySelector("[data-local-admin-prompt]")) return;
    const banner = documentRef.createElement("div");
    banner.className = "local-admin-banner";
    banner.setAttribute("data-local-admin-prompt", "true");
    banner.innerHTML = `
      <div class="local-admin-card">
        <div>
          <div class="local-admin-title">Local admin access</div>
          <div class="local-admin-sub">Enter an allowlisted email to enable local data.</div>
        </div>
        <div class="local-admin-form">
          <input type="email" placeholder="admin@email.com" aria-label="Admin email" />
          <button class="btn" type="button">Save</button>
        </div>
      </div>
    `;
    documentRef.body.appendChild(banner);
    const input = banner.querySelector("input");
    const button = banner.querySelector("button");
    if (input && button) {
      button.addEventListener("click", () => {
        const value = String(input.value || "").trim();
        if (!value || !value.includes("@")) return;
        storage?.setItem?.("adminEmail", value);
        windowRef.location.reload();
      });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") button.click();
      });
      input.focus();
    }
  };

  const ensureLocalAdminAccess = () => {
    if (typeof windowRef === "undefined") return true;
    const origin = windowRef.location.origin || "";
    const isLocal = origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1");
    if (!isLocal) return true;
    if (getLocalAdminEmail()) return true;
    renderLocalAdminPrompt();
    return false;
  };

  return {
    ensureLocalAdminAccess,
  };
}
