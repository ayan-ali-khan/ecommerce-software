'use client';

import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { checkoutSchema } from '@/lib/validators';
import type { CartItem } from '@/lib/cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/** Form fields = checkoutSchema.customer + the top-level honeypot field. */
const formSchema = checkoutSchema.shape.customer.extend({
  website: checkoutSchema.shape.website,
});
type FormValues = z.infer<typeof formSchema>;

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}

function Field({ id, label, error, required, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

interface CheckoutFormProps {
  items: CartItem[];
  onPlaced: (orderNumber: string) => void;
}

export function CheckoutForm({ items, onPlaced }: CheckoutFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [itemIssues, setItemIssues] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      pincode: '',
      notes: '',
      website: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setItemIssues([]);

    const payload = {
      customer: {
        name: values.name,
        phone: values.phone,
        email: values.email ?? '',
        address: values.address,
        city: values.city,
        pincode: values.pincode,
        notes: values.notes ?? '',
      },
      items: items.map((item) => ({
        productId: item.productId,
        variantLabel: item.variantLabel,
        qty: item.qty,
      })),
      website: values.website ?? '',
    };

    // Final client-side guard — the server re-validates everything anyway.
    const check = checkoutSchema.safeParse(payload);
    if (!check.success) {
      setSubmitError('Please review your details and cart, then try again.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(check.data),
      });
      const json = (await res.json().catch(() => null)) as {
        success: boolean;
        data?: { orderNumber: string };
        error?: { message?: string; details?: unknown };
      } | null;

      if (res.ok && json?.success && json.data) {
        onPlaced(json.data.orderNumber);
        return;
      }

      if (res.status === 409) {
        const details = json?.error?.details as
          { issues?: { item: string; reason: string }[] } | undefined;
        setItemIssues((details?.issues ?? []).map((issue) => `${issue.item} — ${issue.reason}`));
      }
      setSubmitError(json?.error?.message ?? 'Something went wrong. Please try again.');
    } catch {
      setSubmitError('Network error — please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5" aria-busy={submitting}>
      {submitError && (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm"
          role="alert"
        >
          <p>{submitError}</p>
          {itemIssues.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
              {itemIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
          <Link href="/cart" className="mt-2 inline-block text-sm font-medium underline">
            Review your cart
          </Link>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Full name" error={errors.name?.message} required>
          <Input id="name" autoComplete="name" placeholder="Your name" {...register('name')} />
        </Field>
        <Field
          id="phone"
          label="Phone / WhatsApp"
          error={errors.phone?.message}
          required
          hint="We call this number to confirm the order."
        >
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            {...register('phone')}
          />
        </Field>
      </div>

      <Field id="email" label="Email (optional)" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register('email')}
        />
      </Field>

      <Field id="address" label="Delivery address" error={errors.address?.message} required>
        <Textarea
          id="address"
          rows={2}
          autoComplete="street-address"
          placeholder="House / flat, street, landmark"
          {...register('address')}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="city" label="City" error={errors.city?.message} required>
          <Input
            id="city"
            autoComplete="address-level2"
            placeholder="Meerut"
            {...register('city')}
          />
        </Field>
        <Field id="pincode" label="Pincode" error={errors.pincode?.message} required>
          <Input
            id="pincode"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="250002"
            {...register('pincode')}
          />
        </Field>
      </div>

      <Field id="notes" label="Note for the owner (optional)" error={errors.notes?.message}>
        <Textarea
          id="notes"
          rows={2}
          placeholder="Preferred delivery time, questions…"
          {...register('notes')}
        />
      </Field>

      {/* Honeypot — off-screen, unfocusable, ignored by humans, tempting for bots. */}
      <div
        className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
          {...register('website')}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            Placing order…
          </>
        ) : (
          'Place Order'
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        No online payment required — the owner contacts you to confirm payment and delivery before
        anything is shipped.
      </p>
    </form>
  );
}
