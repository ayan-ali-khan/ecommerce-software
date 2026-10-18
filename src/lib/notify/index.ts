import type { NewOrderEvent, NotifyChannel } from './types';
import { createEmailChannel } from './email';
import { createTelegramChannel } from './telegram';
import { getPublicSettings } from '@/lib/queries/settings';

export type { NewOrderEvent, NotifyChannel } from './types';

let cached: NotifyChannel[] | null = null;

/** Channels are built once from env; missing config simply means the channel is skipped. */
function channels(): NotifyChannel[] {
  if (cached === null) {
    const all: (NotifyChannel | null)[] = [createEmailChannel(), createTelegramChannel()];
    cached = all.filter((channel): channel is NotifyChannel => channel !== null);
  }
  return cached;
}

/**
 * Fire new-order notifications on every configured channel that the owner has
 * turned ON in Admin → Settings (emailNotifications / telegramNotifications).
 * Settings that cannot be read default to ON, so a DB hiccup never silently
 * swallows order alerts; env-unconfigured channels stay skipped as before.
 * NEVER throws — notification failure must never fail order creation.
 */
export async function notifyNewOrder(event: NewOrderEvent): Promise<void> {
  try {
    const configured = channels();
    if (configured.length === 0) {
      console.log(
        `[notify] Order ${event.orderNumber} received, but no channels configured (set RESEND_* / TELEGRAM_* env vars).`,
      );
      return;
    }

    const settings = await getPublicSettings().catch(() => null);
    const enabledKinds = new Set<NotifyChannel['kind']>();
    if (settings?.emailNotifications ?? true) enabledKinds.add('email');
    if (settings?.telegramNotifications ?? true) enabledKinds.add('telegram');

    const list = configured.filter((channel) => enabledKinds.has(channel.kind));
    configured
      .filter((channel) => !enabledKinds.has(channel.kind))
      .forEach((channel) => {
        console.log(
          `[notify] Order ${event.orderNumber}: skipping ${channel.name} — disabled in Admin → Settings.`,
        );
      });

    if (list.length === 0) {
      console.log(
        `[notify] Order ${event.orderNumber} received, but all configured channels are disabled in Admin → Settings.`,
      );
      return;
    }

    const results = await Promise.allSettled(list.map((channel) => channel.send(event)));
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[notify] ${list[index]?.name ?? 'channel'} failed:`, result.reason);
      }
    });
  } catch (err) {
    console.error('[notify] Unexpected error:', err);
  }
}
