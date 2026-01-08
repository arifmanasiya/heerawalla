import { parse } from 'csv-parse/sync';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchCsv } from './csvFetch';
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

function toOptionalBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  const trimmed = value.toString().trim();
  if (!trimmed) return undefined;
  return ['true', '1', 'yes', 'y'].includes(trimmed.toLowerCase());
}

async function readProductCSVs(): Promise<string[]> {
  const entries = await fs.readdir(DATA_DIR);
  const matches = entries.filter((file) => file.startsWith('products-') && file.endsWith('.csv'));
  if (matches.length === 0) return [SAMPLE_PRODUCTS];
  return matches.map((f) => path.join(DATA_DIR, f));
}

async function loadCsvFile(filePath: string): Promise<Product[]> {
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
        design_code: row.design_code,
        metal: row.metal,
        cut: toOptionalString(row.cut),
        clarity: toOptionalString(row.clarity),
        color: toOptionalString(row.color),
        carat: row.carat ? Number(row.carat) : undefined,
        price_usd_natural: Number(row.price_usd_natural),
        lab_discount_pct: toOptionalNumber(row.lab_discount_pct),
        metal_14k_discount_pct: toOptionalNumber(row.metal_14k_discount_pct),
        natural_available: toOptionalBoolean(row.natural_available),
        lab_available: toOptionalBoolean(row.lab_available),
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
