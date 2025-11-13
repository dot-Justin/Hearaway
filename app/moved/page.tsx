"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { blurIn } from "@/lib/animations";
import Image from "next/image";
import { ArrowCircleRight } from "@phosphor-icons/react";

/**
 * Redirect page for mvp.hearaway.app → hearaway.app migration
 * Displays countdown and auto-redirects after 10 seconds
 */
export default function MovedPage() {
  const [seconds, setSeconds] = useState(10);
  const NEW_URL = "https://hearaway.app";

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          window.location.href = NEW_URL;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate progress percentage for linear bar (inverse so it fills as countdown decreases)
  const progress = Math.min(((10 - seconds) / 10) * 100, 100);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background dark:bg-dark-background">
      {/* Film grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.015] dark:opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main content */}
      <motion.div
        variants={blurIn}
        initial="hidden"
        animate="visible"
        className="relative z-20 flex min-h-screen flex-col items-center justify-center px-6 py-12"
      >
        <div className="flex max-w-md flex-col items-center gap-8 text-center">
          {/* Logo */}
          <motion.div variants={blurIn} custom={0.1}>
            <Image
              src="/assets/brand/logo_light.svg"
              alt="Hearaway"
              width={50}
              height={50}
              className="opacity-80"
            />
          </motion.div>

          {/* Heading */}
          <motion.h2
            variants={blurIn}
            custom={0.2}
            className="font-serif text-5xl font-normal text-text-primary dark:text-dark-text-primary sm:text-6xl"
          >
            We&apos;ve moved
          </motion.h2>

          {/* Body text */}
          <motion.div
            variants={blurIn}
            custom={0.3}
            className="flex flex-col gap-4"
          >
            <p className="text-lg text-text-secondary dark:text-dark-text-secondary">
              Hearaway is now at its new home:
            </p>

            {/* New URL - button with icon */}
            <button
              onClick={() => (window.location.href = NEW_URL)}
              className="group flex items-center justify-center gap-3 rounded-full bg-accent-primary pl-8 pr-4 py-4 font-serif text-3xl font-medium text-white transition-all hover:bg-accent-secondary dark:bg-dark-accent-primary dark:hover:bg-dark-accent-secondary sm:text-4xl"
            >
              <span className="relative -top-0.5">
                <span className="line-through">mvp</span>.hearaway.app
              </span>
              <ArrowCircleRight
                weight="fill"
                className="size-9 transition-transform group-hover:translate-x-1"
              />
            </button>
          </motion.div>

          {/* Countdown with linear progress bar - blurs in after 3s */}
          <motion.div
            variants={blurIn}
            initial="hidden"
            animate="visible"
            custom={3}
            className="flex flex-col items-center gap-2"
          >
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
              Redirecting in {seconds} second{seconds !== 1 ? "s" : ""}...
            </p>

            {/* Linear progress bar - width matches text above */}
            <div className="h-1 w-[160px] overflow-hidden rounded-full bg-surface dark:bg-dark-surface">
              <div
                className="h-full bg-accent-primary transition-all duration-1000 ease-linear dark:bg-dark-accent-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
