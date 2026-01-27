import type { Env } from "../config";
import type { RouteContext } from "../types";
import { buildCatalogHeaders } from "../utils/cors";
import { buildCatalogResponse } from "../services/catalog-service";

export async function handleCatalogRoute(
  request: Request,
  env: Env,
  context: RouteContext
): Promise<Response> {
  const { url } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildCatalogHeaders(),
    });
  }

  if (request.method !== "GET") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: buildCatalogHeaders(),
    });
  }

  return buildCatalogResponse(env, url);
}
