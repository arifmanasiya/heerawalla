import type { Env } from "../config";

export type RouteContext = {
  url: URL;
  origin: string;
  allowedOrigin: string;
  params?: Record<string, string>;
};

export type RouteHandler = (
  request: Request,
  env: Env,
  context: RouteContext
) => Promise<Response>;
