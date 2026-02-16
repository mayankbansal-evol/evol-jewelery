import { useState, useEffect, useCallback } from "react";
import { DiamondEntry } from "@/lib/types";

const STORAGE_KEY = "diamond-calc-form";

export interface CalculatorFormState {
  netGoldWeight: number;
  purity: string;
  stones: DiamondEntry[];
  productName: string;
  productNote: string;
}

interface StoredFormData {
  netGoldWeight: number;
  purity: string;
  stones: DiamondEntry[];
  productName: string;
  productNote: string;
}

function isValidStoredData(obj: any): obj is StoredFormData {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.netGoldWeight === "number" &&
    typeof obj.purity === "string" &&
    Array.isArray(obj.stones) &&
    typeof obj.productName === "string" &&
    typeof obj.productNote === "string"
  );
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function getDefaultStones(): DiamondEntry[] {
  return [
    {
      id: generateId(),
      stoneTypeId: "",
      slabId: "",
      weight: 0,
      quantity: 1,
    },
  ];
}

export function useCalculatorState(defaults: {
  stoneTypes: { stoneId: string; slabs: { code: string }[] }[];
}) {
  const getInitialStone = useCallback((): DiamondEntry => {
    const firstStoneType = defaults.stoneTypes[0];
    const firstSlab = firstStoneType?.slabs[0];
    return {
      id: generateId(),
      stoneTypeId: firstStoneType?.stoneId ?? "",
      slabId: firstSlab?.code ?? "",
      weight: 0,
      quantity: 1,
    };
  }, [defaults.stoneTypes]);

  const [formState, setFormState] = useState<CalculatorFormState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (isValidStoredData(parsed)) {
          if (parsed.stones.length === 0) {
            parsed.stones = [getInitialStone()];
          }
          return parsed;
        }
      }
    } catch {}
    return {
      netGoldWeight: 0,
      purity: "22",
      stones: [getInitialStone()],
      productName: "",
      productNote: "",
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formState));
  }, [formState]);

  const updateNetGoldWeight = useCallback((value: number) => {
    setFormState((prev) => ({ ...prev, netGoldWeight: value }));
  }, []);

  const updatePurity = useCallback((value: string) => {
    setFormState((prev) => ({ ...prev, purity: value }));
  }, []);

  const updateStones = useCallback((value: DiamondEntry[] | ((prev: DiamondEntry[]) => DiamondEntry[])) => {
    setFormState((prev) => ({
      ...prev,
      stones: typeof value === "function" ? value(prev.stones) : value,
    }));
  }, []);

  const updateProductName = useCallback((value: string) => {
    setFormState((prev) => ({ ...prev, productName: value }));
  }, []);

  const updateProductNote = useCallback((value: string) => {
    setFormState((prev) => ({ ...prev, productNote: value }));
  }, []);

  return {
    formState,
    updateNetGoldWeight,
    updatePurity,
    updateStones,
    updateProductName,
    updateProductNote,
  };
}
