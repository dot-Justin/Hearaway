import { useEffect, useRef } from "react";
import { getBiomeImagePath, getTimeOfDay } from "@/lib/biomeUtils";
import type { BiomeType } from "@/lib/biomeDetector";
import logger from "@/lib/utils/logger";

interface UseMediaSessionProps {
  isReady: boolean;
  isMuted: boolean;
  locationName?: string;
  locationCountry?: string;
  biome?: BiomeType;
  localtime?: string;
  lat?: number;
  lon?: number;
  onToggleMute: () => void;
}

/**
 * Hook to integrate with the Media Session API.
 * Displays Hearaway in system media controls (lock screen, notification shade, media keys).
 */
export function useMediaSession({
  isReady,
  isMuted,
  locationName,
  locationCountry,
  biome,
  localtime,
  lat,
  lon,
  onToggleMute,
}: UseMediaSessionProps) {
  const lastMetadataRef = useRef<string>("");

  useEffect(() => {
    // Check if Media Session API is supported
    if (!("mediaSession" in navigator)) {
      logger.debug("Media Session API not supported");
      return;
    }

    if (!isReady) {
      return;
    }

    // Set up action handlers
    navigator.mediaSession.setActionHandler("play", () => {
      logger.debug("Media Session: play action");
      if (isMuted) {
        onToggleMute();
      }
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      logger.debug("Media Session: pause action");
      if (!isMuted) {
        onToggleMute();
      }
    });

    navigator.mediaSession.setActionHandler("stop", () => {
      logger.debug("Media Session: stop action");
      if (!isMuted) {
        onToggleMute();
      }
    });

    // Cleanup on unmount
    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("stop", null);
      }
    };
  }, [isReady, isMuted, onToggleMute]);

  // Update metadata when location, biome, or time changes
  useEffect(() => {
    if (!("mediaSession" in navigator) || !isReady) {
      return;
    }

    // Generate metadata key to detect changes
    const metadataKey = `${locationName}|${locationCountry}|${biome}|${localtime}`;

    // Skip if metadata hasn't changed
    if (metadataKey === lastMetadataRef.current) {
      return;
    }

    lastMetadataRef.current = metadataKey;

    // Build title: "City, Country"
    const title =
      locationName && locationCountry
        ? `${locationName}, ${locationCountry}`
        : "Hearaway";

    // Get artwork path (thumb version)
    let artworkPath = "/assets/backgrounds/thumbs/ocean/ocean-day-1.jpg"; // Default fallback

    if (biome && localtime && lat !== undefined && lon !== undefined) {
      const timeOfDay = getTimeOfDay(localtime);
      const fullPath = getBiomeImagePath(biome, timeOfDay, lat, lon);
      // Convert full path to thumb path
      artworkPath = fullPath.replace("/assets/backgrounds/", "/assets/backgrounds/thumbs/");
    }

    // Build full artwork URL (needs to be absolute for media session)
    const artworkUrl = new URL(artworkPath, window.location.origin).href;

    logger.debug("Media Session: updating metadata", {
      title,
      artwork: artworkPath,
    });

    // Update metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: "Hearaway.app",
      artwork: [
        {
          src: artworkUrl,
          sizes: "512x768",
          type: "image/jpeg",
        },
      ],
    });
  }, [isReady, locationName, locationCountry, biome, localtime, lat, lon]);

  // Update playback state when mute state changes
  useEffect(() => {
    if (!("mediaSession" in navigator) || !isReady) {
      return;
    }

    const playbackState = isMuted ? "paused" : "playing";

    logger.debug("Media Session: updating playback state", { playbackState });

    navigator.mediaSession.playbackState = playbackState;
  }, [isReady, isMuted]);

  // Set position state to indicate infinite/live stream
  useEffect(() => {
    if (!("mediaSession" in navigator) || !isReady) {
      return;
    }

    // Set position state to Infinity to indicate infinite/live stream
    // Keep it set regardless of play/pause state to prevent progress bar issues
    try {
      navigator.mediaSession.setPositionState({
        duration: Infinity,
        playbackRate: 1.0,
        position: 0,
      });
      logger.debug("Media Session: set position state to Infinity (live stream)");
    } catch (error) {
      logger.warn("Failed to set position state:", error);
    }
  }, [isReady]);
}
