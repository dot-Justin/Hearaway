/**
 * Umami Analytics Integration
 *
 * Provides type-safe event tracking when Umami is configured via environment variables.
 * If NEXT_PUBLIC_UMAMI_URL and NEXT_PUBLIC_UMAMI_WEBSITE_ID are not set,
 * tracking calls fail silently without affecting app functionality.
 */

type EventData = Record<string, string | number | boolean | null | undefined>;

export const track = (event: string, data?: EventData) => {
  if (typeof window !== 'undefined' && window.umami) {
    try {
      window.umami.track(event, data);
    } catch (error) {
      // Fail silently - analytics should never break the app
      console.debug('Analytics tracking failed:', error);
    }
  }
};

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: EventData) => void;
    };
  }
}
