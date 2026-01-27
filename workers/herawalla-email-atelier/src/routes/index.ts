import {
  CALENDAR_AVAILABILITY_PATH,
  CALENDAR_BOOK_PATH,
  CATALOG_PATH,
  CONTACT_SUBMIT_PATH,
  ORDER_CANCEL_PATH,
  ORDER_CONFIRMATION_PATH,
  ORDER_PATH,
  ORDER_VERIFY_PATH,
  QUOTE_CONFIRMATION_PATH,
  SUBMIT_PATH,
  SUBMIT_STATUS_PATH,
  SUBSCRIBE_PATH,
  UNSUBSCRIBE_PATH,
} from "../config";
import type { RouteHandler, RouteContext } from "../types";
import type { Env } from "../config";
import { handleAdminRoutes } from "./admin";
import { handleCalendarRoute } from "./calendar";
import { handleCatalogRoute } from "./catalog";
import { handleContactRoute } from "./contact";
import { handleHealthRoute } from "./health";
import { handleOrderRoute } from "./order";
import { handlePricingRoute } from "./pricing";
import { handleRootRoute } from "./root";
import { handleSubmitRoute, handleSubmitStatusRoute } from "./submit";
import { handleSubscribeRoute } from "./subscribe";
import { handleUnsubscribeRoute } from "./unsubscribe";
import { handleOrderCancelRoute } from "./confirmation/order-cancel";
import { handleOrderConfirmationRoute } from "./confirmation/order-confirmation";
import { handleOrderVerifyRoute } from "./confirmation/order-verify";
import { handleQuoteConfirmationRoute } from "./confirmation/quote-confirmation";

export type RouteDefinition = {
  path: string;
  match: "exact" | "prefix";
  handler: RouteHandler;
};

export const routes: RouteDefinition[] = [
  { path: "/pricing/estimate", match: "exact", handler: handlePricingRoute },
  { path: CATALOG_PATH, match: "exact", handler: handleCatalogRoute },
  { path: CALENDAR_AVAILABILITY_PATH, match: "exact", handler: handleCalendarRoute },
  { path: CALENDAR_BOOK_PATH, match: "exact", handler: handleCalendarRoute },
  { path: SUBSCRIBE_PATH, match: "exact", handler: handleSubscribeRoute },
  { path: UNSUBSCRIBE_PATH, match: "exact", handler: handleUnsubscribeRoute },
  { path: CONTACT_SUBMIT_PATH, match: "exact", handler: handleContactRoute },
  { path: ORDER_PATH, match: "exact", handler: handleOrderRoute },
  { path: SUBMIT_STATUS_PATH, match: "exact", handler: handleSubmitStatusRoute },
  { path: SUBMIT_PATH, match: "exact", handler: handleSubmitRoute },
  { path: "/admin", match: "prefix", handler: handleAdminRoutes },
  { path: ORDER_CONFIRMATION_PATH, match: "prefix", handler: handleOrderConfirmationRoute },
  { path: QUOTE_CONFIRMATION_PATH, match: "prefix", handler: handleQuoteConfirmationRoute },
  { path: ORDER_CANCEL_PATH, match: "prefix", handler: handleOrderCancelRoute },
  { path: ORDER_VERIFY_PATH, match: "exact", handler: handleOrderVerifyRoute },
  { path: "/health", match: "exact", handler: handleHealthRoute },
  { path: "/", match: "exact", handler: handleRootRoute },
];

export async function dispatchRoute(
  request: Request,
  env: Env,
  context: RouteContext
): Promise<Response | null> {
  const pathname = context.url.pathname;
  for (const route of routes) {
    if (route.match === "exact") {
      if (pathname === route.path) {
        return route.handler(request, env, context);
      }
      continue;
    }
    if (pathname.startsWith(route.path)) {
      return route.handler(request, env, context);
    }
  }
  return null;
}
