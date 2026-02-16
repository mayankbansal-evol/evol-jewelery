import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Settings, Gem } from "lucide-react";
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

const Index = () => {
  const { settings, setSettings } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

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
            <div className="w-7 h-7 bg-[hsl(var(--foreground))] rounded-lg flex items-center justify-center">
              <Gem className="w-3.5 h-3.5 text-[hsl(var(--background))]" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-[hsl(var(--foreground))]">
              Jewelry Calculator
            </span>
          </div>

          {/* Settings trigger */}
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-5 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key="calculator"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05, ease: "easeOut" }}
          >
            <CalculatorView settings={settings} />
          </motion.div>
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
            <SettingsView settings={settings} onChange={setSettings} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Index;
