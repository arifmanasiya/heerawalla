import { z } from 'zod';
export const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().default(''),
  category: z.string().optional().default(''),
  categories: z.string().optional().default(''),
  gender: z.string().optional().default(''),
  design_code: z.string().min(1),
  metal: z.string().optional().default(''),
  metal_options: z.string().optional().default(''),
  stone_types: z.string().optional().default(''),
  stone_type_options: z.string().optional().default(''),
  stone_weight: z.number().nonnegative().optional(),
  stone_weight_range: z.string().optional().default(''),
  metal_weight: z.number().nonnegative().optional(),
  metal_weight_range: z.string().optional().default(''),
  stone_options: z.array(z.record(z.unknown())).optional(),
  metal_weight_options: z.array(z.record(z.unknown())).optional(),
  cut: z.string().optional().default('Ideal'),
  clarity: z.string().optional().default('VVS1 - VVS2'),
  color: z.string().optional().default('E'),
  carat: z.number().nonnegative().optional().default(1),
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
