"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  forceDark: boolean;
  setForceDark: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
  forceDark: false,
  setForceDark: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [forceDark, setForceDark] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("plan-first-theme") as Theme | null;
      if (saved === "light" || saved === "dark") {
        setThemeState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const effectiveTheme: Theme = forceDark ? "dark" : theme;

  useEffect(() => {
    const root = document.documentElement;
    if (effectiveTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [effectiveTheme]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem("plan-first-theme", next);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: effectiveTheme,
        setTheme,
        toggleTheme,
        forceDark,
        setForceDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
