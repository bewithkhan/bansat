// First-party consent state and a consent-gated script loader, adapted from the Bansat framework's sample (9.7, MIT).
export type ConsentPurpose = 'analytics' | 'replay' | 'marketing';
export type ConsentState = Record<ConsentPurpose, boolean> & { version: string; decidedAt: string };

const COOKIE_NAME = 'consent_v1';
export const CONSENT_VERSION = '2026-11-01';

export function readConsent(): ConsentState | null {
  const raw = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
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
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(state))}; Max-Age=15724800; Path=/; SameSite=Lax; Secure`;
  window.dispatchEvent(new CustomEvent<ConsentState>('consentchange', { detail: state }));
  void fetch('/api/privacy/consent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state), keepalive: true });
  return state;
}

export function loadWhenConsented(purpose: ConsentPurpose, src: string): void {
  const inject = (state: ConsentState | null) => {
    if (!state?.[purpose] || document.querySelector(`script[src="${src}"]`)) return;
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    document.head.appendChild(s);
  };
  inject(readConsent());
  window.addEventListener('consentchange', (e) => inject((e as CustomEvent<ConsentState>).detail));
}
