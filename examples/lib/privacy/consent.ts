// lib/privacy/consent.ts — first-party consent state and a consent-gated script loader (client only)
export type ConsentPurpose = 'analytics' | 'replay' | 'marketing';
export type ConsentState = Record<ConsentPurpose, boolean> & { version: string; decidedAt: string };

const COOKIE_NAME = 'consent_v1'; // strictly necessary: it only remembers the choice itself
export const CONSENT_VERSION = '2026-11-01'; // bump when purposes or vendors change, so people are asked again

export function readConsent(): ConsentState | null {
  const raw = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!raw) return null;
  try {
    const state = JSON.parse(decodeURIComponent(raw)) as ConsentState;
    return state.version === CONSENT_VERSION ? state : null;
  } catch {
    return null;
  }
}

export function saveConsent(choice: Record<ConsentPurpose, boolean>): ConsentState {
  const state: ConsentState = { ...choice, version: CONSENT_VERSION, decidedAt: new Date().toISOString() };
  const sixMonths = 60 * 60 * 24 * 182;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(state))}; Max-Age=${sixMonths}; Path=/; SameSite=Lax; Secure`;
  window.dispatchEvent(new CustomEvent<ConsentState>('consentchange', { detail: state }));
  // Evidence for the append-only consent log (ConsentRecord); keepalive survives navigation.
  void fetch('/api/privacy/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
    keepalive: true,
  });
  return state;
}

/** Injects a third-party script only after its purpose is granted. On withdrawal, clear the vendor's cookies and reload. */
export function loadWhenConsented(purpose: ConsentPurpose, src: string, onLoad?: () => void): void {
  const inject = (state: ConsentState | null) => {
    if (!state?.[purpose] || document.querySelector(`script[src="${src}"]`)) return;
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    if (onLoad) s.addEventListener('load', onLoad);
    document.head.appendChild(s);
  };
  inject(readConsent());
  window.addEventListener('consentchange', (e) => inject((e as CustomEvent<ConsentState>).detail));
}
