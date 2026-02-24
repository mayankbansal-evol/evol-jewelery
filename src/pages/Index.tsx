import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings,
  RefreshCw,
  AlertTriangle,
  X,
  ImageIcon,
  CircleDollarSign,
  Scale,
  Gem,
  ArrowRight,
  Loader2,
  PackageSearch,
  Sparkles,
  Calculator,
  History,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import SettingsView from "@/components/SettingsView";
import CalculatorView from "@/components/CalculatorView";
import { useSettings } from "@/hooks/useSettings";
import { useSyncFromSheet } from "@/hooks/useSyncFromSheet";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { format } from "date-fns";
import type { ProductRecord, ProductWithPricing } from "@/lib/types";

const LOADED_PRODUCT_KEY = "evol_loaded_product";
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

function staleness(lastSynced: string | null): number {
  if (!lastSynced) return Infinity;
  return Date.now() - new Date(lastSynced).getTime();
}

function staleLabel(lastSynced: string | null): string {
  if (!lastSynced) return "Prices have never been synced from the sheet.";
  const hrs = Math.floor(staleness(lastSynced) / 3_600_000);
  if (hrs < 1) return "Prices may be out of date — last synced less than an hour ago.";
  if (hrs === 1) return "Prices may be out of date — last synced 1 hour ago.";
  return `Prices may be out of date — last synced ${hrs} hours ago.`;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Recent product mini-card ─────────────────────────────────────────────────

function RecentProductCard({
  product,
  onLoad,
}: {
  product: ProductWithPricing;
  onLoad: (p: ProductRecord) => void;
}) {
  const stoneChips = Array.from(
    new Map(product.stones.map((s) => [s.stoneTypeId, s.name])).values()
  );
  const dateLabel = format(new Date(product.created_at), "dd MMM");

  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.18 }}
      onClick={() => onLoad(product)}
      className="w-full text-left flex items-start gap-3 p-3 rounded-xl hover:bg-[hsl(var(--muted))]/60 active:bg-[hsl(var(--muted))]/80 transition-colors group cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden bg-[hsl(var(--muted))]">
        {product.product_image_url ? (
          <img
            src={product.product_image_url}
            alt={product.product_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-[hsl(var(--muted-foreground))]/30" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate leading-snug mb-1">
          {product.product_name}
        </p>

        {/* Badges */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
            <CircleDollarSign className="w-2.5 h-2.5" />
            {product.purity}K
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
            <Scale className="w-2.5 h-2.5" />
            {product.net_gold_weight}g
          </span>
          {stoneChips[0] && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] truncate max-w-[80px]">
              <Gem className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{stoneChips[0]}</span>
            </span>
          )}
        </div>

        {/* Price + date */}
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-sm font-bold tabular-nums text-[hsl(var(--foreground))]">
            {formatCurrency(product.total)}
          </p>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))]/50">{dateLabel}</p>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Recent products panel (shared between sidebar and bottom panel) ──────────

function RecentProductsPanel({
  settings,
  onLoad,
  compact = false,
}: {
  settings: ReturnType<typeof useSettings>["settings"];
  onLoad: (p: ProductRecord) => void;
  compact?: boolean;
}) {
  const { products, isLoading } = useProducts(settings);

  const recent = [...products]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, compact ? 5 : 8);

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] tracking-tight">
            Recent Estimates
          </h3>
          {!isLoading && products.length > 0 && (
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]/60 mt-0.5 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Live prices
            </p>
          )}
        </div>
        <Link
          to="/history"
          className="flex items-center gap-1 text-[10px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors group"
        >
          See all
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-0.5 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-[hsl(var(--muted-foreground))]">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center px-4">
            <PackageSearch className="w-6 h-6 text-[hsl(var(--muted-foreground))]/25" />
            <p className="text-xs text-[hsl(var(--muted-foreground))]/60 leading-snug">
              No saved estimates yet
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {recent.map((p) => (
              <RecentProductCard key={p.id} product={p} onLoad={onLoad} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* See more footer */}
      {products.length > (compact ? 5 : 8) && (
        <div className="pt-3 mt-2 border-t border-[hsl(var(--border))]/60">
          <Link
            to="/history"
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/60 transition-all"
          >
            View all {products.length} estimates
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const Index = () => {
  const { settings, setSettings, lastSynced, applySync } = useSettings();
  const { sync, isSyncing } = useSyncFromSheet();
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [loadedProduct, setLoadedProduct] = useState<ProductRecord | null>(null);
  const autoSyncRan = useRef(false);

  // Consume a product loaded from the /history page via localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOADED_PRODUCT_KEY);
      if (raw) {
        const product = JSON.parse(raw) as ProductRecord;
        setLoadedProduct(product);
        localStorage.removeItem(LOADED_PRODUCT_KEY);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const handleProductLoaded = () => {
    setLoadedProduct(null);
  };

  const handleLoadFromRecent = (product: ProductRecord) => {
    setLoadedProduct(product);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Auto-sync on mount if never synced or stale > 2 hrs
  useEffect(() => {
    if (autoSyncRan.current) return;
    autoSyncRan.current = true;
    if (staleness(lastSynced) > TWO_HOURS_MS) {
      sync(settings, applySync).then((result) => {
        if (!result.success) {
          toast({
            title: "Auto-sync failed",
            description: result.error ?? "Could not fetch latest prices. Open Settings to retry.",
            variant: "destructive",
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showBanner = !bannerDismissed && staleness(lastSynced) > SIX_HOURS_MS && !isSyncing;

  const handleBannerSync = async () => {
    setBannerDismissed(true);
    setSettingsOpen(true);
    const result = await sync(settings, applySync);
    if (result.success) {
      toast({ title: "Synced successfully", description: "Prices have been updated from Google Sheets." });
    } else {
      toast({
        title: "Sync failed",
        description: result.error ?? "Could not fetch latest prices.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--surface))]">
      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="sticky top-0 z-30 bg-[hsl(var(--background))]/90 backdrop-blur-sm border-b border-[hsl(var(--border))]"
      >
        <div className="max-w-[1072px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <img src="/evol-logo.webp" alt="Evol" className="h-7 w-auto" />
            <span className="text-sm font-semibold tracking-tight text-[hsl(var(--foreground))]">
              Jewelry Calculator
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {isSyncing && (
                <motion.span
                  key="spinner"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.15 }}
                  className="w-7 h-7 flex items-center justify-center text-[hsl(var(--muted-foreground))]"
                  aria-label="Syncing prices…"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                </motion.span>
              )}
            </AnimatePresence>

            {/* History link — visible on desktop header, hidden on mobile (in bottom nav) */}
            <Link
              to="/history"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground))]/40 transition-all"
            >
              <History className="w-3 h-3" />
              History
            </Link>

            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Open settings"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* ── Stale-data banner ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            key="stale-banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="bg-amber-50 border-b border-amber-200">
              <div className="max-w-[1072px] mx-auto px-4 md:px-6 py-2.5 flex items-center gap-3">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <p className="flex-1 text-xs text-amber-700 leading-snug">
                  {staleLabel(lastSynced)}
                </p>
                <button
                  onClick={handleBannerSync}
                  className="text-xs font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900 transition-colors shrink-0"
                >
                  Sync now
                </button>
                <button
                  onClick={() => setBannerDismissed(true)}
                  aria-label="Dismiss"
                  className="w-5 h-5 flex items-center justify-center text-amber-500 hover:text-amber-700 transition-colors shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      {/*
        Layout strategy:
        • lg+   : side-by-side  [Calculator (flex-1)] + [Sidebar (w-80 fixed)]
        • < lg  : stacked       [Calculator] on top, [Recent Estimates] as a
                                 panel below (always visible, not collapsed)
        Bottom nav provides Calculator / History navigation on mobile.
      */}
      <main className="max-w-[1072px] mx-auto px-4 md:px-6 py-5 md:py-8 pb-nav lg:pb-10">
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">

          {/* ── Calculator column ──────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full lg:flex-1 lg:min-w-0"
          >
            <CalculatorView
              settings={settings}
              initialProduct={loadedProduct}
              onProductLoaded={handleProductLoaded}
            />
          </motion.div>

          {/* ── Recent Estimates: sidebar on lg+, panel below on mobile/tablet ── */}
          {/* Desktop sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
            className="hidden lg:flex flex-col w-80 shrink-0 sticky top-[4.5rem] max-h-[calc(100vh-6rem)]"
          >
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-4 flex flex-col h-full max-h-[calc(100vh-6rem)]">
              <RecentProductsPanel settings={settings} onLoad={handleLoadFromRecent} />
            </div>
          </motion.aside>

          {/* Mobile/tablet recent estimates — always visible below calculator */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15, ease: "easeOut" }}
            className="w-full lg:hidden"
          >
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-4" style={{ minHeight: "200px", maxHeight: "360px", display: "flex", flexDirection: "column" }}>
              <RecentProductsPanel settings={settings} onLoad={handleLoadFromRecent} compact />
            </div>
          </motion.div>

        </div>
      </main>

      {/* ── Settings drawer ────────────────────────────────────────────────── */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl overflow-y-auto p-0"
        >
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-[hsl(var(--border))] sticky top-0 bg-[hsl(var(--background))] z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 bg-[hsl(var(--foreground))] rounded-md flex items-center justify-center shrink-0">
                  <Settings className="w-3 h-3 text-[hsl(var(--background))]" />
                </div>
                <SheetTitle className="text-base font-semibold text-[hsl(var(--foreground))]">
                  Settings
                </SheetTitle>
              </div>
              {/* Explicit close button — critical on mobile where swipe-to-close is the only other option */}
              <button
                onClick={() => setSettingsOpen(false)}
                aria-label="Close settings"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <SheetDescription className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              Adjust gold rates, making charges, tax, and stone pricing
            </SheetDescription>
          </SheetHeader>

          <div className="px-5 py-5">
            <SettingsView
              settings={settings}
              onChange={setSettings}
              lastSynced={lastSynced}
              onApplySync={applySync}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Mobile Bottom Navigation ───────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[hsl(var(--background))]/95 backdrop-blur-sm border-t border-[hsl(var(--border))] safe-area-pb">
        <div className="flex items-center justify-around h-14">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive
                  ? "text-[hsl(var(--foreground))]"
                  : "text-[hsl(var(--muted-foreground))]"
              }`
            }
          >
            <Calculator className="w-5 h-5" />
            <span className="text-[10px] font-medium">Calculator</span>
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive
                  ? "text-[hsl(var(--foreground))]"
                  : "text-[hsl(var(--muted-foreground))]"
              }`
            }
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-medium">History</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default Index;
