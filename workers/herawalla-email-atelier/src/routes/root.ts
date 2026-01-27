import type { Env } from "../config";
import type { RouteContext } from "../types";
import { EMAIL_HTML, REJECT_HTML } from "../config";

export async function handleRootRoute(
  _request: Request,
  _env: Env,
  _context: RouteContext
): Promise<Response> {
  const previewDoc = EMAIL_HTML.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const rejectPreviewDoc = REJECT_HTML.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Heerawalla Email Atelier</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, sans-serif; max-width: 900px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #0f172a; }
          .status { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 20px 0; border-radius: 4px; }
          .preview { width: 100%; height: 720px; border: 1px solid #e5e7eb; background: #fff; }
          .label { font-size: 12px; letter-spacing: 0.32em; text-transform: uppercase; color: #64748b; margin: 24px 0 12px; }
        </style>
      </head>
      <body>
        <h1>Heerawalla Email Atelier</h1>
        <div class="status">
          <strong>Status:</strong> Operational<br>
          <strong>Service:</strong> Email forwarding & auto-reply<br>
          <small>First emails get auto-reply, replies only forwarded</small>
        </div>
        <p><a href="/health">Health check</a></p>
        <div class="label">Acknowledgment Preview</div>
        <iframe class="preview" title="Heerawalla acknowledgment preview" srcdoc="${previewDoc}"></iframe>
        <div class="label">Reject Preview</div>
        <iframe class="preview" title="Heerawalla reject preview" srcdoc="${rejectPreviewDoc}"></iframe>
      </body>
      </html>`;

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
