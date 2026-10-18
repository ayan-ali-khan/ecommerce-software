/**
 * Server-side product queries shared by pages (RSC/ISR) and API route handlers.
 */
import type { PipelineStage } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Product, type ProductDoc } from '@/models';
import type { ProductListQuery } from '@/lib/validators';

export interface ProductListResult {
  items: ProductListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** A product plus its computed lowest price (used for cards and price sorting). */
export type ProductListItem = Omit<ProductDoc, '_id'> & {
  _id: unknown;
  minPrice: number;
  maxMrp: number | null;
};

function buildFilter(q: string | undefined, category: string | undefined): Record<string, unknown> {
  const filter: Record<string, unknown> = { isDeleted: false };
  if (category) filter.category = category;
  if (q) filter.$text = { $search: q };
  return filter;
}

export async function listProducts(query: ProductListQuery): Promise<ProductListResult> {
  await connectDB();

  const { q, category, sort, page, limit } = query;
  const filter = buildFilter(q, category);

  const sortStage: PipelineStage.Sort =
    sort === 'price_asc'
      ? { $sort: { minPrice: 1, createdAt: -1 } }
      : sort === 'price_desc'
        ? { $sort: { minPrice: -1, createdAt: -1 } }
        : { $sort: { createdAt: -1 } };

  const base: PipelineStage[] = [
    // $text must be the first stage when present (it is: buildFilter puts it in $match).
    { $match: filter },
    {
      $addFields: {
        minPrice: { $min: '$variants.price' },
        maxMrp: { $max: '$variants.mrp' },
      },
    },
  ];

  const [total, items] = await Promise.all([
    Product.countDocuments(filter),
    Product.aggregate<ProductListItem>([
      ...base,
      sortStage,
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getProductBySlug(slug: string): Promise<ProductListItem | null> {
  await connectDB();
  const [item] = await Product.aggregate<ProductListItem>([
    { $match: { slug, isDeleted: false } },
    { $addFields: { minPrice: { $min: '$variants.price' }, maxMrp: { $max: '$variants.mrp' } } },
    { $limit: 1 },
  ]);
  return item ?? null;
}

export async function getFeaturedProducts(limit = 8): Promise<ProductListItem[]> {
  await connectDB();
  return Product.aggregate<ProductListItem>([
    { $match: { isDeleted: false, featured: true } },
    { $addFields: { minPrice: { $min: '$variants.price' }, maxMrp: { $max: '$variants.mrp' } } },
    { $sort: { createdAt: -1 } },
    { $limit: limit },
  ]);
}

export interface CategoryCount {
  category: string;
  count: number;
}

export async function getCategoryCounts(): Promise<CategoryCount[]> {
  await connectDB();
  return Product.aggregate<CategoryCount>([
    { $match: { isDeleted: false } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $project: { _id: 0, category: '$_id', count: 1 } },
    { $sort: { count: -1 } },
  ]);
}
