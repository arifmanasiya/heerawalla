import { getMediaLibraryMap, getProductMediaMappings, resolveMediaForSlug } from './mediaCatalog';
import type { Product } from './schema';

export type MediaAsset = { url: string; filename: string; type: 'image' | 'video'; description?: string };
export type MediaCollection = { images: MediaAsset[]; videos: MediaAsset[]; folderPath: string };

export async function getMediaForProduct(product: Product): Promise<MediaCollection> {
  const mediaById = await getMediaLibraryMap();
  const mappings = await getProductMediaMappings();
  if (mediaById.size && mappings.length) {
    const resolved = resolveMediaForSlug(product.slug, mappings, mediaById);
    if (resolved.length) {
      const images = resolved
        .filter((entry) => entry.media_type === 'image')
        .map((entry) => ({
          url: entry.url,
          filename: entry.media_id,
          type: 'image' as const,
          description: entry.description || entry.label || '',
        }));
      const videos = resolved
        .filter((entry) => entry.media_type === 'video')
        .map((entry) => ({
          url: entry.url,
          filename: entry.media_id,
          type: 'video' as const,
        }));
      return {
        images,
        videos,
        folderPath: 'media/library',
      };
    }
  }

  return {
    images: [],
    videos: [],
    folderPath: 'media/library',
  };
}
