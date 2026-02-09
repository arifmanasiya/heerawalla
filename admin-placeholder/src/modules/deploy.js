export function createDeployHelpers({
  ui,
  getApiBase,
  getStoredAdminEmail,
  getLocalAdminEmail,
  buildAdminHeaders,
  showToast,
  windowRef,
}) {
  const setButtonEnabled = (button, enabled) => {
    if (!button) return;
    button.disabled = !enabled;
    button.classList.toggle("is-disabled", !enabled);
    button.setAttribute("aria-disabled", enabled ? "false" : "true");
  };

  const setDeployStatus = (message) => {
    if (!ui.deployStatus) return;
    ui.deployStatus.textContent = message;
  };

  const requestDeploy = async () => {
    const resolvedBase = getApiBase();
    if (!resolvedBase) throw new Error("Missing API base");
    const base = resolvedBase.endsWith("/") ? resolvedBase : `${resolvedBase}/`;
    const url = new URL("deploy-site", base);
    const isLocalApi = base.startsWith("http://localhost") || base.startsWith("http://127.0.0.1");
    const localEmail = isLocalApi ? getStoredAdminEmail() : getLocalAdminEmail();
    if (isLocalApi && localEmail) {
      url.searchParams.set("admin_email", localEmail);
    }
    const response = await fetch(url.toString(), {
      method: "POST",
      credentials: isLocalApi ? "omit" : "include",
      headers: buildAdminHeaders({}, localEmail),
      body: "{}",
    });
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    if (!response.ok) {
      const message = payload?.error || response.statusText;
      throw new Error(message);
    }
    return payload || { ok: true };
  };

  const triggerSiteRebuild = async () => {
    if (!ui.triggerDeploy) return;
    const ok = windowRef.confirm("Trigger a site rebuild? This will run the deploy workflow.");
    if (!ok) return;
    setDeployStatus("Dispatching...");
    setButtonEnabled(ui.triggerDeploy, false);
    try {
      const result = await requestDeploy();
      const stamp = new Date().toLocaleTimeString();
      setDeployStatus(`Queued ${stamp}`);
      const note = result?.ok ? "" : ` (${result?.error || "unknown"})`;
      showToast(`Rebuild triggered${note}`);
    } catch (error) {
      const message = error?.message ? String(error.message) : "Rebuild failed";
      setDeployStatus("Failed");
      showToast(message, "error");
    } finally {
      setButtonEnabled(ui.triggerDeploy, true);
    }
  };

  return { triggerSiteRebuild };
}
