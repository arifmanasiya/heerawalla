import type { Env } from "../config";
import type { RouteContext } from "../types";
import { buildCorsHeaders } from "../utils/cors";
import { logError } from "../utils/logging";
import { safeJson } from "../utils/request-utils";
import { isRecord } from "../utils/validation";
import { estimatePricing } from "../services/pricing-service";

export async function handlePricingRoute(
  request: Request,
  env: Env,
  context: RouteContext
): Promise<Response> {
  const { allowedOrigin } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }

  if (!allowedOrigin) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const payload = await safeJson(request);
    if (!isRecord(payload)) {
      return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    const wantsDebug = payload.debug === true;
    const { result, discountDetails } = await estimatePricing(payload, env);
    if (!result.ok) {
      return new Response(JSON.stringify({ ok: false, error: result.error }), {
        status: 400,
        headers: buildCorsHeaders(allowedOrigin, true),
      });
    }
    return new Response(
      JSON.stringify({
        ok: true,
        price: Math.round(result.price),
        meta: {
          discountSummary: discountDetails.summary,
          discountPercent: discountDetails.appliedPercent,
        },
        ...(wantsDebug ? { debug: result.debug || null } : {}),
      }),
      { status: 200, headers: buildCorsHeaders(allowedOrigin, true) }
    );
  } catch (error) {
    const message = String(error);
    logError("pricing_estimate_error", { message });
    return new Response(JSON.stringify({ ok: false, error: "pricing_failed" }), {
      status: 500,
      headers: buildCorsHeaders(allowedOrigin, true),
    });
  }
}
