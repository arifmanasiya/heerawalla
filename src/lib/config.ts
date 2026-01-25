import { getEnv } from './csvFetch';
import { siteConfigSchema, type SiteConfig } from './schema';

export async function loadSiteConfig(): Promise<SiteConfig> {
  const apiBase = (getEnv('PUBLIC_CATALOG_API_URL') || '').trim();
  if (!apiBase) {
    throw new Error('PUBLIC_CATALOG_API_URL is required to load site config from D1.');
  }
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
  if (!Object.keys(config).length) {
    throw new Error('Site config from D1 is empty.');
  }
  return siteConfigSchema.parse(config);
}

export function getConfigValue(config: SiteConfig, key: string, fallback = ''): string {
  return config[key] || fallback;
}
