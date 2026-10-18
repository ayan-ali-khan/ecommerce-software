import type { NewOrderEvent, NotifyChannel } from './types';
import { escapeHtml, formatNewOrderText } from './format';

/**
 * Resend (https://resend.com) email channel.
 * Enabled only when RESEND_API_KEY, RESEND_FROM_EMAIL and a recipient are set.
 * Uses plain fetch — no SDK dependency.
 */
export function createEmailChannel(): NotifyChannel | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  // Empty string counts as unset (||, not ??) — .env.local commonly ships ORDER_NOTIFY_EMAIL="".
  const to = process.env.ORDER_NOTIFY_EMAIL?.trim() || process.env.ADMIN_EMAIL;
  if (!apiKey || !from || !to) return null;

  return {
    name: 'email(resend)',
    kind: 'email',
    async send(event: NewOrderEvent): Promise<void> {
      const subject = `New order ${event.orderNumber} — Rs. ${event.total} total`;
      const html = [
        '<div style="font-family:sans-serif;font-size:14px">',
        `<h2 style="margin:0 0 12px">New order ${escapeHtml(event.orderNumber)}</h2>`,
        `<p><b>${escapeHtml(event.customer.name)}</b> · ${escapeHtml(event.customer.phone)}</p>`,
        `<p>${escapeHtml(event.customer.address)}, ${escapeHtml(event.customer.city)} - ${escapeHtml(event.customer.pincode)}</p>`,
        '<ul>',
        ...event.items.map(
          (item) =>
            `<li>${escapeHtml(item.name)} (${escapeHtml(item.variant)}) × ${item.qty} — ₹${item.price * item.qty}</li>`,
        ),
        '</ul>',
        `<p><b>Total: ₹${event.total}</b></p>`,
        event.customer.notes ? `<p>Note: ${escapeHtml(event.customer.notes)}</p>` : '',
        `<p><a href="${escapeHtml(event.orderUrl)}">View order</a></p>`,
        '</div>',
      ].join('');

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
          text: formatNewOrderText(event),
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`);
      }
    },
  };
}
