import { parse } from 'csv-parse/sync';
import path from 'node:path';
import { fetchCsv } from './csvFetch';
import { productSchema, requiredProductColumns, type Product } from './schema';

const SAMPLE_PRODUCTS = path.resolve('data/products.sample.csv');

function toBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ['true', '1', 'yes', 'y'].includes(value.trim().toLowerCase());
}

export async function loadProducts(): Promise<Product[]> {
  const url = process.env.PRODUCTS_CSV_URL;
  const csv = await fetchCsv(url || SAMPLE_PRODUCTS, SAMPLE_PRODUCTS);
  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as Record<string, string>[];

  if (!records.length) {
    throw new Error('Products CSV has no rows.');
  }
  const cols = Object.keys(records[0]);
  for (const col of requiredProductColumns) {
    if (!cols.includes(col)) {
      throw new Error(`Products CSV missing required column: ${col}`);
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
        price_usd: Number(row.price_usd),
        price_inr: Number(row.price_inr),
        image: row.image,
        is_active: toBoolean(row.is_active),
        is_featured: toBoolean(row.is_featured),
        tags: row.tags
      };
      return productSchema.parse(base);
    })
    .filter((p) => p.is_active);

  return parsed;
}

export async function loadProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await loadProducts();
  return products.find((p) => p.slug === slug);
}

export async function loadCollections(products?: Product[]) {
  const items = products ?? (await loadProducts());
  const collections = new Set(items.map((p) => p.collection).filter(Boolean));
  return Array.from(collections);
}
