import { parse } from 'csv-parse/sync';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchCsv, getCsvSourceMode, getEnv, parseCsvSources } from './csvFetch';
import { productSchema, requiredProductColumns, type Product, type ProductInput } from './schema';
import { getMediaForProduct, type MediaCollection } from './media';

const DATA_DIR = path.resolve('data');
const SAMPLE_PRODUCTS = path.resolve('data/products.sample.csv');

function toBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ['true', '1', 'yes', 'y'].includes(value.trim().toLowerCase());
}

function toOptionalString(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function toOptionalNumber(value: string | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  const trimmed = value.toString().trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toOptionalFirstListItem(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const first = value.split('|')[0];
  const trimmed = first.trim();
  return trimmed ? trimmed : undefined;
}

function toOptionalNumberFromList(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const first = toOptionalFirstListItem(value);
  if (!first) return undefined;
  const parsed = Number(first.trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function readLocalProductCSVs(): Promise<string[]> {
  const entries = await fs.readdir(DATA_DIR);
  const matches = entries.filter((file) => file.startsWith('products-') && file.endsWith('.csv'));
  if (matches.length === 0) return [SAMPLE_PRODUCTS];
  return matches.map((f) => path.join(DATA_DIR, f));
}

async function getLocalProductFallback(): Promise<string> {
  const preferred = path.resolve('data/products-all.csv');
  try {
    await fs.access(preferred);
    return preferred;
  } catch {
    const files = await readLocalProductCSVs();
    return files[0];
  }
}

async function loadCsvFile(source: string, fallbackFile?: string): Promise<Product[]> {
  const csv = await fetchCsv(source, fallbackFile);
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
      throw new Error(`Products CSV missing required column: ${col} in ${source}`);
    }
  }

  const parsed = records
    .map((row) => {
      const metalOptions = toOptionalString(row.metal_options || row.metals);
      const stoneTypeOptions = toOptionalString(row.stone_type_options || row.stone_types);
      const stoneWeightRange = toOptionalString(row.stone_weight_range || row.stone_weight);
      const metalWeightRange = toOptionalString(row.metal_weight_range || row.metal_weight);
      const clarityRange = toOptionalString(row.clarity_range || row.clarity);
      const colorRange = toOptionalString(row.color_range || row.color);
      const cutRange = toOptionalString(row.cut_range || row.cut);
      const base = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        collection: row.collection,
        category: toOptionalFirstListItem(row.categories) || row.categories || row.category,
        design_code: row.design_code,
        metal: toOptionalFirstListItem(metalOptions) || row.metals || row.metal,
        metal_options: metalOptions || '',
        stone_types: toOptionalString(stoneTypeOptions),
        stone_type_options: stoneTypeOptions || '',
        stone_weight: toOptionalNumber(row.stone_weight) ?? toOptionalNumberFromList(stoneWeightRange),
        stone_weight_range: stoneWeightRange || '',
        metal_weight: toOptionalNumber(row.metal_weight) ?? toOptionalNumberFromList(metalWeightRange),
        metal_weight_range: metalWeightRange || '',
        cut: toOptionalFirstListItem(cutRange) || toOptionalString(row.cut),
        cut_range: cutRange || '',
        clarity: toOptionalFirstListItem(clarityRange) || toOptionalString(row.clarity),
        clarity_range: clarityRange || '',
        color: toOptionalFirstListItem(colorRange) || toOptionalString(row.color),
        color_range: colorRange || '',
        carat: toOptionalNumber(row.carat),
        price_usd_natural: toOptionalNumber(row.price_usd_natural) ?? 0,
        lab_discount_pct: toOptionalNumber(row.lab_discount_pct),
        metal_platinum_premium: toOptionalNumber(row.metal_platinum_premium),
        metal_14k_discount_pct: toOptionalNumber(row.metal_14k_discount_pct),
        is_active: toBoolean(row.is_active),
        is_featured: toBoolean(row.is_featured),
        tags: row.tags
      };
      const validated = productSchema.parse(base) as ProductInput;
      return { ...validated };
    })
    .filter((p) => p.is_active);
  return parsed;
}

export async function loadProducts(): Promise<Product[]> {
  const sources = await readProductSources();
  const results = await Promise.all(
    sources.map((entry) => loadCsvFile(entry.source, entry.fallback))
  );
  return results.flat();
}

async function readProductSources(): Promise<Array<{ source: string; fallback?: string }>> {
  const mode = getCsvSourceMode();
  if (mode === 'remote') {
    const urls = parseCsvSources(getEnv('PRODUCTS_CSV_URLS') || getEnv('PRODUCTS_CSV_URL'));
    if (!urls.length) {
      throw new Error('PRODUCTS_CSV_URL or PRODUCTS_CSV_URLS is required when CSV_SOURCE=remote.');
    }
    const fallback = urls.length === 1 ? await getLocalProductFallback() : undefined;
    return urls.map((source) => ({ source, fallback }));
  }

  const files = await readLocalProductCSVs();
  return files.map((source) => ({ source, fallback: source }));
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
