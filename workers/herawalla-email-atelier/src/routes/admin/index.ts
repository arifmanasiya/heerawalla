import type { Env } from "../../config";
import type { RouteContext } from "../../types";
import { handleAdminRequest } from "../../legacy";

export async function handleAdminRoutes(
  request: Request,
  env: Env,
  context: RouteContext
): Promise<Response> {
  const { url, allowedOrigin, origin } = context;
  const response = await handleAdminRequest(request, env, url, allowedOrigin, origin);
  return response || new Response("Not Found", { status: 404 });
}
