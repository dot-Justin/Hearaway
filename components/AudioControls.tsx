"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { blurInFast } from "@/lib/animations";
import { useAudio } from "./AudioProvider";
import { track } from "@/lib/utils/analytics";

/** Inline icons to avoid external deps */
function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7-11-7z" />
    </svg>
  );
}
function PauseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

/**
 * AudioControls
 * Live stream, so the primary control acts as play/pause by toggling mute.
 * Circle CTA appears on hover or focus, swaps icon with blur.
 */
export default function AudioControls() {
  const { isReady, isMuted, volume, setVolume, toggleMute, currentBiome } =
    useAudio();

  // Global keyboard shortcuts
  useEffect(() => {
    if (!isReady || !currentBiome) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          toggleMute();
          track("audio_keyboard_toggle", { action: isMuted ? "play" : "pause" });
          break;
        case "ArrowUp":
          e.preventDefault();
          const newVolumeUp = Math.min(1, volume + 0.05);
          setVolume(newVolumeUp);
          track("audio_keyboard_volume", { volume: Math.round(newVolumeUp * 100) });
          break;
        case "ArrowDown":
          e.preventDefault();
          const newVolumeDown = Math.max(0, volume - 0.05);
          setVolume(newVolumeDown);
          track("audio_keyboard_volume", { volume: Math.round(newVolumeDown * 100) });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isReady, currentBiome, isMuted, volume, toggleMute, setVolume]);

  if (!isReady || !currentBiome) return null;

  const volumePct = Math.round(volume * 100);

  const label = isMuted ? "Play" : "Pause";

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
      <div className="relative min-w-[320px] md:min-w-[400px] rounded-full pl-6 pr-3 py-3 bg-surface dark:bg-dark-surface border border-accent-secondary/30 dark:border-dark-accent-secondary/30 shadow-sm">
        <div className="flex items-center">
          <div className="flex-1 mr-6">
            <input
              type="range"
              min="0"
              max="100"
              value={volumePct}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              onPointerUp={(e) => {
                const finalVolume = Math.round(
                  Number((e.target as HTMLInputElement).value)
                );
                track("audio_volume_change", {
                  volume: finalVolume,
                  biome: currentBiome,
                });
              }}
              aria-label="Volume"
              style={{ "--slider-fill": `${volumePct}%` } as React.CSSProperties}
              className={[
                "w-full h-2 rounded-full appearance-none cursor-pointer slider-fill",
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
          </div>

          <motion.button
            type="button"
            onClick={toggleMute}
            aria-label={label}
            title={label}
            className="size-10 grid place-items-center rounded-full bg-accent-secondary dark:bg-dark-accent-secondary hover:bg-accent-primary dark:hover:bg-dark-accent-primary text-text-primary dark:text-dark-text-primary shadow-sm focus-ring"
            variants={blurInFast}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="sync" initial={false}>
              {isMuted ? (
                <motion.span
                  key="play"
                  variants={blurInFast}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute inset-0 grid place-items-center"
                >
                  <PlayIcon className="w-4 h-4" />
                </motion.span>
              ) : (
                <motion.span
                  key="pause"
                  variants={blurInFast}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute inset-0 grid place-items-center"
                >
                  <PauseIcon className="w-4 h-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
