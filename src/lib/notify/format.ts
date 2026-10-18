import type { NewOrderEvent } from './types';

/** Escape user-provided text for inclusion in HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Plain-text order summary shared by all channels. */
export function formatNewOrderText(event: NewOrderEvent): string {
  const lines = [
    `New order ${event.orderNumber}`,
    '',
    `Customer: ${event.customer.name}`,
    `Phone: ${event.customer.phone}`,
    `Address: ${event.customer.address}, ${event.customer.city} - ${event.customer.pincode}`,
    event.customer.email ? `Email: ${event.customer.email}` : null,
    '',
    'Items:',
    ...event.items.map(
      (item) => `- ${item.name} (${item.variant}) x ${item.qty} = ${inr(item.price * item.qty)}`,
    ),
    '',
    `Total: ${inr(event.total)}`,
    event.customer.notes ? `Customer note: ${event.customer.notes}` : null,
    `Placed at: ${new Date(event.placedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`,
    event.orderUrl,
  ];
  return lines.filter((line): line is string => line !== null).join('\n');
}
