import { useCallback, useRef } from "react";
import { getBiomeImagePath, getTimeOfDay } from "@/lib/biomeUtils";
import { getWeather } from "@/lib/weather";
import logger from "@/lib/utils/logger";

/**
 * Hook to preload background images before weather data is set in state.
 * Eliminates lag/tearing by loading images during API calls.
 */
export function useBackgroundPreload() {
  const preloadCacheRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Preload background image for a location query.
   * Fetches weather data in parallel with main search to get image early.
   */
  const preloadBackground = useCallback(async (query: string) => {
    // Cancel any existing preload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Fetch weather data to determine image path
      const data = await getWeather(query);

      // Check if aborted
      if (controller.signal.aborted) return;

      // Calculate the exact image path
      const imagePath = getBiomeImagePath(
        data.biome.type,
        getTimeOfDay(data.location.localtime),
        data.biome.coordinates.lat,
        data.biome.coordinates.lon,
      );

      // Skip if already preloaded
      if (preloadCacheRef.current.has(imagePath)) {
        logger.debug("Background already preloaded:", imagePath);
        return;
      }

      // Preload the image
      logger.debug("Preloading background:", imagePath);
      const img = new Image();
      img.src = imagePath;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          preloadCacheRef.current.add(imagePath);
          logger.debug("Background preloaded successfully:", imagePath);
          resolve();
        };
        img.onerror = () => {
          logger.warn("Background preload failed:", imagePath);
          reject(new Error(`Failed to preload ${imagePath}`));
        };

        // Abort handler
        controller.signal.addEventListener("abort", () => {
          reject(new Error("Preload aborted"));
        });
      });
    } catch (error) {
      if (error instanceof Error && error.message !== "Preload aborted") {
        logger.warn("Background preload error:", error);
      }
    }
  }, []);

  /**
   * Clear the preload cache.
   */
  const clearCache = useCallback(() => {
    preloadCacheRef.current.clear();
  }, []);

  return { preloadBackground, clearCache };
}
