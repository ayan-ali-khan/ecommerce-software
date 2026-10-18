import type { NewOrderEvent, NotifyChannel } from './types';
import { formatNewOrderText } from './format';

/**
 * Telegram Bot API channel (https://core.telegram.org/bots/api).
 * Enabled only when TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set.
 * Plain text (no parse_mode) so customer input can never break formatting.
 */
export function createTelegramChannel(): NotifyChannel | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return null;

  return {
    name: 'telegram',
    kind: 'telegram',
    async send(event: NewOrderEvent): Promise<void> {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: formatNewOrderText(event),
          disable_web_page_preview: true,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Telegram ${res.status}: ${body.slice(0, 300)}`);
      }
    },
  };
}
