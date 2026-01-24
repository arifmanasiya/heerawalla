import { getEnv } from './csvFetch';
import { getInspirationMediaMappings, getMediaLibraryMap, resolveMediaForSlug } from './mediaCatalog';

export type Inspiration = {
  id: string;
  title: string;
  slug: string;
  heroImage: string;
  description: string;
  longDesc: string;
  stoneTypes: string[];
  stoneWeight?: number;
  metalWeight?: number;
  tags: string[];
  categories: string[];
  genders: string[];
  styles: string[];
  motifs: string[];
  metals: string[];
  takeaways: string[];
  translationNotes: string[];
};

export const INSPIRATION_DISCLAIMER =
  'We do not reproduce copyrighted designs. Inspiration references help us understand mood, proportion, and direction. Final designs are original Heerawalla creations.';

const parseList = (value?: unknown) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value)
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseNumber = (value?: unknown): number | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeStoneType = (value: string) =>
  value
    .replace(/diamond\(s\)/gi, 'Diamond')
    .replace(/diamonds?\b/gi, 'Diamond')
    .replace(/\s+/g, ' ')
    .trim();
const parseStoneTypes = (value?: string) =>
  parseList(value).map(normalizeStoneType).filter(Boolean);

export async function loadInspirations(): Promise<Inspiration[]> {
  const apiBase = (getEnv('PUBLIC_CATALOG_API_URL') || '').trim();
  if (!apiBase) {
    throw new Error('PUBLIC_CATALOG_API_URL is required to load inspirations from D1.');
  }
  const joiner = apiBase.includes('?') ? '&' : '?';
  const url = `${apiBase}${joiner}include=inspirations`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Catalog inspiration API failed (${response.status} ${response.statusText}).`);
  }
  const data = (await response.json()) as { inspirations?: Record<string, unknown>[] };
  const records = Array.isArray(data.inspirations) ? data.inspirations : [];
  if (!records.length) return [];

  const mediaById = await getMediaLibraryMap();
  const mappings = await getInspirationMediaMappings();

  return records.map((row) => {
    const slug = String(row.slug || '');
    const resolved = resolveMediaForSlug(slug, mappings, mediaById);
    const images = resolved.filter((entry) => entry.media_type === 'image').map((entry) => entry.url);
    const heroImage = String(row.heroImage || row.hero_image || images[0] || '');
    return {
      id: String(row.id || ''),
      title: String(row.title || row.name || ''),
      slug,
      heroImage,
      description: String(row.description || ''),
      longDesc: String(row.longDesc || row.long_desc || ''),
      stoneTypes: parseStoneTypes(row.stoneTypes ?? row.stone_types),
      stoneWeight: parseNumber(row.stoneWeight ?? row.stone_weight),
      metalWeight: parseNumber(row.metalWeight ?? row.metal_weight),
      tags: parseList(row.tags),
      categories: parseList(row.categories),
      genders: parseList(row.genders ?? row.gender),
      styles: parseList(row.styles),
      motifs: parseList(row.motifs),
      metals: parseList(row.metals),
      takeaways: parseList(row.takeaways),
      translationNotes: parseList(row.translationNotes ?? row.translation_notes)
    };
  });
}

export async function loadInspirationBySlug(slug: string): Promise<Inspiration | undefined> {
  const inspirations = await loadInspirations();
  return inspirations.find((item) => item.slug === slug);
}
