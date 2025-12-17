import fs from 'node:fs/promises';
import path from 'node:path';

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

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
      return readFile(fallbackFile);
    }
    throw err;
  }
}
