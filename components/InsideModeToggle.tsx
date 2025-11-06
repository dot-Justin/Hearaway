"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { useAudio } from "./AudioProvider";
import { blurInFast } from "@/lib/animations";

/**
 * InsideModeToggle
 *
 * Controls the inside/outside mode with a low-pass filter effect.
 * - Outside (default): Clear audio
 * - Inside: Muffled audio (600Hz low-pass filter)
 *
 * Shows frequency slider on hover with blur-in animation from left.
 */
export default function InsideModeToggle() {
  const {
    isReady,
    isInsideMode,
    insideFilterFrequency,
    toggleInsideMode,
    setInsideFilterFrequency,
  } = useAudio();

  const [isHovered, setIsHovered] = useState(false);

  if (!isReady) return null;

  return (
    <div className="fixed top-8 left-8 z-50">
      <div
        className="flex items-center gap-3"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Main toggle button */}
        <motion.button
          type="button"
          onClick={toggleInsideMode}
          aria-label={isInsideMode ? "Switch to outside mode" : "Switch to inside mode"}
          title={isInsideMode ? "Outside Mode: Clear Audio" : "Inside Mode: Muffled Audio"}
          className="size-12 grid place-items-center rounded-full bg-accent-secondary dark:bg-dark-accent-secondary hover:bg-accent-primary dark:hover:bg-dark-accent-primary text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-6 h-6 relative">
            {isInsideMode ? (
              <Image
                src="/assets/ui/controls/inside-mode.svg"
                alt="Inside mode"
                fill
                className="w-full h-full invert"
              />
            ) : (
              <Image
                src="/assets/ui/controls/outside-mode.svg"
                alt="Outside mode"
                fill
                className="w-full h-full invert"
              />
            )}
          </div>
        </motion.button>

        {/* Frequency slider - appears on hover */}
        <AnimatePresence mode="sync">
          {isHovered && (
            <motion.div
              className="flex items-center gap-2 bg-surface dark:bg-dark-surface border border-accent-secondary/30 dark:border-dark-accent-secondary/30 rounded-full px-4 py-2 shadow-sm"
              initial={{ opacity: 0, filter: "blur(10px)", x: -20 }}
              animate={{ opacity: 1, filter: "blur(0px)", x: 0 }}
              exit={{ opacity: 0, filter: "blur(10px)", x: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <span className="text-xs text-text-secondary dark:text-dark-text-secondary whitespace-nowrap font-medium">
                Filter
              </span>
              <input
                type="range"
                min="200"
                max="2000"
                value={insideFilterFrequency}
                onChange={(e) => setInsideFilterFrequency(Number(e.target.value))}
                disabled={!isInsideMode}
                aria-label="Filter frequency"
                className={[
                  "w-32 h-2 rounded-full appearance-none cursor-pointer",
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
              <span className="text-xs text-text-secondary dark:text-dark-text-secondary whitespace-nowrap font-medium min-w-[3.5rem] text-right">
                {insideFilterFrequency}Hz
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
