import fs from 'node:fs/promises';
import path from 'node:path';

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

const normalizeMode = (value?: string) => (value || '').trim().toLowerCase();
const metaEnv = (import.meta as { env?: Record<string, string | undefined> }).env || {};

export function getEnv(key: string): string | undefined {
  return process.env[key] ?? metaEnv[key];
}

export function getCsvSourceMode(): 'local' | 'remote' {
  const mode = normalizeMode(getEnv('CSV_SOURCE') || getEnv('DATA_SOURCE'));
  if (['remote', 'google', 'sheets'].includes(mode)) return 'remote';
  return 'local';
}

export function parseCsvSources(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function readFile(filePath: string) {
  const resolved = path.resolve(filePath);
  return fs.readFile(resolved, 'utf8');
}

export async function fetchCsv(source: string, fallbackFile?: string): Promise<string> {
  try {
    if (isHttpUrl(source)) {
      const res = await fetch(source);
      if (!res.ok) {
        throw new Error(`Failed to fetch CSV (${res.status} ${res.statusText}) from ${source}`);
      }
      return await res.text();
    }
    return await readFile(source);
  } catch (err) {
    if (fallbackFile) {
      console.warn(`CSV fetch failed for ${source}. Falling back to ${fallbackFile}.`, err);
      return readFile(fallbackFile);
    }
    throw err;
  }
}
