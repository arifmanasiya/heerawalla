import { parse } from 'csv-parse/sync';
import path from 'node:path';
import { fetchCsv, getCsvSourceMode, getEnv } from './csvFetch';
import { sharedCatalogColumns } from './catalogColumns';

export type InspirationPaletteItem = {
  label: string;
  type: 'metal' | 'stone';
};

export type Inspiration = {
  id: string;
  title: string;
  slug: string;
  heroImage: string;
  shortDesc: string;
  longDesc: string;
  estimatedPriceUsdVvs1Vvs2_18k?: number;
  stoneTypes: string[];
  stoneWeight?: number;
  metalWeight?: number;
  tags: string[];
  categories: string[];
  genders: string[];
  styles: string[];
  motifs: string[];
  metals: string[];
  palette: InspirationPaletteItem[];
  takeaways: string[];
  translationNotes: string[];
};

export const INSPIRATION_DISCLAIMER =
  'We do not reproduce copyrighted designs. Inspiration references help us understand mood, proportion, and direction. Final designs are original Heerawalla creations.';

const DATA_FILE = path.resolve('data/inspirations.csv');

const requiredColumns = sharedCatalogColumns;

const parseList = (value?: string) => {
  if (!value) return [];
  return value
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
};

const parsePalette = (value?: string): InspirationPaletteItem[] => {
  return parseList(value).map((entry) => {
    const [rawType, ...rest] = entry.split(':');
    const type = rawType === 'stone' ? 'stone' : 'metal';
    const label = rest.length ? rest.join(':').trim() : rawType.trim();
    return { type, label };
  });
};

const parseNumber = (value?: string): number | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
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
  const mode = getCsvSourceMode();
  const url = (getEnv('INSPIRATIONS_CSV_URL') || '').trim();
  if (mode === 'remote' && !url) {
    throw new Error('INSPIRATIONS_CSV_URL is required when CSV_SOURCE=remote.');
  }
  const source = mode === 'remote' ? url : DATA_FILE;
  const fallback = DATA_FILE;
  const csv = await fetchCsv(source, fallback);
  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as Record<string, string>[];

  if (!records.length) return [];

  const cols = Object.keys(records[0]);
  for (const col of requiredColumns) {
    if (!cols.includes(col)) {
      throw new Error(`Inspirations CSV missing required column: ${col} in ${DATA_FILE}`);
    }
  }

  return records.map((row) => ({
    id: row.id,
    title: row.name,
    slug: row.slug,
    heroImage: row.hero_image,
    shortDesc: row.short_desc,
    longDesc: row.long_desc,
    estimatedPriceUsdVvs1Vvs2_18k: parseNumber(row.estimated_price_usd_vvs1_vvs2_18k),
    stoneTypes: parseStoneTypes(row.stone_types),
    stoneWeight: parseNumber(row.stone_weight),
    metalWeight: parseNumber(row.metal_weight),
    tags: parseList(row.tags),
    categories: parseList(row.categories),
    genders: parseList(row.gender),
    styles: parseList(row.styles),
    motifs: parseList(row.motifs),
    metals: parseList(row.metals),
    palette: parsePalette(row.palette),
    takeaways: parseList(row.takeaways),
    translationNotes: parseList(row.translation_notes)
  }));
}

export async function loadInspirationBySlug(slug: string): Promise<Inspiration | undefined> {
  const inspirations = await loadInspirations();
  return inspirations.find((item) => item.slug === slug);
}
