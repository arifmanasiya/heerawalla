export function createRecordHelpers({ state, storage, locationHref }) {
  const getItemKey = (item) => {
    if (state.tab === "products" || state.tab === "inspirations") {
      return (
        item.slug ||
        item.id ||
        item.row_number ||
        item.request_id ||
        item.email ||
        item.media_id ||
        item.name ||
        ""
      );
    }
    if (state.tab === "media-library") {
      return item.media_id || item.row_number || item.id || "";
    }
    return (
      item.request_id ||
      item.email ||
      item.row_number ||
      item.slug ||
      item.id ||
      item.media_id ||
      ""
    );
  };

  const getSelectedRecordId = () => {
    if (!state.selectedItem) return "";
    return (
      state.selectedItem.request_id ||
      state.selectedItem.email ||
      state.selectedItem.row_number ||
      state.selectedItem.slug ||
      state.selectedItem.id ||
      state.selectedItem.media_id ||
      ""
    );
  };

  const buildDeletePayload = (tab, recordId) => {
    if (tab === "orders" || tab === "quotes") {
      return { action: "delete", requestId: recordId };
    }
    if (tab === "products") {
      return { action: "delete", id: recordId, slug: recordId };
    }
    return { action: "delete", requestId: recordId };
  };

  const getDetailPath = (tab) => {
    switch (tab) {
      case "orders":
        return "order_detail";
      case "quotes":
        return "quote_detail";
      case "tickets":
        return "ticket_detail";
      case "products":
        return "product_detail";
      case "inspirations":
        return "inspiration_detail";
      case "contacts":
        return "contact_detail";
      case "media-library":
        return "media_detail";
      case "cost-chart":
        return "cost_chart_detail";
      case "diamond-price-chart":
        return "diamond_price_chart_detail";
      default:
        return "detail";
    }
  };

  const detailUrl = (requestId) => {
    const tab = state.tab || "orders";
    const id = requestId || "";
    try {
      storage?.setItem?.("adminDetailTab", tab);
      storage?.setItem?.("adminDetailId", id);
    } catch {
      // ignore storage errors
    }
    const url = new URL(getDetailPath(tab), locationHref);
    url.searchParams.set("id", id);
    return url.toString();
  };

  return {
    buildDeletePayload,
    detailUrl,
    getItemKey,
    getSelectedRecordId,
  };
}
