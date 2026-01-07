import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

type PricingConfig = {
  mode: 'auto' | 'manual';
  usdInrRate?: number;
};

const DEFAULT_RATE = 85;
const SAMPLE_FILE = path.resolve('data/pricing.defaults.csv');

async function readPricingCsv(filePath: string): Promise<PricingConfig> {
  try {
    const csv = await fs.readFile(filePath, 'utf8');
    const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
    if (!rows.length) throw new Error('Pricing CSV empty');
    const row = rows[0];
    const mode = (row.mode || 'auto').toLowerCase() === 'manual' ? 'manual' : 'auto';
    const usdInrRate = row.usd_inr_rate ? Number(row.usd_inr_rate) : undefined;
    return { mode, usdInrRate };
  } catch {
    return { mode: 'auto', usdInrRate: DEFAULT_RATE };
  }
}

export async function loadPricingConfig(): Promise<PricingConfig> {
  return readPricingCsv(SAMPLE_FILE);
}
