import { useState, useEffect } from "react";
import { FixedSettings, DEFAULT_SETTINGS } from "@/lib/types";

const STORAGE_KEY = "diamond-calc-settings";

function isValidSettings(obj: any): obj is FixedSettings {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.goldRate24k === "number" &&
    Array.isArray(obj.goldRates) &&
    typeof obj.purityPercentages === "object" &&
    typeof obj.makingChargeFlat === "number" &&
    typeof obj.makingChargePerGram === "number" &&
    typeof obj.gstRate === "number" &&
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
