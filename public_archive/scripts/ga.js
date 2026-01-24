(() => {
  const meta = document.querySelector('meta[name="ga-measurement-id"]');
  if (!meta) return;
  const measurementId = meta.getAttribute('content');
  if (!measurementId) return;

  if (typeof globalThis === 'undefined') {
    window.globalThis = window;
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  if (typeof window.gtag !== 'function') {
    window.gtag = gtag;
  }

  gtag('js', new Date());
  const hostname = window.location.hostname;
  const isDebug = hostname === 'localhost' || hostname === '127.0.0.1';
  const config = isDebug ? { debug_mode: true } : {};
  gtag('config', measurementId, config);

  window.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const el = target.closest('[data-analytics-event]');
    if (!el) return;
    const eventName = el.getAttribute('data-analytics-event');
    if (!eventName) return;
    const labelText = el.textContent;
    const label = el.getAttribute('data-analytics-label') || (labelText ? labelText.trim() : '');
    const location = el.getAttribute('data-analytics-location') || '';
    const href = el instanceof HTMLAnchorElement ? el.href : el.getAttribute('href') || '';
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        event_category: 'cta',
        event_label: label,
        cta_label: label,
        cta_location: location,
        link_url: href
      });
    }
  });
})();
