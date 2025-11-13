"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ShieldCheck } from "@phosphor-icons/react";
import { useAudio } from "./AudioProvider";
import { FloatingCallout } from "./FloatingCallout";
import { blurIn } from "@/lib/animations";
import {
  getAnalyticsPreference,
  setAnalyticsPreference,
  track,
} from "@/lib/utils/analytics";

/**
 * PrivacyControl
 *
 * Provides transparency and control over analytics tracking.
 * Displays privacy information and toggle for Umami analytics (opt-out model).
 */
export default function PrivacyControl() {
  const { hasInteracted } = useAudio();
  const [showCallout, setShowCallout] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabledState] = useState(true);

  // Load analytics preference on mount
  useEffect(() => {
    setAnalyticsEnabledState(getAnalyticsPreference());
  }, []);

  const handleToggleAnalytics = () => {
    const newState = !analyticsEnabled;
    setAnalyticsEnabledState(newState);
    setAnalyticsPreference(newState);

    // Only track when ENABLING (not when disabling)
    if (newState) {
      track("analytics_preference_change", { enabled: true });
    }
  };

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-40"
      variants={blurIn}
      initial="hidden"
      animate={hasInteracted ? "visible" : "hidden"}
    >
      <FloatingCallout
        open={showCallout}
        onOpenChange={setShowCallout}
        reference={
          <motion.button
            type="button"
            onClick={() => setShowCallout(!showCallout)}
            aria-label="Privacy & Analytics"
            title="Privacy & Analytics"
            className="size-9 grid place-items-center rounded-full bg-accent-secondary/80 dark:bg-dark-accent-secondary/80 hover:bg-accent-primary dark:hover:bg-dark-accent-primary text-text-primary dark:text-dark-text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-colors backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ShieldCheck className="size-5" weight="fill" />
          </motion.button>
        }
        placement="top-end"
        offset={12}
      >
        <div className="space-y-4 leading-relaxed max-w-sm">
          <p className="text-base font-semibold tracking-tight text-text-primary dark:text-dark-text-primary">
            Privacy &amp; Analytics
          </p>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
            To prioritize features you care about, we use Umami Analytics, a
            privacy-focused, GDPR-compliant tool, to track interactions across
            the website. No personal data or IP addresses are collected.
          </p>
          <div className="text-xs text-text-secondary/80 dark:text-dark-text-secondary/80">
            <p className="font-medium mb-1">Data collected:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              <li>Location names (cities/regions)</li>
              <li>Interaction events (clicks, toggles, searches)</li>
            </ul>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center justify-between pt-2 border-t border-accent-secondary/20 dark:border-dark-accent-secondary/20">
            <span className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
              Enable analytics
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={analyticsEnabled}
              onClick={handleToggleAnalytics}
              className={[
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:ring-offset-2",
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

          <button
            onClick={() => setShowCallout(false)}
            className="text-sm font-semibold text-accent-primary dark:text-dark-accent-primary hover:underline transition-colors"
          >
            Close
          </button>
        </div>
      </FloatingCallout>
    </motion.div>
  );
}
