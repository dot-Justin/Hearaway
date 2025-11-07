"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { blurInFast } from "@/lib/animations";
import { ArrowRight, Shuffle, X } from "lucide-react";
import { MapPin } from "@phosphor-icons/react";
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

const geolocationOptions: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000, // Cache for 5 minutes
};

interface SearchBarProps {
  onSearch: (query: string) => void;
  onRandom?: (location: string) => void;
  onLocationRequest?: (lat: number, lon: number) => void;
  isLoading?: boolean;
  hasResults?: boolean;
}

export default function SearchBar({
  onSearch,
  onRandom,
  onLocationRequest,
  isLoading = false,
  hasResults = false,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "denied"
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
    if (!onLocationRequest || isGettingLocation) return;

    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    setLocationStatus("loading");
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Use BigDataCloud for reverse geocoding (free, no API key)
        try {
          const geocodeUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
          const response = await fetch(geocodeUrl);
          const data = await response.json();

          if (data.city || data.locality) {
            const cityName = data.city || data.locality;
            setLocationStatus("idle");
            onSearch(cityName);
            return;
          }
        } catch (geocodeErr) {
          console.error("Reverse geocoding failed:", geocodeErr);
        }

        // Fallback to coordinates if reverse geocoding fails
        setLocationStatus("idle");
        onLocationRequest(latitude, longitude);
      },
      async (err) => {
        console.error("Geolocation error:", err);

        // Try IP-based fallback for code 2 (POSITION_UNAVAILABLE)
        if (err.code === 2) {
          try {
            const response = await fetch("https://ipapi.co/json/");
            const data = await response.json();

            if (data.latitude && data.longitude) {
              // Use the city name from IP geolocation to search
              const cityName =
                data.city || `${data.latitude},${data.longitude}`;
              setLocationStatus("idle");
              onSearch(cityName);
              return;
            }
          } catch (fallbackErr) {
            console.error("IP geolocation fallback failed:", fallbackErr);
          }
        }

        // Provide helpful error messages
        if (err.code === 1) {
          setError(
            "Location permission denied. Please allow location access in your browser settings.",
          );
        } else if (err.code === 2) {
          setError("Location unavailable. Please try searching manually.");
        } else if (err.code === 3) {
          setError("Location request timed out. Please try again.");
        } else {
          setError("Unable to get your location. Please try again.");
        }

        setLocationStatus("denied");
        setTimeout(() => {
          setLocationStatus("idle");
          setError("");
        }, 5000);
      },
      geolocationOptions,
    );
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

  const locationText =
    locationStatus === "loading"
      ? "Getting location..."
      : locationStatus === "denied"
        ? "Permission denied, try again"
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

      {/* Use my location */}
      {onLocationRequest && (
        <div className="mt-2 pl-3">
          <button
            type="button"
            onClick={handleUseLocation}
            disabled={isGettingLocation}
            className={[
              "flex items-center text-sm transition-colors",
              locationStatus === "denied"
                ? "text-warm/70 dark:text-dark-warm/70"
                : "text-text-primary/50 dark:text-dark-text-primary/50 hover:text-text-primary/70 dark:hover:text-dark-text-primary/70",
              isGettingLocation ? "cursor-wait opacity-50" : "",
            ].join(" ")}
          >
            <MapPin className="mr-1.5 size-4" weight="fill" />
            {locationText}
          </button>
        </div>
      )}
    </form>
  );
}
