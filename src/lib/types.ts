export interface GoldRate {
  purity: string;
  label: string;
  rate: number;
}

export interface Slab {
  code: string;
  fromWeight: number;
  toWeight: number;
  pricePerCarat: number;
  discount: number;
}

export interface StoneType {
  stoneId: string;
  name: string;
  type: "Diamond" | "Gemstone";
  clarity: string;
  color: string;
  slabs: Slab[];
}

export interface FixedSettings {
  goldRate24k: number;
  goldRates: GoldRate[];
  purityPercentages: Record<string, number>;
  makingChargeFlat: number;
  makingChargePerGram: number;
  gstRate: number;
  stoneTypes: StoneType[];
}

export interface DiamondEntry {
  id: string;
  stoneTypeId: string;
  weight: number;
  quantity: number;
}

export interface JewelryInput {
  grossWeight: number;
  purity: string;
  diamonds: DiamondEntry[];
}

export const DEFAULT_GOLD_RATES: GoldRate[] = [
  { purity: "24", label: "Net Wt (24)", rate: 15000 },
  { purity: "22", label: "Net Wt (22)", rate: 13800 },
  { purity: "18", label: "Net Wt (18)", rate: 11400 },
  { purity: "14", label: "Net Wt (14)", rate: 9000 },
];

const roundSlabs: Slab[] = [
  { code: "LGDRDVVSEFWD1", fromWeight: 0.0001, toWeight: 0.0089, pricePerCarat: 25000, discount: 0 },
  { code: "LGDRDVVSEFWD2", fromWeight: 0.0089, toWeight: 0.0129, pricePerCarat: 25000, discount: 0 },
  { code: "LGDRDVVSEFWD3", fromWeight: 0.0129, toWeight: 0.0169, pricePerCarat: 20000, discount: 0 },
  { code: "LGDRDVVSEFWD4", fromWeight: 0.0169, toWeight: 0.0339, pricePerCarat: 20000, discount: 0 },
  { code: "LGDRDVVSEFP08", fromWeight: 0.0339, toWeight: 0.0749, pricePerCarat: 20000, discount: 0 },
  { code: "LGDRDVVSEFP10", fromWeight: 0.0749, toWeight: 0.0849, pricePerCarat: 22000, discount: 0 },
  { code: "LGDRDVVSEFP15", fromWeight: 0.0849, toWeight: 0.1399, pricePerCarat: 22000, discount: 0 },
  { code: "LGDRDVVSEFP18", fromWeight: 0.1399, toWeight: 0.1799, pricePerCarat: 22000, discount: 0 },
  { code: "LGDRDVVSEFP20", fromWeight: 0.1799, toWeight: 0.2299, pricePerCarat: 25000, discount: 0 },
  { code: "LGDRDVVSEFP25", fromWeight: 0.2299, toWeight: 0.2999, pricePerCarat: 25000, discount: 0 },
  { code: "LGDRDVVSEFS03", fromWeight: 0.2999, toWeight: 0.3999, pricePerCarat: 25000, discount: 0 },
  { code: "LGDRDVVSEFS04", fromWeight: 0.3999, toWeight: 0.4999, pricePerCarat: 28000, discount: 0 },
  { code: "LGDRDVVSEFS05", fromWeight: 0.4999, toWeight: 0.5999, pricePerCarat: 30000, discount: 0 },
  { code: "LGDRDVVSEFS06", fromWeight: 0.5999, toWeight: 0.6999, pricePerCarat: 32000, discount: 0 },
  { code: "LGDRDVVSEFS07", fromWeight: 0.6999, toWeight: 0.7999, pricePerCarat: 35000, discount: 0 },
  { code: "LGDRDVVSEFS08", fromWeight: 0.7999, toWeight: 0.8999, pricePerCarat: 35000, discount: 0 },
  { code: "LGDRDVVSEFS09", fromWeight: 0.8999, toWeight: 0.9999, pricePerCarat: 39000, discount: 0 },
  { code: "LGDRDVVSEFS10", fromWeight: 0.9999, toWeight: 1.0999, pricePerCarat: 44000, discount: 0 },
  { code: "LGDRDVVSEFS11", fromWeight: 1.0999, toWeight: 1.1999, pricePerCarat: 46000, discount: 0 },
  { code: "LGDRDVVSEFS12", fromWeight: 1.1999, toWeight: 1.2999, pricePerCarat: 46000, discount: 0 },
  { code: "LGDRDVVSEFS13", fromWeight: 1.2999, toWeight: 1.3999, pricePerCarat: 46000, discount: 0 },
  { code: "LGDRDVVSEFS14", fromWeight: 1.3999, toWeight: 1.4999, pricePerCarat: 48000, discount: 0 },
  { code: "LGDRDVVSEFS15", fromWeight: 1.4999, toWeight: 1.5999, pricePerCarat: 50000, discount: 0 },
  { code: "LGDRDVVSEFS16", fromWeight: 1.5999, toWeight: 1.6999, pricePerCarat: 50000, discount: 0 },
  { code: "LGDRDVVSEFS17", fromWeight: 1.6999, toWeight: 1.7999, pricePerCarat: 50000, discount: 0 },
  { code: "LGDRDVVSEFS18", fromWeight: 1.7999, toWeight: 1.8999, pricePerCarat: 50000, discount: 0 },
  { code: "LGDRDVVSEFS19", fromWeight: 1.8999, toWeight: 1.9999, pricePerCarat: 52000, discount: 0 },
  { code: "LGDRDVVSEFS20", fromWeight: 1.9999, toWeight: 2.0999, pricePerCarat: 55000, discount: 0 },
  { code: "LGDRDVVSEFS21", fromWeight: 2.0999, toWeight: 2.4999, pricePerCarat: 55000, discount: 0 },
  { code: "LGDRDVVSEFS25", fromWeight: 2.4999, toWeight: 2.5999, pricePerCarat: 55000, discount: 0 },
  { code: "LGDRDVVSEFS26", fromWeight: 2.5999, toWeight: 2.6999, pricePerCarat: 57000, discount: 0 },
  { code: "LGDRDVVSEFS30", fromWeight: 2.6999, toWeight: 3.0999, pricePerCarat: 59000, discount: 0 },
  { code: "LGDRDVVSEFS38", fromWeight: 3.0999, toWeight: 3.8999, pricePerCarat: 59000, discount: 0 },
  { code: "LGDRDVVSEFS40", fromWeight: 3.8999, toWeight: 4.0999, pricePerCarat: 59000, discount: 0 },
];

const fancySlabs: Slab[] = [
  { code: "LGDOVVSEFFD1", fromWeight: 0.0001, toWeight: 0.0749, pricePerCarat: 25000, discount: 0 },
  { code: "LGDOVVSEFP10", fromWeight: 0.0749, toWeight: 0.0849, pricePerCarat: 25000, discount: 0 },
  { code: "LGDOVVSEFP15", fromWeight: 0.0849, toWeight: 0.1399, pricePerCarat: 25000, discount: 0 },
  { code: "LGDOVVSEFP18", fromWeight: 0.1399, toWeight: 0.1799, pricePerCarat: 25000, discount: 0 },
  { code: "LGDOVVSEFP20", fromWeight: 0.1799, toWeight: 0.2299, pricePerCarat: 25000, discount: 0 },
  { code: "LGDOVVSEFP25", fromWeight: 0.2299, toWeight: 0.2999, pricePerCarat: 25000, discount: 0 },
  { code: "LGDOVVSEFS03", fromWeight: 0.2999, toWeight: 0.3999, pricePerCarat: 25000, discount: 0 },
  { code: "LGDOVVSEFS04", fromWeight: 0.3999, toWeight: 0.4999, pricePerCarat: 30000, discount: 0 },
  { code: "LGDOVVSEFS05", fromWeight: 0.4999, toWeight: 0.5999, pricePerCarat: 30000, discount: 0 },
  { code: "LGDOVVSEFS06", fromWeight: 0.5999, toWeight: 0.6999, pricePerCarat: 35000, discount: 0 },
  { code: "LGDOVVSEFS07", fromWeight: 0.6999, toWeight: 0.7999, pricePerCarat: 35000, discount: 0 },
  { code: "LGDOVVSEFS08", fromWeight: 0.7999, toWeight: 0.8999, pricePerCarat: 35000, discount: 0 },
  { code: "LGDOVVSEFS09", fromWeight: 0.8999, toWeight: 0.9999, pricePerCarat: 40000, discount: 0 },
  { code: "LGDOVVSEFS10", fromWeight: 0.9999, toWeight: 1.0999, pricePerCarat: 48000, discount: 0 },
  { code: "LGDOVVSEFS11", fromWeight: 1.0999, toWeight: 1.1999, pricePerCarat: 50000, discount: 0 },
  { code: "LGDOVVSEFS12", fromWeight: 1.1999, toWeight: 1.2999, pricePerCarat: 50000, discount: 0 },
  { code: "LGDOVVSEFS13", fromWeight: 1.2999, toWeight: 1.3999, pricePerCarat: 50000, discount: 0 },
  { code: "LGDOVVSEFS14", fromWeight: 1.3999, toWeight: 1.4999, pricePerCarat: 50000, discount: 0 },
  { code: "LGDOVVSEFS15", fromWeight: 1.4999, toWeight: 1.5999, pricePerCarat: 55000, discount: 0 },
  { code: "LGDOVVSEFS16", fromWeight: 1.5999, toWeight: 1.6999, pricePerCarat: 55000, discount: 0 },
  { code: "LGDOVVSEFS17", fromWeight: 1.6999, toWeight: 1.7999, pricePerCarat: 55000, discount: 0 },
  { code: "LGDOVVSEFS18", fromWeight: 1.7999, toWeight: 1.8999, pricePerCarat: 55000, discount: 0 },
  { code: "LGDOVVSEFS19", fromWeight: 1.8999, toWeight: 1.9999, pricePerCarat: 55000, discount: 0 },
  { code: "LGDOVVSEFS20", fromWeight: 1.9999, toWeight: 2.0999, pricePerCarat: 60000, discount: 0 },
  { code: "LGDOVVSEFS21", fromWeight: 2.0999, toWeight: 2.4999, pricePerCarat: 60000, discount: 0 },
  { code: "LGDOVVSEFS25", fromWeight: 2.4999, toWeight: 2.5999, pricePerCarat: 60000, discount: 0 },
  { code: "LGDOVVSEFS26", fromWeight: 2.5999, toWeight: 2.6999, pricePerCarat: 60000, discount: 0 },
  { code: "LGDOVVSEFS30", fromWeight: 2.6999, toWeight: 3.0999, pricePerCarat: 65000, discount: 0 },
  { code: "LGDOVVSEFS38", fromWeight: 3.0999, toWeight: 5.9999, pricePerCarat: 65000, discount: 0 },
  { code: "LGDOVVSEFS60", fromWeight: 5.9999, toWeight: 6.03, pricePerCarat: 80000, discount: 0 },
];

export const DEFAULT_STONE_TYPES: StoneType[] = [
  // --- Diamonds ---
  { stoneId: "LGDRDVVSEF", name: "Round", type: "Diamond", clarity: "VVS/EF", color: "", slabs: roundSlabs },
  { stoneId: "Oval VVS/EF", name: "Oval", type: "Diamond", clarity: "VVS/EF", color: "", slabs: fancySlabs },
  { stoneId: "LGDCUVVSEF", name: "Cushion Diamond Shape", type: "Diamond", clarity: "VVS/EF", color: "", slabs: fancySlabs },
  { stoneId: "LGDMAVVSEFP", name: "Marquise Diamond Shape", type: "Diamond", clarity: "VVS/EF", color: "", slabs: fancySlabs },
  { stoneId: "LGDHRTVVSEF", name: "Heart Diamond Shape", type: "Diamond", clarity: "VVS/EF", color: "", slabs: fancySlabs },
  { stoneId: "LGDRDVVSEFP", name: "Princess Diamond Shape", type: "Diamond", clarity: "VVS/EF", color: "", slabs: fancySlabs },
  { stoneId: "LGDPEVVSEFP", name: "Pear Diamond Shape", type: "Diamond", clarity: "VVS/EF", color: "", slabs: fancySlabs },
  { stoneId: "LGDRAVVSEFS", name: "Radiant", type: "Diamond", clarity: "VVS/EF", color: "", slabs: fancySlabs },
  { stoneId: "LGDBAVVSEF", name: "Baguette", type: "Diamond", clarity: "VVS/EF", color: "", slabs: fancySlabs },
  { stoneId: "LGDKTVVSEF", name: "Kite", type: "Diamond", clarity: "VVS/EF", color: "", slabs: fancySlabs },
  { stoneId: "LGDSHVVSEFP25", name: "Shield", type: "Diamond", clarity: "VVS/EF", color: "", slabs: fancySlabs },
  { stoneId: "LGDTLVVSEF", name: "Trillion Cut", type: "Diamond", clarity: "VVS/EF", color: "", slabs: fancySlabs },
  { stoneId: "LGDUMVVSEF", name: "UMBRELLA", type: "Diamond", clarity: "VVS/EF", color: "", slabs: fancySlabs },
  { stoneId: "LGDACVVSEF", name: "Asscher", type: "Diamond", clarity: "VVS/EF", color: "", slabs: fancySlabs },
  { stoneId: "Hexagon - VVS/EF", name: "Hexagon", type: "Diamond", clarity: "VVS/EF", color: "", slabs: fancySlabs },
  { stoneId: "Polygon - VVS/EF", name: "Polygon", type: "Diamond", clarity: "VVS/EF", color: "", slabs: fancySlabs },
  { stoneId: "LGPPEVVSEF-Pink", name: "Pink Diamond", type: "Diamond", clarity: "VVS/EF", color: "Pink", slabs: fancySlabs },
  { stoneId: "LGDOVVVSYLS30", name: "YELLOW-DIAMOND-OVAL", type: "Diamond", clarity: "VVS/EF", color: "Yellow", slabs: fancySlabs },
  { stoneId: "LGDHMVVSEF", name: "Half Moon", type: "Diamond", clarity: "VVS/EF", color: "", slabs: fancySlabs },
  { stoneId: "Fancycuts", name: "SPECIALCUTS", type: "Diamond", clarity: "VVS/EF", color: "", slabs: fancySlabs },

  // --- Gemstones ---
  { stoneId: "LGDEMVVSEF", name: "Emerald", type: "Gemstone", clarity: "VVS/EF", color: "", slabs: fancySlabs },
  { stoneId: "OTHMXC00MXMIXX", name: "COLOUR STONE", type: "Gemstone", clarity: "", color: "Mixed", slabs: fancySlabs },
  { stoneId: "CLSMXMIXMXXMIXX", name: "MIX COLOUR STONE", type: "Gemstone", clarity: "", color: "Mixed", slabs: fancySlabs },
  { stoneId: "BDSMXC01BKMIX", name: "BLACK BEADS", type: "Gemstone", clarity: "", color: "Black", slabs: fancySlabs },
  { stoneId: "EMEMXB08GRM050", name: "Emerald Stone", type: "Gemstone", clarity: "", color: "Green", slabs: fancySlabs },
  { stoneId: "ONYXMXC02GRM050", name: "SEMI-PRECIOUS-ONYX", type: "Gemstone", clarity: "", color: "", slabs: fancySlabs },
  { stoneId: "OTHMIXMIXMXMXMX", name: "SEMI-PRECIOUS", type: "Gemstone", clarity: "", color: "", slabs: fancySlabs },
];

export const DEFAULT_SETTINGS: FixedSettings = {
  goldRate24k: 15000,
  goldRates: DEFAULT_GOLD_RATES,
  purityPercentages: {
    "24": 100,
    "22": 92,
    "18": 76,
    "14": 60,
  },
  makingChargeFlat: 4000,
  makingChargePerGram: 1800,
  gstRate: 0.03,
  stoneTypes: DEFAULT_STONE_TYPES,
};

export const PURITY_MAP: Record<string, number> = {
  "24": 24,
  "22": 22,
  "18": 18,
  "14": 14,
};

// ─── Product Types (stored in DB — raw inputs only, no prices) ───────────────

/** A single stone entry stored in the products table */
export interface ProductStoneEntry {
  stoneTypeId: string;
  name: string;
  weight: number;   // carats (net total weight for all pieces)
  quantity: number; // number of pieces
}

/** Raw product record as stored in Supabase — no pricing data */
export interface ProductRecord {
  id: string;
  created_at: string;
  product_name: string;
  product_image_url: string | null;
  purity: string;           // "14" | "18" | "22" | "24"
  net_gold_weight: number;  // grams
  stones: ProductStoneEntry[];
}

/** A stone entry after dynamic pricing is applied using current settings */
export interface ProductStoneWithPricing extends ProductStoneEntry {
  pricePerCarat: number;
  cost: number;
  slabCode: string | null;
}

/** ProductRecord with all costs dynamically computed from current settings */
export interface ProductWithPricing extends ProductRecord {
  goldRate: number;
  goldCost: number;
  makingCost: number;
  stoneCostTotal: number;
  subTotal: number;
  gst: number;
  total: number;
  stoneDetails: ProductStoneWithPricing[];
}

/** Filters for the History / Products list */
export interface ProductFilters {
  search: string;
  purities: string[];      // e.g. ["18", "22"]
  stoneTypeIds: string[];  // stoneTypeId values
  goldWeightMin: string;
  goldWeightMax: string;
  priceMin: string;        // applied client-side after dynamic pricing
  priceMax: string;
}
