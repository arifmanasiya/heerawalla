import { z } from 'zod';

export const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().default(''),
  collection: z.string().optional().default(''),
  category: z.string().optional().default(''),
  metal: z.string().optional().default(''),
  price_usd: z.number().nonnegative(),
  price_inr: z.number().nonnegative(),
  image: z.string().optional().default(''),
  is_active: z.boolean(),
  is_featured: z.boolean().optional().default(false),
  tags: z.string().optional().default('')
});

export type Product = z.infer<typeof productSchema>;

export const siteConfigSchema = z.record(z.string().min(1), z.string().optional().default(''));
export type SiteConfig = Record<string, string>;

export const requiredProductColumns = [
  'id',
  'name',
  'slug',
  'price_usd',
  'price_inr',
  'is_active'
] as const;

export const requiredConfigColumns = ['key', 'value'] as const;
