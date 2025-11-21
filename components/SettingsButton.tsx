"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { SlidersHorizontal } from "@phosphor-icons/react";
import { useAudio } from "./AudioProvider";
import { blurIn } from "@/lib/animations";
import SettingsModal from "./SettingsModal";

/**
 * SettingsButton
 *
 * Floating button that opens the settings modal.
 * Positioned in bottom-right corner.
 */
export default function SettingsButton() {
  const { hasInteracted } = useAudio();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        variants={blurIn}
        initial="hidden"
        animate={hasInteracted ? "visible" : "hidden"}
      >
        <motion.button
          type="button"
          onClick={() => setIsModalOpen(true)}
          aria-label="Open settings"
          title="Settings"
          className="size-9 grid place-items-center rounded-full bg-accent-secondary/80 dark:bg-dark-accent-secondary/80 hover:bg-accent-primary dark:hover:bg-dark-accent-primary text-text-primary dark:text-dark-text-primary shadow-sm focus-ring transition-colors backdrop-blur-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <SlidersHorizontal className="size-5" weight="fill" />
        </motion.button>
      </motion.div>

      <SettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
