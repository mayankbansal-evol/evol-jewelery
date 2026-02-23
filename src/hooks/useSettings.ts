import { useState, useEffect, useCallback } from "react";
import { FixedSettings, DEFAULT_SETTINGS } from "@/lib/types";

const STORAGE_KEY = "diamond-calc-settings";
const LAST_SYNCED_KEY = "diamond-calc-last-synced";

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

  const [lastSynced, setLastSynced] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LAST_SYNCED_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (lastSynced) {
      localStorage.setItem(LAST_SYNCED_KEY, lastSynced);
    }
  }, [lastSynced]);

  const applySync = useCallback((newSettings: FixedSettings, syncedAt: string) => {
    setSettings(newSettings);
    setLastSynced(syncedAt);
  }, []);

  return { settings, setSettings, lastSynced, applySync };
}
