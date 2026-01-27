import type { Env } from "../config";
import { CATALOG_CACHE_SECONDS } from "../config";
import { buildCatalogCacheKey, loadCatalogPayload } from "../legacy";
import { buildCatalogHeaders } from "../utils/cors";
import { logError } from "../utils/logging";

export async function buildCatalogResponse(env: Env, url: URL): Promise<Response> {
  const cacheKey = new Request(url.toString(), { method: "GET" });
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }
  const kvCacheKey = buildCatalogCacheKey(url);
  if (env.HEERAWALLA_ACKS) {
    const kvPayload = await env.HEERAWALLA_ACKS.get(kvCacheKey);
    if (kvPayload) {
      const response = new Response(kvPayload, {
        status: 200,
        headers: buildCatalogHeaders(),
      });
      response.headers.set(
        "Cache-Control",
        `public, max-age=${CATALOG_CACHE_SECONDS}, s-maxage=${CATALOG_CACHE_SECONDS}`
      );
      await cache.put(cacheKey, response.clone());
      return response;
    }
  }

  try {
    const payload = await loadCatalogPayload(env, url.searchParams);
    const response = new Response(JSON.stringify(payload), {
      status: 200,
      headers: buildCatalogHeaders(),
    });
    response.headers.set(
      "Cache-Control",
      `public, max-age=${CATALOG_CACHE_SECONDS}, s-maxage=${CATALOG_CACHE_SECONDS}`
    );
    if (env.HEERAWALLA_ACKS) {
      await env.HEERAWALLA_ACKS.put(
        kvCacheKey,
        JSON.stringify(payload),
        { expirationTtl: CATALOG_CACHE_SECONDS }
      );
    }
    await cache.put(cacheKey, response.clone());
    return response;
  } catch (error) {
    const message = String(error);
    logError("catalog_error", { message });
    return new Response(JSON.stringify({ ok: false, error: "catalog_failed" }), {
      status: 500,
      headers: buildCatalogHeaders(),
    });
  }
}
