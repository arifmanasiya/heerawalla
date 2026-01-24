import { getEnv } from './csvFetch';
import { withBase } from './paths';

export type MediaLibraryEntry = {
  media_id: string;
  url: string;
  media_type: string;
  label?: string;
  alt?: string;
  description?: string;
};

export type MediaMapping = {
  media_id: string;
  position?: string;
  is_primary?: boolean;
  order?: number;
  product_slug?: string;
  product_slugs?: string;
  inspiration_slug?: string;
  inspiration_slugs?: string;
};

const MEDIA_POSITION_ORDER = [
  'hero',
  'pendant',
  'earring',
  'bracelet',
  'ring',
  'composition',
  'feature',
  'engraving',
  'gallery',
  'detail',
];

const cache = {
  library: null as MediaLibraryEntry[] | null,
  productMedia: null as MediaMapping[] | null,
  inspirationMedia: null as MediaMapping[] | null,
  promise: null as Promise<void> | null,
};

const parseNumber = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number(String(value).trim());
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseDelimitedSlugs = (value: string) =>
  value
    .split('|')
    .map((slug) => slug.trim())
    .filter(Boolean);

const normalizePosition = (value: string) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'earrings') return 'earring';
  if (normalized === 'bangle' || normalized === 'bangles') return 'bracelet';
  if (normalized === 'rings') return 'ring';
  return normalized;
};

const sortMediaMappings = (a: MediaMapping, b: MediaMapping) => {
  const primaryA = a.is_primary ? 0 : 1;
  const primaryB = b.is_primary ? 0 : 1;
  if (primaryA !== primaryB) return primaryA - primaryB;
  const positionA = MEDIA_POSITION_ORDER.indexOf(normalizePosition(a.position || ''));
  const positionB = MEDIA_POSITION_ORDER.indexOf(normalizePosition(b.position || ''));
  if (positionA !== positionB) {
    const safeA = positionA === -1 ? 99 : positionA;
    const safeB = positionB === -1 ? 99 : positionB;
    if (safeA !== safeB) return safeA - safeB;
  }
  const orderA = Number.isFinite(a.order) ? Number(a.order) : 0;
  const orderB = Number.isFinite(b.order) ? Number(b.order) : 0;
  if (orderA !== orderB) return orderA - orderB;
  return String(a.media_id || '').localeCompare(String(b.media_id || ''));
};

const normalizeMediaUrl = (raw: string) => {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return withBase(trimmed.startsWith('/') ? trimmed : `/${trimmed}`);
};

async function ensureCatalogLoaded() {
  if (cache.promise) return cache.promise;
  cache.promise = (async () => {
    const apiBase = (getEnv('PUBLIC_CATALOG_API_URL') || '').trim();
    if (!apiBase) {
      throw new Error('PUBLIC_CATALOG_API_URL is required to load media from D1.');
    }
    const joiner = apiBase.includes('?') ? '&' : '?';
    const url = `${apiBase}${joiner}include=media_library,product_media,inspiration_media`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`Catalog media API failed (${response.status} ${response.statusText}).`);
    }
    const data = (await response.json()) as {
      media_library?: MediaLibraryEntry[];
      product_media?: MediaMapping[];
      inspiration_media?: MediaMapping[];
    };
    cache.library = (data.media_library || [])
      .map((entry) => ({
        media_id: String(entry.media_id || '').trim(),
        url: normalizeMediaUrl(entry.url || ''),
        media_type: String(entry.media_type || 'image').trim(),
        label: entry.label || '',
        alt: entry.alt || '',
        description: entry.description || '',
      }))
      .filter((entry) => entry.media_id && entry.url);
    cache.productMedia = (data.product_media || [])
      .map((row) => ({
        media_id: String(row.media_id || '').trim(),
        product_slug: String(row.product_slug || row.product_slugs || '').trim(),
        position: row.position || '',
        is_primary: Boolean(row.is_primary),
        order: typeof row.order === 'number' ? row.order : parseNumber(String(row.order || '')),
      }))
      .filter((entry) => entry.media_id && entry.product_slug);
    cache.inspirationMedia = (data.inspiration_media || [])
      .map((row) => ({
        media_id: String(row.media_id || '').trim(),
        inspiration_slug: String(row.inspiration_slug || row.inspiration_slugs || '').trim(),
        position: row.position || '',
        is_primary: Boolean(row.is_primary),
        order: typeof row.order === 'number' ? row.order : parseNumber(String(row.order || '')),
      }))
      .filter((entry) => entry.media_id && entry.inspiration_slug);
  })();
  return cache.promise;
}

export async function getMediaLibraryMap() {
  await ensureCatalogLoaded();
  const map = new Map<string, MediaLibraryEntry>();
  (cache.library || []).forEach((entry) => {
    map.set(entry.media_id, entry);
  });
  return map;
}

export async function getProductMediaMappings() {
  await ensureCatalogLoaded();
  return cache.productMedia || [];
}

export async function getInspirationMediaMappings() {
  await ensureCatalogLoaded();
  return cache.inspirationMedia || [];
}

export function resolveMediaForSlug(
  slug: string,
  mappings: MediaMapping[],
  mediaById: Map<string, MediaLibraryEntry>
) {
  const matches = mappings
    .filter((entry) => {
      const value = entry.product_slug || entry.inspiration_slug || '';
      const slugs = parseDelimitedSlugs(value);
      return slugs.some((item) => item.toLowerCase() === String(slug || '').toLowerCase());
    })
    .sort(sortMediaMappings);
  const resolved = matches
    .map((entry) => {
      const media = mediaById.get(entry.media_id);
      if (!media) return null;
      return {
        ...entry,
        url: media.url,
        media_type: media.media_type,
        label: media.label,
        alt: media.alt,
        description: media.description,
      };
    })
    .filter(Boolean) as Array<MediaMapping & MediaLibraryEntry>;
  return resolved;
}
