import type {
  CatalogueLookupProduct,
  CatalogueLookupStoneLine,
  CatalogueProductDetailResponse,
  DiamondEntry,
  FixedSettings,
} from "@/lib/types";
import { getStoneSlabs, resolveAutoSlab, type PricingBreakdown, computeEstimateFromInputs } from "@/lib/pricing";

export interface CatalogueMappingIssue {
  code: string;
  reason: string;
}

export interface CatalogueEstimateResult {
  product: CatalogueLookupProduct;
  stones: DiamondEntry[];
  pricing: PricingBreakdown;
  issues: CatalogueMappingIssue[];
}

function parseCurrencyValue(value: string | number | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function findStoneTypeBySlabCode(settings: FixedSettings, slabCode: string) {
  for (const stoneType of settings.stoneTypes) {
    const slab = stoneType.slabs.find((candidate) => candidate.code === slabCode);
    if (slab) return { stoneType, slab };
  }
  return null;
}

export function normalizeCatalogueProduct(
  details: CatalogueProductDetailResponse,
  settings: FixedSettings,
): CatalogueEstimateResult {
  const issues: CatalogueMappingIssue[] = [];

  const normalizedStones: CatalogueLookupStoneLine[] = details.stone_diamond.map((stone) => {
    const slabCode = stone.bom_varient_name.trim();
    const matched = findStoneTypeBySlabCode(settings, slabCode);

    if (!matched) {
      issues.push({ code: slabCode, reason: "No local slab matched this code" });
      return {
        id: stone.slug,
        code: slabCode,
        quantity: stone.stone_pieces,
        weight: stone.stone_weight,
        sourceRate: stone.stone_rate,
        sourceAmount: stone.stone_amount,
        stoneTypeId: "",
        stoneName: "Unknown",
        slabCode,
      };
    }

    const resolved = resolveAutoSlab(
      getStoneSlabs(settings.stoneTypes, matched.stoneType.stoneId),
      stone.stone_weight,
      stone.stone_pieces,
    );

    if (!resolved || resolved.code !== slabCode) {
      issues.push({
        code: slabCode,
        reason: "Per-piece weight did not resolve back to the expected local slab",
      });
    }

    return {
      id: stone.slug,
      code: slabCode,
      quantity: stone.stone_pieces,
      weight: stone.stone_weight,
      sourceRate: stone.stone_rate,
      sourceAmount: stone.stone_amount,
      stoneTypeId: matched.stoneType.stoneId,
      stoneName: matched.stoneType.name,
      slabCode,
    };
  });

  const stones: DiamondEntry[] = normalizedStones
    .filter((stone) => stone.stoneTypeId !== "")
    .map((stone) => ({
      id: stone.id,
      stoneTypeId: stone.stoneTypeId,
      weight: stone.weight,
      quantity: stone.quantity,
    }));

  const product: CatalogueLookupProduct = {
    lookupKey: `${details.slug}:${details.attribute.stock_code}`,
    slug: details.slug,
    productCode: details.product_code,
    productName: details.title || details.description || details.product_code,
    description: details.description,
    imageUrl: details.cdn_images[0] ?? null,
    purity: details.metal_data.purity_data.purity,
    netGoldWeight: details.metal_data.net_weight,
    grossWeight: details.metal_data.gross_weight,
    location: details.location,
    categoryLabel: details.category?.description ?? details.category?.title ?? "Catalogue",
    sourcePrice: parseCurrencyValue(details.price),
    sourceCurrency: details.currency || details.attribute.currency_type || "INR",
    sourceMetalCost: details.metal_data.metal_cost,
    sourceMakingAmount: details.attribute.making_amount,
    sourceStoneAmount: normalizedStones.reduce((sum, stone) => sum + stone.sourceAmount, 0),
    stones: normalizedStones,
  };

  return {
    product,
    stones,
    pricing: computeEstimateFromInputs(
      settings,
      details.metal_data.net_weight,
      details.metal_data.purity_data.purity,
      stones,
    ),
    issues,
  };
}
