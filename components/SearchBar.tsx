"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { blurInFast, blurInOutQuick } from "@/lib/animations";
import { ArrowRight, Shuffle, X } from "lucide-react";
import { MapPin, Warning } from "@phosphor-icons/react";
import { getRandomLocation } from "@/lib/randomLocations";

const inputVariants = {
  resting: {
    filter: "blur(0px)",
    transition: { duration: 0.18 },
  },
  randomizing: {
    filter: "blur(6px)",
    transition: { duration: 0.12 },
  },
} as const;

interface SearchBarProps {
  onSearch: (query: string) => Promise<void>;
  onRandom?: (location: string) => void;
  isLoading?: boolean;
  hasResults?: boolean;
}

export default function SearchBar({
  onSearch,
  onRandom,
  isLoading = false,
  hasResults = false,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const randomTimeoutsRef = useRef<number[]>([]);

  const trimmedQuery = query.trim();
  const hasText = trimmedQuery.length > 0 && !isRandomizing;
  const showClearButton = hasResults && !isDirty && trimmedQuery.length > 0;
  const isBusy = isLoading || isRandomizing;
  const isGettingLocation = locationStatus === "loading";
  const iconType =
    isLoading || isGettingLocation
      ? "spinner"
      : showClearButton
        ? "clear"
        : hasText
          ? "go"
          : "random";

  const validateInput = (value: string): boolean => {
    const zipRegex = /^\d{5}$/;
    // A more permissive regex for city names to support international locations
    const cityRegex = /^[a-zA-Z0-9\s,.'-]{2,}$/;
    if (zipRegex.test(value) || cityRegex.test(value)) {
      setError("");
      return true;
    }
    setError("Please enter a valid location.");
    return false;
  };

  const submitGo = () => {
    if (isRandomizing) return;
    const q = trimmedQuery;
    if (!q) return; // guard
    if (validateInput(q)) {
      onSearch(q);
      setIsDirty(false);
    }
  };

  const submitRandom = () => {
    if (isBusy) return;

    const iterations = 8;
    const sequence: string[] = [];
    let previous = trimmedQuery;

    for (let i = 0; i < iterations; i++) {
      const next = getRandomLocation(previous);
      sequence.push(next);
      previous = next;
    }

    if (sequence.length === 0) return;

    setIsRandomizing(true);
    setIsDirty(false);
    setError("");
    inputRef.current?.focus();

    const clearExisting = () => {
      randomTimeoutsRef.current.forEach((id) => clearTimeout(id));
      randomTimeoutsRef.current = [];
    };

    clearExisting();

    sequence.forEach((location, index) => {
      const delay = 120 * index;
      const timeoutId = window.setTimeout(() => {
        setQuery(location);
        setIsDirty(false);

        if (index === sequence.length - 1) {
          onRandom?.(location);
          onSearch(location);
          setIsRandomizing(false);
          clearExisting();
        }
      }, delay);

      randomTimeoutsRef.current.push(timeoutId);
    });
  };

  const handleClear = () => {
    setQuery("");
    setError("");
    setIsDirty(false);
    inputRef.current?.focus();
  };

  const handleUseLocation = async () => {
    if (isGettingLocation) return;

    setLocationStatus("loading");
    setError("");

    try {
      console.log("→ Finding location...");
      const response = await fetch("https://ipwho.is/");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "IP geolocation failed");
      }

      console.log("IP geolocation data:", data);

      if (data.city) {
        const fullLocation = `${data.city}, ${data.region}`;
        console.log("✓ Location found:", fullLocation, {
          coords: { lat: data.latitude, lon: data.longitude },
          country: data.country,
          timezone: data.timezone,
        });

        await onSearch(data.city);
        setLocationStatus("idle");
      } else {
        throw new Error("No city found in response");
      }
    } catch (err) {
      console.error("✗ Find location failed:", err);
      setError("Unable to find location.");
      setLocationStatus("error");

      setTimeout(() => {
        setLocationStatus("idle");
        setError("");
      }, 4000);
    }
  };

  const handleButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isBusy) return;

    if (iconType === "clear") {
      handleClear();
    } else if (hasText) {
      submitGo();
    } else {
      submitRandom();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy || iconType === "clear") return;

    if (hasText) submitGo();
    else submitRandom();
  };

  useEffect(() => {
    return () => {
      randomTimeoutsRef.current.forEach((id) => clearTimeout(id));
      randomTimeoutsRef.current = [];
    };
  }, []);

  const isLocating = isLoading || locationStatus === "loading";

  const locationText = isLocating
    ? "Finding location..."
    : locationStatus === "error"
      ? "Unable to find location"
      : "Use my location";

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className="relative">
        {/* Input */}
        <div
          className={[
            "w-full h-12 rounded-full",
            "bg-surface dark:bg-dark-surface",
            "border border-accent-secondary/30 dark:border-dark-accent-secondary/30",
            "transition-[border,box-shadow]",
            "focus-within:border-accent-primary dark:focus-within:border-dark-accent-primary",
            isBusy || isGettingLocation ? "opacity-60" : "",
          ].join(" ")}
        >
          <motion.input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsDirty(true);
              if (error) setError("");
            }}
            placeholder="Where do you want to hear?"
            disabled={isBusy}
            variants={inputVariants}
            initial="resting"
            animate={isRandomizing ? "randomizing" : "resting"}
            style={{ willChange: "filter" }}
            className={[
              "w-full h-full rounded-full",
              "bg-transparent",
              "pl-5 pr-14", // leave space for the circle button
              "pt-[13px] pb-[11px]",
              "text-text-primary dark:text-dark-text-primary",
              "placeholder:text-text-primary/30 dark:placeholder:text-dark-text-primary/30",
              "focus:outline-none",
              "disabled:cursor-not-allowed",
            ].join(" ")}
            aria-invalid={!!error}
            aria-describedby={error ? "search-error" : undefined}
          />
        </div>

        {/* Primary action button (always visible) */}
        <motion.button
          type="button"
          onClick={handleButtonClick}
          key="search-cta"
          variants={blurInFast}
          initial="hidden"
          animate="visible"
          disabled={isBusy}
          aria-label={
            isRandomizing
              ? "Choosing random location"
              : iconType === "clear"
                ? "Clear search"
                : hasText
                  ? "Go"
                  : "Random location"
          }
          className={[
            "absolute right-1.5 top-1/2 -translate-y-1/2",
            "size-9 rounded-full",
            "bg-accent-secondary dark:bg-dark-accent-secondary",
            "hover:bg-accent-primary dark:hover:bg-dark-accent-primary",
            "text-text-primary dark:text-dark-text-primary",
            "shadow-sm",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "grid place-items-center",
          ].join(" ")}
        >
          <span className="relative inline-flex size-4 items-center justify-center">
            {/* Swap icons with synchronous blur crossfade */}
            <AnimatePresence mode="sync" initial={false}>
              {iconType === "spinner" ? (
                <motion.span
                  key="spinner"
                  variants={blurInFast}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute inset-0 grid place-items-center"
                >
                  <svg
                    className="size-4 animate-spin"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className="opacity-30"
                    />
                    <path
                      d="M22 12a10 10 0 0 1-10 10"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                    />
                  </svg>
                </motion.span>
              ) : iconType === "clear" ? (
                <motion.span
                  key="clear"
                  variants={blurInFast}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute inset-0 grid place-items-center"
                >
                  <X className="size-4" aria-hidden="true" />
                </motion.span>
              ) : iconType === "go" ? (
                <motion.span
                  key="go"
                  variants={blurInFast}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute inset-0 grid place-items-center"
                >
                  <ArrowRight className="size-4" aria-hidden="true" />
                </motion.span>
              ) : (
                <motion.span
                  key="random"
                  variants={blurInFast}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute inset-0 grid place-items-center"
                >
                  <Shuffle className="size-4" aria-hidden="true" />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </motion.button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            id="search-error"
            variants={blurInFast}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mt-2 pl-3 text-sm text-warm dark:text-dark-warm"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Find my location */}
      <div className="mt-2 pl-3">
        <button
          type="button"
          onClick={handleUseLocation}
          disabled={isLocating}
          className={[
            "relative flex items-center text-sm transition-colors",
            locationStatus === "error"
              ? "text-warm/70 dark:text-dark-warm/70"
              : "text-text-primary/50 dark:text-dark-text-primary/50 hover:text-text-primary/70 dark:hover:text-dark-text-primary/70",
            isLocating ? "cursor-wait" : "",
          ].join(" ")}
        >
          <span className="relative inline-flex items-center">
            <AnimatePresence mode="sync" initial={false}>
              <motion.span
                key={isLocating ? "loading" : locationStatus}
                className="absolute inset-0 flex items-center whitespace-nowrap"
                variants={blurInOutQuick}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ willChange: "filter, opacity" }}
              >
                {isLocating ? (
                  <svg
                    className="relative bottom-px mr-1.5 size-4 animate-spin"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className="opacity-30"
                    />
                    <path
                      d="M22 12a10 10 0 0 1-10 10"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                    />
                  </svg>
                ) : locationStatus === "error" ? (
                  <Warning
                    className="relative bottom-px mr-1.5 size-4"
                    weight="fill"
                  />
                ) : (
                  <MapPin
                    className="relative bottom-px mr-1.5 size-4"
                    weight="fill"
                  />
                )}
                {locationText}
              </motion.span>
            </AnimatePresence>
            {/* Invisible spacer to maintain width - always use longest text */}
            <span className="invisible flex items-center" aria-hidden="true">
              <svg
                className="mr-1.5 size-4"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
              </svg>
              Unable to find location
            </span>
          </span>
        </button>
      </div>
    </form>
  );
}
