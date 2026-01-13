import { parse } from 'csv-parse/sync';
import path from 'node:path';
import { fetchCsv, getCsvSourceMode, getEnv } from './csvFetch';
import { requiredConfigColumns, siteConfigSchema, type SiteConfig } from './schema';

const SAMPLE_CONFIG = path.resolve('data/site_config.sample.csv');

export async function loadSiteConfig(): Promise<SiteConfig> {
  const mode = getCsvSourceMode();
  const url = (getEnv('SITE_CONFIG_CSV_URL') || '').trim();
  if (mode === 'remote' && !url) {
    throw new Error('SITE_CONFIG_CSV_URL is required when CSV_SOURCE=remote.');
  }
  const source = mode === 'remote' ? url : SAMPLE_CONFIG;
  const fallback = SAMPLE_CONFIG;
  const csv = await fetchCsv(source, fallback);
  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as Record<string, string>[];

  if (!records.length) {
    throw new Error('Site config CSV has no rows.');
  }
  const cols = Object.keys(records[0]);
  for (const col of requiredConfigColumns) {
    if (!cols.includes(col)) {
      throw new Error(`Site config CSV missing required column: ${col}`);
    }
  }

  const config: Record<string, string> = {};
  for (const row of records) {
    if (row.key) config[row.key] = row.value || '';
  }
  return siteConfigSchema.parse(config);
}

export function getConfigValue(config: SiteConfig, key: string, fallback = ''): string {
  return config[key] || fallback;
}
