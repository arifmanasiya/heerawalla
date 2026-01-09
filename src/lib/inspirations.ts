import { parse } from 'csv-parse/sync';
import path from 'node:path';
import { fetchCsv } from './csvFetch';

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

const requiredColumns = [
  'id',
  'title',
  'slug',
  'hero_image',
  'short_desc',
  'long_desc',
  'tags',
  'categories',
  'gender',
  'styles',
  'motifs',
  'metals',
  'palette',
  'takeaways',
  'translation_notes'
] as const;

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

export async function loadInspirations(): Promise<Inspiration[]> {
  const csv = await fetchCsv(DATA_FILE, DATA_FILE);
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
    title: row.title,
    slug: row.slug,
    heroImage: row.hero_image,
    shortDesc: row.short_desc,
    longDesc: row.long_desc,
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
