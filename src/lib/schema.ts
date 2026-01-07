import { z } from 'zod';

export const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().default(''),
  collection: z.string().optional().default(''),
  category: z.string().optional().default(''),
  metal: z.string().optional().default(''),
  cut: z.string().optional().default('Ideal'),
  clarity: z.string().optional().default('VVS1 - VVS2'),
  color: z.string().optional().default('E'),
  carat: z.number().nonnegative().optional().default(1),
  price_inr_natural: z.number().nonnegative(),
  price_inr_lab: z.number().nonnegative().optional(),
  is_active: z.boolean(),
  is_featured: z.boolean().optional().default(false),
  tags: z.string().optional().default('')
});

export type ProductInput = z.infer<typeof productSchema>;
export type Product = ProductInput & {
  price_usd_natural: number;
  price_usd_lab?: number;
};

export const siteConfigSchema = z.record(z.string().min(1), z.string().optional().default(''));
export type SiteConfig = Record<string, string>;

export const requiredProductColumns = [
  'id',
  'name',
  'slug',
  'price_inr_natural',
  'is_active',
  'category',
  'cut',
  'clarity',
  'color',
  'carat'
] as const;

export const requiredConfigColumns = ['key', 'value'] as const;
