import { getEnv } from './csvFetch';
import { productSchema, type Product, type ProductInput } from './schema';
import { getMediaForProduct, type MediaCollection } from './media';
import pLimit from 'p-limit';

const normalizeListValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean).join('|');
  }
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

function toBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ['true', '1', 'yes', 'y'].includes(value.trim().toLowerCase());
}

function toBooleanValue(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (value === undefined || value === null) return fallback;
  return toBoolean(String(value));
}

function toOptionalString(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
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

function toOptionalNumberFromUnknown(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function loadProductsFromApi(slug?: string): Promise<Product[]> {
  const apiBase = (getEnv('PUBLIC_CATALOG_API_URL') || '').trim();
  if (!apiBase) {
    throw new Error('PUBLIC_CATALOG_API_URL is required to load products from D1.');
  }
  const joiner = apiBase.includes('?') ? '&' : '?';
  const isLocal = /localhost|127\.0\.0\.1/i.test(apiBase);
  const cacheBust = isLocal ? `&bust=${Date.now()}` : '';
  const slugParam = slug ? `&slug=${encodeURIComponent(slug)}` : '';
  const url = `${apiBase}${joiner}include=products${slugParam}${cacheBust}`;
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`Catalog API failed (${response.status} ${response.statusText}).`);
    }
    const data = (await response.json()) as { products?: Record<string, unknown>[] };
    const rows = Array.isArray(data.products) ? data.products : [];
    if (!rows.length) return [];
    const parsed = rows
      .map((row) => {
        const metalOptions = normalizeListValue(row.metal_options ?? row.metals ?? row.metal);
        const stoneTypeOptions = normalizeListValue(row.stone_type_options ?? row.stone_types);
        const stoneWeightRange = normalizeListValue(row.stone_weight_range ?? row.stone_weight);
        const metalWeightRange = normalizeListValue(row.metal_weight_range ?? row.metal_weight);
        const categoryValue = normalizeListValue(row.category ?? row.categories);
        const genderValue = normalizeListValue(row.gender);
        let stoneOptions: unknown[] | undefined;
        if (Array.isArray(row.stone_options)) {
          stoneOptions = row.stone_options;
        } else if (typeof row.stone_options === 'string') {
          try {
            const parsed = JSON.parse(row.stone_options);
            if (Array.isArray(parsed)) stoneOptions = parsed;
          } catch {
            // ignore parse errors; leave undefined
          }
        }
        const base = {
          id: String(row.id || ''),
          name: String(row.name || ''),
          slug: String(row.slug || ''),
          description: String(row.description || row.long_desc || ''),
          category: toOptionalFirstListItem(categoryValue) || categoryValue,
          gender: genderValue,
          design_code: String(row.design_code || 'Signature'),
          metal: toOptionalFirstListItem(metalOptions) || String(row.metal || ''),
          metal_options: metalOptions || '',
          stone_types: toOptionalString(stoneTypeOptions),
          stone_type_options: stoneTypeOptions || '',
          stone_weight: toOptionalNumberFromUnknown(row.stone_weight) ?? toOptionalNumberFromList(stoneWeightRange),
          stone_weight_range: stoneWeightRange || '',
          metal_weight: toOptionalNumberFromUnknown(row.metal_weight) ?? toOptionalNumberFromList(metalWeightRange),
          metal_weight_range: metalWeightRange || '',
          stone_options: stoneOptions,
          metal_weight_options: Array.isArray(row.metal_weight_options) ? row.metal_weight_options : undefined,
          cut: String(row.cut || ''),
          clarity: String(row.clarity || ''),
          color: String(row.color || ''),
          carat: toOptionalNumberFromUnknown(row.carat),
          is_active: toBooleanValue(row.is_active, true),
          is_featured: toBooleanValue(row.is_featured, false),
          tags: normalizeListValue(row.tags)
        };
        const validated = productSchema.parse(base) as ProductInput;
        return { ...validated };
      })
      .filter((p) => p.is_active);
    return parsed;
  }
  catch (error) {
    console.error('Original D1 API Error:', error);
    throw new Error('Failed to load products from D1 catalog API.');
  }
}

export async function loadProducts(slug?: string): Promise<Product[]> {
  return loadProductsFromApi(slug);
}

export async function loadProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await loadProducts(slug);
  return products.find((p) => p.slug === slug);
}

export type ProductWithMedia = Product & { media: MediaCollection };

export async function loadProductsWithMedia(): Promise<ProductWithMedia[]> {
  const limit = pLimit(10);
  const products = await loadProducts();
  const withMedia = await Promise.all(
    products.map((product) => limit(async () => {
      const media = await getMediaForProduct(product);
      return { ...product, media };
    }))
  );
  return withMedia;
}

export async function loadProductBySlugWithMedia(slug: string): Promise<ProductWithMedia | undefined> {
  const product = await loadProductBySlug(slug);
  if (!product) return undefined;
  const media = await getMediaForProduct(product);
  return { ...product, media };
}

export async function loadCollections(products?: Product[]) {
  const items = products ?? (await loadProducts());
  const codes = new Set(items.map((p) => p.design_code).filter(Boolean));
  return Array.from(codes);
}
