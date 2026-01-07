import { parse } from 'csv-parse/sync';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchCsv } from './csvFetch';
import { productSchema, requiredProductColumns, type Product, type ProductInput } from './schema';
import { getMediaForProduct, type MediaCollection } from './media';

const DATA_DIR = path.resolve('data');
const SAMPLE_PRODUCTS = path.resolve('data/products.sample.csv');

let cachedUsdInrRate: number | null = null;

async function fetchUsdInrRate(): Promise<number> {
  if (cachedUsdInrRate) return cachedUsdInrRate;
  const fallback = Number(process.env.USDINR_RATE || 85);
  const date = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const url = `https://api.exchangerate.host/${date}?base=USD&symbols=INR`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Rate fetch failed ${res.status}`);
    const data = (await res.json()) as { rates?: { INR?: number } };
    const rate = data?.rates?.INR;
    if (!rate || rate <= 0) throw new Error('Invalid rate');
    cachedUsdInrRate = rate * 1.05; // add 5% buffer
  } catch {
    cachedUsdInrRate = fallback * 1.05;
  }
  return cachedUsdInrRate;
}

function inrToUsd(amountInInr: number, usdInrRate: number) {
  const usd = amountInInr / usdInrRate;
  return Math.round(usd * 100) / 100;
}

function toBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ['true', '1', 'yes', 'y'].includes(value.trim().toLowerCase());
}

function toOptionalString(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

async function readProductCSVs(): Promise<string[]> {
  const entries = await fs.readdir(DATA_DIR);
  const matches = entries.filter((file) => file.startsWith('products-') && file.endsWith('.csv'));
  if (matches.length === 0) return [SAMPLE_PRODUCTS];
  return matches.map((f) => path.join(DATA_DIR, f));
}

async function loadCsvFile(filePath: string): Promise<Product[]> {
  const usdInrRate = await fetchUsdInrRate();
  const csv = await fetchCsv(filePath, filePath);
  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as Record<string, string>[];

  if (!records.length) {
    return [];
  }
  const cols = Object.keys(records[0]);
  for (const col of requiredProductColumns) {
    if (!cols.includes(col)) {
      throw new Error(`Products CSV missing required column: ${col} in ${filePath}`);
    }
  }

  const parsed = records
    .map((row) => {
      const base = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        collection: row.collection,
        category: row.category,
        metal: row.metal,
        cut: toOptionalString(row.cut),
        clarity: toOptionalString(row.clarity),
        color: toOptionalString(row.color),
        carat: row.carat ? Number(row.carat) : undefined,
        price_inr_natural: Number(row.price_inr_natural),
        price_inr_lab: row.price_inr_lab ? Number(row.price_inr_lab) : undefined,
        is_active: toBoolean(row.is_active),
        is_featured: toBoolean(row.is_featured),
        tags: row.tags
      };
      const validated = productSchema.parse(base) as ProductInput;
      const price_usd_natural = inrToUsd(validated.price_inr_natural, usdInrRate);
      const price_usd_lab = validated.price_inr_lab ? inrToUsd(validated.price_inr_lab, usdInrRate) : undefined;
      return { ...validated, price_usd_natural, price_usd_lab };
    })
    .filter((p) => p.is_active);
  return parsed;
}

export async function loadProducts(): Promise<Product[]> {
  const files = await readProductCSVs();
  const results = await Promise.all(files.map((f) => loadCsvFile(f)));
  return results.flat();
}

export async function loadProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await loadProducts();
  return products.find((p) => p.slug === slug);
}

export type ProductWithMedia = Product & { media: MediaCollection };

export async function loadProductsWithMedia(): Promise<ProductWithMedia[]> {
  const products = await loadProducts();
  const withMedia = await Promise.all(
    products.map(async (product) => {
      const media = await getMediaForProduct(product);
      return { ...product, media };
    })
  );
  return withMedia;
}

export async function loadProductBySlugWithMedia(slug: string): Promise<ProductWithMedia | undefined> {
  const products = await loadProductsWithMedia();
  return products.find((p) => p.slug === slug);
}

export async function loadCollections(products?: Product[]) {
  const items = products ?? (await loadProducts());
  const collections = new Set(items.map((p) => p.collection).filter(Boolean));
  return Array.from(collections);
}
