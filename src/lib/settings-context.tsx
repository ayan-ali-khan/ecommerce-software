'use client';

import { createContext, useContext } from 'react';
import { DEFAULT_SETTINGS, type PublicSettings } from '@/lib/store';

/**
 * Owner-editable settings, fetched server-side in the (store) and admin layouts
 * and handed to client components through this context.
 *
 * Values arrive fully-formed with the server HTML (no fetch on the client, no
 * flash of wrong content); without a provider — e.g. components rendered under
 * admin/login — consumers get the env-based DEFAULT_SETTINGS, so behaviour is
 * identical to the old hardcoded constants.
 */
const SettingsContext = createContext<PublicSettings>(DEFAULT_SETTINGS);

export function SettingsProvider({
  settings,
  children,
}: {
  settings: Partial<PublicSettings>;
  children: React.ReactNode;
}) {
  // Merge so a partial/incomplete server payload can never produce undefined fields.
  return (
    <SettingsContext.Provider value={{ ...DEFAULT_SETTINGS, ...settings }}>
      {children}
    </SettingsContext.Provider>
  );
}

/** Owner settings for client components (store name, WhatsApp, phone, address…). */
export function useSettings(): PublicSettings {
  return useContext(SettingsContext);
}
