import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Search,
  X,
  SlidersHorizontal,
  Loader2,
  PackageSearch,
  LayoutGrid,
  LayoutList,
  ChevronDown,
  ArrowUpDown,
  Check,
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import ProductCard, { type CardView } from "@/components/ProductCard";
import { useToast } from "@/hooks/use-toast";
import type { FixedSettings, ProductRecord, ProductFilters } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const PURITIES = ["24", "22", "18", "14"];

type SortKey = "date_desc" | "date_asc" | "price_desc" | "price_asc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "date_desc", label: "Newest first" },
  { key: "date_asc", label: "Oldest first" },
  { key: "price_desc", label: "Price: high to low" },
  { key: "price_asc", label: "Price: low to high" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function activeFilterCount(filters: ProductFilters): number {
  let n = 0;
  if (filters.search.trim()) n++;
  n += filters.purities.length;
  n += filters.stoneTypeIds.length;
  if (filters.goldWeightMin || filters.goldWeightMax) n++;
  if (filters.priceMin || filters.priceMax) n++;
  return n;
}

// ─── Stone-type multi-select dropdown ─────────────────────────────────────────

function StoneTypeDropdown({
  stoneTypes,
  selected,
  onToggle,
}: {
  stoneTypes: FixedSettings["stoneTypes"];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const diamonds = stoneTypes.filter((s) => s.type === "Diamond");
  const gemstones = stoneTypes.filter((s) => s.type === "Gemstone");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all w-full",
            selected.length > 0
              ? "border-[hsl(var(--foreground))]/40 bg-[hsl(var(--foreground))]/5 text-[hsl(var(--foreground))]"
              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--foreground))]/30"
          )}
        >
          <span className="flex-1 text-left">
            {selected.length === 0
              ? "All stone types"
              : selected.length === 1
              ? stoneTypes.find((s) => s.stoneId === selected[0])?.name ?? "1 selected"
              : `${selected.length} stone types`}
          </span>
          {selected.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-[hsl(var(--foreground))] text-[hsl(var(--background))] flex items-center justify-center text-[9px] font-bold shrink-0">
              {selected.length}
            </span>
          )}
          <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="p-0 rounded-xl shadow-xl border border-[hsl(var(--border))] max-h-64 overflow-y-auto w-[var(--radix-popover-trigger-width)]"
      >
        {diamonds.length > 0 && (
          <div>
            <p className="px-3 pt-2.5 pb-1 text-[9px] font-bold tracking-widest uppercase text-[hsl(var(--muted-foreground))]/50">
              Diamonds
            </p>
            {diamonds.map((s) => (
              <button
                key={s.stoneId}
                onClick={() => onToggle(s.stoneId)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[hsl(var(--muted))] transition-colors text-left"
              >
                <span
                  className={cn(
                    "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all",
                    selected.includes(s.stoneId)
                      ? "bg-[hsl(var(--foreground))] border-[hsl(var(--foreground))]"
                      : "border-[hsl(var(--border))]"
                  )}
                >
                  {selected.includes(s.stoneId) && (
                    <Check className="w-2 h-2 text-[hsl(var(--background))]" />
                  )}
                </span>
                <span className="text-[hsl(var(--foreground))]">{s.name}</span>
              </button>
            ))}
          </div>
        )}
        {gemstones.length > 0 && (
          <div>
            <p className="px-3 pt-2.5 pb-1 text-[9px] font-bold tracking-widest uppercase text-[hsl(var(--muted-foreground))]/50">
              Gemstones
            </p>
            {gemstones.map((s) => (
              <button
                key={s.stoneId}
                onClick={() => onToggle(s.stoneId)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[hsl(var(--muted))] transition-colors text-left"
              >
                <span
                  className={cn(
                    "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all",
                    selected.includes(s.stoneId)
                      ? "bg-[hsl(var(--foreground))] border-[hsl(var(--foreground))]"
                      : "border-[hsl(var(--border))]"
                  )}
                >
                  {selected.includes(s.stoneId) && (
                    <Check className="w-2 h-2 text-[hsl(var(--background))]" />
                  )}
                </span>
                <span className="text-[hsl(var(--foreground))]">{s.name}</span>
              </button>
            ))}
          </div>
        )}
        <div className="p-2 border-t border-[hsl(var(--border))]/60">
          <button
            onClick={() => selected.forEach((id) => onToggle(id))}
            disabled={selected.length === 0}
            className="w-full text-[10px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] disabled:opacity-40 py-1 transition-colors"
          >
            Clear selection
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Sort dropdown ─────────────────────────────────────────────────────────────

function SortDropdown({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (k: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find((o) => o.key === value)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground))]/30 transition-all whitespace-nowrap"
      >
        <ArrowUpDown className="w-3 h-3" />
        {current.label}
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full right-0 z-20 mt-1.5 min-w-[160px] bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl shadow-lg overflow-hidden"
            >
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { onChange(opt.key); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-[hsl(var(--muted))] transition-colors",
                    opt.key === value ? "text-[hsl(var(--foreground))] font-medium" : "text-[hsl(var(--muted-foreground))]"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      opt.key === value ? "bg-[hsl(var(--foreground))]" : "bg-transparent"
                    )}
                  />
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

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

  const [view, setView] = useState<CardView>("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>("date_desc");

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

  const filterCount = activeFilterCount(filters);

  // Sort products
  const sorted = [...products].sort((a, b) => {
    switch (sort) {
      case "date_desc": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "date_asc":  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "price_desc": return b.total - a.total;
      case "price_asc":  return a.total - b.total;
      default: return 0;
    }
  });

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          Product History
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
          {isLoading
            ? "Loading…"
            : `${products.length} product${products.length !== 1 ? "s" : ""}${filterCount > 0 ? ` · ${sorted.length} shown` : ""}`}
        </p>
      </div>

      {/* ── Toolbar row ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Search products…"
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/50 focus:outline-none focus:border-[hsl(var(--foreground))]/40 transition-colors"
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

        {/* Filters toggle */}
        <button
          onClick={() => setFiltersOpen((p) => !p)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all shrink-0",
            filtersOpen || filterCount > 0
              ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))] border-[hsl(var(--foreground))]"
              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground))]/30"
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {filterCount > 0 && (
            <span
              className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold",
                filtersOpen || filterCount > 0
                  ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                  : "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]"
              )}
            >
              {filterCount}
            </span>
          )}
        </button>

        {/* Sort */}
        <SortDropdown value={sort} onChange={setSort} />

        {/* View toggle */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 shrink-0">
          <button
            onClick={() => setView("grid")}
            title="Grid view"
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-md transition-all",
              view === "grid"
                ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setView("list")}
            title="List view"
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-md transition-all",
              view === "list"
                ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            )}
          >
            <LayoutList className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Collapsible filter panel ──────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {filtersOpen && (
          <motion.div
            key="filters"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-4">
              {/* Filter grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">

                {/* Purity */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]/60 mb-2">
                    Purity
                  </p>
                  <div className="flex gap-2">
                    {PURITIES.map((p) => (
                      <button
                        key={p}
                        onClick={() => togglePurity(p)}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all",
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

                {/* Stone type */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]/60 mb-2">
                    Stone Type
                  </p>
                  <StoneTypeDropdown
                    stoneTypes={settings.stoneTypes}
                    selected={filters.stoneTypeIds}
                    onToggle={toggleStoneType}
                  />
                </div>

                {/* Gold weight */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]/60 mb-2">
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
                    <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0">–</span>
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
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]/60 mb-2">
                    Price (₹)
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
                    <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0">–</span>
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

              {/* Footer — clear */}
              {filterCount > 0 && (
                <div className="mt-4 pt-3 border-t border-[hsl(var(--border))]/60 flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ───────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-[hsl(var(--muted-foreground))]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading products…</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-[hsl(var(--muted-foreground))]">
          <PackageSearch className="w-10 h-10 opacity-30" />
          <p className="text-sm font-medium">Failed to load products</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-[hsl(var(--muted-foreground))]">
          <PackageSearch className="w-10 h-10 opacity-30" />
          <p className="text-sm font-medium">
            {filterCount > 0 ? "No products match your filters" : "No products saved yet"}
          </p>
          <p className="text-xs opacity-60">
            {filterCount > 0
              ? "Try adjusting or clearing the filters"
              : "Add a product name and image in the Calculator, then hit Calculate"}
          </p>
          {filterCount > 0 && (
            <button
              onClick={resetFilters}
              className="mt-2 text-xs font-medium text-[hsl(var(--foreground))] underline underline-offset-2 hover:opacity-70 transition-opacity"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {view === "grid" ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
            >
              {sorted.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleDelete}
                  onLoad={handleLoad}
                  view="grid"
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {sorted.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleDelete}
                  onLoad={handleLoad}
                  view="list"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
