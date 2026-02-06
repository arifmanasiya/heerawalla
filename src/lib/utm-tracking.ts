/**
 * Captures UTM parameters and marketing attribution data from URL.
 */
export interface MarketingData {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string;
  landing_page: string;
  timestamp: string;
}

/**
 * Extract UTM parameters from current URL.
 */
export function captureUTMParameters(): MarketingData {
  const params = new URLSearchParams(window.location.search);

  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    utm_term: params.get('utm_term'),
    referrer: document.referrer || 'direct',
    landing_page: window.location.href,
    timestamp: new Date().toISOString()
  };
}

/**
 * Store marketing data in sessionStorage.
 * Persists across page navigations within the session.
 */
export function storeMarketingData(data: MarketingData): void {
  try {
    sessionStorage.setItem('heerawalla_marketing', JSON.stringify(data));
  } catch (e) {
    console.error('Failed to store marketing data:', e);
  }
}

/**
 * Retrieve stored marketing data.
 */
export function getMarketingData(): MarketingData | null {
  try {
    const stored = sessionStorage.getItem('heerawalla_marketing');
    return stored ? (JSON.parse(stored) as MarketingData) : null;
  } catch (e) {
    console.error('Failed to retrieve marketing data:', e);
    return null;
  }
}

/**
 * Initialize UTM tracking on page load.
 * Call this once when the user first lands on the site.
 */
export function initializeUTMTracking(): void {
  const existing = getMarketingData();
  if (!existing) {
    const data = captureUTMParameters();
    storeMarketingData(data);
  }
}
