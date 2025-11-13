/**
 * Umami Analytics Integration
 *
 * Provides type-safe event tracking when Umami is configured via environment variables.
 * If NEXT_PUBLIC_UMAMI_URL and NEXT_PUBLIC_UMAMI_WEBSITE_ID are not set,
 * tracking calls fail silently without affecting app functionality.
 */

type EventData = Record<string, string | number | boolean | null | undefined>;

const ANALYTICS_STORAGE_KEY = "hearaway-analytics-enabled";

/**
 * Get user's analytics preference from localStorage
 */
export const getAnalyticsPreference = (): boolean => {
  if (typeof window === "undefined") return true;

  try {
    const stored = window.localStorage.getItem(ANALYTICS_STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true; // Default to enabled if localStorage fails
  }
};

/**
 * Set user's analytics preference in localStorage
 */
export const setAnalyticsPreference = (enabled: boolean): void => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(ANALYTICS_STORAGE_KEY, String(enabled));
  } catch (error) {
    console.debug("Failed to save analytics preference:", error);
  }
};

/**
 * Track an analytics event (respects user preference)
 */
export const track = (event: string, data?: EventData) => {
  // Check user preference first
  if (!getAnalyticsPreference()) return;

  if (typeof window !== "undefined" && window.umami) {
    try {
      window.umami.track(event, data);
    } catch (error) {
      // Fail silently - analytics should never break the app
      console.debug("Analytics tracking failed:", error);
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
