// Marks law tracker entries past their freshness window as stale, using today's date (state S15).
// Pages are built with the build day's answer; this keeps it right between builds. First-party only.
(() => {
  const DAY = 864e5;
  function mark(root = document) {
    for (const el of root.querySelectorAll('.bansat-fresh[data-checked][data-window]')) {
      const checked = el.getAttribute('data-checked');
      const windowDays = Number(el.getAttribute('data-window'));
      const days = Math.floor((Date.now() - Date.parse(`${checked}T00:00:00Z`)) / DAY);
      const label = el.textContent.split(' · ')[0];
      const stale = days > windowDays;
      el.classList.toggle('is-stale', stale);
      const note = el.hasAttribute('data-short') ? 'Stale' : `Stale: last checked ${days} days ago`;
      el.textContent = stale ? `${label} · ${note}` : label;
    }
  }
  window.bansatMarkFresh = mark;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mark());
  else mark();
})();
