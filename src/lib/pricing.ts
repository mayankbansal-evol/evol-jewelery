import { CARAT_TO_GRAM } from "@/lib/constants";
import type {
  DiamondEntry,
  FixedSettings,
  ProductRecord,
  ProductStoneWithPricing,
  ProductWithPricing,
  Slab,
  StoneType,
} from "@/lib/types";

export interface PricedStoneDetail extends DiamondEntry {
  stoneType?: StoneType;
  totalCost: number;
  slabInfo: {
    code: string;
    fromWeight: number;
    toWeight: number;
    pricePerCarat: number;
  } | null;
}

export interface PricingBreakdown {
  grossWeight: number;
  goldRateValue: number;
  goldCost: number;
  makingCost: number;
  stoneDetails: PricedStoneDetail[];
  totalStoneCost: number;
  subTotal: number;
  gst: number;
  total: number;
}

function normalizePricingWeight(weight: number): number {
  return Number(weight.toFixed(3));
}

export function calculateGoldRate(
  goldRate24k: number,
  purity: string,
  purityPercentages: Record<string, number>,
): number {
  const percentage = purityPercentages[purity] ?? 100;
  return Math.round(goldRate24k * (percentage / 100));
}

export function calculateMakingCharge(
  netGoldWeight: number,
  flatRate: number,
  perGramRate: number,
): number {
  if (netGoldWeight <= 0) return 0;
  if (netGoldWeight < 2) return flatRate;
  return netGoldWeight * perGramRate;
}

export function resolveAutoSlab(
  slabs: Slab[],
  weight: number,
  quantity: number,
): Slab | null {
  if (weight <= 0 || slabs.length === 0) return null;
  const pieces = Math.max(1, quantity);
  const perPieceWeight = weight / pieces;
  return (
    slabs.find(
      (sl) => perPieceWeight >= sl.fromWeight && perPieceWeight < sl.toWeight,
    ) ?? null
  );
}

export function getStoneSlabs(
  stoneTypes: FixedSettings["stoneTypes"],
  stoneTypeId: string,
): Slab[] {
  return stoneTypes.find((s) => s.stoneId === stoneTypeId)?.slabs ?? [];
}

export function computeEstimateFromInputs(
  settings: FixedSettings,
  netGoldWeight: number,
  purity: string,
  stones: DiamondEntry[],
): PricingBreakdown {
  const normalizedNetGoldWeight = normalizePricingWeight(netGoldWeight);
  const goldRateValue = calculateGoldRate(
    settings.goldRate24k,
    purity,
    settings.purityPercentages,
  );
  const totalStoneWeightInCarats = stones.reduce((sum, d) => sum + d.weight, 0);
  const totalStoneWeightInGrams = totalStoneWeightInCarats * CARAT_TO_GRAM;
  const grossWeight = netGoldWeight + totalStoneWeightInGrams;
  const goldCost = normalizedNetGoldWeight * goldRateValue;
  const makingCost = calculateMakingCharge(
    normalizedNetGoldWeight,
    settings.makingChargeFlat,
    settings.makingChargePerGram,
  );

  const stoneDetails = stones.map((d) => {
    const stoneType = settings.stoneTypes.find((s) => s.stoneId === d.stoneTypeId);
    const slab = resolveAutoSlab(
      getStoneSlabs(settings.stoneTypes, d.stoneTypeId),
      d.weight,
      d.quantity,
    );
    const pricePerCarat = slab?.pricePerCarat ?? 0;
    return {
      ...d,
      stoneType,
      totalCost: pricePerCarat * d.weight,
      slabInfo: slab
        ? {
            code: slab.code,
            fromWeight: slab.fromWeight,
            toWeight: slab.toWeight,
            pricePerCarat: slab.pricePerCarat,
          }
        : null,
    };
  });

  const totalStoneCost = stoneDetails.reduce((sum, d) => sum + d.totalCost, 0);
  const subTotal = goldCost + makingCost + totalStoneCost;
  const gst = subTotal * settings.gstRate;
  const total = subTotal + gst;

  return {
    grossWeight,
    goldRateValue,
    goldCost,
    makingCost,
    stoneDetails,
    totalStoneCost,
    subTotal,
    gst,
    total,
  };
}

export function computeProductPricing(
  product: ProductRecord,
  settings: FixedSettings,
): ProductWithPricing {
  const normalizedNetGoldWeight = normalizePricingWeight(product.net_gold_weight);
  const goldRate = calculateGoldRate(
    settings.goldRate24k,
    product.purity,
    settings.purityPercentages,
  );
  const goldCost = normalizedNetGoldWeight * goldRate;
  const makingCost = calculateMakingCharge(
    normalizedNetGoldWeight,
    settings.makingChargeFlat,
    settings.makingChargePerGram,
  );

  const stoneDetails: ProductStoneWithPricing[] = product.stones.map((s) => {
    const stoneType = settings.stoneTypes.find((st) => st.stoneId === s.stoneTypeId);
    const slabs = stoneType?.slabs ?? [];
    const slab = resolveAutoSlab(slabs, s.weight, s.quantity);
    const pricePerCarat = slab?.pricePerCarat ?? 0;
    return {
      ...s,
      pricePerCarat,
      cost: pricePerCarat * s.weight,
      slabCode: slab?.code ?? null,
    };
  });

  const stoneCostTotal = stoneDetails.reduce((sum, s) => sum + s.cost, 0);
  const subTotal = goldCost + makingCost + stoneCostTotal;
  const gst = subTotal * settings.gstRate;
  const total = subTotal + gst;

  return {
    ...product,
    goldRate,
    goldCost,
    makingCost,
    stoneCostTotal,
    subTotal,
    gst,
    total,
    stoneDetails,
  };
}
