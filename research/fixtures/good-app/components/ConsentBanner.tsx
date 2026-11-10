'use client';
import { useState } from 'react';
import { readConsent, saveConsent } from '@/lib/privacy/consent';

export function ConsentBanner() {
  const [open, setOpen] = useState(() => readConsent() === null);
  if (!open) return null;
  const choose = (granted: boolean) => {
    saveConsent({ analytics: granted, replay: false, marketing: false });
    setOpen(false);
  };
  return (
    <section role="region" aria-label="Cookie choices">
      <p>We'd like to use Google Analytics to see how the site is used. Nothing loads until you choose.</p>
      <button type="button" onClick={() => choose(true)}>Accept all</button>
      <button type="button" onClick={() => choose(false)}>Reject all</button>
    </section>
  );
}
