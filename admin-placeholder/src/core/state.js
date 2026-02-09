export const DASHBOARD_TAB = "dashboard";
export const BULK_TABS = new Set(["orders", "quotes", "tickets", "products"]);

export const state = {
  tab: DASHBOARD_TAB,
  role: "",
  email: "",
  items: [],
  total: 0,
  offset: 0,
  limit: 50,
  selectedId: "",
  selectedItem: null,
  selectedItems: [],
  originalValues: {},
  originalRaw: {},
  originalNotes: "",
  orderDetails: {},
  pendingChanges: [],
  confirmation: null,
  filters: {
    q: "",
    status: "",
    date_range: "",
    sort: "created_at",
    dir: "desc",
  },
};
