import fs from 'node:fs/promises';
import path from 'node:path';
import { withBase } from './paths';
import type { Product } from './schema';

export type MediaAsset = { url: string; filename: string; type: 'image' | 'video'; description?: string };
export type MediaCollection = { images: MediaAsset[]; videos: MediaAsset[]; folderPath: string };

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg']);
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.m4v']);
const TEXT_EXT = new Set(['.txt']);

function slugify(value: string): string {
  const segments = value.split('/').map((part) => {
    const slug = part.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return slug || 'uncategorized';
  });
  return segments.filter(Boolean).join('/');
}

function getProductFolder(product: Product) {
  const categorySlug = slugify(product.category || 'uncategorized');
  const id = product.id;
  const folder = path.join('public', 'images', 'products', categorySlug, id);
  return { folderFs: path.resolve(folder), folderUrl: `/images/products/${categorySlug}/${id}` };
}

export async function getMediaForProduct(product: Product): Promise<MediaCollection> {
  const { folderFs, folderUrl } = getProductFolder(product);
  const entries: MediaAsset[] = [];
  try {
    const files = await fs.readdir(folderFs);
    const textByBase = new Map<string, string>();

    await Promise.all(
      files
        .filter((file) => TEXT_EXT.has(path.extname(file).toLowerCase()))
        .map(async (file) => {
          try {
            const content = await fs.readFile(path.join(folderFs, file), 'utf8');
            const trimmed = content.trim();
            if (!trimmed) return;
            const base = path.basename(file, path.extname(file)).toLowerCase();
            textByBase.set(base, trimmed);
          } catch {
            // Ignore unreadable caption files.
          }
        })
    );

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const url = withBase(`${folderUrl}/${file}`);
      if (IMAGE_EXT.has(ext)) {
        const base = path.basename(file, ext).toLowerCase();
        const description = textByBase.get(base);
        entries.push({ url, filename: file, type: 'image', description });
      } else if (VIDEO_EXT.has(ext)) {
        entries.push({ url, filename: file, type: 'video' });
      }
    }
  } catch {
    // Folder may not exist; fall back to placeholders.
  }

  let images = entries.filter((e) => e.type === 'image');
  const hasPlaceholder = images.some((img) => img.filename.toLowerCase() === 'image-1.svg');
  if (hasPlaceholder && images.length > 1) {
    images = images.filter((img) => img.filename.toLowerCase() !== 'image-1.svg');
  }
  images = images.sort((a, b) => a.filename.localeCompare(b.filename));
  const videos = entries.filter((e) => e.type === 'video').sort((a, b) => a.filename.localeCompare(b.filename));

  return {
    images,
    videos,
    folderPath: folderUrl
  };
}
