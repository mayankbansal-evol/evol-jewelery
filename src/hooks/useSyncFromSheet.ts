import { useState, useCallback } from "react";
import { FixedSettings, StoneType, Slab, DEFAULT_SETTINGS } from "@/lib/types";
import { SHEET_ID, getSheetTabCsvUrl } from "@/lib/config";

// ---------------------------------------------------------------------------
// Minimal CSV parser
// Handles quoted fields (including commas and newlines inside quotes).
// ---------------------------------------------------------------------------
function parseCsv(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const next = raw[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        // escaped double-quote inside a quoted field
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field.trim());
        field = "";
      } else if (ch === "\n") {
        row.push(field.trim());
        if (row.some((c) => c !== "")) rows.push(row);
        row = [];
        field = "";
      } else if (ch === "\r") {
        // skip carriage return — next char will be \n
      } else {
        field += ch;
      }
    }
  }

  // flush last field/row
  if (field !== "" || row.length > 0) {
    row.push(field.trim());
    if (row.some((c) => c !== "")) rows.push(row);
  }

  return rows;
}

/** Convert a CSV 2D array to array-of-objects using the first row as headers. */
function csvToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.toLowerCase().trim());
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? "";
    });
    return obj;
  });
}

// ---------------------------------------------------------------------------
// Parsers for each tab
// ---------------------------------------------------------------------------

function parseRatesTab(rows: Record<string, string>[]): Partial<FixedSettings> {
  const map: Record<string, string> = {};
  for (const row of rows) {
    if (row["key"] && row["value"] !== undefined) {
      map[row["key"].trim()] = row["value"].trim();
    }
  }

  const partial: Partial<FixedSettings> = {};

  if (map["goldRate24k"] !== undefined) partial.goldRate24k = Number(map["goldRate24k"]);
  if (map["makingChargeFlat"] !== undefined) partial.makingChargeFlat = Number(map["makingChargeFlat"]);
  if (map["makingChargePerGram"] !== undefined) partial.makingChargePerGram = Number(map["makingChargePerGram"]);
  if (map["gstRate"] !== undefined) partial.gstRate = Number(map["gstRate"]);

  // purity_24, purity_22, purity_18, purity_14
  const purityPercentages: Record<string, number> = { ...DEFAULT_SETTINGS.purityPercentages };
  let hasPurity = false;
  for (const key of Object.keys(map)) {
    const match = key.match(/^purity_(\d+)$/);
    if (match) {
      purityPercentages[match[1]] = Number(map[key]);
      hasPurity = true;
    }
  }
  if (hasPurity) partial.purityPercentages = purityPercentages;

  return partial;
}

function parseStonesTab(rows: Record<string, string>[]): Omit<StoneType, "slabs">[] {
  return rows
    .filter((r) => r["stoneid"]) // stoneid is lowercased header
    .map((r) => ({
      stoneId: r["stoneid"].trim(),
      name: r["name"]?.trim() ?? "",
      type: (r["type"]?.trim() === "Gemstone" ? "Gemstone" : "Diamond") as "Diamond" | "Gemstone",
      clarity: r["clarity"]?.trim() ?? "",
      color: r["color"]?.trim() ?? "",
    }));
}

function parseSlabsTab(rows: Record<string, string>[]): Record<string, Slab[]> {
  const slabsByStone: Record<string, Slab[]> = {};
  for (const r of rows) {
    const stoneId = r["stoneid"]?.trim();
    if (!stoneId) continue;
    const slab: Slab = {
      code: r["code"]?.trim() ?? "",
      fromWeight: Number(r["fromweight"] ?? 0),
      toWeight: Number(r["toweight"] ?? 0),
      pricePerCarat: Number(r["pricepercarat"] ?? 0),
      discount: Number(r["discount"] ?? 0),
    };
    if (!slabsByStone[stoneId]) slabsByStone[stoneId] = [];
    slabsByStone[stoneId].push(slab);
  }
  return slabsByStone;
}

// ---------------------------------------------------------------------------
// Assemble the full FixedSettings from the three parsed sources
// ---------------------------------------------------------------------------
function assembleSettings(
  currentSettings: FixedSettings,
  ratesPart: Partial<FixedSettings>,
  stoneRows: Omit<StoneType, "slabs">[],
  slabsByStone: Record<string, Slab[]>
): FixedSettings {
  const stoneTypes: StoneType[] = stoneRows.map((s) => ({
    ...s,
    slabs: slabsByStone[s.stoneId] ?? [],
  }));

  return {
    ...currentSettings,
    ...ratesPart,
    // Recalculate goldRates array from the (possibly updated) purityPercentages and goldRate24k
    goldRates: currentSettings.goldRates.map((gr) => {
      const purityPercentages = ratesPart.purityPercentages ?? currentSettings.purityPercentages;
      const goldRate24k = ratesPart.goldRate24k ?? currentSettings.goldRate24k;
      const pct = purityPercentages[gr.purity] ?? 100;
      return { ...gr, rate: Math.round(goldRate24k * (pct / 100)) };
    }),
    stoneTypes: stoneTypes.length > 0 ? stoneTypes : currentSettings.stoneTypes,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface SyncResult {
  success: boolean;
  error?: string;
}

export function useSyncFromSheet() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const sync = useCallback(
    async (
      currentSettings: FixedSettings,
      onSuccess: (newSettings: FixedSettings, syncedAt: string) => void
    ): Promise<SyncResult> => {
      setIsSyncing(true);
      setSyncError(null);

      try {
        const sheetId = SHEET_ID;
        if (!sheetId || sheetId === "YOUR_SHEET_ID_HERE") {
          throw new Error(
            "Google Sheet ID is not configured. Add VITE_GOOGLE_SHEET_ID to your .env file or update FALLBACK_SHEET_ID in src/lib/config.ts."
          );
        }

        // Fetch all three tabs in parallel
        const [ratesRes, stonesRes, slabsRes] = await Promise.all([
          fetch(getSheetTabCsvUrl(sheetId, "rates")),
          fetch(getSheetTabCsvUrl(sheetId, "stones")),
          fetch(getSheetTabCsvUrl(sheetId, "slabs")),
        ]);

        if (!ratesRes.ok) throw new Error(`Failed to fetch "rates" tab (HTTP ${ratesRes.status})`);
        if (!stonesRes.ok) throw new Error(`Failed to fetch "stones" tab (HTTP ${stonesRes.status})`);
        if (!slabsRes.ok) throw new Error(`Failed to fetch "slabs" tab (HTTP ${slabsRes.status})`);

        const [ratesText, stonesText, slabsText] = await Promise.all([
          ratesRes.text(),
          stonesRes.text(),
          slabsRes.text(),
        ]);

        // Parse
        const ratesPart = parseRatesTab(csvToObjects(parseCsv(ratesText)));
        const stoneRows = parseStonesTab(csvToObjects(parseCsv(stonesText)));
        const slabsByStone = parseSlabsTab(csvToObjects(parseCsv(slabsText)));

        const newSettings = assembleSettings(currentSettings, ratesPart, stoneRows, slabsByStone);
        const syncedAt = new Date().toISOString();

        onSuccess(newSettings, syncedAt);
        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error during sync";
        setSyncError(msg);
        return { success: false, error: msg };
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  return { sync, isSyncing, syncError };
}
