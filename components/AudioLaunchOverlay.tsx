"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { useAudio } from "./AudioProvider";
import { blurInFast, blurInSubtle } from "@/lib/animations";

/**
 * AudioLaunchOverlay - onboarding gate for audio playback.
 *
 * Appears after every reload until the user interacts, satisfying autoplay policies.
 */
export default function AudioLaunchOverlay() {
  const { initialize, isReady, isLoading, hasInteracted } = useAudio();
  const [error, setError] = useState<string | null>(null);
  const [isBlurring, setIsBlurring] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ((hasInteracted || isReady) && !isBlurring) {
      setDismissed(true);
    }
  }, [hasInteracted, isReady, isBlurring]);

  const handleStart = async () => {
    setError(null);
    setIsBlurring(true);
    try {
      await initialize();
    } catch (err) {
      console.error("Failed to start audio:", err);
      setError("Failed to start audio. Please try again.");
      setIsBlurring(false);
    }
  };

  // Don't render if user has already interacted
  if (dismissed) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 dark:bg-dark-background/95 px-6"
      variants={{
        resting: {
          opacity: 1,
          filter: "blur(0px)",
          scale: 1,
          transition: { duration: 0.35, ease: "easeOut" },
        },
        blurOut: {
          opacity: 0,
          filter: "blur(22px)",
          scale: 1.05,
          transition: { duration: 0.22, ease: "easeIn" },
        },
      }}
      initial="resting"
      animate={isBlurring ? "blurOut" : "resting"}
      onAnimationComplete={() => {
        if (isBlurring) {
          setDismissed(true);
        }
      }}
    >
      <div className="w-full max-w-xl text-center space-y-8">
        {/* Title */}
        <motion.div
          className="space-y-4"
          variants={blurInSubtle}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <h2 className="text-4xl md:text-5xl font-serif">
            Ready to listen?
          </h2>
          <p className="text-text-secondary dark:text-dark-text-secondary text-lg leading-relaxed">
            Welcome to Hearaway MVP v1.0.2!<br />
            This is an early version, which means it's unfinished, probably
            buggy, and a little rough around the edges. If you spot anything odd
            or have suggestions, reach out on{" "}
            <a
              href="https://x.com/dotjustindev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-primary dark:text-dark-accent-primary"
              style={{ "--link-delay": "0ms" } as CSSProperties}
            >
              Xitter
            </a>{" "}
            or open an issue on{" "}
            <a
              href="https://github.com/dot-Justin/Hearaway"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-primary dark:text-dark-accent-primary"
              style={{ "--link-delay": "250ms" } as CSSProperties}
            >
              GitHub
            </a>
            .
          </p>
        </motion.div>

        {/* Start Button */}
        <motion.button
          onClick={handleStart}
          disabled={isLoading}
          className="px-10 py-4 rounded-3xl
                     bg-accent-secondary dark:bg-dark-accent-secondary
                     hover:bg-accent-primary dark:hover:bg-dark-accent-primary
                     text-text-primary dark:text-dark-text-primary
                     font-medium text-lg
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
          aria-label={isLoading ? "Starting audio..." : "Start soundscape"}
          variants={blurInFast}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          {isLoading ? (
            <span className="flex items-center gap-3 justify-center">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Starting audio...
            </span>
          ) : (
            "Understood"
          )}
        </motion.button>

        {/* Error Message */}
        {error && (
          <div
            className="mt-4 px-6 py-3 bg-warm/10 dark:bg-dark-warm/10
                       border border-warm/30 dark:border-dark-warm/30 rounded-lg"
          >
            <p className="text-warm dark:text-dark-warm text-sm">{error}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
