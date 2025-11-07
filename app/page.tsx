"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import SearchBar from "@/components/SearchBar";
import WeatherDisplay from "@/components/WeatherDisplay";
import BackgroundManager from "@/components/BackgroundManager";
import AudioLaunchOverlay from "@/components/AudioLaunchOverlay";
import AudioControls from "@/components/AudioControls";
import InsideModeToggle from "@/components/InsideModeToggle";
import { useAudio } from "@/components/AudioProvider";
import { useTheme } from "@/components/ThemeProvider";
import { getWeather, getWeatherByCoordinates } from "@/lib/weather";
import type { WeatherData } from "@/types/weather";
import { getTimeOfDay, getBiomeImagePath } from "@/lib/biomeUtils";
import { blurIn, blurInSubtle } from "@/lib/animations";

export default function Home() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateSoundscape, isReady, hasInteracted } = useAudio();
  const { theme } = useTheme();
  const [isBrandReady, setIsBrandReady] = useState(false);
  const refreshIntervalRef = useRef<number | null>(null);

  // Calculate background image based on biome, time of day, and location coordinates
  // Location coordinates ensure deterministic image selection - same location = same image
  const backgroundImage = weatherData
    ? getBiomeImagePath(
        weatherData.biome.type,
        getTimeOfDay(weatherData.location.localtime),
        weatherData.biome.coordinates.lat,
        weatherData.biome.coordinates.lon,
      )
    : "/assets/backgrounds/field/field-day-1.jpg"; // Default fallback

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getWeather(query);
      setWeatherData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch weather data",
      );
      setWeatherData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationRequest = async (lat: number, lon: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getWeatherByCoordinates({ lat, lon });
      setWeatherData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch weather data",
      );
      setWeatherData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Update soundscape when weather data changes and audio is ready
  useEffect(() => {
    if (weatherData && isReady) {
      updateSoundscape(weatherData);
    }
  }, [weatherData, isReady, updateSoundscape]);

  useEffect(() => {
    if (!weatherData) {
      if (refreshIntervalRef.current !== null) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    const { lat, lon } = weatherData.biome.coordinates;
    const { name, region, country } = weatherData.location;

    const refreshWeather = async () => {
      try {
        const updatedData = await getWeatherByCoordinates({
          lat,
          lon,
          name,
          region,
          country,
        });
        setWeatherData(updatedData);
      } catch (refreshError) {
        console.error("Failed to refresh weather data:", refreshError);
      }
    };

    const intervalId = window.setInterval(refreshWeather, 15 * 60 * 1000);
    refreshIntervalRef.current = intervalId;

    return () => {
      if (refreshIntervalRef.current !== null) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [weatherData]);

  useEffect(() => {
    setIsBrandReady(true);
  }, []);

  return (
    <>
      <BackgroundManager backgroundImage={backgroundImage} />
      <AudioLaunchOverlay />
      <AudioControls />
      <InsideModeToggle />

      <main className="min-h-screen flex flex-col items-center justify-start pt-32 p-8">
        <div className="w-full max-w-4xl space-y-12">
          {/* App Header */}
          <motion.div
            className="flex flex-col items-center text-center"
            variants={blurIn}
            initial="hidden"
            animate={hasInteracted ? "visible" : "hidden"}
          >
            <div className="flex flex-col items-center">
              <h1 className="flex items-center justify-center">
                {isBrandReady ? (
                  <Image
                    key={theme}
                    src={
                      theme === "dark"
                        ? "/assets/brand/combination_mark_light.svg"
                        : "/assets/brand/combination_mark_dark.svg"
                    }
                    alt="Hearaway Logo"
                    width={420}
                    height={140}
                    priority
                  />
                ) : (
                  <span
                    className="inline-block"
                    style={{ width: 420, height: 140 }}
                    aria-hidden="true"
                  />
                )}
              </h1>
              <p className="text-text-secondary dark:text-dark-text-secondary text-lg -mt-2">
                The world, in sound.
              </p>
            </div>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            className="flex justify-center"
            variants={blurIn}
            initial="hidden"
            animate={hasInteracted ? "visible" : "hidden"}
            custom={0.15}
          >
            <SearchBar
              onSearch={handleSearch}
              onLocationRequest={handleLocationRequest}
              isLoading={isLoading}
              hasResults={!!weatherData}
            />
          </motion.div>

          {/* Error State */}
          {error && (
            <div className="text-center">
              <div className="inline-block px-6 py-3 bg-warm/10 dark:bg-dark-warm/10 border border-warm/30 dark:border-dark-warm/30 rounded-lg">
                <p className="text-warm dark:text-dark-warm">{error}</p>
              </div>
            </div>
          )}

          {/* Weather Display / Placeholder */}
          <div className="flex justify-center min-h-[26rem] w-full">
            {weatherData && !isLoading ? (
              <motion.div
                className="flex justify-center w-full"
                variants={blurInSubtle}
                initial="hidden"
                animate="visible"
              >
                <WeatherDisplay data={weatherData} />
              </motion.div>
            ) : !error ? (
              <div className="w-full max-w-2xl" aria-hidden="true" />
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}
