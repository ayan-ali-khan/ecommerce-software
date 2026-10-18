'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  PRODUCT_CATEGORIES,
  productInputSchema,
  productImageSchema,
  type ProductCategory,
} from '@/lib/validators';
import type { AdminProductDetail } from '@/lib/queries/admin-products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type FormValues = z.input<typeof productInputSchema>;
type FormOutput = z.output<typeof productInputSchema>;

const MAX_IMAGES = 8;

interface UploadResponse {
  success: boolean;
  data?: { url: string; publicId: string; width: number; height: number };
  error?: { code?: string; message?: string };
}

function categoryOrFallback(value: string): ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value)
    ? (value as ProductCategory)
    : PRODUCT_CATEGORIES[0];
}

function emptyVariant(): FormValues['variants'][number] {
  return { label: '' } as FormValues['variants'][number];
}

/** Blank number inputs must become undefined (not NaN) so optional fields stay valid. */
function numOrUndefined(value: unknown): number | undefined {
  return value === '' || value === null || value === undefined ? undefined : Number(value);
}

/** Maps API 400 zod issues to a short human-readable list. */
function formatApiError(
  payload:
    UploadResponse | { error?: { code?: string; message?: string; details?: unknown } } | null,
): string {
  const message = payload?.error?.message;
  if (!message) return 'Something went wrong. Please try again.';
  const details = (payload as { error?: { details?: unknown } })?.error?.details;
  if (Array.isArray(details) && details.length > 0) {
    const lines = details
      .slice(0, 3)
      .map((issue) =>
        issue && typeof issue === 'object' && 'message' in issue
          ? String((issue as { message: unknown }).message)
          : '',
      )
      .filter(Boolean);
    if (lines.length > 0) return `${message} — ${lines.join('; ')}`;
  }
  return message;
}

export function ProductForm({ product }: { product?: AdminProductDetail }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Synchronous guard: state updates are async, so a rapid second submit could slip through. */
  const submittingRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(productInputSchema),
    defaultValues: product
      ? {
          name: product.name,
          brand: product.brand,
          category: categoryOrFallback(product.category),
          description: product.description,
          images: product.images,
          variants: product.variants,
          ingredients: product.ingredients,
          nutritionFacts: product.nutritionFacts,
          inStock: product.inStock,
          featured: product.featured,
        }
      : {
          name: '',
          brand: '',
          category: PRODUCT_CATEGORIES[0],
          description: '',
          images: [],
          variants: [{ label: '' }],
          ingredients: '',
          nutritionFacts: [],
          inStock: true,
          featured: false,
        },
  });

  const variantArray = useFieldArray({ control, name: 'variants' });
  const factArray = useFieldArray({ control, name: 'nutritionFacts' });
  const images = watch('images') ?? [];

  function setImages(next: string[]) {
    setValue('images', next.slice(0, MAX_IMAGES), { shouldDirty: true, shouldValidate: true });
  }

  function moveImage(index: number, delta: number) {
    const next = [...images];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    if (item !== undefined) next.splice(target, 0, item);
    setImages(next);
  }

  function addUrl() {
    const value = urlDraft.trim();
    if (!value) return;
    const parsed = productImageSchema.safeParse(value);
    if (!parsed.success) {
      setUrlError('Enter an absolute URL or a root-relative path like /products/image.png');
      return;
    }
    if (images.length >= MAX_IMAGES) {
      setUrlError(`Maximum ${MAX_IMAGES} images per product.`);
      return;
    }
    if (images.includes(parsed.data)) {
      setUrlError('That image is already added.');
      return;
    }
    setUrlError(null);
    setUrlDraft('');
    setImages([...images, parsed.data]);
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (images.length + files.length > MAX_IMAGES) {
      setUploadError(`Maximum ${MAX_IMAGES} images per product.`);
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      for (const [index, file] of files.entries()) {
        const form = new FormData();
        form.set('file', file);
        const res = await fetch('/api/admin/uploads', { method: 'POST', body: form });
        const json = (await res.json().catch(() => null)) as UploadResponse | null;

        if (!res.ok || !json?.success || !json.data) {
          const message =
            json?.error?.code === 'UPLOAD_NOT_CONFIGURED'
              ? 'Image uploads are not configured yet — set CLOUDINARY_* in .env.local and restart, or paste image URLs below.'
              : formatApiError(json);
          setUploadError(message);
          return;
        }

        // Re-read via setValue-free path: append sequentially preserving order.
        setImages([...(watch('images') ?? []), json.data.url]);
        if (index < files.length - 1) {
          // Small yield so successive setImages calls observe previous state.
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
    } catch {
      setUploadError('Upload failed — check your connection and try again.');
    } finally {
      setUploading(false);
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch(
        product ? `/api/admin/products/${product.id}` : '/api/admin/products',
        {
          method: product ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        },
      );
      const json = (await res.json().catch(() => null)) as {
        success: boolean;
        error?: { code?: string; message?: string; details?: unknown };
      } | null;

      if (res.ok && json?.success) {
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        router.push('/admin/products');
        router.refresh();
        return;
      }
      if (json?.error?.code === 'UNAUTHORIZED') {
        setFormError('Session expired — please sign in again.');
      } else {
        setFormError(formatApiError(json));
      }
    } catch {
      setFormError('Network error — please try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  });

  function fieldError(message?: string) {
    return message ? (
      <p className="text-xs text-destructive" role="alert">
        {message}
      </p>
    ) : null;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{product ? 'Edit product' : 'New product'}</h1>
          {product && (
            <p className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>
                slug: <code className="text-xs">{product.slug}</code>
              </span>
              {!product.isDeleted && (
                <Link
                  href={`/products/${product.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  View in store <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </Link>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/products')}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || uploading}>
            {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
            {product ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </div>

      {formError && (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm"
          role="alert"
        >
          {formError}
        </div>
      )}

      {/* ─── Basics ─────────────────────────────────────────────── */}
      <section className="space-y-4 rounded-lg border bg-card p-5">
        <h2 className="font-semibold">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" placeholder="Whey Protein Isolate 100%" {...register('name')} />
            {fieldError(errors.name?.message)}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand">Brand *</Label>
            <Input id="brand" placeholder="IronFuel" {...register('brand')} />
            {fieldError(errors.brand?.message)}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category">Category *</Label>
          <select
            id="category"
            {...register('category')}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {PRODUCT_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          {fieldError(errors.category?.message)}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            rows={5}
            placeholder="What it is, who it's for, how to use it…"
            {...register('description')}
          />
          {fieldError(errors.description?.message)}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ingredients">Ingredients (optional)</Label>
          <Textarea
            id="ingredients"
            rows={3}
            placeholder="Comma-separated ingredients…"
            {...register('ingredients')}
          />
          {fieldError(errors.ingredients?.message)}
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input accent-primary"
              {...register('inStock')}
            />
            Visible on store
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input accent-primary"
              {...register('featured')}
            />
            Featured on home page
          </label>
        </div>
      </section>

      {/* ─── Images ─────────────────────────────────────────────── */}
      <section className="space-y-4 rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Images</h2>
          <span className="text-xs text-muted-foreground">
            {images.length}/{MAX_IMAGES} · first image is the cover
          </span>
        </div>

        {images.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((src, index) => (
              <li key={`${src}-${index}`} className="group relative space-y-1">
                <div className="relative aspect-square overflow-hidden rounded-md border bg-muted/40">
                  {/* eslint-disable-next-line @next/next/no-img-element -- previews accept any URL incl. /public paths */}
                  <img
                    src={src}
                    alt={`Image ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    aria-label={`Remove image ${index + 1}`}
                    onClick={() => setImages(images.filter((_, i) => i !== index))}
                    className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-muted-foreground opacity-100 shadow-sm transition hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  {index === 0 && (
                    <span className="absolute left-1 top-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      Cover
                    </span>
                  )}
                </div>
                <div className="flex justify-center gap-1">
                  <button
                    type="button"
                    aria-label={`Move image ${index + 1} earlier`}
                    disabled={index === 0}
                    onClick={() => moveImage(index, -1)}
                    className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move image ${index + 1} later`}
                    disabled={index === images.length - 1}
                    onClick={() => moveImage(index, 1)}
                    className="rounded p-1 text-muted-foreground hover:bg-accent disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="sr-only"
            aria-label="Choose image files"
            onChange={(event) => void handleFiles(event.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading || images.length >= MAX_IMAGES}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus aria-hidden="true" />
            )}
            {uploading ? 'Uploading…' : 'Upload images'}
          </Button>
          <span className="text-xs text-muted-foreground">JPEG, PNG, WebP or AVIF · max 5 MB</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={urlDraft}
            onChange={(event) => setUrlDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addUrl();
              }
            }}
            placeholder="…or paste an image URL"
            className="h-9 max-w-sm"
            aria-label="Image URL"
          />
          <Button type="button" variant="outline" size="sm" onClick={addUrl}>
            Add URL
          </Button>
        </div>
        {urlError && (
          <p className="text-xs text-destructive" role="alert">
            {urlError}
          </p>
        )}
        {uploadError && (
          <p className="text-xs text-destructive" role="alert">
            {uploadError}
          </p>
        )}
        {fieldError(errors.images?.message)}
      </section>

      {/* ─── Variants ───────────────────────────────────────────── */}
      <section className="space-y-4 rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Variants *</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={variantArray.fields.length >= 20}
            onClick={() => variantArray.append(emptyVariant())}
          >
            <Plus aria-hidden="true" /> Add variant
          </Button>
        </div>
        {typeof errors.variants?.message === 'string' && (
          <p className="text-xs text-destructive" role="alert">
            {errors.variants.message}
          </p>
        )}
        <div className="space-y-4">
          {variantArray.fields.map((field, index) => (
            <div key={field.id} className="space-y-3 rounded-md border bg-background/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Variant {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove variant ${index + 1}`}
                  disabled={variantArray.fields.length <= 1}
                  onClick={() => variantArray.remove(index)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1.5 lg:col-span-2">
                  <Label htmlFor={`variant-${index}-label`}>Label *</Label>
                  <Input
                    id={`variant-${index}-label`}
                    placeholder="1 lb (45 Servings)"
                    {...register(`variants.${index}.label`)}
                  />
                  {fieldError(errors.variants?.[index]?.label?.message)}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`variant-${index}-price`}>Price (₹) *</Label>
                  <Input
                    id={`variant-${index}-price`}
                    type="number"
                    min={0}
                    step="1"
                    inputMode="numeric"
                    {...register(`variants.${index}.price`, { setValueAs: numOrUndefined })}
                  />
                  {fieldError(errors.variants?.[index]?.price?.message)}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`variant-${index}-mrp`}>MRP (₹)</Label>
                  <Input
                    id={`variant-${index}-mrp`}
                    type="number"
                    min={0}
                    step="1"
                    inputMode="numeric"
                    placeholder="optional"
                    {...register(`variants.${index}.mrp`, { setValueAs: numOrUndefined })}
                  />
                  {fieldError(errors.variants?.[index]?.mrp?.message)}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`variant-${index}-stock`}>Stock *</Label>
                  <Input
                    id={`variant-${index}-stock`}
                    type="number"
                    min={0}
                    step="1"
                    inputMode="numeric"
                    {...register(`variants.${index}.stockQty`, { setValueAs: numOrUndefined })}
                  />
                  {fieldError(errors.variants?.[index]?.stockQty?.message)}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`variant-${index}-sku`}>SKU (optional)</Label>
                <Input
                  id={`variant-${index}-sku`}
                  placeholder="IF-WPI-1LB"
                  {...register(`variants.${index}.sku`)}
                />
                {fieldError(errors.variants?.[index]?.sku?.message)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Nutrition facts ────────────────────────────────────── */}
      <section className="space-y-4 rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Nutrition facts</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={factArray.fields.length >= 40}
            onClick={() => factArray.append({ label: '', value: '' })}
          >
            <Plus aria-hidden="true" /> Add row
          </Button>
        </div>
        {factArray.fields.length === 0 && (
          <p className="text-sm text-muted-foreground">No nutrition rows yet.</p>
        )}
        <div className="space-y-3">
          {factArray.fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`fact-${index}-label`}>Label *</Label>
                  <Input
                    id={`fact-${index}-label`}
                    placeholder="Protein per scoop"
                    {...register(`nutritionFacts.${index}.label`)}
                  />
                  {fieldError(errors.nutritionFacts?.[index]?.label?.message)}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`fact-${index}-value`}>Value *</Label>
                  <Input
                    id={`fact-${index}-value`}
                    placeholder="25 g"
                    {...register(`nutritionFacts.${index}.value`)}
                  />
                  {fieldError(errors.nutritionFacts?.[index]?.value?.message)}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove row ${index + 1}`}
                className="mt-7"
                onClick={() => factArray.remove(index)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-background/95 py-3 backdrop-blur">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/products')}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || uploading}>
          {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          {product ? 'Save changes' : 'Create product'}
        </Button>
      </div>
    </form>
  );
}
