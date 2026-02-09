export function getTabEndpoint(tab) {
  if (tab === "orders") return "/orders";
  if (tab === "quotes") return "/quotes";
  if (tab === "tickets") return "/tickets";
  if (tab === "contacts") return "/contacts";
  if (tab === "products") return "/products";
  if (tab === "inspirations") return "/inspirations";
  if (tab === "media-library") return "/media-library";
  if (tab === "cost-chart") return "/cost-chart";
  if (tab === "diamond-price-chart") return "/diamond-price-chart";
  return `/${tab}`;
}

export function getActionEndpoint(tab) {
  if (tab === "orders") return "/orders/action";
  if (tab === "quotes") return "/quotes/action";
  if (tab === "tickets") return "/tickets/action";
  if (tab === "contacts") return "/contacts/action";
  if (tab === "products") return "/products/action";
  if (tab === "inspirations") return "/inspirations/action";
  if (tab === "media-library") return "/media-library/action";
  if (tab === "cost-chart") return "/cost-chart/action";
  if (tab === "diamond-price-chart") return "/diamond-price-chart/action";
  return "";
}
