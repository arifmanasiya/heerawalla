import type { Env } from "../../config";
import type { RouteContext } from "../../types";
import { handleQuoteConfirmationRequest } from "../../legacy";

export async function handleQuoteConfirmationRoute(
  request: Request,
  env: Env,
  context: RouteContext
): Promise<Response> {
  const { url, allowedOrigin } = context;
  const response = await handleQuoteConfirmationRequest(request, env, url, allowedOrigin);
  return response || new Response("Not Found", { status: 404 });
}
