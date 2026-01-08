import { z } from 'zod';

export const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().default(''),
  collection: z.string().optional().default(''),
  category: z.string().optional().default(''),
  design_code: z.string().min(1),
  metal: z.string().optional().default(''),
  cut: z.string().optional().default('Ideal'),
  clarity: z.string().optional().default('VVS1 - VVS2'),
  color: z.string().optional().default('E'),
  carat: z.number().nonnegative().optional().default(1),
  price_usd_natural: z.number().nonnegative(),
  lab_discount_pct: z.number().optional().default(-20),
  metal_14k_discount_pct: z.number().optional().default(-5),
  natural_available: z.boolean().optional().default(true),
  lab_available: z.boolean().optional().default(true),
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
  'price_usd_natural',
  'is_active',
  'category',
  'design_code',
  'cut',
  'clarity',
  'color',
  'carat',
  'lab_discount_pct',
  'metal_14k_discount_pct',
  'natural_available',
  'lab_available'
] as const;

export const requiredConfigColumns = ['key', 'value'] as const;
