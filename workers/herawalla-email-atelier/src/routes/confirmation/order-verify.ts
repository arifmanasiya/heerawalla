import type { Env } from "../../config";
import type { RouteContext } from "../../types";
import { handleOrderVerificationRequest } from "../../legacy";

export async function handleOrderVerifyRoute(
  request: Request,
  env: Env,
  context: RouteContext
): Promise<Response> {
  const { url, allowedOrigin } = context;
  const response = await handleOrderVerificationRequest(request, env, url, allowedOrigin);
  return response || new Response("Not Found", { status: 404 });
}
