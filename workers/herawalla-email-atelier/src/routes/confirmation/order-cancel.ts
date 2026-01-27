import type { Env } from "../../config";
import type { RouteContext } from "../../types";
import { handleOrderCancellationRequest } from "../../legacy";

export async function handleOrderCancelRoute(
  request: Request,
  env: Env,
  context: RouteContext
): Promise<Response> {
  const { url, allowedOrigin } = context;
  const response = await handleOrderCancellationRequest(request, env, url, allowedOrigin);
  return response || new Response("Not Found", { status: 404 });
}
