"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAudio } from "./AudioProvider";
import { FloatingCallout } from "./FloatingCallout";
import { blurIn, blurInFast } from "@/lib/animations";
import { track } from "@/lib/utils/analytics";

/**
 * InsideModeToggle
 *
 * Controls the inside/outside mode with a low-pass filter effect.
 * - Outside (default): Clear audio
 * - Inside: Muffled audio (600Hz low-pass filter)
 *
 * Shows frequency slider on hover with blur-in animation from left.
 */
const CALLOUT_COOKIE_KEY = "hearaway_inside_mode_callout_dismissed";

export default function InsideModeToggle() {
  const {
    isReady,
    isInsideMode,
    insideFilterFrequency,
    toggleInsideMode,
    setInsideFilterFrequency,
    hasInteracted,
  } = useAudio();

  const [isHovered, setIsHovered] = useState(false);
  const [showCallout, setShowCallout] = useState(false);
  const [hasDismissedCallout, setHasDismissedCallout] = useState(false);
  const calloutTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if callout was dismissed before
    const isDismissed =
      document.cookie
        .split("; ")
        .find((row) => row.startsWith(CALLOUT_COOKIE_KEY))
        ?.split("=")[1] === "true";

    if (isDismissed) {
      setHasDismissedCallout(true);
      setShowCallout(false);
    }
  }, []);

  useEffect(() => {
    if (!isReady || !hasInteracted || hasDismissedCallout) {
      setShowCallout(false);
      if (calloutTimerRef.current !== null) {
        window.clearTimeout(calloutTimerRef.current);
        calloutTimerRef.current = null;
      }
      return;
    }

    if (calloutTimerRef.current !== null) {
      window.clearTimeout(calloutTimerRef.current);
    }

    calloutTimerRef.current = window.setTimeout(() => {
      setShowCallout(true);
      calloutTimerRef.current = null;
    }, 5000);

    return () => {
      if (calloutTimerRef.current !== null) {
        window.clearTimeout(calloutTimerRef.current);
        calloutTimerRef.current = null;
      }
    };
  }, [isReady, hasInteracted, hasDismissedCallout]);

  useEffect(() => {
    return () => {
      if (calloutTimerRef.current !== null) {
        window.clearTimeout(calloutTimerRef.current);
        calloutTimerRef.current = null;
      }
    };
  }, []);

  const handleDismissCallout = () => {
    track("inside_mode_callout_dismiss", {});
    setShowCallout(false);
    setHasDismissedCallout(true);
    // Set cookie to expire in 1 year
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    document.cookie = `${CALLOUT_COOKIE_KEY}=true; path=/; expires=${expiryDate.toUTCString()}`;

    if (calloutTimerRef.current !== null) {
      window.clearTimeout(calloutTimerRef.current);
      calloutTimerRef.current = null;
    }
  };

  // Decoupled visual positions (evenly spaced) from frequency values
  const frequencyStops = [
    { position: 0, frequency: 2000 },
    { position: 33.33, frequency: 1500 },
    { position: 66.66, frequency: 1000 },
    { position: 100, frequency: 600 },
  ];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderPosition = Number(e.target.value);
    // Find nearest position
    const nearest = frequencyStops.reduce((prev, curr) =>
      Math.abs(curr.position - sliderPosition) <
      Math.abs(prev.position - sliderPosition)
        ? curr
        : prev,
    );
    setInsideFilterFrequency(nearest.frequency);
  };

  const handleSliderRelease = (e: React.PointerEvent<HTMLInputElement>) => {
    const sliderPosition = Number((e.target as HTMLInputElement).value);
    // Find nearest position
    const nearest = frequencyStops.reduce((prev, curr) =>
      Math.abs(curr.position - sliderPosition) <
      Math.abs(prev.position - sliderPosition)
        ? curr
        : prev,
    );
    track("inside_mode_frequency_change", { frequency: nearest.frequency });
  };

  // Get current slider position from frequency
  const currentPosition =
    frequencyStops.find((stop) => stop.frequency === insideFilterFrequency)
      ?.position ?? 100;

  if (!isReady) return null;

  return (
    <motion.div
      className="fixed top-8 left-8 z-50"
      variants={blurIn}
      initial="hidden"
      animate={hasInteracted ? "visible" : "hidden"}
    >
      <FloatingCallout
        open={showCallout}
        onOpenChange={setShowCallout}
        reference={
          <div
            className="flex items-center gap-3"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Main toggle button */}
            <motion.button
              type="button"
              onClick={toggleInsideMode}
              aria-label={
                isInsideMode
                  ? "Switch to outside mode"
                  : "Switch to inside mode"
              }
              title={
                isInsideMode
                  ? "Outside Mode: Clear Audio"
                  : "Inside Mode: Muffled Audio"
              }
              className="size-12 grid place-items-center rounded-full bg-accent-secondary dark:bg-dark-accent-secondary hover:bg-accent-primary dark:hover:bg-dark-accent-primary text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative size-6">
                <AnimatePresence mode="sync" initial={false}>
                  {isInsideMode ? (
                    <motion.span
                      key="inside-icon"
                      className="absolute inset-0 grid place-items-center"
                      variants={blurInFast}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <Image
                        src="/assets/ui/controls/inside-mode-centered.svg"
                        alt="Inside mode"
                        fill
                        className="object-contain invert"
                        sizes="24px"
                        priority={false}
                      />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="outside-icon"
                      className="absolute inset-0 grid place-items-center"
                      variants={blurInFast}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <Image
                        src="/assets/ui/controls/outside-mode.svg"
                        alt="Outside mode"
                        fill
                        className="object-contain invert"
                        sizes="24px"
                        priority={false}
                      />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>

            {/* Frequency slider - appears on hover */}
            <AnimatePresence mode="sync">
              {isHovered && (
                <motion.div
                  className="bg-surface dark:bg-dark-surface border border-accent-secondary/30 dark:border-dark-accent-secondary/30 rounded-full px-3 py-2 shadow-sm"
                  initial={{ opacity: 0, filter: "blur(10px)", x: -20 }}
                  animate={{ opacity: 1, filter: "blur(0px)", x: 0 }}
                  exit={{ opacity: 0, filter: "blur(10px)", x: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={currentPosition}
                    onChange={handleSliderChange}
                    onPointerUp={handleSliderRelease}
                    disabled={!isInsideMode}
                    aria-label="Filter frequency"
                    className={[
                      "w-40 h-2 rounded-full appearance-none cursor-pointer",
                      "bg-accent-secondary/20 dark:bg-dark-accent-secondary/20",
                      isInsideMode
                        ? "opacity-100"
                        : "opacity-50 cursor-not-allowed",
                      // WebKit thumb
                      "[&::-webkit-slider-thumb]:appearance-none",
                      "[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4",
                      "[&::-webkit-slider-thumb]:rounded-full",
                      "[&::-webkit-slider-thumb]:bg-accent-primary",
                      "dark:[&::-webkit-slider-thumb]:bg-dark-accent-primary",
                      "[&::-webkit-slider-thumb]:cursor-pointer",
                      "[&::-webkit-slider-thumb]:transition-transform",
                      "[&::-webkit-slider-thumb]:hover:scale-110",
                      // Firefox thumb
                      "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4",
                      "[&::-moz-range-thumb]:rounded-full",
                      "[&::-moz-range-thumb]:bg-accent-primary",
                      "dark:[&::-moz-range-thumb]:bg-dark-accent-primary",
                      "[&::-moz-range-thumb]:border-0",
                      "[&::-moz-range-thumb]:cursor-pointer",
                      "[&::-moz-range-thumb]:transition-transform",
                      "[&::-moz-range-thumb]:hover:scale-110",
                    ].join(" ")}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        }
        placement="bottom-start"
        offset={12}
      >
        <div className="space-y-3 leading-relaxed">
          <p className="text-base font-semibold tracking-tight text-text-primary dark:text-dark-text-primary">
            Inside/Outside
          </p>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
            Switch between crisp outdoor sound and the softer, filtered quality
            of being indoors. Move the slider to control how muffled it gets.
          </p>
          <button
            onClick={handleDismissCallout}
            className="text-sm font-semibold text-accent-primary dark:text-dark-accent-primary hover:underline transition-colors"
          >
            Got it, dismiss
          </button>
        </div>
      </FloatingCallout>
    </motion.div>
  );
}
