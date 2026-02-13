export interface GoldRate {
  purity: string;
  label: string;
  rate: number;
}

export interface StonePrice {
  id: string;
  code: string;
  fromWeight: number;
  toWeight: number;
  pricePerCarat: number;
}

export interface FixedSettings {
  goldRates: GoldRate[];
  makingCharge: number;
  stonePrices: StonePrice[];
}

export interface DiamondEntry {
  id: string;
  shape: string;
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

export const DEFAULT_STONE_PRICES: StonePrice[] = [
  { id: "1", code: "LGDRDVVSEFWD1", fromWeight: 0.0001, toWeight: 0.0089, pricePerCarat: 25000 },
  { id: "2", code: "LGDRDVVSEFWD2", fromWeight: 0.0089, toWeight: 0.0129, pricePerCarat: 25000 },
  { id: "3", code: "LGDRDVVSEFWD3", fromWeight: 0.0129, toWeight: 0.0169, pricePerCarat: 20000 },
  { id: "4", code: "LGDRDVVSEFWD4", fromWeight: 0.0169, toWeight: 0.0339, pricePerCarat: 20000 },
  { id: "5", code: "LGDRDVVSEFP08", fromWeight: 0.0339, toWeight: 0.0749, pricePerCarat: 20000 },
  { id: "6", code: "LGDRDVVSEFP10", fromWeight: 0.0749, toWeight: 0.0849, pricePerCarat: 22000 },
  { id: "7", code: "LGDRDVVSEFP15", fromWeight: 0.0849, toWeight: 0.1399, pricePerCarat: 22000 },
  { id: "8", code: "LGDRDVVSEFP18", fromWeight: 0.1399, toWeight: 0.1799, pricePerCarat: 22000 },
  { id: "9", code: "LGDRDVVSEFP20", fromWeight: 0.1799, toWeight: 0.2299, pricePerCarat: 25000 },
  { id: "10", code: "LGDRDVVSEFP25", fromWeight: 0.2299, toWeight: 0.2999, pricePerCarat: 25000 },
  { id: "11", code: "LGDRDVVSEFS03", fromWeight: 0.2999, toWeight: 0.3999, pricePerCarat: 25000 },
  { id: "12", code: "LGDRDVVSEFS04", fromWeight: 0.3999, toWeight: 0.4999, pricePerCarat: 28000 },
  { id: "13", code: "LGDRDVVSEFS05", fromWeight: 0.4999, toWeight: 0.5999, pricePerCarat: 30000 },
];

export const DEFAULT_SETTINGS: FixedSettings = {
  goldRates: DEFAULT_GOLD_RATES,
  makingCharge: 1800,
  stonePrices: DEFAULT_STONE_PRICES,
};

export const GST_RATE = 0.03;
