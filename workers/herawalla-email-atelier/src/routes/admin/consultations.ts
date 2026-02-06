import type { Env } from "../../config";
import { buildCorsHeaders } from "../../utils/cors";

export async function getConsultationAnalytics(
  request: Request,
  env: Env,
  allowedOrigin: string
): Promise<Response> {
  const corsHeaders = buildCorsHeaders(allowedOrigin, true);
  if (!env.DB) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "database_unavailable",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  try {
    const url = new URL(request.url);
    const daysRaw = Number.parseInt(url.searchParams.get("days") || "30", 10);
    const daysBack = Number.isFinite(daysRaw) && daysRaw > 0 ? Math.min(daysRaw, 365) : 30;
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    const sourceStats = await env.DB.prepare(
      `
      SELECT 
        COALESCE(utm_source, 'direct') as source,
        COUNT(*) as total,
        SUM(CASE WHEN consultation_status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN consultation_outcome = 'became_quote' THEN 1 ELSE 0 END) as became_quotes,
        SUM(CASE WHEN consultation_outcome = 'became_order' THEN 1 ELSE 0 END) as became_orders
      FROM consultations
      WHERE created_at > ?
      GROUP BY utm_source
      ORDER BY total DESC
    `
    )
      .bind(startDate)
      .all();

    const campaignStats = await env.DB.prepare(
      `
      SELECT 
        utm_campaign,
        utm_source,
        utm_medium,
        COUNT(*) as bookings,
        SUM(CASE WHEN consultation_outcome = 'became_quote' THEN 1 ELSE 0 END) as conversions
      FROM consultations
      WHERE created_at > ? AND utm_campaign IS NOT NULL
      GROUP BY utm_campaign, utm_source, utm_medium
      ORDER BY bookings DESC
    `
    )
      .bind(startDate)
      .all();

    const hearAboutStats = await env.DB.prepare(
      `
      SELECT 
        how_heard_about_us,
        COUNT(*) as count
      FROM consultations
      WHERE created_at > ? AND how_heard_about_us IS NOT NULL
      GROUP BY how_heard_about_us
      ORDER BY count DESC
    `
    )
      .bind(startDate)
      .all();

    const recentConsultations = await env.DB.prepare(
      `
      SELECT 
        id,
        customer_name,
        customer_email,
        created_at,
        utm_source,
        utm_campaign,
        how_heard_about_us,
        consultation_status,
        consultation_outcome
      FROM consultations
      WHERE created_at > ?
      ORDER BY created_at DESC
      LIMIT 50
    `
    )
      .bind(startDate)
      .all();

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          sourceStats: sourceStats.results,
          campaignStats: campaignStats.results,
          hearAboutStats: hearAboutStats.results,
          recentConsultations: recentConsultations.results,
          dateRange: { daysBack, startDate },
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch analytics",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}
