/**
 * Admin-facing product queries: list (with soft-delete), detail, create,
 * update and soft delete. Mirrors admin-orders.ts conventions.
 */
import { connectDB } from '@/lib/db';
import { Product } from '@/models';
import { slugify } from '@/lib/utils';
import type { AdminProductListQuery } from '@/lib/validators/admin';
import type { ProductInput } from '@/lib/validators/product';

export interface AdminProductListItem {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  image: string | null;
  minPrice: number | null;
  variantCount: number;
  totalStock: number;
  inStock: boolean;
  featured: boolean;
  isDeleted: boolean;
  updatedAt: string;
}

export interface AdminProductListResult {
  items: AdminProductListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  /** Counts across the whole collection (deleted included). */
  activeCount: number;
  deletedCount: number;
}

export interface AdminProductVariant {
  label: string;
  price: number;
  mrp?: number;
  sku?: string;
  stockQty: number;
}

export interface AdminProductNutritionFact {
  label: string;
  value: string;
}

export interface AdminProductDetail {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  description: string;
  images: string[];
  variants: AdminProductVariant[];
  ingredients: string;
  nutritionFacts: AdminProductNutritionFact[];
  inStock: boolean;
  featured: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

type LeanProduct = {
  _id: unknown;
  name: string;
  slug: string;
  brand: string;
  category: string;
  description: string;
  images?: string[] | null;
  variants?:
    | {
        label: string;
        price: number;
        mrp?: number | null;
        sku?: string | null;
        stockQty?: number | null;
      }[]
    | null;
  ingredients?: string | null;
  nutritionFacts?: { label: string; value: string }[] | null;
  inStock?: boolean;
  featured?: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

function iso(value: Date | string | undefined, fallback = new Date()): string {
  return value ? new Date(value).toISOString() : fallback.toISOString();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toListItem(product: LeanProduct): AdminProductListItem {
  const variants = product.variants ?? [];
  const prices = variants.map((v) => v.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  return {
    id: String(product._id),
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    category: product.category,
    image: product.images?.[0] ?? null,
    minPrice,
    variantCount: variants.length,
    totalStock: variants.reduce((sum, v) => sum + (v.stockQty ?? 0), 0),
    inStock: product.inStock ?? true,
    featured: product.featured ?? false,
    isDeleted: product.isDeleted ?? false,
    updatedAt: iso(product.updatedAt, product.createdAt ?? new Date()),
  };
}

function toDetail(product: LeanProduct): AdminProductDetail {
  return {
    id: String(product._id),
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    category: product.category,
    description: product.description,
    images: product.images ?? [],
    variants: (product.variants ?? []).map((v) => ({
      label: v.label,
      price: v.price,
      ...(v.mrp != null ? { mrp: v.mrp } : {}),
      ...(v.sku ? { sku: v.sku } : {}),
      stockQty: v.stockQty ?? 0,
    })),
    ingredients: product.ingredients ?? '',
    nutritionFacts: product.nutritionFacts ?? [],
    inStock: product.inStock ?? true,
    featured: product.featured ?? false,
    isDeleted: product.isDeleted ?? false,
    createdAt: iso(product.createdAt),
    updatedAt: iso(product.updatedAt, product.createdAt ?? new Date()),
  };
}

export async function listAdminProducts({
  q,
  category,
  includeDeleted,
  page,
  limit,
}: AdminProductListQuery): Promise<AdminProductListResult> {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (includeDeleted !== 'true') filter.isDeleted = false;
  if (category) filter.category = category;
  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: regex }, { brand: regex }, { slug: regex }];
  }

  const [total, docs, activeCount, deletedCount] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments({ isDeleted: false }),
    Product.countDocuments({ isDeleted: true }),
  ]);

  return {
    items: (docs as unknown as LeanProduct[]).map(toListItem),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    activeCount,
    deletedCount,
  };
}

export async function getAdminProduct(id: string): Promise<AdminProductDetail | null> {
  await connectDB();
  const product = await Product.findById(id).lean();
  if (!product) return null;
  return toDetail(product as unknown as LeanProduct);
}

/** Derives a unique slug from the product name (suffix -2, -3, … on collision). */
async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || 'product';
  let candidate = base;
  for (let n = 2; n <= 50; n += 1) {
    const clash = await Product.exists({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (!clash) return candidate;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

function isDuplicateKey(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 11000
  );
}

export async function createAdminProduct(input: ProductInput): Promise<AdminProductDetail> {
  await connectDB();
  try {
    const product = await Product.create({
      ...input,
      slug: await uniqueSlug(input.name),
      isDeleted: false,
    });
    return toDetail(product.toObject() as unknown as LeanProduct);
  } catch (err) {
    if (isDuplicateKey(err)) {
      // Rare race: two creates with the same name — retry once with a fresh suffix.
      const product = await Product.create({
        ...input,
        slug: await uniqueSlug(`${input.name} ${Date.now()}`),
        isDeleted: false,
      });
      return toDetail(product.toObject() as unknown as LeanProduct);
    }
    throw err;
  }
}

/** Full update from the product form. Slug stays stable so shared links never break. */
export async function updateAdminProduct(
  id: string,
  input: ProductInput,
): Promise<AdminProductDetail | null> {
  await connectDB();
  const product = await Product.findByIdAndUpdate(id, { $set: input }, { new: true }).lean();
  if (!product) return null;
  return toDetail(product as unknown as LeanProduct);
}

/** Soft delete (or restore when isDeleted=false) — the product row is never removed. */
export async function setProductDeleted(
  id: string,
  isDeleted: boolean,
): Promise<AdminProductDetail | null> {
  await connectDB();
  const product = await Product.findByIdAndUpdate(
    id,
    { $set: { isDeleted } },
    { new: true },
  ).lean();
  if (!product) return null;
  return toDetail(product as unknown as LeanProduct);
}
