import { useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, SlidersHorizontal, Loader2, PackageSearch } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import { useToast } from "@/hooks/use-toast";
import type { FixedSettings, ProductRecord, ProductFilters } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const PURITIES = ["24", "22", "18", "14"];

// ─── Component ────────────────────────────────────────────────────────────────

interface HistoryViewProps {
  settings: FixedSettings;
  onLoadProduct?: (product: ProductRecord) => void;
}

export default function HistoryView({ settings, onLoadProduct }: HistoryViewProps) {
  const { toast } = useToast();
  const {
    products,
    isLoading,
    isError,
    filters,
    setFilters,
    resetFilters,
    removeProduct,
  } = useProducts(settings);

  const updateFilter = useCallback(
    <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [setFilters]
  );

  const togglePurity = (purity: string) => {
    setFilters((prev) => ({
      ...prev,
      purities: prev.purities.includes(purity)
        ? prev.purities.filter((p) => p !== purity)
        : [...prev.purities, purity],
    }));
  };

  const toggleStoneType = (stoneTypeId: string) => {
    setFilters((prev) => ({
      ...prev,
      stoneTypeIds: prev.stoneTypeIds.includes(stoneTypeId)
        ? prev.stoneTypeIds.filter((s) => s !== stoneTypeId)
        : [...prev.stoneTypeIds, stoneTypeId],
    }));
  };

  const handleDelete = async (id: string) => {
    const { error } = await removeProduct(id);
    if (error) {
      toast({ title: "Delete failed", description: error, variant: "destructive" });
    }
  };

  const handleLoad = (product: ProductRecord) => {
    onLoadProduct?.(product);
  };

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.purities.length > 0 ||
    filters.stoneTypeIds.length > 0 ||
    filters.goldWeightMin !== "" ||
    filters.goldWeightMax !== "" ||
    filters.priceMin !== "" ||
    filters.priceMax !== "";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
            Product History
          </h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            {isLoading
              ? "Loading…"
              : `${products.length} product${products.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
        <input
          type="text"
          placeholder="Search by product name…"
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/50 focus:outline-none focus:border-[hsl(var(--foreground))]/40 transition-colors"
        />
        {filters.search && (
          <button
            onClick={() => updateFilter("search", "")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filters panel */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
        </div>

        {/* Purity chips */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]/70 mb-2">
            Purity
          </p>
          <div className="flex gap-2 flex-wrap">
            {PURITIES.map((p) => (
              <button
                key={p}
                onClick={() => togglePurity(p)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                  filters.purities.includes(p)
                    ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))] border-[hsl(var(--foreground))]"
                    : "bg-transparent text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:border-[hsl(var(--foreground))]/40"
                )}
              >
                {p}K
              </button>
            ))}
          </div>
        </div>

        {/* Stone type chips */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]/70 mb-2">
            Stone Type
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {settings.stoneTypes.map((st) => (
              <button
                key={st.stoneId}
                onClick={() => toggleStoneType(st.stoneId)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] border transition-all",
                  filters.stoneTypeIds.includes(st.stoneId)
                    ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))] border-[hsl(var(--foreground))]"
                    : "bg-transparent text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:border-[hsl(var(--foreground))]/40"
                )}
              >
                {st.name}
              </button>
            ))}
          </div>
        </div>

        {/* Gold weight range */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]/70 mb-2">
            Gold Weight (g)
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={filters.goldWeightMin}
              onChange={(e) => updateFilter("goldWeightMin", e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/40 focus:outline-none focus:border-[hsl(var(--foreground))]/40 transition-colors"
            />
            <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0">to</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={filters.goldWeightMax}
              onChange={(e) => updateFilter("goldWeightMax", e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/40 focus:outline-none focus:border-[hsl(var(--foreground))]/40 transition-colors"
            />
          </div>
        </div>

        {/* Price range */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]/70 mb-2">
            Current Price (₹)
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={filters.priceMin}
              onChange={(e) => updateFilter("priceMin", e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/40 focus:outline-none focus:border-[hsl(var(--foreground))]/40 transition-colors"
            />
            <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0">to</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={filters.priceMax}
              onChange={(e) => updateFilter("priceMax", e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/40 focus:outline-none focus:border-[hsl(var(--foreground))]/40 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-[hsl(var(--muted-foreground))]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading products…</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-[hsl(var(--muted-foreground))]">
          <PackageSearch className="w-8 h-8 opacity-40" />
          <p className="text-sm">Failed to load products.</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-[hsl(var(--muted-foreground))]">
          <PackageSearch className="w-8 h-8 opacity-40" />
          <p className="text-sm font-medium">
            {hasActiveFilters ? "No products match your filters" : "No products saved yet"}
          </p>
          <p className="text-xs opacity-60">
            {hasActiveFilters
              ? "Try adjusting or clearing the filters"
              : "Add a product name and image, then click Calculate to save"}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onDelete={handleDelete}
                onLoad={handleLoad}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
