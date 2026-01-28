import { getEnv } from './csvFetch';
import { siteConfigSchema, type SiteConfig } from './schema';

export async function loadSiteConfig(): Promise<SiteConfig> {
  const apiBase = (getEnv('PUBLIC_CATALOG_API_URL') || '').trim();
  if (!apiBase) {
    return siteConfigSchema.parse({});
  }
  try {
    const joiner = apiBase.includes('?') ? '&' : '?';
    const url = `${apiBase}${joiner}include=site_config,cost_chart`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`Catalog config API failed (${response.status} ${response.statusText}).`);
    }
    const data = (await response.json()) as {
      siteConfig?: Record<string, string>;
      costChart?: Record<string, string>;
    };
    const config: Record<string, string> = { ...(data.siteConfig || {}) };
    const costChart = data.costChart || {};
    Object.entries(costChart).forEach(([key, value]) => {
      if (key) config[key] = String(value ?? '');
    });
    return siteConfigSchema.parse(config);
  } catch {
    // Fallback to empty config so static builds don’t fail when the API is unreachable.
    return siteConfigSchema.parse({});
  }
}

export function getConfigValue(config: SiteConfig, key: string, fallback = ''): string {
  return config[key] || fallback;
}
