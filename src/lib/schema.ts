import { z } from 'zod';
import { sharedCatalogColumns } from './catalogColumns';

export const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().default(''),
  collection: z.string().optional().default(''),
  category: z.string().optional().default(''),
  design_code: z.string().min(1),
  metal: z.string().optional().default(''),
  metal_options: z.string().optional().default(''),
  stone_types: z.string().optional().default(''),
  stone_type_options: z.string().optional().default(''),
  stone_weight: z.number().nonnegative().optional(),
  stone_weight_range: z.string().optional().default(''),
  metal_weight: z.number().nonnegative().optional(),
  metal_weight_range: z.string().optional().default(''),
  cut: z.string().optional().default('Ideal'),
  cut_range: z.string().optional().default(''),
  clarity: z.string().optional().default('VVS1 - VVS2'),
  clarity_range: z.string().optional().default(''),
  color: z.string().optional().default('E'),
  color_range: z.string().optional().default(''),
  carat: z.number().nonnegative().optional().default(1),
  price_usd_natural: z.number().nonnegative().optional().default(0),
  lab_discount_pct: z.number().optional().default(-20),
  metal_platinum_premium: z.number().optional().default(10),
  metal_14k_discount_pct: z.number().optional().default(-5),
  is_active: z.boolean(),
  is_featured: z.boolean().optional().default(false),
  tags: z.string().optional().default('')
});

export type ProductInput = z.infer<typeof productSchema>;
export type Product = ProductInput;

export const siteConfigSchema = z.record(z.string().min(1), z.string().optional().default(''));
export type SiteConfig = Record<string, string>;

export const requiredProductColumns = [
  'id',
  'name',
  'slug',
  'design_code',
  'is_active',
] as const;

export const requiredConfigColumns = ['key', 'value'] as const;
