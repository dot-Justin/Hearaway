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
                      Inside Mode
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
                <div className="pt-2">
                  <div className="flex items-center gap-3">
                    {/* Outside mode icon (left - clear end) */}
                    <div
                      className={[
                        "size-5 flex-shrink-0 text-text-primary dark:text-dark-text-primary",
                        isInsideMode ? "opacity-100" : "opacity-50",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 340.08 318.43"
                        className="w-full h-full"
                      >
                        <path
                          fill="currentColor"
                          d="M262.76,87.56c-6.94,8.93-10.58,19.58-10.58,31.18,0,4.18.47,8.23,1.4,12.13-2.17,1.78-4.23,3.75-6.14,5.92-9.84,11.17-14.19,25.42-12.29,40.16l14.91,114.73c.98,7.56,3.65,14.55,7.61,20.61-5.51,3.87-12.23,6.14-19.48,6.14H33.97C15.2,318.43,0,303.21,0,284.46V24.84C0,17.68,5.8,11.88,12.97,11.88h24.95c.31,0,.61,0,.91.04,6.74.46,12.07,6.07,12.07,12.92v30.71l10.39-7.81,34.28-25.77,20.16-15.15c12.1-9.11,28.78-9.09,40.88.04l102.05,77.06c1.47,1.11,2.84,2.33,4.1,3.64Z"
                        />
                        <path
                          fill="currentColor"
                          d="M322.62,118.74c0,5.29-1.89,9.81-5.65,13.57s-8.29,5.64-13.57,5.64-9.81-1.88-13.57-5.64c-3.76-3.76-5.65-8.28-5.65-13.57s1.89-9.81,5.65-13.57c3.76-3.76,8.29-5.64,13.57-5.64s9.81,1.88,13.57,5.64c3.76,3.76,5.65,8.29,5.65,13.57Z"
                        />
                        <path
                          fill="currentColor"
                          d="M339.91,172.84l-14.9,114.72c-1.14,8.77-8.61,15.33-17.45,15.33h-8.32c-8.84,0-16.31-6.56-17.45-15.33l-9.63-74.14-5.27-40.58c-.73-5.64.78-10.6,4.54-14.87.24-.27.48-.53.73-.78,3.64-3.75,8.1-5.62,13.38-5.62h35.71c5.65,0,10.35,2.13,14.12,6.4,3.76,4.27,5.27,9.23,4.54,14.87Z"
                        />
                      </svg>
                    </div>

                    {/* Slider */}
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
                        "flex-1 h-2 rounded-full appearance-none cursor-pointer slider-fill",
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

                    {/* Inside mode icon (right - muffled end) */}
                    <div
                      className={[
                        "size-5 flex-shrink-0 text-text-primary dark:text-dark-text-primary",
                        isInsideMode ? "opacity-100" : "opacity-50",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 340.08 318.43"
                        className="w-full h-full"
                      >
                        <path
                          fill="currentColor"
                          d="M258.66,83.92L156.61,6.86c-12.1-9.13-28.78-9.15-40.88-.04l-20.16,15.15-34.28,25.77-10.39,7.81v-30.71c0-6.85-5.33-12.46-12.07-12.92-.3-.03-.6-.04-.91-.04H12.97C5.8,11.88,0,17.68,0,24.84v259.62c0,18.75,15.2,33.97,33.97,33.97h204.22c18.77,0,33.97-15.22,33.97-33.97V111.03c0-10.65-4.99-20.69-13.5-27.11ZM122.51,72.43c3.76-3.76,8.28-5.64,13.57-5.64s9.8,1.88,13.57,5.64c3.76,3.77,5.64,8.29,5.64,13.57s-1.88,9.81-5.64,13.57-8.29,5.65-13.57,5.65-9.81-1.88-13.57-5.65c-3.77-3.76-5.65-8.28-5.65-13.57s1.88-9.8,5.65-13.57ZM172.59,140.11l-14.91,114.71c-1.14,8.77-8.6,15.33-17.44,15.33h-8.32c-8.84,0-16.31-6.56-17.45-15.33l-14.9-114.71c-.74-5.65.78-10.61,4.54-14.88,3.77-4.27,8.47-6.4,14.11-6.4h35.71c5.65,0,10.35,2.13,14.11,6.4,3.77,4.27,5.28,9.23,4.55,14.88Z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Section */}
            <div className="space-y-4 pt-4">
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
            <div className="space-y-4 pt-4">
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
                {/*TODO edit with specifics vvvv*/}
                {/*<div className="pt-2">
                  <p className="font-medium text-text-primary dark:text-dark-text-primary mb-1">
                    Credits
                  </p>
                  <p className="text-xs leading-relaxed">
                    Ambient soundscapes and biome data powered by open datasets
                    and community contributions.
                  </p>
                </div>*/}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
