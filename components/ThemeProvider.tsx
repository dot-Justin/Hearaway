"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import Cookies from "js-cookie";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme: Theme;
}

const THEME_STORAGE_KEY = "hearaway-theme";

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const hasSyncedInitialTheme = useRef(false);

  // Sync local state with persisted theme on first mount
  useEffect(() => {
    if (hasSyncedInitialTheme.current) {
      return;
    }
    hasSyncedInitialTheme.current = true;

    let storedTheme: Theme | null = null;
    try {
      const value = window.localStorage.getItem(THEME_STORAGE_KEY);
      storedTheme = isTheme(value) ? value : null;
    } catch (error) {
      storedTheme = null;
    }

    const cookieValue = Cookies.get(THEME_STORAGE_KEY);
    const cookieTheme = isTheme(cookieValue) ? cookieValue : null;
    const domValue = document.documentElement.dataset.theme;
    const domTheme = isTheme(domValue) ? domValue : null;

    const nextTheme =
      storedTheme || cookieTheme || domTheme || initialTheme;

    if (!cookieTheme) {
      Cookies.set(THEME_STORAGE_KEY, nextTheme, { expires: 365 });
    }

    if (!storedTheme) {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch (error) {
        // Ignore storage failures (e.g., private browsing)
      }
    }

    setTheme(nextTheme);
  }, [initialTheme]);

  // Apply theme class and persist cookie whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    root.dataset.theme = theme;

    Cookies.set("hearaway-theme", theme, { expires: 365 });

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      // Ignore storage failures
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
