/** A new order, flattened for notification channels (no DB types leak out). */
export interface NewOrderEvent {
  orderNumber: string;
  total: number;
  itemCount: number;
  status: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    pincode: string;
    notes?: string;
  };
  items: { name: string; variant: string; qty: number; price: number }[];
  placedAt: string;
  storeName: string;
  orderUrl: string;
}

/** Pluggable notification channel (email, Telegram, …). */
export interface NotifyChannel {
  readonly name: string;
  /** Used to honour the owner's per-channel toggles (Admin → Settings). */
  readonly kind: 'email' | 'telegram';
  send(event: NewOrderEvent): Promise<void>;
}
