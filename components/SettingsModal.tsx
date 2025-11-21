"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { X } from "@phosphor-icons/react";
import { useAudio } from "./AudioProvider";
import { blurInFast } from "@/lib/animations";
import {
  getAnalyticsPreference,
  setAnalyticsPreference,
  track,
} from "@/lib/utils/analytics";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * SettingsModal
 *
 * Central settings modal for all app configuration.
 * Sections: Sound (inside/outside mode), Privacy (analytics), About (version, links, credits)
 */
export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    isInsideMode,
    insideFilterFrequency,
    toggleInsideMode,
    setInsideFilterFrequency,
  } = useAudio();

  const [analyticsEnabled, setAnalyticsEnabledState] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Load analytics preference on mount
  useEffect(() => {
    setAnalyticsEnabledState(getAnalyticsPreference());
  }, []);

  // ESC key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus close button on open
    closeButtonRef.current?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener("keydown", handleTab);
    return () => modal.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  // Handle analytics toggle
  const handleToggleAnalytics = () => {
    const newState = !analyticsEnabled;
    setAnalyticsEnabledState(newState);
    setAnalyticsPreference(newState);

    // Only track when ENABLING (not when disabling)
    if (newState) {
      track("analytics_preference_change", { enabled: true });
    }
  };

  // Handle inside mode toggle
  const handleInsideModeToggle = () => {
    toggleInsideMode();
    track("inside_mode_toggle", { enabled: !isInsideMode });
  };

  // Frequency slider
  const frequencyStops = [
    { position: 0, frequency: 2000 },
    { position: 33.33, frequency: 1500 },
    { position: 66.66, frequency: 1000 },
    { position: 100, frequency: 600 },
  ];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderPosition = Number(e.target.value);
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
    const nearest = frequencyStops.reduce((prev, curr) =>
      Math.abs(curr.position - sliderPosition) <
      Math.abs(prev.position - sliderPosition)
        ? curr
        : prev,
    );
    track("inside_mode_frequency_change", { frequency: nearest.frequency });
  };

  const currentPosition =
    frequencyStops.find((stop) => stop.frequency === insideFilterFrequency)
      ?.position ?? 100;

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const version = process.env.NEXT_PUBLIC_APP_VERSION || "0.4.2";

  return (
    <AnimatePresence mode="sync">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 dark:bg-dark-background/95 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          aria-modal="true"
          role="dialog"
          aria-labelledby="settings-title"
        >
          <motion.div
            ref={modalRef}
            className="w-full max-w-lg bg-surface/95 dark:bg-dark-surface/95 border border-accent-secondary/35 dark:border-dark-accent-secondary/40 rounded-3xl shadow-lg p-8 space-y-8"
            variants={blurInFast}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <h2
                id="settings-title"
                className="text-3xl font-serif text-text-primary dark:text-dark-text-primary"
              >
                Settings
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close settings"
                className="size-10 grid place-items-center rounded-full hover:bg-accent-secondary/20 dark:hover:bg-dark-accent-secondary/20 text-text-primary dark:text-dark-text-primary transition-colors focus-ring"
              >
                <X className="size-6" weight="bold" />
              </button>
            </div>

            {/* Sound Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-serif text-text-primary dark:text-dark-text-primary">
                Sound
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-base font-medium text-text-primary dark:text-dark-text-primary">
                      Inside/Outside Mode
                    </p>
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
                      Simulates hearing from indoors
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isInsideMode}
                    onClick={handleInsideModeToggle}
                    className={[
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-ring",
                      isInsideMode
                        ? "bg-accent-primary dark:bg-dark-accent-primary"
                        : "bg-accent-secondary/40 dark:bg-dark-accent-secondary/40",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        isInsideMode ? "translate-x-6" : "translate-x-1",
                      ].join(" ")}
                    />
                  </button>
                </div>

                {/* Frequency Slider */}
                <div className="space-y-2 pt-2">
                  <label
                    htmlFor="filter-frequency"
                    className="text-sm text-text-secondary dark:text-dark-text-secondary"
                  >
                    Filter frequency
                  </label>
                  <input
                    id="filter-frequency"
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={currentPosition}
                    onChange={handleSliderChange}
                    onPointerUp={handleSliderRelease}
                    disabled={!isInsideMode}
                    aria-label="Filter frequency"
                    style={
                      {
                        "--slider-fill": `${currentPosition}%`,
                      } as React.CSSProperties
                    }
                    className={[
                      "w-full h-2 rounded-full appearance-none cursor-pointer slider-fill",
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
                  <div className="flex justify-between text-xs text-text-secondary/70 dark:text-dark-text-secondary/70">
                    <span>Clear</span>
                    <span>Muffled</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Section */}
            <div className="space-y-4 pt-4 border-t border-accent-secondary/20 dark:border-dark-accent-secondary/20">
              <h3 className="text-xl font-serif text-text-primary dark:text-dark-text-primary">
                Privacy
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
                  We use Umami Analytics, a privacy-focused, GDPR-compliant
                  tool. No personal data or IP addresses are collected.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-text-primary dark:text-dark-text-primary">
                    Enable analytics
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={analyticsEnabled}
                    onClick={handleToggleAnalytics}
                    className={[
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-ring",
                      analyticsEnabled
                        ? "bg-accent-primary dark:bg-dark-accent-primary"
                        : "bg-accent-secondary/40 dark:bg-dark-accent-secondary/40",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        analyticsEnabled ? "translate-x-6" : "translate-x-1",
                      ].join(" ")}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="space-y-4 pt-4 border-t border-accent-secondary/20 dark:border-dark-accent-secondary/20">
              <h3 className="text-xl font-serif text-text-primary dark:text-dark-text-primary">
                About
              </h3>
              <div className="space-y-3 text-sm text-text-secondary dark:text-dark-text-secondary">
                <p>
                  <span className="font-medium text-text-primary dark:text-dark-text-primary">
                    Version:
                  </span>{" "}
                  {version}
                </p>
                <p>
                  <a
                    href="https://github.com/dot-Justin/Hearaway"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-primary dark:text-dark-accent-primary hover:underline focus-ring rounded"
                  >
                    View on GitHub
                  </a>
                </p>
                <div className="pt-2">
                  <p className="font-medium text-text-primary dark:text-dark-text-primary mb-1">
                    Credits
                  </p>
                  <p className="text-xs leading-relaxed">
                    Ambient soundscapes and biome data powered by open datasets
                    and community contributions.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
