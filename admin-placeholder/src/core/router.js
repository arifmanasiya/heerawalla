export function createRouter({ windowRef }) {
  const getInitialTab = (fallback) => {
    const params = new URLSearchParams(windowRef.location.search);
    return params.get("tab") || fallback;
  };

  const updateTabInUrl = (tab) => {
    const url = new URL(windowRef.location.href);
    url.searchParams.set("tab", tab);
    url.searchParams.delete("offset");
    windowRef.history.replaceState({}, "", url);
  };

  return { getInitialTab, updateTabInUrl };
}
