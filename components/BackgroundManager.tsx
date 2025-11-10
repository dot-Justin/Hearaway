"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FilmGrain from "@/components/FilmGrain";
import { backgroundCrossfade } from "@/lib/animations";

interface BackgroundManagerProps {
  backgroundImage: string;
}

/**
 * BackgroundManager handles dynamic background image switching with
 * optimized single-layer fade transitions.
 *
 * Transition effect:
 * - New image loads underneath (z-index: 0, no animation)
 * - Old image on top (z-index: 1) fades out with blur
 * - Duration: 1.3s ease-in (slow start → fast end)
 * - Reduces GPU load by animating only one layer
 *
 * Implementation:
 * - New image always visible at bottom (preloaded, instant)
 * - Old image temporarily rendered on top during transition
 * - Old image exits with blur+fade to reveal new image
 * - Standard practice: single-layer fade for performance
 */
export default function BackgroundManager({ backgroundImage }: BackgroundManagerProps) {
  const [displayedImage, setDisplayedImage] = useState(backgroundImage);
  const [previousImage, setPreviousImage] = useState<string | null>(null);
  const prevBackgroundRef = useRef(backgroundImage);

  // Detect background image change
  useEffect(() => {
    // Only trigger transition if backgroundImage actually changed
    if (backgroundImage !== prevBackgroundRef.current) {
      setPreviousImage(prevBackgroundRef.current);
      setDisplayedImage(backgroundImage);
      prevBackgroundRef.current = backgroundImage;
    }
  }, [backgroundImage]);

  // Trigger exit animation by clearing previousImage after it's set
  useEffect(() => {
    if (previousImage) {
      // Small delay ensures div mounts before we trigger its exit
      const timer = setTimeout(() => setPreviousImage(null), 50);
      return () => clearTimeout(timer);
    }
  }, [previousImage]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 isolate">
      {/* New image layer - always visible underneath, no animation */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${displayedImage})`,
          backgroundAttachment: "fixed",
          zIndex: 0, // Bottom layer
        }}
      />

      {/* Old image layer - fades out on top to reveal new image underneath */}
      <AnimatePresence mode="sync">
        {previousImage && (
          <motion.div
            key={`old-${previousImage}`}
            className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${previousImage})`,
              backgroundAttachment: "fixed",
              zIndex: 1, // On top during transition
            }}
            variants={backgroundCrossfade}
            initial="visible"
            exit="exit"
          />
        )}
      </AnimatePresence>

      {/* Gradient overlay (maintains readability) - sits above background */}
      {/* Light mode gradient */}
      <div
        className="pointer-events-none absolute inset-0 bg-overlay-light dark:hidden"
        suppressHydrationWarning
        style={{ zIndex: 2 }}
      />
      {/* Dark mode gradient */}
      <div
        className="pointer-events-none absolute inset-0 hidden bg-overlay-dark dark:block"
        suppressHydrationWarning
        style={{ zIndex: 2 }}
      />

      {/* Film grain overlay constrained to background layers */}
      <FilmGrain className="pointer-events-none absolute inset-0 z-10 opacity-20 dark:opacity-40" />
    </div>
  );
}
