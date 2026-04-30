import { useQuery } from "@tanstack/react-query";
import { fetchCatalogueProductDetails, searchCatalogueProductByCode } from "@/lib/catalogApi";

export function useCatalogueProductSearch(code: string, enabled: boolean) {
  return useQuery({
    queryKey: ["catalogue-product-search", code],
    queryFn: () => searchCatalogueProductByCode(code),
    enabled: enabled && code.trim().length > 0,
    retry: false,
  });
}

export function useCatalogueProductDetails(slug: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["catalogue-product-details", slug],
    queryFn: () => fetchCatalogueProductDetails(slug ?? ""),
    enabled: enabled && !!slug,
    retry: false,
  });
}
