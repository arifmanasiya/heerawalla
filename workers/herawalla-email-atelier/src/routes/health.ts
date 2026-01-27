import type { Env } from "../config";
import type { RouteContext } from "../types";

export async function handleHealthRoute(
  _request: Request,
  _env: Env,
  _context: RouteContext
): Promise<Response> {
  return new Response("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
