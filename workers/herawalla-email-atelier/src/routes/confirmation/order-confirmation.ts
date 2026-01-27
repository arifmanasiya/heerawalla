import type { Env } from "../../config";
import type { RouteContext } from "../../types";
import { handleOrderConfirmationRequest } from "../../legacy";

export async function handleOrderConfirmationRoute(
  request: Request,
  env: Env,
  context: RouteContext
): Promise<Response> {
  const { url, allowedOrigin } = context;
  const response = await handleOrderConfirmationRequest(request, env, url, allowedOrigin);
  return response || new Response("Not Found", { status: 404 });
}
