import { parse } from 'csv-parse/sync';
import path from 'node:path';
import { fetchCsv } from './csvFetch';
import { requiredConfigColumns, siteConfigSchema, type SiteConfig } from './schema';

const SAMPLE_CONFIG = path.resolve('data/site_config.sample.csv');

export async function loadSiteConfig(): Promise<SiteConfig> {
  const url = process.env.SITE_CONFIG_CSV_URL;
  const csv = await fetchCsv(url || SAMPLE_CONFIG, SAMPLE_CONFIG);
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
