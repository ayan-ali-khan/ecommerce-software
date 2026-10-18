'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { settingsInputSchema, type SettingsInput } from '@/lib/validators/settings';

type SettingsFormValues = Pick<
  SettingsInput,
  | 'storeName'
  | 'whatsappNumber'
  | 'phone'
  | 'shippingNote'
  | 'emailNotifications'
  | 'telegramNotifications'
>;

type FieldErrors = Record<string, { message?: string }>;

function fieldError(errors: FieldErrors | undefined, key: keyof SettingsInput): string | undefined {
  const issue = errors?.[key];
  return issue?.message;
}

export function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [values, setValues] = useState<SettingsFormValues | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json().then((json) => ({ r, json })))
      .then(({ r, json }) => {
        if (!r.ok) {
          throw new Error(json?.error?.message ?? 'Failed to load settings');
        }
        setValues(json.data as unknown as SettingsFormValues);
      })
      .catch((err) => {
        setFormError(err instanceof Error ? err.message : 'Something went wrong.');
      })
      .finally(() => setLoading(false));
  }, []);

  const invalidateSettings = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['admin-settings'] }),
    [queryClient],
  );

  async function handleSave() {
    if (!values) return;
    setSaving(true);
    setFormError(null);
    setFieldErrors({});

    const parsed = settingsInputSchema.partial().safeParse(values);
    if (!parsed.success) {
      const issues: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        if (issue.path.length === 1) {
          issues[String(issue.path[0])] = { message: issue.message };
        }
      }
      setFieldErrors(issues);
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json().catch(() => null)) as {
        success: boolean;
        data?: unknown;
        error?: { message?: string; details?: unknown };
      } | null;

      if (!res.ok || !json?.success) {
        const details = (json?.error as { details?: unknown })?.details;
        if (Array.isArray(details) && details.length > 0) {
          const first = details[0];
          const message =
            first && typeof first === 'object' && 'message' in first
              ? String((first as { message: unknown }).message)
              : '';
          if (message) {
            setFieldErrors({ _form: { message } });
            setSaving(false);
            return;
          }
        }
        throw new Error(json?.error?.message ?? 'Something went wrong.');
      }

      setValues(json.data as unknown as SettingsFormValues);
      invalidateSettings();
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading settings">
        <div className="h-10 w-2/5 animate-pulse rounded-md bg-muted/60" />
        {[1, 2, 3].map((row) => (
          <div key={row} className="h-10 w-full animate-pulse rounded-md border bg-muted/40" />
        ))}
      </div>
    );
  }

  if (!values) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {formError ?? 'Failed to load settings.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Store settings</h1>
          <p className="text-sm text-muted-foreground">
            Owner-editable store name, contact details and notification preferences.
          </p>
        </div>
      </div>

      {formError && (
        <div
          className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm"
          role="alert"
        >
          <span>{formError}</span>
          <Button size="sm" variant="outline" onClick={() => setFormError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="space-y-5 rounded-lg border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="storeName">Store name</Label>
            <Input
              id="storeName"
              value={values.storeName}
              onChange={(e) => setValues((v) => (v ? { ...v, storeName: e.target.value } : v))}
              aria-describedby={
                fieldError(fieldErrors, 'storeName') ? 'storeName-error' : undefined
              }
            />
            {fieldError(fieldErrors, 'storeName') && (
              <p id="storeName-error" className="text-xs text-destructive">
                {fieldError(fieldErrors, 'storeName')}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="whatsappNumber">WhatsApp number</Label>
            <Input
              id="whatsappNumber"
              type="tel"
              inputMode="numeric"
              value={values.whatsappNumber}
              onChange={(e) => setValues((v) => (v ? { ...v, whatsappNumber: e.target.value } : v))}
              aria-describedby={
                fieldError(fieldErrors, 'whatsappNumber') ? 'whatsappNumber-error' : undefined
              }
            />
            {fieldError(fieldErrors, 'whatsappNumber') && (
              <p id="whatsappNumber-error" className="text-xs text-destructive">
                {fieldError(fieldErrors, 'whatsappNumber')}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              value={values.phone}
              onChange={(e) => setValues((v) => (v ? { ...v, phone: e.target.value } : v))}
              aria-describedby={fieldError(fieldErrors, 'phone') ? 'phone-error' : undefined}
            />
            {fieldError(fieldErrors, 'phone') && (
              <p id="phone-error" className="text-xs text-destructive">
                {fieldError(fieldErrors, 'phone')}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shippingNote">Shipping / contact note</Label>
            <Textarea
              id="shippingNote"
              value={values.shippingNote}
              onChange={(e) => setValues((v) => (v ? { ...v, shippingNote: e.target.value } : v))}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This appears in the storefront footer and checkout unless overridden by env.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="emailNotifications" className="!text-base">
            Email notifications
          </Label>
          <Switch
            id="emailNotifications"
            type="checkbox"
            role="switch"
            checked={values.emailNotifications}
            onChange={(e) =>
              setValues((v) => (v ? { ...v, emailNotifications: e.target.checked } : v))
            }
          >
            Send new-order confirmation emails (via Resend, when configured)
          </Switch>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="telegramNotifications" className="!text-base">
            Telegram notifications
          </Label>
          <Switch
            id="telegramNotifications"
            type="checkbox"
            role="switch"
            checked={values.telegramNotifications}
            onChange={(e) =>
              setValues((v) => (v ? { ...v, telegramNotifications: e.target.checked } : v))
            }
          >
            Send new-order notifications to Telegram (when configured)
          </Switch>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setValues({
              storeName: '',
              whatsappNumber: '',
              phone: '',
              shippingNote: '',
              emailNotifications: true,
              telegramNotifications: true,
            });
            setFieldErrors({});
          }}
        >
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          aria-busy={saving}
          aria-label="Save settings"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
