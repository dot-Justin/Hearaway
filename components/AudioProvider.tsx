"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { getAudioController } from "@/lib/audioController";
import type { BiomeType } from "@/lib/biomeDetector";
import type { WeatherData } from "@/types/weather";

interface AudioContextType {
  // State
  isReady: boolean;
  isMuted: boolean;
  volume: number;
  isLoading: boolean;
  currentBiome: BiomeType | null;
  hasInteracted: boolean;
  isInsideMode: boolean;
  insideFilterFrequency: number;

  // Methods
  initialize: () => Promise<void>;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  updateSoundscape: (weatherData: WeatherData) => void;
  toggleInsideMode: () => void;
  setInsideFilterFrequency: (frequency: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.9); // Default 90% volume
  const [isLoading, setIsLoading] = useState(false);
  const [currentBiome, setCurrentBiome] = useState<BiomeType | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isInsideMode, setInsideModeState] = useState(false);
  const [insideFilterFrequency, setInsideFilterFrequencyState] = useState(600);

  const controllerRef = useRef(getAudioController());
  const initializationPromiseRef = useRef<Promise<void> | null>(null);

  // Load inside mode preference from localStorage on mount
  useEffect(() => {
    const savedInsideMode = localStorage.getItem("hearaway_inside_mode");
    const savedFrequency = localStorage.getItem("hearaway_filter_frequency");

    if (savedInsideMode !== null) {
      setInsideModeState(JSON.parse(savedInsideMode));
    }
    if (savedFrequency !== null) {
      setInsideFilterFrequencyState(JSON.parse(savedFrequency));
    }
  }, []);

  /**
   * Initialize audio system (must be called from user interaction)
   */
  const initialize = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (initializationPromiseRef.current) {
      return initializationPromiseRef.current;
    }

    if (isReady) {
      console.warn("Audio already initialized");
      return;
    }

    setIsLoading(true);
    const controller = controllerRef.current;

    const initPromise = (async () => {
      try {
        // Initialize audio context
        await controller.initialize();

        // Set initial volume
        controller.setMasterVolume(volume);

        // Set initial inside mode state
        if (isInsideMode) {
          controller.setInsideMode(true);
          controller.setInsideFilterFrequency(insideFilterFrequency);
        }

        setIsReady(true);
        setHasInteracted(true);
        console.log("Audio system ready");
      } catch (error) {
        console.error("Failed to initialize audio:", error);
        throw error;
      } finally {
        setIsLoading(false);
        initializationPromiseRef.current = null;
      }
    })();

    initializationPromiseRef.current = initPromise;
    return initPromise;
  }, [isReady, volume, isInsideMode, insideFilterFrequency]);

  /**
   * Toggle mute state
   */
  const toggleMute = useCallback(() => {
    if (!isReady) return;

    const controller = controllerRef.current;
    const newMuteState = controller.toggleMute();
    setIsMuted(newMuteState);
  }, [isReady]);

  /**
   * Set volume level (0-1)
   */
  const setVolume = useCallback(
    (newVolume: number) => {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      setVolumeState(clampedVolume);

      if (isReady) {
        const controller = controllerRef.current;
        controller.setMasterVolume(clampedVolume);
      }
    },
    [isReady]
  );

  /**
   * Update soundscape based on weather data
   */
  const updateSoundscape = useCallback(
    (weatherData: WeatherData) => {
      if (!isReady) {
        console.warn("Cannot update soundscape: audio not initialized");
        return;
      }

      const controller = controllerRef.current;
      controller.updateSoundscape(weatherData);
      setCurrentBiome(weatherData.biome.type);
    },
    [isReady]
  );

  /**
   * Toggle inside mode
   */
  const toggleInsideMode = useCallback(() => {
    if (!isReady) return;

    const newState = !isInsideMode;
    setInsideModeState(newState);
    localStorage.setItem("hearaway_inside_mode", JSON.stringify(newState));

    const controller = controllerRef.current;
    controller.setInsideMode(newState);
  }, [isReady, isInsideMode]);

  /**
   * Set inside filter frequency
   */
  const setInsideFilterFrequency = useCallback(
    (frequency: number) => {
      setInsideFilterFrequencyState(frequency);
      localStorage.setItem("hearaway_filter_frequency", JSON.stringify(frequency));

      if (isReady) {
        const controller = controllerRef.current;
        controller.setInsideFilterFrequency(frequency);
      }
    },
    [isReady]
  );

  // Cleanup on unmount
  useEffect(() => {
    const controller = controllerRef.current;

    return () => {
      if (isReady && controller) {
        controller.stopSoundscape(2); // Gentle fade out
      }
    };
  }, [isReady]);

  const value: AudioContextType = {
    isReady,
    isMuted,
    volume,
    isLoading,
    currentBiome,
    hasInteracted,
    isInsideMode,
    insideFilterFrequency,
    initialize,
    toggleMute,
    setVolume,
    updateSoundscape,
    toggleInsideMode,
    setInsideFilterFrequency,
  };

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
