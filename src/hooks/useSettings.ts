import { useState, useEffect } from "react";
import { FixedSettings, DEFAULT_SETTINGS } from "@/lib/types";

const STORAGE_KEY = "diamond-calc-settings";

function isValidSettings(obj: any): obj is FixedSettings {
  return (
    obj &&
    typeof obj === "object" &&
    Array.isArray(obj.goldRates) &&
    typeof obj.makingCharge === "number" &&
    Array.isArray(obj.stoneTypes)
  );
}

export function useSettings() {
  const [settings, setSettings] = useState<FixedSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (isValidSettings(parsed)) return parsed;
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  return { settings, setSettings };
}
