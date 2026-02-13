export interface GoldRate {
  purity: string;
  label: string;
  rate: number;
}

export interface Slab {
  id: string;
  code: string;
  fromWeight: number;
  toWeight: number;
  pricePerCarat: number;
  discount: number;
}

export interface StoneType {
  id: string;
  name: string;
  stoneId: string;
  type: "Diamond" | "Gemstone";
  clarity: string;
  color: string;
  slabs: Slab[];
}

export interface FixedSettings {
  goldRates: GoldRate[];
  makingCharge: number;
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
  { purity: "silver", label: "Silver", rate: 92 },
];

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

const roundSlabs: Slab[] = [
  { id: genId(), code: "LGDRDVVSEFWD1", fromWeight: 0.0001, toWeight: 0.0089, pricePerCarat: 25000, discount: 0 },
  { id: genId(), code: "LGDRDVVSEFWD2", fromWeight: 0.0089, toWeight: 0.0129, pricePerCarat: 25000, discount: 0 },
  { id: genId(), code: "LGDRDVVSEFWD3", fromWeight: 0.0129, toWeight: 0.0169, pricePerCarat: 20000, discount: 0 },
  { id: genId(), code: "LGDRDVVSEFWD4", fromWeight: 0.0169, toWeight: 0.0339, pricePerCarat: 20000, discount: 0 },
  { id: genId(), code: "LGDRDVVSEFP08", fromWeight: 0.0339, toWeight: 0.0749, pricePerCarat: 20000, discount: 0 },
  { id: genId(), code: "LGDRDVVSEFP10", fromWeight: 0.0749, toWeight: 0.0849, pricePerCarat: 22000, discount: 0 },
  { id: genId(), code: "LGDRDVVSEFP15", fromWeight: 0.0849, toWeight: 0.1399, pricePerCarat: 22000, discount: 0 },
  { id: genId(), code: "LGDRDVVSEFP18", fromWeight: 0.1399, toWeight: 0.1799, pricePerCarat: 22000, discount: 0 },
  { id: genId(), code: "LGDRDVVSEFP20", fromWeight: 0.1799, toWeight: 0.2299, pricePerCarat: 25000, discount: 0 },
  { id: genId(), code: "LGDRDVVSEFP25", fromWeight: 0.2299, toWeight: 0.2999, pricePerCarat: 25000, discount: 0 },
  { id: genId(), code: "LGDRDVVSEFS03", fromWeight: 0.2999, toWeight: 0.3999, pricePerCarat: 25000, discount: 0 },
  { id: genId(), code: "LGDRDVVSEFS04", fromWeight: 0.3999, toWeight: 0.4999, pricePerCarat: 28000, discount: 0 },
  { id: genId(), code: "LGDRDVVSEFS05", fromWeight: 0.4999, toWeight: 0.5999, pricePerCarat: 30000, discount: 0 },
];

const ovalSlabs: Slab[] = [
  { id: genId(), code: "LGDOVVSEFP01", fromWeight: 0.0001, toWeight: 0.0749, pricePerCarat: 25000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFP10", fromWeight: 0.0749, toWeight: 0.0849, pricePerCarat: 25000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFP15", fromWeight: 0.0849, toWeight: 0.1399, pricePerCarat: 25000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFP18", fromWeight: 0.1399, toWeight: 0.1799, pricePerCarat: 25000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFP20", fromWeight: 0.1799, toWeight: 0.2299, pricePerCarat: 25000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFP25", fromWeight: 0.2299, toWeight: 0.2999, pricePerCarat: 25000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS03", fromWeight: 0.2999, toWeight: 0.3999, pricePerCarat: 25000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS04", fromWeight: 0.3999, toWeight: 0.4999, pricePerCarat: 30000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS05", fromWeight: 0.4999, toWeight: 0.5999, pricePerCarat: 30000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS06", fromWeight: 0.5999, toWeight: 0.6999, pricePerCarat: 35000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS07", fromWeight: 0.6999, toWeight: 0.7999, pricePerCarat: 35000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS08", fromWeight: 0.7999, toWeight: 0.8999, pricePerCarat: 35000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS09", fromWeight: 0.8999, toWeight: 0.9999, pricePerCarat: 40000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS10", fromWeight: 0.9999, toWeight: 1.0999, pricePerCarat: 48000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS11", fromWeight: 1.0999, toWeight: 1.1999, pricePerCarat: 50000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS12", fromWeight: 1.1999, toWeight: 1.2999, pricePerCarat: 50000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS13", fromWeight: 1.2999, toWeight: 1.3999, pricePerCarat: 50000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS14", fromWeight: 1.3999, toWeight: 1.4999, pricePerCarat: 50000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS15", fromWeight: 1.4999, toWeight: 1.5999, pricePerCarat: 55000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS16", fromWeight: 1.5999, toWeight: 1.6999, pricePerCarat: 55000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS17", fromWeight: 1.6999, toWeight: 1.7999, pricePerCarat: 55000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS18", fromWeight: 1.7999, toWeight: 1.8999, pricePerCarat: 55000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS19", fromWeight: 1.8999, toWeight: 1.9999, pricePerCarat: 55000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS20", fromWeight: 1.9999, toWeight: 2.0999, pricePerCarat: 60000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS21", fromWeight: 2.0999, toWeight: 2.4999, pricePerCarat: 60000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS25", fromWeight: 2.4999, toWeight: 2.5999, pricePerCarat: 60000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS26", fromWeight: 2.5999, toWeight: 2.6999, pricePerCarat: 60000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS30", fromWeight: 2.6999, toWeight: 3.0999, pricePerCarat: 65000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS38", fromWeight: 3.0999, toWeight: 5.0999, pricePerCarat: 65000, discount: 0 },
  { id: genId(), code: "LGDOVVSEFS60", fromWeight: 5.0999, toWeight: 6.03, pricePerCarat: 80000, discount: 0 },
];

export const DEFAULT_STONE_TYPES: StoneType[] = [
  { id: genId(), name: "Round", stoneId: "LGDRDVVSEF", type: "Diamond", clarity: "VVS/EF", color: "", slabs: roundSlabs },
  { id: genId(), name: "Oval", stoneId: "LGDOVVSEF", type: "Diamond", clarity: "VVS/EF", color: "", slabs: ovalSlabs },
  { id: genId(), name: "Cushion Diamond Shape", stoneId: "LGDCUVVSEF", type: "Diamond", clarity: "VVS/EF", color: "", slabs: [] },
  { id: genId(), name: "Marquise Diamond Shape", stoneId: "LGDMAVVSEFP", type: "Diamond", clarity: "VVS/EF", color: "", slabs: [] },
  { id: genId(), name: "Heart Diamond Shape", stoneId: "LGDRDVVSEF", type: "Diamond", clarity: "VVS/EF", color: "", slabs: [] },
  { id: genId(), name: "Princess Diamond Shape", stoneId: "LGDRDVVSEFP", type: "Diamond", clarity: "VVS/EF", color: "", slabs: [] },
  { id: genId(), name: "Pear Diamond Shape", stoneId: "LGDPEVVSEFP", type: "Diamond", clarity: "VVS/EF", color: "", slabs: [] },
  { id: genId(), name: "Emerald", stoneId: "LGDEMVVSEF", type: "Gemstone", clarity: "VVS/EF", color: "", slabs: [] },
];

export const DEFAULT_SETTINGS: FixedSettings = {
  goldRates: DEFAULT_GOLD_RATES,
  makingCharge: 1800,
  stoneTypes: DEFAULT_STONE_TYPES,
};

export const GST_RATE = 0.03;
