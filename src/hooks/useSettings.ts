import { useState, useEffect } from "react";
import { FixedSettings, DEFAULT_SETTINGS } from "@/lib/types";

const STORAGE_KEY = "diamond-calc-settings";

export function useSettings() {
  const [settings, setSettings] = useState<FixedSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  return { settings, setSettings };
}
