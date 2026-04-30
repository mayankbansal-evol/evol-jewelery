import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/productsApi";
import type {
  ProductFilters,
  ProductWithPricing,
  FixedSettings,
} from "@/lib/types";
import { computeProductPricing } from "@/lib/pricing";

const DEFAULT_FILTERS: ProductFilters = {
  search: "",
  purities: [],
  stoneTypeIds: [],
  goldWeightMin: "",
  goldWeightMax: "",
  priceMin: "",
  priceMax: "",
};

export function useProducts(settings: FixedSettings) {
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS);

  const queryKey = ["products", filters] as const;

  const { data: rawData, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchProducts(filters),
    select: (res) => res.data,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const products = useMemo<ProductWithPricing[]>(() => {
    if (!rawData) return [];
    let computed = rawData.map((p) => computeProductPricing(p, settings));

    if (filters.priceMin !== "") {
      const min = parseFloat(filters.priceMin);
      computed = computed.filter((p) => p.total >= min);
    }
    if (filters.priceMax !== "") {
      const max = parseFloat(filters.priceMax);
      computed = computed.filter((p) => p.total <= max);
    }

    return computed;
  }, [rawData, settings, filters.priceMin, filters.priceMax]);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  return {
    products,
    isLoading,
    isError,
    error: error?.message ?? null,
    filters,
    setFilters,
    resetFilters,
    refetch,
  };
}
