export function createOrderDetailsHelpers({
  state,
  ui,
  apiFetch,
  orderDetailsFields,
}) {
  const applyOrderDetailsVisibility = () => {
    if (!ui.orderDetailsSection) return;
    const show = state.tab === "orders";
    ui.orderDetailsSection.classList.toggle("is-hidden", !show);
  };

  const getOrderDetailsValue = (key) => {
    const field = ui.orderDetailsFields.find((input) => input.dataset.orderDetailsField === key);
    return field ? field.value.trim() : "";
  };

  const collectOrderDetailsUpdates = () => {
    const details = {};
    orderDetailsFields.forEach((key) => {
      const value = getOrderDetailsValue(key);
      if (value) details[key] = value;
    });
    return details;
  };

  const populateOrderDetails = (details = {}) => {
    state.orderDetails = details || {};
    ui.orderDetailsFields.forEach((field) => {
      const key = field.dataset.orderDetailsField;
      if (!key) return;
      const fallback = key === "shipping_method" ? "Express" : "";
      field.value = details[key] || fallback;
    });
  };

  const loadOrderDetails = async (requestId) => {
    if (!requestId || state.tab !== "orders") {
      populateOrderDetails({});
      return;
    }
    try {
      const data = await apiFetch(`/orders/details?request_id=${encodeURIComponent(requestId)}`);
      populateOrderDetails(data.details || {});
    } catch (error) {
      populateOrderDetails({});
    }
  };

  return {
    applyOrderDetailsVisibility,
    collectOrderDetailsUpdates,
    loadOrderDetails,
    populateOrderDetails,
  };
}
