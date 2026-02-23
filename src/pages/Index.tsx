import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Settings, RefreshCw, AlertTriangle, X, Calculator, History } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import SettingsView from "@/components/SettingsView";
import CalculatorView from "@/components/CalculatorView";
import HistoryView from "@/components/HistoryView";
import { useSettings } from "@/hooks/useSettings";
import { useSyncFromSheet } from "@/hooks/useSyncFromSheet";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ProductRecord } from "@/lib/types";

const TWO_HOURS_MS  = 2  * 60 * 60 * 1000;
const SIX_HOURS_MS  = 6  * 60 * 60 * 1000;

function staleness(lastSynced: string | null): number {
  if (!lastSynced) return Infinity;
  return Date.now() - new Date(lastSynced).getTime();
}

function staleLabel(lastSynced: string | null): string {
  if (!lastSynced) return "Prices have never been synced from the sheet.";
  const hrs = Math.floor(staleness(lastSynced) / 3600_000);
  if (hrs < 1) return "Prices may be out of date — last synced less than an hour ago.";
  if (hrs === 1) return "Prices may be out of date — last synced 1 hour ago.";
  return `Prices may be out of date — last synced ${hrs} hours ago.`;
}

type Tab = "calculator" | "history";

const Index = () => {
  const { settings, setSettings, lastSynced, applySync } = useSettings();
  const { sync, isSyncing } = useSyncFromSheet();
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("calculator");
  const [loadedProduct, setLoadedProduct] = useState<ProductRecord | null>(null);
  const autoSyncRan = useRef(false);

  const handleLoadProduct = (product: ProductRecord) => {
    setLoadedProduct(product);
    setActiveTab("calculator");
  };

  const handleProductLoaded = () => {
    setLoadedProduct(null);
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
      {/* Top bar */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="sticky top-0 z-30 bg-[hsl(var(--background))]/90 backdrop-blur-sm border-b border-[hsl(var(--border))]"
      >
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <img src="/evol-logo.webp" alt="Evol" className="h-7 w-auto" />
            <span className="text-sm font-semibold tracking-tight text-[hsl(var(--foreground))]">
              Jewelry Calculator
            </span>
          </div>

          {/* Center — tab pills */}
          <div className="flex items-center gap-1 bg-[hsl(var(--muted))] rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab("calculator")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                activeTab === "calculator"
                  ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              <Calculator className="w-3 h-3" />
              Calculator
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                activeTab === "history"
                  ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              <History className="w-3 h-3" />
              History
            </button>
          </div>

          {/* Right side — sync spinner + settings trigger */}
          <div className="flex items-center gap-1.5">
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

      {/* Stale-data warning banner */}
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
            <div className="bg-amber-50 border-b border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50">
              <div className="max-w-2xl mx-auto px-5 py-2.5 flex items-center gap-3">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <p className="flex-1 text-xs text-amber-700 dark:text-amber-400 leading-snug">
                  {staleLabel(lastSynced)}
                </p>
                <button
                  onClick={handleBannerSync}
                  className="text-xs font-medium text-amber-700 dark:text-amber-400 underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200 transition-colors shrink-0"
                >
                  Sync now
                </button>
                <button
                  onClick={() => setBannerDismissed(true)}
                  aria-label="Dismiss"
                  className="w-5 h-5 flex items-center justify-center text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-5 py-10">
        <AnimatePresence mode="wait">
          {activeTab === "calculator" ? (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <CalculatorView
                settings={settings}
                initialProduct={loadedProduct}
                onProductLoaded={handleProductLoaded}
              />
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <HistoryView settings={settings} onLoadProduct={handleLoadProduct} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Settings drawer */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl overflow-y-auto p-0"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-[hsl(var(--border))] sticky top-0 bg-[hsl(var(--background))] z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-[hsl(var(--foreground))] rounded-md flex items-center justify-center">
                <Settings className="w-3 h-3 text-[hsl(var(--background))]" />
              </div>
              <SheetTitle className="text-base font-semibold text-[hsl(var(--foreground))]">
                Settings
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              Adjust gold rates, making charges, tax, and stone pricing
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 py-5">
            <SettingsView
              settings={settings}
              onChange={setSettings}
              lastSynced={lastSynced}
              onApplySync={applySync}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Index;
