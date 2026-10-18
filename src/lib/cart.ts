import { useSyncExternalStore } from 'react';

/** A single cart line. `price` is display-only — the server recomputes totals from DB prices. */
export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  variantLabel: string;
  price: number;
  qty: number;
}

export const MAX_QTY = 50;
export const MAX_ITEMS = 20;

const STORAGE_KEY = 'bodyboost-cart-v1';
const EMPTY: CartItem[] = [];

let state: CartItem[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

export function cartKeyOf(item: { productId: string; variantLabel: string }): string {
  return `${item.productId}::${item.variantLabel}`;
}

function clampQty(qty: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.min(MAX_QTY, Math.max(1, Math.round(qty)));
}

function sanitizeItem(value: unknown): CartItem | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.productId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(v.productId)) return null;
  if (typeof v.slug !== 'string' || !v.slug) return null;
  if (typeof v.name !== 'string' || !v.name) return null;
  if (typeof v.variantLabel !== 'string' || !v.variantLabel) return null;
  if (typeof v.price !== 'number' || !Number.isFinite(v.price) || v.price < 0) return null;
  return {
    productId: v.productId,
    slug: v.slug.slice(0, 200),
    name: v.name.slice(0, 200),
    image: typeof v.image === 'string' ? v.image.slice(0, 300) : '',
    variantLabel: v.variantLabel.slice(0, 80),
    price: v.price,
    qty: clampQty(typeof v.qty === 'number' ? v.qty : 1),
  };
}

function readStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const seen = new Set<string>();
    const items: CartItem[] = [];
    for (const entry of parsed) {
      const item = sanitizeItem(entry);
      if (!item) continue;
      const key = cartKeyOf(item);
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
      if (items.length >= MAX_ITEMS) break;
    }
    return items;
  } catch {
    return EMPTY;
  }
}

function setState(next: CartItem[]): void {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full / private mode — in-memory cart still works */
  }
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  state = readStorage();
  listeners.forEach((listener) => listener());
}

/** Lazy-hydrate on first client subscription (never during SSR). */
function hydrate(): void {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  state = readStorage();
  window.addEventListener('storage', onStorage);
}

function subscribe(listener: () => void): () => void {
  hydrate();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): CartItem[] {
  return state;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

/* ─── Mutations ─────────────────────────────────────────────── */

/** Adds an item. Idempotent: an existing product+variant line is left untouched (URL-driven adds from product pages). */
export function addToCart(item: CartItem): void {
  if (typeof window === 'undefined') return;
  hydrate();
  const key = cartKeyOf(item);
  if (state.some((i) => cartKeyOf(i) === key)) return;
  if (state.length >= MAX_ITEMS) return;
  setState([...state, { ...item, qty: clampQty(item.qty) }]);
}

export function setQty(key: string, qty: number): void {
  if (typeof window === 'undefined') return;
  hydrate();
  const next = clampQty(qty);
  setState(state.map((i) => (cartKeyOf(i) === key ? { ...i, qty: next } : i)));
}

export function removeFromCart(key: string): void {
  if (typeof window === 'undefined') return;
  hydrate();
  setState(state.filter((i) => cartKeyOf(i) !== key));
}

export function clearCart(): void {
  if (typeof window === 'undefined') return;
  hydrate();
  setState(EMPTY);
}

/* ─── React binding ─────────────────────────────────────────── */

export function useCart(): {
  items: CartItem[];
  count: number;
  total: number;
} {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  let count = 0;
  let total = 0;
  for (const item of items) {
    count += item.qty;
    total += item.price * item.qty;
  }
  return { items, count, total };
}
